const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../../frontend/messages/en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

console.log('Top level keys:', Object.keys(en));

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key], prefix + key + '.');
    } else {
      count++;
    }
  }
  return count;
}

console.log('Total key count in en.json:', countKeys(en));
