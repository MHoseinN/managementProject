import Project from '../models/Project.js';
import User from '../models/User.js';
import Capacity from '../models/Capacity.js';
import DefenseSlot from '../models/DefenseSlot.js';

const assignBalancedExaminer = async ({ major, term, advisorId }) => {
  const teachers = await User.find({ role: 'teacher', major }).lean();
  const candidates = teachers.filter(t => String(t._id) !== String(advisorId));
  if (!candidates.length) return null;

  const candidateIds = candidates.map(t => String(t._id));
  const counts = candidateIds.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});

  const existing = await Project.find({ term, examinerId: { $ne: null } }).select('examinerId').lean();
  for (const p of existing) {
    const key = String(p.examinerId);
    if (counts[key] !== undefined) counts[key] += 1;
  }

  const sorted = candidateIds.slice().sort((a, b) => {
    if (counts[a] !== counts[b]) return counts[a] - counts[b];
    return a.localeCompare(b);
  });

  return sorted[0] || null;
};

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

const scheduleProjectIfPossible = async ({ project }) => {
  if (!project || project.defenseDate || project.status !== 'topic_approved') return project;
  if (!project.examinerId) return project;

  const chosen = await findAvailableSlotForExaminer({ examinerId: project.examinerId, term: project.term });
  if (!chosen) return project;

  project.defenseDate = chosen.date;
  project.defenseTime = chosen.time;
  project.status = 'scheduled';
  await project.save();

  await DefenseSlot.findByIdAndUpdate(chosen.slotId, {
    $push: {
      approvedSlots: {
        date: chosen.date,
        time: chosen.time,
        studentId: project.studentId?._id || project.studentId
      }
    }
  });

  return project;
};

export const enrollProject = async (req, res) => {
  try {
    const { term, advisorId } = req.body;
    const studentId = req.user.id;
    const major = req.user.major;
    if (!term) {
      console.warn('[enrollProject] Missing term in request body');
      return res.status(400).json({ error: 'Term is required (e.g., 1404-1)', term });
    }
    if (!advisorId) {
      return res.status(400).json({ error: 'Advisor is required' });
    }

    const advisor = await User.findOne({ _id: advisorId, role: 'teacher', major }).lean();
    if (!advisor) {
      return res.status(400).json({ error: 'Advisor not found for this major' });
    }
    
    // Check capacity
    const capacity = await Capacity.findOne({ term, major });
    if (!capacity || capacity.enrolled >= capacity.capacity) {
      console.warn('[enrollProject] No capacity', {
        studentId,
        major,
        term,
        found: !!capacity,
        enrolled: capacity?.enrolled,
        capacity: capacity?.capacity
      });
      return res.status(400).json({
        error: 'No capacity available',
        term,
        major,
        found: !!capacity,
        enrolled: capacity?.enrolled ?? null,
        capacity: capacity?.capacity ?? null
      });
    }

    const advisorLimit = (capacity.advisorLimits || []).find(
      l => String(l.advisorId) === String(advisorId)
    );
    if (!advisorLimit) {
      return res.status(400).json({ error: 'Advisor capacity not set for this term' });
    }
    if ((advisorLimit.assigned || 0) >= (advisorLimit.limit || 0)) {
      return res.status(400).json({ error: 'Advisor capacity is full' });
    }

    const manager = await User.findOne({ role: 'manager', major }).select('_id').lean();
    const examinerId = await assignBalancedExaminer({ major, term, advisorId });
    
    const project = new Project({
      projectCode: `${term}-${studentId.toString().slice(-4)}-${Date.now()}`,
      studentId,
      advisorId,
      examinerId,
      managerId: manager?._id || null,
      term,
      status: 'active'
    });
    
    await project.save();
    await Capacity.updateOne(
      { _id: capacity._id, 'advisorLimits.advisorId': advisorId },
      { $inc: { enrolled: 1, 'advisorLimits.$.assigned': 1 } }
    );
    console.log('[enrollProject] Enrolled project created', { studentId, term, projectId: project._id });
    
    res.json(project);
  } catch (err) {
    console.error('[enrollProject] Error', err);
    res.status(500).json({ error: err.message });
  }
};

export const assignAdvisorsExaminers = async (req, res) => {
  try {
    const { projectId, advisorId, examinerId } = req.body;
    
    // Ensure advisor and examiner are different
    if (advisorId === examinerId) {
      return res.status(400).json({ error: 'Advisor and examiner must be different' });
    }
    
    const project = await Project.findByIdAndUpdate(
      projectId,
      { advisorId, examinerId, status: 'topic_submitted' },
      { new: true }
    );
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const submitTopics = async (req, res) => {
  try {
    const { projectId, topics } = req.body;
    console.log('[submitTopics] Received:', { projectId, topicsCount: topics?.length });
    
    if (!Array.isArray(topics) || topics.length < 2) {
      console.log('[submitTopics] Invalid topics:', topics);
      return res.status(400).json({ error: 'حداقل دو موضوع باید ارسال شود' });
    }

    const sanitizedTopics = topics
      .map((t, idx) => {
        if (typeof t === 'string') {
          return {
            name: t.trim(),
            description: '',
            priority: idx + 1
          };
        }
        return {
          name: t?.name?.trim() || '',
          description: t?.description?.trim() || '',
          priority: t?.priority ?? idx + 1
        };
      })
      .filter(t => t.name);

    if (sanitizedTopics.length < 2) {
      console.log('[submitTopics] Not enough valid topics:', sanitizedTopics);
      return res.status(400).json({ error: 'حداقل دو موضوع معتبر وارد کنید' });
    }

    console.log('[submitTopics] Updating project:', { projectId, sanitizedTopicsCount: sanitizedTopics.length });

    const project = await Project.findByIdAndUpdate(
      projectId,
      { proposedTopics: sanitizedTopics, status: 'topic_submitted' },
      { new: true }
    );

    if (!project) {
      console.log('[submitTopics] Project not found:', projectId);
      return res.status(404).json({ error: 'پروژه پیدا نشد' });
    }

    console.log('[submitTopics] Success:', { projectId, newStatus: project.status });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveTopic = async (req, res) => {
  try {
    const { projectId, topic } = req.body;
    const project = await Project.findByIdAndUpdate(
      projectId,
      { topic, status: 'topic_approved' },
      { new: true }
    );
    
    if (!project.examinerId) {
      const student = await User.findById(project.studentId).lean();
      if (student?.major) {
        const examinerId = await assignBalancedExaminer({ major: student.major, term: project.term, advisorId: project.advisorId });
        if (examinerId) {
          project.examinerId = examinerId;
          await project.save();
        }
      }
    }

    await scheduleProjectIfPossible({ project });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentProjects = async (req, res) => {
  try {
    const projects = await Project.find({ studentId: req.user.id })
      .populate('advisorId examinerId managerId');
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

export const getAdvisorProjects = async (req, res) => {
  try {
    const projects = await Project.find({ advisorId: req.user.id })
      .populate('studentId examinerId');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExaminerProjects = async (req, res) => {
  try {
    const projects = await Project.find({ examinerId: req.user.id })
      .populate('studentId advisorId');
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

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate('studentId', 'firstName lastName studentNumber major')
      .populate('advisorId', 'firstName lastName')
      .populate('examinerId', 'firstName lastName')
      .populate('managerId', 'firstName lastName');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify that the requesting teacher is either advisor or examiner
    const teacherId = req.user.id;
    if (project.advisorId?._id.toString() !== teacherId && project.examinerId?._id.toString() !== teacherId) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this project.' });
    }
    
    res.json(project);
  } catch (err) {
    console.error('[getProjectById] Error', err);
    res.status(500).json({ error: err.message });
  }
};

export const rejectTopics = async (req, res) => {
  try {
    const { projectId } = req.body;
    const teacherId = req.user.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify teacher is the advisor
    if (project.advisorId?.toString() !== teacherId) {
      return res.status(403).json({ error: 'Only the advisor can reject topics' });
    }
    
    // Clear proposed topics
    project.proposedTopics = [];
    project.status = 'active'; // Reset to active, waiting for new topics
    await project.save();
    
    res.json({ message: 'Topics rejected. Student must submit new proposals.', project });
  } catch (err) {
    console.error('[rejectTopics] Error', err);
    res.status(500).json({ error: err.message });
  }
};

export const getAdvisorCapacities = async (req, res) => {
  try {
    const { term } = req.query;
    const major = req.user.major;
    if (!term) {
      return res.status(400).json({ error: 'Term is required' });
    }

    const capacity = await Capacity.findOne({ term, major }).lean();
    if (!capacity) {
      return res.status(404).json({ error: 'Capacity not set for this term' });
    }

    const advisorIds = (capacity.advisorLimits || []).map(l => l.advisorId).filter(Boolean);
    const advisors = await User.find({ _id: { $in: advisorIds } })
      .select('firstName lastName')
      .lean();

    const advisorMap = advisors.reduce((acc, a) => {
      acc[String(a._id)] = a;
      return acc;
    }, {});

    const options = (capacity.advisorLimits || []).map(l => {
      const advisor = advisorMap[String(l.advisorId)];
      const assigned = l.assigned || 0;
      const limit = l.limit || 0;
      return {
        advisorId: l.advisorId,
        firstName: advisor?.firstName || '',
        lastName: advisor?.lastName || '',
        limit,
        assigned,
        remaining: Math.max(0, limit - assigned)
      };
    });

    res.json({ term, capacity: capacity.capacity, enrolled: capacity.enrolled, advisors: options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAdvisorCapacityForTerm = async (req, res) => {
  try {
    const { term } = req.query;
    const major = req.user.major;
    if (!term) {
      return res.status(400).json({ error: 'Term is required' });
    }

    const capacity = await Capacity.findOne({ term, major }).lean();
    if (!capacity) {
      return res.status(404).json({ error: 'Capacity not set for this term' });
    }

    const entry = (capacity.advisorLimits || []).find(l => String(l.advisorId) === String(req.user.id));
    if (!entry) {
      return res.status(404).json({ error: 'Advisor capacity not set for this term' });
    }

    res.json({
      term,
      limit: entry.limit || 0,
      assigned: entry.assigned || 0,
      remaining: Math.max(0, (entry.limit || 0) - (entry.assigned || 0))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
