import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import User from '../models/User.js';
import DefenseSlot from '../models/DefenseSlot.js';
import { approveEnrollment } from '../controllers/managerController.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managementProject';

const log = (...args) => console.log('[TEST]', ...args);

const run = async () => {
  await mongoose.connect(mongoUri);
  log('Connected to MongoDB');

  // پاک‌سازی داده‌های قبلی
  await Promise.all([
    Project.deleteMany({ projectCode: { $regex: '^TEST-AUTO-' } }),
    DefenseSlot.deleteMany({ projectId: { $exists: true } }),
    DefenseSlot.deleteMany({ term: '1404-1', examinerId: { $exists: true } }),
  ]);

  // ساخت کاربران نمونه
  const manager = await User.create({ firstName: 'مدیر', lastName: 'تست', role: 'manager', major: 'کامپیوتر', nationalId: '9000', password: 'pass' });
  const teacher1 = await User.create({ firstName: 'استاد', lastName: 'راهنما', role: 'teacher', major: 'کامپیوتر', nationalId: '9001', password: 'pass' });
  const teacher2 = await User.create({ firstName: 'استاد', lastName: 'داور', role: 'teacher', major: 'کامپیوتر', nationalId: '9002', password: 'pass' });
  const student = await User.create({ firstName: 'دانشجو', lastName: 'نمونه', role: 'student', major: 'کامپیوتر', nationalId: '9003', password: 'pass', studentNumber: 'STU-TEST' });

  // اسلات دفاع برای داور (teacher2)
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  await DefenseSlot.create({
    examinerId: teacher2._id,
    term: '1404-1',
    proposedDates: [
      {
        date,
        timeSlots: ['08:00-08:30', '08:30-09:00']
      }
    ],
    approvedSlots: []
  });

  // پروژه در حالت pending
  const project = await Project.create({
    projectCode: `TEST-AUTO-${Date.now()}`,
    studentId: student._id,
    status: 'pending',
    term: '1404-1',
    proposedTopics: []
  });

  // فراخوانی تایید و زمان‌بندی خودکار
  const req = {
    body: { projectId: project._id.toString() },
    user: { id: manager._id.toString() }
  };

  const res = {
    json(data) {
      log('Response JSON:', JSON.stringify(data, null, 2));
    },
    status(code) {
      this.statusCode = code;
      return this;
    }
  };

  await approveEnrollment(req, res);

  // بازیابی پروژه و اسلات
  const updated = await Project.findById(project._id);
  const slots = await DefenseSlot.find({ examinerId: teacher2._id, term: '1404-1' });

  log('Project defenseDate:', updated.defenseDate);
  log('Project defenseTime:', updated.defenseTime);
  log('Project status:', updated.status);
  log('Approved slots counts:', slots.map(s => s.approvedSlots.length));

  await mongoose.connection.close();
  log('Done');
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
