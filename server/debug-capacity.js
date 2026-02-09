import mongoose from 'mongoose';
import Capacity from './models/Capacity.js';
import User from './models/User.js';

async function checkCapacities() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/managementProject');
    console.log('🔍 Connected to MongoDB');
    
    // بررسی تمام ظرفیت‌ها
    const capacities = await Capacity.find({}).lean();
    console.log('\n📊 All Capacities:');
    capacities.forEach((c, index) => {
      console.log(`${index + 1}. Term: ${c.term}, Major: ${c.major}`);
      console.log(`   Total Capacity: ${c.capacity}`);
      console.log(`   ExaminerLimits Count: ${c.examinerLimits?.length || 0}`);
      
      if (c.examinerLimits?.length > 0) {
        c.examinerLimits.forEach((el, idx) => {
          console.log(`   ${idx + 1}. ExaminerID: ${el.examinerId}, Limit: ${el.limit}`);
        });
      }
      console.log('   ---');
    });
    
    // بررسی تمام کاربران teacher
    const teachers = await User.find({ role: 'teacher' }).lean();
    console.log('\n👥 All Teachers:');
    teachers.forEach((t, index) => {
      console.log(`${index + 1}. ID: ${t._id}`);
      console.log(`   Name: ${t.firstName || 'N/A'} ${t.lastName || 'N/A'}`);
      console.log(`   Major: ${t.major}`);
      console.log(`   ---`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCapacities();