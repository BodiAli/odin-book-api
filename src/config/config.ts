/* eslint-disable n/no-process-env -- This is the main config file for process.env */

export default {
  databaseUrl: process.env.DATABASE_URL,
  connectionString:
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  port: Number(process.env.PORT) || 3000,
};
