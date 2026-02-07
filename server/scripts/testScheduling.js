import mongoose from 'mongoose';
import Project from '../models/Project.js';
import DefenseSlot from '../models/DefenseSlot.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testScheduling() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/managementProject');
    console.log('[DEBUG] متصل به دیتابیس');

    // پروژه‌های بدون تاریخ دفاع
    const unscheduledProjects = await Project.find({
      defenseDate: null,
      examinerId: { $ne: null },
      status: { $in: ['active', 'topic_approved'] }
    }).populate('examinerId studentId managerId');

    console.log('\n[BEFORE] پروژه‌های بدون زمان‌بندی:');
    for (const p of unscheduledProjects) {
      console.log(`  • ${p.studentId.firstName} | داور: ${p.examinerId.firstName} | وضعیت: ${p.status}`);
    }

    // اسلات‌های موجود
    const slots = await DefenseSlot.find().populate('examinerId');
    console.log('\n[SLOTS] اسلات‌های دفاع:');
    for (const s of slots) {
      const available = (s.proposedDates || []).reduce((acc, pd) => acc + (pd.timeSlots || []).length, 0);
      const used = (s.approvedSlots || []).length;
      console.log(`  • ${s.examinerId.firstName} | کل: ${available} | استفاده‌شده: ${used} | خالی: ${available - used}`);
    }

    // شبیه‌سازی scheduling logic
    console.log('\n[TEST] آزمایش الگوریتم زمان‌بندی:');
    
    let scheduled = 0;
    let noSlots = [];
    const scheduled_list = [];

    for (const project of unscheduledProjects) {
      const term = project.term;
      let chosen = null;
      let usedExaminerId = project.examinerId._id;

      console.log(`\n  📝 پروژه: ${project.studentId.firstName}`);
      console.log(`     داور اولیه: ${project.examinerId.firstName}`);

      // ابتدا اسلات‌های داور تعیین‌شده را جستجو کن
      let slots = await DefenseSlot.find({ examinerId: project.examinerId._id, term });
      console.log(`     اسلات‌های داور اولیه: ${slots.length}`);

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
              console.log(`     ✅ اسلات خالی در داور اولیه پیدا شد`);
              break;
            }
          }
          if (chosen) break;
        }
        if (chosen) break;
      }

      // اگر داور تعیین‌شده اسلات ندارد، از هر داوری با اسلات خالی استفاده کن
      if (!chosen) {
        console.log(`     ❌ اسلات خالی در داور اولیه نیست. جستجو در دیگر داورین...`);
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
                usedExaminerId = s.examinerId._id;
                console.log(`     ✅ اسلات خالی در داور "${s.examinerId.firstName}" پیدا شد`);
                break;
              }
            }
            if (chosen) break;
          }
          if (chosen) break;
        }
      }

      if (chosen) {
        scheduled++;
        scheduled_list.push({
          student: `${project.studentId.firstName}`,
          newExaminer: (await Project.findById(project._id).populate('examinerId')).examinerId.firstName
        });
      } else {
        console.log(`     ⚠️  هیچ اسلات خالی در دسترس نیست`);
        noSlots.push(project.studentId.firstName);
      }
    }

    console.log('\n[RESULT] خلاصه:');
    console.log(`  • کل پروژه‌های بدون زمان: ${unscheduledProjects.length}`);
    console.log(`  • قابل زمان‌بندی: ${scheduled}`);
    console.log(`  • بدون اسلات: ${noSlots.length}`);
    
    if (noSlots.length > 0) {
      console.log(`\n  ⚠️  پروژه‌های بدون اسلات: ${noSlots.join(', ')}`);
    }

    if (scheduled_list.length > 0) {
      console.log(`\n  📋 پروژه‌های قابل زمان‌بندی:`);
      for (const s of scheduled_list) {
        console.log(`     • ${s.student}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

testScheduling();
