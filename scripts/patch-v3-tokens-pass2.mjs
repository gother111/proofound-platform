import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Source directory not found at ${SRC_DIR}. Run this script from the repo root.`);
}

const TOKENS = [
    // #E8E6DD = proofound.stone (borders & bg)
    { match: /border-\[#E8E6DD\]/g, replace: 'border-proofound-stone' },
    { match: /bg-\[#E8E6DD\]/g, replace: 'bg-proofound-stone' },

    // #E5E3DA = very close to proofound.stone
    { match: /border-\[#E5E3DA\]/g, replace: 'border-proofound-stone' },

    // #C76B4A = proofound.terracotta
    { match: /text-\[#C76B4A\]/g, replace: 'text-proofound-terracotta' },
    { match: /bg-\[#C76B4A\]/g, replace: 'bg-proofound-terracotta' },

    // #9B9891 = muted icon/text color
    { match: /text-\[#9B9891\]/g, replace: 'text-muted-foreground' },

    // #E8F5E1 = success tint green -> proofound-success-tint (will add to tw config)
    { match: /bg-\[#E8F5E1\]/g, replace: 'bg-proofound-success-tint' },

    // #F5F4F0 = very close to japandi-bg
    { match: /bg-\[#F5F4F0\]/g, replace: 'bg-japandi-bg' },
    { match: /hover:bg-\[#F5F4F0\]/g, replace: 'hover:bg-japandi-bg' },

    // #EEF1EA = selected tint -> map to proofound-forest/5
    { match: /bg-\[#EEF1EA\]/g, replace: 'bg-proofound-forest/5' },

    // #004182 = LinkedIn brand hover -- intentional, keep
    // #0A66C2 = LinkedIn brand -- intentional, keep
    // #7A9278 = extended.sage -- already in safelist, keep
    // #5C8B89 = extended.teal -- already defined, keep
    // #C67B5C = close to terracotta -- keep as decorative
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
                console.log(`Patched: ${filePath}`);
            }
        }
    }
}

console.log('Starting second-pass token patch...');
processDirectory(SRC_DIR);
console.log('Second-pass token patch complete.');
