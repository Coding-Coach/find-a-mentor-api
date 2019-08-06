
const config = {
  mongo: {
    url: process.env.MONGO_DATABASE_URL,
  },
  auth0: {
    // to decode the token
    frontend: {
      CLIENT_ID: process.env.AUTH0_FRONTEND_CLIENT_ID,
      CLIENT_SECRET: process.env.AUTH0_FRONTEND_CLIENT_SECRET,
      DOMAIN: process.env.AUTH0_DOMAIN,
    },
    // To get access to auth0 admin features
    backend: {
      CLIENT_ID: process.env.AUTH0_BACKEND_CLIENT_ID,
      CLIENT_SECRET: process.env.AUTH0_BACKEND_CLIENT_SECRET,
      DOMAIN: process.env.AUTH0_DOMAIN,
    },
  },
  sendGrid: {
    API_KEY: process.env.SENDGRID_API_KEY,
  },
  email: {
    FROM: 'Coding Coach <no-reply@mail.codingcoach.io>',
  }
};

export default config;
