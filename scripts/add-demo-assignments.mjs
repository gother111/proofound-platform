/**
 * Add demo assignments to existing organizations
 * Run after seed-demo-organizations.mjs to add the 6 sample assignments
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Get org IDs by slug
async function getOrgIdBySlug(slug) {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error(`❌ Error finding org ${slug}:`, error.message);
    return null;
  }
  
  return data?.id;
}

async function main() {
  console.log('💼 Adding demo assignments to organizations...\n');
  
  // Get organization IDs
  const greenpathId = await getOrgIdBySlug('greenpath-ngo');
  const skillbridgeId = await getOrgIdBySlug('skillbridge');
  const circularcraftId = await getOrgIdBySlug('circularcraft');
  
  if (!greenpathId || !skillbridgeId || !circularcraftId) {
    console.error('❌ Could not find all organizations. Run seed-demo-organizations.mjs first.');
    process.exit(1);
  }
  
  const assignments = [
    // GreenPath Assignment 1
    {
      orgId: greenpathId,
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
      orgId: greenpathId,
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
      orgId: skillbridgeId,
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
      orgId: skillbridgeId,
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
      orgId: circularcraftId,
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
      orgId: circularcraftId,
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
  
  let created = 0;
  
  for (const assignment of assignments) {
    const { error } = await supabase
      .from('assignments')
      .insert({
        org_id: assignment.orgId,
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
    
    if (error) {
      console.error(`   ❌ Error creating ${assignment.role}:`, error.message);
    } else {
      console.log(`   ✅ Created: ${assignment.role}`);
      created++;
    }
  }
  
  console.log(`\n✅ Successfully created ${created} out of ${assignments.length} assignments!\n`);
}

main();

