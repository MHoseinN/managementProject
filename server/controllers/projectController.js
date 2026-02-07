import Project from '../models/Project.js';
import User from '../models/User.js';
import Capacity from '../models/Capacity.js';

// Student enrolls in project
export const enrollProject = async (req, res) => {
  try {
    const { term } = req.body;
    const studentId = req.user.id;
    const major = req.user.major;
    if (!term) {
      console.warn('[enrollProject] Missing term in request body');
      return res.status(400).json({ error: 'Term is required (e.g., 1404-1)', term });
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
    
    const project = new Project({
      projectCode: `${term}-${studentId.toString().slice(-4)}-${Date.now()}`,
      studentId,
      term,
      status: 'pending'
    });
    
    await project.save();
    await Capacity.updateOne({ _id: capacity._id }, { $inc: { enrolled: 1 } });
    console.log('[enrollProject] Enrolled project created', { studentId, term, projectId: project._id });
    
    res.json(project);
  } catch (err) {
    console.error('[enrollProject] Error', err);
    res.status(500).json({ error: err.message });
  }
};

// Manager assigns advisor and examiner
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

// Student submits proposed topics
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

// Advisor approves topic
export const approveTopic = async (req, res) => {
  try {
    const { projectId, topic } = req.body;
    const project = await Project.findByIdAndUpdate(
      projectId,
      { topic, status: 'topic_approved' },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get student projects
export const getStudentProjects = async (req, res) => {
  try {
    const projects = await Project.find({ studentId: req.user.id })
      .populate('advisorId examinerId managerId');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get advisor's projects
export const getAdvisorProjects = async (req, res) => {
  try {
    const projects = await Project.find({ advisorId: req.user.id })
      .populate('studentId examinerId');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get examiner's projects
export const getExaminerProjects = async (req, res) => {
  try {
    const projects = await Project.find({ examinerId: req.user.id })
      .populate('studentId advisorId');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Submit grade
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

// Get project by ID (for teacher detail view)
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

// Reject proposed topics (student must resubmit)
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
