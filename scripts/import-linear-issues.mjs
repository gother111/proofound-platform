#!/usr/bin/env node
/**
 * Linear Issues Bulk Import Script
 * 
 * This script creates all issues in Linear based on LINEAR_ORGANIZATION_PLAN.md
 * 
 * Prerequisites:
 * 1. Get your Linear API key from: https://linear.app/settings/api
 * 2. Set LINEAR_API_KEY environment variable: export LINEAR_API_KEY="your_key_here"
 * 3. Or create .env.local with LINEAR_API_KEY=your_key_here
 * 4. Install dependencies: npm install node-fetch dotenv
 * 
 * Usage:
 *   node scripts/import-linear-issues.mjs
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('❌ Error: LINEAR_API_KEY environment variable not set');
  console.error('   Get your API key from: https://linear.app/settings/api');
  console.error('   Then run: export LINEAR_API_KEY="your_key_here"');
  process.exit(1);
}

const LINEAR_API_URL = 'https://api.linear.app/graphql';

// GraphQL queries
const GET_TEAMS = `
  query {
    teams {
      nodes {
        id
        key
        name
      }
    }
  }
`;

const GET_LABELS = `
  query {
    issueLabels {
      nodes {
        id
        name
      }
    }
  }
`;

const GET_PROJECTS = `
  query {
    projects {
      nodes {
        id
        key
        name
      }
    }
  }
`;

const CREATE_ISSUE = `
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        title
        url
      }
    }
  }
`;

const CREATE_LABEL = `
  mutation CreateLabel($input: IssueLabelCreateInput!) {
    issueLabelCreate(input: $input) {
      success
      issueLabel {
        id
        name
      }
    }
  }
`;

const CREATE_PROJECT = `
  mutation CreateProject($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
      success
      project {
        id
        key
        name
      }
    }
  }
`;

async function graphqlRequest(query, variables = {}) {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINEAR_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  }

  return data.data;
}

// Label definitions
const LABELS_TO_CREATE = [
  // Status
  { name: 'completed', color: '#0E8A16' },
  { name: 'in-progress', color: '#FBBA00' },
  { name: 'todo', color: '#D1D5DB' },
  { name: 'blocked', color: '#D93F0B' },
  
  // Priority
  { name: 'priority-p0', color: '#D93F0B' },
  { name: 'priority-p1', color: '#F59E0B' },
  { name: 'priority-p2', color: '#3B82F6' },
  { name: 'priority-p3', color: '#6B7280' },
  
  // Epics
  { name: 'epic-1', color: '#8B5CF6' },
  { name: 'epic-2', color: '#8B5CF6' },
  { name: 'epic-3', color: '#8B5CF6' },
  { name: 'epic-4', color: '#8B5CF6' },
  { name: 'epic-5', color: '#8B5CF6' },
  { name: 'epic-6', color: '#8B5CF6' },
  { name: 'epic-7', color: '#8B5CF6' },
  { name: 'epic-8', color: '#8B5CF6' },
  { name: 'epic-9', color: '#8B5CF6' },
  { name: 'epic-10', color: '#8B5CF6' },
  
  // Types
  { name: 'taxonomy', color: '#10B981' },
  { name: 'matching', color: '#3B82F6' },
  { name: 'ui', color: '#F59E0B' },
  { name: 'api', color: '#6366F1' },
  { name: 'database', color: '#8B5CF6' },
  { name: 'infrastructure', color: '#6B7280' },
  { name: 'authentication', color: '#EF4444' },
  { name: 'onboarding', color: '#10B981' },
  { name: 'dashboard', color: '#F59E0B' },
  { name: 'profile', color: '#3B82F6' },
  { name: 'projects', color: '#8B5CF6' },
  { name: 'expertise-atlas', color: '#10B981' },
  { name: 'assignments', color: '#6366F1' },
  { name: 'algorithm', color: '#EC4899' },
  { name: 'security', color: '#EF4444' },
  { name: 'testing', color: '#10B981' },
  { name: 'documentation', color: '#6B7280' },
  { name: 'foundation', color: '#6B7280' },
  { name: 'design-system', color: '#F59E0B' },
  { name: 'email', color: '#3B82F6' },
  { name: 'templates', color: '#6366F1' },
  { name: 'migration', color: '#8B5CF6' },
  { name: 'ml', color: '#EC4899' },
  { name: 'embeddings', color: '#EC4899' },
  { name: 'data-engineering', color: '#10B981' },
  { name: 'graph', color: '#8B5CF6' },
  { name: 'workflow', color: '#6366F1' },
  { name: 'components', color: '#F59E0B' },
  { name: 'middleware', color: '#3B82F6' },
  
  // Components
  { name: 'individual', color: '#10B981' },
  { name: 'organization', color: '#3B82F6' },
  { name: 'shared', color: '#6B7280' },
  
  // Priority shortcuts
  { name: 'blocker', color: '#D93F0B' },
];

// Issues data structure (simplified - full version would come from LINEAR_ORGANIZATION_PLAN.md)
const ISSUES = [
  // COMPLETED WORK
  {
    title: 'Next.js 15 Setup with TypeScript',
    description: 'Project foundation with Next.js 15.5.4, TypeScript, App Router, ESLint, Prettier, Husky pre-commit hooks. Build pipeline working.',
    labels: ['completed', 'infrastructure', 'foundation'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Design System Implementation',
    description: 'Brand tokens, motion tokens, Tailwind config, shadcn/ui setup. Files: `src/design/brand-tokens.json`, `src/design/motion-tokens.json`',
    labels: ['completed', 'design-system', 'ui'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Complete Database Schema with Drizzle ORM',
    description: 'All tables defined, RLS policies written, triggers configured. Files: `src/db/schema.ts`, `src/db/policies.sql`, `src/db/triggers.sql`',
    labels: ['completed', 'database', 'schema'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Supabase MCP Setup and Integration',
    description: 'Database connection, MCP tools configured, 23 tables accessible. Files: `SUPABASE_MCP_COMPLETE.md`, `docs/SUPABASE_MCP_SETUP.md`',
    labels: ['completed', 'infrastructure', 'supabase'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Complete Authentication Flow',
    description: 'Email/password, Google OAuth, password reset, session management. Files: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`',
    labels: ['completed', 'authentication', 'security'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Authentication Pages Redesign (Figma Alignment)',
    description: 'Multi-step signup flows, universal sign-in, Figma color matching. Files: `AUTH_REDESIGN_COMPLETE.md`, `components/auth/`',
    labels: ['completed', 'design', 'authentication'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Email Templates with React Email',
    description: 'Verification, password reset, organization invitation emails. Files: `emails/VerifyEmail.tsx`, `emails/ResetPassword.tsx`, `emails/OrgInvite.tsx`',
    labels: ['completed', 'email', 'templates'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Individual Dashboard Figma Alignment',
    description: '3-column grid layout, all dashboard cards, empty states. Files: `DASHBOARD_ALIGNMENT_COMPLETE.md`, `src/app/app/i/home/page.tsx`',
    labels: ['completed', 'dashboard', 'ui', 'individual'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Organization Dashboard Figma Alignment',
    description: 'Pixel-perfect match with individual dashboard, shared components. Files: `ORG_DASHBOARD_FIGMA_ALIGNMENT_COMPLETE.md`, `src/app/app/o/[slug]/home/page.tsx`',
    labels: ['completed', 'dashboard', 'ui', 'organization'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Profile Empty State Restructure',
    description: '3-tab structure (Impact, Journey, Service), empty states. Files: `src/components/profile/EmptyProfileStateView.tsx`',
    labels: ['completed', 'profile', 'ui'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Core Matching System Implementation',
    description: 'Multi-factor matching algorithm, scoring system, API endpoints. Files: `src/lib/core/matching/`, `src/app/api/core/matching/`',
    labels: ['completed', 'matching', 'algorithm'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  {
    title: 'Matching API Endpoints (13 endpoints)',
    description: 'All matching/expertise endpoints functional. Files: `src/app/api/match/`, `src/app/api/matching-profile/`',
    labels: ['completed', 'api', 'matching'],
    state: 'completed',
    priority: null,
    estimate: null,
  },
  
  // IN PROGRESS
  {
    title: 'Individual Setup Form Component',
    description: `Complete form with all individual profile fields, form validation and error handling, integration with server actions, redirect after completion.
    
**Acceptance Criteria:**
- [ ] Complete form with all individual profile fields
- [ ] Form validation and error handling
- [ ] Integration with server actions
- [ ] Redirect after completion`,
    labels: ['in-progress', 'onboarding', 'individual', 'blocker', 'priority-p0'],
    state: 'inProgress',
    priority: 0,
    estimate: 8,
  },
  {
    title: 'Organization Setup Form Component',
    description: `Complete form with organization details, team invite step, form validation, redirect after completion.
    
**Acceptance Criteria:**
- [ ] Complete form with organization details
- [ ] Team invite step
- [ ] Form validation
- [ ] Redirect after completion`,
    labels: ['in-progress', 'onboarding', 'organization', 'blocker', 'priority-p0'],
    state: 'inProgress',
    priority: 0,
    estimate: 8,
  },
  {
    title: 'Complete Password Reset Flow',
    description: `Reset password request page working, reset password confirmation page working, email flow tested end-to-end.
    
**Acceptance Criteria:**
- [ ] Reset password request page working
- [ ] Reset password confirmation page working
- [ ] Email flow tested end-to-end`,
    labels: ['in-progress', 'authentication', 'blocker', 'priority-p0'],
    state: 'inProgress',
    priority: 0,
    estimate: 5,
  },
  {
    title: 'Complete Email Verification Flow',
    description: `Verification page renders correctly, handles verification links, shows success/error states.
    
**Acceptance Criteria:**
- [ ] Verification page renders correctly
- [ ] Handles verification links
- [ ] Shows success/error states`,
    labels: ['in-progress', 'authentication', 'blocker', 'priority-p0'],
    state: 'inProgress',
    priority: 0,
    estimate: 3,
  },
  {
    title: 'Organization Invitation Acceptance Page',
    description: `Token verification, accept/reject functionality, email notifications, test invite → accept flow.
    
**Route:** \`/app/o/[slug]/invitations/[token]\`

**Acceptance Criteria:**
- [ ] Token verification
- [ ] Accept/reject functionality
- [ ] Email notifications
- [ ] Test invite → accept flow`,
    labels: ['todo', 'authentication', 'organization', 'blocker', 'priority-p0'],
    state: 'backlog',
    priority: 0,
    estimate: 5,
  },
  {
    title: 'Add Essential UI Components',
    description: `Select (for dropdowns), Dialog (for modals), Toast (for notifications), Avatar (for user profiles), Badge (for status indicators).
    
**Needed:**
- [ ] Select (for dropdowns) - 3 pts
- [ ] Dialog (for modals) - 3 pts
- [ ] Toast (for notifications) - 3 pts
- [ ] Avatar (for user profiles) - 2 pts
- [ ] Badge (for status indicators) - 2 pts`,
    labels: ['in-progress', 'ui', 'components', 'priority-p1'],
    state: 'inProgress',
    priority: 1,
    estimate: 13,
  },
  {
    title: 'Complete Middleware Route Guards',
    description: `Public route detection, onboarding status checks, organization access verification, error boundaries (error.tsx, not-found.tsx).
    
**Acceptance Criteria:**
- [ ] Public route detection
- [ ] Onboarding status checks
- [ ] Organization access verification
- [ ] Error boundaries (error.tsx, not-found.tsx)`,
    labels: ['in-progress', 'middleware', 'security', 'priority-p1'],
    state: 'inProgress',
    priority: 1,
    estimate: 8,
  },
  
  // EPIC 1: Skills Taxonomy System
  {
    title: 'E1-US1: Design & Seed L1 Categories',
    description: `Define and seed 6 top-level skill domains (L1).

**Acceptance Criteria:**
- [ ] 6 L1 categories defined with slugs, i18n names (EN, SV)
- [ ] Migration \`20250130_add_skills_taxonomy.sql\` applied
- [ ] \`skills_categories\` table populated
- [ ] Unit tests verify category structure

**Files:** \`src/db/migrations/20250130_add_skills_taxonomy.sql\``,
    labels: ['epic-1', 'taxonomy', 'database', 'blocker', 'priority-p0'],
    state: 'backlog',
    priority: 0,
    estimate: 5,
  },
  {
    title: 'E1-US2: Define L2 & L3 Subcategories',
    description: `Define L2 and L3 subcategories for each L1 domain.

**Dependencies:** E1-US1

**Acceptance Criteria:**
- [ ] At least 7 L2 categories per L1 (42 total)
- [ ] At least 3 L3 categories per L2 (126 total)
- [ ] All categories have i18n names and descriptions
- [ ] Seed data scripts created and tested`,
    labels: ['epic-1', 'taxonomy', 'database', 'blocker', 'priority-p0'],
    state: 'backlog',
    priority: 0,
    estimate: 8,
  },
  {
    title: 'E1-US3: Populate L4 Skills (Initial 1,000)',
    description: `Populate the skills_taxonomy table with 1,000+ L4 granular skills.

**Dependencies:** E1-US2

**Acceptance Criteria:**
- [ ] 1,000+ L4 skills across all L1 categories
- [ ] Each skill has: code, slug, i18n name, aliases, description, tags
- [ ] Skill codes follow format: \`XX.YY.ZZ.NNN\`
- [ ] Skills distributed across categories
- [ ] CSV/JSON seed files for import
- [ ] Duplicate detection scripts`,
    labels: ['epic-1', 'taxonomy', 'data-engineering', 'blocker', 'priority-p0'],
    state: 'backlog',
    priority: 0,
    estimate: 13,
  },
  {
    title: 'E1-US4: Implement Skill Embeddings',
    description: `Generate vector embeddings for all skills using multilingual-e5-large model.

**Dependencies:** E1-US3

**Acceptance Criteria:**
- [ ] Embedding model selected (\`multilingual-e5-large\`, 768d)
- [ ] Batch job generates embeddings for all skills
- [ ] Embeddings stored in \`skills_taxonomy.embedding\` (pgvector)
- [ ] HNSW index created for fast ANN search
- [ ] Semantic search API endpoint
- [ ] Performance: <10 min for 1,000 skills`,
    labels: ['epic-1', 'taxonomy', 'ml', 'embeddings', 'priority-p1'],
    state: 'backlog',
    priority: 1,
    estimate: 13,
  },
  {
    title: 'E1-US5: Update Existing Skills Table',
    description: `Migrate existing skills records to reference taxonomy codes.

**Dependencies:** E1-US3

**Acceptance Criteria:**
- [ ] Existing \`skills.skill_id\` mapped to \`skills_taxonomy.code\`
- [ ] New column \`skills.skill_code\` populated
- [ ] Backward compatibility maintained
- [ ] Migration script with rollback plan
- [ ] Update API to use \`skill_code\``,
    labels: ['epic-1', 'taxonomy', 'migration', 'blocker', 'priority-p0'],
    state: 'backlog',
    priority: 0,
    estimate: 8,
  },
  {
    title: 'E1-US6: Skills Taxonomy API Endpoints',
    description: `API endpoints to browse and search skills taxonomy.

**Dependencies:** E1-US3

**Acceptance Criteria:**
- [ ] \`GET /api/taxonomy/categories\` - List L1 categories
- [ ] \`GET /api/taxonomy/categories/:cat_id/subcategories\` - List L2
- [ ] \`GET /api/taxonomy/skills/search?q=...\` - Search skills
- [ ] \`GET /api/taxonomy/skills/:code\` - Get skill details
- [ ] i18n support via Accept-Language header
- [ ] Rate limited (60 req/min)
- [ ] Cached (5 min TTL)`,
    labels: ['epic-1', 'taxonomy', 'api', 'priority-p0'],
    state: 'backlog',
    priority: 0,
    estimate: 8,
  },
];

async function ensureLabels(labelMap) {
  console.log('📋 Creating labels...');
  const existingLabels = await graphqlRequest(GET_LABELS);
  const existingLabelNames = new Set(existingLabels.issueLabels.nodes.map(l => l.name));
  
  for (const label of LABELS_TO_CREATE) {
    if (existingLabelNames.has(label.name)) {
      console.log(`   ✓ Label "${label.name}" already exists`);
      continue;
    }
    
    try {
      const result = await graphqlRequest(CREATE_LABEL, {
        input: {
          name: label.name,
          color: label.color,
        },
      });
      
      if (result.issueLabelCreate.success) {
        labelMap[label.name] = result.issueLabelCreate.issueLabel.id;
        console.log(`   ✓ Created label "${label.name}"`);
      }
    } catch (error) {
      console.error(`   ✗ Failed to create label "${label.name}":`, error.message);
    }
  }
}

async function createIssues(teamId, labelMap) {
  console.log('\n📝 Creating issues...');
  let created = 0;
  let skipped = 0;
  
  for (const issue of ISSUES) {
    try {
      // Map label names to IDs
      const labelIds = issue.labels
        .map(name => labelMap[name])
        .filter(id => id !== undefined);
      
      // Map state names to Linear state types
      const stateTypeMap = {
        'completed': 'done',
        'inProgress': 'started',
        'backlog': 'backlog',
        'todo': 'backlog',
      };
      
      const input = {
        teamId,
        title: issue.title,
        description: issue.description,
        labelIds: labelIds.length > 0 ? labelIds : undefined,
        priority: issue.priority !== null ? issue.priority : undefined,
        estimate: issue.estimate !== null ? issue.estimate : undefined,
        stateType: stateTypeMap[issue.state] || 'backlog',
      };
      
      const result = await graphqlRequest(CREATE_ISSUE, { input });
      
      if (result.issueCreate.success) {
        created++;
        console.log(`   ✓ Created: ${result.issueCreate.issue.identifier} - ${issue.title}`);
      } else {
        skipped++;
        console.log(`   ✗ Failed: ${issue.title}`);
      }
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      skipped++;
      console.error(`   ✗ Error creating "${issue.title}":`, error.message);
    }
  }
  
  console.log(`\n✅ Created ${created} issues, skipped ${skipped}`);
}

async function main() {
  console.log('🚀 Linear Issues Import Script\n');
  
  try {
    // Get teams
    console.log('👥 Fetching teams...');
    const teamsData = await graphqlRequest(GET_TEAMS);
    const teams = teamsData.teams.nodes;
    
    if (teams.length === 0) {
      console.error('❌ No teams found. Please create a team in Linear first.');
      process.exit(1);
    }
    
    const team = teams[0]; // Use first team
    console.log(`   ✓ Using team: ${team.name} (${team.key})`);
    
    // Create labels
    const labelMap = {};
    await ensureLabels(labelMap);
    
    // Get existing labels for mapping
    const existingLabels = await graphqlRequest(GET_LABELS);
    existingLabels.issueLabels.nodes.forEach(label => {
      labelMap[label.name] = label.id;
    });
    
    // Create issues
    await createIssues(team.id, labelMap);
    
    console.log('\n🎉 Import complete!');
    console.log(`   View your issues at: https://linear.app/${team.key}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

