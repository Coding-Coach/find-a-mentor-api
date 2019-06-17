import * as mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum : ['email', 'slack', 'linkedin', 'facebook', 'twitter', 'github', 'website'],
    default: 'email'
  }
})

export const UserSchema = new mongoose.Schema({
  id: String,
  email: String,
  name: String,
  avatar: String,
  title: String,
  description: String,
  country: String,
  spokenLanguages: Array,
  tags: Array,
  roles: Array,
  channels: {
    type: [channelSchema],
    required: true,
    validate: {
      validator: (value) => value.length >= 1 && value.length <= 3,
    }  
  },
});
