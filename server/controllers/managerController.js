import Capacity from '../models/Capacity.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import DefenseSlot from '../models/DefenseSlot.js';

// Helper: Find next available 30-min slot for an examiner (kept for future use)
const findNextAvailableSlot = async (examinerId, startDate) => {
  const slots = [
    { hours: 8, minutes: 0 },
    { hours: 8, minutes: 30 },
    { hours: 9, minutes: 0 },
    { hours: 9, minutes: 30 },
    { hours: 10, minutes: 0 },
    { hours: 10, minutes: 30 },
    { hours: 11, minutes: 0 },
    { hours: 11, minutes: 30 },
    { hours: 13, minutes: 0 },
    { hours: 13, minutes: 30 },
    { hours: 14, minutes: 0 },
    { hours: 14, minutes: 30 },
    { hours: 15, minutes: 0 },
    { hours: 15, minutes: 30 },
    { hours: 16, minutes: 0 },
    { hours: 16, minutes: 30 },
  ];

  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);

    if (checkDate.getDay() === 4 || checkDate.getDay() === 5) continue; // Skip Thu/Fri

    for (const slot of slots) {
      const slotStart = new Date(checkDate);
      slotStart.setHours(slot.hours, slot.minutes, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      const conflict = await DefenseSlot.findOne({
        examinerId,
        startTime: { $lt: slotEnd },
        endTime: { $gt: slotStart },
      });

      if (!conflict) {
        return { startTime: slotStart, endTime: slotEnd };
      }
    }
  }

  throw new Error('No available slots found for examiner');
};

// Helper: Assign advisor & examiner among teachers of the same major (load-balanced)
const assignBalancedTeachers = async ({ major, term }) => {
  const teachers = await User.find({ role: 'teacher', major }).lean();
  if (!teachers.length || teachers.length < 2) {
    throw new Error('Not enough teachers available for assignment');
  }

  const teacherIds = teachers.map(t => String(t._id));
  const counts = teacherIds.reduce((acc, id) => {
    acc[id] = { advisor: 0, examiner: 0 };
    return acc;
  }, {});

  // Count current term assignments to balance load
  const existing = await Project.find({ term, advisorId: { $ne: null } }).select('advisorId examinerId').lean();
  for (const p of existing) {
    if (p.advisorId && counts[String(p.advisorId)]) counts[String(p.advisorId)].advisor += 1;
    if (p.examinerId && counts[String(p.examinerId)]) counts[String(p.examinerId)].examiner += 1;
  }

  // Choose advisor: min advisor count, tie-break by min examiner then by id
  const sortedByAdvisor = teacherIds.slice().sort((a, b) => {
    if (counts[a].advisor !== counts[b].advisor) return counts[a].advisor - counts[b].advisor;
    if (counts[a].examiner !== counts[b].examiner) return counts[a].examiner - counts[b].examiner;
    return a.localeCompare(b);
  });

  const advisorId = sortedByAdvisor[0];

  // Choose examiner: min examiner count among others
  const sortedByExaminer = teacherIds.filter(id => id !== advisorId).sort((a, b) => {
    if (counts[a].examiner !== counts[b].examiner) return counts[a].examiner - counts[b].examiner;
    if (counts[a].advisor !== counts[b].advisor) return counts[a].advisor - counts[b].advisor;
    return a.localeCompare(b);
  });

  const examinerId = sortedByExaminer[0];

  return { advisorId, examinerId };
};

// Helper: find first free slot for given examiner and term
const findAvailableSlotForExaminer = async ({ examinerId, term }) => {
  const slots = await DefenseSlot.find({ examinerId, term });
  for (const s of slots) {
    for (const pd of s.proposedDates || []) {
      for (const t of (pd.timeSlots || [])) {
        const taken = (s.approvedSlots || []).some(as => {
          if (!as.date || !pd.date) return false;
          const sameDay = new Date(as.date).toISOString().slice(0, 10) === new Date(pd.date).toISOString().slice(0, 10);
          return sameDay && as.time === t;
        });
        if (!taken) {
          return { slotId: s._id, date: pd.date, time: t };
        }
      }
    }
  }
  return null;
};

export const setCapacity = async (req, res) => {
  try {
    const { term, capacity, major } = req.body;
    const managerId = req.user.id;

    let cap = await Capacity.findOne({ managerId, term, major });
    if (!cap) {
      cap = new Capacity({ managerId, term, major, capacity });
    } else {
      cap.capacity = capacity;
    }
    
    await cap.save();
    res.json(cap);
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
      status: { $in: ['active', 'topic_approved'] }
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
