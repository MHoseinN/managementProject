import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const projects = await Project.find()
      .populate('studentId', 'firstName lastName studentNumber')
      .populate('advisorId', 'firstName lastName')
      .limit(10);
    
    console.log(`\nTotal projects: ${projects.length}`);
    console.log('\nProjects:');
    projects.forEach(p => {
      console.log(`\nID: ${p._id}`);
      console.log(`Student: ${p.studentId?.firstName} ${p.studentId?.lastName}`);
      console.log(`Advisor: ${p.advisorId?.firstName || 'Not assigned'} ${p.advisorId?.lastName || ''}`);
      console.log(`Status: ${p.status}`);
      console.log(`Topic: ${p.topic || 'Not selected'}`);
      console.log(`Proposed Topics: ${p.proposedTopics?.length || 0}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
