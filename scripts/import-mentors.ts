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

import { UserSchema } from './../src/modules/users/schemas/user.schema';
import { Role } from 'src/modules/users/interfaces/user.interface';

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
  console.log("Fetch the mentors")
  const mentors = await fetchMentors('https://raw.githubusercontent.com/Coding-Coach/find-a-mentor/master/src/mentors.json');
  console.log(`Fetched ${mentors.length} mentors`)

  console.log("Connect to database")
  mongoose.connect(process.env.MONGO_DATABASE_URL, { useNewUrlParser: true });

  var User = mongoose.model('User', UserSchema);

  console.log("Store mentors to database")
  for (const mentor of mentors) {
    console.log(`Process mentor '${mentor.id}'`)

    var user = new User({
      name: mentor.name,
      email: mentor.id,
      avatar: mentor.avatar,
      title: mentor.title,
      description: mentor.description,
      country: mentor.country,
      spokenLanguages: mentor.spokenLanguages,
      tags: mentor.tags,
      roles: [Role.MENTOR],
      channels: mentor.channels,
    })

    user.save(function (err, results) {
      if (err) {
        console.error(err);
      } else {
        console.log(results);
      }
    });
  }

  process.exit(0);
}

dotenv.config();
importMentors();
