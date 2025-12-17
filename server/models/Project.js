import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectCode: { type: String, unique: true, required: true },
  topic: String,
  description: String,
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  examinerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['pending', 'topic_submitted', 'topic_approved', 'scheduled', 'defended', 'graded'],
    default: 'pending'
  },
  defenseDate: Date,
  defenseTime: String, // HH:mm-HH:mm
  grade: Number,
  report: String,
  term: { type: String, required: true }, // e.g., "1404-1" for odd semester
  proposedTopics: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', projectSchema);
