import * as mongoose from 'mongoose';
import * as faker from 'faker';
import { UserSchema } from '../../src/modules/common/schemas/user.schema';
import { Role } from '../../src/modules/common/interfaces/user.interface';

export const createUser = ({
  auth0Id = faker.random.uuid(),
  email = faker.internet.email(),
  name = faker.name.findName(),
  avatar = faker.internet.avatar(),
  roles = [],
} = {}) => {
  const User = mongoose.connection.model('User', UserSchema);
  return new User({
    auth0Id,
    email,
    name,
    avatar,
    roles: [...new Set([...roles, Role.MEMBER])],
  }).save();
};
