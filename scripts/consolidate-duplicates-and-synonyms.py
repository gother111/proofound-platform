#!/usr/bin/env python3
"""
Consolidate duplicate and near-duplicate skills into canonical skills with aliases.
Based on LinkedIn's approach: ~9-10 aliases per canonical skill.
"""

import json
import re
import uuid
from datetime import datetime
from typing import List, Dict, Set, Tuple
from collections import defaultdict
from difflib import SequenceMatcher

def load_skills(file_path: str) -> Dict:
    """Load enhanced skills JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def normalize_name(name: str) -> str:
    """Normalize skill name for comparison."""
    # Lowercase
    normalized = name.lower().strip()

    # Remove proficiency levels
    normalized = re.sub(r'\b(basic|intermediate|advanced|expert|master|foundational)\b', '', normalized)

    # Remove scale words
    normalized = re.sub(r'\b(small-scale|medium-scale|large-scale|enterprise)\b', '', normalized)

    # Remove context phrases
    normalized = re.sub(r'\s+(in|for|with|across)\s+\w+$', '', normalized)

    # Collapse whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()

    return normalized

def similarity(s1: str, s2: str) -> float:
    """Calculate similarity between two strings."""
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()

def group_duplicates_and_synonyms(skills: List[Dict], threshold: float = 0.85) -> Dict[str, List[Dict]]:
    """
    Group skills into canonical skills with duplicates/synonyms.

    Strategy:
    1. Exact matches → merge
    2. High similarity (>85%) → synonyms
    3. Same normalized name → variants
    """
    print("Grouping duplicates and synonyms...")

    # Step 1: Group by normalized name
    normalized_groups = defaultdict(list)
    for skill in skills:
        # Use canonical_name if it exists, otherwise use name
        skill_name = skill.get('canonical_name', skill['name'])
        norm_name = normalize_name(skill_name)
        if norm_name:  # Skip empty normalized names
            normalized_groups[norm_name].append(skill)

    print(f"  Found {len(normalized_groups)} unique normalized names")

    # Step 2: Within each group, find the best canonical name
    canonical_map = {}  # canonical_id -> {canonical_skill, aliases: []}

    for norm_name, group_skills in normalized_groups.items():
        if len(group_skills) == 0:
            continue

        # Choose canonical skill (prefer shortest, most common name)
        canonical_skill = min(group_skills, key=lambda s: (
            len(s.get('canonical_name', s['name'])),  # Shortest
            -group_skills.count(s),     # Most common
        ))

        # Create canonical entry
        canonical_id = str(uuid.uuid4())
        canonical_name = canonical_skill.get('canonical_name', canonical_skill['name'])

        # Collect all unique names as aliases
        aliases = set()
        for s in group_skills:
            skill_canonical = s.get('canonical_name', s['name'])
            if skill_canonical != canonical_name:
                aliases.add(skill_canonical)
            if s.get('original_name') and s['original_name'] != canonical_name:
                aliases.add(s['original_name'])

            # Add name variations
            if s['name'] != canonical_name:
                aliases.add(s['name'])

        canonical_map[canonical_id] = {
            'canonical_skill': canonical_skill,
            'aliases': sorted(list(aliases)),
            'source_skills': group_skills
        }

    print(f"  Created {len(canonical_map)} canonical skills")

    # Step 3: Find cross-group synonyms (high similarity but different normalized names)
    print("  Finding cross-group synonyms...")
    canonical_names = {cid: data['canonical_skill'].get('canonical_name', data['canonical_skill']['name'])
                      for cid, data in canonical_map.items()}

    cross_group_synonyms = 0
    checked = set()

    canonical_ids = list(canonical_map.keys())
    merged_ids = set()  # Track merged IDs to skip them

    for i, cid1 in enumerate(canonical_ids):
        if cid1 in merged_ids:
            continue

        name1 = canonical_names.get(cid1)
        if not name1:
            continue

        for cid2 in canonical_ids[i+1:i+51]:  # Check next 50 to avoid O(n²)
            if cid2 == cid1 or cid2 in merged_ids or (cid1, cid2) in checked:
                continue

            name2 = canonical_names.get(cid2)
            if not name2:
                continue

            sim = similarity(name1, name2)

            if sim >= threshold:
                # Merge cid2 into cid1
                if cid2 in canonical_map:  # Double-check it still exists
                    canonical_map[cid1]['aliases'].extend(canonical_map[cid2]['aliases'])
                    canonical_map[cid1]['aliases'].append(name2)  # Add cid2's canonical as alias
                    canonical_map[cid1]['source_skills'].extend(canonical_map[cid2]['source_skills'])

                    # Remove cid2
                    del canonical_map[cid2]
                    merged_ids.add(cid2)
                    cross_group_synonyms += 1
                    checked.add((cid1, cid2))

        if i % 100 == 0 and i > 0:
            print(f"    Processed {i}/{len(canonical_ids)} canonical skills...")

    print(f"  Merged {cross_group_synonyms} cross-group synonyms")
    print(f"  Final canonical skills: {len(canonical_map)}")

    return canonical_map

def create_final_skills(canonical_map: Dict) -> List[Dict]:
    """Create final consolidated skills list with aliases."""
    final_skills = []

    for cid, data in canonical_map.items():
        skill = data['canonical_skill']
        aliases = list(set(data['aliases']))  # Unique aliases

        # Merge descriptions from all source skills (use canonical)
        # Merge examples (deduplicate)
        all_examples = set()
        for s in data['source_skills']:
            if s.get('examples'):
                all_examples.update(s['examples'])

        # Merge related skills
        all_related = set()
        for s in data['source_skills']:
            if s.get('related_skills'):
                all_related.update(s['related_skills'])

        final_skill = {
            'id': cid,
            'name': skill.get('canonical_name', skill['name']),
            'aliases': sorted(aliases)[:15],  # Cap at 15 aliases
            'description': skill.get('description', ''),
            'examples': sorted(list(all_examples))[:3],  # Top 3 examples
            'related_skills': sorted(list(all_related))[:5],  # Top 5 related
            'l1_code': skill['l1_code'],
            'l1_name': skill['l1_name'],
            'l2_code': skill['l2_code'],
            'l2_name': skill['l2_name'],
            'l3_name': skill['l3_name'],
            'version': '3.0.0',
            'created_at': skill.get('created_at', datetime.now().isoformat()),
            'updated_at': datetime.now().isoformat()
        }

        final_skills.append(final_skill)

    return sorted(final_skills, key=lambda s: (s['l1_code'], s['l2_code'], s['l3_name'], s['name']))

def generate_statistics(original_count: int, final_count: int, canonical_map: Dict) -> Dict:
    """Generate statistics about the consolidation."""
    total_aliases = sum(len(data['aliases']) for data in canonical_map.values())
    avg_aliases = total_aliases / len(canonical_map) if canonical_map else 0

    skills_with_aliases = sum(1 for data in canonical_map.values() if data['aliases'])

    alias_distribution = defaultdict(int)
    for data in canonical_map.values():
        count = len(data['aliases'])
        if count == 0:
            alias_distribution['0'] += 1
        elif count <= 3:
            alias_distribution['1-3'] += 1
        elif count <= 6:
            alias_distribution['4-6'] += 1
        elif count <= 10:
            alias_distribution['7-10'] += 1
        else:
            alias_distribution['10+'] += 1

    return {
        'original_skills': original_count,
        'canonical_skills': final_count,
        'reduction': original_count - final_count,
        'reduction_pct': ((original_count - final_count) / original_count) * 100,
        'total_aliases': total_aliases,
        'avg_aliases_per_skill': avg_aliases,
        'skills_with_aliases': skills_with_aliases,
        'alias_distribution': dict(alias_distribution),
        'total_searchable_terms': final_count + total_aliases
    }

def main():
    print("=" * 60)
    print("EXPERTISE ATLAS - DUPLICATE & SYNONYM CONSOLIDATION")
    print("=" * 60)
    print()

    # Load enhanced skills
    import sys
    input_path = sys.argv[1] if len(sys.argv) > 1 else '/Users/yuriibakurov/proofound/data/expertise-atlas-l4-enhanced.json'
    print(f"Loading skills from {input_path}...")
    data = load_skills(input_path)
    skills = data['skills']
    original_count = len(skills)
    print(f"✅ Loaded {original_count} skills\n")

    # Group duplicates and synonyms
    import sys
    threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.85
    print(f"Using similarity threshold: {threshold:.0%}\n")
    canonical_map = group_duplicates_and_synonyms(skills, threshold=threshold)
    print()

    # Create final consolidated skills
    print("Creating final consolidated skills...")
    final_skills = create_final_skills(canonical_map)
    final_count = len(final_skills)
    print(f"✅ Created {final_count} canonical skills\n")

    # Generate statistics
    stats = generate_statistics(original_count, final_count, canonical_map)

    # Prepare output
    output_data = {
        'metadata': {
            **data['metadata'],
            'version': '3.0.0',
            'consolidated_at': datetime.now().isoformat(),
            'consolidation_stats': stats,
            'description': 'Expertise Atlas - Consolidated L4 Skills with Synonyms',
            'note': 'Duplicates and near-duplicates merged. Each canonical skill includes aliases for searchability.'
        },
        'skills': final_skills
    }

    # Write output
    output_path = sys.argv[3] if len(sys.argv) > 3 else '/Users/yuriibakurov/proofound/data/expertise-atlas-l4-consolidated.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Wrote consolidated skills to {output_path}\n")

    # Print statistics
    print("=" * 60)
    print("CONSOLIDATION STATISTICS")
    print("=" * 60)
    print(f"Original skills:        {stats['original_skills']:,}")
    print(f"Canonical skills:       {stats['canonical_skills']:,}")
    print(f"Skills removed:         {stats['reduction']:,} (-{stats['reduction_pct']:.1f}%)")
    print(f"Total aliases:          {stats['total_aliases']:,}")
    print(f"Avg aliases per skill:  {stats['avg_aliases_per_skill']:.1f}")
    print(f"Skills with aliases:    {stats['skills_with_aliases']:,} ({stats['skills_with_aliases']/stats['canonical_skills']*100:.1f}%)")
    print(f"Total searchable terms: {stats['total_searchable_terms']:,}")
    print()
    print("Alias Distribution:")
    for range_name, count in sorted(stats['alias_distribution'].items()):
        print(f"  {range_name} aliases: {count:,} skills")
    print()

    # Sample skills with aliases
    print("SAMPLE CONSOLIDATED SKILLS:")
    samples = [s for s in final_skills if len(s['aliases']) >= 3][:5]
    for i, skill in enumerate(samples, 1):
        print(f"\n{i}. {skill['name']}")
        print(f"   Aliases ({len(skill['aliases'])}): {', '.join(skill['aliases'][:5])}" +
              (f" ... +{len(skill['aliases'])-5} more" if len(skill['aliases']) > 5 else ""))
        print(f"   L3: {skill['l3_name']}")

    print()
    print("=" * 60)
    print("CONSOLIDATION COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
