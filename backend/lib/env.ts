/**
 * Environment Variable Validator
 *
 * Validates that all required environment variables are set at startup.
 * Import this at the top of server.js and any server entry points.
 * The application will throw immediately with a clear error if any are missing.
 */

const REQUIRED_SERVER_VARS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
];

const REQUIRED_PUBLIC_VARS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

/**
 * Validates all required environment variables.
 * Call at application startup — will throw if any required vars are missing.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key] || process.env[key]!.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nPlease check your .env.local file. See .env.example for reference.\n`
    );
  }
}

/**
 * CJS-compatible version for use in server.js (CommonJS context).
 */
function validateEnvCJS(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key] || process.env[key].trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n❌ STARTUP FAILED — Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nPlease configure your environment. See .env.example for reference.\n`
    );
    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully.");
}

// Export CJS-compatible version as module.exports for server.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateEnvCJS };
}
