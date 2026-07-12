import { v4 as uuidv4 } from 'uuid';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createMeeting = asyncHandler(async (req, res) => {
  const roomId = uuidv4().slice(0, 8);
  const meeting = await Meeting.create({
    roomId,
    title: req.body.title || 'Untitled Meeting',
    host: req.user._id,
    participants: [req.user._id],
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { meetingsHosted: 1 } });

  res.status(201).json({ success: true, meeting });
});

export const listMeetings = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({
    $or: [{ host: req.user._id }, { participants: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('host', 'name avatar');

  res.json({ success: true, meetings });
});

export const getMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ roomId: req.params.id }).populate(
    'host',
    'name avatar'
  );
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const alreadyIn = meeting.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!alreadyIn) {
    meeting.participants.push(req.user._id);
    await meeting.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { meetingsJoined: 1 } });
  }

  res.json({ success: true, meeting });
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.host.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the host can delete this meeting');
  }

  await meeting.deleteOne();
  res.json({ success: true, message: 'Meeting deleted' });
});
