import Project from '../models/Project.js';
import User from '../models/User.js';
import Capacity from '../models/Capacity.js';

// Student enrolls in project
export const enrollProject = async (req, res) => {
  try {
    const { term } = req.body;
    const studentId = req.user.id;
    
    // Check capacity
    const capacity = await Capacity.findOne({ term, major: req.user.major });
    if (!capacity || capacity.enrolled >= capacity.capacity) {
      return res.status(400).json({ error: 'No capacity available' });
    }
    
    const project = new Project({
      projectCode: `${term}-${studentId.toString().slice(-4)}-${Date.now()}`,
      studentId,
      term,
      status: 'pending'
    });
    
    await project.save();
    await Capacity.updateOne({ _id: capacity._id }, { $inc: { enrolled: 1 } });
    
    res.json(project);
  } catch (err) {
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
    const project = await Project.findByIdAndUpdate(
      projectId,
      { proposedTopics: topics },
      { new: true }
    );
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
