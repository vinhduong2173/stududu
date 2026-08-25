const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/en.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/fr.json'), 'utf8'));

function pruneObj(enNode, frNode) {
  const result = {};
  for (const k of Object.keys(enNode)) {
    if (typeof enNode[k] === 'object' && enNode[k] !== null && !Array.isArray(enNode[k])) {
      result[k] = pruneObj(enNode[k], (frNode && typeof frNode[k] === 'object') ? frNode[k] : {});
    } else {
      result[k] = (frNode && frNode[k] !== undefined) ? frNode[k] : enNode[k];
    }
  }
  return result;
}

const cleanedFr = pruneObj(en, fr);
fs.writeFileSync(path.join(__dirname, '../../frontend/messages/fr.json'), JSON.stringify(cleanedFr, null, 2), 'utf8');
console.log('Cleaned up fr.json! Exact key match with en.json.');
