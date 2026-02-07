import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    const nationalId = '0372329871';
    const identityNumber = '991012131';
    
    const user = await User.findOne({ nationalId, role: 'student' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('User found:', user.firstName, user.lastName);
    console.log('Approved:', user.isApproved);
    
    // Test password
    const isValid = await bcrypt.compare(identityNumber, user.password);
    console.log('\nPassword test:');
    console.log(`Input: ${identityNumber}`);
    console.log(`Result: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
    
    if (isValid) {
      console.log('\n✓ Login credentials are correct!');
      console.log('───────────────────────');
      console.log('National ID: 0372329871');
      console.log('Password: 991012131');
    } else {
      console.log('\n❌ Password does not match!');
    }
    
    process.exit(0);
  });
