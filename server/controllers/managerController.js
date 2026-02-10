import Capacity from '../models/Capacity.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import DefenseSlot from '../models/DefenseSlot.js';
import { 
  assignBalancedTeachers, 
  findAvailableSlotForExaminer, 
  scheduleProjectIfPossible 
} from '../utils/projectHelpers.js';

export const setCapacity = async (req, res) => {
  try {
    const { term, capacity, major, advisorLimits, examinerLimits } = req.body;
    const managerId = req.user.id;

    if (!term || capacity === undefined || capacity === null) {
      return res.status(400).json({ error: 'ترم و ظرفیت الزامی است' });
    }

    if (!Array.isArray(advisorLimits) || advisorLimits.length === 0) {
      return res.status(400).json({ error: 'ظرفیت هر استاد را وارد کنید' });
    }

    const normalizedLimits = advisorLimits.map(l => ({
      advisorId: l.advisorId,
      limit: Number(l.limit || 0)
    }));

    const total = normalizedLimits.reduce((sum, l) => sum + l.limit, 0);
    if (total !== Number(capacity)) {
      return res.status(400).json({ error: 'مجموع ظرفیت اساتید باید برابر ظرفیت کل باشد' });
    }

    const teachers = await User.find({ role: 'teacher', major }).select('_id').lean();
    const teacherSet = new Set(teachers.map(a => String(a._id)));
    const invalidAdvisor = normalizedLimits.find(l => !teacherSet.has(String(l.advisorId)));
    if (invalidAdvisor) {
      return res.status(400).json({ error: 'استاد نامعتبر در لیست ظرفیت‌ها وجود دارد' });
    }

    // نرمال‌سازی examinerLimits
    const normalizedExaminerLimits = Array.isArray(examinerLimits)
      ? examinerLimits.map(l => ({
          examinerId: l.examinerId,
          limit: Number(l.limit || 0)
        }))
      : [];

    let cap = await Capacity.findOne({ managerId, term, major });
    if (!cap) {
      cap = new Capacity({ managerId, term, major, capacity });
    } else {
      cap.capacity = capacity;
    }

    const assignedByAdvisor = (cap.advisorLimits || []).reduce((acc, item) => {
      acc[String(item.advisorId)] = item.assigned || 0;
      return acc;
    }, {});

    const nextAdvisorLimits = normalizedLimits.map(l => ({
      advisorId: l.advisorId,
      limit: l.limit,
      assigned: assignedByAdvisor[String(l.advisorId)] || 0
    }));

    const overAssigned = nextAdvisorLimits.find(l => l.assigned > l.limit);
    if (overAssigned) {
      return res.status(400).json({ error: 'ظرفیت برخی اساتید کمتر از تعداد اخذ شده است' });
    }

    cap.advisorLimits = nextAdvisorLimits;

    // تنظیم examinerLimits
    const assignedByExaminer = (cap.examinerLimits || []).reduce((acc, item) => {
      acc[String(item.examinerId)] = item.assigned || 0;
      return acc;
    }, {});

    const nextExaminerLimits = normalizedExaminerLimits.map(l => ({
      examinerId: l.examinerId,
      limit: l.limit,
      assigned: assignedByExaminer[String(l.examinerId)] || 0
    }));

    cap.examinerLimits = nextExaminerLimits;
    
    await cap.save();
    res.json(cap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listMajorTeachers = async (req, res) => {
  try {
    let major = req.user.major;
    if (!major) {
      const manager = await User.findById(req.user.id).lean();
      if (!manager) return res.status(404).json({ error: 'Manager not found' });
      major = manager.major;
    }

    const teachers = await User.find({ role: 'teacher', major })
      .select('firstName lastName')
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getManagerProjects = async (req, res) => {
  try {
    const managerId = req.user.id;
    const projects = await Project.find({
      managerId,
      status: { $in: ['active', 'topic_approved', 'scheduled', 'defended', 'graded'] }
    })
      .populate('studentId advisorId examinerId');
    for (const project of projects) {
      if (project.status === 'topic_approved' && !project.defenseDate) {
        await scheduleProjectIfPossible({ project });
      }
    }
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get capacities for manager (optionally filtered by term)
export const getCapacity = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id).lean();
    if (!manager) return res.status(404).json({ error: 'Manager not found' });
    const { term } = req.query;
    const filter = { managerId: req.user.id, major: manager.major };
    if (term) filter.term = term;
    const caps = await Capacity.find(filter).sort({ createdAt: -1 });
    res.json(caps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List pending enrollments for manager's major (optionally by term)
export const listPendingEnrollments = async (req, res) => {
  try {
    const term = req.query.term;
    const manager = await User.findById(req.user.id).lean();
    if (!manager) return res.status(404).json({ error: 'Manager not found' });

    const students = await User.find({ role: 'student', major: manager.major }).select('_id').lean();
    const studentIds = students.map(s => s._id);

    const query = { status: 'pending', studentId: { $in: studentIds } };
    if (term) query.term = term;

    const projects = await Project.find(query).populate('studentId');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve a student's enrollment: assign advisor/examiner and activate project
export const approveEnrollment = async (req, res) => {
  try {
    const { projectId } = req.body;
    const manager = await User.findById(req.user.id).lean();
    if (!manager) return res.status(404).json({ error: 'Manager not found' });

    const project = await Project.findById(projectId).populate('studentId');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status !== 'pending') return res.status(400).json({ error: 'Project is not pending' });

    if (!project.studentId || project.studentId.major !== manager.major) {
      return res.status(403).json({ error: 'Student major does not match manager major' });
    }

    const { advisorId, examinerId } = await assignBalancedTeachers({ major: manager.major, term: project.term });

    project.managerId = req.user.id;
    project.advisorId = advisorId;
    project.examinerId = examinerId;
    project.status = 'active';
    await project.save();

    // نه‌ خودکار زمان دفاع را برنامه‌ریزی نکن
    // دانشجو ابتدا باید موضوعات خود را ارسال کند
    // سپس مدیر موضوعات را تایید می‌کند
    // سپس زمان دفاع برنامه‌ریزی می‌شود

    const populated = await Project.findById(project._id).populate('studentId advisorId examinerId');
    res.json({ project: populated, defenseScheduled: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const scheduleDefense = async (req, res) => {
  try {
    const { projectId, defenseDate } = req.body;
    const managerId = req.user.id;

    const project = await Project.findById(projectId).populate('studentId');
    if (!project || project.managerId.toString() !== managerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get advisors and examiners for the student's major
    const advisors = await User.find({ role: 'advisor', major: project.studentId.major });
    const examiners = await User.find({ role: 'examiner', major: project.studentId.major });

    if (advisors.length === 0 || examiners.length === 0) {
      return res.status(400).json({ error: 'Not enough teachers available' });
    }

    // Assign team
    const { advisorId, examinerId } = await assignTeam(advisors, examiners);

    // Find next available 30-min slot for examiner
    const slotTime = await findNextAvailableSlot(examinerId, defenseDate);

    // Create defense slot
    const defenseSlot = new DefenseSlot({
      projectId,
      examinerId,
      advisorId,
      startTime: slotTime.startTime,
      endTime: slotTime.endTime,
    });
    await defenseSlot.save();

    // Update project
    project.advisorId = advisorId;
    project.examinerId = examinerId;
    project.defenseDate = slotTime.startTime;
    project.status = 'defense_scheduled';
    await project.save();

    res.json({ project, defenseSlot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rescheduleDefense = async (req, res) => {
  try {
    const { projectId, newDefenseDate } = req.body;
    const managerId = req.user.id;

    const project = await Project.findById(projectId).populate('examinerId');
    if (!project || project.managerId.toString() !== managerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Find and update defense slot
    const defenseSlot = await DefenseSlot.findOne({ projectId });
    if (!defenseSlot) {
      return res.status(404).json({ error: 'Defense slot not found' });
    }

    // Delete old slot
    await DefenseSlot.deleteOne({ _id: defenseSlot._id });

    // Find new slot
    const slotTime = await findNextAvailableSlot(project.examinerId._id, newDefenseDate);

    // Create new defense slot
    const newSlot = new DefenseSlot({
      projectId,
      examinerId: project.examinerId._id,
      advisorId: project.advisorId,
      startTime: slotTime.startTime,
      endTime: slotTime.endTime,
    });
    await newSlot.save();

    // Update project
    project.defenseDate = slotTime.startTime;
    await project.save();

    res.json({ project, defenseSlot: newSlot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const submitGrade = async (req, res) => {
  try {
    const { projectId, grade } = req.body;
    const project = await Project.findByIdAndUpdate(
      projectId,
      { grade, status: 'graded' },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const scheduleUnscheduledProjects = async (req, res) => {
  try {
    const managerId = req.user.id;

    // پروژه‌های این مدیر که بدون تاریخ دفاع و دارای داور هستند
    const projects = await Project.find({
      managerId,
      defenseDate: null,
      examinerId: { $ne: null },
      status: { $in: ['topic_approved'] }
    }).populate('examinerId studentId');

    if (!projects.length) {
      return res.json({ message: 'تمامی پروژه‌ها زمان‌بندی شده‌اند', scheduled: 0 });
    }

    let scheduled = 0;
    let noSlots = [];
    const scheduled_list = [];

    for (const project of projects) {
      const term = project.term;
      let chosen = null;
      let usedExaminerId = project.examinerId._id;

      // ابتدا اسلات‌های داور تعیین‌شده را جستجو کن
      let slots = await DefenseSlot.find({ examinerId: project.examinerId._id, term });

      // جستجو برای اسلات خالی در داور تعیین‌شده
      for (const s of slots) {
        for (const pd of s.proposedDates || []) {
          for (const t of (pd.timeSlots || [])) {
            const taken = (s.approvedSlots || []).some(as => {
              if (!as.date || !pd.date) return false;
              const sameDay = new Date(as.date).toISOString().slice(0, 10) === new Date(pd.date).toISOString().slice(0, 10);
              return sameDay && as.time === t;
            });
            if (!taken) {
              chosen = { slotId: s._id, date: pd.date, time: t };
              break;
            }
          }
          if (chosen) break;
        }
        if (chosen) break;
      }

      // اگر داور تعیین‌شده اسلات ندارد، از هر داوری با اسلات خالی استفاده کن
      if (!chosen) {
        const allSlots = await DefenseSlot.find({ term }).populate('examinerId');
        for (const s of allSlots) {
          for (const pd of s.proposedDates || []) {
            for (const t of (pd.timeSlots || [])) {
              const taken = (s.approvedSlots || []).some(as => {
                if (!as.date || !pd.date) return false;
                const sameDay = new Date(as.date).toISOString().slice(0, 10) === new Date(pd.date).toISOString().slice(0, 10);
                return sameDay && as.time === t;
              });
              if (!taken) {
                chosen = { slotId: s._id, date: pd.date, time: t };
                usedExaminerId = s.examinerId;
                break;
              }
            }
            if (chosen) break;
          }
          if (chosen) break;
        }
      }

      if (chosen) {
        project.defenseDate = chosen.date;
        project.defenseTime = chosen.time;
        project.examinerId = usedExaminerId;
        project.status = 'scheduled';
        await project.save();

        await DefenseSlot.findByIdAndUpdate(chosen.slotId, {
          $push: {
            approvedSlots: {
              date: chosen.date,
              time: chosen.time,
              studentId: project.studentId
            }
          }
        });

        scheduled++;
        scheduled_list.push({
          student: `${project.studentId.firstName} ${project.studentId.lastName}`,
          date: new Date(chosen.date).toLocaleDateString('fa-IR'),
          time: chosen.time,
          examiner: usedExaminerId.firstName
        });
      } else {
        noSlots.push(project.studentId.firstName + ' ' + project.studentId.lastName);
      }
    }

    const message = scheduled > 0 
      ? `${scheduled} دانشجو زمان‌بندی شد${noSlots.length > 0 ? ` (${noSlots.length} پروژه اسلات ندارد)` : '.'}`
      : `اسلات دفاعی برای هیچ پروژه‌ای در دسترس نیست`;

    res.json({
      message,
      scheduled,
      total: projects.length,
      noSlots,
      scheduled_list
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
