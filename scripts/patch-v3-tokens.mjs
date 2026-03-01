import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

if (!fs.existsSync(SRC_DIR)) {
  throw new Error(`Source directory not found at ${SRC_DIR}. Run this script from the repo root.`);
}

const TOKENS = [
  { match: /bg-\[#1C4D3A\]/g, replace: 'bg-proofound-forest' },
  { match: /text-\[#1C4D3A\]/g, replace: 'text-proofound-forest' },
  { match: /border-\[#1C4D3A\]/g, replace: 'border-proofound-forest' },
  { match: /bg-\[#F7F6F1\]/g, replace: 'bg-japandi-bg' },
  { match: /text-\[#2D3330\]/g, replace: 'text-foreground' },
  { match: /text-\[#6B6760\]/g, replace: 'text-muted-foreground' },
  { match: /border-\[#D8D2C8\]/g, replace: 'border-border' },
  { match: /bg-\[#2D5F4A\]/g, replace: 'bg-proofound-forest/90' },
  { match: /bg-\[#163E2F\]/g, replace: 'bg-proofound-forest/90' },
  { match: /bg-\[#163D2E\]/g, replace: 'bg-proofound-forest/90' },
  { match: /bg-\[#1A4634\]/g, replace: 'bg-proofound-forest/90' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      for (const token of TOKENS) {
        content = content.replace(token.match, token.replace);
      }
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated tokens in: ${filePath}`);
      }
    }
  }
}

console.log('Starting token patch on', SRC_DIR);
processDirectory(SRC_DIR);
console.log('Token patch complete.');
