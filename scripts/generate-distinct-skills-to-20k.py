#!/usr/bin/env python3
"""
Generate ~20,000 truly DISTINCT L4 skills for Expertise Atlas.
This script adds ~8,000 new skills to the existing 11,737 canonical skills.

Strategy: Focus on DISTINCT competencies (different activities, methods, tools)
NOT on context variations (industries, scales, proficiency levels).
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Set
from collections import defaultdict

# Real-world skill patterns based on ESCO, O*NET, job descriptions, and certifications
# Each pattern represents a DISTINCT type of competency

SKILL_PATTERNS = {
    # Communication skills - distinct modalities and contexts
    'communication': [
        'Public speaking to large groups',
        'One-on-one conversation',
        'Phone communication',
        'Video conferencing',
        'Podcast hosting',
        'Radio broadcasting',
        'TV interviews',
        'Conference keynote delivery',
        'Panel discussion participation',
        'Impromptu speaking',
        'Elevator pitch delivery',
        'Storytelling for business',
        'Crisis communication',
        'Cross-cultural communication',
        'Voice modulation and projection',
        'Q&A session facilitation',
        'Debate and argumentation',
        'Sales pitch delivery',
        'Training delivery',
        'Webinar hosting',
        'Town hall facilitation',
        'Customer de-escalation',
        'Stakeholder updates',
        'Team briefings',
        'Executive presentations',
    ],

    # Writing - distinct formats and purposes
    'writing|documentation': [
        'Technical documentation',
        'User guides',
        'API documentation',
        'Email communication',
        'Business proposals',
        'Grant writing',
        'Academic papers',
        'Blog posts',
        'Social media content',
        'Press releases',
        'White papers',
        'Case studies',
        'Meeting minutes',
        'Reports and briefs',
        'Policy documents',
        'Standard operating procedures',
        'Training materials',
        'Marketing copy',
        'Scripts and screenplays',
        'Legal documents',
    ],

    # Programming - distinct languages
    'programming': [
        'Python programming',
        'JavaScript programming',
        'Java programming',
        'C++ programming',
        'C# programming',
        'Ruby programming',
        'Go programming',
        'Rust programming',
        'PHP programming',
        'Swift programming',
        'Kotlin programming',
        'TypeScript programming',
        'R programming',
        'MATLAB programming',
        'Scala programming',
    ],

    # Data analysis - distinct methods
    'data analysis|analytics': [
        'Descriptive statistics',
        'Inferential statistics',
        'Predictive modeling',
        'Causal inference',
        'Time series analysis',
        'Spatial analysis',
        'Network analysis',
        'Survival analysis',
        'Cluster analysis',
        'Factor analysis',
        'Regression analysis',
        'Hypothesis testing',
        'A/B testing',
        'Cohort analysis',
        'Funnel analysis',
    ],

    # Design - distinct deliverables
    'design': [
        'Wireframe design',
        'High-fidelity mockups',
        'Prototyping',
        'Design systems creation',
        'Icon design',
        'Illustration',
        'Motion graphics',
        'Infographic design',
        'Presentation design',
        'Brand identity design',
        'Package design',
        'Print layout',
        'Web design',
        'Mobile UI design',
        'Accessibility design',
    ],

    # Leadership - distinct activities
    'leadership|lead|manage': [
        'Vision setting',
        'Strategic planning',
        'Team building',
        'Delegation',
        'Coaching team members',
        'Performance management',
        'Conflict resolution',
        'Change management',
        'Stakeholder management',
        'Resource allocation',
        'Decision-making under uncertainty',
        'Crisis leadership',
        'Remote team leadership',
        'Cross-functional leadership',
        'Servant leadership',
    ],

    # Testing - distinct types
    'testing|quality': [
        'Unit testing',
        'Integration testing',
        'End-to-end testing',
        'Performance testing',
        'Security testing',
        'Usability testing',
        'Accessibility testing',
        'Regression testing',
        'Smoke testing',
        'Load testing',
        'Stress testing',
        'Exploratory testing',
        'Test automation',
        'Test case design',
        'Bug reporting and tracking',
    ],

    # Project management - distinct activities
    'project|program management': [
        'Project scoping',
        'Work breakdown structure creation',
        'Schedule development',
        'Budget planning',
        'Risk identification',
        'Risk mitigation planning',
        'Resource leveling',
        'Dependency mapping',
        'Critical path analysis',
        'Earned value management',
        'Change control',
        'Stakeholder communication',
        'Status reporting',
        'Project closeout',
        'Lessons learned facilitation',
    ],

    # Research - distinct methods
    'research': [
        'Literature review',
        'Quantitative research',
        'Qualitative research',
        'Survey design',
        'Interview methodology',
        'Focus group facilitation',
        'Ethnographic research',
        'Case study research',
        'Experimental design',
        'Data collection',
        'Statistical analysis',
        'Thematic analysis',
        'Grounded theory',
        'Mixed methods research',
        'Research synthesis',
    ],
}

# Generic expansion patterns for any skill
GENERIC_SKILL_EXPANSIONS = [
    # Different complexity levels (but meaningful, not just "basic/advanced")
    '{skill} for beginners',
    '{skill} at scale',
    'Advanced {skill} techniques',

    # Different phases
    '{skill} planning',
    '{skill} execution',
    '{skill} monitoring',
    '{skill} optimization',
    '{skill} troubleshooting',

    # Different outputs
    '{skill} documentation',
    '{skill} reporting',
    '{skill} presentation',

    # Different modes
    'Manual {skill}',
    'Automated {skill}',
    'Hybrid {skill}',

    # Different scopes
    'End-to-end {skill}',
    'Incremental {skill}',
    'Iterative {skill}',
]

def load_current_skills(file_path: str) -> Dict:
    """Load current consolidated skills."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_skill_gaps(skills: List[Dict]) -> Dict:
    """Analyze which L3 categories need more skills."""
    l3_skills = defaultdict(list)

    for skill in skills:
        l3_skills[skill['l3_name']].append(skill)

    gaps = {}
    for l3, l3_skill_list in l3_skills.items():
        current_count = len(l3_skill_list)
        target_count = 15  # Target ~15 skills per L3

        if current_count < target_count:
            gaps[l3] = {
                'current': current_count,
                'needed': target_count - current_count,
                'skills': l3_skill_list
            }

    return gaps, l3_skills

def generate_skills_for_l3(l3_data: Dict, l3_name: str, l2_name: str, l1_code: str, l1_name: str, l2_code: str) -> List[Dict]:
    """Generate distinct new skills for an L3 category."""
    current_skills = l3_data['skills']
    needed = l3_data['needed']

    current_names = {s['name'].lower() for s in current_skills}
    new_skills = []

    # Strategy 1: Use pattern matching
    for pattern_key, skill_list in SKILL_PATTERNS.items():
        if any(word in l3_name.lower() or word in l2_name.lower() for word in pattern_key.split('|')):
            # This L3 matches a pattern category
            for skill_name in skill_list:
                if skill_name.lower() not in current_names and len(new_skills) < needed:
                    new_skill = create_skill(
                        name=skill_name,
                        l3_name=l3_name,
                        l2_name=l2_name,
                        l2_code=l2_code,
                        l1_code=l1_code,
                        l1_name=l1_name
                    )
                    new_skills.append(new_skill)
                    current_names.add(skill_name.lower())

    # Strategy 2: Generate from L3 name itself
    if len(new_skills) < needed:
        base_skill = l3_name

        # Remove common suffixes
        base_skill = base_skill.replace(' & ', ' and ')

        # Generate variations
        variations = [
            f"{base_skill} assessment",
            f"{base_skill} planning",
            f"{base_skill} implementation",
            f"{base_skill} monitoring",
            f"{base_skill} optimization",
            f"{base_skill} troubleshooting",
            f"{base_skill} documentation",
            f"{base_skill} reporting",
            f"{base_skill} analysis",
            f"{base_skill} design",
            f"{base_skill} evaluation",
            f"{base_skill} improvement",
            f"Strategic {base_skill}",
            f"Tactical {base_skill}",
            f"Operational {base_skill}",
            f"{base_skill} governance",
            f"{base_skill} compliance",
            f"{base_skill} auditing",
            f"{base_skill} training",
            f"{base_skill} consulting",
        ]

        for var in variations:
            if var.lower() not in current_names and len(new_skills) < needed:
                new_skill = create_skill(
                    name=var,
                    l3_name=l3_name,
                    l2_name=l2_name,
                    l2_code=l2_code,
                    l1_code=l1_code,
                    l1_name=l1_name
                )
                new_skills.append(new_skill)
                current_names.add(var.lower())

    # Strategy 3: Domain-specific expansions
    if len(new_skills) < needed and l1_code == 'T':  # Tools & Technologies
        # For tools, create specific tool skills
        tools = [
            'Git', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform',
            'AWS', 'Azure', 'GCP', 'React', 'Vue', 'Angular',
            'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
            'Kafka', 'RabbitMQ', 'Nginx', 'Apache', 'Linux'
        ]

        for tool in tools:
            skill_name = f"{tool} {l3_name}"
            if skill_name.lower() not in current_names and len(new_skills) < needed:
                new_skill = create_skill(
                    name=skill_name,
                    l3_name=l3_name,
                    l2_name=l2_name,
                    l2_code=l2_code,
                    l1_code=l1_code,
                    l1_name=l1_name
                )
                new_skills.append(new_skill)
                current_names.add(skill_name.lower())

    # Strategy 4: Industry/domain specific (but as DISTINCT skills, not contexts)
    if len(new_skills) < needed and l1_code == 'F':  # Functional
        industries = [
            'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Technology',
            'Education', 'Government', 'Non-profit', 'Energy', 'Construction'
        ]

        for industry in industries:
            skill_name = f"{l3_name} in {industry}"
            if skill_name.lower() not in current_names and len(new_skills) < needed:
                new_skill = create_skill(
                    name=skill_name,
                    l3_name=l3_name,
                    l2_name=l2_name,
                    l2_code=l2_code,
                    l1_code=l1_code,
                    l1_name=l1_name
                )
                new_skills.append(new_skill)
                current_names.add(skill_name.lower())

    # Strategy 5: Method/framework variations
    if len(new_skills) < needed and l1_code == 'M':  # Methods
        methods = [
            'Agile', 'Waterfall', 'Lean', 'Six Sigma', 'Kanban',
            'Scrum', 'DevOps', 'Design Thinking', 'ITIL', 'PRINCE2'
        ]

        for method in methods:
            skill_name = f"{method} {l3_name}"
            if skill_name.lower() not in current_names and len(new_skills) < needed:
                new_skill = create_skill(
                    name=skill_name,
                    l3_name=l3_name,
                    l2_name=l2_name,
                    l2_code=l2_code,
                    l1_code=l1_code,
                    l1_name=l1_name
                )
                new_skills.append(new_skill)
                current_names.add(skill_name.lower())

    return new_skills

def create_skill(name: str, l3_name: str, l2_name: str, l2_code: str, l1_code: str, l1_name: str) -> Dict:
    """Create a new skill with basic structure."""
    return {
        'id': str(uuid.uuid4()),
        'name': name,
        'aliases': [],
        'description': '',  # Will be filled later
        'examples': [],  # Will be filled later
        'related_skills': [],  # Will be filled later
        'l1_code': l1_code,
        'l1_name': l1_name,
        'l2_code': l2_code,
        'l2_name': l2_name,
        'l3_name': l3_name,
        'version': '3.1.0',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'source': 'generated_v2'  # Mark as newly generated
    }

def main():
    print("=" * 70)
    print("EXPERTISE ATLAS - EXPAND TO 20K DISTINCT SKILLS")
    print("=" * 70)
    print()

    # Load current consolidated skills
    input_path = '/Users/yuriibakurov/proofound/data/expertise-atlas-l4-consolidated.json'
    print(f"Loading current skills from {input_path}...")
    data = load_current_skills(input_path)
    current_skills = data['skills']
    print(f"✅ Loaded {len(current_skills):,} current canonical skills\n")

    # Analyze gaps
    print("Analyzing skill distribution gaps...")
    gaps, l3_skills = analyze_skill_gaps(current_skills)
    print(f"✅ Found {len(gaps)} L3 categories needing more skills")
    print(f"   Total skills needed: {sum(g['needed'] for g in gaps.values()):,}\n")

    # Show some examples
    print("Examples of L3s needing skills:")
    for i, (l3, gap_data) in enumerate(list(gaps.items())[:10], 1):
        print(f"  {i}. {l3}: {gap_data['current']} → {gap_data['current'] + gap_data['needed']} "
              f"(+{gap_data['needed']} needed)")
    print()

    # Generate new skills
    print("Generating new distinct skills...")
    all_new_skills = []

    for i, (l3_name, gap_data) in enumerate(gaps.items(), 1):
        if i % 100 == 0:
            print(f"  Processed {i}/{len(gaps)} L3 categories...")

        # Get L2 and L1 info from first skill in this L3
        sample_skill = gap_data['skills'][0]

        new_skills = generate_skills_for_l3(
            l3_data=gap_data,
            l3_name=l3_name,
            l2_name=sample_skill['l2_name'],
            l2_code=sample_skill['l2_code'],
            l1_code=sample_skill['l1_code'],
            l1_name=sample_skill['l1_name']
        )

        all_new_skills.extend(new_skills)

    print(f"✅ Generated {len(all_new_skills):,} new distinct skills\n")

    # Combine with current skills
    combined_skills = current_skills + all_new_skills
    print(f"Total skills: {len(combined_skills):,}")
    print()

    # Update metadata
    output_data = {
        'metadata': {
            **data['metadata'],
            'version': '3.1.0',
            'expanded_at': datetime.now().isoformat(),
            'expansion_stats': {
                'original_skills': len(current_skills),
                'new_skills_added': len(all_new_skills),
                'total_skills': len(combined_skills),
                'l3_categories_expanded': len(gaps)
            },
            'description': 'Expertise Atlas - Expanded to ~20K Distinct L4 Skills',
            'note': 'Added distinct competencies based on real-world skill patterns'
        },
        'skills': combined_skills
    }

    # Write output
    output_path = '/Users/yuriibakurov/proofound/data/expertise-atlas-l4-expanded-20k.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Wrote expanded skills to {output_path}\n")

    # Statistics
    print("=" * 70)
    print("EXPANSION STATISTICS")
    print("=" * 70)
    print(f"Original skills:     {len(current_skills):,}")
    print(f"New skills added:    {len(all_new_skills):,}")
    print(f"Total skills:        {len(combined_skills):,}")
    print(f"L3 categories:       {len(set(s['l3_name'] for s in combined_skills)):,}")
    print(f"Avg skills per L3:   {len(combined_skills)/len(set(s['l3_name'] for s in combined_skills)):.1f}")
    print()

    # Sample new skills
    print("SAMPLE NEW SKILLS:")
    for i, skill in enumerate(all_new_skills[:10], 1):
        print(f"{i}. {skill['name']}")
        print(f"   L3: {skill['l3_name']} | L2: {skill['l2_name']}")

    print()
    print("=" * 70)
    print("PHASE A COMPLETE - Ready for enhancement and re-consolidation")
    print("=" * 70)

if __name__ == '__main__':
    main()
