import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Capacity from './models/Capacity.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project-management');
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Capacity.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create Admin
    const adminPassword = await bcrypt.hash('admin0123', 10);
    const admin = await User.create({
      firstName: 'ادمین',
      lastName: 'سیستم',
      nationalId: 'admin01',
      password: adminPassword,
      role: 'admin',
      major: 'System',
      isApproved: true
    });
    console.log('✓ Admin created:', admin._id);

    // Create Student
    const studentPassword = await bcrypt.hash('99101241', 10);
    const student = await User.create({
      firstName: 'محمد',
      lastName: 'وفایی',
      nationalId: '0372199984',
      password: studentPassword,
      role: 'student',
      major: 'کامپیوتر',
      studentId: '99101241',
      isApproved: true
    });
    console.log('✓ Student created:', student._id);

    // Create Teachers
    const teacher1Password = await bcrypt.hash('123456789', 10);
    const teacher1 = await User.create({
      firstName: 'مهدی',
      lastName: 'رشتی',
      nationalId: '0371234567',
      password: teacher1Password,
      role: 'teacher',
      major: 'کامپیوتر',
      teacherId: '123456789',
      isApproved: true
    });
    console.log('✓ Teacher 1 created:', teacher1._id);

    const teacher2Password = await bcrypt.hash('123456788', 10);
    const teacher2 = await User.create({
      firstName: 'امیر',
      lastName: 'موذنی',
      nationalId: '0371234568',
      password: teacher2Password,
      role: 'teacher',
      major: 'کامپیوتر',
      teacherId: '123456788',
      isApproved: true
    });
    console.log('✓ Teacher 2 created:', teacher2._id);

    // Create Manager
    const managerPassword = await bcrypt.hash('987654321', 10);
    const manager = await User.create({
      firstName: 'علی',
      lastName: 'صحفی',
      nationalId: '0377654321',
      password: managerPassword,
      role: 'manager',
      major: 'کامپیوتر',
      teacherId: '987654321',
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

    console.log('\n✓✓✓ Database seeded successfully! ✓✓✓\n');
    console.log('Login Credentials:');
    console.log('├─ Admin: admin01 / admin0123');
    console.log('├─ Student: 0372199984 / 99101241');
    console.log('├─ Teacher 1: 0371234567 / 123456789');
    console.log('├─ Teacher 2: 0371234568 / 123456788');
    console.log('└─ Manager: 0377654321 / 987654321\n');

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seedDatabase();
