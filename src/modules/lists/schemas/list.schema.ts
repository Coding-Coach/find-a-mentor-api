import * as mongoose from 'mongoose';

export const ListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  public: {
    type: Boolean,
    default: false,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

ListSchema.set('timestamps', true);
