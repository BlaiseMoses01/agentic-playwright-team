export interface TestUser {
  email: string;
  password: string;
  name: string;
}

/**
 * Get a test user by role.
 *
 * Reads from env vars following the pattern:
 *   TEST_USER_<ROLE>_EMAIL
 *   TEST_USER_<ROLE>_PASSWORD
 *   TEST_USER_<ROLE>_NAME
 *
 * Role is uppercased and hyphens are converted to underscores,
 * so getTestUser("admin") reads TEST_USER_ADMIN_EMAIL, etc.
 *
 * Throws if the email var is not set.
 */
export function getTestUser(role: string): TestUser {
  const key = role.toUpperCase().replace(/-/g, "_");
  const email = process.env[`TEST_USER_${key}_EMAIL`];
  if (!email) {
    throw new Error(
      `TEST_USER_${key}_EMAIL is not set. Add credentials for the "${role}" role to your .env file.`,
    );
  }
  return {
    email,
    password: process.env[`TEST_USER_${key}_PASSWORD`] ?? "",
    name: process.env[`TEST_USER_${key}_NAME`] ?? "",
  };
}
