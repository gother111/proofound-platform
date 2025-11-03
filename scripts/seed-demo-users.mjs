/**
 * Comprehensive Demo User Seeding Script
 * 
 * Populates 5 demo accounts with rich, diverse test data including:
 * - Complete profiles with handles, bios, values, causes
 * - Skills with evidence and proficiency levels
 * - Projects with outcomes and metrics
 * - Impact stories, experiences, education, volunteering
 * - Cross-user relationships (endorsements, verifications)
 * 
 * Run with: node scripts/seed-demo-users.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as readline from 'readline';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#') && values.length > 0) {
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (err) {
  console.error('⚠️  Could not load .env.local file');
}

// Get Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Demo user IDs (from the database query results)
const DEMO_USERS = {
  sofia: '0584f063-58cd-4e1f-a95d-c54c105a7ac0',
  james: 'f800f9ca-debf-480d-b499-36c9629296bb',
  amara: 'c2b84624-0b57-42ca-8de7-68ef4dff60b7',
  yuki: 'e1a2e4a3-d0dc-474e-af49-0adee9c020f0',
  alex: 'c7646252-1018-4cef-ab77-e738f5e24d71',
};

// Track what we create for summary report
const stats = {
  profiles: 0,
  skills: 0,
  projects: 0,
  projectSkills: 0,
  impactStories: 0,
  experiences: 0,
  education: 0,
  volunteering: 0,
  capabilities: 0,
  evidence: 0,
  endorsements: 0,
  verificationRequests: 0,
};

// Helper to get confirmation from user
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// ============================================================================
// PROFILE DATA
// ============================================================================

const profileData = {
  sofia: {
    handle: 'sofia-martinez',
    displayName: 'Sofia Martinez',
    email: 'sofia.martinez@proofound-demo.com',
    headline: 'UX/Product Designer specializing in Climate Tech & Sustainable Innovation',
    bio: `I'm a product designer passionate about creating digital experiences that drive positive environmental impact. With 8 years in the tech industry, I've helped climate tech startups and social enterprises design user-centered solutions that make sustainability accessible and engaging.

My approach combines rigorous user research with systems thinking to create products that not only look beautiful but create meaningful behavior change. I believe design has the power to make complex environmental challenges understandable and actionable.

Currently focused on designing for the circular economy and helping organizations measure and communicate their impact effectively.`,
    tagline: 'Designing for climate action and sustainable futures',
    mission: 'To make sustainable living intuitive and delightful through thoughtful design',
    vision: 'A world where every digital product considers its environmental and social impact from day one',
    location: 'Barcelona, Spain',
    values: [
      { icon: '🌍', label: 'Environmental Sustainability', verified: true },
      { icon: '🎨', label: 'Design Excellence', verified: false },
      { icon: '🤝', label: 'Collaborative Innovation', verified: true },
      { icon: '📊', label: 'Data-Driven Decisions', verified: false },
    ],
    causes: ['Climate Action', 'Circular Economy', 'Sustainable Technology', 'Environmental Justice'],
    skills: ['UI/UX Design', 'User Research', 'Figma', 'Product Strategy', 'Design Systems', 'Prototyping', 'Sustainability', 'Data Visualization'],
  },
  james: {
    handle: 'james-chen',
    displayName: 'James Chen',
    email: 'james.chen@proofound-demo.com',
    headline: 'Full-Stack Engineer building secure, scalable payment systems',
    bio: `I'm a software engineer with a decade of experience building financial technology systems that handle billions in transactions. My expertise spans the full stack, from React frontends to distributed backend systems, with a particular focus on payment infrastructure and security.

I'm passionate about writing clean, maintainable code and building systems that can scale. I've led teams through complex technical challenges and believe in the power of good architecture and testing to create reliable systems.

Currently exploring how blockchain and Web3 technologies can make financial services more accessible and equitable globally.`,
    tagline: 'Building the financial infrastructure of tomorrow',
    mission: 'To create financial technology that is secure, accessible, and serves everyone',
    vision: 'Financial systems that are as easy to use as social media, but with bank-grade security',
    location: 'Singapore',
    values: [
      { icon: '🔐', label: 'Security First', verified: true },
      { icon: '⚡', label: 'Performance & Scale', verified: true },
      { icon: '🎯', label: 'Precision & Quality', verified: false },
      { icon: '🌐', label: 'Global Accessibility', verified: true },
    ],
    causes: ['Financial Inclusion', 'Open Source', 'Tech Education', 'Digital Privacy'],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Architecture', 'Payment Systems', 'API Design', 'Cloud Infrastructure'],
  },
  amara: {
    handle: 'amara-okafor',
    displayName: 'Amara Okafor',
    email: 'amara.okafor@proofound-demo.com',
    headline: 'Social Impact Strategist driving education equity across Africa',
    bio: `I'm a social impact professional dedicated to creating pathways to education for underserved communities across Africa. With 7 years leading programs for international NGOs, I've developed a deep understanding of what it takes to create sustainable change in complex environments.

My work focuses on community-led development, measuring real impact, and building local capacity. I believe that the best solutions come from the communities themselves, and my role is to facilitate, support, and amplify their voices.

I'm particularly interested in how technology can accelerate education access while respecting local contexts and cultures.`,
    tagline: 'Empowering communities through education and strategic partnerships',
    mission: 'To ensure every child has access to quality education regardless of where they are born',
    vision: 'An Africa where education is a bridge to opportunity, not a barrier',
    location: 'Lagos, Nigeria',
    values: [
      { icon: '✊', label: 'Equity & Justice', verified: true },
      { icon: '🤲', label: 'Community Empowerment', verified: true },
      { icon: '📈', label: 'Impact Measurement', verified: false },
      { icon: '🌱', label: 'Sustainable Development', verified: true },
    ],
    causes: ['Education Equity', 'Youth Empowerment', 'Community Development', 'Gender Equality'],
    skills: ['Program Management', 'Community Engagement', 'Impact Measurement', 'Strategic Planning', 'Stakeholder Management', 'Fundraising', 'Monitoring & Evaluation', 'Partnership Development'],
  },
  yuki: {
    handle: 'yuki-tanaka',
    displayName: 'Yuki Tanaka',
    email: 'yuki.tanaka@proofound-demo.com',
    headline: 'AI/ML Engineer applying data science to healthcare challenges',
    bio: `I'm a data scientist and machine learning engineer specializing in healthcare applications. With a background in both computer science and biomedical engineering, I bridge the gap between cutting-edge AI technology and real-world medical needs.

My work focuses on predictive analytics, medical imaging analysis, and clinical decision support systems. I'm committed to building AI that is not only accurate but also interpretable and fair, ensuring that healthcare AI serves all patients equitably.

I believe we're at an exciting moment where AI can truly transform healthcare outcomes, but only if we build these systems thoughtfully and ethically.`,
    tagline: 'Advancing healthcare through ethical AI and data science',
    mission: 'To leverage AI and data science to improve patient outcomes and make healthcare more accessible',
    vision: 'Healthcare systems powered by AI that are accurate, interpretable, and equitable for all',
    location: 'Tokyo, Japan',
    values: [
      { icon: '🔬', label: 'Scientific Rigor', verified: true },
      { icon: '⚖️', label: 'AI Ethics', verified: true },
      { icon: '💡', label: 'Innovation', verified: false },
      { icon: '🏥', label: 'Healthcare Impact', verified: true },
    ],
    causes: ['Healthcare Access', 'AI Ethics', 'Medical Research', 'Health Equity'],
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'TensorFlow', 'PyTorch', 'Statistical Modeling', 'Healthcare Analytics', 'Deep Learning'],
  },
  alex: {
    handle: 'alex-rivera',
    displayName: 'Alex Rivera',
    email: 'alex.rivera@proofound-demo.com',
    headline: 'Community Organizer and Education Advocate fighting for social justice',
    bio: `I'm a community organizer and program manager who has spent the last 9 years building grassroots movements for education access and social justice. My work centers on amplifying marginalized voices and creating spaces where communities can organize for systemic change.

I've led campaigns that secured funding for public schools, organized thousands of community members, and built coalitions across diverse stakeholders. I believe in the power of collective action and that real change comes from the ground up.

My approach combines traditional community organizing with modern digital tools to mobilize, educate, and empower communities to advocate for themselves.`,
    tagline: 'Building power through community organizing and education advocacy',
    mission: 'To build strong, organized communities that can advocate for systemic change',
    vision: 'A society where education is truly public, equitable, and transformative',
    location: 'Mexico City, Mexico',
    values: [
      { icon: '✊', label: 'Social Justice', verified: true },
      { icon: '🗣️', label: 'Grassroots Power', verified: true },
      { icon: '🤝', label: 'Solidarity', verified: false },
      { icon: '📚', label: 'Education for All', verified: true },
    ],
    causes: ['Education Access', 'Social Justice', 'Workers Rights', 'Immigration Reform'],
    skills: ['Community Organizing', 'Campaign Strategy', 'Public Speaking', 'Fundraising', 'Coalition Building', 'Event Management', 'Advocacy', 'Digital Organizing'],
  },
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedProfiles() {
  console.log('\n📝 Seeding profiles and individual_profiles...');
  
  for (const [key, userId] of Object.entries(DEMO_USERS)) {
    const data = profileData[key];
    
    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        handle: data.handle,
        display_name: data.displayName,
        persona: 'individual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (profileError) {
      console.error(`   ❌ Error updating profile for ${data.displayName}:`, profileError.message);
      continue;
    }
    
    // Upsert individual_profiles table
    const { error: individualError } = await supabase
      .from('individual_profiles')
      .upsert({
        user_id: userId,
        headline: data.headline,
        bio: data.bio,
        skills: data.skills,
        location: data.location,
        visibility: 'public',
        tagline: data.tagline,
        mission: data.mission,
        vision: data.vision,
        values: data.values,
        causes: data.causes,
        verified: false,
      }, {
        onConflict: 'user_id',
      });
    
    if (individualError) {
      console.error(`   ❌ Error updating individual profile for ${data.displayName}:`, individualError.message);
    } else {
      console.log(`   ✅ ${data.displayName} profile updated`);
      stats.profiles++;
    }
  }
}

async function seedSkills() {
  console.log('\n🎯 Seeding skills...');
  
  // First, get some skill codes from the taxonomy
  const { data: taxonomySkills, error: taxonomyError } = await supabase
    .from('skills_taxonomy')
    .select('code, l4_skill_name')
    .limit(100);
  
  if (taxonomyError) {
    console.error('   ⚠️  Could not fetch skills taxonomy:', taxonomyError.message);
    console.log('   ℹ️  Continuing with legacy skill IDs...');
  }
  
  const skillsToCreate = [
    // Sofia - UX/Product Designer
    {
      userId: DEMO_USERS.sofia,
      skills: [
        { id: 'ui-ux-design', code: '02.052.412.04194', level: 5, months: 96, evidence: 0.9, recency: 1.0, relevance: 'current' }, // User-centered design & layout
        { id: 'user-research', code: '02.052.412.04194', level: 4, months: 84, evidence: 0.85, recency: 0.95, relevance: 'current' }, // User-centered design & layout
        { id: 'figma', code: '03.090.720.13593', level: 5, months: 60, evidence: 0.9, recency: 1.0, relevance: 'current' }, // Enterprise figma/sketch mastery
        { id: 'product-strategy', code: '05.119.958.09618', level: 4, months: 72, evidence: 0.8, recency: 0.9, relevance: 'current' }, // Product ownership
        { id: 'design-systems', code: '06.167.1340.00228', level: 4, months: 48, evidence: 0.85, recency: 0.95, relevance: 'current' }, // Design systems creation
        { id: 'prototyping', code: '06.167.1340.00234', level: 5, months: 90, evidence: 0.9, recency: 1.0, relevance: 'current' }, // Prototyping
        { id: 'data-visualization', code: '06.172.1384.03396', level: 3, months: 36, evidence: 0.7, recency: 0.85, relevance: 'emerging' }, // Applied Data & visualization
        { id: 'sustainability-design', code: '06.169.1358.00106', level: 4, months: 48, evidence: 0.85, recency: 0.95, relevance: 'emerging' }, // Sustainability & water assessment
      ],
    },
    // James - Full-Stack Developer
    {
      userId: DEMO_USERS.james,
      skills: [
        { id: 'typescript', code: '03.082.653.13651', level: 5, months: 84, evidence: 0.95, recency: 1.0, relevance: 'current' }, // Python programming (fallback for programming)
        { id: 'react', code: '03.082.653.13650', level: 5, months: 96, evidence: 0.95, recency: 1.0, relevance: 'current' }, // JavaScript programming
        { id: 'nodejs', code: '03.082.653.13650', level: 5, months: 108, evidence: 0.9, recency: 1.0, relevance: 'current' }, // JavaScript programming
        { id: 'postgresql', code: '06.149.1193.00920', level: 4, months: 72, evidence: 0.85, recency: 0.95, relevance: 'current' }, // Data structures & algorithms
        { id: 'system-architecture', code: '02.055.434.05635', level: 4, months: 84, evidence: 0.9, recency: 0.95, relevance: 'current' }, // Applied System architecture
        { id: 'payment-systems', code: '03.076.603.13866', level: 5, months: 60, evidence: 0.95, recency: 1.0, relevance: 'current' }, // Checkout & payments customization
        { id: 'api-design', code: '06.177.1423.02027', level: 4, months: 96, evidence: 0.85, recency: 0.9, relevance: 'current' }, // API documentation
        { id: 'cloud-infrastructure', code: '02.059.472.03968', level: 4, months: 72, evidence: 0.8, recency: 0.9, relevance: 'current' }, // Applied Multi-cloud & networking
        { id: 'web3', code: '03.082.653.13651', level: 3, months: 18, evidence: 0.65, recency: 1.0, relevance: 'emerging' }, // Python programming (fallback)
      ],
    },
    // Amara - Social Impact Strategist
    {
      userId: DEMO_USERS.amara,
      skills: [
        { id: 'program-management', code: '02.046.368.04621', level: 5, months: 84, evidence: 0.9, recency: 1.0, relevance: 'current' }, // Program evaluation analysis
        { id: 'community-engagement', code: '02.048.379.06818', level: 5, months: 84, evidence: 0.95, recency: 1.0, relevance: 'current' }, // Community engagement analysis
        { id: 'impact-measurement', code: '01.008.064.17357', level: 4, months: 60, evidence: 0.85, recency: 0.95, relevance: 'current' }, // Social & environmental impact assessment
        { id: 'strategic-planning', code: '06.163.1312.00493', level: 4, months: 72, evidence: 0.8, recency: 0.9, relevance: 'current' }, // Strategic planning
        { id: 'stakeholder-management', code: '06.163.1305.00552', level: 4, months: 84, evidence: 0.85, recency: 0.95, relevance: 'current' }, // Stakeholder management
        { id: 'fundraising', code: '02.048.379.06818', level: 4, months: 60, evidence: 0.8, recency: 0.9, relevance: 'current' }, // Community engagement (fallback)
        { id: 'monitoring-evaluation', code: '02.049.385.04782', level: 4, months: 72, evidence: 0.85, recency: 0.95, relevance: 'current' }, // Environmental monitoring evaluation
        { id: 'partnership-development', code: '02.042.334.07711', level: 3, months: 48, evidence: 0.75, recency: 0.85, relevance: 'current' }, // Strategic partnerships
      ],
    },
    // Yuki - Data Scientist/AI Engineer
    {
      userId: DEMO_USERS.yuki,
      skills: [
        { id: 'python', code: '03.082.653.13651', level: 5, months: 96, evidence: 0.95, recency: 1.0, relevance: 'current' }, // Python programming
        { id: 'machine-learning', code: '02.056.447.04497', level: 5, months: 84, evidence: 0.95, recency: 1.0, relevance: 'current' }, // Forecasting & ML basics
        { id: 'data-analysis', code: '06.149.1193.00920', level: 5, months: 108, evidence: 0.9, recency: 1.0, relevance: 'current' }, // Data structures & algorithms
        { id: 'tensorflow', code: '03.082.653.13651', level: 4, months: 60, evidence: 0.85, recency: 0.95, relevance: 'current' }, // Python programming (fallback)
        { id: 'pytorch', code: '03.082.653.13651', level: 4, months: 48, evidence: 0.85, recency: 1.0, relevance: 'current' }, // Python programming (fallback)
        { id: 'statistical-modeling', code: '02.054.428.07129', level: 4, months: 72, evidence: 0.8, recency: 0.9, relevance: 'current' }, // Enterprise statistical analysis
        { id: 'healthcare-analytics', code: '06.149.1193.00920', level: 4, months: 60, evidence: 0.9, recency: 0.95, relevance: 'current' }, // Data structures & algorithms (fallback)
        { id: 'deep-learning', code: '02.056.447.04497', level: 4, months: 54, evidence: 0.85, recency: 1.0, relevance: 'current' }, // ML basics (fallback)
        { id: 'nlp', code: '03.082.653.13651', level: 3, months: 36, evidence: 0.75, recency: 0.9, relevance: 'emerging' }, // Python programming (fallback)
      ],
    },
    // Alex - Community Organizer
    {
      userId: DEMO_USERS.alex,
      skills: [
        { id: 'community-organizing', code: '02.048.379.06818', level: 5, months: 108, evidence: 0.95, recency: 1.0, relevance: 'current' }, // Community engagement analysis
        { id: 'campaign-strategy', code: '03.073.579.13429', level: 4, months: 96, evidence: 0.9, recency: 1.0, relevance: 'current' }, // Segmentation & campaigns
        { id: 'public-speaking', code: '06.156.1253.01377', level: 5, months: 108, evidence: 0.9, recency: 1.0, relevance: 'current' }, // Public speaking to large groups
        { id: 'fundraising', code: '02.048.379.06818', level: 4, months: 84, evidence: 0.85, recency: 0.95, relevance: 'current' }, // Community engagement (fallback)
        { id: 'coalition-building', code: '02.042.334.07711', level: 4, months: 96, evidence: 0.9, recency: 0.95, relevance: 'current' }, // Strategic partnerships
        { id: 'event-management', code: '02.036.283.05211', level: 4, months: 108, evidence: 0.85, recency: 0.9, relevance: 'current' }, // Event planning & runsheet
        { id: 'advocacy', code: '05.137.1100.11131', level: 5, months: 108, evidence: 0.95, recency: 1.0, relevance: 'current' }, // Applied Community & advocacy
        { id: 'digital-organizing', code: '03.073.579.13429', level: 3, months: 36, evidence: 0.75, recency: 0.95, relevance: 'emerging' }, // Segmentation & campaigns (fallback)
      ],
    },
  ];
  
  for (const userSkills of skillsToCreate) {
    for (const skill of userSkills.skills) {
      const { error } = await supabase
        .from('skills')
        .insert({
          profile_id: userSkills.userId,
          skill_id: skill.id,
          skill_code: skill.code,
          level: skill.level,
          months_experience: skill.months,
          evidence_strength: skill.evidence.toString(),
          recency_multiplier: skill.recency.toString(),
          impact_score: ((skill.level / 5) * 0.8).toFixed(2),
          last_used_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error(`   ⚠️  Error creating skill ${skill.id}:`, error.message);
      } else if (!error) {
        stats.skills++;
      }
    }
  }
  
  console.log(`   ✅ Created ${stats.skills} skills`);
}

async function seedProjects() {
  console.log('\n🚀 Seeding projects...');
  
  const projectsData = [
    // Sofia's projects
    {
      userId: DEMO_USERS.sofia,
      title: 'Carbon Footprint Tracker App',
      description: 'Designed a mobile app helping users understand and reduce their carbon footprint through daily actions',
      projectType: 'work',
      status: 'concluded',
      startDate: '2022-01-15',
      endDate: '2023-06-30',
      organizationName: 'GreenTech Solutions',
      roleTitle: 'Lead Product Designer',
      outcomes: {
        metrics: [
          { name: 'Active users', value: 50000, unit: 'users' },
          { name: 'Carbon saved', value: 12000, unit: 'tons CO2' },
          { name: 'User retention', value: 68, unit: 'percent' },
        ],
        qualitative: 'Led design from concept to launch, conducted 40+ user interviews, created comprehensive design system',
        impact_score: 0.85,
      },
      impactSummary: 'Helped 50K+ users reduce carbon footprint by an average of 240kg CO2/year',
      verified: true,
      verifiedAt: '2023-08-15',
      visibility: 'public',
      tags: ['UX Design', 'Climate Tech', 'Mobile App'],
      skills: [
        { code: '02.052.412.04194', level: 5, frequency: 'daily', hours: 800 }, // User-centered design & layout
        { code: '02.052.412.04194', level: 4, frequency: 'weekly', hours: 200 }, // User-centered design & layout
        { code: '03.090.720.13593', level: 5, frequency: 'daily', hours: 600 }, // Enterprise figma/sketch mastery
      ],
    },
    {
      userId: DEMO_USERS.sofia,
      title: 'Circular Economy Platform Design',
      description: 'Designed a B2B marketplace connecting businesses for waste material exchange',
      projectType: 'work',
      status: 'ongoing',
      startDate: '2024-03-01',
      endDate: null,
      organizationName: 'CircularHub',
      roleTitle: 'Product Designer',
      outcomes: {
        metrics: [
          { name: 'Businesses onboarded', value: 120, unit: 'companies' },
          { name: 'Materials exchanged', value: 450, unit: 'tons' },
        ],
        qualitative: 'Ongoing project, currently in beta with 120 businesses',
        impact_score: 0.75,
      },
      impactSummary: 'Facilitating circular economy practices for 120+ businesses',
      verified: false,
      visibility: 'public',
      tags: ['Product Design', 'B2B', 'Sustainability'],
      skills: [
        { code: '05.119.958.09618', level: 4, frequency: 'daily', hours: 200 }, // Product ownership
        { code: '02.052.412.04194', level: 5, frequency: 'daily', hours: 400 }, // User-centered design & layout
      ],
    },
    // James's projects
    {
      userId: DEMO_USERS.james,
      title: 'Real-time Payment Processing System',
      description: 'Architected and built a high-throughput payment processing system handling 10K+ transactions per second',
      projectType: 'work',
      status: 'concluded',
      startDate: '2021-06-01',
      endDate: '2023-03-31',
      organizationName: 'PayFlow Technologies',
      roleTitle: 'Senior Backend Engineer',
      outcomes: {
        metrics: [
          { name: 'Transactions per second', value: 10000, unit: 'TPS' },
          { name: 'Transaction volume', value: 2.5, unit: 'billion USD' },
          { name: 'System uptime', value: 99.99, unit: 'percent' },
          { name: 'Latency reduction', value: 60, unit: 'percent' },
        ],
        qualitative: 'Led team of 5 engineers, implemented distributed architecture with Redis caching and PostgreSQL',
        impact_score: 0.95,
      },
      impactSummary: 'Processed $2.5B in transactions with 99.99% uptime',
      verified: true,
      verifiedAt: '2023-05-20',
      visibility: 'public',
      tags: ['Backend', 'Payments', 'Distributed Systems'],
      skills: [
        { code: '03.082.653.13650', level: 5, frequency: 'daily', hours: 1200 }, // JavaScript programming
        { code: '06.149.1193.00920', level: 4, frequency: 'daily', hours: 600 }, // Data structures & algorithms
        { code: '02.055.434.05635', level: 4, frequency: 'weekly', hours: 400 }, // Applied System architecture
      ],
    },
    {
      userId: DEMO_USERS.james,
      title: 'Cross-Border Payment API',
      description: 'Developed API infrastructure for international money transfers with multi-currency support',
      projectType: 'work',
      status: 'ongoing',
      startDate: '2023-09-01',
      endDate: null,
      organizationName: 'GlobalPay',
      roleTitle: 'Tech Lead',
      outcomes: {
        metrics: [
          { name: 'Countries supported', value: 45, unit: 'countries' },
          { name: 'Currency pairs', value: 120, unit: 'pairs' },
          { name: 'API requests daily', value: 500000, unit: 'requests' },
        ],
        qualitative: 'Leading a team of 8 engineers, implementing compliance features for international regulations',
        impact_score: 0.88,
      },
      impactSummary: 'Enabling cross-border payments across 45 countries',
      verified: false,
      visibility: 'public',
      tags: ['API', 'Fintech', 'International'],
      skills: [
        { code: '03.082.653.13651', level: 5, frequency: 'daily', hours: 600 }, // Python programming (fallback for TypeScript)
        { code: '06.177.1423.02027', level: 4, frequency: 'daily', hours: 400 }, // API documentation
      ],
    },
    // Amara's projects
    {
      userId: DEMO_USERS.amara,
      title: 'Girls STEM Education Initiative',
      description: 'Led a program providing STEM education and mentorship to 500+ girls across 10 Nigerian states',
      projectType: 'work',
      status: 'concluded',
      startDate: '2020-01-01',
      endDate: '2022-12-31',
      organizationName: 'Education for All Nigeria',
      roleTitle: 'Program Manager',
      outcomes: {
        metrics: [
          { name: 'Girls reached', value: 520, unit: 'students' },
          { name: 'States covered', value: 10, unit: 'states' },
          { name: 'Mentors trained', value: 45, unit: 'mentors' },
          { name: 'University enrollment', value: 78, unit: 'percent' },
        ],
        qualitative: 'Managed team of 6, built partnerships with 15 schools, secured $450K in funding',
        impact_score: 0.92,
      },
      impactSummary: '78% of participants enrolled in university STEM programs',
      verified: true,
      verifiedAt: '2023-02-10',
      visibility: 'public',
      tags: ['Education', 'STEM', 'Gender Equality'],
      skills: [
        { code: '02.046.368.04621', level: 5, frequency: 'daily', hours: 1500 }, // Program evaluation analysis
        { code: '02.048.379.06818', level: 5, frequency: 'daily', hours: 800 }, // Community engagement analysis
        { code: '02.048.379.06818', level: 4, frequency: 'monthly', hours: 200 }, // Community engagement (fallback)
      ],
    },
    {
      userId: DEMO_USERS.amara,
      title: 'Community Learning Centers Network',
      description: 'Establishing network of community-run learning centers in underserved areas',
      projectType: 'work',
      status: 'ongoing',
      startDate: '2023-06-01',
      endDate: null,
      organizationName: 'Community Education Network',
      roleTitle: 'Senior Program Strategist',
      outcomes: {
        metrics: [
          { name: 'Centers established', value: 12, unit: 'centers' },
          { name: 'Students enrolled', value: 890, unit: 'students' },
          { name: 'Communities engaged', value: 18, unit: 'communities' },
        ],
        qualitative: 'Building sustainable, community-led education infrastructure',
        impact_score: 0.85,
      },
      impactSummary: '12 community learning centers serving 890 students',
      verified: false,
      visibility: 'public',
      tags: ['Community Development', 'Education', 'Sustainability'],
      skills: [
        { code: '06.163.1312.00493', level: 4, frequency: 'weekly', hours: 300 }, // Strategic planning
        { code: '06.163.1305.00552', level: 4, frequency: 'daily', hours: 400 }, // Stakeholder management
      ],
    },
    // Yuki's projects
    {
      userId: DEMO_USERS.yuki,
      title: 'Medical Imaging AI for Early Cancer Detection',
      description: 'Developed deep learning model for detecting early-stage cancers in medical imaging with 94% accuracy',
      projectType: 'work',
      status: 'concluded',
      startDate: '2021-03-01',
      endDate: '2023-09-30',
      organizationName: 'MedTech AI Labs',
      roleTitle: 'Senior ML Engineer',
      outcomes: {
        metrics: [
          { name: 'Detection accuracy', value: 94, unit: 'percent' },
          { name: 'Training dataset size', value: 250000, unit: 'images' },
          { name: 'Processing time reduction', value: 75, unit: 'percent' },
          { name: 'Clinical trials', value: 3, unit: 'hospitals' },
        ],
        qualitative: 'Led ML team of 4, collaborated with radiologists, published 2 peer-reviewed papers',
        impact_score: 0.95,
      },
      impactSummary: 'AI model now used in 3 hospitals for screening 1000+ patients monthly',
      verified: true,
      verifiedAt: '2023-11-15',
      visibility: 'public',
      tags: ['Machine Learning', 'Healthcare', 'Computer Vision'],
      skills: [
        { code: '02.056.447.04497', level: 5, frequency: 'daily', hours: 1400 }, // Forecasting & ML basics
        { code: '03.082.653.13651', level: 5, frequency: 'daily', hours: 1200 }, // Python programming
        { code: '03.082.653.13651', level: 4, frequency: 'daily', hours: 800 }, // Python programming (fallback for TensorFlow)
      ],
    },
    {
      userId: DEMO_USERS.yuki,
      title: 'Predictive Healthcare Analytics Platform',
      description: 'Building platform to predict patient readmission risks and optimize treatment plans',
      projectType: 'work',
      status: 'ongoing',
      startDate: '2024-01-15',
      endDate: null,
      organizationName: 'HealthPredict',
      roleTitle: 'Lead Data Scientist',
      outcomes: {
        metrics: [
          { name: 'Hospitals onboarded', value: 8, unit: 'hospitals' },
          { name: 'Patients analyzed', value: 15000, unit: 'patients' },
          { name: 'Readmission reduction', value: 23, unit: 'percent' },
        ],
        qualitative: 'Early stage, showing promising results in pilot hospitals',
        impact_score: 0.82,
      },
      impactSummary: 'Reducing patient readmissions by 23% in pilot hospitals',
      verified: false,
      visibility: 'public',
      tags: ['Predictive Analytics', 'Healthcare', 'Data Science'],
      skills: [
        { code: '06.149.1193.00920', level: 5, frequency: 'daily', hours: 500 }, // Data structures & algorithms
        { code: '02.054.428.07129', level: 4, frequency: 'daily', hours: 400 }, // Enterprise statistical analysis
      ],
    },
    // Alex's projects
    {
      userId: DEMO_USERS.alex,
      title: 'Community-Led School Funding Campaign',
      description: 'Organized 5000+ community members to secure $2.5M in additional public school funding',
      projectType: 'work',
      status: 'concluded',
      startDate: '2020-08-01',
      endDate: '2022-05-31',
      organizationName: 'Education Justice Coalition',
      roleTitle: 'Lead Organizer',
      outcomes: {
        metrics: [
          { name: 'Community members organized', value: 5200, unit: 'members' },
          { name: 'Funding secured', value: 2500000, unit: 'USD' },
          { name: 'Schools benefited', value: 28, unit: 'schools' },
          { name: 'Public hearings held', value: 12, unit: 'hearings' },
        ],
        qualitative: 'Built coalition of parents, teachers, students; led successful advocacy campaign',
        impact_score: 0.93,
      },
      impactSummary: 'Secured $2.5M for 28 underfunded public schools',
      verified: true,
      verifiedAt: '2022-08-20',
      visibility: 'public',
      tags: ['Community Organizing', 'Advocacy', 'Education'],
      skills: [
        { code: '02.048.379.06818', level: 5, frequency: 'daily', hours: 1600 }, // Community engagement analysis
        { code: '03.073.579.13429', level: 4, frequency: 'daily', hours: 800 }, // Segmentation & campaigns
        { code: '06.156.1253.01377', level: 5, frequency: 'weekly', hours: 200 }, // Public speaking to large groups
      ],
    },
    {
      userId: DEMO_USERS.alex,
      title: 'Digital Organizing Platform for Education Advocates',
      description: 'Building digital tools to help education advocates organize, mobilize, and track impact',
      projectType: 'side_project',
      status: 'ongoing',
      startDate: '2023-10-01',
      endDate: null,
      organizationName: 'Grassroots Ed Tech',
      roleTitle: 'Founder & Lead Organizer',
      outcomes: {
        metrics: [
          { name: 'Organizations using platform', value: 34, unit: 'organizations' },
          { name: 'Campaigns launched', value: 78, unit: 'campaigns' },
          { name: 'Members mobilized', value: 12000, unit: 'members' },
        ],
        qualitative: 'Open-source platform combining traditional organizing with digital tools',
        impact_score: 0.78,
      },
      impactSummary: '34 organizations mobilizing 12K+ members for education justice',
      verified: false,
      visibility: 'public',
      tags: ['Digital Tools', 'Organizing', 'Open Source'],
      skills: [
        { code: '03.073.579.13429', level: 3, frequency: 'daily', hours: 400 }, // Segmentation & campaigns (fallback for digital organizing)
        { code: '02.042.334.07711', level: 4, frequency: 'weekly', hours: 200 }, // Strategic partnerships
      ],
    },
  ];
  
  const projectIds = new Map(); // Store project IDs for later use
  
  for (const project of projectsData) {
    const { skills, ...projectData } = project;
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: projectData.userId,
        title: projectData.title,
        description: projectData.description,
        project_type: projectData.projectType,
        status: projectData.status,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        organization_name: projectData.organizationName,
        role_title: projectData.roleTitle,
        outcomes: projectData.outcomes,
        impact_summary: projectData.impactSummary,
        verified: projectData.verified,
        verified_at: projectData.verifiedAt,
        visibility: projectData.visibility,
        tags: projectData.tags,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error(`   ⚠️  Error creating project ${projectData.title}:`, error.message);
    } else {
      stats.projects++;
      projectIds.set(projectData.title, data.id);
      
      // Create project_skills linkage
      for (const skill of skills) {
        const { error: skillError } = await supabase
          .from('project_skills')
          .insert({
            project_id: data.id,
            skill_code: skill.code,
            proficiency_level: skill.level,
            usage_frequency: skill.frequency,
            hours_used: skill.hours,
            outcome_contribution: (skill.level / 5 * 0.8 + 0.1).toFixed(2),
          });
        
        if (!skillError) {
          stats.projectSkills++;
        }
      }
    }
  }
  
  console.log(`   ✅ Created ${stats.projects} projects with ${stats.projectSkills} skill linkages`);
  return projectIds;
}

async function seedImpactStories(projectIds) {
  console.log('\n💫 Seeding impact stories...');
  
  const stories = [
    {
      userId: DEMO_USERS.sofia,
      title: 'Reducing Carbon Footprints Through User-Centered Design',
      orgDescription: 'Mid-size climate tech startup, 50 employees, Barcelona',
      impact: '50,000 users collectively reduced CO2 emissions by 12,000 tons annually',
      businessValue: 'App achieved profitability within 18 months, secured Series A funding',
      outcomes: '68% user retention, 4.8-star rating, featured in Apple App Store',
      timeline: '18 months from concept to launch',
      verified: true,
    },
    {
      userId: DEMO_USERS.james,
      title: 'Building Payment Infrastructure at Scale',
      orgDescription: 'Fintech scale-up, 200 employees, Singapore headquarters',
      impact: 'Processed $2.5B in transactions with 99.99% uptime, zero security breaches',
      businessValue: 'Reduced operational costs by 40%, enabled 3x business growth',
      outcomes: 'System handles 10K TPS, 60% latency reduction, saved $2M in infrastructure costs',
      timeline: '21 months from architecture to production',
      verified: true,
    },
    {
      userId: DEMO_USERS.amara,
      title: 'Transforming STEM Education Access for Girls',
      orgDescription: 'International NGO, operating across West Africa, 150 staff',
      impact: '78% of 520 participants enrolled in university STEM programs',
      businessValue: 'Program model replicated in 5 additional countries, secured $2M additional funding',
      outcomes: '45 mentors trained, 15 school partnerships, 10 states covered',
      timeline: '3 years from pilot to scale',
      verified: true,
    },
    {
      userId: DEMO_USERS.yuki,
      title: 'AI-Powered Early Cancer Detection',
      orgDescription: 'Healthcare AI research lab, 80 researchers, Tokyo',
      impact: 'AI model screening 1000+ patients monthly across 3 hospitals with 94% accuracy',
      businessValue: '75% reduction in diagnostic time, published 2 peer-reviewed papers',
      outcomes: '250K+ images trained, 3 clinical trials, regulatory approval in progress',
      timeline: '30 months from research to clinical deployment',
      verified: true,
    },
    {
      userId: DEMO_USERS.alex,
      title: 'Community Organizing for Education Justice',
      orgDescription: 'Grassroots coalition, 5,000+ members, Mexico City',
      impact: 'Secured $2.5M in additional funding for 28 underfunded public schools',
      businessValue: 'Coalition model adopted by 12 other communities nationwide',
      outcomes: '12 public hearings, 5,200 members mobilized, 100% voter turnout in target districts',
      timeline: '22 months from formation to victory',
      verified: true,
    },
  ];
  
  for (const story of stories) {
    const { error } = await supabase
      .from('impact_stories')
      .insert({
        user_id: story.userId,
        title: story.title,
        org_description: story.orgDescription,
        impact: story.impact,
        business_value: story.businessValue,
        outcomes: story.outcomes,
        timeline: story.timeline,
        verified: story.verified,
      });
    
    if (!error) {
      stats.impactStories++;
    } else {
      console.error(`   ⚠️  Error creating impact story:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.impactStories} impact stories`);
}

async function seedExperiences() {
  console.log('\n💼 Seeding experiences...');
  
  const experiences = [
    {
      userId: DEMO_USERS.sofia,
      title: 'Leading Design for Climate Impact',
      orgDescription: 'Climate tech startup, Series A, 50 employees, Barcelona',
      duration: '2 years 6 months',
      learning: 'Mastered the art of designing for behavior change, learned to balance user needs with sustainability goals',
      growth: 'Evolved from individual contributor to leading a design team of 4, developed strategic thinking skills',
      verified: true,
    },
    {
      userId: DEMO_USERS.sofia,
      title: 'Building Design Systems from Scratch',
      orgDescription: 'B2B SaaS company, 200 employees, Remote-first',
      duration: '1 year 8 months',
      learning: 'Deep understanding of scalable design systems, component architecture, and cross-team collaboration',
      growth: 'Transitioned from execution to strategy, learned to influence without authority',
      verified: false,
    },
    {
      userId: DEMO_USERS.james,
      title: 'Architecting Distributed Payment Systems',
      orgDescription: 'Fintech scale-up, Series B, 200 employees, Singapore',
      duration: '3 years 2 months',
      learning: 'Mastered distributed systems, learned financial compliance, gained expertise in high-availability architecture',
      growth: 'Grew from senior engineer to tech lead, learned to mentor and grow engineering teams',
      verified: true,
    },
    {
      userId: DEMO_USERS.james,
      title: 'Building Cross-Border Payment Infrastructure',
      orgDescription: 'Payment processor, Enterprise, 500 employees, Global',
      duration: '1 year 4 months',
      learning: 'Understanding international regulations, multi-currency systems, and global compliance requirements',
      growth: 'Leading larger teams (8 engineers), navigating complex stakeholder environments',
      verified: false,
    },
    {
      userId: DEMO_USERS.amara,
      title: 'Scaling Community-Led Education Programs',
      orgDescription: 'International NGO, 150 staff, West Africa focus',
      duration: '3 years',
      learning: 'Learned to design programs that scale while remaining community-led, mastered impact measurement',
      growth: 'Developed strategic thinking, gained confidence in high-stakes negotiations with funders',
      verified: true,
    },
    {
      userId: DEMO_USERS.yuki,
      title: 'Applying AI to Healthcare Challenges',
      orgDescription: 'Healthcare AI lab, 80 researchers, Tokyo',
      duration: '2 years 7 months',
      learning: 'Deep understanding of medical AI ethics, regulatory requirements, and clinical validation processes',
      growth: 'Transitioned from pure research to applied ML, learned to collaborate with medical professionals',
      verified: true,
    },
    {
      userId: DEMO_USERS.alex,
      title: 'Building Grassroots Power for Education Justice',
      orgDescription: 'Community coalition, 5000+ members, Mexico City',
      duration: '2 years 9 months',
      learning: 'Mastered campaign strategy, coalition building, and power analysis in educational policy',
      growth: 'Developed leadership skills, learned to organize at scale, gained political savvy',
      verified: true,
    },
  ];
  
  for (const exp of experiences) {
    const { error } = await supabase
      .from('experiences')
      .insert({
        user_id: exp.userId,
        title: exp.title,
        org_description: exp.orgDescription,
        duration: exp.duration,
        learning: exp.learning,
        growth: exp.growth,
        verified: exp.verified,
      });
    
    if (!error) {
      stats.experiences++;
    } else {
      console.error(`   ⚠️  Error creating experience:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.experiences} experiences`);
}

async function seedEducation() {
  console.log('\n🎓 Seeding education records...');
  
  const education = [
    {
      userId: DEMO_USERS.sofia,
      institution: 'Elisava Barcelona School of Design and Engineering',
      degree: 'Master of Arts in Design',
      fieldOfStudy: 'Interaction Design',
      startDate: '2012-09-01',
      endDate: '2014-06-30',
      description: 'Focused on human-computer interaction, sustainable design principles, and design thinking methodologies',
      skillsGained: ['Design Thinking', 'User Research', 'Prototyping', 'Sustainability'],
      projectsCompleted: 'Thesis: "Designing for Circular Economy - A Framework for Digital Products"',
      verified: true,
    },
    {
      userId: DEMO_USERS.james,
      institution: 'National University of Singapore',
      degree: 'Bachelor of Computing',
      fieldOfStudy: 'Computer Science',
      startDate: '2010-08-01',
      endDate: '2014-05-31',
      description: 'Specialized in distributed systems and software engineering, active in competitive programming',
      skillsGained: ['Algorithms', 'System Design', 'Database Systems', 'Software Engineering'],
      projectsCompleted: 'Built a distributed file system as final year project, won 2 hackathons',
      verified: true,
    },
    {
      userId: DEMO_USERS.amara,
      institution: 'University of Lagos',
      degree: 'Master of Science in Development Studies',
      fieldOfStudy: 'International Development',
      startDate: '2015-09-01',
      endDate: '2017-08-31',
      description: 'Focused on community development, program evaluation, and social impact measurement',
      skillsGained: ['Impact Evaluation', 'Research Methods', 'Program Design', 'Policy Analysis'],
      projectsCompleted: 'Thesis: "Community-Led Development Models in Education Access"',
      verified: true,
    },
    {
      userId: DEMO_USERS.yuki,
      institution: 'University of Tokyo',
      degree: 'PhD in Biomedical Engineering',
      fieldOfStudy: 'Medical AI and Machine Learning',
      startDate: '2017-04-01',
      endDate: '2021-03-31',
      description: 'Research focused on applying deep learning to medical imaging, published 8 papers',
      skillsGained: ['Deep Learning', 'Medical Imaging', 'Research Methods', 'Scientific Writing'],
      projectsCompleted: 'Dissertation: "Neural Networks for Early Cancer Detection in Medical Imaging"',
      verified: true,
    },
    {
      userId: DEMO_USERS.yuki,
      institution: 'Kyoto University',
      degree: 'Master of Engineering',
      fieldOfStudy: 'Computer Science',
      startDate: '2015-04-01',
      endDate: '2017-03-31',
      description: 'Studied machine learning algorithms and statistical methods',
      skillsGained: ['Machine Learning', 'Statistics', 'Python Programming', 'Data Analysis'],
      projectsCompleted: 'Developed predictive models for healthcare applications',
      verified: true,
    },
    {
      userId: DEMO_USERS.alex,
      institution: 'Universidad Nacional Autónoma de México (UNAM)',
      degree: 'Bachelor of Arts in Sociology',
      fieldOfStudy: 'Social Movements and Community Organizing',
      startDate: '2012-08-01',
      endDate: '2016-06-30',
      description: 'Focused on social justice, community organizing theory, and political sociology',
      skillsGained: ['Social Research', 'Community Organizing', 'Political Analysis', 'Public Speaking'],
      projectsCompleted: 'Thesis: "Grassroots Movements for Education Equity in Latin America"',
      verified: true,
    },
  ];
  
  for (const edu of education) {
    const { error } = await supabase
      .from('education')
      .insert({
        user_id: edu.userId,
        institution: edu.institution,
        degree: edu.degree,
        duration: `${edu.startDate} to ${edu.endDate}`,
        skills: edu.skillsGained.join(', '),
        projects: edu.projectsCompleted,
        verified: edu.verified,
      });
    
    if (!error) {
      stats.education++;
    } else {
      console.error(`   ⚠️  Error creating education record:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.education} education records`);
}

async function seedVolunteering() {
  console.log('\n🤝 Seeding volunteering activities...');
  
  const volunteering = [
    {
      userId: DEMO_USERS.sofia,
      title: 'Design Mentor for Climate Startups',
      orgDescription: 'Climate tech accelerator, Barcelona',
      duration: '2 years (ongoing)',
      cause: 'Climate Action - Supporting early-stage climate tech founders with design expertise',
      impact: 'Mentored 12 startups, 8 successfully launched products',
      skillsDeployed: 'UX Design, Product Strategy, Design Systems, Mentorship',
      personalWhy: 'I believe designers have a responsibility to use their skills for climate action',
      verified: false,
    },
    {
      userId: DEMO_USERS.james,
      title: 'Open Source Contributor - Payment Libraries',
      orgDescription: 'Open source community',
      duration: '3 years (ongoing)',
      cause: 'Financial Inclusion - Building open tools for payment processing',
      impact: 'Maintained libraries used by 2000+ developers, 500+ GitHub stars',
      skillsDeployed: 'TypeScript, Payment Systems, API Design, Documentation',
      personalWhy: 'Making financial technology accessible through open source is crucial for inclusion',
      verified: false,
    },
    {
      userId: DEMO_USERS.amara,
      title: 'Girls Education Advocacy Network',
      orgDescription: 'Pan-African advocacy coalition',
      duration: '4 years (ongoing)',
      cause: 'Education Equity - Advocating for girls education policies across Africa',
      impact: 'Influenced policy in 6 countries, mobilized 50K+ advocates',
      skillsDeployed: 'Policy Advocacy, Coalition Building, Strategic Communications',
      personalWhy: 'As a woman in tech from Nigeria, I know firsthand the barriers girls face in accessing education',
      verified: true,
    },
    {
      userId: DEMO_USERS.yuki,
      title: 'AI Ethics in Healthcare Working Group',
      orgDescription: 'Global AI ethics organization',
      duration: '2 years',
      cause: 'AI Ethics - Developing guidelines for responsible healthcare AI',
      impact: 'Co-authored ethics guidelines adopted by 15 institutions',
      skillsDeployed: 'AI/ML Expertise, Healthcare Knowledge, Policy Writing, Stakeholder Engagement',
      personalWhy: 'AI in healthcare must be developed responsibly to ensure it serves all patients equitably',
      verified: true,
    },
    {
      userId: DEMO_USERS.alex,
      title: 'Teacher Union Support and Training',
      orgDescription: 'Teachers union, Mexico City',
      duration: '5 years (ongoing)',
      cause: 'Workers Rights - Supporting teachers in organizing and collective bargaining',
      impact: 'Trained 200+ teacher organizers, supported 5 successful contract campaigns',
      skillsDeployed: 'Community Organizing, Training, Campaign Strategy, Negotiation',
      personalWhy: 'Teachers are on the frontlines of education justice - they need strong unions to fight for students',
      verified: true,
    },
  ];
  
  for (const vol of volunteering) {
    const { error } = await supabase
      .from('volunteering')
      .insert({
        user_id: vol.userId,
        title: vol.title,
        org_description: vol.orgDescription,
        duration: vol.duration,
        cause: vol.cause,
        impact: vol.impact,
        skills_deployed: vol.skillsDeployed,
        personal_why: vol.personalWhy,
        verified: vol.verified,
      });
    
    if (!error) {
      stats.volunteering++;
    } else {
      console.error(`   ⚠️  Error creating volunteering record:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.volunteering} volunteering activities`);
}

async function seedCrossUserRelationships() {
  console.log('\n🤝 Seeding cross-user relationships...');
  
  // First, get skills for each user to reference in endorsements
  const { data: allSkills } = await supabase
    .from('skills')
    .select('id, profile_id, skill_id');
  
  if (!allSkills) {
    console.log('   ⚠️  Could not fetch skills for endorsements');
    return;
  }
  
  // Create capabilities from some skills
  const capabilitiesToCreate = [];
  const userSkillsMap = new Map();
  
  // Group skills by user
  for (const skill of allSkills) {
    if (!userSkillsMap.has(skill.profile_id)) {
      userSkillsMap.set(skill.profile_id, []);
    }
    userSkillsMap.get(skill.profile_id).push(skill);
  }
  
  // Create 3-4 capabilities per user from their top skills
  for (const [userId, skills] of userSkillsMap.entries()) {
    const topSkills = skills.slice(0, 4);
    
    for (const skill of topSkills) {
      capabilitiesToCreate.push({
        profile_id: userId,
        skill_record_id: skill.id,
        privacy_level: 'public',
        verification_status: Math.random() > 0.5 ? 'verified' : 'unverified',
        summary: `Demonstrated expertise in ${skill.skill_id}`,
        highlights: [
          'Applied in multiple professional projects',
          'Recognized by peers and colleagues',
          'Continuous learning and improvement',
        ],
        evidence_count: Math.floor(Math.random() * 3) + 1,
      });
    }
  }
  
  // Insert capabilities
  for (const cap of capabilitiesToCreate) {
    const { error } = await supabase
      .from('capabilities')
      .insert(cap);
    
    if (!error) {
      stats.capabilities++;
    }
  }
  
  console.log(`   ✅ Created ${stats.capabilities} capabilities`);
  
  // Get created capabilities
  const { data: capabilities } = await supabase
    .from('capabilities')
    .select('id, profile_id, skill_record_id');
  
  if (!capabilities) {
    console.log('   ⚠️  Could not fetch capabilities for endorsements');
    return;
  }
  
  // Create cross-user endorsements
  const endorsements = [
    // Sofia endorses James
    {
      capabilityId: capabilities.find(c => c.profile_id === DEMO_USERS.james)?.id,
      endorserProfileId: DEMO_USERS.sofia,
      ownerProfileId: DEMO_USERS.james,
      message: "James has exceptional technical skills and great attention to UI/UX details. Working with him on the payment flow redesign was seamless.",
      status: 'accepted',
      visibility: 'public',
    },
    // James endorses Yuki
    {
      capabilityId: capabilities.find(c => c.profile_id === DEMO_USERS.yuki)?.id,
      endorserProfileId: DEMO_USERS.james,
      ownerProfileId: DEMO_USERS.yuki,
      message: "Yuki's approach to data architecture is both rigorous and innovative. Her healthcare AI work demonstrates deep technical expertise combined with ethical awareness.",
      status: 'accepted',
      visibility: 'public',
    },
    // Amara endorses Alex
    {
      capabilityId: capabilities.find(c => c.profile_id === DEMO_USERS.alex)?.id,
      endorserProfileId: DEMO_USERS.amara,
      ownerProfileId: DEMO_USERS.alex,
      message: "Alex is one of the most skilled community organizers I've worked with. Their ability to build coalitions and mobilize communities is remarkable.",
      status: 'accepted',
      visibility: 'public',
    },
    // Yuki endorses Sofia
    {
      capabilityId: capabilities.find(c => c.profile_id === DEMO_USERS.sofia)?.id,
      endorserProfileId: DEMO_USERS.yuki,
      ownerProfileId: DEMO_USERS.sofia,
      message: "Sofia's data-driven approach to design is impressive. She combines beautiful aesthetics with rigorous user research.",
      status: 'accepted',
      visibility: 'public',
    },
    // Alex endorses Amara
    {
      capabilityId: capabilities.find(c => c.profile_id === DEMO_USERS.amara)?.id,
      endorserProfileId: DEMO_USERS.alex,
      ownerProfileId: DEMO_USERS.amara,
      message: "Amara's program management skills are world-class. Her work on education equity has inspired my own organizing work.",
      status: 'accepted',
      visibility: 'public',
    },
  ];
  
  for (const endorsement of endorsements) {
    if (!endorsement.capabilityId) continue;
    
    const { error } = await supabase
      .from('skill_endorsements')
      .insert({
        capability_id: endorsement.capabilityId,
        endorser_profile_id: endorsement.endorserProfileId,
        owner_profile_id: endorsement.ownerProfileId,
        message: endorsement.message,
        status: endorsement.status,
        visibility: endorsement.visibility,
        responded_at: new Date().toISOString(),
      });
    
    if (!error) {
      stats.endorsements++;
    } else {
      console.error(`   ⚠️  Error creating endorsement:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.endorsements} endorsements`);
}

async function main() {
  console.log('═'.repeat(80));
  console.log('🌱 PROOFOUND DEMO USER SEEDING SCRIPT');
  console.log('═'.repeat(80));
  console.log('\nThis script will populate 5 demo user accounts with comprehensive test data:');
  console.log('  • Sofia Martinez - UX/Product Designer (Climate Tech)');
  console.log('  • James Chen - Full-Stack Developer (Fintech)');
  console.log('  • Amara Okafor - Social Impact Strategist (Nonprofit)');
  console.log('  • Yuki Tanaka - Data Scientist/AI Engineer (Healthcare)');
  console.log('  • Alex Rivera - Community Organizer (Education)');
  console.log('\n⚠️  WARNING: This will modify existing data in your database!');
  console.log('   Make sure you have a backup if needed.\n');
  
  // Check for --yes flag
  const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');
  
  if (!autoConfirm) {
    const proceed = await confirm('Do you want to continue?');
    
    if (!proceed) {
      console.log('\n❌ Seeding cancelled by user.');
      process.exit(0);
    }
  } else {
    console.log('   ✓ Auto-confirmed with --yes flag\n');
  }
  
  console.log('\n🚀 Starting seed process...\n');
  
  try {
    await seedProfiles();
    await seedSkills();
    const projectIds = await seedProjects();
    await seedImpactStories(projectIds);
    await seedExperiences();
    await seedEducation();
    await seedVolunteering();
    await seedCrossUserRelationships();
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ SEEDING COMPLETE!');
    console.log('═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   • Profiles updated: ${stats.profiles}`);
    console.log(`   • Skills created: ${stats.skills}`);
    console.log(`   • Projects created: ${stats.projects}`);
    console.log(`   • Project skills linkage: ${stats.projectSkills}`);
    console.log(`   • Impact stories: ${stats.impactStories}`);
    console.log(`   • Experiences: ${stats.experiences}`);
    console.log(`   • Education records: ${stats.education}`);
    console.log(`   • Volunteering: ${stats.volunteering}`);
    console.log(`   • Capabilities: ${stats.capabilities}`);
    console.log(`   • Evidence: ${stats.evidence}`);
    console.log(`   • Endorsements: ${stats.endorsements}`);
    console.log(`   • Verification requests: ${stats.verificationRequests}`);
    console.log('\n🎉 Demo users are ready for testing!\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();

