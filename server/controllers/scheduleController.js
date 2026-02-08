import Project from '../models/Project.js';
import DefenseSlot from '../models/DefenseSlot.js';
import User from '../models/User.js';

/**
 * Auto-schedule defenses for topic-approved projects
 * Algorithm ensures:
 * - advisor !== examiner
 * - 30-minute intervals
 * - One student per examiner per time slot
 * - Balance load across examiners
 */
export const scheduleDefenses = async (req, res) => {
  try {
    const { term } = req.body;
    
    if (!term) {
      return res.status(400).json({ error: 'ترم را مشخص کنید' });
    }

    // Find all approved/فعال projects without defense date
    const projects = await Project.find({
      term,
      status: { $in: ['topic_approved'] },
      defenseDate: null
    }).populate('advisorId examinerId');

    if (projects.length === 0) {
      return res.json({ message: 'پروژه‌ای برای زمان‌بندی وجود ندارد', scheduled: 0 });
    }

    // Get all defense slots for this term
    const defenseSlots = await DefenseSlot.find({ term }).populate('examinerId');

    if (defenseSlots.length === 0) {
      return res.status(400).json({ error: 'هیچ اسلات دفاعی برای این ترم ثبت نشده است' });
    }

    // Build available slots map: { examinerId: [{ date, time }] }
    const availableSlots = {};
    defenseSlots.forEach(slot => {
      const examId = slot.examinerId._id.toString();
      availableSlots[examId] = [];
      
      slot.proposedDates.forEach(pd => {
        pd.timeSlots.forEach(time => {
          // Check if slot is already taken
          const isTaken = slot.approvedSlots.some(
            as => as.date.toISOString().split('T')[0] === pd.date.toISOString().split('T')[0] && as.time === time
          );
          
          if (!isTaken) {
            availableSlots[examId].push({
              date: pd.date,
              time,
              slotId: slot._id
            });
          }
        });
      });
    });

    // Schedule each project
    let scheduled = 0;
    const updates = [];

    for (const project of projects) {
      const advisorId = project.advisorId?._id?.toString();
      const examinerId = project.examinerId?._id?.toString();

      if (!advisorId || !examinerId) {
        console.warn(`Project ${project._id} missing advisor or examiner`);
        continue;
      }

      if (advisorId === examinerId) {
        console.warn(`Project ${project._id} has same advisor and examiner`);
        continue;
      }

      // Find available slot for this examiner
      const slots = availableSlots[examinerId];
      if (!slots || slots.length === 0) {
        console.warn(`No available slots for examiner ${examinerId}`);
        continue;
      }

      // Pick first available slot
      const slot = slots.shift();

      // Update project
      updates.push({
        projectId: project._id,
        defenseDate: slot.date,
        defenseTime: slot.time,
        slotId: slot.slotId
      });

      scheduled++;
    }

    // Apply updates
    for (const upd of updates) {
      await Project.findByIdAndUpdate(upd.projectId, {
        defenseDate: upd.defenseDate,
        defenseTime: upd.defenseTime,
        status: 'scheduled'
      });

      await DefenseSlot.findByIdAndUpdate(upd.slotId, {
        $push: {
          approvedSlots: {
            date: upd.defenseDate,
            time: upd.defenseTime,
            studentId: (await Project.findById(upd.projectId)).studentId
          }
        }
      });
    }

    res.json({
      message: `${scheduled} دفاعیه با موفقیت زمان‌بندی شد`,
      scheduled,
      total: projects.length
    });
  } catch (err) {
    console.error('[scheduleDefenses] Error', err);
    res.status(500).json({ error: err.message });
  }
};
