import * as mongoose from 'mongoose';

/**
 * Stores user's application to become a mentor
 */
export const ApplicationSchema = new mongoose.Schema({
  status: String,
  reason: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

ApplicationSchema.set('timestamps', true);
