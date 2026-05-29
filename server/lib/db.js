import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../db.json");

// Ensure the db.json file exists and is initialized
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [],
      scans: [],
      sessions: {} // maps token -> userId
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
  }
}

// Read database contents
function readDb() {
  initDb();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading database:", e);
    return { users: [], scans: [], sessions: {} };
  }
}

// Write database contents
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing to database:", e);
  }
}

// DB EXPORTS
export const db = {
  /**
   * Find user by username (case-insensitive)
   * @param {string} username
   * @returns {object|null}
   */
  findUserByUsername(username) {
    const data = readDb();
    const target = username.trim().toLowerCase();
    return data.users.find(u => u.username.toLowerCase() === target) || null;
  },

  /**
   * Find user by ID
   * @param {string} id
   * @returns {object|null}
   */
  findUserById(id) {
    const data = readDb();
    return data.users.find(u => u.id === id) || null;
  },

  /**
   * Create a new user record
   * @param {string} username
   * @param {string} fullName
   * @param {string} passwordHash
   * @param {string} salt
   * @returns {object} - The created user profile (without credentials)
   */
  createUser(username, fullName, passwordHash, salt) {
    const data = readDb();
    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      username: username.trim(),
      fullName: fullName.trim(),
      passwordHash,
      salt,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeDb(data);

    // Return profile without sensitive credentials
    const { passwordHash: _, salt: __, ...profile } = newUser;
    return profile;
  },

  /**
   * Registers a secure session token to a user ID
   * @param {string} token
   * @param {string} userId
   */
  createSession(token, userId) {
    const data = readDb();
    data.sessions[token] = userId;
    writeDb(data);
  },

  /**
   * Gets the user profile matching a session token
   * @param {string} token
   * @returns {object|null}
   */
  getUserByToken(token) {
    const data = readDb();
    const userId = data.sessions[token];
    if (!userId) return null;

    const user = data.users.find(u => u.id === userId);
    if (!user) return null;

    const { passwordHash: _, salt: __, ...profile } = user;
    return profile;
  },

  /**
   * Deletes a session token (Logout)
   * @param {string} token
   */
  deleteSession(token) {
    const data = readDb();
    delete data.sessions[token];
    writeDb(data);
  },

  /**
   * Save a soil or crop leaf diagnostic scan record
   * @param {string} userId
   * @param {string} type - 'soil' or 'leaf'
   * @param {object} scanData - Diagnostic payload
   * @returns {object} - Saved record
   */
  saveScan(userId, type, scanData) {
    const data = readDb();
    const newScan = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      userId,
      type,
      date: new Date().toISOString(),
      data: scanData
    };
    data.scans.unshift(newScan); // add to the beginning of the list
    writeDb(data);
    return newScan;
  },

  /**
   * Retrieve all scan history for a user
   * @param {string} userId
   * @returns {array}
   */
  getScansByUserId(userId) {
    const data = readDb();
    return data.scans.filter(s => s.userId === userId);
  }
};
