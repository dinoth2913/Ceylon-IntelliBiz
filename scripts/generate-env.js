#!/usr/bin/env node
// Creates .env from .env.example with freshly generated random secrets.
//   node scripts/generate-env.js
// It never overwrites an existing .env.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const examplePath = path.join(root, '.env.example');
const envPath = path.join(root, '.env');

if (fs.existsSync(envPath)) {
  console.error('.env already exists, so nothing was changed.');
  console.error('Edit it by hand, or move it aside and run this again to generate new secrets.');
  process.exit(1);
}

const secret = (bytes) => crypto.randomBytes(bytes).toString('base64url');
const generated = {
  MONGODB_ROOT_PASSWORD: secret(24),
  MONGODB_APP_PASSWORD: secret(24),
  JWT_SECRET: secret(48),
  BOOTSTRAP_ADMIN_PASSWORD: secret(18)
};

let text = fs.readFileSync(examplePath, 'utf8');
for (const [key, value] of Object.entries(generated)) {
  const line = new RegExp(`^${key}=.*$`, 'm');
  if (!line.test(text)) {
    console.error(`.env.example has no ${key} line, so it cannot be filled in.`);
    process.exit(1);
  }
  text = text.replace(line, `${key}=${value}`);
}

// 'wx' fails instead of overwriting if .env appeared in the meantime; 0o600 keeps it private on Unix.
fs.writeFileSync(envPath, text, { flag: 'wx', mode: 0o600 });

const email = (text.match(/^BOOTSTRAP_ADMIN_EMAIL=(.*)$/m) || [])[1] || 'admin@ceylonintellibiz.local';
console.log('Created .env with new random secrets.\n');
console.log('First admin login (shown once, also saved in .env):');
console.log(`  email:    ${email}`);
console.log(`  password: ${generated.BOOTSTRAP_ADMIN_PASSWORD}\n`);
console.log('Start the stack with:');
console.log('  docker compose --env-file .env -f docker/docker-compose.yml up --build');
