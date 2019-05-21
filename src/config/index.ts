
const config = {
  auth0: {
    // to decode the token
    frontend: {
      CLIENT_ID: process.env.FRONTEND_CLIENT_ID,
      CLIENT_SECRET: process.env.FRONTEND_CLIENT_SECRET,
      DOMAIN: process.env.DOMAIN,
    },
    // To get access to auth0 admin features
    backend: {
      CLIENT_ID: process.env.BACKEND_CLIENT_ID,
      CLIENT_SECRET: process.env.BACKEND_CLIENT_SECRET,
      DOMAIN: process.env.DOMAIN,
    }
  },
};

export default config;
