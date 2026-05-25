/**
 * Comprehensive Demo Organization Seeding Script
 * 
 * Populates 3 demo organization accounts with rich test data including:
 * - Complete organization profiles with missions, values, causes
 * - Projects, partnerships, certifications, goals
 * - Organization structure and ownership information
 * - Organization verification records
 * - Sample assignments for testing the matching system
 * - Links to existing demo users as organization members
 * 
 * Run with: node scripts/seed-demo-organizations.mjs
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

// Demo user IDs (from existing demo users)
const DEMO_USERS = {
  sofia: '0584f063-58cd-4e1f-a95d-c54c105a7ac0',
  james: 'f800f9ca-debf-480d-b499-36c9629296bb',
  amara: 'c2b84624-0b57-42ca-8de7-68ef4dff60b7',
  yuki: 'e1a2e4a3-d0dc-474e-af49-0adee9c020f0',
  alex: 'c7646252-1018-4cef-ab77-e738f5e24d71',
};

// Track what we create for summary report
const stats = {
  organizations: 0,
  projects: 0,
  partnerships: 0,
  certifications: 0,
  goals: 0,
  structures: 0,
  ownerships: 0,
  members: 0,
  verifications: 0,
  assignments: 0,
  auditLogs: 0,
};

// Store created org IDs for later reference
const orgIds = {};

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

// Helper to get auth user ID by email
async function getAuthUserIdByEmail(email) {
  try {
    // Query auth.users table using admin client
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error(`   ⚠️  Error fetching auth users:`, error.message);
      return null;
    }
    
    const user = data.users.find(u => u.email === email);
    return user?.id || null;
  } catch (error) {
    console.error(`   ⚠️  Error in getAuthUserIdByEmail:`, error.message);
    return null;
  }
}

// ============================================================================
// ORGANIZATION DATA
// ============================================================================

const organizationData = {
  greenpath: {
    email: 'demo@greenpath-ngo.org',
    slug: 'greenpath-ngo',
    legalName: 'GreenPath Community Development Foundation',
    displayName: 'GreenPath NGO',
    type: 'ngo',
    tagline: 'Empowering communities to combat climate change through local action',
    mission: 'To create resilient, sustainable communities by empowering local leaders with the tools, knowledge, and networks needed to address climate change at the grassroots level.',
    vision: 'A world where every community has the capacity and resources to adapt to climate change while building a more sustainable future for all.',
    website: 'https://greenpath-ngo.org',
    industry: 'Environmental Conservation',
    organizationSize: '11-50',
    legalForm: 'nonprofit',
    foundedDate: '2018-03-15',
    registrationCountry: 'Netherlands',
    registrationRegion: 'North Holland',
    organizationNumber: 'NL-NGO-851234',
    locations: ['Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'Nairobi, Kenya'],
    impactArea: 'Climate Action and Environmental Justice',
    values: [
      { icon: '🌍', label: 'Environmental Sustainability', description: 'Protecting our planet for future generations' },
      { icon: '🤝', label: 'Community Empowerment', description: 'Building capacity at the grassroots level' },
      { icon: '🔍', label: 'Transparency', description: 'Open communication about our work and impact' },
      { icon: '⚖️', label: 'Environmental Justice', description: 'Ensuring equitable access to a healthy environment' },
    ],
    causes: ['Climate Action', 'Community Development', 'Environmental Justice', 'Sustainable Development'],
    workCulture: {
      collaboration: 'We work closely with local communities as equal partners',
      decision_making: 'Participatory approach with community voices at the center',
      learning: 'Continuous learning from communities and sharing best practices',
      wellbeing: 'Flexible work arrangements and emphasis on work-life balance',
      inclusion: 'Diverse team representing the communities we serve',
    },
  },
  skillbridge: {
    email: 'demo@skillbridge.tech',
    slug: 'skillbridge',
    legalName: 'SkillBridge Education Technology GmbH',
    displayName: 'SkillBridge',
    type: 'company',
    tagline: 'Making professional skills training accessible to career switchers',
    mission: 'To democratize access to high-quality professional skills training, enabling anyone to successfully transition to a new career regardless of their background.',
    vision: 'A world where career mobility is limited only by ambition and effort, not by access to education and training.',
    website: 'https://skillbridge.tech',
    industry: 'Education Technology',
    organizationSize: '11-50',
    legalForm: 'llc',
    foundedDate: '2020-06-01',
    registrationCountry: 'Germany',
    registrationRegion: 'Berlin',
    organizationNumber: 'DE-HRB-342156',
    locations: ['Berlin, Germany', 'Remote (Europe)'],
    impactArea: 'Education Access and Career Development',
    values: [
      { icon: '🎓', label: 'Educational Accessibility', description: 'Learning opportunities for everyone' },
      { icon: '💡', label: 'Innovation', description: 'Constantly improving our platform and pedagogy' },
      { icon: '🌱', label: 'Growth Mindset', description: 'Believing in the potential for anyone to learn' },
      { icon: '🌈', label: 'Diversity & Inclusion', description: 'Building a diverse community of learners' },
    ],
    causes: ['Education Access', 'Career Development', 'Digital Skills', 'Economic Mobility'],
    workCulture: {
      collaboration: 'Cross-functional teams working on shared outcomes',
      decision_making: 'Data-informed decisions with input from the entire team',
      learning: 'Monthly learning stipend and internal knowledge sharing',
      wellbeing: 'Unlimited PTO and mental health support',
      inclusion: 'Diverse hiring practices and inclusive culture initiatives',
    },
  },
  circularcraft: {
    email: 'demo@circularcraft.eu',
    slug: 'circularcraft',
    legalName: 'CircularCraft Social Enterprise ApS',
    displayName: 'CircularCraft',
    type: 'company',
    tagline: 'Creating sustainable products while providing jobs for immigrant craftspeople',
    mission: 'To build a circular economy business model that creates dignified employment for immigrant artisans while producing beautiful, sustainable products.',
    vision: 'A world where sustainable business and social impact are inseparable, and where everyone has the opportunity to contribute their skills.',
    website: 'https://circularcraft.eu',
    industry: 'Sustainable Manufacturing',
    organizationSize: '11-50',
    legalForm: 'benefit_corporation',
    foundedDate: '2019-09-20',
    registrationCountry: 'Denmark',
    registrationRegion: 'Capital Region',
    organizationNumber: 'DK-CVR-39582641',
    locations: ['Copenhagen, Denmark', 'Malmö, Sweden'],
    impactArea: 'Social Enterprise and Circular Economy',
    values: [
      { icon: '♻️', label: 'Circular Economy', description: 'Zero waste and sustainable materials' },
      { icon: '🤲', label: 'Fair Trade Practices', description: 'Fair wages and dignified work conditions' },
      { icon: '✊', label: 'Social Justice', description: 'Creating opportunities for marginalized communities' },
      { icon: '🎨', label: 'Craftsmanship', description: 'Honoring traditional skills and artistry' },
    ],
    causes: ['Circular Economy', 'Immigration Integration', 'Fair Trade', 'Sustainable Production'],
    workCulture: {
      collaboration: 'Artisans and business team working together as equals',
      decision_making: 'Worker cooperative model with shared governance',
      learning: 'Skills training and language support for all team members',
      wellbeing: 'Flexible schedules respecting cultural and family needs',
      inclusion: 'Multilingual workplace celebrating diverse cultures',
    },
  },
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedOrganizations() {
  console.log('\n🏢 Seeding organizations...');
  
  for (const [key, data] of Object.entries(organizationData)) {
    // Get auth user ID for the organization email
    const authUserId = await getAuthUserIdByEmail(data.email);
    
    if (!authUserId) {
      console.error(`   ❌ Could not find auth user for ${data.email}`);
      console.error(`      Please ensure the user exists in Supabase Auth`);
      continue;
    }
    
    // Create organization profile
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        slug: data.slug,
        legal_name: data.legalName,
        display_name: data.displayName,
        type: data.type,
        tagline: data.tagline,
        mission: data.mission,
        vision: data.vision,
        website: data.website,
        industry: data.industry,
        organization_size: data.organizationSize,
        legal_form: data.legalForm,
        founded_date: data.foundedDate,
        registration_country: data.registrationCountry,
        registration_region: data.registrationRegion,
        organization_number: data.organizationNumber,
        locations: data.locations,
        impact_area: data.impactArea,
        values: data.values,
        causes: data.causes,
        work_culture: data.workCulture,
        created_by: authUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error(`   ❌ Error creating ${data.displayName}:`, error.message);
    } else {
      console.log(`   ✅ ${data.displayName} created`);
      orgIds[key] = org.id;
      stats.organizations++;
    }
  }
  
  console.log(`   📊 Created ${stats.organizations} organizations`);
}

async function seedOrganizationProjects() {
  console.log('\n🚀 Seeding organization projects...');
  
  const projects = [
    // GreenPath projects
    {
      orgKey: 'greenpath',
      title: 'Urban Garden Network',
      description: 'Established network of 50+ community gardens across Amsterdam and Rotterdam, providing fresh produce and green spaces in underserved neighborhoods.',
      impactCreated: 'Created 52 community gardens serving 3,000+ families with fresh produce, reduced food insecurity by 40% in target neighborhoods.',
      businessValue: 'Secured €500K in municipal funding, created model replicated in 5 European cities.',
      outcomes: 'Trained 120 community garden coordinators, distributed 50,000 seedlings, produced 15 tons of organic vegetables.',
      startDate: '2020-04-01',
      endDate: '2023-03-31',
      status: 'completed',
      isVerified: true,
    },
    {
      orgKey: 'greenpath',
      title: 'Climate Education Program',
      description: 'Community-based climate education initiative reaching 10,000+ young people through workshops, campaigns, and peer education.',
      impactCreated: 'Educated 12,000 youth on climate action, mobilized 500+ young climate advocates, influenced local climate policies.',
      businessValue: 'Partnerships with 25 schools, featured as best practice by EU Climate Action program.',
      outcomes: 'Delivered 200+ workshops, trained 80 peer educators, launched 15 community climate action projects.',
      startDate: '2021-09-01',
      endDate: null,
      status: 'active',
      isVerified: false,
    },
    {
      orgKey: 'greenpath',
      title: 'Renewable Energy Cooperatives',
      description: 'Supporting communities to establish renewable energy cooperatives, enabling collective ownership of solar installations.',
      impactCreated: 'Established 8 community energy cooperatives, installed 500KW of solar capacity, reduced energy costs for 200+ families.',
      businessValue: 'Created sustainable revenue model, attracted €2M in community investment.',
      outcomes: 'Installed solar panels on 15 community buildings, trained 40 community energy managers.',
      startDate: '2022-01-15',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
    // SkillBridge projects
    {
      orgKey: 'skillbridge',
      title: 'Career Switcher Bootcamp Platform',
      description: 'Comprehensive online platform offering immersive bootcamps in tech, design, and data science for career switchers.',
      impactCreated: 'Trained 2,500+ career switchers, 78% employment rate within 6 months, average salary increase of 45%.',
      businessValue: 'Platform reached profitability in year 2, expanded to 12 European countries, €5M ARR.',
      outcomes: '15 bootcamp programs launched, partnerships with 50+ hiring companies, 85% course completion rate.',
      startDate: '2020-10-01',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
    {
      orgKey: 'skillbridge',
      title: 'AI-Powered Skill Matching',
      description: 'Machine learning system matching learners with optimal career paths and courses based on skills, experience, and goals.',
      impactCreated: 'Improved course completion by 23%, increased job placement success by 31%, personalized learning for 5,000+ users.',
      businessValue: 'Reduced customer acquisition cost by 40%, increased user retention by 35%.',
      outcomes: 'Deployed ML models processing 100K+ data points, achieved 89% recommendation accuracy.',
      startDate: '2023-02-01',
      endDate: null,
      status: 'active',
      isVerified: false,
    },
    // CircularCraft projects
    {
      orgKey: 'circularcraft',
      title: 'Refugee Artisan Training Program',
      description: 'Comprehensive training program teaching traditional and modern crafts to refugee artisans, with language and business skills.',
      impactCreated: 'Trained 85 refugee artisans, 92% employment rate, preserved 12 traditional craft techniques from various cultures.',
      businessValue: 'Created sustainable talent pipeline, reduced recruitment costs, built brand reputation for social impact.',
      outcomes: '6-month training program completed by 85 artisans, 15 traditional crafts documented and taught.',
      startDate: '2020-03-01',
      endDate: '2023-06-30',
      status: 'completed',
      isVerified: true,
    },
    {
      orgKey: 'circularcraft',
      title: 'Sustainable Product Line Launch',
      description: 'New product line using 100% recycled and upcycled materials, designed in collaboration with artisan team.',
      impactCreated: 'Diverted 5 tons of waste from landfills, created 15 new full-time jobs, sold 10,000+ sustainable products.',
      businessValue: 'Generated €800K revenue in first year, won 3 sustainability awards, 40% profit margin.',
      outcomes: 'Launched 25 product designs, established supply chain with 8 recycling partners, achieved B-Corp certification.',
      startDate: '2023-01-15',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
  ];
  
  for (const project of projects) {
    const orgId = orgIds[project.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('organization_projects')
      .insert({
        org_id: orgId,
        title: project.title,
        description: project.description,
        impact_created: project.impactCreated,
        business_value: project.businessValue,
        outcomes: project.outcomes,
        start_date: project.startDate,
        end_date: project.endDate,
        status: project.status,
        is_verified: project.isVerified,
      });
    
    if (!error) {
      stats.projects++;
    } else {
      console.error(`   ⚠️  Error creating project ${project.title}:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.projects} organization projects`);
}

async function seedOrganizationPartnerships() {
  console.log('\n🤝 Seeding organization partnerships...');
  
  const partnerships = [
    // GreenPath partnerships
    {
      orgKey: 'greenpath',
      partnerName: 'City of Amsterdam Environmental Department',
      partnerType: 'government',
      partnershipScope: 'Joint funding and technical support for urban garden initiatives, policy collaboration on urban greening.',
      impactCreated: 'Leveraged municipal land for 30+ gardens, co-developed urban agriculture policy adopted city-wide.',
      startDate: '2020-01-15',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
    {
      orgKey: 'greenpath',
      partnerName: 'European Climate Foundation',
      partnerType: 'ngo',
      partnershipScope: 'Funding partnership for climate education programs, knowledge sharing on community climate action.',
      impactCreated: 'Secured €300K in grant funding, participated in pan-European climate education network.',
      startDate: '2021-06-01',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
    // SkillBridge partnerships
    {
      orgKey: 'skillbridge',
      partnerName: 'Tech Giants Coalition (Google, Microsoft, SAP)',
      partnerType: 'company',
      partnershipScope: 'Curriculum development collaboration, hiring pipeline, mentorship programs from industry professionals.',
      impactCreated: 'Updated curriculum aligned with industry needs, placed 800+ graduates in partner companies.',
      startDate: '2021-03-01',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
    {
      orgKey: 'skillbridge',
      partnerName: 'European Union Digital Skills Initiative',
      partnerType: 'government',
      partnershipScope: 'Co-funded program offering subsidized bootcamps to underrepresented groups in tech.',
      impactCreated: 'Trained 500+ individuals from underrepresented backgrounds, 70% employment rate.',
      startDate: '2022-09-01',
      endDate: '2024-08-31',
      status: 'active',
      isVerified: true,
    },
    // CircularCraft partnerships
    {
      orgKey: 'circularcraft',
      partnerName: 'Fair Trade International',
      partnerType: 'network',
      partnershipScope: 'Fair trade certification, supply chain auditing, access to fair trade markets and retailers.',
      impactCreated: 'Achieved fair trade certification, accessed global fair trade distribution networks.',
      startDate: '2021-01-01',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
    {
      orgKey: 'circularcraft',
      partnerName: 'Danish Refugee Council',
      partnerType: 'ngo',
      partnershipScope: 'Refugee artisan recruitment and training support, integration services for participants.',
      impactCreated: 'Referred 60+ qualified artisans to training program, provided integration support services.',
      startDate: '2020-06-01',
      endDate: null,
      status: 'active',
      isVerified: true,
    },
  ];
  
  for (const partnership of partnerships) {
    const orgId = orgIds[partnership.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('organization_partnerships')
      .insert({
        org_id: orgId,
        partner_name: partnership.partnerName,
        partner_type: partnership.partnerType,
        partnership_scope: partnership.partnershipScope,
        impact_created: partnership.impactCreated,
        start_date: partnership.startDate,
        end_date: partnership.endDate,
        status: partnership.status,
        is_verified: partnership.isVerified,
      });
    
    if (!error) {
      stats.partnerships++;
    } else {
      console.error(`   ⚠️  Error creating partnership:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.partnerships} organization partnerships`);
}

async function seedOrganizationCertifications() {
  console.log('\n🏆 Seeding organization certifications...');
  
  const certifications = [
    // GreenPath certifications
    {
      orgKey: 'greenpath',
      certificationType: 'certification',
      name: 'B Corporation Certification',
      issuer: 'B Lab',
      issuedDate: '2021-11-15',
      expiryDate: '2024-11-15',
      credentialId: 'B-CORP-NL-2021-1523',
      credentialUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/greenpath-ngo',
      isVerified: true,
    },
    {
      orgKey: 'greenpath',
      certificationType: 'license',
      name: 'Charitable Organization Registration',
      issuer: 'Netherlands Chamber of Commerce',
      issuedDate: '2018-03-15',
      expiryDate: null,
      credentialId: 'NL-CHARITY-851234',
      credentialUrl: null,
      isVerified: true,
    },
    // SkillBridge certifications
    {
      orgKey: 'skillbridge',
      certificationType: 'certification',
      name: 'ISO 9001:2015 Quality Management',
      issuer: 'TÜV Rheinland',
      issuedDate: '2022-06-01',
      expiryDate: '2025-06-01',
      credentialId: 'ISO-9001-DE-2022-8234',
      credentialUrl: 'https://www.tuv.com/certificates/iso9001-skillbridge',
      isVerified: true,
    },
    {
      orgKey: 'skillbridge',
      certificationType: 'award',
      name: 'EdTech Breakthrough Award - Best Career Development Platform',
      issuer: 'EdTech Breakthrough',
      issuedDate: '2023-05-12',
      expiryDate: null,
      credentialId: 'ETB-2023-CAREER-01',
      credentialUrl: 'https://edtechbreakthrough.com/awards/2023/skillbridge',
      isVerified: true,
    },
    // CircularCraft certifications
    {
      orgKey: 'circularcraft',
      certificationType: 'certification',
      name: 'Fair Trade Certified Enterprise',
      issuer: 'Fair Trade International',
      issuedDate: '2021-08-20',
      expiryDate: '2024-08-20',
      credentialId: 'FT-EU-2021-3421',
      credentialUrl: 'https://www.fairtrade.net/certified/circularcraft',
      isVerified: true,
    },
    {
      orgKey: 'circularcraft',
      certificationType: 'accreditation',
      name: 'Social Enterprise Accreditation',
      issuer: 'Social Enterprise Denmark',
      issuedDate: '2020-11-10',
      expiryDate: null,
      credentialId: 'SE-DK-2020-592',
      credentialUrl: null,
      isVerified: true,
    },
  ];
  
  for (const cert of certifications) {
    const orgId = orgIds[cert.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('organization_certifications')
      .insert({
        org_id: orgId,
        certification_type: cert.certificationType,
        name: cert.name,
        issuer: cert.issuer,
        issued_date: cert.issuedDate,
        expiry_date: cert.expiryDate,
        credential_id: cert.credentialId,
        credential_url: cert.credentialUrl,
        is_verified: cert.isVerified,
      });
    
    if (!error) {
      stats.certifications++;
    } else {
      console.error(`   ⚠️  Error creating certification:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.certifications} organization certifications`);
}

async function seedOrganizationGoals() {
  console.log('\n🎯 Seeding organization goals...');
  
  const goals = [
    // GreenPath goals
    {
      orgKey: 'greenpath',
      goalType: 'impact',
      title: 'Reach 10,000 Community Members by End of 2025',
      description: 'Expand our network to engage 10,000 community members across our programs by December 2025.',
      targetDate: '2025-12-31',
      currentProgress: '75.00',
      metrics: 'Community members engaged, gardens established, youth trained',
      status: 'in_progress',
    },
    {
      orgKey: 'greenpath',
      goalType: 'sustainability',
      title: 'Achieve Carbon Neutral Operations',
      description: 'Transition all organizational operations to carbon neutral by offsetting remaining emissions through verified projects.',
      targetDate: '2024-12-31',
      currentProgress: '60.00',
      metrics: 'Carbon emissions measured and offset, renewable energy usage',
      status: 'in_progress',
    },
    {
      orgKey: 'greenpath',
      goalType: 'growth',
      title: 'Establish Presence in 5 Additional European Cities',
      description: 'Expand GreenPath programs to 5 new European cities, replicating successful models.',
      targetDate: '2026-06-30',
      currentProgress: '20.00',
      metrics: 'Cities launched, local partnerships established',
      status: 'in_progress',
    },
    // SkillBridge goals
    {
      orgKey: 'skillbridge',
      goalType: 'impact',
      title: 'Train 5,000 Career Switchers by 2025',
      description: 'Support 5,000 individuals in successfully switching careers through our bootcamp programs.',
      targetDate: '2025-12-31',
      currentProgress: '40.00',
      metrics: 'Graduates placed, employment rate, salary increases',
      status: 'in_progress',
    },
    {
      orgKey: 'skillbridge',
      goalType: 'diversity',
      title: 'Achieve 50% Representation from Underrepresented Groups',
      description: 'Ensure that 50% of our students come from underrepresented groups in tech by providing scholarships and outreach.',
      targetDate: '2024-12-31',
      currentProgress: '38.00',
      metrics: 'Student demographics, scholarship recipients',
      status: 'in_progress',
    },
    {
      orgKey: 'skillbridge',
      goalType: 'innovation',
      title: 'Launch AI-Powered Career Coaching Platform',
      description: 'Develop and launch AI-powered career coaching that provides personalized guidance to all learners.',
      targetDate: '2024-09-30',
      currentProgress: '85.00',
      metrics: 'Platform features, user adoption, coaching sessions delivered',
      status: 'in_progress',
    },
    // CircularCraft goals
    {
      orgKey: 'circularcraft',
      goalType: 'impact',
      title: 'Employ 50 Refugee Artisans by 2025',
      description: 'Create dignified employment for 50 refugee artisans through our training and production programs.',
      targetDate: '2025-12-31',
      currentProgress: '60.00',
      metrics: 'Artisans employed, retention rate, skills developed',
      status: 'in_progress',
    },
    {
      orgKey: 'circularcraft',
      goalType: 'sustainability',
      title: '100% Recycled Materials in All Products',
      description: 'Transition entire product line to use 100% recycled or upcycled materials, eliminating virgin material use.',
      targetDate: '2025-06-30',
      currentProgress: '70.00',
      metrics: 'Percentage of recycled materials, waste diverted from landfills',
      status: 'in_progress',
    },
    {
      orgKey: 'circularcraft',
      goalType: 'growth',
      title: 'Expand to 3 New Nordic Markets',
      description: 'Establish retail and e-commerce presence in Norway, Finland, and Iceland.',
      targetDate: '2025-12-31',
      currentProgress: '30.00',
      metrics: 'Markets entered, retail partnerships, sales volume',
      status: 'in_progress',
    },
  ];
  
  for (const goal of goals) {
    const orgId = orgIds[goal.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('organization_goals')
      .insert({
        org_id: orgId,
        goal_type: goal.goalType,
        title: goal.title,
        description: goal.description,
        target_date: goal.targetDate,
        current_progress: goal.currentProgress,
        metrics: goal.metrics,
        status: goal.status,
      });
    
    if (!error) {
      stats.goals++;
    } else {
      console.error(`   ⚠️  Error creating goal:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.goals} organization goals`);
}

async function seedOrganizationStructure() {
  console.log('\n🏗️  Seeding organization structure...');
  
  const structures = [
    // GreenPath structure
    {
      orgKey: 'greenpath',
      entityType: 'executive_team',
      name: 'Executive Leadership Team',
      description: 'Core leadership team responsible for strategic direction and organizational governance.',
      teamSize: 5,
      focusArea: 'Strategy, fundraising, partnerships, organizational development',
    },
    {
      orgKey: 'greenpath',
      entityType: 'department',
      name: 'Programs Department',
      description: 'Team delivering community programs including urban gardens, climate education, and renewable energy projects.',
      teamSize: 12,
      focusArea: 'Program design, community engagement, impact measurement',
    },
    // SkillBridge structure
    {
      orgKey: 'skillbridge',
      entityType: 'team',
      name: 'Product & Engineering Team',
      description: 'Cross-functional team building and maintaining the learning platform and AI-powered features.',
      teamSize: 8,
      focusArea: 'Platform development, UX design, data science, product management',
    },
    {
      orgKey: 'skillbridge',
      entityType: 'team',
      name: 'Curriculum & Learning Team',
      description: 'Team designing bootcamp curricula, instructor training, and learning experience optimization.',
      teamSize: 6,
      focusArea: 'Curriculum development, instructional design, student success',
    },
    // CircularCraft structure
    {
      orgKey: 'circularcraft',
      entityType: 'department',
      name: 'Production Department',
      description: 'Artisan team creating sustainable products, including training new artisans and quality control.',
      teamSize: 20,
      focusArea: 'Product manufacturing, artisan training, quality assurance',
    },
    {
      orgKey: 'circularcraft',
      entityType: 'team',
      name: 'Social Impact Team',
      description: 'Team focused on refugee integration, community partnerships, and social impact measurement.',
      teamSize: 3,
      focusArea: 'Social services, integration support, impact reporting',
    },
  ];
  
  for (const structure of structures) {
    const orgId = orgIds[structure.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('organization_structure')
      .insert({
        org_id: orgId,
        entity_type: structure.entityType,
        name: structure.name,
        description: structure.description,
        team_size: structure.teamSize,
        focus_area: structure.focusArea,
      });
    
    if (!error) {
      stats.structures++;
    } else {
      console.error(`   ⚠️  Error creating structure:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.structures} organization structures`);
}

async function seedOrganizationOwnership() {
  console.log('\n👥 Seeding organization ownership...');
  
  const ownerships = [
    // GreenPath - Collective/Cooperative model
    {
      orgKey: 'greenpath',
      entityType: 'collective',
      entityName: 'GreenPath Member Collective',
      ownershipPercentage: '100.00',
      controlType: 'voting_rights',
      description: 'Member-owned cooperative model where all staff and community representatives have equal voting rights.',
      isPublic: true,
    },
    // SkillBridge - Venture-backed startup
    {
      orgKey: 'skillbridge',
      entityType: 'individual',
      entityName: 'Founding Team',
      ownershipPercentage: '70.00',
      controlType: 'voting_rights',
      description: 'Three co-founders maintain majority ownership and control.',
      isPublic: false,
    },
    {
      orgKey: 'skillbridge',
      entityType: 'organization',
      entityName: 'Venture Capital Investors',
      ownershipPercentage: '30.00',
      controlType: 'board_seat',
      description: 'Series A investors with board representation.',
      isPublic: false,
    },
    // CircularCraft - Social enterprise hybrid
    {
      orgKey: 'circularcraft',
      entityType: 'individual',
      entityName: 'Founder & Management Team',
      ownershipPercentage: '60.00',
      controlType: 'management',
      description: 'Founders and management team maintain operational control.',
      isPublic: true,
    },
    {
      orgKey: 'circularcraft',
      entityType: 'organization',
      entityName: 'Community Trust',
      ownershipPercentage: '40.00',
      controlType: 'veto_power',
      description: 'Community trust representing artisan and local community interests, with veto power on major decisions.',
      isPublic: true,
    },
  ];
  
  for (const ownership of ownerships) {
    const orgId = orgIds[ownership.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('organization_ownership')
      .insert({
        org_id: orgId,
        entity_type: ownership.entityType,
        entity_name: ownership.entityName,
        ownership_percentage: ownership.ownershipPercentage,
        control_type: ownership.controlType,
        description: ownership.description,
        is_public: ownership.isPublic,
      });
    
    if (!error) {
      stats.ownerships++;
    } else {
      console.error(`   ⚠️  Error creating ownership record:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.ownerships} ownership records`);
}

async function linkDemoUsersAsMembers() {
  console.log('\n👤 Linking demo users as organization members...');
  
  const memberships = [
    // GreenPath members
    { orgKey: 'greenpath', userId: DEMO_USERS.amara, role: 'admin' },
    { orgKey: 'greenpath', userId: DEMO_USERS.alex, role: 'member' },
    // SkillBridge members
    { orgKey: 'skillbridge', userId: DEMO_USERS.sofia, role: 'admin' },
    { orgKey: 'skillbridge', userId: DEMO_USERS.james, role: 'member' },
    // CircularCraft members
    { orgKey: 'circularcraft', userId: DEMO_USERS.yuki, role: 'member' },
  ];
  
  for (const membership of memberships) {
    const orgId = orgIds[membership.orgKey];
    if (!orgId) continue;
    
    // Set joined_at to 6-12 months ago
    const monthsAgo = Math.floor(Math.random() * 6) + 6;
    const joinedAt = new Date();
    joinedAt.setMonth(joinedAt.getMonth() - monthsAgo);
    
    const { error } = await supabase
      .from('organization_members')
      .insert({
        org_id: orgId,
        user_id: membership.userId,
        role: membership.role,
        status: 'active',
        joined_at: joinedAt.toISOString(),
      });
    
    if (!error) {
      stats.members++;
    } else if (error.code !== '23505') { // Ignore duplicate key errors
      console.error(`   ⚠️  Error linking member:`, error.message);
    }
  }
  
  console.log(`   ✅ Linked ${stats.members} organization members`);
}

async function seedOrganizationVerification() {
  console.log('\n✅ Seeding organization verification records...');
  
  // Check if org_verification table exists
  const { error: tableCheckError } = await supabase
    .from('org_verification')
    .select('id')
    .limit(0);
  
  if (tableCheckError && tableCheckError.message.includes('does not exist')) {
    console.log(`   ⚠️  org_verification table does not exist yet. Run migrations first.`);
    console.log(`   ℹ️  You can manually verify organizations later after npm run db:migrate.`);
    return;
  }
  
  const verifications = [
    {
      orgKey: 'greenpath',
      verificationType: 'domain_email',
      domain: 'greenpath-ngo.org',
      status: 'verified',
      verifiedAt: '2023-06-15T10:30:00Z',
    },
    {
      orgKey: 'skillbridge',
      verificationType: 'domain_email',
      domain: 'skillbridge.tech',
      status: 'verified',
      verifiedAt: '2023-07-20T14:15:00Z',
    },
    {
      orgKey: 'circularcraft',
      verificationType: 'domain_email',
      domain: 'circularcraft.eu',
      status: 'verified',
      verifiedAt: '2023-08-10T09:45:00Z',
    },
  ];
  
  for (const verification of verifications) {
    const orgId = orgIds[verification.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('org_verification')
      .insert({
        org_id: orgId,
        verification_type: verification.verificationType,
        domain: verification.domain,
        status: verification.status,
        verified_at: verification.verifiedAt,
      });
    
    if (!error) {
      stats.verifications++;
    } else {
      console.error(`   ⚠️  Error creating verification:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.verifications} verification records`);
}

async function seedAssignments() {
  console.log('\n💼 Seeding sample assignments...');
  
  const assignments = [
    // GreenPath Assignment 1
    {
      orgKey: 'greenpath',
      role: 'Community Organizer for Urban Garden Project',
      description: `We're seeking an experienced community organizer to lead the expansion of our Urban Garden Network in Amsterdam and surrounding areas. This role is perfect for someone passionate about environmental justice, community empowerment, and sustainable food systems.

You'll work directly with neighborhood communities to establish new community gardens, train garden coordinators, and build partnerships with local stakeholders. This is a hands-on role that combines grassroots organizing, project management, and coalition building.

Key Responsibilities:
• Organize and mobilize community members to establish new urban gardens
• Train and support community garden coordinators
• Build relationships with local government, schools, and community organizations
• Facilitate participatory planning processes with diverse community members
• Track and report on project outcomes and community impact

What We Offer:
• Meaningful work contributing to climate action and food justice
• Collaborative, mission-driven team environment
• Flexible working arrangements
• Professional development opportunities
• Competitive nonprofit salary`,
      status: 'active',
      creationStatus: 'published',
      businessValue: 'Expand our proven urban garden model to 10 new neighborhoods, increasing our community reach and environmental impact.',
      expectedImpact: 'Establish 10 new community gardens serving 500+ families, create green spaces in underserved areas, build community resilience to climate change.',
      valuesRequired: ['Community Empowerment', 'Environmental Justice', 'Collaboration'],
      causeTags: ['Climate Action', 'Community Development', 'Food Justice', 'Environmental Justice'],
      mustHaveSkills: [
        { id: 'community-organizing', level: 4 },
        { id: 'program-management', level: 3 },
        { id: 'stakeholder-management', level: 3 },
      ],
      niceToHaveSkills: [
        { id: 'fundraising', level: 3 },
        { id: 'event-management', level: 3 },
      ],
      locationMode: 'hybrid',
      country: 'Netherlands',
      city: 'Amsterdam',
      compMin: 35000,
      compMax: 45000,
      currency: 'EUR',
      hoursMin: 32,
      hoursMax: 40,
      startEarliest: '2024-12-01',
      startLatest: '2025-02-01',
      verificationGates: ['work_email', 'reference'],
      canSponsorVisa: false,
      offersRelocationSupport: false,
    },
    // GreenPath Assignment 2
    {
      orgKey: 'greenpath',
      role: 'Impact Measurement Analyst',
      description: `Join our mission-driven team as an Impact Measurement Analyst to help us rigorously measure, analyze, and communicate the environmental and social impact of our programs. This role is ideal for a data-minded professional who wants to use their analytical skills for climate action.

You'll design and implement measurement frameworks, collect and analyze program data, and produce reports that help us understand and improve our impact. You'll work across all our programs (urban gardens, climate education, renewable energy) and collaborate with program teams, funders, and external evaluators.

Key Responsibilities:
• Design impact measurement frameworks aligned with international standards
• Collect, clean, and analyze program data from multiple sources
• Produce regular impact reports for internal and external stakeholders
• Support program teams with data-driven insights for continuous improvement
• Communicate complex data findings to non-technical audiences
• Maintain data systems and ensure data quality and integrity

What We Offer:
• Apply your data skills to meaningful climate and community work
• Collaborative team that values learning and innovation
• Opportunities to shape how we measure and communicate impact
• Remote-friendly with monthly team gatherings
• Competitive nonprofit compensation`,
      status: 'active',
      creationStatus: 'published',
      businessValue: 'Strengthen our ability to demonstrate impact to funders, improve program effectiveness through data-driven insights, and enhance organizational learning.',
      expectedImpact: 'Implement robust impact measurement across all programs, produce quarterly impact reports, increase funder confidence and secure additional funding.',
      valuesRequired: ['Transparency', 'Evidence-Based Practice', 'Continuous Learning'],
      causeTags: ['Climate Action', 'Impact Measurement', 'Data for Good'],
      mustHaveSkills: [
        { id: 'impact-measurement', level: 4 },
        { id: 'data-analysis', level: 4 },
        { id: 'monitoring-evaluation', level: 3 },
      ],
      niceToHaveSkills: [
        { id: 'strategic-planning', level: 3 },
        { id: 'data-visualization', level: 3 },
      ],
      locationMode: 'remote',
      country: 'Netherlands',
      city: 'Amsterdam',
      compMin: 40000,
      compMax: 50000,
      currency: 'EUR',
      hoursMin: 32,
      hoursMax: 40,
      startEarliest: '2024-11-15',
      startLatest: '2025-01-15',
      verificationGates: ['work_email', 'education'],
      canSponsorVisa: false,
      offersRelocationSupport: false,
    },
    // SkillBridge Assignment 1
    {
      orgKey: 'skillbridge',
      role: 'UX Designer for Mobile Learning App',
      description: `We're looking for a talented UX Designer to lead the design of our new mobile learning app, making professional skills training accessible on-the-go. This is an exciting opportunity to shape how thousands of career switchers learn new skills.

You'll own the end-to-end design process for our mobile app, from user research to high-fidelity prototypes. You'll work closely with our product, engineering, and curriculum teams to create an engaging, effective learning experience optimized for mobile devices.

Key Responsibilities:
• Lead user research to understand mobile learner needs and behaviors
• Design intuitive, engaging mobile learning experiences
• Create and maintain design systems for consistency across platforms
• Prototype and test designs with real users
• Collaborate with engineers to ensure high-quality implementation
• Iterate based on user feedback and learning analytics

What We Offer:
• Impact thousands of learners changing their careers
• Work with a talented, diverse team passionate about education
• Competitive salary and equity
• Flexible remote work
• Learning budget for your own development
• Modern design tools and resources`,
      status: 'active',
      creationStatus: 'published',
      businessValue: 'Launch mobile app to capture growing mobile learning market, increase user engagement and course completion rates, expand to new user segments.',
      expectedImpact: 'Deliver mobile app used by 10K+ learners in first year, increase daily active users by 40%, improve course completion by 20%.',
      valuesRequired: ['User-Centered Design', 'Innovation', 'Excellence'],
      causeTags: ['Education Access', 'Career Development', 'Design'],
      mustHaveSkills: [
        { id: 'ui-ux-design', level: 4 },
        { id: 'mobile-design', level: 4 },
        { id: 'user-research', level: 3 },
      ],
      niceToHaveSkills: [
        { id: 'prototyping', level: 4 },
        { id: 'design-systems', level: 3 },
      ],
      locationMode: 'remote',
      country: 'Germany',
      city: 'Berlin',
      compMin: 55000,
      compMax: 75000,
      currency: 'EUR',
      hoursMin: 40,
      hoursMax: 40,
      startEarliest: '2024-12-01',
      startLatest: '2025-02-01',
      verificationGates: ['portfolio', 'reference'],
      canSponsorVisa: true,
      offersRelocationSupport: true,
    },
    // SkillBridge Assignment 2
    {
      orgKey: 'skillbridge',
      role: 'Full-Stack Engineer (EdTech Platform)',
      description: `Join our engineering team to build and scale the platform that's helping thousands of people switch careers. We're looking for a full-stack engineer who's excited about education technology and building systems that scale.

You'll work across our tech stack (TypeScript, React, Node.js, PostgreSQL) to build new features, improve platform performance, and ensure a reliable experience for our learners. You'll have significant ownership and autonomy in your work.

Key Responsibilities:
• Build and ship new features across the full stack
• Improve platform performance, reliability, and scalability
• Write clean, maintainable code with comprehensive tests
• Collaborate with product and design on feature specifications
• Participate in code reviews and technical planning
• Contribute to technical architecture decisions

What We Offer:
• Work on meaningful problems in education
• Modern tech stack and development practices
• Collaborative, learning-focused engineering culture
• Competitive salary and equity
• Fully remote within Europe
• Conference attendance and learning budget`,
      status: 'active',
      creationStatus: 'published',
      businessValue: 'Scale platform to support 10X user growth, improve platform stability and performance, accelerate feature development velocity.',
      expectedImpact: 'Support 50K+ concurrent users, reduce page load times by 40%, ship 2-3 major features per quarter.',
      valuesRequired: ['Technical Excellence', 'User Focus', 'Collaboration'],
      causeTags: ['Education Access', 'Technology', 'Software Development'],
      mustHaveSkills: [
        { id: 'typescript', level: 4 },
        { id: 'react', level: 4 },
        { id: 'nodejs', level: 4 },
        { id: 'postgresql', level: 3 },
      ],
      niceToHaveSkills: [
        { id: 'api-design', level: 3 },
        { id: 'cloud-infrastructure', level: 3 },
      ],
      locationMode: 'remote',
      country: 'Germany',
      city: 'Berlin',
      compMin: 60000,
      compMax: 85000,
      currency: 'EUR',
      hoursMin: 40,
      hoursMax: 40,
      startEarliest: '2024-11-15',
      startLatest: '2025-01-15',
      verificationGates: ['technical_assessment', 'reference'],
      canSponsorVisa: true,
      offersRelocationSupport: true,
    },
    // CircularCraft Assignment 1
    {
      orgKey: 'circularcraft',
      role: 'Supply Chain Consultant with Fair Trade Experience',
      description: `We're seeking a supply chain consultant with deep expertise in sustainable and fair trade supply chains to help us scale our circular economy model. This is a unique opportunity to work at the intersection of sustainability, social impact, and business growth.

You'll work with our leadership team to optimize our supply chain for recycled materials, develop new supplier relationships, and ensure our supply chain maintains our high standards for sustainability and fair trade practices. You'll also help us prepare for geographic expansion into new Nordic markets.

Key Responsibilities:
• Assess and optimize current supply chain for recycled/upcycled materials
• Develop supplier relationships with recycling partners and material suppliers
• Implement supply chain tracking and transparency systems
• Ensure fair trade compliance throughout the supply chain
• Support geographic expansion supply chain planning
• Collaborate with production team on material sourcing

What We Offer:
• Lead supply chain strategy for a growing social enterprise
• Apply your expertise to meaningful sustainability work
• Flexible working arrangements (hybrid or remote)
• Collaborative, values-driven team culture
• Opportunity to shape our expansion strategy`,
      status: 'active',
      creationStatus: 'published',
      businessValue: 'Optimize supply chain for 50% cost reduction, establish supplier network for geographic expansion, maintain 100% recycled materials commitment.',
      expectedImpact: 'Reduce material costs by 50%, onboard 10+ new sustainable suppliers, enable expansion to 3 new markets.',
      valuesRequired: ['Sustainability', 'Fair Trade', 'Systems Thinking'],
      causeTags: ['Circular Economy', 'Fair Trade', 'Supply Chain', 'Sustainability'],
      mustHaveSkills: [
        { id: 'supply-chain', level: 4 },
        { id: 'sustainability', level: 4 },
        { id: 'stakeholder-management', level: 3 },
      ],
      niceToHaveSkills: [
        { id: 'project-management', level: 3 },
        { id: 'partnership-development', level: 3 },
      ],
      locationMode: 'hybrid',
      country: 'Denmark',
      city: 'Copenhagen',
      compMin: 50000,
      compMax: 65000,
      currency: 'EUR',
      hoursMin: 30,
      hoursMax: 40,
      startEarliest: '2024-12-15',
      startLatest: '2025-02-15',
      verificationGates: ['work_email', 'reference'],
      canSponsorVisa: false,
      offersRelocationSupport: false,
    },
    // CircularCraft Assignment 2
    {
      orgKey: 'circularcraft',
      role: 'Data Analyst for Social Impact Metrics',
      description: `Join our social impact team as a Data Analyst to help us measure and communicate our environmental and social impact. You'll work at the intersection of data science, sustainability, and social justice, helping us understand and maximize our positive impact.

You'll develop metrics and dashboards to track our circular economy performance (waste diverted, materials recycled, carbon impact) and social impact (artisan employment, economic mobility, community integration). Your work will inform strategic decisions and help us communicate our impact to stakeholders.

Key Responsibilities:
• Design and implement social and environmental impact metrics
• Build dashboards and reports for internal and external stakeholders
• Analyze data to identify trends and improvement opportunities
• Collaborate with production and social impact teams on data collection
• Support B-Corp certification and impact reporting requirements
• Communicate findings to diverse audiences (artisans, funders, customers)

What We Offer:
• Use data science for environmental and social good
• Work in a multilingual, multicultural team
• Flexible, family-friendly work arrangements
• Professional development in impact measurement
• Competitive salary for social enterprise`,
      status: 'active',
      creationStatus: 'published',
      businessValue: 'Strengthen impact measurement for B-Corp certification, demonstrate value to customers and investors, identify opportunities for impact improvement.',
      expectedImpact: 'Track 100% of environmental and social metrics, produce quarterly impact reports, support B-Corp re-certification, inform strategic decisions.',
      valuesRequired: ['Data-Driven Impact', 'Transparency', 'Social Justice'],
      causeTags: ['Impact Measurement', 'Circular Economy', 'Social Enterprise', 'Data Science'],
      mustHaveSkills: [
        { id: 'data-analysis', level: 4 },
        { id: 'impact-measurement', level: 3 },
        { id: 'python', level: 3 },
      ],
      niceToHaveSkills: [
        { id: 'data-visualization', level: 3 },
        { id: 'statistical-modeling', level: 3 },
      ],
      locationMode: 'hybrid',
      country: 'Denmark',
      city: 'Copenhagen',
      compMin: 45000,
      compMax: 60000,
      currency: 'EUR',
      hoursMin: 32,
      hoursMax: 40,
      startEarliest: '2025-01-01',
      startLatest: '2025-03-01',
      verificationGates: ['work_email', 'portfolio'],
      canSponsorVisa: false,
      offersRelocationSupport: false,
    },
  ];
  
  for (const assignment of assignments) {
    const orgId = orgIds[assignment.orgKey];
    if (!orgId) continue;
    
    const { error } = await supabase
      .from('assignments')
      .insert({
        org_id: orgId,
        role: assignment.role,
        description: assignment.description,
        status: assignment.status,
        creation_status: assignment.creationStatus,
        business_value: assignment.businessValue,
        expected_impact: assignment.expectedImpact,
        values_required: assignment.valuesRequired,
        cause_tags: assignment.causeTags,
        must_have_skills: assignment.mustHaveSkills,
        nice_to_have_skills: assignment.niceToHaveSkills,
        location_mode: assignment.locationMode,
        country: assignment.country,
        city: assignment.city,
        comp_min: assignment.compMin,
        comp_max: assignment.compMax,
        currency: assignment.currency,
        hours_min: assignment.hoursMin,
        hours_max: assignment.hoursMax,
        start_earliest: assignment.startEarliest,
        start_latest: assignment.startLatest,
        verification_gates: assignment.verificationGates,
        can_sponsor_visa: assignment.canSponsorVisa,
        offers_relocation_support: assignment.offersRelocationSupport,
      });
    
    if (!error) {
      stats.assignments++;
    } else {
      console.error(`   ⚠️  Error creating assignment ${assignment.role}:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${stats.assignments} assignments`);
}

async function addAuditLogs() {
  console.log('\n📋 Adding audit logs...');
  
  // Create audit logs for org creation, member additions, and assignment publications
  const logs = [];
  
  for (const [key, orgId] of Object.entries(orgIds)) {
    const orgData = organizationData[key];
    const authUserId = await getAuthUserIdByEmail(orgData.email);
    
    if (!authUserId) continue;
    
    // Organization creation log
    logs.push({
      actor_id: authUserId,
      org_id: orgId,
      action: 'organization.created',
      target_type: 'organization',
      target_id: orgId,
      meta: { organization_name: orgData.displayName },
    });
    
    // Assignment publication logs (we created 2 per org)
    logs.push({
      actor_id: authUserId,
      org_id: orgId,
      action: 'assignment.published',
      target_type: 'assignment',
      target_id: orgId,
      meta: { count: 2 },
    });
  }
  
  // Member addition logs
  const memberLogs = [
    { orgKey: 'greenpath', userId: DEMO_USERS.amara, role: 'admin' },
    { orgKey: 'greenpath', userId: DEMO_USERS.alex, role: 'member' },
    { orgKey: 'skillbridge', userId: DEMO_USERS.sofia, role: 'admin' },
    { orgKey: 'skillbridge', userId: DEMO_USERS.james, role: 'member' },
    { orgKey: 'circularcraft', userId: DEMO_USERS.yuki, role: 'member' },
  ];
  
  for (const member of memberLogs) {
    const orgId = orgIds[member.orgKey];
    const orgData = organizationData[member.orgKey];
    const authUserId = await getAuthUserIdByEmail(orgData.email);
    
    if (!orgId || !authUserId) continue;
    
    logs.push({
      actor_id: authUserId,
      org_id: orgId,
      action: 'organization.member_added',
      target_type: 'organization_member',
      target_id: member.userId,
      meta: { role: member.role, user_id: member.userId },
    });
  }
  
  // Insert all audit logs
  for (const log of logs) {
    const { error } = await supabase
      .from('audit_logs')
      .insert(log);
    
    if (!error) {
      stats.auditLogs++;
    }
  }
  
  console.log(`   ✅ Created ${stats.auditLogs} audit log entries`);
}

async function main() {
  console.log('═'.repeat(80));
  console.log('🏢 PROOFOUND DEMO ORGANIZATION SEEDING SCRIPT');
  console.log('═'.repeat(80));
  console.log('\nThis script will populate 3 demo organization accounts with comprehensive data:');
  console.log('  • GreenPath NGO - Environmental NGO (Amsterdam)');
  console.log('  • SkillBridge - EdTech Startup (Berlin)');
  console.log('  • CircularCraft - Social Enterprise (Copenhagen)');
  console.log('\nWhat will be created:');
  console.log('  • Full organization profiles with missions, values, and causes');
  console.log('  • Organization projects, partnerships, certifications, and goals');
  console.log('  • Organization structure and ownership information');
  console.log('  • Organization verification records');
  console.log('  • Sample assignments (1-2 per org) for testing matching');
  console.log('  • Links to existing demo users as organization members');
  console.log('  • Audit logs for all actions');
  console.log('\n⚠️  WARNING: This will add data to your database!');
  console.log('   Make sure auth users for the 3 org emails exist in Supabase.\n');
  
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
    await seedOrganizations();
    await seedOrganizationProjects();
    await seedOrganizationPartnerships();
    await seedOrganizationCertifications();
    await seedOrganizationGoals();
    await seedOrganizationStructure();
    await seedOrganizationOwnership();
    await linkDemoUsersAsMembers();
    await seedOrganizationVerification();
    await seedAssignments();
    await addAuditLogs();
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ SEEDING COMPLETE!');
    console.log('═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   • Organizations created: ${stats.organizations}`);
    console.log(`   • Projects created: ${stats.projects}`);
    console.log(`   • Partnerships created: ${stats.partnerships}`);
    console.log(`   • Certifications created: ${stats.certifications}`);
    console.log(`   • Goals created: ${stats.goals}`);
    console.log(`   • Structure entries: ${stats.structures}`);
    console.log(`   • Ownership records: ${stats.ownerships}`);
    console.log(`   • Organization members linked: ${stats.members}`);
    console.log(`   • Verification records: ${stats.verifications}`);
    console.log(`   • Assignments created: ${stats.assignments}`);
    console.log(`   • Audit logs created: ${stats.auditLogs}`);
    console.log('\n🎉 Demo organizations are ready for testing!\n');
    console.log('💡 Next steps:');
    console.log('   1. Log in with one of the org accounts');
    console.log('   2. Verify organization profiles display correctly');
    console.log('   3. Check that assignments are visible and searchable');
    console.log('   4. Test the matching system with individual demo users\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
