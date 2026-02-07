import mongoose from 'mongoose';
import User from '../models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    // Get the last 3 registered students
    const students = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(3);
    
    console.log(`\nFound ${students.length} recent student(s):\n`);
    
    for (const student of students) {
      console.log('═══════════════════════════════');
      console.log(`Name: ${student.firstName} ${student.lastName}`);
      console.log(`National ID: ${student.nationalId}`);
      console.log(`Student ID: ${student.studentId || 'N/A'}`);
      console.log(`Student Number: ${student.studentNumber || 'N/A'}`);
      console.log(`Major: ${student.major}`);
      console.log(`Approved: ${student.isApproved ? '✓' : '✗'}`);
      console.log(`Created: ${student.createdAt}`);
      console.log(`Password Hash: ${student.password.substring(0, 20)}...`);
      console.log('');
    }
    
    process.exit(0);
  });
