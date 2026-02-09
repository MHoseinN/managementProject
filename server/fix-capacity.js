import mongoose from 'mongoose';
import Capacity from './models/Capacity.js';
import User from './models/User.js';

async function fixCapacityExaminers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/managementProject');
    console.log('🔍 Connected to MongoDB');
    
    // پیدا کردن ظرفیت ترم 1404-1
    const capacity = await Capacity.findOne({ term: '1404-1', major: 'کامپیوتر' });
    if (!capacity) {
      console.log('❌ No capacity found');
      return;
    }
    
    console.log('✅ Found capacity:', capacity.term, capacity.major);
    
    // پیدا کردن تمام اساتید رشته کامپیوتر
    const teachers = await User.find({ role: 'teacher', major: 'کامپیوتر' });
    console.log(`👥 Found ${teachers.length} teachers`);
    
    // اضافه کردن همه اساتید به examinerLimits با ظرفیت 10 دانشجو
    capacity.examinerLimits = teachers.map(teacher => ({
      examinerId: teacher._id,
      limit: 10,
      assigned: 0
    }));
    
    await capacity.save();
    
    console.log('✅ Updated capacity with examinerLimits:');
    capacity.examinerLimits.forEach((el, idx) => {
      console.log(`${idx + 1}. ExaminerID: ${el.examinerId}, Limit: ${el.limit}`);
    });
    
    mongoose.disconnect();
    console.log('🎉 Fix completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCapacityExaminers();