import mongoose from 'mongoose';
import User from './models/User.js';

async function fixUserNames() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/managementProject');
    console.log('🔍 Connected to MongoDB');
    
    const updates = [
      { 
        _id: '6988664d848e19e2efd66865', 
        firstName: 'مهدی', 
        lastName: 'رشتی' 
      },
      { 
        _id: '6988664d848e19e2efd66867', 
        firstName: 'امیر', 
        lastName: 'موذنی' 
      },
      { 
        _id: '6989a55aa88d903548c8009c', 
        firstName: 'حکیمه', 
        lastName: 'فرخ' 
      }
    ];
    
    for (const update of updates) {
      const result = await User.updateOne(
        { _id: update._id },
        { 
          firstName: update.firstName, 
          lastName: update.lastName 
        }
      );
      console.log(`✅ Updated user ${update.firstName} ${update.lastName}:`, result.modifiedCount > 0 ? 'Success' : 'Not found');
    }
    
    // بررسی نهایی
    const users = await User.find({ role: 'teacher' }, 'firstName lastName role major');
    console.log('\n👥 Final check:');
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Role: ${user.role}, Major: ${user.major}`);
      console.log('---');
    });
    
    mongoose.disconnect();
    console.log('🎉 Names fix completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixUserNames();