import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  description: { type: String },
  filePath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Report', reportSchema);
