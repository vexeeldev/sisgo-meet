const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const componentsDir = 'components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') && !fs.statSync(path.join(componentsDir, f)).isDirectory());

const unused = [];

for (const file of files) {
  const name = file.replace('.tsx', '');
  // Grep for 'components/Name' or './Name' or '../Name'
  try {
    // Search in app, hooks, lib, components/meeting, components/navbar, components/ui
    const res = execSync(`grep -rnw --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git -e "${name}" app hooks lib components/meeting components/navbar components/ui 2>/dev/null || true`).toString();
    if (res.trim() === '') {
      unused.push(file);
    }
  } catch (e) {}
}

console.log("UNUSED COMPONENTS:");
console.log(unused.join('\n'));
