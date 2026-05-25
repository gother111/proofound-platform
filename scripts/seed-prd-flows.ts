import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

type UpsertOptions = { onConflict?: string };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local for local runs (mirrors other seed scripts)
const envPath = join(__dirname, '..', '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#') && values.length > 0 && !process.env[key.trim()]) {
      const value = values
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
} catch (err) {
  console.warn('⚠️  .env.local not found — assuming env vars already provided');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function logStep(message: string) {
  console.log(`\n▶️  ${message}`);
}

async function upsert(table: string, rows: any[], options: UpsertOptions = {}) {
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { ...options })
    .select();
  if (error) {
    throw new Error(`Upsert failed for ${table}: ${error.message}`);
  }
  return data ?? [];
}

async function ensureAuthUser(email: string, password: string, metadata: Record<string, unknown>) {
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw new Error(`auth listUsers failed: ${listError.message}`);

  const existing = userList.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (createError || !created?.user)
    throw new Error(`auth createUser failed for ${email}: ${createError?.message}`);
  return created.user.id;
}

async function main() {
  logStep('Seeding PRD-aligned taxonomy (best-effort)');
  const taxonomy = {
    categories: [
      {
        cat_id: 1,
        slug: 'product-design',
        name_i18n: { en: 'Product Design' },
        description_i18n: { en: 'UI/UX and product craft' },
        icon: '🎨',
        display_order: 100,
      },
      {
        cat_id: 2,
        slug: 'data-science',
        name_i18n: { en: 'Data Science' },
        description_i18n: { en: 'Analytics and ML' },
        icon: '📊',
        display_order: 200,
      },
      {
        cat_id: 3,
        slug: 'security',
        name_i18n: { en: 'Security' },
        description_i18n: { en: 'Security & privacy' },
        icon: '🔐',
        display_order: 300,
      },
      {
        cat_id: 4,
        slug: 'manufacturing',
        name_i18n: { en: 'Manufacturing' },
        description_i18n: { en: 'Ops & efficiency' },
        icon: '🏭',
        display_order: 400,
      },
      {
        cat_id: 5,
        slug: 'founder-ops',
        name_i18n: { en: 'Founder Ops' },
        description_i18n: { en: 'Growth, ops, fundraising' },
        icon: '🚀',
        display_order: 500,
      },
    ],
    subcategories: [
      { cat_id: 1, subcat_id: 1, slug: 'ux-ui', name_i18n: { en: 'UX/UI' }, display_order: 1 },
      {
        cat_id: 2,
        subcat_id: 1,
        slug: 'analytics-ml',
        name_i18n: { en: 'Analytics & ML' },
        display_order: 1,
      },
      {
        cat_id: 3,
        subcat_id: 1,
        slug: 'appsec',
        name_i18n: { en: 'Application Security' },
        display_order: 1,
      },
      {
        cat_id: 4,
        subcat_id: 1,
        slug: 'lean-ops',
        name_i18n: { en: 'Lean Ops' },
        display_order: 1,
      },
      {
        cat_id: 5,
        subcat_id: 1,
        slug: 'ops-strategy',
        name_i18n: { en: 'Ops & Strategy' },
        display_order: 1,
      },
    ],
    l3: [
      {
        cat_id: 1,
        subcat_id: 1,
        l3_id: 1,
        slug: 'ui-systems',
        name_i18n: { en: 'UI Systems' },
        display_order: 1,
      },
      {
        cat_id: 2,
        subcat_id: 1,
        l3_id: 1,
        slug: 'time-series',
        name_i18n: { en: 'Time Series' },
        display_order: 1,
      },
      {
        cat_id: 3,
        subcat_id: 1,
        l3_id: 1,
        slug: 'threat-modeling',
        name_i18n: { en: 'Threat Modeling' },
        display_order: 1,
      },
      {
        cat_id: 4,
        subcat_id: 1,
        l3_id: 1,
        slug: 'process-optimization',
        name_i18n: { en: 'Process Optimization' },
        display_order: 1,
      },
      {
        cat_id: 5,
        subcat_id: 1,
        l3_id: 1,
        slug: 'fundraising',
        name_i18n: { en: 'Fundraising' },
        display_order: 1,
      },
    ],
    l4: [
      {
        code: '01.01.01.901',
        cat_id: 1,
        subcat_id: 1,
        l3_id: 1,
        skill_id: 901,
        slug: 'figma-system',
        name_i18n: { en: 'Figma design system' },
        description_i18n: { en: 'Designing UI kits and systems in Figma' },
      },
      {
        code: '01.01.01.902',
        cat_id: 1,
        subcat_id: 1,
        l3_id: 1,
        skill_id: 902,
        slug: 'ux-research',
        name_i18n: { en: 'UX research synthesis' },
      },
      {
        code: '02.01.01.901',
        cat_id: 2,
        subcat_id: 1,
        l3_id: 1,
        skill_id: 901,
        slug: 'time-series-cleaning',
        name_i18n: { en: 'Time-series cleaning & forecasting' },
      },
      {
        code: '03.01.01.901',
        cat_id: 3,
        subcat_id: 1,
        l3_id: 1,
        skill_id: 901,
        slug: 'threat-modeling',
        name_i18n: { en: 'Threat modeling & SOC2 readiness' },
      },
      {
        code: '04.01.01.901',
        cat_id: 4,
        subcat_id: 1,
        l3_id: 1,
        skill_id: 901,
        slug: 'lean-oee',
        name_i18n: { en: 'Lean manufacturing & OEE' },
      },
      {
        code: '05.01.01.901',
        cat_id: 5,
        subcat_id: 1,
        l3_id: 1,
        skill_id: 901,
        slug: 'fundraising-strategy',
        name_i18n: { en: 'Fundraising strategy' },
      },
      {
        code: '05.01.01.902',
        cat_id: 5,
        subcat_id: 1,
        l3_id: 1,
        skill_id: 902,
        slug: 'org-ops',
        name_i18n: { en: 'Org ops & hiring' },
      },
    ],
  };

  try {
    await upsert('skills_categories', taxonomy.categories, { onConflict: 'cat_id' });
    await upsert('skills_subcategories', taxonomy.subcategories, {
      onConflict: 'cat_id,subcat_id',
    });
    await upsert('skills_l3', taxonomy.l3, { onConflict: 'cat_id,subcat_id,l3_id' });
    await upsert('skills_taxonomy', taxonomy.l4, { onConflict: 'code' });
  } catch (taxonomyError) {
    console.warn('⚠️  Skipping taxonomy upsert (likely existing or constrained):', taxonomyError);
  }

  logStep('Creating auth users');
  const users = {
    nenah: {
      email: 'nenah@proofound-demo.com',
      password: 'DemoPass123!',
      meta: { persona: 'student' },
    },
    mateo: {
      email: 'mateo@proofound-demo.com',
      password: 'DemoPass123!',
      meta: { persona: 'switcher' },
    },
    ola: {
      email: 'ola@proofound-demo.com',
      password: 'DemoPass123!',
      meta: { persona: 'advisor' },
    },
    dmitry: {
      email: 'dmitry@proofound-demo.com',
      password: 'DemoPass123!',
      meta: { persona: 'mentor' },
    },
    priya: {
      email: 'priya@proofound-demo.com',
      password: 'DemoPass123!',
      meta: { persona: 'founder' },
    },
    greengridAdmin: {
      email: 'ops@greengrid-demo.com',
      password: 'DemoPass123!',
      meta: { persona: 'org_admin' },
    },
    bridgesAdmin: {
      email: 'talent@bridges-demo.org',
      password: 'DemoPass123!',
      meta: { persona: 'org_admin' },
    },
    cityAdmin: {
      email: 'sourcing@cityworks-demo.gov',
      password: 'DemoPass123!',
      meta: { persona: 'org_admin' },
    },
  };

  const userIds: Record<string, string> = {};
  for (const [key, value] of Object.entries(users)) {
    userIds[key] = await ensureAuthUser(value.email, value.password, value.meta);
  }

  logStep('Upserting profiles and individual profile data');
  const profileRows = [
    { id: userIds.nenah, persona: 'individual', display_name: 'Nenah I.', handle: 'nenah-impact' },
    { id: userIds.mateo, persona: 'individual', display_name: 'Mateo D.', handle: 'mateo-climate' },
    { id: userIds.ola, persona: 'individual', display_name: 'Ola K.', handle: 'ola-sec' },
    {
      id: userIds.dmitry,
      persona: 'individual',
      display_name: 'Dmitry V.',
      handle: 'dmitry-mentor',
    },
    { id: userIds.priya, persona: 'individual', display_name: 'Priya R.', handle: 'priya-founder' },
    {
      id: userIds.greengridAdmin,
      persona: 'org_member',
      display_name: 'Greengrid Ops',
      handle: 'greengrid-ops',
    },
    {
      id: userIds.bridgesAdmin,
      persona: 'org_member',
      display_name: 'Bridges Talent',
      handle: 'bridges-talent',
    },
    {
      id: userIds.cityAdmin,
      persona: 'org_member',
      display_name: 'CityWorks Sourcing',
      handle: 'cityworks-sourcing',
    },
  ];
  await upsert('profiles', profileRows, { onConflict: 'id' });

  const individualProfiles = [
    {
      user_id: userIds.nenah,
      headline: 'Impact-driven grad ready to ship',
      mission: 'Build credible impact work fast',
      vision: 'Work on meaningful projects that help communities',
      values: [
        { icon: '🤝', label: 'Collaboration' },
        { icon: '🌱', label: 'Learning' },
      ],
      causes: ['Education', 'Climate Action'],
      location: 'Lisbon, PT',
      tagline: 'Starter designer & researcher',
    },
    {
      user_id: userIds.mateo,
      headline: 'Career switcher to climate data',
      mission: 'Use data to accelerate decarbonization',
      vision: 'Evidence-led climate work',
      values: [
        { icon: '📊', label: 'Evidence' },
        { icon: '🌍', label: 'Climate' },
      ],
      causes: ['Climate Action', 'Data for Good'],
      location: 'Madrid, ES',
      tagline: 'Data & analytics for climate',
    },
    {
      user_id: userIds.ola,
      headline: 'Senior security engineer & advisor',
      mission: 'Reduce risk with pragmatic security',
      vision: 'Trusted security for mission-driven orgs',
      values: [
        { icon: '🔐', label: 'Security' },
        { icon: '⚖️', label: 'Fairness' },
      ],
      causes: ['Privacy', 'Digital Rights'],
      location: 'Berlin, DE',
      tagline: 'Low-lift advisory sprints',
    },
    {
      user_id: userIds.dmitry,
      headline: 'Manufacturing mentor',
      mission: 'Help factories improve OEE',
      vision: 'Simple, measurable mentorship',
      values: [
        { icon: '🛠️', label: 'Practicality' },
        { icon: '📈', label: 'Efficiency' },
      ],
      causes: ['Community Development'],
      location: 'Warsaw, PL',
      tagline: 'Light mentorship & consulting',
    },
    {
      user_id: userIds.priya,
      headline: 'Social entrepreneur & founder',
      mission: 'Credibility with advisors & interns',
      vision: 'Purpose-led team with clear proof',
      values: [
        { icon: '💡', label: 'Innovation' },
        { icon: '🌐', label: 'Access' },
      ],
      causes: ['Youth Empowerment', 'Social Entrepreneurship'],
      location: 'London, UK',
      tagline: 'Building a purpose-led venture',
    },
  ];
  await upsert('individual_profiles', individualProfiles, { onConflict: 'user_id' });

  const fieldVisibility = [
    {
      profile_id: userIds.nenah,
      display_name: 'public',
      avatar: 'public',
      headline: 'public',
      location: 'network_only',
      mission: 'match_only',
      vision: 'match_only',
    },
    {
      profile_id: userIds.mateo,
      display_name: 'public',
      avatar: 'public',
      headline: 'public',
      location: 'public',
      mission: 'match_only',
      vision: 'match_only',
    },
    {
      profile_id: userIds.ola,
      display_name: 'public',
      avatar: 'public',
      headline: 'public',
      location: 'match_only',
      mission: 'match_only',
      vision: 'match_only',
    },
    {
      profile_id: userIds.dmitry,
      display_name: 'public',
      avatar: 'public',
      headline: 'public',
      location: 'public',
      mission: 'public',
      vision: 'public',
    },
    {
      profile_id: userIds.priya,
      display_name: 'public',
      avatar: 'public',
      headline: 'public',
      location: 'network_only',
      mission: 'public',
      vision: 'public',
    },
  ];
  await supabase.from('profile_field_visibility').delete().in('profile_id', Object.values(userIds));
  await supabase.from('profile_field_visibility').insert(fieldVisibility);

  const matchingProfiles = [
    {
      profile_id: userIds.nenah,
      values_tags: ['learning', 'collaboration'],
      cause_tags: ['Education', 'Climate Action'],
      country: 'Portugal',
      city: 'Lisbon',
      work_mode: 'remote',
      comp_min: 1500,
      comp_max: 2500,
      currency: 'EUR',
      weights: { skills: 0.5, values: 0.3, availability: 0.2 },
    },
    {
      profile_id: userIds.mateo,
      values_tags: ['Climate', 'Evidence'],
      cause_tags: ['Climate Action'],
      country: 'Spain',
      city: 'Madrid',
      work_mode: 'remote',
      comp_min: 3000,
      comp_max: 4200,
      currency: 'EUR',
      weights: { skills: 0.55, values: 0.25, availability: 0.2 },
    },
    {
      profile_id: userIds.ola,
      values_tags: ['Security', 'Efficiency'],
      cause_tags: ['Privacy'],
      country: 'Germany',
      city: 'Berlin',
      work_mode: 'remote',
      comp_min: 5000,
      comp_max: 6500,
      currency: 'EUR',
      weights: { skills: 0.6, values: 0.2, availability: 0.2 },
    },
    {
      profile_id: userIds.dmitry,
      values_tags: ['Efficiency', 'Practicality'],
      cause_tags: ['Community Development'],
      country: 'Poland',
      city: 'Warsaw',
      work_mode: 'hybrid',
      comp_min: 1000,
      comp_max: 2000,
      currency: 'EUR',
      weights: { skills: 0.45, values: 0.3, availability: 0.25 },
    },
    {
      profile_id: userIds.priya,
      values_tags: ['Innovation', 'Access'],
      cause_tags: ['Youth Empowerment'],
      country: 'UK',
      city: 'London',
      work_mode: 'hybrid',
      comp_min: 0,
      comp_max: 0,
      currency: 'GBP',
      weights: { skills: 0.4, values: 0.4, availability: 0.2 },
    },
  ];
  await upsert('matching_profiles', matchingProfiles, { onConflict: 'profile_id' });

  logStep('Seeding skills and proofs');
  await supabase.from('skill_proofs').delete().in('profile_id', Object.values(userIds));
  await supabase.from('skills').delete().in('profile_id', Object.values(userIds));

  const skillRows = [
    {
      id: randomUUID(),
      profile_id: userIds.nenah,
      skill_id: 'figma',
      level: 3,
      months_experience: 12,
      last_used_at: new Date().toISOString(),
      evidence_strength: 0.6,
    },
    {
      id: randomUUID(),
      profile_id: userIds.nenah,
      skill_id: 'ux-research',
      level: 2,
      months_experience: 8,
      evidence_strength: 0.5,
    },
    {
      id: randomUUID(),
      profile_id: userIds.mateo,
      skill_id: 'ts-forecast',
      level: 4,
      months_experience: 18,
      evidence_strength: 0.7,
    },
    {
      id: randomUUID(),
      profile_id: userIds.ola,
      skill_id: 'threat-modeling',
      level: 5,
      months_experience: 84,
      evidence_strength: 0.9,
    },
    {
      id: randomUUID(),
      profile_id: userIds.dmitry,
      skill_id: 'lean-oee',
      level: 4,
      months_experience: 120,
      evidence_strength: 0.85,
    },
    {
      id: randomUUID(),
      profile_id: userIds.priya,
      skill_id: 'fundraising',
      level: 4,
      months_experience: 48,
      evidence_strength: 0.75,
    },
    {
      id: randomUUID(),
      profile_id: userIds.priya,
      skill_id: 'org-ops',
      level: 4,
      months_experience: 60,
      evidence_strength: 0.7,
    },
  ];
  const skills = await upsert('skills', skillRows, { onConflict: 'id' });

  const proofRows = skills.map((skill) => ({
    skill_id: skill.id,
    profile_id: skill.profile_id,
    proof_type: 'link',
    title: `Proof for ${skill.skill_code}`,
    description: 'Sample evidence to satisfy verification gate',
    url: 'https://example.com/proof',
    verified: ['92.01.01.001', '93.01.01.001'].includes(skill.skill_code ?? ''),
  }));
  await upsert('skill_proofs', proofRows, { onConflict: 'id' });

  logStep('Seeding wellbeing (Zen Hub) data');
  const wellbeingOptIns = [
    {
      user_id: userIds.nenah,
      opted_in: true,
      privacy_banner_acknowledged: true,
      opted_in_at: new Date().toISOString(),
    },
    {
      user_id: userIds.mateo,
      opted_in: true,
      privacy_banner_acknowledged: true,
      opted_in_at: new Date().toISOString(),
    },
  ];
  await upsert('wellbeing_opt_ins', wellbeingOptIns, { onConflict: 'user_id' });

  await upsert(
    'wellbeing_checkins',
    [
      {
        user_id: userIds.nenah,
        stress_level: 2,
        control_level: 4,
        milestone_trigger_id: 'activation',
        created_at: new Date().toISOString(),
      },
      {
        user_id: userIds.mateo,
        stress_level: 3,
        control_level: 3,
        milestone_trigger_id: 'interview',
        created_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'id' }
  );

  await upsert(
    'wellbeing_reflections',
    [
      {
        user_id: userIds.nenah,
        reflection_text: 'Feeling more confident after first intro.',
        milestone_type: 'interview',
        created_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'id' }
  );

  logStep('Creating organizations and members');
  const orgs = [
    {
      key: 'greengrid',
      id: 'aaaa1111-2222-4333-8444-aaaaaaaaaaaa',
      display_name: 'GreenGrid Energy',
      slug: 'greengrid-energy',
      type: 'company',
      mission: 'Scale low-carbon grid infra with secure systems',
      vision: 'Resilient grid with trusted advisors',
      values: [
        { icon: '🌍', label: 'Impact' },
        { icon: '🔐', label: 'Security' },
      ],
      causes: ['Climate Action', 'Energy'],
      work_culture: {
        collaboration: 'Lean squads',
        decision_making: 'Data-led',
        wellbeing: 'Low meeting load',
      },
      adminUser: userIds.greengridAdmin,
      assignment: {
        id: 'aaaa1111-2222-4333-8444-aaaaaaaaaa01',
        role: 'Security Advisor Sprint',
        status: 'active',
        creation_status: 'published',
        business_value: 'Reduce SOC2 gaps for critical systems',
        expected_impact: 'Audit-ready in 4 weeks',
        values_required: ['Security', 'Clarity'],
        cause_tags: ['Climate Action'],
        must_have_skills: [{ id: 'threat-modeling', level: 5 }],
        verification_gates: ['portfolio_link', 'id_check'],
        location_mode: 'remote',
        comp_min: 8000,
        comp_max: 12000,
        currency: 'EUR',
      },
    },
    {
      key: 'bridges',
      id: 'bbbb1111-2222-4333-8444-bbbbbbbbbbbb',
      display_name: 'Bridges for Youth',
      slug: 'bridges-for-youth',
      type: 'ngo',
      mission: 'Recruit skilled volunteers with donor-ready impact',
      vision: 'Safe, transparent volunteering',
      values: [
        { icon: '🤝', label: 'Equity' },
        { icon: '🌱', label: 'Growth' },
      ],
      causes: ['Youth', 'Education'],
      work_culture: {
        collaboration: 'Community-first',
        decision_making: 'Shared',
        wellbeing: 'Async friendly',
      },
      adminUser: userIds.bridgesAdmin,
      assignment: {
        id: 'bbbb1111-2222-4333-8444-bbbbbbbbbb01',
        role: 'Volunteer Program Lead',
        status: 'active',
        creation_status: 'published',
        business_value: 'Launch volunteer cohort in 30 days',
        expected_impact: '10 active mentors matched',
        values_required: ['Equity', 'Clarity'],
        cause_tags: ['Youth Empowerment'],
        must_have_skills: [{ id: 'lean-oee', level: 4 }],
        verification_gates: ['reference'],
        location_mode: 'hybrid',
        comp_min: 0,
        comp_max: 0,
        currency: 'USD',
      },
    },
    {
      key: 'cityworks',
      id: 'cccc1111-2222-4333-8444-cccccccccccc',
      display_name: 'CityWorks Dept.',
      slug: 'cityworks-dept',
      type: 'government',
      mission: 'Transparent sourcing with audit trail',
      vision: 'Fast, compliant micro-RFPs',
      values: [
        { icon: '🏛️', label: 'Transparency' },
        { icon: '⏱️', label: 'Speed' },
      ],
      causes: ['Civic Tech'],
      work_culture: {
        collaboration: 'Cross-dept',
        decision_making: 'Policy-first',
        wellbeing: 'Reasonable hours',
      },
      adminUser: userIds.cityAdmin,
      assignment: {
        id: 'cccc1111-2222-4333-8444-cccccccccc01',
        role: 'Data Analyst - Mobility',
        status: 'active',
        creation_status: 'published',
        business_value: 'Better transit forecasting',
        expected_impact: 'Improve ETA accuracy by 10%',
        values_required: ['Transparency'],
        cause_tags: ['Civic Tech'],
        must_have_skills: [{ id: 'ts-forecast', level: 4 }],
        verification_gates: ['portfolio_link'],
        location_mode: 'hybrid',
        comp_min: 5000,
        comp_max: 6500,
        currency: 'EUR',
      },
    },
  ];

  await upsert(
    'organizations',
    orgs.map((org) => ({
      id: org.id,
      slug: org.slug,
      display_name: org.display_name,
      type: org.type,
      mission: org.mission,
      vision: org.vision,
      values: org.values,
      causes: org.causes,
      work_culture: org.work_culture,
      created_by: org.adminUser,
    })),
    { onConflict: 'id' }
  );

  await supabase
    .from('organization_field_visibility')
    .delete()
    .in(
      'org_id',
      orgs.map((o) => o.id)
    );
  await supabase.from('organization_field_visibility').insert(
    orgs.map((org) => ({
      org_id: org.id,
      display_name: 'public',
      mission: 'public',
      vision: 'public',
      causes: 'public',
    }))
  );

  const orgMembers = orgs.map((org) => ({
    org_id: org.id,
    user_id: org.adminUser,
    role: 'org_owner',
    state: 'active',
  }));
  await upsert('organization_members', orgMembers, { onConflict: 'org_id,user_id' });

  logStep('Creating assignments, outcomes, expertise matrix');
  await upsert(
    'assignments',
    orgs.map((org) => ({
      id: org.assignment.id,
      org_id: org.id,
      role: org.assignment.role,
      description: org.assignment.business_value,
      status: org.assignment.status,
      creation_status: org.assignment.creation_status,
      business_value: org.assignment.business_value,
      expected_impact: org.assignment.expected_impact,
      values_required: org.assignment.values_required,
      cause_tags: org.assignment.cause_tags,
      must_have_skills: org.assignment.must_have_skills,
      verification_gates: org.assignment.verification_gates,
      location_mode: org.assignment.location_mode,
      comp_min: org.assignment.comp_min,
      comp_max: org.assignment.comp_max,
      currency: org.assignment.currency,
      weights: { skills: 0.6, values: 0.2, constraints: 0.2 },
    })),
    { onConflict: 'id' }
  );

  const outcomeIds = orgs.map(() => randomUUID());
  const outcomes = orgs.map((org, idx) => ({
    id: outcomeIds[idx],
    assignment_id: org.assignment.id,
    outcome_type: 'milestone',
    title: 'Launch milestone',
    description: 'Primary milestone for PRD flow tests',
    metrics: [{ name: 'TTFQI', target: '72h', unit: 'hours' }],
    success_criteria: 'Shortlist produced',
  }));
  await upsert('assignment_outcomes', outcomes, { onConflict: 'id' });

  const skillCodeMap: Record<string, string> = {
    'threat-modeling': '03.01.01.901',
    'lean-oee': '04.01.01.901',
    'ts-forecast': '02.01.01.901',
  };

  const expertiseMatrix = orgs.flatMap((org, idx) =>
    org.assignment.must_have_skills.map((skill) => ({
      id: randomUUID(),
      assignment_id: org.assignment.id,
      skill_code: skillCodeMap[skill.id] ?? null,
      required_level: skill.level,
      stakeholder_role: 'must',
      linked_outcome_id: outcomeIds[idx],
      outcome_rationale: 'PRD seed coverage',
    }))
  );

  await supabase
    .from('assignment_expertise_matrix')
    .delete()
    .in(
      'assignment_id',
      orgs.map((o) => o.assignment.id)
    );
  await supabase
    .from('assignment_expertise_matrix')
    .insert(expertiseMatrix.filter((row) => row.skill_code));

  logStep('Creating matches, conversations, messages, and interviews');
  const matchIds = {
    ola: randomUUID(),
    dmitry: randomUUID(),
    mateo: randomUUID(),
  };

  await supabase
    .from('matches')
    .delete()
    .or(
      `assignment_id.in.(${orgs.map((o) => o.assignment.id).join(',')}),profile_id.in.(${[
        userIds.ola,
        userIds.dmitry,
        userIds.mateo,
        userIds.nenah,
        userIds.priya,
      ].join(',')})`
    );

  const matchRows = [
    {
      id: matchIds.ola,
      assignment_id: orgs[0].assignment.id,
      profile_id: userIds.ola,
      score: 0.91,
      vector: { skills: 0.95, constraints: 0.9, verification: 0.85, pac: 0.8 },
      weights: { skills: 0.6, values: 0.2, constraints: 0.2 },
    },
    {
      id: matchIds.dmitry,
      assignment_id: orgs[1].assignment.id,
      profile_id: userIds.dmitry,
      score: 0.82,
      vector: { skills: 0.8, constraints: 0.8, verification: 0.7, pac: 0.76 },
      weights: { skills: 0.6, values: 0.2, constraints: 0.2 },
    },
    {
      id: matchIds.mateo,
      assignment_id: orgs[2].assignment.id,
      profile_id: userIds.mateo,
      score: 0.88,
      vector: { skills: 0.9, constraints: 0.86, verification: 0.8, pac: 0.74 },
      weights: { skills: 0.6, values: 0.2, constraints: 0.2 },
    },
  ];
  await upsert('matches', matchRows, { onConflict: 'id' });

  const conversationId = randomUUID();
  const conversationRows = [
    {
      id: conversationId,
      match_id: matchIds.ola,
      assignment_id: orgs[0].assignment.id,
      participant_one_id: userIds.ola,
      participant_two_id: orgs[0].adminUser,
      stage: 'masked',
      masked_handle_one: 'Security Advisor',
      masked_handle_two: 'Org Rep',
      last_message_at: new Date().toISOString(),
    },
  ];
  await upsert('conversations', conversationRows, { onConflict: 'id' });

  await upsert(
    'messages',
    [
      {
        conversation_id: conversationId,
        sender_id: userIds.ola,
        content: 'Thanks for the shortlist — happy to schedule the 30-min call.',
        contains_email: false,
        contains_phone: false,
        contains_url: false,
        status: 'sent',
      },
    ],
    { onConflict: 'id' }
  );

  const interviewId = randomUUID();
  await upsert(
    'interviews',
    [
      {
        id: interviewId,
        match_id: matchIds.ola,
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        platform: 'manual',
        manual_meeting_provider: 'teams',
        meeting_id: 'manual-ola-sec',
        host_user_id: orgs[0].adminUser,
        participant_user_ids: [userIds.ola, orgs[0].adminUser],
        status: 'scheduled',
      },
    ],
    { onConflict: 'id' }
  );

  logStep('Seeding analytics events for dashboards');
  const now = new Date();
  await upsert(
    'analytics_events',
    [
      {
        event_type: 'profile_activated',
        user_id: userIds.nenah,
        properties: { l4_count: 2 },
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
      {
        event_type: 'first_qualified_intro',
        user_id: userIds.nenah,
        entity_type: 'match',
        entity_id: matchIds.ola,
        properties: { match_score: 0.9 },
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        event_type: 'interview_scheduled',
        user_id: userIds.ola,
        entity_type: 'interview',
        entity_id: interviewId,
        properties: { assignment_id: orgs[0].assignment.id },
        created_at: now.toISOString(),
      },
      {
        event_type: 'match_generated',
        user_id: userIds.mateo,
        entity_type: 'match',
        entity_id: matchIds.mateo,
        properties: { score: 0.88 },
        created_at: now.toISOString(),
      },
    ],
    { onConflict: 'id' }
  );

  logStep('PRD seed complete ✅');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
