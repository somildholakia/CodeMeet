import mongoose from 'mongoose';

const executionHistorySchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    stdin: { type: String, default: '' },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    executionTime: { type: Number },
    memoryUsed: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model('ExecutionHistory', executionHistorySchema);
