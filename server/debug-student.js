import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/managementProject');
    console.log('[DEBUG] متصل به دیتابیس');

    // جستجو برای دانشجو با کد ملی 0372329871
    const student = await User.findOne({ nationalCode: '0372329871' });
    
    if (!student) {
      console.log('[ERROR] دانشجو با کد ملی 0372329871 پیدا نشد');
      process.exit(1);
    }

    console.log(`\n[STUDENT] ${student.firstName} ${student.lastName} (${student.nationalCode})`);
    console.log(`  Role: ${student.role}`);
    console.log(`  ID: ${student._id}`);

    // جستجو برای پروژه این دانشجو
    const project = await Project.findOne({ studentId: student._id })
      .populate('studentId managerId advisorId examinerId');

    if (!project) {
      console.log('[ERROR] پروژه‌ای برای این دانشجو یافت نشد');
      process.exit(1);
    }

    console.log(`\n[PROJECT] ${project.projectCode}`);
    console.log(`  Status: ${project.status}`);
    console.log(`  Manager: ${project.managerId?.firstName || '-'}`);
    console.log(`  Advisor: ${project.advisorId?.firstName || '-'}`);
    console.log(`  Examiner: ${project.examinerId?.firstName || '-'}`);
    console.log(`  Topic: ${project.topic || 'ندارد'}`);
    console.log(`  Proposed Topics: ${project.proposedTopics?.length || 0}`);
    
    if (project.proposedTopics && project.proposedTopics.length > 0) {
      console.log(`\n[PROPOSED TOPICS]`);
      for (const pt of project.proposedTopics) {
        console.log(`  - ${pt.name}`);
      }
    }

    // بررسی شرط نمایش فرم
    const isTopicApproved = ['topic_approved', 'scheduled', 'defended', 'graded'].includes(project.status);
    const shouldShowForm = !isTopicApproved && (project.status === 'active' || project.status === 'topic_submitted');

    console.log(`\n[FORM VISIBILITY]`);
    console.log(`  isTopicApproved: ${isTopicApproved}`);
    console.log(`  project.status: ${project.status}`);
    console.log(`  shouldShowForm: ${shouldShowForm}`);
    console.log(`  توضیح: ${shouldShowForm ? '✅ فرم باید نمایش داده شود' : '❌ فرم نباید نمایش داده شود'}`);

    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

debugStudent();
