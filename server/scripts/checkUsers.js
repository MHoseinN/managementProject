import mongoose from 'mongoose';
import User from '../models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const teacher = await User.findOne({ firstName: 'مهدی', lastName: 'رشتی' });
    
    if (teacher) {
      console.log('\nTeacher found:');
      console.log(`Name: ${teacher.firstName} ${teacher.lastName}`);
      console.log(`Phone: ${teacher.phone}`);
      console.log(`Role: ${teacher.role}`);
      console.log(`Major: ${teacher.major}`);
      console.log(`Approved: ${teacher.isApproved}`);
    } else {
      console.log('Teacher not found');
    }
    
    const student = await User.findOne({ firstName: 'محمد', lastName: 'وفایی' });
    if (student) {
      console.log('\nStudent found:');
      console.log(`Name: ${student.firstName} ${student.lastName}`);
      console.log(`Phone: ${student.phone}`);
      console.log(`Role: ${student.role}`);
      console.log(`Student Number: ${student.studentNumber}`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
