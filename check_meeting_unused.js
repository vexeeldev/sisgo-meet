const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const componentsDir = 'components/meeting';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') && !fs.statSync(path.join(componentsDir, f)).isDirectory());

const unused = [];

for (const file of files) {
  const name = file.replace('.tsx', '');
  try {
    // Only search in app, hooks, lib, and components
    const res = execSync(`grep -rnw --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git -e "${name}" app hooks lib components 2>/dev/null || true`).toString();
    
    // We must check if the grep output actually contains a valid import for this file
    // For simplicity, if the only matches are within the file itself, it's unused.
    const lines = res.split('\n').filter(l => l.trim() !== '');
    const otherFiles = lines.filter(l => !l.startsWith(`components/meeting/${file}`));
    
    if (otherFiles.length === 0) {
      unused.push(file);
    }
  } catch (e) {}
}

console.log(unused.join('\n'));
