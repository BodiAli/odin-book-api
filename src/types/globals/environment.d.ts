namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    TEST_DATABASE_URL: string;
    PORT: string;
    NODE_ENV: string;
    JWT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
  }
}
