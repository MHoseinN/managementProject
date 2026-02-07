import mongoose from 'mongoose';
import User from '../models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    // Update student with student number
    const student = await User.findOneAndUpdate(
      { firstName: 'محمد', lastName: 'وفایی' },
      { $set: { studentNumber: '981234567' } },
      { new: true }
    );
    
    if (student) {
      console.log('✓ Student number updated!');
      console.log(`Name: ${student.firstName} ${student.lastName}`);
      console.log(`Student Number: ${student.studentNumber}`);
    } else {
      console.log('Student not found');
    }
    
    process.exit(0);
  });
