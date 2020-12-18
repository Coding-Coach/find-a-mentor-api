import * as mongoose from 'mongoose';

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
  // explaining why the mentorhip was terminated/rejected.
  reason: {
    type: String,
  },
});

MentorshipSchema.set('timestamps', true);
