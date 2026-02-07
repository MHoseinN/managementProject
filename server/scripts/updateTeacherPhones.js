import mongoose from 'mongoose';
import User from '../models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    // Update teacher 1 (مهدی رشتی)
    await User.updateOne(
      { firstName: 'مهدی', lastName: 'رشتی' },
      { $set: { phone: '0371234567' } }
    );
    
    // Update teacher 2 (امیر موذنی)
    await User.updateOne(
      { firstName: 'امیر', lastName: 'موذنی' },
      { $set: { phone: '0371234568' } }
    );
    
    console.log('✓ Teacher phone numbers updated!');
    console.log('  مهدی رشتی: 0371234567');
    console.log('  امیر موذنی: 0371234568');
    
    process.exit(0);
  });
