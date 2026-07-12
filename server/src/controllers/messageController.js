import Meeting from '../models/Meeting.js';
import Message from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMessages = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ roomId: req.params.meetingId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const messages = await Message.find({ meeting: meeting._id }).sort({ createdAt: 1 });
  res.json({ success: true, messages });
});

export const postMessage = asyncHandler(async (req, res) => {
  const { meetingId, text } = req.body;
  const meeting = await Meeting.findOne({ roomId: meetingId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const message = await Message.create({
    meeting: meeting._id,
    sender: req.user._id,
    senderName: req.user.name,
    text,
  });

  res.status(201).json({ success: true, message });
});
