#!/usr/bin/env python3
"""
Enhance Expertise Atlas L4 skills with descriptions, examples, and related skills.
Based on ESCO and O*NET best practices.
"""

import json
import re
from datetime import datetime
from typing import List, Dict, Set
from collections import defaultdict

# Description templates based on ESCO/O*NET patterns
DESCRIPTION_TEMPLATES = {
    # Communication skills
    'communication': [
        "Communicate {subject} through {medium} to {audience}. Adapt messaging based on context and audience needs.",
        "Deliver {subject} effectively using {medium}, ensuring clarity and engagement with {audience}.",
    ],

    # Management/Leadership
    'manage|lead|coordinate': [
        "Plan, organize, and oversee {object} to achieve {outcome}. Monitor progress and adjust strategies as needed.",
        "Direct and coordinate {object}, ensuring alignment with goals and effective resource utilization.",
    ],

    # Analysis
    'analys|assess|evaluat': [
        "Examine and interpret {data_type} to identify {patterns_or_insights}. Use analytical methods to support decision-making.",
        "Evaluate {data_type} systematically to uncover {patterns_or_insights} and inform strategic actions.",
    ],

    # Design
    'design|create|develop': [
        "Design and develop {deliverable} that meet {requirements}. Apply design principles and iterate based on feedback.",
        "Create {deliverable} through {process}, ensuring alignment with functional and aesthetic requirements.",
    ],

    # Technical/Tools
    'programming|configuration|administration': [
        "Implement and maintain {system} to achieve {functionality}. Apply best practices for {quality_attribute}.",
        "Configure and optimize {system}, ensuring {quality_attribute} and alignment with technical requirements.",
    ],

    # Process/Methods
    'implement|execut|perform': [
        "Execute {process} following established procedures and standards. Monitor outcomes and identify improvements.",
        "Perform {task} systematically, applying {methodology} to ensure quality and consistency.",
    ],

    # Default
    'default': [
        "Apply expertise in {skill_domain} to {action} effectively. Adapt approaches based on context and requirements.",
        "Demonstrate proficiency in {skill_domain} through {action}, ensuring quality outcomes.",
    ]
}

def categorize_skill(skill_name: str, l3_name: str) -> str:
    """Determine skill category for description template selection."""
    name_lower = skill_name.lower()

    for pattern, _ in DESCRIPTION_TEMPLATES.items():
        if pattern == 'default':
            continue
        if re.search(pattern, name_lower) or re.search(pattern, l3_name.lower()):
            return pattern

    return 'default'

def generate_description(skill: Dict) -> str:
    """Generate a 1-2 sentence description for a skill based on ESCO/O*NET patterns."""
    name = skill['name']
    l3_name = skill['l3_name']
    l2_name = skill['l2_name']

    # Remove generic prefixes/suffixes for cleaner descriptions
    clean_name = re.sub(r'^(Basic|Advanced|Intermediate|Applied|General)\s+', '', name, flags=re.IGNORECASE)
    clean_name = re.sub(r'\s+(in|for|with|across)\s+\w+$', '', clean_name)

    # Extract verb and object
    parts = clean_name.split()
    verb = parts[0] if parts else "work"
    object_phrase = ' '.join(parts[1:]) if len(parts) > 1 else l3_name

    # Category-specific description
    category = categorize_skill(name, l3_name)

    if 'communication' in name.lower() or 'communication' in l3_name.lower():
        if 'verbal' in name.lower():
            return f"Communicate ideas, information, and feedback verbally to varied audiences. Adapt tone, language, and delivery method based on context and listener needs."
        elif 'written' in name.lower():
            return f"Compose clear, concise written content for {l2_name.lower()} purposes. Tailor style, tone, and format to audience and communication objectives."
        elif 'presentation' in name.lower():
            return f"Deliver structured presentations that engage audiences and convey key messages effectively. Use visual aids and storytelling techniques to enhance understanding."
        else:
            return f"Exchange information and ideas through {clean_name.lower()}, ensuring mutual understanding and effective collaboration."

    elif any(word in name.lower() for word in ['manage', 'lead', 'coordinate', 'oversee']):
        return f"Plan, direct, and monitor {object_phrase} to achieve organizational objectives. Allocate resources, track progress, and make adjustments to ensure successful outcomes."

    elif any(word in name.lower() for word in ['analy', 'assess', 'evaluat', 'review']):
        return f"Examine and interpret {object_phrase} using systematic methods to identify patterns, insights, or issues. Apply analytical frameworks to support data-driven decision-making."

    elif any(word in name.lower() for word in ['design', 'create', 'develop', 'build']):
        return f"Design and develop {object_phrase} that meet specified requirements and quality standards. Apply creative and technical expertise to deliver effective solutions."

    elif any(word in name.lower() for word in ['program', 'code', 'script', 'software']):
        return f"Write, test, and maintain code for {object_phrase}. Follow coding standards and best practices to ensure functionality, security, and maintainability."

    elif any(word in name.lower() for word in ['test', 'quality', 'qa', 'qc']):
        return f"Verify that {object_phrase} meet quality standards and functional requirements. Identify defects, document findings, and collaborate on resolution."

    elif any(word in name.lower() for word in ['train', 'teach', 'mentor', 'coach']):
        return f"Provide instruction and guidance on {object_phrase} to enhance knowledge and skill development. Adapt teaching methods to learner needs and assess progress."

    elif any(word in name.lower() for word in ['plan', 'schedule', 'organize']):
        return f"Develop and maintain plans for {object_phrase}, coordinating timelines, resources, and dependencies. Monitor execution and adjust as needed to meet objectives."

    else:
        # Generic description based on L3
        return f"Apply knowledge and techniques related to {clean_name.lower()} in {l2_name.lower()} contexts. Adapt methods based on specific requirements and constraints."

def generate_examples(skill: Dict) -> List[str]:
    """Generate 2-3 concrete examples of skill application."""
    name = skill['name']
    l2_name = skill['l2_name']
    l3_name = skill['l3_name']

    examples = []

    # Context-specific examples
    if 'communication' in l3_name.lower():
        examples = [
            "Daily team stand-ups and updates",
            "Client presentations and meetings",
            "Documentation and knowledge sharing"
        ]
    elif 'management' in l2_name.lower() or 'leadership' in l2_name.lower():
        examples = [
            "Project planning and execution",
            "Team coordination and delegation",
            "Performance monitoring and feedback"
        ]
    elif 'analysis' in name.lower() or 'data' in l2_name.lower():
        examples = [
            "Data collection and processing",
            "Pattern identification and insights",
            "Report generation and visualization"
        ]
    elif 'design' in name.lower():
        examples = [
            "Requirements gathering and analysis",
            "Prototype development and testing",
            "Iterative refinement based on feedback"
        ]
    elif 'programming' in l2_name.lower() or 'software' in l2_name.lower():
        examples = [
            "Feature development and implementation",
            "Code review and refactoring",
            "Debugging and troubleshooting"
        ]
    else:
        # Generic examples
        examples = [
            f"Applying {l3_name.lower()} in daily work",
            f"Problem-solving using {l3_name.lower()}",
            f"Continuous improvement of {l3_name.lower()} practices"
        ]

    return examples[:2]  # Return 2 examples

def find_related_skills(skill: Dict, all_skills: List[Dict]) -> List[str]:
    """Find 3-5 related skills within the same L3 or related L3."""
    skill_l3 = skill['l3_name']
    skill_l2 = skill['l2_name']
    skill_name = skill['name']

    related = []

    # Same L3, different skills
    same_l3_skills = [
        s['name'] for s in all_skills
        if s['l3_name'] == skill_l3 and s['name'] != skill_name
    ]

    if len(same_l3_skills) >= 3:
        related.extend(same_l3_skills[:3])
    else:
        related.extend(same_l3_skills)

        # Add from same L2 if needed
        same_l2_skills = [
            s['name'] for s in all_skills
            if s['l2_name'] == skill_l2 and s['name'] != skill_name and s['name'] not in related
        ]
        related.extend(same_l2_skills[:5-len(related)])

    return related[:5]

def clean_skill_name(name: str) -> str:
    """Clean skill name by removing proficiency levels and generic prefixes."""
    # Remove proficiency levels
    cleaned = re.sub(r'^(Basic|Intermediate|Advanced|Expert|Master|Foundational)\s+', '', name, flags=re.IGNORECASE)

    # Remove redundant scale words (but keep if meaningful)
    # "Small-scale planning" → "Planning" but "Large-scale architecture" → keep for now
    # This needs manual review, so we'll flag it but not auto-remove

    return cleaned.strip()

def enhance_skills(skills: List[Dict]) -> List[Dict]:
    """Enhance all skills with descriptions, examples, and related skills."""
    enhanced = []
    skipped = 0
    added = 0

    print(f"Enhancing {len(skills)} skills...")

    for i, skill in enumerate(skills):
        if i % 1000 == 0 and i > 0:
            print(f"  Processed {i}/{len(skills)}... (enhanced: {added}, skipped: {skipped})")

        # Skip if already has description
        if skill.get('description') and skill.get('examples') and len(skill.get('examples', [])) > 0:
            enhanced.append(skill)
            skipped += 1
            continue

        added += 1

        # Clean name
        original_name = skill['name']
        cleaned_name = clean_skill_name(original_name)

        # Generate description
        description = generate_description(skill)

        # Generate examples
        examples = generate_examples(skill)

        # Find related skills (we'll do this in a second pass for efficiency)
        # related_skills = find_related_skills(skill, skills)

        enhanced_skill = {
            **skill,
            'canonical_name': cleaned_name,
            'original_name': original_name if cleaned_name != original_name else None,
            'description': description,
            'examples': examples,
            'related_skills': [],  # Will populate in second pass
            'aliases': [],  # To be populated later
            'version': '2.0.0',
            'updated_at': datetime.now().isoformat()
        }

        enhanced.append(enhanced_skill)

    # Second pass: add related skills
    print("  Adding related skills...")
    for skill in enhanced:
        skill['related_skills'] = find_related_skills(skill, enhanced)

    return enhanced

def main():
    print("=" * 60)
    print("EXPERTISE ATLAS - SKILL ENHANCEMENT")
    print("=" * 60)
    print()

    # Load current skills
    import sys
    input_path = sys.argv[1] if len(sys.argv) > 1 else '/Users/yuriibakurov/proofound/data/expertise-atlas-20k-l4-final.json'
    print(f"Loading skills from {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    skills = data['skills']
    print(f"✅ Loaded {len(skills)} skills\n")

    # Enhance skills
    enhanced_skills = enhance_skills(skills)
    print(f"✅ Enhanced all {len(enhanced_skills)} skills\n")

    # Update metadata
    output_data = {
        'metadata': {
            **data['metadata'],
            'version': '2.0.0',
            'enhanced_at': datetime.now().isoformat(),
            'enhancements': [
                'Added descriptions (1-2 sentences)',
                'Added examples (2 per skill)',
                'Added related skills (3-5 per skill)',
                'Cleaned skill names (removed proficiency levels)',
                'Prepared for synonym/alias system'
            ]
        },
        'skills': enhanced_skills
    }

    # Write enhanced skills
    import sys
    output_path = sys.argv[2] if len(sys.argv) > 2 else '/Users/yuriibakurov/proofound/data/expertise-atlas-l4-enhanced.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Wrote enhanced skills to {output_path}\n")

    # Generate summary report
    print("=" * 60)
    print("ENHANCEMENT SUMMARY")
    print("=" * 60)
    print(f"Total skills: {len(enhanced_skills)}")
    print(f"Skills with descriptions: {sum(1 for s in enhanced_skills if s.get('description'))}")
    print(f"Skills with examples: {sum(1 for s in enhanced_skills if s.get('examples'))}")
    print(f"Skills with related skills: {sum(1 for s in enhanced_skills if s.get('related_skills'))}")
    print(f"Skills with cleaned names: {sum(1 for s in enhanced_skills if s.get('canonical_name') != s.get('name'))}")
    print()

    # Sample enhanced skill
    sample = enhanced_skills[100]
    print("SAMPLE ENHANCED SKILL:")
    print(json.dumps({
        'name': sample['name'],
        'canonical_name': sample.get('canonical_name', sample['name']),
        'description': sample['description'],
        'examples': sample['examples'],
        'related_skills': sample['related_skills'][:3] if sample.get('related_skills') else [],
        'l3_name': sample['l3_name']
    }, indent=2))
    print()

    print("=" * 60)
    print("ENHANCEMENT COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
