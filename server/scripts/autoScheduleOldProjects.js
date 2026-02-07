import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import DefenseSlot from '../models/DefenseSlot.js';
import User from '../models/User.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managementProject';

const log = (...args) => console.log('[AUTO-SCHEDULE]', ...args);

const run = async () => {
  await mongoose.connect(mongoUri);
  log('متصل به دیتابیس');

  // پروژه‌های بدون تاریخ دفاع که داور و ترم دارند
  const projects = await Project.find({
    status: { $in: ['active', 'topic_approved'] },
    defenseDate: null,
    examinerId: { $ne: null },
    term: { $ne: null }
  }).populate('examinerId');

  log(`یافت شدند: ${projects.length} پروژه بدون تاریخ دفاع`);

  let scheduled = 0;
  for (const project of projects) {
    const examinerId = project.examinerId._id;
    const term = project.term;

    // اسلات‌های خالی این داور در این ترم
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

      log(`✓ تخصیص شد: دانشجو ${project.studentId} → ${new Date(chosen.date).toLocaleDateString('fa-IR')} ساعت ${chosen.time}`);
      scheduled++;
    } else {
      log(`⚠ بدون اسلات: پروژه ${project._id} (داور: ${examinerId}, ترم: ${term})`);
    }
  }

  log(`\nنتیجه: ${scheduled} پروژه زمان‌بندی شد`);
  await mongoose.connection.close();
};

run().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
