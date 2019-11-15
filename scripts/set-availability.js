/**
 * This script adds the `available=true` field to all mentors that
 * have not set this field already
 * 
 * Usage:
 * 
 *  $ yarn user:availability
 * 
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  mongoose.connect(process.env.MONGO_DATABASE_URL, { useNewUrlParser: true });


  const User = mongoose.model('User', {
    _id: String,
    available: Boolean,
    email: String,
    roles: Array,
  });

  const users = await User.find({ roles: 'Mentor', available: undefined }).exec();

  const result = await User.updateMany({ roles: 'Mentor', available: undefined }, { available: true });

  if (result.nModified === users.length) {
    console.log('Mentors updated successfully! 🎉');
    process.exit(0)
  }

  console.log(`${result.nModified} records updated out of ${users.length}`)
  process.exit(0)

})();