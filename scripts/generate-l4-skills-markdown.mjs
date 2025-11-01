#!/usr/bin/env node

/**
 * Generates a comprehensive markdown document with all L4 skills
 * organized hierarchically by L1 → L2 → L3 → L4
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the JSON data
const dataPath = join(__dirname, '../data/expertise-atlas-20k-l4-final.json');
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Organize skills by hierarchy
const hierarchy = {};

for (const skill of data.skills) {
  const l1Key = skill.l1_code;
  const l2Key = skill.l2_code;
  const l3Key = skill.l3_name;
  const l4Name = skill.name;

  if (!hierarchy[l1Key]) {
    hierarchy[l1Key] = {
      name: skill.l1_name,
      l2s: {}
    };
  }

  if (!hierarchy[l1Key].l2s[l2Key]) {
    hierarchy[l1Key].l2s[l2Key] = {
      name: skill.l2_name,
      l3s: {}
    };
  }

  if (!hierarchy[l1Key].l2s[l2Key].l3s[l3Key]) {
    hierarchy[l1Key].l2s[l2Key].l3s[l3Key] = {
      skills: []
    };
  }

  hierarchy[l1Key].l2s[l2Key].l3s[l3Key].skills.push(l4Name);
}

// Sort function for consistent ordering
function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

// Generate markdown content
let markdown = `# 📚 Expertise Atlas - Complete L4 Skills Reference

**Generated:** ${new Date().toISOString().split('T')[0]}  
**Total L4 Skills:** ${data.metadata.total_skills.toLocaleString()}  
**Version:** ${data.metadata.version}  
**Source:** ${data.metadata.source_taxonomy}

---

## 📊 Overview

This document contains **all ${data.metadata.total_skills.toLocaleString()} L4 skills** from the Expertise Atlas taxonomy, organized hierarchically:

\`\`\`
L1 (Domain) → L2 (Category) → L3 (Subcategory) → L4 (Specific Skill)
\`\`\`

### Distribution by Domain

| Domain | Code | Count | Percentage |
|--------|------|-------|------------|
| Universal Capabilities | **U** | ${data.metadata.distribution.U_Universal_Capabilities.toLocaleString()} | ${((data.metadata.distribution.U_Universal_Capabilities / data.metadata.total_skills) * 100).toFixed(1)}% |
| Functional Competencies | **F** | ${data.metadata.distribution.F_Functional_Competencies.toLocaleString()} | ${((data.metadata.distribution.F_Functional_Competencies / data.metadata.total_skills) * 100).toFixed(1)}% |
| Tools & Technologies | **T** | ${data.metadata.distribution['T_Tools_&_Technologies'].toLocaleString()} | ${((data.metadata.distribution['T_Tools_&_Technologies'] / data.metadata.total_skills) * 100).toFixed(1)}% |
| Languages & Culture | **L** | ${data.metadata.distribution['L_Languages_&_Culture'].toLocaleString()} | ${((data.metadata.distribution['L_Languages_&_Culture'] / data.metadata.total_skills) * 100).toFixed(1)}% |
| Methods & Practices | **M** | ${data.metadata.distribution['M_Methods_&_Practices'].toLocaleString()} | ${((data.metadata.distribution['M_Methods_&_Practices'] / data.metadata.total_skills) * 100).toFixed(1)}% |
| Domain Knowledge | **D** | ${data.metadata.distribution.D_Domain_Knowledge.toLocaleString()} | ${((data.metadata.distribution.D_Domain_Knowledge / data.metadata.total_skills) * 100).toFixed(1)}% |

---

## 🗂️ Complete Skill Taxonomy

`;

// Domain order for consistent presentation
const domainOrder = ['U', 'F', 'T', 'L', 'M', 'D'];
const domainIcons = {
  'U': '✨',
  'F': '⚙️',
  'T': '🛠️',
  'L': '🗣️',
  'M': '📋',
  'D': '🏢'
};

let skillCounter = 0;

// Generate content for each domain
for (const l1Code of domainOrder) {
  if (!hierarchy[l1Code]) continue;

  const l1 = hierarchy[l1Code];
  markdown += `## ${domainIcons[l1Code] || '📌'} ${l1.name} (${l1Code})\n\n`;

  // Sort L2s
  const l2Keys = Object.keys(l1.l2s).sort();
  
  for (const l2Key of l2Keys) {
    const l2 = l1.l2s[l2Key];
    markdown += `### ${l2.name} (${l2Key})\n\n`;

    // Sort L3s
    const l3Keys = Object.keys(l2.l3s).sort();
    
    for (const l3Key of l3Keys) {
      const l3 = l2.l3s[l3Key];
      const skills = l3.skills.sort(); // Sort skills alphabetically
      
      markdown += `#### ${l3Key}\n\n`;
      markdown += `*${skills.length} skill${skills.length !== 1 ? 's' : ''}*\n\n`;
      
      // List all L4 skills (use bullet points for readability)
      for (const skill of skills) {
        skillCounter++;
        markdown += `- ${skill}\n`;
      }
      
      markdown += `\n`;
    }
  }

  markdown += `\n---\n\n`;
}

// Add footer
markdown += `## 📝 Notes

- All skills are listed in alphabetical order within each L3 subcategory
- Skills may appear in multiple contexts (e.g., domain-specific variations)
- This is a comprehensive reference for the Expertise Atlas taxonomy
- Total skills documented: **${skillCounter.toLocaleString()}**

---

**Document Version:** ${data.metadata.version}  
**Last Updated:** ${data.metadata.generated_at.split('T')[0]}
`;

// Write to file
const outputPath = join(__dirname, '../EXPERTISE_ATLAS_L4_SKILLS_COMPLETE.md');
writeFileSync(outputPath, markdown, 'utf-8');

console.log(`✅ Generated markdown with ${skillCounter.toLocaleString()} skills`);
console.log(`📄 Output: ${outputPath}`);

