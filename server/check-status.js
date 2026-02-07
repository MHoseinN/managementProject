import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/managementProject');
    const projects = await Project.find().populate('studentId');
    
    console.log('[PROJECTS WITH STATUS]\n');
    for (const p of projects) {
      const status = p.status;
      const shouldShowForm = !['topic_approved', 'scheduled', 'defended', 'graded'].includes(status) && 
                           (status === 'active' || status === 'topic_submitted');
      
      console.log(`• ${p.projectCode}`);
      console.log(`  - Student: ${p.studentId?.firstName || '-'}`);
      console.log(`  - Status: ${status}`);
      console.log(`  - Should Show Form: ${shouldShowForm ? '✅ YES' : '❌ NO'}`);
      console.log(`  - Proposed Topics: ${p.proposedTopics?.length || 0}`);
      console.log();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

checkStatus();
