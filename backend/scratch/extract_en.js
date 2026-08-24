const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/en.json'), 'utf8'));

let output = '';
for (const sec in en) {
  output += `=== SECTION: ${sec} (${Object.keys(en[sec]).length} keys) ===\n`;
  for (const k in en[sec]) {
    output += `  "${sec}.${k}": ${JSON.stringify(en[sec][k])}\n`;
  }
}

fs.writeFileSync(path.join(__dirname, 'en_dump.txt'), output, 'utf8');
console.log('Saved UTF-8 dump');
