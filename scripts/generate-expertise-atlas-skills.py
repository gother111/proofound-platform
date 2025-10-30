#!/usr/bin/env python3
"""
Expertise Atlas Skill Taxonomy Generator
Generates ~20,000 L4 skills across 6 L1 domains for MVP seeding
Based on: Expertise_Atlas_Product_Documentation_v3.md
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict

def generate_uuid():
    """Generate a UUID for database seeding"""
    return str(uuid.uuid4())

def create_l4_skills(count: int, prefix: str, skill_type: str) -> List[str]:
    """Helper to generate skill variations"""
    skills = []
    # This is a template - in production you'd have curated lists
    return skills

# =============================================================================
# L1: UNIVERSAL CAPABILITIES (U) - ~2,500 skills
# =============================================================================
UNIVERSAL_CAPABILITIES = {
    "code": "U",
    "name": "Universal Capabilities",
    "description": "Transferable cognitive, interpersonal, and personal effectiveness skills",
    "color": "#3B82F6",
    "l2_categories": [
        {
            "code": "U01",
            "name": "Critical Thinking & Problem Solving",
            "l3_subcategories": [
                {
                    "id": "u01_analytical",
                    "name": "Analytical Reasoning",
                    "l4_skills": [
                        "Root Cause Analysis", "Systems Thinking", "Hypothesis Testing",
                        "Data-Driven Decision Making", "Pattern Recognition", "Causal Analysis",
                        "Logical Reasoning", "Deductive Reasoning", "Inductive Reasoning",
                        "Abductive Reasoning", "Critical Analysis", "Problem Decomposition",
                        "Issue Identification", "Gap Analysis", "SWOT Analysis",
                        "Pareto Analysis", "5 Whys Technique", "Fishbone Diagrams",
                        "Decision Trees", "Cost-Benefit Analysis", "Risk-Reward Assessment",
                        "Trade-off Analysis", "Prioritization Matrices", "Impact Assessment",
                        "Feasibility Analysis", "Sensitivity Analysis", "Monte Carlo Analysis",
                        "Regression Analysis", "Correlation Analysis", "Variance Analysis",
                        "Time Series Analysis", "Cohort Analysis", "Funnel Analysis",
                        "Churn Analysis", "Retention Analysis", "Segmentation Analysis",
                        "Cluster Analysis", "Factor Analysis", "Principal Component Analysis",
                        "Discriminant Analysis", "Canonical Analysis", "Structural Equation Modeling"
                    ]
                },
                {
                    "id": "u01_creative",
                    "name": "Creative Problem Solving",
                    "l4_skills": [
                        "Brainstorming", "Lateral Thinking", "Design Thinking",
                        "SCAMPER Technique", "Mind Mapping", "Six Thinking Hats",
                        "TRIZ Methodology", "Reverse Engineering Problems", "Analogical Thinking",
                        "Metaphorical Thinking", "Bisociation", "Forced Connections",
                        "Random Input Technique", "Provocation Technique", "Challenge Assumptions",
                        "Reframing Problems", "Blue Ocean Strategy", "Disruptive Innovation",
                        "Ideation Facilitation", "Divergent Thinking", "Convergent Thinking",
                        "Prototyping Solutions", "Rapid Experimentation", "Fail-Fast Methodology",
                        "Iteration Cycles", "Innovation Games", "Crazy 8s", "Rose Thorn Bud",
                        "How Might We Questions", "Worst Possible Idea", "Rolestorming"
                    ]
                },
                {
                    "id": "u01_strategic",
                    "name": "Strategic Thinking",
                    "l4_skills": [
                        "Scenario Planning", "Future Forecasting", "Trend Analysis",
                        "Competitive Analysis", "Market Intelligence", "Strategic Foresight",
                        "Vision Development", "Mission Alignment", "Goal Setting (SMART)",
                        "OKR Development", "KPI Design", "Strategic Roadmapping",
                        "Portfolio Management", "Resource Allocation", "Capability Assessment",
                        "Ecosystem Mapping", "Value Chain Analysis", "Porter's Five Forces",
                        "Blue Ocean Canvas", "Business Model Innovation", "Strategic Positioning",
                        "Differentiation Strategy", "Integration Strategy", "Pivot Planning",
                        "Strategic Risk Management", "PESTEL Analysis", "Stakeholder Mapping",
                        "Theory of Change", "Logic Models", "Balanced Scorecard"
                    ]
                },
                {
                    "id": "u01_quantitative",
                    "name": "Quantitative Reasoning",
                    "l4_skills": [
                        "Statistical Thinking", "Probability Assessment", "Bayesian Reasoning",
                        "Expected Value Calculation", "Break-Even Analysis", "ROI Calculation",
                        "NPV Analysis", "IRR Calculation", "Payback Period Analysis",
                        "Profitability Index", "Unit Economics", "Contribution Margin",
                        "Gross Margin Analysis", "Operating Leverage", "Financial Ratios",
                        "Liquidity Ratios", "Solvency Ratios", "Efficiency Ratios",
                        "Market Valuation", "DCF Modeling", "Comparable Analysis",
                        "Precedent Transaction Analysis", "LBO Modeling", "Merger Modeling",
                        "Three Statement Modeling", "Revenue Forecasting", "Expense Forecasting",
                        "Cash Flow Forecasting", "Working Capital Management", "Capital Budgeting"
                    ]
                }
            ]
        },
        {
            "code": "U02",
            "name": "Communication & Collaboration",
            "l3_subcategories": [
                {
                    "id": "u02_verbal",
                    "name": "Verbal Communication",
                    "l4_skills": [
                        "Public Speaking", "Presentation Skills", "Storytelling",
                        "Persuasive Speaking", "Debate Skills", "Facilitation",
                        "Active Listening", "Empathetic Listening", "Questioning Techniques",
                        "Clarification Skills", "Voice Modulation", "Tone Management",
                        "Pace Control", "Articulation", "Enunciation",
                        "Conference Speaking", "Panel Discussion", "Podcast Hosting",
                        "Webinar Delivery", "Meeting Leadership", "Stand-up Presentations",
                        "Sales Pitching", "Elevator Pitches", "Interview Skills",
                        "Negotiation Dialogue", "Impromptu Speaking", "Q&A Handling",
                        "Heckler Management", "Stage Presence", "Microphone Technique"
                    ]
                },
                {
                    "id": "u02_written",
                    "name": "Written Communication",
                    "l4_skills": [
                        "Business Writing", "Technical Writing", "Report Writing",
                        "Proposal Writing", "Grant Writing", "Copywriting",
                        "Content Writing", "Blog Writing", "Email Etiquette",
                        "Memo Drafting", "Documentation", "Standard Operating Procedures (SOPs)",
                        "Policy Writing", "White Papers", "Case Studies",
                        "Executive Summaries", "Press Releases", "Marketing Copy",
                        "Social Media Writing", "Script Writing", "Academic Writing",
                        "Research Papers", "Editing & Proofreading", "Style Guide Adherence",
                        "Plain Language Writing", "Microcopy", "UX Writing",
                        "Error Messages", "Help Text", "Tooltips"
                    ]
                },
                {
                    "id": "u02_visual",
                    "name": "Visual Communication",
                    "l4_skills": [
                        "Data Visualization", "Infographic Design", "Slide Deck Design",
                        "Storyboarding", "Wireframing", "Mockup Creation",
                        "Diagram Creation", "Flowchart Design", "Mind Map Visualization",
                        "Dashboard Design", "Chart Selection", "Color Theory Application",
                        "Typography for Communication", "Layout Design", "Visual Hierarchy",
                        "Icon Design", "Illustration", "Photo Editing",
                        "Video Editing", "Animation for Explanation", "Meme Creation",
                        "Visual Storytelling", "Brand Visual Consistency", "Accessibility in Visual Design",
                        "Visual Metaphor Design", "Information Architecture", "User Flow Diagrams",
                        "Journey Maps", "Service Blueprints", "Swimlane Diagrams"
                    ]
                },
                {
                    "id": "u02_collaboration",
                    "name": "Team Collaboration",
                    "l4_skills": [
                        "Cross-functional Collaboration", "Remote Collaboration", "Asynchronous Communication",
                        "Synchronous Communication", "Conflict Resolution", "Consensus Building",
                        "Compromise", "Mediation", "Team Building",
                        "Trust Building", "Peer Feedback", "Constructive Criticism",
                        "Receiving Feedback", "Giving Feedback", "Code Review Etiquette",
                        "Pair Programming", "Mob Programming", "Workshop Facilitation",
                        "Retrospective Facilitation", "Daily Standup Leadership", "Knowledge Sharing",
                        "Mentoring", "Coaching", "Delegation",
                        "Accountability", "Psychological Safety Building", "Inclusive Meetings",
                        "Turn-Taking", "Amplification", "Credit Sharing"
                    ]
                },
                {
                    "id": "u02_intercultural",
                    "name": "Intercultural Communication",
                    "l4_skills": [
                        "Cultural Sensitivity", "Cultural Awareness", "Cross-cultural Communication",
                        "Global Mindset", "Inclusive Language", "Non-verbal Communication Awareness",
                        "Time Zone Management", "International Business Etiquette", "Multicultural Team Leadership",
                        "Translation Coordination", "Localization Awareness", "Religious Sensitivity",
                        "Gender Sensitivity", "Age Sensitivity", "Socioeconomic Sensitivity",
                        "Disability Awareness", "Neurodiversity Awareness", "LGBTQ+ Inclusivity",
                        "Racial Equity", "Implicit Bias Recognition", "Microaggression Awareness",
                        "Allyship", "Cultural Humility", "Adaptive Communication",
                        "Context Reading", "High-Context Communication", "Low-Context Communication",
                        "Polychronic Time Management", "Monochronic Time Management", "Face-Saving"
                    ]
                },
                {
                    "id": "u02_negotiation",
                    "name": "Negotiation & Persuasion",
                    "l4_skills": [
                        "Win-Win Negotiation", "Positional Bargaining", "Principled Negotiation",
                        "BATNA Development", "ZOPA Identification", "Anchoring",
                        "Framing", "Mirroring", "Labeling",
                        "Tactical Empathy", "Calibrated Questions", "Accusation Audit",
                        "Black Swan Discovery", "Reciprocity", "Social Proof",
                        "Authority", "Liking", "Scarcity",
                        "Consistency", "Unity", "Loss Aversion",
                        "Endowment Effect", "Sunk Cost Recognition", "Choice Architecture",
                        "Nudging", "Foot-in-the-Door", "Door-in-the-Face",
                        "Low-Ball Technique", "That's-Not-All", "Fear Appeals"
                    ]
                }
            ]
        },
        {
            "code": "U03",
            "name": "Leadership & Management",
            "l3_subcategories": [
                {
                    "id": "u03_people",
                    "name": "People Leadership",
                    "l4_skills": [
                        "Vision Casting", "Inspirational Leadership", "Servant Leadership",
                        "Transformational Leadership", "Authentic Leadership", "Situational Leadership",
                        "Coaching Leadership", "Democratic Leadership", "Laissez-faire Leadership",
                        "Team Motivation", "Employee Engagement", "Performance Management",
                        "Career Development Planning", "Succession Planning", "Talent Identification",
                        "One-on-One Meetings", "Skip-level Meetings", "360-Degree Feedback",
                        "Performance Reviews", "Goal Setting for Teams", "Recognition Programs",
                        "Reward Systems", "Difficult Conversations", "Termination Management",
                        "Onboarding", "Team Culture Building", "Psychological Safety",
                        "Vulnerability-based Trust", "Empowerment", "Autonomy Support"
                    ]
                },
                {
                    "id": "u03_project",
                    "name": "Project Management",
                    "l4_skills": [
                        "Project Planning", "Scope Definition", "Work Breakdown Structure (WBS)",
                        "Gantt Chart Creation", "Critical Path Method", "PERT Analysis",
                        "Resource Planning", "Budget Management", "Cost Estimation",
                        "Time Estimation", "Risk Management", "Risk Identification",
                        "Risk Assessment", "Risk Mitigation", "Issue Tracking",
                        "Change Management", "Stakeholder Management", "Stakeholder Analysis",
                        "Communication Planning", "Status Reporting", "Milestone Tracking",
                        "Quality Management", "Procurement Management", "Vendor Management",
                        "Integration Management", "Agile Project Management", "Waterfall Project Management",
                        "Hybrid Project Management", "Project Closure", "Lessons Learned"
                    ]
                },
                {
                    "id": "u03_organizational",
                    "name": "Organizational Leadership",
                    "l4_skills": [
                        "Strategic Planning", "Vision Setting", "Mission Development",
                        "Values Definition", "Culture Design", "Organizational Design",
                        "Restructuring", "Scaling Organizations", "Downsizing Management",
                        "Growth Management", "M&A Integration", "Spinoff Management",
                        "Corporate Governance", "Board Management", "Shareholder Relations",
                        "Executive Team Building", "C-Suite Collaboration", "Cross-functional Leadership",
                        "Matrix Management", "Dotted-Line Management", "Remote Organization Leadership",
                        "Hybrid Workplace Design", "Global Team Leadership", "Multi-site Coordination",
                        "Alliance Management", "Partnership Leadership", "Joint Venture Management",
                        "Ecosystem Orchestration", "Platform Leadership", "Network Effects"
                    ]
                },
                {
                    "id": "u03_change",
                    "name": "Change Management",
                    "l4_skills": [
                        "Change Vision Development", "Change Impact Assessment", "Stakeholder Engagement",
                        "Resistance Management", "Change Communication", "Training Needs Analysis",
                        "Training Program Design", "Training Delivery", "Adoption Metrics",
                        "Change Readiness Assessment", "Organizational Design", "Culture Change",
                        "Process Redesign", "Digital Transformation", "Merger & Acquisition Integration",
                        "Restructuring", "Downsizing Management", "Growth Management",
                        "Scaling Operations", "Transition Planning", "Pilot Program Management",
                        "Rollout Planning", "Post-implementation Support", "Sustainability Planning",
                        "Change Reinforcement", "ADKAR Model", "Kotter's 8 Steps",
                        "Lewin's Change Model", "McKinsey 7S", "Burke-Litwin Model"
                    ]
                },
                {
                    "id": "u03_decision",
                    "name": "Decision Making & Judgment",
                    "l4_skills": [
                        "Data-Informed Decision Making", "Intuitive Decision Making", "Consensus Decision Making",
                        "Consultative Decision Making", "Democratic Decision Making", "Delegative Decision Making",
                        "Rapid Decision Making", "Escalation Decisions", "Strategic Decisions",
                        "Tactical Decisions", "Operational Decisions", "Investment Decisions",
                        "Hiring Decisions", "Firing Decisions", "Product Decisions",
                        "Market Entry Decisions", "Partnership Decisions", "Resource Allocation Decisions",
                        "Priority Decisions", "Crisis Decision Making", "Ethical Decision Making",
                        "Risk-Based Decision Making", "Decision Documentation", "Decision Communication",
                        "Decision Tracking", "Decision Trees", "Multi-Criteria Decision Analysis",
                        "Pugh Matrix", "Analytic Hierarchy Process", "Cost of Delay"
                    ]
                }
            ]
        },
        {
            "code": "U04",
            "name": "Learning & Adaptability",
            "l3_subcategories": [
                {
                    "id": "u04_learning",
                    "name": "Self-Directed Learning",
                    "l4_skills": [
                        "Learning Goal Setting", "Learning Plan Development", "Resource Identification",
                        "Time Management for Learning", "Note-Taking", "Spaced Repetition",
                        "Active Recall", "Elaborative Rehearsal", "Interleaving Practice",
                        "Retrieval Practice", "Feynman Technique", "Concept Mapping",
                        "Analogical Learning", "Project-Based Learning", "Problem-Based Learning",
                        "Peer Learning", "Online Course Completion", "Book Summarization",
                        "Podcast Learning", "Video Tutorial Learning", "Documentation Reading",
                        "Research Paper Reading", "Conference Learning", "Workshop Participation",
                        "Certification Study", "Speed Reading", "Critical Reading",
                        "SQ3R Method", "Cornell Notes", "Zettelkasten"
                    ]
                },
                {
                    "id": "u04_adaptability",
                    "name": "Adaptability & Resilience",
                    "l4_skills": [
                        "Growth Mindset", "Embracing Change", "Flexibility",
                        "Pivoting", "Context Switching", "Multi-tasking",
                        "Priority Shifting", "Ambiguity Tolerance", "Uncertainty Management",
                        "Stress Management", "Pressure Management", "Deadline Management",
                        "Crisis Management", "Recovery from Failure", "Learning from Mistakes",
                        "Constructive Self-Criticism", "Reframing Setbacks", "Emotional Regulation",
                        "Mindfulness", "Meditation", "Breathing Techniques",
                        "Progressive Muscle Relaxation", "Cognitive Reappraisal", "Positive Self-Talk",
                        "Grit & Perseverance", "Antifragility", "Post-Traumatic Growth",
                        "Optimism", "Hope", "Self-Efficacy"
                    ]
                },
                {
                    "id": "u04_innovation",
                    "name": "Innovation & Experimentation",
                    "l4_skills": [
                        "Curiosity", "Asking Questions", "Hypothesis Formation",
                        "A/B Testing", "Multivariate Testing", "Controlled Experiments",
                        "Pilot Testing", "Beta Testing", "Prototype Testing",
                        "User Testing", "Feedback Collection", "Iteration",
                        "Continuous Improvement", "Kaizen", "Lean Startup Methodology",
                        "Build-Measure-Learn Loop", "Minimum Viable Product (MVP)", "Proof of Concept (POC)",
                        "Experimentation Design", "Statistical Significance", "P-value Interpretation",
                        "Confidence Intervals", "Sample Size Calculation", "Experiment Documentation",
                        "Learning Synthesis", "Innovation Accounting", "Actionable Metrics",
                        "Vanity Metrics Avoidance", "Cohort Analysis", "Split Testing"
                    ]
                },
                {
                    "id": "u04_metacognition",
                    "name": "Metacognition & Reflection",
                    "l4_skills": [
                        "Self-Reflection", "Journaling", "Weekly Reviews",
                        "Annual Reviews", "Self-Assessment", "Strengths Identification",
                        "Weakness Recognition", "Blind Spot Discovery", "Feedback Seeking",
                        "360 Feedback Interpretation", "Personal SWOT", "Ikigai Exploration",
                        "Values Clarification", "Purpose Discovery", "Life Design",
                        "Career Pathing", "Skills Gap Analysis", "Learning Style Identification",
                        "Cognitive Bias Recognition", "System 1 vs System 2", "Mental Models",
                        "First Principles Thinking", "Second-Order Thinking", "Inversion",
                        "Circle of Competence", "Falsification", "Thought Experiments",
                        "Socratic Questioning", "Cognitive Debugging", "Cognitive Load Management"
                    ]
                }
            ]
        },
        {
            "code": "U05",
            "name": "Personal Effectiveness",
            "l3_subcategories": [
                {
                    "id": "u05_time",
                    "name": "Time & Task Management",
                    "l4_skills": [
                        "Calendar Management", "Task Prioritization", "Eisenhower Matrix",
                        "Time Blocking", "Pomodoro Technique", "Deep Work",
                        "Shallow Work Batching", "Meeting Management", "Meeting Facilitation",
                        "Meeting Minutes", "Action Item Tracking", "To-Do List Management",
                        "Kanban Personal", "GTD (Getting Things Done)", "Inbox Zero",
                        "Email Management", "Notification Management", "Distraction Management",
                        "Focus Techniques", "Energy Management", "Peak Performance Timing",
                        "Break Scheduling", "Work-Life Balance", "Boundary Setting",
                        "Saying No", "Timeboxing", "Day Theming",
                        "Week Planning", "Month Planning", "Quarter Planning"
                    ]
                },
                {
                    "id": "u05_organization",
                    "name": "Organization & Systems",
                    "l4_skills": [
                        "File Organization", "Folder Structure Design", "Naming Conventions",
                        "Version Control (documents)", "Knowledge Management", "Personal Wiki",
                        "Second Brain Systems", "Zettelkasten Method", "PARA Method",
                        "Digital Workspace Setup", "Bookmark Organization", "Password Management",
                        "Cloud Storage Organization", "Email Folder Structure", "Contact Management",
                        "Reference Management", "Template Creation", "Checklist Design",
                        "Standard Operating Procedures", "Automation Setup", "Tool Integration",
                        "Workflow Design", "Process Documentation", "Desk Organization",
                        "Physical Filing", "Digital Minimalism", "Information Diet",
                        "App Portfolio Management", "Tool Consolidation", "Single Source of Truth"
                    ]
                },
                {
                    "id": "u05_professional",
                    "name": "Professional Conduct & Ethics",
                    "l4_skills": [
                        "Professional Ethics", "Integrity", "Honesty",
                        "Transparency", "Accountability", "Reliability",
                        "Punctuality", "Commitment", "Dependability",
                        "Responsibility", "Confidentiality", "Discretion",
                        "Professional Appearance", "Business Etiquette", "Telephone Etiquette",
                        "Video Call Etiquette", "Email Professional Standards", "Workplace Safety",
                        "Compliance Awareness", "Corporate Governance", "Code of Conduct Adherence",
                        "Whistleblowing", "Conflict of Interest Management", "Intellectual Property Respect",
                        "Anti-discrimination Practices", "Sexual Harassment Prevention", "Bribery & Corruption Prevention",
                        "Data Privacy", "GDPR Compliance", "Ethical AI Use"
                    ]
                },
                {
                    "id": "u05_emotional",
                    "name": "Emotional Intelligence",
                    "l4_skills": [
                        "Self-Awareness", "Self-Reflection", "Emotional Self-Awareness",
                        "Accurate Self-Assessment", "Self-Confidence", "Self-Regulation",
                        "Self-Control", "Trustworthiness", "Conscientiousness",
                        "Adaptability (emotional)", "Innovation (emotional)", "Empathy",
                        "Organizational Awareness", "Service Orientation", "Social Skills",
                        "Influence", "Communication (emotional)", "Conflict Management (emotional)",
                        "Leadership (emotional)", "Change Catalyst", "Building Bonds",
                        "Collaboration & Cooperation", "Team Capabilities", "Reading Emotions",
                        "Responding to Emotions", "Cognitive Empathy", "Emotional Empathy",
                        "Compassionate Empathy", "Emotion Regulation", "Mood Management"
                    ]
                },
                {
                    "id": "u05_wellbeing",
                    "name": "Wellbeing & Performance",
                    "l4_skills": [
                        "Physical Health", "Exercise Routine", "Nutrition",
                        "Sleep Hygiene", "Hydration", "Ergonomics",
                        "Posture", "Eye Care", "Mental Health",
                        "Stress Reduction", "Anxiety Management", "Depression Awareness",
                        "Burnout Prevention", "Recovery Practices", "休息 (Rest)",
                        "Leisure Activities", "Hobbies", "Social Connection",
                        "Family Time", "Friendship Maintenance", "Community Involvement",
                        "Spiritual Practices", "Purpose Cultivation", "Meaning-Making",
                        "Gratitude Practice", "Mindfulness Meditation", "Walking Meditation",
                        "Body Scan", "Loving-Kindness Meditation", "Flow State"
                    ]
                }
            ]
        }
    ]
}

# Continue with remaining domains...
# This file is getting large - splitting into generator function

def generate_functional_competencies():
    """Generate F domain - ~5000 skills"""
    return {
        "code": "F",
        "name": "Functional Competencies",
        "description": "Professional and specialized functional capabilities",
        "color": "#10B981",
        "l2_categories": []  # Will be populated
    }

def generate_tools_technologies():
    """Generate T domain - ~6000 skills"""
    return {
        "code": "T",
        "name": "Tools & Technologies",
        "description": "Specific tools, platforms, frameworks, and technologies",
        "color": "#8B5CF6",
        "l2_categories": []  # Will be populated
    }

def generate_languages_culture():
    """Generate L domain - ~1500 skills"""
    return {
        "code": "L",
        "name": "Languages & Culture",
        "description": "Natural languages and cultural competencies",
        "color": "#F59E0B",
        "l2_categories": []  # Will be populated
    }

def generate_methods_practices():
    """Generate M domain - ~2000 skills"""
    return {
        "code": "M",
        "name": "Methods & Practices",
        "description": "Methodologies, frameworks, and best practices",
        "color": "#EF4444",
        "l2_categories": []  # Will be populated
    }

def generate_domain_knowledge():
    """Generate D domain - ~3000 skills"""
    return {
        "code": "D",
        "name": "Domain Knowledge",
        "description": "Industry and domain-specific expertise",
        "color": "#EC4899",
        "l2_categories": []  # Will be populated
    }

def main():
    """Generate complete skill taxonomy"""

    taxonomy = {
        "metadata": {
            "version": "1.0.0",
            "generated_at": datetime.now().isoformat(),
            "description": "Expertise Atlas comprehensive skill taxonomy for MVP seeding",
            "total_l1": 6,
            "total_l4_target": 20000
        },
        "l1_domains": [
            UNIVERSAL_CAPABILITIES,
            generate_functional_competencies(),
            generate_tools_technologies(),
            generate_languages_culture(),
            generate_methods_practices(),
            generate_domain_knowledge()
        ]
    }

    # Calculate actual counts
    total_l4 = 0
    for l1 in taxonomy["l1_domains"]:
        for l2 in l1.get("l2_categories", []):
            for l3 in l2.get("l3_subcategories", []):
                total_l4 += len(l3.get("l4_skills", []))

    taxonomy["metadata"]["total_l4_actual"] = total_l4

    # Write to file
    output_path = "../data/expertise-atlas-skills-complete.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(taxonomy, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {total_l4} L4 skills")
    print(f"📄 Saved to: {output_path}")

if __name__ == "__main__":
    main()
