import DefenseSlot from '../models/DefenseSlot.js';
import Project from '../models/Project.js';
import DefenseSlotModel from '../models/DefenseSlot.js';

export const submitDefenseSlots = async (req, res) => {
  try {
    const { term, proposedDates } = req.body;
    const examinerId = req.user.id;
    // نرمال‌سازی تاریخ‌ها به نوع تاریخ و اعتبارسنجی بازه‌ها
    const normalized = Array.isArray(proposedDates) ? proposedDates
      .map(pd => {
        const dateStr = pd?.date;
        const ts = Array.isArray(pd?.timeSlots) ? pd.timeSlots.filter(t => typeof t === 'string' && t.includes(':')) : [];
        const dateObj = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : null;
        return dateObj ? { date: dateObj, timeSlots: ts } : null;
      })
      .filter(Boolean) : [];

    if (!normalized.length) {
      return res.status(400).json({ error: 'تاریخ یا بازه زمانی معتبر ارسال نشده است' });
    }

    let slot = await DefenseSlot.findOne({ examinerId, term });
    if (!slot) {
      slot = new DefenseSlot({ examinerId, term, proposedDates: normalized });
    } else {
      slot.proposedDates = normalized;
      slot.updatedAt = new Date();
    }
    
    await slot.save();
    // پس از ذخیره اسلات، پروژه‌های همین داور/ترم که تاریخ ندارند را زمان‌بندی کن
    await autoScheduleForExaminer({ examinerId, term });

    res.json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// زمان‌بندی پروژه‌های بدون تاریخ برای یک داور و ترم مشخص
const autoScheduleForExaminer = async ({ examinerId, term }) => {
  // جمع‌آوری اسلات‌های در دسترس
  const slots = await DefenseSlotModel.find({ examinerId, term });
  const available = [];
  for (const s of slots) {
    for (const pd of s.proposedDates || []) {
      for (const t of (pd.timeSlots || [])) {
        const taken = (s.approvedSlots || []).some(as => {
          if (!as.date || !pd.date) return false;
          const sameDay = new Date(as.date).toISOString().slice(0, 10) === new Date(pd.date).toISOString().slice(0, 10);
          return sameDay && as.time === t;
        });
        if (!taken) available.push({ slotId: s._id, date: pd.date, time: t });
      }
    }
  }

  if (!available.length) return;

  // پروژه‌های بدون تاریخ این داور در این ترم
  const projects = await Project.find({
    examinerId,
    term,
    defenseDate: null,
    status: { $in: ['active', 'topic_approved'] }
  }).sort({ createdAt: 1 });

  for (const project of projects) {
    if (!available.length) break;
    const chosen = available.shift();
    project.defenseDate = chosen.date;
    project.defenseTime = chosen.time;
    project.status = 'scheduled';
    await project.save();

    await DefenseSlotModel.findByIdAndUpdate(chosen.slotId, {
      $push: {
        approvedSlots: {
          date: chosen.date,
          time: chosen.time,
          studentId: project.studentId
        }
      }
    });
  }
};

export const getExaminerSlots = async (req, res) => {
  try {
    const slots = await DefenseSlot.find({ examinerId: req.user.id }).populate('examinerId');
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all defense slots for a term (for manager to view)
export const getDefenseSlotsForTerm = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'ترم مشخص نشده است' });
    }
    const slots = await DefenseSlot.find({ term }).populate('examinerId');
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
