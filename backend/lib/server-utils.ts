/**
 * server-utils.ts — Server-Only Utility Functions
 *
 * This file uses Node.js built-in APIs (e.g., `crypto`) and must
 * only be imported in server-side code (API routes, server components).
 * Do NOT import this in client components.
 */
import crypto from "crypto";

/**
 * Generates a cryptographically secure, random 8-character invite code.
 * Uses Node.js crypto.randomInt for uniform distribution.
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => {
    const index = crypto.randomInt(0, chars.length);
    return chars[index];
  }).join("");
}
