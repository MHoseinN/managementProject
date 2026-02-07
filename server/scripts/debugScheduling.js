import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import DefenseSlot from '../models/DefenseSlot.js';
import User from '../models/User.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managementProject';

const log = (...args) => console.log('[DEBUG]', ...args);

const run = async () => {
  await mongoose.connect(mongoUri);
  log('متصل به دیتابیس');

  // تمام پروژه‌ها
  const allProjects = await Project.find()
    .populate('studentId advisorId examinerId')
    .select('projectCode studentId status defenseDate defenseTime term advisorId examinerId');

  log(`\nتمام پروژه‌ها (${allProjects.length}):`);
  for (const p of allProjects) {
    log(`  • ${p.studentId?.firstName || '?'} | وضعیت: ${p.status} | دفاع: ${p.defenseDate ? 'دارد' : 'ندارد'} | ترم: ${p.term} | داور: ${p.examinerId?.firstName || '?'}`);
  }

  // اسلات‌های دفاع
  const allSlots = await DefenseSlot.find().populate('examinerId').select('examinerId term approvedSlots proposedDates');
  log(`\nاسلات‌های دفاع (${allSlots.length}):`);
  for (const s of allSlots) {
    const totalSlots = (s.proposedDates || []).reduce((sum, pd) => sum + (pd.timeSlots || []).length, 0);
    log(`  • ${s.examinerId?.firstName || '?'} | ترم: ${s.term} | کل اسلات: ${totalSlots} | استفاده‌شده: ${s.approvedSlots?.length || 0}`);
  }

  // پروژه‌های بدون تاریخ که داور دارند
  const noDateProjects = await Project.find({
    defenseDate: null,
    examinerId: { $ne: null },
    status: { $in: ['active', 'topic_approved'] }
  }).populate('studentId examinerId').select('projectCode studentId status term examinerId');

  log(`\nپروژه‌های بدون تاریخ (${noDateProjects.length}):`);
  for (const p of noDateProjects) {
    const slots = await DefenseSlot.findOne({ examinerId: p.examinerId._id, term: p.term });
    log(`  • ${p.studentId?.firstName || '?'} | ترم: ${p.term} | داور: ${p.examinerId?.firstName || '?'} | اسلات: ${slots ? 'دارد' : 'ندارد'}`);
  }

  await mongoose.connection.close();
  log('\nتمام شد');
};

run().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
