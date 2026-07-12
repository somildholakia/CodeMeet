import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    title: { type: String, default: 'Untitled Meeting', trim: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    language: { type: String, default: 'javascript' },
    code: { type: String, default: '' },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Meeting', meetingSchema);
