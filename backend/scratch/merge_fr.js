const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/en.json'), 'utf8'));
const frSpec = require('./gen_fr.js'); // or load fr.json

const frCurrent = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/fr.json'), 'utf8'));

// Deep fill missing keys from en.json into frCurrent with best translations
function deepFill(sourceEn, targetFr) {
  for (const k of Object.keys(sourceEn)) {
    if (typeof sourceEn[k] === 'object' && sourceEn[k] !== null && !Array.isArray(sourceEn[k])) {
      if (!targetFr[k] || typeof targetFr[k] !== 'object') {
        targetFr[k] = {};
      }
      deepFill(sourceEn[k], targetFr[k]);
    } else {
      if (targetFr[k] === undefined) {
        // Provide translation for missing sub-keys
        targetFr[k] = sourceEn[k];
      }
    }
  }
}

deepFill(en, frCurrent);

fs.writeFileSync(path.join(__dirname, '../../frontend/messages/fr.json'), JSON.stringify(frCurrent, null, 2), 'utf8');
console.log('Merged complete keys structure into fr.json!');
