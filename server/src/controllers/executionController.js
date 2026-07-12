import { runCode } from '../services/executionService.js';
import ExecutionHistory from '../models/ExecutionHistory.js';
import Meeting from '../models/Meeting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const execute = asyncHandler(async (req, res) => {
  const { meetingId, language, code, stdin } = req.body;
  const meeting = await Meeting.findOne({ roomId: meetingId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const result = await runCode({ language, code, stdin });

  await ExecutionHistory.create({
    meeting: meeting._id,
    user: req.user._id,
    language,
    code,
    stdin,
    stdout: result.stdout,
    stderr: result.stderr,
    executionTime: result.executionTime,
    memoryUsed: result.memoryUsed,
  });

  res.json({ success: true, result });
});
