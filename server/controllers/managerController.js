import Capacity from '../models/Capacity.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import DefenseSlot from '../models/DefenseSlot.js';

// Helper: Find next available 30-min slot for an examiner
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

// Helper: Assign advisor & examiner (load-balanced)
const assignTeam = async (advisors, examiners) => {
  const advisorAssignments = {};
  const examinerAssignments = {};

  for (const advisor of advisors) {
    advisorAssignments[advisor._id] = 0;
  }
  for (const examiner of examiners) {
    examinerAssignments[examiner._id] = 0;
  }

  const projects = await Project.find({
    $or: [
      { status: { $in: ['approved', 'defense_scheduled'] } },
      { advisorId: { $exists: true, $ne: null } }
    ]
  });

  for (const project of projects) {
    if (project.advisorId) {
      advisorAssignments[project.advisorId]++;
    }
    if (project.examinerId) {
      examinerAssignments[project.examinerId]++;
    }
  }

  const selectedAdvisor = Object.keys(advisorAssignments).reduce((a, b) =>
    advisorAssignments[a] < advisorAssignments[b] ? a : b
  );

  const selectedExaminer = Object.keys(examinerAssignments).reduce((a, b) =>
    examinerAssignments[a] < examinerAssignments[b] ? a : b
  );

  return { advisorId: selectedAdvisor, examinerId: selectedExaminer };
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
    const projects = await Project.find({ managerId })
      .populate('studentId advisorId examinerId');
    res.json(projects);
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
