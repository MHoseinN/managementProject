import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Capacity from './models/Capacity.js';
import Project from './models/Project.js';
import DefenseSlot from './models/DefenseSlot.js';
import Message from './models/Message.js';
import Report from './models/Report.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const resetAndSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managementProject');
    console.log('✓ Connected to MongoDB');

    // Clear all data
    await User.deleteMany({});
    await Capacity.deleteMany({});
    await Project.deleteMany({});
    await DefenseSlot.deleteMany({});
    await Message.deleteMany({});
    await Report.deleteMany({});
    console.log('✓ Database cleared');

    // Create Admin
    const adminPassword = await bcrypt.hash('12345', 10);
    const admin = await User.create({
      firstName: 'ادمین',
      lastName: 'سیستم',
      nationalId: 'admin',
      password: adminPassword,
      role: 'admin',
      major: 'System',
      isApproved: true
    });
    console.log('✓ Admin created:', admin._id);

    // Create Student
    const studentPassword = await bcrypt.hash('12345', 10);
    const student = await User.create({
      firstName: 'محمد',
      lastName: 'وفایی',
      nationalId: '0371',
      password: studentPassword,
      role: 'student',
      major: 'کامپیوتر',
      studentId: '12345',
      isApproved: true
    });
    console.log('✓ Student created:', student._id);

    // Create Teachers
    const teacher1Password = await bcrypt.hash('12345', 10);
    const teacher1 = await User.create({
      firstName: 'مهدی',
      lastName: 'رشتی',
      nationalId: '0381',
      password: teacher1Password,
      role: 'teacher',
      major: 'کامپیوتر',
      teacherId: '12345',
      isApproved: true
    });
    console.log('✓ Teacher 1 created:', teacher1._id);

    const teacher2Password = await bcrypt.hash('12345', 10);
    const teacher2 = await User.create({
      firstName: 'امیر',
      lastName: 'موذنی',
      nationalId: '0382',
      password: teacher2Password,
      role: 'teacher',
      major: 'کامپیوتر',
      teacherId: '12345',
      isApproved: true
    });
    console.log('✓ Teacher 2 created:', teacher2._id);

    // Create Manager
    const managerPassword = await bcrypt.hash('12345', 10);
    const manager = await User.create({
      firstName: 'علی',
      lastName: 'صحفی',
      nationalId: '0391',
      password: managerPassword,
      role: 'manager',
      major: 'کامپیوتر',
      managerId: '12345',
      isApproved: true
    });
    console.log('✓ Manager created:', manager._id);

    // Create Capacity
    const capacity = await Capacity.create({
      managerId: manager._id,
      major: 'کامپیوتر',
      term: '1404-1',
      capacity: 30,
      enrolled: 0
    });
    console.log('✓ Capacity created:', capacity._id);

    // Create Project with new proposedTopics structure
    const project = await Project.create({
      projectCode: 'PRJ-001',
      studentId: student._id,
      advisorId: teacher1._id,
      examinerId: teacher2._id,
      managerId: manager._id,
      status: 'active',
      term: '1404-1',
      proposedTopics: [
        {
          name: 'سیستم مدیریت هوشمند',
          description: 'یک سیستم مدیریت پروژه کامل با ویژگی‌های پیشرفته'
        },
        {
          name: 'اپلیکیشن موبایل یادگیری',
          description: 'یک اپلیکیشن آموزشی برای یادگیری مفاهیم برنامه‌نویسی'
        },
        {
          name: 'پلتفرم تجارت الکترونیکی',
          description: 'یک فروشگاه آنلاین با سیستم پرداخت و سفارش‌دهی'
        }
      ]
    });
    console.log('✓ Project created:', project._id);

    console.log('\n✓✓✓ Database reset and seeded successfully! ✓✓✓\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

resetAndSeed();
