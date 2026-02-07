import mongoose from 'mongoose';
import User from '../models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    const admins = await User.find({ role: 'admin' });
    
    console.log(`\nFound ${admins.length} admin(s):\n`);
    
    for (const admin of admins) {
      console.log(`Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`National ID: ${admin.nationalId}`);
      console.log(`Phone: ${admin.phone || 'N/A'}`);
      console.log(`Approved: ${admin.isApproved}`);
      console.log(`ID: ${admin._id}\n`);
    }
    
    if (admins.length === 0) {
      console.log('No admin found. Creating default admin...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('123456789', 10);
      
      const admin = new User({
        firstName: 'ادمین',
        lastName: 'سیستم',
        nationalId: '0000000000',
        password: hashedPassword,
        major: 'کامپیوتر',
        role: 'admin',
        isApproved: true
      });
      
      await admin.save();
      console.log('✓ Default admin created!');
      console.log('National ID: 0000000000');
      console.log('Password: 123456789');
    }
    
    process.exit(0);
  });
