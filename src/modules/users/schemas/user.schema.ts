import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  auth0Id: String,
  email: String,
  name: String,
  avatar: String,
  title: String,
  description: String,
  country: String,
  spokenLanguages: Array,
  tags: Array,
  roles: Array,
  channels: [String],
});

UserSchema.set('timestamps', true);
