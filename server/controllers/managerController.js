import Capacity from '../models/Capacity.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

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
    const projects = await Project.find({ managerId })
      .populate('studentId advisorId examinerId');
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
