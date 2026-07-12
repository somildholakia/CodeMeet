import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
