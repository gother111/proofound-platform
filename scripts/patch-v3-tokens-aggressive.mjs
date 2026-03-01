import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

if (!fs.existsSync(SRC_DIR)) {
  throw new Error(`Source directory not found at ${SRC_DIR}. Run this script from the repo root.`);
}

const REPLACEMENTS = [
  { match: /#1C4D3A/gi, replace: 'var(--proofound-forest)' }, // Use var or token name depending on context
  { match: /#F7F6F1/gi, replace: 'var(--japandi-bg)' },
  { match: /#6B6760/gi, replace: 'var(--muted-foreground)' },
  { match: /#D8D2C8/gi, replace: 'var(--border)' },
  { match: /#2D3330/gi, replace: 'var(--foreground)' }
];

// Special mappings for Tailwind classes which don't like var() inside square brackets for arbitrary values usually,
// but we want to map them to the named classes if they were in `bg-[#...]`
const TW_REPLACEMENTS = [
    { match: /bg-\[#1C4D3A\]/gi, replace: 'bg-proofound-forest' },
    { match: /text-\[#1C4D3A\]/gi, replace: 'text-proofound-forest' },
    { match: /border-\[#1C4D3A\]/gi, replace: 'border-proofound-forest' },
    { match: /bg-\[#F7F6F1\]/gi, replace: 'bg-japandi-bg' },
    { match: /text-\[#6B6760\]/gi, replace: 'text-muted-foreground' },
    { match: /border-\[#D8D2C8\]/gi, replace: 'border-border' },
    { match: /text-\[#2D3330\]/gi, replace: 'text-foreground' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      // Don't patch tokens.css or globals.css where these might be defined
      if (filePath.endsWith('tokens.css') || filePath.endsWith('globals.css') || filePath.includes('patch-v3')) continue;

      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      // 1. Handle Tailwind arbitrary values first
      for (const rep of TW_REPLACEMENTS) {
        content = content.replace(rep.match, rep.replace);
      }
      
      // 2. Handle raw hex strings (in objects, styles, etc.)
      // We'll replace them with the actual hex but if we can map to a CSS variable it's better.
      // Actually, if it's in a JS object like COLORS = { verified: '#1C4D3A' }, we can keep the hex OR use a token.
      // The user wants "relevant V3 improvements". V3 uses tokens.
      // For Recharts/Charts, we might need the hex, but let's try mapping to the known V3 hex equivalent if it changed,
      // or just keep it if it's already the right forest green but avoid the 'hardcoded' feel.
      
      // Actually, let's just do a direct hex replace for the ones we know are V2.
      for (const rep of REPLACEMENTS) {
        // If it's a string literal '#1C4D3A', replace it.
        content = content.replace(rep.match, (match) => {
            // If it's in a tailwind class already handled, skip.
            // This is a bit greedy but let's try.
            return match; 
        });
      }
      
      // Let's do a simpler approach: just replace all occurrences of the HEX with the token name IF it's in a class,
      // OR replace it with the hex string if it's in code.
      // Wait, if I just replace #1C4D3A with #1C4D3A it does nothing.
      // If I replace #1C4D3A with another V3 hex (if it changed), that's better.
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  }
}

processDirectory(SRC_DIR);
