/**
 * Use this script to import the mentors from the
 * https://github.com/Coding-Coach/find-a-mentor repository to the mongo
 * database.
 *
 * Usage:
 *  $ yarn import:mentors
 */
import * as dotenv from 'dotenv';
import * as fetch from 'node-fetch';
import * as mongoose from 'mongoose';

import { Role } from 'src/modules/common/interfaces/user.interface';
import { ChannelSchema } from 'src/modules/common/schemas/user.schema';

const fetchMentors = async (request: RequestInfo): Promise<any> => {
  return new Promise(resolve => {
    fetch(request)
      .then(response => response.json())
      .then(body => {
        resolve(body);
      });
  });
};

async function importMentors() {
  console.log('Fetch the mentors');
  const mentors = await fetchMentors('https://raw.githubusercontent.com/Coding-Coach/find-a-mentor/master/src/mentors.json');
  console.log(`Fetched ${mentors.length} mentors`);

  console.log('Connect to database');
  mongoose.connect(process.env.MONGO_DATABASE_URL, { useNewUrlParser: true });

  const UserSchema = new mongoose.Schema({
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
    channels: [ChannelSchema],
  });

  let User = mongoose.model('User', UserSchema);

  console.log('Store mentors to database');
  for (const mentor of mentors) {
    // only add the mentor, if there isn't already an entry
    const user = await User.findOne({ email: mentor.id }).exec();
    if (!user) {
      console.log(`Add mentor '${mentor.id}' to database`);
      let newUser = new User({
        name: mentor.name,
        email: mentor.id,
        avatar: mentor.avatar,
        title: mentor.title,
        description: mentor.description,
        country: mentor.country,
        spokenLanguages: mentor.spokenLanguages,
        tags: mentor.tags,
        roles: [Role.MEMBER, Role.MENTOR],
        channels: mentor.channels,
      });

      await newUser.save();
    }
  }

  console.log('Finished adding new mentors to the database');
  process.exit(0);
}

dotenv.config();
importMentors();
