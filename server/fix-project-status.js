import mongoose from 'mongoose';
import Project from './models/Project.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixProjectStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/managementProject');
    console.log('[DEBUG] متصل به دیتابیس');

    // تمام پروژه‌های scheduled را به active تبدیل کن
    const projects = await Project.find({ status: 'scheduled' });
    
    console.log(`[INFO] پروژه‌های scheduled: ${projects.length}`);
    
    for (const p of projects) {
      console.log(`\n  Fixing: ${p.projectCode}`);
      console.log(`    Before: status=${p.status}, proposedTopics=${p.proposedTopics?.length || 0}`);
      
      // اگر موضوع ارسال شده است، status باید topic_submitted باشد
      // اگر موضوع ارسال نشده است، status باید active باشد
      const newStatus = p.proposedTopics && p.proposedTopics.length > 0 ? 'topic_submitted' : 'active';
      
      p.status = newStatus;
      await p.save();
      
      console.log(`    After: status=${p.status}`);
    }

    console.log(`\n[SUCCESS] ${projects.length} پروژه تصحیح شد`);
    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

fixProjectStatus();
