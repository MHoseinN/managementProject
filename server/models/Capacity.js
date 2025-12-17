import mongoose from 'mongoose';

const capacitySchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  major: { type: String, required: true },
  term: { type: String, required: true },
  capacity: { type: Number, required: true },
  enrolled: { type: Number, default: 0 },
  examinerLimits: [
    {
      examinerId: mongoose.Schema.Types.ObjectId,
      limit: Number,
      assigned: { type: Number, default: 0 }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Capacity', capacitySchema);
