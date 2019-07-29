/**
 * Use this script to set roles to the users using the command line,
 * this is useful to set the first use as an Admin.
 * 
 * Usage:
 * 
 *  $ yarn user:roles --email crysfel@bleext.com --roles 'Admin,Member'
 * 
 */
const minimist = require('minimist');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  const { email, roles: rolesInput } = minimist(process.argv.slice(2));
  const rolesAvailable = {
    'Admin': true,
    'Mentor': true,
    'Member': true,
  };

  if (!email && !rolesInput) {
    console.error('`email` and `roles` are required');
    process.exit(1)
  }

  const roles = rolesInput.split(',');
  roles.forEach((role) => {
    if (!rolesAvailable[role]) {
      console.error(`The role '${role}' is not valid, please choose one from 'Admin, Mentor or Member'`);
      process.exit(1)
    }
  });

  mongoose.connect(process.env.MONGO_DATABASE_URL, { useNewUrlParser: true });


  const User = mongoose.model('User', {
    _id: String,
    email: String,
    roles: Array,
  });

  const user = await User.findOne({ email }).exec();

  if (!user) {
      console.log(`User with email '${email}' not found`);
      process.exit(1);
    }
    
    const result = await User.updateOne({ email }, { roles });
    
  if (result.nModified === 1) {
    console.log('User updated successfully! 🎉');
    process.exit(0)
  }

  console.log('The user was not updated 🤷‍♂️');
  process.exit(1);
    
})();
