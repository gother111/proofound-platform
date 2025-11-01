#!/usr/bin/env python3
"""
Analyze Expertise Atlas L4 skills for quality issues.
Identifies duplicates, near-duplicates, inconsistencies, and provides recommendations.
"""

import json
import re
from collections import defaultdict, Counter
from difflib import SequenceMatcher
from typing import List, Dict, Set, Tuple

def load_skills(file_path: str) -> Dict:
    """Load skills JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def exact_duplicates(skills: List[Dict]) -> Dict[str, List[Dict]]:
    """Find exact duplicate skill names."""
    name_map = defaultdict(list)
    for skill in skills:
        name_map[skill['name'].lower().strip()].append(skill)

    # Return only duplicates
    return {name: entries for name, entries in name_map.items() if len(entries) > 1}

def near_duplicates(skills: List[Dict], threshold: float = 0.90) -> List[Tuple]:
    """Find near-duplicate skills using Levenshtein distance."""
    pairs = []
    skill_names = [(i, skill['name']) for i, skill in enumerate(skills)]

    print(f"Analyzing {len(skill_names)} skills for near-duplicates...")

    for i, (idx1, name1) in enumerate(skill_names):
        if i % 1000 == 0:
            print(f"  Processed {i}/{len(skill_names)}...")

        for idx2, name2 in skill_names[i+1:i+100]:  # Check next 100 to avoid O(n²)
            if idx1 == idx2:
                continue

            # Calculate similarity
            similarity = SequenceMatcher(None, name1.lower(), name2.lower()).ratio()

            if similarity >= threshold:
                pairs.append({
                    'skill1': name1,
                    'skill2': name2,
                    'similarity': similarity,
                    'idx1': idx1,
                    'idx2': idx2
                })

    return sorted(pairs, key=lambda x: x['similarity'], reverse=True)

def naming_pattern_analysis(skills: List[Dict]) -> Dict:
    """Analyze naming patterns and inconsistencies."""
    patterns = {
        'starts_with_gerund': 0,  # "Managing", "Leading"
        'starts_with_noun': 0,     # "Team management", "Leadership"
        'contains_proficiency': 0,  # "Basic", "Advanced", "Intermediate"
        'contains_scale': 0,        # "Small-scale", "Large-scale"
        'contains_context': 0,      # "in Technology", "for Teams"
        'very_generic': 0,          # "Basic X", "Applied X"
        'too_long': 0,              # >8 words
        'too_short': 0,             # 1 word
        'inconsistent_caps': 0,     # Mixed capitalization
    }

    proficiency_words = ['basic', 'intermediate', 'advanced', 'expert', 'master', 'foundational']
    scale_words = ['small-scale', 'medium-scale', 'large-scale', 'enterprise']
    context_patterns = [' in ', ' for ', ' with ', ' across ']
    generic_prefixes = ['basic ', 'applied ', 'general ']

    examples = defaultdict(list)

    for skill in skills:
        name = skill['name']
        name_lower = name.lower()

        # Gerund vs noun start
        if name_lower.endswith('ing ') or name.split()[0].endswith('ing'):
            patterns['starts_with_gerund'] += 1

        # Proficiency level in name
        if any(word in name_lower for word in proficiency_words):
            patterns['contains_proficiency'] += 1
            examples['proficiency'].append(name)

        # Scale words
        if any(word in name_lower for word in scale_words):
            patterns['contains_scale'] += 1
            examples['scale'].append(name)

        # Context phrases
        if any(pattern in name_lower for pattern in context_patterns):
            patterns['contains_context'] += 1
            examples['context'].append(name[:3])  # First 3 as sample

        # Generic prefixes
        if any(name_lower.startswith(prefix) for prefix in generic_prefixes):
            patterns['very_generic'] += 1
            examples['generic'].append(name)

        # Length issues
        word_count = len(name.split())
        if word_count > 8:
            patterns['too_long'] += 1
            examples['too_long'].append(name)
        elif word_count == 1:
            patterns['too_short'] += 1
            examples['too_short'].append(name)

        # Capitalization
        if name != name.lower() and name != name.title():
            patterns['inconsistent_caps'] += 1

    return {'patterns': patterns, 'examples': dict(examples)}

def l3_distribution_analysis(skills: List[Dict]) -> Dict:
    """Analyze distribution of skills across L3 subcategories."""
    l3_counts = Counter(skill['l3_name'] for skill in skills)

    stats = {
        'total_l3': len(l3_counts),
        'avg_skills_per_l3': sum(l3_counts.values()) / len(l3_counts),
        'max_skills_l3': max(l3_counts.values()),
        'min_skills_l3': min(l3_counts.values()),
        'top_10_l3': l3_counts.most_common(10),
        'bottom_10_l3': l3_counts.most_common()[-10:],
    }

    return stats

def l1_domain_analysis(skills: List[Dict]) -> Dict:
    """Analyze quality metrics by L1 domain."""
    domain_stats = defaultdict(lambda: {
        'total': 0,
        'unique_l3': set(),
        'avg_name_length': [],
        'has_proficiency': 0,
        'has_scale': 0,
    })

    for skill in skills:
        l1 = skill['l1_code']
        domain_stats[l1]['total'] += 1
        domain_stats[l1]['unique_l3'].add(skill['l3_name'])
        domain_stats[l1]['avg_name_length'].append(len(skill['name']))

        if any(word in skill['name'].lower() for word in ['basic', 'intermediate', 'advanced']):
            domain_stats[l1]['has_proficiency'] += 1

        if any(word in skill['name'].lower() for word in ['small-scale', 'large-scale']):
            domain_stats[l1]['has_scale'] += 1

    # Calculate averages
    for l1, stats in domain_stats.items():
        stats['avg_name_length'] = sum(stats['avg_name_length']) / len(stats['avg_name_length'])
        stats['unique_l3'] = len(stats['unique_l3'])

    return dict(domain_stats)

def generate_report(data: Dict) -> str:
    """Generate markdown report."""
    report = """# Expertise Atlas L4 Skills - Quality Analysis Report
_Generated: 2025-10-31_

## Executive Summary

Total Skills Analyzed: {total_skills}

### Critical Issues Found

| Issue | Count | Percentage | Severity |
|-------|-------|------------|----------|
| Exact Duplicates | {exact_dupes} | {exact_dupes_pct:.1f}% | 🔴 HIGH |
| Near-Duplicates (>90% similar) | {near_dupes} | {near_dupes_pct:.1f}% | 🟡 MEDIUM |
| Contains Proficiency Levels | {proficiency} | {proficiency_pct:.1f}% | 🔴 HIGH |
| Contains Scale Words | {scale} | {scale_pct:.1f}% | 🟡 MEDIUM |
| Contains Context Phrases | {context} | {context_pct:.1f}% | 🟡 MEDIUM |
| Too Generic | {generic} | {generic_pct:.1f}% | 🟡 MEDIUM |
| Too Long (>8 words) | {too_long} | {too_long_pct:.1f}% | 🟢 LOW |

---

## 1. Exact Duplicates

**Found {exact_dupes} exact duplicate skill names.**

### Top Duplicates:
{dup_examples}

**Recommendation**: Merge these into single skills with canonical names.

---

## 2. Near-Duplicates (Synonyms)

**Found {near_dupes} pairs of skills with >90% similarity.**

### Examples:
{near_dup_examples}

**Recommendation**: Review for consolidation. Create synonym/alias system.

---

## 3. Naming Pattern Issues

### Proficiency Levels in Names ❌
**Count**: {proficiency} skills ({proficiency_pct:.1f}%)

**Examples**:
{proficiency_examples}

**Issue**: Proficiency is a separate attribute (level 1-5), not part of skill name.
**Action**: Rename to remove proficiency qualifiers.

---

### Scale Words in Names ⚠️
**Count**: {scale} skills ({scale_pct:.1f}%)

**Examples**:
{scale_examples}

**Issue**: "Small-scale", "Large-scale" may be valid in some cases but creates redundancy.
**Action**: Review if scale is truly a different skill or just application context.

---

### Context Phrases ⚠️
**Count**: {context} skills ({context_pct:.1f}%)

**Pattern**: Skills ending with "in [Industry]", "for [Audience]", "with [Tool]"

**Issue**: Context should be captured in skill usage/application, not name.
**Action**: Create base skill + track context separately.

---

## 4. Distribution Analysis

### Skills per L3 Subcategory

- **Total L3 Categories**: {total_l3}
- **Average Skills per L3**: {avg_per_l3:.1f}
- **Max Skills in Single L3**: {max_l3} ({max_l3_name})
- **Min Skills in Single L3**: {min_l3} ({min_l3_name})

### Top 10 L3 with Most Skills:
{top_l3}

### Bottom 10 L3 with Fewest Skills:
{bottom_l3}

**Analysis**: Distribution is fairly even ({avg_per_l3:.0f} skills per L3).

---

## 5. L1 Domain Analysis

{domain_analysis}

---

## 6. Recommendations Priority

### 🔴 URGENT (Week 1)
1. **Remove proficiency levels from names** ({proficiency} skills)
   - "Verbal communication - Intermediate" → "Verbal communication"

2. **Merge exact duplicates** ({exact_dupes} duplicates)
   - Consolidate to single canonical skill

3. **Create synonym system**
   - Design skill_aliases table
   - Map near-duplicates to canonical skills

### 🟡 HIGH PRIORITY (Week 2)
4. **Standardize naming conventions**
   - Verb-first: "Managing logistics" → "Manage logistics"
   - Remove context suffixes: "X in Technology" → "X" (+ metadata)

5. **Add descriptions**
   - Generate 1-2 sentence descriptions for all skills
   - Based on ESCO/O*NET patterns

### 🟢 MEDIUM PRIORITY (Week 3-4)
6. **Add alternative labels**
   - 5-7 synonyms per skill
   - Improves search discoverability

7. **Link related skills**
   - Within same L3
   - Cross-L3 relationships

---

## 7. Estimated Impact

After fixes:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total Skills | {total_skills} | ~{after_total} | {reduction:.1f}% reduction |
| Duplicates | {total_dupes} | <50 | {dup_improvement:.1f}% |
| Searchable Terms | {total_skills} | ~{searchable} | {searchability:.1f}% increase |
| Skills with Descriptions | 0 | {after_total} | 100% |
| Skills with Aliases | 0 | {after_total} | 100% |

---

## Next Steps

1. Run consolidation script
2. Generate descriptions (AI-assisted)
3. Create synonym mappings
4. Update database schema
5. Deploy enhanced dataset

**END OF REPORT**
"""

    return report

def main():
    print("=" * 60)
    print("EXPERTISE ATLAS L4 SKILLS - QUALITY ANALYSIS")
    print("=" * 60)
    print()

    # Load skills
    file_path = '/Users/yuriibakurov/proofound/data/expertise-atlas-20k-l4-final.json'
    print(f"Loading skills from {file_path}...")
    data = load_skills(file_path)
    skills = data['skills']
    total_skills = len(skills)
    print(f"✅ Loaded {total_skills} skills\n")

    # Analysis 1: Exact duplicates
    print("1️⃣  Finding exact duplicates...")
    exact_dups = exact_duplicates(skills)
    print(f"   Found {len(exact_dups)} duplicate names\n")

    # Analysis 2: Near duplicates
    print("2️⃣  Finding near-duplicates (this may take a minute)...")
    near_dups = near_duplicates(skills, threshold=0.90)
    print(f"   Found {len(near_dups)} near-duplicate pairs\n")

    # Analysis 3: Naming patterns
    print("3️⃣  Analyzing naming patterns...")
    patterns = naming_pattern_analysis(skills)
    print(f"   Analyzed {total_skills} skill names\n")

    # Analysis 4: L3 distribution
    print("4️⃣  Analyzing L3 distribution...")
    l3_stats = l3_distribution_analysis(skills)
    print(f"   {l3_stats['total_l3']} L3 categories\n")

    # Analysis 5: L1 domain analysis
    print("5️⃣  Analyzing L1 domains...")
    l1_stats = l1_domain_analysis(skills)
    print(f"   Analyzed {len(l1_stats)} domains\n")

    # Generate report
    print("📊 Generating report...")

    # Calculate metrics for report
    report_data = {
        'total_skills': total_skills,
        'exact_dupes': len(exact_dups),
        'exact_dupes_pct': (len(exact_dups) / total_skills) * 100,
        'near_dupes': len(near_dups),
        'near_dupes_pct': (len(near_dups) / total_skills) * 100,
        'proficiency': patterns['patterns']['contains_proficiency'],
        'proficiency_pct': (patterns['patterns']['contains_proficiency'] / total_skills) * 100,
        'scale': patterns['patterns']['contains_scale'],
        'scale_pct': (patterns['patterns']['contains_scale'] / total_skills) * 100,
        'context': patterns['patterns']['contains_context'],
        'context_pct': (patterns['patterns']['contains_context'] / total_skills) * 100,
        'generic': patterns['patterns']['very_generic'],
        'generic_pct': (patterns['patterns']['very_generic'] / total_skills) * 100,
        'too_long': patterns['patterns']['too_long'],
        'too_long_pct': (patterns['patterns']['too_long'] / total_skills) * 100,

        # Examples
        'dup_examples': '\n'.join([f"- \"{name}\" ({len(entries)} times)" for name, entries in list(exact_dups.items())[:10]]),
        'near_dup_examples': '\n'.join([f"- \"{pair['skill1']}\" ↔ \"{pair['skill2']}\" ({pair['similarity']:.2%})" for pair in near_dups[:15]]),
        'proficiency_examples': '\n'.join([f"- {ex}" for ex in patterns['examples'].get('proficiency', [])[:10]]),
        'scale_examples': '\n'.join([f"- {ex}" for ex in patterns['examples'].get('scale', [])[:10]]),

        # Distribution
        'total_l3': l3_stats['total_l3'],
        'avg_per_l3': l3_stats['avg_skills_per_l3'],
        'max_l3': l3_stats['max_skills_l3'],
        'max_l3_name': l3_stats['top_10_l3'][0][0],
        'min_l3': l3_stats['min_skills_l3'],
        'min_l3_name': l3_stats['bottom_10_l3'][0][0],
        'top_l3': '\n'.join([f"{i+1}. {name}: {count} skills" for i, (name, count) in enumerate(l3_stats['top_10_l3'])]),
        'bottom_l3': '\n'.join([f"{i+1}. {name}: {count} skills" for i, (name, count) in enumerate(l3_stats['bottom_10_l3'])]),

        # Domain analysis
        'domain_analysis': '\n'.join([
            f"### {code} - {data['total']} skills\n"
            f"- L3 categories: {data['unique_l3']}\n"
            f"- Avg name length: {data['avg_name_length']:.1f} chars\n"
            f"- With proficiency: {data['has_proficiency']} ({(data['has_proficiency']/data['total'])*100:.1f}%)\n"
            for code, data in sorted(l1_stats.items())
        ]),

        # Estimates
        'total_dupes': len(exact_dups) + len(near_dups),
        'after_total': total_skills - len(exact_dups) - int(len(near_dups) * 0.5),  # Conservative
        'reduction': ((len(exact_dups) + len(near_dups) * 0.5) / total_skills) * 100,
        'searchable': (total_skills - len(exact_dups)) + (total_skills * 5),  # +5 aliases per skill
        'searchability': 500,  # 5x with aliases
        'dup_improvement': ((len(exact_dups) + len(near_dups) - 50) / (len(exact_dups) + len(near_dups))) * 100,
    }

    report = generate_report(report_data)

    # Write report
    output_path = '/Users/yuriibakurov/proofound/QUALITY_ANALYSIS_REPORT.md'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"✅ Report written to {output_path}")
    print()

    # Write detailed JSON output
    detailed_output = {
        'summary': report_data,
        'exact_duplicates': {name: [s['name'] for s in entries] for name, entries in exact_dups.items()},
        'near_duplicates': near_dups[:100],  # Top 100
        'naming_patterns': patterns,
        'l3_distribution': l3_stats,
        'l1_analysis': l1_stats
    }

    json_output_path = '/Users/yuriibakurov/proofound/data/skill-quality-analysis.json'
    with open(json_output_path, 'w', encoding='utf-8') as f:
        json.dump(detailed_output, f, indent=2, ensure_ascii=False)

    print(f"✅ Detailed JSON output: {json_output_path}")
    print()
    print("=" * 60)
    print("ANALYSIS COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
