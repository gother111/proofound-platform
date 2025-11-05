/**
 * Seed organization projects for demo orgs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

async function getOrgId(slug) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id;
}

async function seedOrgProjects() {
  console.log('🏗️  Seeding Organization Projects...\n');
  
  const greenpathId = await getOrgId('greenpath-ngo');
  const skillbridgeId = await getOrgId('skillbridge');
  const circularcraftId = await getOrgId('circularcraft');
  
  const projects = [
    // GreenPath NGO Projects
    {
      org_id: greenpathId,
      name: 'Urban Garden Network Amsterdam',
      description: 'Community-led initiative to establish 15 urban gardens across Amsterdam neighborhoods, focusing on food security and climate adaptation.',
      status: 'active',
      start_date: '2024-01-15',
      end_date: null,
      impact_summary: '8 gardens established, 350+ families participating, 5 tons of fresh produce grown',
      metrics: {
        gardens_established: 8,
        families_participating: 350,
        produce_grown_kg: 5000,
        co2_offset_tons: 12
      },
      visibility: 'public',
    },
    {
      org_id: greenpathId,
      name: 'Climate Education in Schools',
      description: 'Interactive climate education program delivered to 30 schools across Amsterdam, teaching students about climate action and sustainability.',
      status: 'active',
      start_date: '2023-09-01',
      end_date: null,
      impact_summary: '2,500+ students reached, 85% showed increased climate awareness',
      metrics: {
        schools_reached: 30,
        students_educated: 2500,
        teachers_trained: 75,
        awareness_increase_percent: 85
      },
      visibility: 'public',
    },
    {
      org_id: greenpathId,
      name: 'Renewable Energy Cooperative',
      description: 'Community-owned solar energy cooperative providing clean energy to 200+ households while reducing energy costs.',
      status: 'completed',
      start_date: '2022-03-01',
      end_date: '2024-06-30',
      impact_summary: '200 households powered, €150K in energy savings, 120 tons CO2 reduced annually',
      metrics: {
        households_powered: 200,
        energy_savings_eur: 150000,
        co2_reduced_tons_annual: 120,
        solar_panels_installed: 450
      },
      visibility: 'public',
    },
    
    // SkillBridge Projects
    {
      org_id: skillbridgeId,
      name: 'EdTech Platform v2.0',
      description: 'Next-generation learning platform with AI-powered personalization, mobile-first design, and gamification features.',
      status: 'active',
      start_date: '2024-03-01',
      end_date: '2025-02-28',
      impact_summary: 'Platform serving 15K+ active learners with 40% improvement in course completion',
      metrics: {
        active_learners: 15000,
        courses_completed: 8500,
        completion_improvement_percent: 40,
        user_satisfaction_score: 4.6
      },
      visibility: 'public',
    },
    {
      org_id: skillbridgeId,
      name: 'Career Switcher Success Program',
      description: 'Comprehensive program supporting professionals transitioning into tech careers, with mentorship, job placement, and skills assessment.',
      status: 'active',
      start_date: '2023-06-01',
      end_date: null,
      impact_summary: '500+ career switchers supported, 78% successfully placed in new roles',
      metrics: {
        participants: 500,
        job_placement_rate_percent: 78,
        average_salary_increase_percent: 45,
        mentors_engaged: 120
      },
      visibility: 'public',
    },
    {
      org_id: skillbridgeId,
      name: 'Mobile Learning App Launch',
      description: 'Native mobile app for iOS and Android bringing our learning platform to mobile devices with offline support.',
      status: 'completed',
      start_date: '2023-01-15',
      end_date: '2023-12-31',
      impact_summary: 'Successfully launched, 10K+ downloads in first 3 months, 4.8 star rating',
      metrics: {
        downloads: 10000,
        daily_active_users: 3500,
        app_store_rating: 4.8,
        mobile_users_percent: 35
      },
      visibility: 'public',
    },
    
    // CircularCraft Projects
    {
      org_id: circularcraftId,
      name: 'Refugee Artisan Training Program',
      description: 'Comprehensive training program teaching upcycling and craft skills to refugee artisans, providing economic opportunities and cultural integration.',
      status: 'active',
      start_date: '2023-03-01',
      end_date: null,
      impact_summary: '45 refugee artisans trained, 30 now in full-time employment, €180K in artisan income generated',
      metrics: {
        artisans_trained: 45,
        artisans_employed: 30,
        income_generated_eur: 180000,
        products_created: 2500
      },
      visibility: 'public',
    },
    {
      org_id: circularcraftId,
      name: 'Circular Supply Chain Initiative',
      description: 'Building a 100% circular supply chain for our products, sourcing only recycled and upcycled materials from verified sustainable partners.',
      status: 'active',
      start_date: '2024-01-01',
      end_date: null,
      impact_summary: 'Diverted 15 tons of waste from landfills, established partnerships with 8 recycling facilities',
      metrics: {
        waste_diverted_tons: 15,
        recycling_partners: 8,
        recycled_materials_percent: 92,
        carbon_footprint_reduction_percent: 65
      },
      visibility: 'public',
    },
    {
      org_id: circularcraftId,
      name: 'B-Corp Certification Achievement',
      description: 'Successfully achieved B-Corp certification, demonstrating our commitment to social and environmental performance.',
      status: 'completed',
      start_date: '2022-09-01',
      end_date: '2023-08-31',
      impact_summary: 'Achieved B-Corp certification with score of 89.5, in top 10% of B-Corps globally',
      metrics: {
        b_corp_score: 89.5,
        impact_areas_improved: 12,
        policies_implemented: 25,
        stakeholders_engaged: 200
      },
      visibility: 'public',
    },
  ];
  
  let created = 0;
  
  for (const project of projects) {
    const { error } = await supabase
      .from('org_projects')
      .insert(project);
    
    if (error) {
      console.log(`   ❌ Error: ${project.name} - ${error.message}`);
    } else {
      console.log(`   ✅ ${project.name}`);
      created++;
    }
  }
  
  console.log(`\n✅ Successfully created ${created}/${projects.length} organization projects!\n`);
}

seedOrgProjects();

