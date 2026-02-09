import mongoose from 'mongoose';
import User from './models/User.js';

async function checkUserFields() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/managementProject');
    console.log('🔍 Connected to MongoDB');
    
    const users = await User.find({ role: 'teacher' }).lean();
    console.log('📋 Raw User Data:');
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`);
      console.log(`   Raw Data:`, JSON.stringify(user, null, 2));
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserFields();