import * as mongoose from 'mongoose';
import { Status } from '../interfaces/mentorship.interface';

export const MentorshipSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(Status),
  },
  message: {
    type: String,
    required: true,
  },
  goals: {
    type: Array,
  },
  expectation: {
    type: String,
  },
  background: {
    type: String,
  },
  // In case the mentorship gets terminated or rejected
  // it would be nice to leave a message to the other party
  // explaining why the mentorship was terminated/rejected.
  reason: {
    type: String,
  },
  reminderSentAt: {
    type: Date,
  },
});

MentorshipSchema.set('timestamps', true);
