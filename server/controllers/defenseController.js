import DefenseSlot from '../models/DefenseSlot.js';

export const submitDefenseSlots = async (req, res) => {
  try {
    const { term, proposedDates } = req.body;
    const examinerId = req.user.id;
    
    let slot = await DefenseSlot.findOne({ examinerId, term });
    if (!slot) {
      slot = new DefenseSlot({ examinerId, term, proposedDates });
    } else {
      slot.proposedDates = proposedDates;
    }
    
    await slot.save();
    res.json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExaminerSlots = async (req, res) => {
  try {
    const slots = await DefenseSlot.find({ examinerId: req.user.id });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const scheduleDefense = async (req, res) => {
  try {
    const { projectId, date, time } = req.body;
    
    // Update project with defense schedule
    await Project.findByIdAndUpdate(
      projectId,
      { defenseDate: date, defenseTime: time, status: 'scheduled' },
      { new: true }
    );
    
    res.json({ message: 'Defense scheduled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
