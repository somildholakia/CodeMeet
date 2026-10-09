import { runCode } from '../services/executionService.js';
import ExecutionHistory from '../models/ExecutionHistory.js';
import Meeting from '../models/Meeting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const execute = asyncHandler(async (req, res) => {
  const { meetingId, language, code, stdin = '' } = req.body;
  if (typeof meetingId !== 'string' || !meetingId.trim()) throw new ApiError(400, 'Meeting ID is required');
  const meeting = await Meeting.findOne({ roomId: meetingId }).select('_id roomId host participants status');
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.status === 'ended') throw new ApiError(409, 'Meeting has ended');

  const userId = req.user._id.toString();
  const isParticipant = meeting.host.toString() === userId || meeting.participants.some((participant) => participant.toString() === userId);
  if (!isParticipant) throw new ApiError(403, 'Join this meeting before running code');

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
