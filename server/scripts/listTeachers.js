import mongoose from 'mongoose';
import User from '../models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    const teachers = await User.find({ role: 'teacher', isApproved: true });
    
    console.log('\nApproved Teachers:\n');
    teachers.forEach(t => {
      console.log(`${t.firstName} ${t.lastName}`);
      console.log(`  Phone: ${t.phone || 'N/A'}`);
      console.log(`  Major: ${t.major}`);
      console.log(`  ID: ${t._id}\n`);
    });
    
    process.exit(0);
  });
