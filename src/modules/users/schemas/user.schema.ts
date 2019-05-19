import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  avatar: String,
  title: String,
  description: String,
  country: String,
  spokenLanguages: Array,
  tags: Array
});
