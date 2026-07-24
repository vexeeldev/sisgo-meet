const fs = require('fs');

const files = [
  'components/meeting/icons/ExpandLess.tsx',
  'components/meeting/icons/ExpandMore.tsx',
  'components/meeting/icons/GroupFilled.tsx',
  'components/meeting/icons/InfoFilled.tsx',
  'components/meeting/icons/VolumeUp.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/,\s*,\s*className/g, ', className');
  fs.writeFileSync(file, content);
}
console.log("Done");
