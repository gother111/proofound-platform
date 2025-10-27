-- ============================================================================
-- PROOFOUND DEMO DATA SEED SCRIPT
-- ============================================================================
-- Purpose: Create realistic demo profiles for testing and demonstration
-- Contents: 5 Individual Profiles + 3 Organization Profiles
-- Created: October 27, 2025
--
-- IMPORTANT: This script assumes Supabase Auth users already exist
-- You may need to create users via Supabase Dashboard or API first
-- ============================================================================

BEGIN;

-- ============================================================================
-- INDIVIDUAL PERSONA 1: SOFIA MARTINEZ - UX DESIGNER
-- ============================================================================
-- Mission-driven designer, accessibility advocate
-- 8 years experience, Spain-based, remote-friendly

-- Insert Profile
INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  region,
  timezone,
  mission,
  vision,
  values,
  causes,
  professional_summary,
  industry,
  languages,
  availability_status,
  available_for_match,
  email,
  salary_band_min,
  salary_band_max,
  field_visibility,
  account_type,
  profile_ready_for_match,
  profile_completion_percentage,
  created_at,
  updated_at,
  last_active_at
) VALUES (
  gen_random_uuid(), -- Replace with actual Supabase Auth user ID if available
  'Sofia Martinez',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330', -- Placeholder
  'Barcelona, Spain',
  'Europe/Madrid',
  'To create digital experiences that are accessible and empowering for everyone, ensuring that technology serves all people regardless of ability, background, or circumstance.',
  'A world where digital products are designed inclusively from the start, not retrofitted for accessibility.',
  '[
    {"label": "Accessibility First", "verified": true},
    {"label": "User Empowerment", "verified": true},
    {"label": "Inclusive Design", "verified": true},
    {"label": "Continuous Learning", "verified": false}
  ]'::jsonb,
  '["Digital Accessibility", "Education Equity", "Inclusive Technology", "Social Innovation"]'::jsonb,
  'UX designer with 8 years of experience specializing in accessibility and inclusive design. Passionate about creating digital products that work for everyone.',
  '["Design & UX", "Technology", "Education"]'::text[],
  '["Spanish (Native)", "English (Fluent)", "Catalan (Native)"]'::text[],
  'open_to_opportunities',
  true,
  'sofia.martinez@proofound-demo.com',
  65000,
  85000,
  '{
    "full_name": "public",
    "region": "public",
    "mission": "public",
    "vision": "public",
    "values": "public",
    "causes": "public",
    "professional_summary": "public",
    "industry": "public",
    "languages": "public",
    "salary_band": "masked"
  }'::jsonb,
  'individual',
  true,
  85,
  NOW() - INTERVAL '4 months',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '2 hours'
) RETURNING id INTO @sofia_id;

-- Expertise Atlas for Sofia
INSERT INTO expertise_atlas (profile_id, skill_name, skill_category, proficiency_level, rank_order, is_core_expertise, years_of_experience, last_used_date, is_verified, proof_count)
VALUES
  (@sofia_id, 'UX Research', 'Design', 'expert', 1, true, 8, CURRENT_DATE, true, 3),
  (@sofia_id, 'Accessibility (WCAG)', 'Design', 'expert', 2, true, 6, CURRENT_DATE, true, 2),
  (@sofia_id, 'Figma', 'Design Tools', 'expert', 3, true, 5, CURRENT_DATE, true, 1),
  (@sofia_id, 'Design Systems', 'Design', 'advanced', 4, true, 4, CURRENT_DATE, true, 1),
  (@sofia_id, 'User Testing', 'Research', 'expert', 5, false, 7, CURRENT_DATE - INTERVAL '1 month', false, 0),
  (@sofia_id, 'Prototyping', 'Design', 'advanced', 6, false, 6, CURRENT_DATE, false, 0),
  (@sofia_id, 'HTML/CSS', 'Development', 'intermediate', 7, false, 3, CURRENT_DATE - INTERVAL '2 months', false, 0);

-- Proofs for Sofia
INSERT INTO proofs (profile_id, claim_type, claim_text, proof_type, verification_status, verified_at, confidence_score, created_at)
VALUES
  (@sofia_id, 'experience', 'Led accessibility audit for government healthcare portal serving 2M+ citizens', 'verified_reference', 'verified', NOW() - INTERVAL '2 months', 0.95, NOW() - INTERVAL '3 months'),
  (@sofia_id, 'skill', 'Expert in WCAG 2.1 AA/AAA compliance and assistive technology testing', 'verified_reference', 'verified', NOW() - INTERVAL '1 month', 0.90, NOW() - INTERVAL '2 months'),
  (@sofia_id, 'achievement', 'Designed award-winning accessible e-learning platform', 'link', 'verified', NOW() - INTERVAL '3 weeks', 0.88, NOW() - INTERVAL '1 month');

-- Artifacts for Sofia
INSERT INTO artifacts (profile_id, title, description, artifact_type, url, category, tags, artifact_date, visibility)
VALUES
  (@sofia_id, 'Accessibility Design System Documentation', 'Comprehensive guide for building accessible UI components', 'link', 'https://github.com/sofia-martinez/a11y-design-system', 'Documentation', ARRAY['accessibility', 'design-system', 'wcag'], '2024-03-15', 'public'),
  (@sofia_id, 'Inclusive Design Workshop Slides', 'Workshop materials for teaching inclusive design principles', 'link', 'https://slides.com/sofia/inclusive-design', 'Education', ARRAY['workshop', 'inclusive-design', 'education'], '2024-06-20', 'public');

COMMIT;


-- ============================================================================
-- INDIVIDUAL PERSONA 2: JAMES CHEN - SOFTWARE ENGINEER
-- ============================================================================
-- Full-stack developer, climate tech focus
-- 5 years experience, Canada-based

BEGIN;

INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  region,
  timezone,
  mission,
  vision,
  values,
  causes,
  professional_summary,
  industry,
  languages,
  availability_status,
  available_for_match,
  email,
  salary_band_min,
  salary_band_max,
  account_type,
  profile_ready_for_match,
  profile_completion_percentage,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'James Chen',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  'Vancouver, BC, Canada',
  'America/Vancouver',
  'To build technology that accelerates the transition to a sustainable, carbon-neutral future, making climate solutions accessible and scalable.',
  'A tech ecosystem where every line of code contributes to planetary health.',
  '[
    {"label": "Sustainability", "verified": true},
    {"label": "Open Source", "verified": true},
    {"label": "Collaboration", "verified": true},
    {"label": "Innovation", "verified": false}
  ]'::jsonb,
  '["Climate Action", "Clean Energy", "Open Source Software", "Environmental Justice"]'::jsonb,
  'Full-stack software engineer with 5 years of experience building scalable climate tech solutions. Passionate about using technology to solve environmental challenges.',
  '["Technology", "Climate Tech", "Software Development"]'::text[],
  '["English (Fluent)", "Mandarin (Native)", "French (Conversational)"]'::text[],
  'available',
  true,
  'james.chen@proofound-demo.com',
  80000,
  110000,
  'individual',
  true,
  82,
  NOW() - INTERVAL '3 months',
  NOW() - INTERVAL '12 hours'
) RETURNING id INTO @james_id;

-- Expertise Atlas for James
INSERT INTO expertise_atlas (profile_id, skill_name, skill_category, proficiency_level, rank_order, is_core_expertise, years_of_experience, last_used_date, is_verified, proof_count)
VALUES
  (@james_id, 'React.js', 'Frontend Development', 'expert', 1, true, 5, CURRENT_DATE, true, 2),
  (@james_id, 'Node.js', 'Backend Development', 'advanced', 2, true, 4, CURRENT_DATE, true, 2),
  (@james_id, 'PostgreSQL', 'Database', 'advanced', 3, true, 4, CURRENT_DATE, true, 1),
  (@james_id, 'Python', 'Backend Development', 'advanced', 4, false, 3, CURRENT_DATE - INTERVAL '1 week', true, 1),
  (@james_id, 'TypeScript', 'Programming Languages', 'expert', 5, true, 4, CURRENT_DATE, false, 0),
  (@james_id, 'AWS', 'Cloud Infrastructure', 'intermediate', 6, false, 2, CURRENT_DATE, false, 0),
  (@james_id, 'Docker', 'DevOps', 'intermediate', 7, false, 3, CURRENT_DATE - INTERVAL '3 days', false, 0);

-- Proofs for James
INSERT INTO proofs (profile_id, claim_type, claim_text, proof_type, verification_status, verified_at, confidence_score, created_at)
VALUES
  (@james_id, 'experience', 'Built real-time carbon tracking dashboard processing 1M+ data points daily', 'verified_reference', 'verified', NOW() - INTERVAL '1 month', 0.92, NOW() - INTERVAL '2 months'),
  (@james_id, 'skill', 'Core contributor to open-source climate data API with 2K+ GitHub stars', 'link', 'verified', NOW() - INTERVAL '3 weeks', 0.89, NOW() - INTERVAL '1 month'),
  (@james_id, 'achievement', 'Led migration to renewable energy-powered cloud infrastructure', 'verified_reference', 'verified', NOW() - INTERVAL '2 weeks', 0.87, NOW() - INTERVAL '1 month'),
  (@james_id, 'education', 'Computer Science degree with focus on environmental informatics', 'credential', 'pending', NULL, 0.50, NOW() - INTERVAL '1 week');

COMMIT;


-- ============================================================================
-- INDIVIDUAL PERSONA 3: AMARA OKAFOR - COMMUNITY ORGANIZER
-- ============================================================================
-- Grassroots activism, education equity
-- 10 years experience, Nigeria → UK

BEGIN;

INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  region,
  timezone,
  mission,
  vision,
  values,
  causes,
  professional_summary,
  industry,
  languages,
  availability_status,
  available_for_match,
  email,
  salary_band_min,
  salary_band_max,
  account_type,
  profile_ready_for_match,
  profile_completion_percentage,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Amara Okafor',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956',
  'London, United Kingdom',
  'Europe/London',
  'To build grassroots movements that center the voices of marginalized communities in education policy, ensuring every child has access to quality, culturally relevant education.',
  'A future where education systems are designed by and for the communities they serve.',
  '[
    {"label": "Community Power", "verified": true},
    {"label": "Educational Equity", "verified": true},
    {"label": "Youth Leadership", "verified": true},
    {"label": "Cultural Pride", "verified": true}
  ]'::jsonb,
  '["Education Access", "Youth Empowerment", "Racial Justice", "Community Development", "Immigration Rights"]'::jsonb,
  'Community organizer with 10 years of experience mobilizing grassroots movements for education equity. Expert in participatory action research and youth leadership development.',
  '["Education", "Nonprofit", "Community Organizing"]'::text[],
  '["English (Fluent)", "Igbo (Native)", "Yoruba (Conversational)"]'::text[],
  'open_to_opportunities',
  true,
  'amara.okafor@proofound-demo.com',
  45000,
  65000,
  'individual',
  true,
  88,
  NOW() - INTERVAL '6 months',
  NOW() - INTERVAL '6 hours'
) RETURNING id INTO @amara_id;

-- Expertise Atlas for Amara
INSERT INTO expertise_atlas (profile_id, skill_name, skill_category, proficiency_level, rank_order, is_core_expertise, years_of_experience, last_used_date, is_verified, proof_count)
VALUES
  (@amara_id, 'Community Organizing', 'Organizing', 'expert', 1, true, 10, CURRENT_DATE, true, 3),
  (@amara_id, 'Program Management', 'Project Management', 'expert', 2, true, 8, CURRENT_DATE, true, 2),
  (@amara_id, 'Grant Writing', 'Fundraising', 'advanced', 3, true, 7, CURRENT_DATE - INTERVAL '1 week', true, 1),
  (@amara_id, 'Public Speaking', 'Communication', 'expert', 4, false, 9, CURRENT_DATE - INTERVAL '3 days', true, 2),
  (@amara_id, 'Youth Development', 'Education', 'expert', 5, true, 10, CURRENT_DATE, true, 1),
  (@amara_id, 'Policy Advocacy', 'Advocacy', 'advanced', 6, false, 6, CURRENT_DATE - INTERVAL '2 weeks', false, 0),
  (@amara_id, 'Participatory Research', 'Research', 'advanced', 7, false, 5, CURRENT_DATE - INTERVAL '1 month', false, 0);

-- Proofs for Amara
INSERT INTO proofs (profile_id, claim_type, claim_text, proof_type, verification_status, verified_at, confidence_score, created_at)
VALUES
  (@amara_id, 'experience', 'Led coalition of 15 parent groups to secure £2M funding for after-school programs', 'verified_reference', 'verified', NOW() - INTERVAL '1 month', 0.94, NOW() - INTERVAL '2 months'),
  (@amara_id, 'achievement', 'Mobilized 500+ community members for education policy reform campaign', 'verified_reference', 'verified', NOW() - INTERVAL '3 weeks', 0.91, NOW() - INTERVAL '1 month'),
  (@amara_id, 'skill', 'Designed and facilitated youth leadership curriculum adopted by 8 schools', 'verified_reference', 'verified', NOW() - INTERVAL '2 weeks', 0.89, NOW() - INTERVAL '3 weeks'),
  (@amara_id, 'volunteering', 'Founded community library serving 300+ immigrant families weekly', 'verified_reference', 'verified', NOW() - INTERVAL '1 week', 0.93, NOW() - INTERVAL '2 weeks'),
  (@amara_id, 'achievement', 'TED speaker on decolonizing education systems', 'link', 'verified', NOW() - INTERVAL '5 days', 0.90, NOW() - INTERVAL '10 days');

COMMIT;


-- ============================================================================
-- INDIVIDUAL PERSONA 4: DR. YUKI TANAKA - DATA SCIENTIST
-- ============================================================================
-- Healthcare analytics, public health researcher
-- 12 years experience, Japan-based

BEGIN;

INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  region,
  timezone,
  mission,
  vision,
  values,
  causes,
  professional_summary,
  industry,
  languages,
  availability_status,
  available_for_match,
  email,
  salary_band_min,
  salary_band_max,
  account_type,
  profile_ready_for_match,
  profile_completion_percentage,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Dr. Yuki Tanaka',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
  'Tokyo, Japan',
  'Asia/Tokyo',
  'To leverage data science and AI to improve healthcare outcomes for underserved populations, making precision medicine accessible to all regardless of socioeconomic status.',
  'A healthcare system powered by ethical AI that reduces disparities and improves outcomes for everyone.',
  '[
    {"label": "Health Equity", "verified": true},
    {"label": "Scientific Rigor", "verified": true},
    {"label": "Ethical AI", "verified": true},
    {"label": "Global Collaboration", "verified": false}
  ]'::jsonb,
  '["Healthcare Access", "Medical Research", "AI Ethics", "Global Health", "Data Privacy"]'::jsonb,
  'Data scientist and public health researcher with PhD in Health Informatics. 12 years experience applying machine learning to healthcare challenges, with focus on equitable outcomes.',
  '["Healthcare", "Data Science", "Research", "Public Health"]'::text[],
  '["Japanese (Native)", "English (Fluent)", "Mandarin (Intermediate)"]'::text[],
  'not_available',
  false,
  'yuki.tanaka@proofound-demo.com',
  95000,
  130000,
  'individual',
  true,
  90,
  NOW() - INTERVAL '8 months',
  NOW() - INTERVAL '3 hours'
) RETURNING id INTO @yuki_id;

-- Expertise Atlas for Dr. Yuki
INSERT INTO expertise_atlas (profile_id, skill_name, skill_category, proficiency_level, rank_order, is_core_expertise, years_of_experience, last_used_date, is_verified, proof_count)
VALUES
  (@yuki_id, 'Machine Learning', 'Data Science', 'expert', 1, true, 10, CURRENT_DATE, true, 3),
  (@yuki_id, 'Python', 'Programming', 'expert', 2, true, 12, CURRENT_DATE, true, 2),
  (@yuki_id, 'R', 'Programming', 'expert', 3, true, 12, CURRENT_DATE, true, 2),
  (@yuki_id, 'Healthcare Analytics', 'Domain Expertise', 'expert', 4, true, 12, CURRENT_DATE, true, 3),
  (@yuki_id, 'Statistical Analysis', 'Data Science', 'expert', 5, true, 12, CURRENT_DATE - INTERVAL '2 days', true, 1),
  (@yuki_id, 'Deep Learning', 'AI/ML', 'advanced', 6, false, 7, CURRENT_DATE, true, 1),
  (@yuki_id, 'SQL', 'Database', 'expert', 7, false, 10, CURRENT_DATE, false, 0),
  (@yuki_id, 'Data Visualization', 'Communication', 'advanced', 8, false, 8, CURRENT_DATE - INTERVAL '1 week', false, 0);

-- Proofs for Dr. Yuki
INSERT INTO proofs (profile_id, claim_type, claim_text, proof_type, verification_status, verified_at, confidence_score, created_at)
VALUES
  (@yuki_id, 'education', 'PhD in Health Informatics from University of Tokyo', 'credential', 'verified', NOW() - INTERVAL '5 months', 0.98, NOW() - INTERVAL '6 months'),
  (@yuki_id, 'achievement', 'Published 15 peer-reviewed papers on ML applications in healthcare', 'link', 'verified', NOW() - INTERVAL '3 months', 0.96, NOW() - INTERVAL '4 months'),
  (@yuki_id, 'experience', 'Developed predictive model reducing hospital readmissions by 23%', 'verified_reference', 'verified', NOW() - INTERVAL '2 months', 0.94, NOW() - INTERVAL '3 months'),
  (@yuki_id, 'achievement', 'Led international research consortium on health data interoperability', 'verified_reference', 'verified', NOW() - INTERVAL '1 month', 0.92, NOW() - INTERVAL '2 months'),
  (@yuki_id, 'skill', 'Principal investigator on $2M NIH grant for health equity research', 'verified_reference', 'verified', NOW() - INTERVAL '3 weeks', 0.95, NOW() - INTERVAL '1 month'),
  (@yuki_id, 'volunteering', 'Pro bono data analysis for 3 global health NGOs', 'verified_reference', 'verified', NOW() - INTERVAL '2 weeks', 0.88, NOW() - INTERVAL '3 weeks');

COMMIT;


-- ============================================================================
-- INDIVIDUAL PERSONA 5: ALEX RIVERA - SOCIAL ENTREPRENEUR
-- ============================================================================
-- Impact startup founder, regenerative agriculture
-- 6 years experience, Mexico → USA

BEGIN;

INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  region,
  timezone,
  mission,
  vision,
  values,
  causes,
  professional_summary,
  industry,
  languages,
  availability_status,
  available_for_match,
  email,
  salary_band_min,
  salary_band_max,
  account_type,
  profile_ready_for_match,
  profile_completion_percentage,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Alex Rivera',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef',
  'Austin, TX, USA',
  'America/Chicago',
  'To build regenerative economic systems that honor indigenous wisdom, restore ecosystems, and create prosperity for rural farming communities, particularly in the Global South.',
  'A world where agriculture regenerates land, sequesters carbon, and provides dignified livelihoods.',
  '[
    {"label": "Regeneration", "verified": true},
    {"label": "Community Wealth", "verified": true},
    {"label": "Indigenous Wisdom", "verified": false},
    {"label": "Systems Thinking", "verified": true}
  ]'::jsonb,
  '["Regenerative Agriculture", "Climate Action", "Economic Justice", "Indigenous Rights", "Food Security"]'::jsonb,
  'Social entrepreneur and impact investor with 6 years experience building regenerative agriculture supply chains. Background in corporate strategy, transitioned to impact work after seeing extractive practices firsthand.',
  '["Social Enterprise", "Agriculture", "Impact Investing"]'::text[],
  '["Spanish (Native)", "English (Fluent)", "Nahuatl (Conversational)"]'::text[],
  'available',
  true,
  'alex.rivera@proofound-demo.com',
  70000,
  95000,
  'individual',
  true,
  83,
  NOW() - INTERVAL '5 months',
  NOW() - INTERVAL '8 hours'
) RETURNING id INTO @alex_id;

-- Expertise Atlas for Alex
INSERT INTO expertise_atlas (profile_id, skill_name, skill_category, proficiency_level, rank_order, is_core_expertise, years_of_experience, last_used_date, is_verified, proof_count)
VALUES
  (@alex_id, 'Business Strategy', 'Business', 'expert', 1, true, 6, CURRENT_DATE, true, 2),
  (@alex_id, 'Fundraising', 'Finance', 'advanced', 2, true, 5, CURRENT_DATE - INTERVAL '1 week', true, 1),
  (@alex_id, 'Partnership Development', 'Business Development', 'expert', 3, true, 6, CURRENT_DATE, true, 2),
  (@alex_id, 'Supply Chain Design', 'Operations', 'advanced', 4, true, 4, CURRENT_DATE - INTERVAL '3 days', false, 0),
  (@alex_id, 'Impact Measurement', 'Impact', 'advanced', 5, false, 5, CURRENT_DATE, true, 1),
  (@alex_id, 'Stakeholder Engagement', 'Communication', 'expert', 6, false, 6, CURRENT_DATE - INTERVAL '2 days', false, 0),
  (@alex_id, 'Financial Modeling', 'Finance', 'intermediate', 7, false, 4, CURRENT_DATE - INTERVAL '1 week', false, 0);

-- Proofs for Alex
INSERT INTO proofs (profile_id, claim_type, claim_text, proof_type, verification_status, verified_at, confidence_score, created_at)
VALUES
  (@alex_id, 'achievement', 'Founded regenerative agriculture startup connecting 200+ farmers to premium markets', 'verified_reference', 'verified', NOW() - INTERVAL '2 months', 0.93, NOW() - INTERVAL '3 months'),
  (@alex_id, 'experience', 'Raised $1.5M in seed funding from impact investors', 'verified_reference', 'verified', NOW() - INTERVAL '1 month', 0.91, NOW() - INTERVAL '2 months'),
  (@alex_id, 'skill', 'Designed profit-sharing model returning 60% of premium to farmers', 'verified_reference', 'verified', NOW() - INTERVAL '3 weeks', 0.89, NOW() - INTERVAL '1 month'),
  (@alex_id, 'volunteering', 'Board member of indigenous farmers cooperative in Oaxaca', 'verified_reference', 'pending', NULL, 0.50, NOW() - INTERVAL '2 weeks');

COMMIT;


-- ============================================================================
-- ORGANIZATION 1: GREENTECH INNOVATIONS
-- ============================================================================
-- Type: Social Enterprise / B-Corp
-- Focus: Clean energy solutions for rural communities

BEGIN;

-- Create profile for GreenTech Innovations organization account
-- IMPORTANT: Replace gen_random_uuid() with the actual Supabase Auth user ID
-- after creating the auth user with email: hello@greentech-innovations.com
INSERT INTO profiles (
  id,
  account_type,
  full_name,
  email,
  mission,
  vision,
  values,
  causes,
  region,
  timezone,
  languages,
  professional_summary,
  profile_completion_percentage,
  profile_ready_for_match,
  available_for_match,
  created_at,
  updated_at,
  last_active_at
) VALUES (
  gen_random_uuid(), -- Replace with actual Supabase Auth user ID
  'organization',
  'GreenTech Innovations',
  'hello@greentech-innovations.com',
  'To accelerate the transition to clean energy in rural and underserved regions through innovative technology and community partnerships.',
  'A world where everyone has access to clean, affordable, and reliable energy.',
  '[
    {"label": "Sustainability", "verified": true},
    {"label": "Community Partnership", "verified": true},
    {"label": "Innovation", "verified": true},
    {"label": "Equity", "verified": true}
  ]'::jsonb,
  '["Clean Energy", "Climate Action", "Rural Development", "Energy Access"]'::jsonb,
  'Berlin, Germany',
  'Europe/Berlin',
  '["English", "German"]'::text[],
  'Social enterprise accelerating clean energy transition in rural and underserved regions through solar microgrids and community partnerships.',
  100,
  true,
  true,
  NOW() - INTERVAL '1 year',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '4 hours'
) RETURNING id INTO @greentech_profile_id;

INSERT INTO organizations (
  id,
  name,
  slug,
  logo_url,
  website,
  description,
  org_type,
  mission,
  values,
  causes,
  headquarters_location,
  is_remote_friendly,
  is_verified,
  verification_method,
  verified_domain,
  verified_at,
  registry_number,
  contact_email,
  created_by,
  subscription_tier,
  is_ngo,
  max_active_assignments,
  active_assignments_count,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'GreenTech Innovations',
  'greentech-innovations',
  'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9',
  'https://greentech-innovations.example.com',
  'We accelerate the transition to clean energy in rural and underserved regions through innovative technology and community partnerships. Our solar microgrids bring reliable, affordable energy to communities that need it most.',
  'startup',
  'To accelerate the transition to clean energy in rural and underserved regions through innovative technology and community partnerships.',
  '[
    {"label": "Sustainability", "icon": "Leaf", "description": "Environmental stewardship in all operations"},
    {"label": "Community Partnership", "icon": "Handshake", "description": "Community-led solutions that empower locals"},
    {"label": "Innovation", "icon": "Lightbulb", "description": "Continuous improvement and learning"},
    {"label": "Equity", "icon": "Scale", "description": "Fair access and inclusive design"}
  ]'::jsonb,
  '["Clean Energy", "Climate Action", "Rural Development", "Energy Access"]'::jsonb,
  'Berlin, Germany',
  true,
  true,
  'domain_verification',
  'greentech-innovations.com',
  NOW() - INTERVAL '4 months',
  'HRB 123456 B',
  'hello@greentech-innovations.com',
  @greentech_profile_id,
  'pro',
  false,
  10,
  2,
  NOW() - INTERVAL '1 year',
  NOW() - INTERVAL '2 days'
) RETURNING id INTO @greentech_id;

-- Assignments for GreenTech
INSERT INTO assignments (
  organization_id,
  title,
  description,
  assignment_type,
  location,
  is_remote,
  start_date,
  duration_text,
  time_commitment,
  budget_min,
  budget_max,
  budget_currency,
  required_expertise,
  required_languages,
  mission_alignment_weight,
  values_keywords,
  expected_outcomes,
  status,
  published_at,
  created_at
) VALUES
  (
    @greentech_id,
    'Senior Solar Engineer',
    'Lead technical design and deployment of solar microgrid systems in rural communities across East Africa. Work directly with local partners to ensure culturally appropriate and sustainable installations.',
    'employment',
    'Berlin, Germany (with 40% travel to East Africa)',
    true,
    CURRENT_DATE + INTERVAL '60 days',
    '24 months, full-time',
    'Full-time (40 hrs/week)',
    75000,
    95000,
    'EUR',
    '{"core_skills": ["Solar Energy Systems", "Electrical Engineering", "Project Management"], "nice_to_have": ["Swahili language", "Community engagement", "Supply chain"]}'::jsonb,
    ARRAY['English'],
    35,
    '["sustainability", "community impact", "climate action"]'::jsonb,
    'Deploy 50 microgrids serving 10,000 households; Train 20 local technicians; Achieve 95% uptime over 2 years',
    'published',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 week'
  ),
  (
    @greentech_id,
    'Community Outreach Coordinator',
    'Build relationships with rural communities to understand energy needs and co-design microgrid solutions. Facilitate community meetings, manage feedback loops, and ensure local ownership.',
    'employment',
    'Remote (Kenya-based preferred)',
    true,
    CURRENT_DATE + INTERVAL '30 days',
    '18 months, full-time',
    'Full-time (40 hrs/week)',
    45000,
    60000,
    'EUR',
    '{"core_skills": ["Community Organizing", "Stakeholder Engagement", "Cross-cultural Communication"], "nice_to_have": ["Swahili", "Project management", "Solar energy basics"]}'::jsonb,
    ARRAY['English', 'Swahili'],
    40,
    '["community-first", "partnership", "empowerment"]'::jsonb,
    'Engage 15 communities in co-design process; Achieve 90% satisfaction rating; Establish 3 community energy committees',
    'published',
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '3 weeks'
  );

COMMIT;


-- ============================================================================
-- ORGANIZATION 2: CODE FOR GOOD FOUNDATION
-- ============================================================================
-- Type: NGO / Nonprofit
-- Focus: Digital literacy and tech education

BEGIN;

-- Create profile for Code for Good Foundation organization account
-- IMPORTANT: Replace gen_random_uuid() with the actual Supabase Auth user ID
-- after creating the auth user with email: team@codeforgood.org
INSERT INTO profiles (
  id,
  account_type,
  full_name,
  email,
  mission,
  vision,
  values,
  causes,
  region,
  timezone,
  languages,
  professional_summary,
  profile_completion_percentage,
  profile_ready_for_match,
  available_for_match,
  created_at,
  updated_at,
  last_active_at
) VALUES (
  gen_random_uuid(), -- Replace with actual Supabase Auth user ID
  'organization',
  'Code for Good Foundation',
  'team@codeforgood.org',
  'To democratize access to technology education and create pathways for underserved youth to thrive in the digital economy.',
  'A future where every young person has the opportunity to learn tech skills and build a prosperous career.',
  '[
    {"label": "Education Access", "verified": true},
    {"label": "Youth Empowerment", "verified": true},
    {"label": "Community Impact", "verified": true},
    {"label": "Excellence", "verified": true}
  ]'::jsonb,
  '["Education Equity", "Digital Literacy", "Youth Empowerment", "Tech for Good"]'::jsonb,
  'Nairobi, Kenya',
  'Africa/Nairobi',
  '["English", "Swahili"]'::text[],
  'NGO bridging the digital divide by providing free coding education and tech skills training to underserved youth across Africa. Trained 5,000+ students with 70% placement rate.',
  100,
  true,
  true,
  NOW() - INTERVAL '3 years',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '6 hours'
) RETURNING id INTO @codeforgood_profile_id;

INSERT INTO organizations (
  id,
  name,
  slug,
  logo_url,
  website,
  description,
  org_type,
  mission,
  values,
  causes,
  headquarters_location,
  is_remote_friendly,
  is_verified,
  verification_method,
  verified_domain,
  verified_at,
  registry_number,
  contact_email,
  created_by,
  subscription_tier,
  is_ngo,
  max_active_assignments,
  active_assignments_count,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Code for Good Foundation',
  'code-for-good',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
  'https://codeforgood.example.org',
  'We bridge the digital divide by providing free coding education and tech skills training to underserved youth across Africa. Our programs have trained 5,000+ students and placed 70% into tech careers.',
  'ngo',
  'To democratize access to technology education and create pathways for underserved youth to thrive in the digital economy.',
  '[
    {"label": "Education Access", "icon": "GraduationCap", "description": "Quality education for all"},
    {"label": "Youth Empowerment", "icon": "Users", "description": "Investing in next generation leaders"},
    {"label": "Community Impact", "icon": "Heart", "description": "Local solutions for local challenges"},
    {"label": "Excellence", "icon": "Award", "description": "High standards in everything we do"}
  ]'::jsonb,
  '["Education Equity", "Digital Literacy", "Youth Empowerment", "Tech for Good"]'::jsonb,
  'Nairobi, Kenya',
  true,
  true,
  'ngo_registry',
  'codeforgood.org',
  NOW() - INTERVAL '6 months',
  'NGO/987654',
  'team@codeforgood.org',
  @codeforgood_profile_id,
  'pilot',
  true,
  5,
  3,
  NOW() - INTERVAL '3 years',
  NOW() - INTERVAL '1 day'
) RETURNING id INTO @codeforgood_id;

-- Assignments for Code for Good
INSERT INTO assignments (
  organization_id,
  title,
  description,
  assignment_type,
  location,
  is_remote,
  start_date,
  duration_text,
  time_commitment,
  budget_min,
  budget_max,
  budget_currency,
  required_expertise,
  required_languages,
  mission_alignment_weight,
  values_keywords,
  expected_outcomes,
  status,
  published_at,
  created_at
) VALUES
  (
    @codeforgood_id,
    'Lead Instructor - Web Development',
    'Teach full-stack web development to cohorts of 20-30 students. Design curriculum, mentor students, and help place graduates in tech jobs. Experience working with underserved communities strongly preferred.',
    'volunteering',
    'Nairobi, Kenya (hybrid)',
    false,
    CURRENT_DATE + INTERVAL '45 days',
    '6 months, part-time',
    'Part-time (20 hrs/week)',
    0,
    0,
    'USD',
    '{"core_skills": ["Teaching", "Web Development", "Curriculum Design"], "nice_to_have": ["Swahili", "Mentorship", "Job placement"]}'::jsonb,
    ARRAY['English', 'Swahili'],
    45,
    '["education", "youth empowerment", "tech access"]'::jsonb,
    'Train 60 students over 2 cohorts; Achieve 80% completion rate; Place 50% in tech roles',
    'published',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '10 days'
  ),
  (
    @codeforgood_id,
    'Program Manager - Expansion Strategy',
    'Lead expansion into 3 new cities. Develop partnerships with schools and local governments, recruit instructors, secure funding, and set up operations.',
    'contract',
    'Remote (Africa timezone)',
    true,
    CURRENT_DATE + INTERVAL '30 days',
    '12 months, full-time',
    'Full-time (40 hrs/week)',
    35000,
    50000,
    'USD',
    '{"core_skills": ["Program Management", "Partnership Development", "Fundraising"], "nice_to_have": ["Education sector experience", "Nonprofit management", "French"]}'::jsonb,
    ARRAY['English'],
    40,
    '["growth", "impact scale", "partnership"]'::jsonb,
    'Launch in 3 cities; Secure 3 school partnerships per city; Raise $200K in funding',
    'published',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '1 week'
  ),
  (
    @codeforgood_id,
    'Volunteer Mentor - Career Guidance',
    'Provide 1-on-1 career mentorship to program graduates. Help with resume writing, interview prep, job search strategies, and professional development.',
    'volunteering',
    'Remote',
    true,
    CURRENT_DATE + INTERVAL '15 days',
    'Ongoing, flexible',
    'Flexible (2-5 hrs/week)',
    0,
    0,
    'USD',
    '{"core_skills": ["Career Coaching", "Tech Industry Experience", "Mentorship"], "nice_to_have": ["Hiring experience", "Resume writing", "Interview prep"]}'::jsonb,
    ARRAY['English'],
    50,
    '["mentorship", "career development", "giving back"]'::jsonb,
    'Mentor 5-10 students per cohort; Improve job placement rate; Provide ongoing support',
    'published',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '5 days'
  );

COMMIT;


-- ============================================================================
-- ORGANIZATION 3: IMPACT CAPITAL PARTNERS
-- ============================================================================
-- Type: Investment Firm / For-profit
-- Focus: ESG investing, impact measurement

BEGIN;

-- Create profile for Impact Capital Partners organization account
-- IMPORTANT: Replace gen_random_uuid() with the actual Supabase Auth user ID
-- after creating the auth user with email: careers@impactcapitalpartners.com
INSERT INTO profiles (
  id,
  account_type,
  full_name,
  email,
  mission,
  vision,
  values,
  causes,
  region,
  timezone,
  languages,
  professional_summary,
  profile_completion_percentage,
  profile_ready_for_match,
  available_for_match,
  created_at,
  updated_at,
  last_active_at
) VALUES (
  gen_random_uuid(), -- Replace with actual Supabase Auth user ID
  'organization',
  'Impact Capital Partners',
  'careers@impactcapitalpartners.com',
  'To prove that profitability and impact are not just compatible, but mutually reinforcing. We invest in businesses solving the world''s most pressing challenges.',
  'A future where capital flows to businesses that create both financial returns and measurable positive impact.',
  '[
    {"label": "Impact First", "verified": true},
    {"label": "Rigorous Analysis", "verified": true},
    {"label": "Long-term Thinking", "verified": true},
    {"label": "Transparency", "verified": true}
  ]'::jsonb,
  '["Impact Investing", "ESG", "Climate Finance", "Social Innovation"]'::jsonb,
  'London, United Kingdom',
  'Europe/London',
  '["English"]'::text[],
  'Impact investing firm with 50+ portfolio companies across clean energy, healthcare, education, and sustainable agriculture. Combining financial returns with measurable social and environmental impact.',
  100,
  true,
  true,
  NOW() - INTERVAL '8 years',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '5 hours'
) RETURNING id INTO @impactcapital_profile_id;

INSERT INTO organizations (
  id,
  name,
  slug,
  logo_url,
  website,
  description,
  org_type,
  mission,
  values,
  causes,
  headquarters_location,
  is_remote_friendly,
  is_verified,
  verification_method,
  verified_domain,
  verified_at,
  registry_number,
  contact_email,
  created_by,
  subscription_tier,
  is_ngo,
  max_active_assignments,
  active_assignments_count,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Impact Capital Partners',
  'impact-capital-partners',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
  'https://impactcapitalpartners.example.com',
  'We invest in businesses that generate measurable social and environmental impact alongside financial returns. Our portfolio includes 50+ companies across clean energy, healthcare, education, and sustainable agriculture.',
  'enterprise',
  'To prove that profitability and impact are not just compatible, but mutually reinforcing. We invest in businesses solving the world''s most pressing challenges.',
  '[
    {"label": "Impact First", "icon": "TrendingUp", "description": "Impact and returns go hand-in-hand"},
    {"label": "Rigorous Analysis", "icon": "Search", "description": "Data-driven decision making"},
    {"label": "Long-term Thinking", "icon": "Calendar", "description": "Patient capital for sustainable growth"},
    {"label": "Transparency", "icon": "Eye", "description": "Open reporting on impact and finances"}
  ]'::jsonb,
  '["Impact Investing", "ESG", "Climate Finance", "Social Innovation"]'::jsonb,
  'London, United Kingdom',
  true,
  true,
  'domain_verification',
  'impactcapitalpartners.com',
  NOW() - INTERVAL '2 months',
  'FCA#12345678',
  'careers@impactcapitalpartners.com',
  @impactcapital_profile_id,
  'pro',
  false,
  15,
  1,
  NOW() - INTERVAL '8 years',
  NOW() - INTERVAL '3 days'
) RETURNING id INTO @impactcapital_id;

-- Assignment for Impact Capital Partners
INSERT INTO assignments (
  organization_id,
  title,
  description,
  assignment_type,
  location,
  is_remote,
  start_date,
  duration_text,
  time_commitment,
  budget_min,
  budget_max,
  budget_currency,
  required_expertise,
  required_languages,
  mission_alignment_weight,
  values_keywords,
  expected_outcomes,
  status,
  published_at,
  created_at
) VALUES
  (
    @impactcapital_id,
    'Senior Impact Measurement Analyst',
    'Design and implement impact measurement frameworks for portfolio companies. Work with founders to set impact KPIs, build measurement systems, and report to stakeholders. Requires deep expertise in impact measurement methodologies and data analysis.',
    'employment',
    'London, UK (hybrid - 3 days/week in office)',
    false,
    CURRENT_DATE + INTERVAL '60 days',
    'Permanent, full-time',
    'Full-time (40 hrs/week)',
    70000,
    90000,
    'GBP',
    '{"core_skills": ["Impact Measurement", "Data Analysis", "ESG Frameworks"], "nice_to_have": ["Portfolio management", "IRIS+ metrics", "B Impact Assessment"]}'::jsonb,
    ARRAY['English'],
    30,
    '["impact", "measurement", "ESG", "accountability"]'::jsonb,
    'Implement impact framework for 20 portfolio companies; Produce quarterly impact reports; Support 3 B Corp certifications',
    'published',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '10 days'
  );

COMMIT;


-- ============================================================================
-- VERIFICATION REQUESTS & RELATIONSHIPS
-- ============================================================================
-- Add some pending verification requests to show realistic state

BEGIN;

-- Add some verification requests for proofs
INSERT INTO verification_requests (
  proof_id,
  requester_id,
  verifier_email,
  verifier_name,
  verifier_organization,
  verifier_relationship,
  verification_token,
  token_expires_at,
  claim_description,
  status,
  created_at
)
SELECT 
  p.id,
  p.profile_id,
  'referee_' || substr(md5(random()::text), 1, 8) || '@example.com',
  'Professional Referee',
  'Example Organization',
  'Former Manager',
  encode(gen_random_bytes(32), 'hex'),
  NOW() + INTERVAL '14 days',
  p.claim_text,
  'pending',
  NOW() - INTERVAL '3 days'
FROM proofs p
WHERE p.verification_status = 'pending'
LIMIT 3;

COMMIT;


-- ============================================================================
-- ANALYTICS EVENTS (Sample Activity)
-- ============================================================================

BEGIN;

-- Sample analytics events to show platform usage
INSERT INTO analytics_events (event_name, event_category, user_id, session_id, properties, created_at)
SELECT 
  event_name,
  'profile',
  id,
  encode(gen_random_bytes(16), 'hex'),
  json_build_object('profile_completion', profile_completion_percentage)::jsonb,
  created_at + (random() * INTERVAL '30 days')
FROM profiles,
LATERAL (VALUES 
  ('profile_viewed'),
  ('profile_edited'),
  ('section_completed')
) AS events(event_name)
WHERE account_type = 'individual'
LIMIT 50;

COMMIT;


-- ============================================================================
-- SUMMARY & VERIFICATION QUERIES
-- ============================================================================

-- Verify all demo data was inserted correctly
DO $$
BEGIN
  RAISE NOTICE '=== DEMO DATA SEED COMPLETE ===';
  RAISE NOTICE 'Individual Profiles Created: %', (SELECT COUNT(*) FROM profiles WHERE account_type = 'individual' AND full_name IN ('Sofia Martinez', 'James Chen', 'Amara Okafor', 'Dr. Yuki Tanaka', 'Alex Rivera'));
  RAISE NOTICE 'Organization Profiles (Auth) Created: %', (SELECT COUNT(*) FROM profiles WHERE account_type = 'organization' AND full_name IN ('GreenTech Innovations', 'Code for Good Foundation', 'Impact Capital Partners'));
  RAISE NOTICE 'Organization Records Created: %', (SELECT COUNT(*) FROM organizations WHERE name IN ('GreenTech Innovations', 'Code for Good Foundation', 'Impact Capital Partners'));
  RAISE NOTICE 'Expertise Atlas Entries: %', (SELECT COUNT(*) FROM expertise_atlas);
  RAISE NOTICE 'Proofs Created: %', (SELECT COUNT(*) FROM proofs);
  RAISE NOTICE 'Assignments Posted: %', (SELECT COUNT(*) FROM assignments);
  RAISE NOTICE 'Artifacts Created: %', (SELECT COUNT(*) FROM artifacts);
  RAISE NOTICE '';
  RAISE NOTICE 'Demo profiles are ready for testing!';
  RAISE NOTICE 'Individual profile completion: 82% to 90%';
  RAISE NOTICE 'Organization profiles: 100% complete';
  RAISE NOTICE 'All profiles have realistic data for matching algorithm testing';
END $$;

-- Query to view all demo profiles
-- Uncomment to run after seeding:
/*
SELECT 
  full_name,
  region,
  account_type,
  profile_completion_percentage || '%' as completion,
  CASE 
    WHEN available_for_match THEN 'Available'
    ELSE 'Not Available'
  END as match_status
FROM profiles
WHERE full_name IN ('Sofia Martinez', 'James Chen', 'Amara Okafor', 'Dr. Yuki Tanaka', 'Alex Rivera')
ORDER BY full_name;
*/

