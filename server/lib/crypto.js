import crypto from "crypto";

/**
 * Generates a secure random 32-character hexadecimal salt.
 * @returns {string}
 */
export function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Hashes a password using PBKDF2 with SHA-512 and 100,000 iterations.
 * @param {string} password - Raw password
 * @param {string} salt - Hashing salt
 * @returns {string} - Hex encoded hashed password
 */
export function hashPassword(password, salt) {
  if (!password || !salt) throw new Error("Password and salt are required for hashing.");
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

/**
 * Generates a secure random 64-character hexadecimal session token.
 * @returns {string}
 */
export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}
