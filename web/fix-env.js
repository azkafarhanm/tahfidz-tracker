const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const secret = crypto.randomBytes(32).toString('base64');
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

if (!envContent.includes('AUTH_SECRET')) {
  fs.appendFileSync(envPath, `\nAUTH_SECRET="${secret}"\n`);
  console.log('AUTH_SECRET added to .env');
} else {
  console.log('AUTH_SECRET already exists in .env');
}