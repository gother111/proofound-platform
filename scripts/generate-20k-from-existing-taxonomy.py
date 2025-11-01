#!/usr/bin/env python3
"""
Generate 20,000 L4 Skills Based on Existing L1→L2→L3 Taxonomy
Parses: Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md
Outputs: JSON file with 20k curated L4 skills
"""

import json
import re
from datetime import datetime
from pathlib import Path

def parse_taxonomy_markdown(file_path):
    """Parse the L1→L2→L3 structure from markdown"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    taxonomy = []
    current_l1 = None
    current_l2 = None

    lines = content.split('\n')

    for line in lines:
        # L1: ## U — Universal Capabilities
        if re.match(r'^## ([A-Z]) — (.+)$', line):
            match = re.match(r'^## ([A-Z]) — (.+)$', line)
            current_l1 = {
                'code': match.group(1),
                'name': match.group(2).strip(),
                'l2_categories': []
            }
            taxonomy.append(current_l1)

        # L2: ### U-COMM — Communication
        elif re.match(r'^### ([A-Z]-[A-Z]+) — (.+)$', line):
            match = re.match(r'^### ([A-Z]-[A-Z]+) — (.+)$', line)
            current_l2 = {
                'code': match.group(1),
                'name': match.group(2).strip(),
                'l3_subcategories': []
            }
            if current_l1:
                current_l1['l2_categories'].append(current_l2)

        # L3: - Verbal communication
        elif line.startswith('- ') and current_l2 is not None:
            l3_name = line[2:].strip()
            if l3_name and not l3_name.startswith('---'):
                current_l2['l3_subcategories'].append({
                    'name': l3_name,
                    'l4_skills': []
                })

    return taxonomy

def generate_l4_skills_for_l3(l3_name, l2_name, l1_code, count=50):
    """Generate contextually appropriate L4 skills for an L3 subcategory"""
    skills = []

    # Create skill variations based on proficiency, context, and specificity
    base_skill = l3_name

    # Proficiency levels
    levels = ['Foundational', 'Intermediate', 'Advanced', 'Expert', 'Master']

    # Contexts (domain-specific)
    contexts_by_domain = {
        'U': ['for Teams', 'for Leaders', 'in Remote Settings', 'in Crisis',
              'Cross-culturally', 'in High-Pressure Situations', 'for Executives',
              'in Startups', 'in Enterprise', 'in Nonprofits'],
        'F': ['in Production', 'in Services', 'in Manufacturing', 'in Operations',
              'in Healthcare', 'in Finance', 'in Retail', 'in Hospitality',
              'in Tech', 'in Construction'],
        'T': ['Setup & Configuration', 'Administration', 'Troubleshooting',
              'Integration', 'Optimization', 'Security', 'Monitoring',
              'Scaling', 'Backup & Recovery', 'Automation'],
        'L': ['A1 Level', 'A2 Level', 'B1 Level', 'B2 Level', 'C1 Level', 'C2 Level',
              'Business Context', 'Technical Context', 'Academic Context', 'Social Context'],
        'M': ['Planning', 'Execution', 'Monitoring', 'Control', 'Documentation',
              'Audit', 'Continuous Improvement', 'Training', 'Certification', 'Assessment'],
        'D': ['Fundamentals', 'Theory', 'Applied Practice', 'Research', 'Teaching',
              'Consulting', 'Industry Application', 'Innovation', 'Policy', 'Ethics']
    }

    contexts = contexts_by_domain.get(l1_code, ['Basic', 'Advanced', 'Specialized'])

    # Generate skills
    idx = 0

    # Pattern 1: Base skill with proficiency levels (10 skills)
    for level in levels[:5]:
        skills.append(f"{base_skill} - {level}")
        idx += 1
        if idx >= count: return skills

    # Pattern 2: Base skill with contexts (10 skills)
    for context in contexts[:10]:
        skills.append(f"{base_skill} {context}")
        idx += 1
        if idx >= count: return skills

    # Pattern 3: Specific applications (15 skills)
    applications = [
        f"{base_skill} - Planning & Preparation",
        f"{base_skill} - Execution & Delivery",
        f"{base_skill} - Analysis & Evaluation",
        f"{base_skill} - Documentation & Reporting",
        f"{base_skill} - Training & Coaching",
        f"{base_skill} - Process Design",
        f"{base_skill} - Quality Assurance",
        f"{base_skill} - Problem Solving",
        f"{base_skill} - Stakeholder Communication",
        f"{base_skill} - Risk Management",
        f"{base_skill} - Continuous Improvement",
        f"{base_skill} - Tool Selection",
        f"{base_skill} - Best Practices",
        f"{base_skill} - Compliance & Standards",
        f"{base_skill} - Performance Metrics"
    ]

    for app in applications:
        skills.append(app)
        idx += 1
        if idx >= count: return skills

    # Pattern 4: Combined variations (remaining to reach count)
    while idx < count:
        level_idx = idx % len(levels)
        context_idx = idx % len(contexts)
        skills.append(f"{base_skill} - {levels[level_idx]} ({contexts[context_idx]})")
        idx += 1

    return skills[:count]

def main():
    # Parse existing taxonomy
    taxonomy_file = Path('/Users/yuriibakurov/proofound/Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md')

    print("📖 Parsing existing L1→L2→L3 taxonomy...")
    taxonomy = parse_taxonomy_markdown(taxonomy_file)

    # Count total L3 subcategories
    total_l3 = sum(
        len(l3)
        for l1 in taxonomy
        for l2 in l1['l2_categories']
        for l3 in [l2['l3_subcategories']]
    )

    print(f"📊 Found structure:")
    for l1 in taxonomy:
        l2_count = len(l1['l2_categories'])
        l3_count = sum(len(l2['l3_subcategories']) for l2 in l1['l2_categories'])
        print(f"   {l1['code']} - {l1['name']}: {l2_count} L2, {l3_count} L3")

    print(f"\n📊 Total L3 subcategories: {total_l3}")

    # Target: 20,000 L4 skills
    target_total = 20000
    skills_per_l3 = target_total // total_l3

    print(f"🎯 Generating ~{skills_per_l3} L4 skills per L3...")
    print(f"🎯 Target total: {target_total:,} L4 skills\n")

    # Generate L4 skills for each L3
    all_skills = []
    total_generated = 0

    for l1 in taxonomy:
        l1_count = 0
        for l2 in l1['l2_categories']:
            for l3 in l2['l3_subcategories']:
                # Generate L4 skills for this L3
                l4_skills = generate_l4_skills_for_l3(
                    l3['name'],
                    l2['name'],
                    l1['code'],
                    count=skills_per_l3
                )

                # Add to result
                for skill in l4_skills:
                    all_skills.append({
                        'name': skill,
                        'l1_code': l1['code'],
                        'l1_name': l1['name'],
                        'l2_code': l2['code'],
                        'l2_name': l2['name'],
                        'l3_name': l3['name']
                    })

                l1_count += len(l4_skills)
                total_generated += len(l4_skills)

        print(f"✅ {l1['code']}: Generated {l1_count:,} skills")

    # Create output structure
    output = {
        'metadata': {
            'version': '1.0.0',
            'generated_at': datetime.now().isoformat(),
            'total_skills': len(all_skills),
            'description': 'Expertise Atlas - 20K L4 Skills based on predefined L1→L2→L3 taxonomy',
            'source_taxonomy': 'Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md',
            'distribution': {}
        },
        'skills': all_skills
    }

    # Calculate distribution
    for l1 in taxonomy:
        l1_skills = [s for s in all_skills if s['l1_code'] == l1['code']]
        output['metadata']['distribution'][f"{l1['code']}_{l1['name'].replace(' ', '_').replace('&', 'and')}"] = len(l1_skills)

    # Save to file
    output_file = Path('/Users/yuriibakurov/proofound/data/expertise-atlas-20k-l4-final.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Generated {len(all_skills):,} L4 skills")
    print(f"📄 Saved to: {output_file}")
    print(f"\n📊 Final Distribution:")
    for key, count in output['metadata']['distribution'].items():
        print(f"   {key}: {count:,} skills")

if __name__ == '__main__':
    main()
