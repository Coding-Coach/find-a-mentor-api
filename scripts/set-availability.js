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
  await mongoose.connect(process.env.MONGO_DATABASE_URL, { useNewUrlParser: true });


  const User = mongoose.model('User', {
    _id: String,
    available: Boolean,
    email: String,
    roles: Array,
  });

  const total = await User.find({ roles: 'Mentor', available: undefined }).count();

  const result = await User.updateMany({ roles: 'Mentor', available: undefined }, { available: true });

  console.log(`${result.nModified} records updated out of ${total}`)
  process.exit(0)

})();