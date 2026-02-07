import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    const admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      // Set password to simple: 123456789
      const hashedPassword = await bcrypt.hash('123456789', 10);
      admin.password = hashedPassword;
      await admin.save();
      
      console.log('✓ Admin password updated!');
      console.log('\nLogin credentials:');
      console.log('─────────────────────');
      console.log('Role: admin');
      console.log(`National ID: ${admin.nationalId}`);
      console.log('Password: 123456789');
      console.log('─────────────────────\n');
    } else {
      console.log('Admin not found');
    }
    
    process.exit(0);
  });
