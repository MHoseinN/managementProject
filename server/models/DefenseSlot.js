import mongoose from 'mongoose';

const defenseSlotSchema = new mongoose.Schema({
  examinerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  term: { type: String, required: true },
  proposedDates: [
    {
      date: Date,
      timeSlots: [String] // e.g., ["08:00-08:30", "08:30-09:00", ...]
    }
  ],
  approvedSlots: [
    {
      date: Date,
      time: String,
      studentId: mongoose.Schema.Types.ObjectId
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('DefenseSlot', defenseSlotSchema);
