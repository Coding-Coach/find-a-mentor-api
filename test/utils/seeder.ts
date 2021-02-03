import * as mongoose from 'mongoose';
import * as faker from 'faker';
import { UserSchema } from '../../src/modules/common/schemas/user.schema';
import { MentorshipSchema } from '../../src/modules/mentorships/schemas/mentorship.schema';
import { Role } from '../../src/modules/common/interfaces/user.interface';
import { Status } from '../../src/modules/mentorships/interfaces/mentorship.interface';

export const createUser = ({
  auth0Id = faker.random.uuid(),
  email = faker.internet.email(),
  name = faker.name.findName(),
  avatar = faker.internet.avatar(),
  roles = [],
  channels = [],
  available = false,
} = {}) => {
  const User = mongoose.connection.model('User', UserSchema);
  return new User({
    auth0Id,
    email,
    name,
    avatar,
    roles: [...new Set([...roles, Role.MEMBER])],
    channels,
    available,
  }).save();
};

export const createMentorship = ({
  mentor,
  mentee,
  message = faker.lorem.sentence(),
  status = Status.NEW,
}) => {
  const Mentorship = mongoose.connection.model('Mentorship', MentorshipSchema);
  return new Mentorship({
    mentor,
    mentee,
    message,
    status,
  }).save();
};
