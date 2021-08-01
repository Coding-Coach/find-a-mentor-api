import * as mongoose from 'mongoose';

export const UserRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: Number,
    required: true,
  },
});

UserRecordSchema.set('timestamps', true);
