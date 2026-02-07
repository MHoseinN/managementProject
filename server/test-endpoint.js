import mongoose from 'mongoose';
import Project from './models/Project.js';
import DefenseSlot from './models/DefenseSlot.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/managementProject');
    console.log('[TEST] شروع آزمایش endpoint...');

    // گرفتن یک manager
    const manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.error('[ERROR] manager یافت نشد');
      process.exit(1);
    }

    console.log(`[INFO] استفاده از manager: ${manager.firstName}`);

    // پروژه‌های بدون تاریخ دفاع برای این manager
    const projects = await Project.find({
      managerId: manager._id,
      defenseDate: null,
      examinerId: { $ne: null },
      status: { $in: ['active', 'topic_approved'] }
    }).populate('examinerId studentId');

    if (!projects.length) {
      console.log('[INFO] تمامی پروژه‌ها زمان‌بندی شده‌اند');
      process.exit(0);
    }

    console.log(`\n[BEFORE] ${projects.length} پروژه بدون تاریخ:`);
    for (const p of projects) {
      console.log(`  • ${p.studentId.firstName} | داور: ${p.examinerId.firstName} | وضعیت: ${p.status}`);
    }

    // شبیه‌سازی scheduling logic (همان کد endpoint)
    let scheduled = 0;
    let noSlots = [];
    const scheduled_list = [];

    for (const project of projects) {
      const term = project.term;
      let chosen = null;
      let usedExaminerId = project.examinerId._id;

      // ابتدا اسلات‌های داور تعیین‌شده را جستجو کن
      let slots = await DefenseSlot.find({ examinerId: project.examinerId._id, term });

      // جستجو برای اسلات خالی در داور تعیین‌شده
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

      // اگر داور تعیین‌شده اسلات ندارد، از هر داوری با اسلات خالی استفاده کن
      if (!chosen) {
        const allSlots = await DefenseSlot.find({ term }).populate('examinerId');
        for (const s of allSlots) {
          for (const pd of s.proposedDates || []) {
            for (const t of (pd.timeSlots || [])) {
              const taken = (s.approvedSlots || []).some(as => {
                if (!as.date || !pd.date) return false;
                const sameDay = new Date(as.date).toISOString().slice(0, 10) === new Date(pd.date).toISOString().slice(0, 10);
                return sameDay && as.time === t;
              });
              if (!taken) {
                chosen = { slotId: s._id, date: pd.date, time: t };
                usedExaminerId = s.examinerId;
                break;
              }
            }
            if (chosen) break;
          }
          if (chosen) break;
        }
      }

      if (chosen) {
        project.defenseDate = chosen.date;
        project.defenseTime = chosen.time;
        project.examinerId = usedExaminerId;
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
        const examinerName = (await User.findById(usedExaminerId)).firstName;
        scheduled_list.push({
          student: `${project.studentId.firstName}`,
          date: new Date(chosen.date).toLocaleDateString('fa-IR'),
          time: chosen.time,
          examiner: examinerName
        });
      } else {
        noSlots.push(project.studentId.firstName);
      }
    }

    console.log(`\n[AFTER] نتایج:`);
    if (scheduled_list.length > 0) {
      console.log(`✅ ${scheduled} پروژه زمان‌بندی شد:`);
      for (const s of scheduled_list) {
        console.log(`  • ${s.student} | ${s.date} | ${s.time} | داور: ${s.examiner}`);
      }
    }

    if (noSlots.length > 0) {
      console.log(`\n❌ ${noSlots.length} پروژه بدون اسلات:`);
      for (const name of noSlots) {
        console.log(`  • ${name}`);
      }
    }

    // تأیید نتایج
    console.log(`\n[VERIFY] بررسی نتایج:`);
    const updatedProjects = await Project.find({
      managerId: manager._id,
      defenseDate: null,
      examinerId: { $ne: null },
      status: { $in: ['active', 'topic_approved'] }
    }).populate('studentId');
    
    console.log(`پروژه‌های همچنان بدون تاریخ: ${updatedProjects.length}`);
    for (const p of updatedProjects) {
      console.log(`  • ${p.studentId.firstName}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

testEndpoint();
