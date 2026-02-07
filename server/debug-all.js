import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/managementProject');
    console.log('[DEBUG] متصل به دیتابیس');

    // تمام دانشجویان
    const students = await User.find({ role: 'student' });
    console.log(`\n[STUDENTS] کل دانشجویان: ${students.length}`);
    for (const s of students) {
      console.log(`  • ${s.firstName} ${s.lastName} | کد ملی: ${s.nationalCode}`);
    }

    // تمام پروژه‌ها
    console.log(`\n[PROJECTS] بررسی تمام پروژه‌ها:`);
    const projects = await Project.find().populate('studentId managerId');
    for (const p of projects) {
      console.log(`  • ${p.projectCode}`);
      console.log(`    - دانشجو: ${p.studentId?.firstName || 'undefined'}`);
      console.log(`    - status: ${p.status}`);
      console.log(`    - topic: ${p.topic || 'ندارد'}`);
      console.log(`    - proposedTopics: ${p.proposedTopics?.length || 0}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

debugAll();
