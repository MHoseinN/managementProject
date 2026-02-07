// Schedule all projects without defense date by finding available slots
export const scheduleUnscheduledProjects = async (req, res) => {
  try {
    const managerId = req.user.id;
    const DefenseSlot = require('../models/DefenseSlot.js').default;

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
    const scheduled_list = [];

    for (const project of projects) {
      const examinerId = project.examinerId._id;
      const term = project.term;

      // یافتن اسلات‌های خالی این داور در این ترم
      const slots = await DefenseSlot.find({ examinerId, term });

      let chosen = null;
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

      if (chosen) {
        project.defenseDate = chosen.date;
        project.defenseTime = chosen.time;
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
          time: chosen.time
        });
      }
    }

    res.json({
      message: `${scheduled} دانشجو زمان‌بندی شد${scheduled > 0 ? '.' : ', برای بقیه اسلات دفاع ثبت نشده است.'}`,
      scheduled,
      total: projects.length,
      scheduled_list
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
