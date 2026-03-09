if (!process.env.TARGET) {
  throw new Error(
    "TARGET environment variable is not set. Add TARGET=https://your-app-url.com to your .env file.",
  );
}

export const BASE_URL = process.env.TARGET.replace(/\/$/, "");
