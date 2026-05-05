import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');

function ensureStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]', 'utf8');
  }
}

export function readUsers() {
  ensureStorage();
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

export function writeUsers(users) {
  ensureStorage();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

export default {
  readUsers,
  writeUsers
};
