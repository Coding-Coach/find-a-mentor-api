import * as mongoose from 'mongoose';
import { ChannelName } from '../interfaces/user.interface'

export const ChannelSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(ChannelName),
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
})

export const UserSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  title: String,
  description: String,
  country: String,
  spokenLanguages: Array,
  tags: Array,
  roles: Array,
  channels: [ChannelSchema],
});

UserSchema.set('timestamps', true);
