import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  nationalId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  major: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'manager', 'admin'], required: true },
  studentId: String,
  studentNumber: String,
  teacherId: String,
  managerId: String,
  isApproved: { type: Boolean, default: false },
  approvedBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
