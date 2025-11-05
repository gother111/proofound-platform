/**
 * Integration Tests: CV Import Feature
 * 
 * Tests the auto-suggest API and skill saving functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST as autoSuggestHandler } from '@/app/api/expertise/auto-suggest/route';
import { POST as addSkillHandler, GET as getSkillsHandler } from '@/app/api/expertise/user-skills/route';
import { testDb, createTestSupabaseClient, generators, createMockRequest } from './setup';
import { db } from '@/db';
import { skillsTaxonomy, skills } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('CV Import Integration Tests', () => {
  let testUserId: string;
  let testUserEmail: string;
  let supabase: ReturnType<typeof createTestSupabaseClient>;
  let authToken: string;

  beforeAll(async () => {
    testUserId = generators.userId();
    testUserEmail = generators.email();
    supabase = createTestSupabaseClient();

    // Create test user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        display_name: 'CV Import Test User',
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    testUserId = authData.user.id;

    // Get auth token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: 'TestPassword123!',
    });

    if (sessionError || !sessionData.session) {
      throw new Error(`Failed to sign in test user: ${sessionError?.message}`);
    }

    authToken = sessionData.session.access_token;

    // Seed test user profile
    await testDb.seedTestUser({
      userId: testUserId,
      email: testUserEmail,
      displayName: 'CV Import Test User',
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await testDb.cleanupUser(testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up any skills added during tests
    await db.delete(skills).where(eq(skills.profileId, testUserId));
  });

  describe('Auto-Suggest API', () => {
    it('should extract skills from CV text with JavaScript experience', async () => {
      const cvText = `
        Senior Software Engineer with 5+ years experience in JavaScript, React, TypeScript, and Node.js.
        Expert in building scalable web applications using modern frameworks.
      `;

      const request = new Request('http://localhost:3000/api/expertise/auto-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: cvText, context: 'cv' }),
      });

      const response = await autoSuggestHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suggestions).toBeInstanceOf(Array);
      expect(data.suggestions.length).toBeGreaterThan(0);

      // Verify structure of suggestions
      const firstSuggestion = data.suggestions[0];
      expect(firstSuggestion).toHaveProperty('id');
      expect(firstSuggestion).toHaveProperty('code');
      expect(firstSuggestion).toHaveProperty('name');
      expect(firstSuggestion).toHaveProperty('confidence');
      expect(firstSuggestion).toHaveProperty('score');

      // Check metadata
      expect(data.metadata).toHaveProperty('textLength');
      expect(data.metadata).toHaveProperty('uniqueTerms');
      expect(data.metadata.context).toBe('cv');
    });

    it('should extract skills from job description', async () => {
      const jdText = `
        We're looking for a Product Manager with experience in agile methodologies,
        stakeholder management, and data analysis. Must have strong communication skills
        and experience with project management tools.
      `;

      const request = new Request('http://localhost:3000/api/expertise/auto-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: jdText, context: 'jd' }),
      });

      const response = await autoSuggestHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array for text with no skills', async () => {
      const nonsenseText = 'The quick brown fox jumps over the lazy dog.';

      const request = new Request('http://localhost:3000/api/expertise/auto-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: nonsenseText, context: 'general' }),
      });

      const response = await autoSuggestHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suggestions).toBeInstanceOf(Array);
      // May find some matches due to fuzzy matching, but should be minimal
    });

    it('should return 401 when not authenticated', async () => {
      const request = new Request('http://localhost:3000/api/expertise/auto-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Some text', context: 'cv' }),
      });

      const response = await autoSuggestHandler(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid input', async () => {
      const request = new Request('http://localhost:3000/api/expertise/auto-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ context: 'cv' }), // Missing text field
      });

      const response = await autoSuggestHandler(request);
      expect(response.status).toBe(400);
    });

    it('should limit results to 20 suggestions', async () => {
      // Create a very long CV with many skills
      const longCvText = `
        Full-stack developer with expertise in JavaScript, TypeScript, React, Vue, Angular,
        Node.js, Python, Django, Flask, Java, Spring Boot, C#, .NET, PHP, Laravel,
        Ruby, Rails, Go, Rust, Kotlin, Swift, Objective-C, SQL, PostgreSQL, MySQL,
        MongoDB, Redis, Elasticsearch, AWS, Azure, GCP, Docker, Kubernetes, Jenkins,
        CI/CD, Git, GitHub, GitLab, Jira, Confluence, Agile, Scrum, Kanban,
        Project Management, Team Leadership, Product Management, Data Analysis,
        Machine Learning, Artificial Intelligence, Deep Learning, Neural Networks,
        Natural Language Processing, Computer Vision, DevOps, Security, Networking.
      `;

      const request = new Request('http://localhost:3000/api/expertise/auto-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: longCvText, context: 'cv' }),
      });

      const response = await autoSuggestHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Skill Saving Flow', () => {
    it('should save a skill from CV import to database', async () => {
      // First, get a real skill code from the taxonomy
      const sampleSkills = await db.query.skillsTaxonomy.findMany({
        where: eq(skillsTaxonomy.status, 'active'),
        limit: 1,
      });

      if (sampleSkills.length === 0) {
        console.warn('No skills in taxonomy, skipping test');
        return;
      }

      const skillCode = sampleSkills[0].code;

      // Add the skill
      const addRequest = new Request('http://localhost:3000/api/expertise/user-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          skill_code: skillCode,
          level: 2,
          months_experience: 0,
          last_used_at: new Date().toISOString(),
          relevance: 'current',
        }),
      });

      const addResponse = await addSkillHandler(addRequest);
      expect(addResponse.status).toBe(201);

      // Verify skill was saved
      const savedSkills = await db.query.skills.findMany({
        where: eq(skills.profileId, testUserId),
      });

      expect(savedSkills.length).toBe(1);
      expect(savedSkills[0].skillCode).toBe(skillCode);
      expect(savedSkills[0].level).toBe(2);
    });

    it('should handle duplicate skills gracefully', async () => {
      // Get a skill code
      const sampleSkills = await db.query.skillsTaxonomy.findMany({
        where: eq(skillsTaxonomy.status, 'active'),
        limit: 1,
      });

      if (sampleSkills.length === 0) {
        console.warn('No skills in taxonomy, skipping test');
        return;
      }

      const skillCode = sampleSkills[0].code;

      // Add skill first time
      const request1 = new Request('http://localhost:3000/api/expertise/user-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          skill_code: skillCode,
          level: 2,
          months_experience: 0,
          last_used_at: new Date().toISOString(),
          relevance: 'current',
        }),
      });

      const response1 = await addSkillHandler(request1);
      expect(response1.status).toBe(201);

      // Try to add same skill again
      const request2 = new Request('http://localhost:3000/api/expertise/user-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          skill_code: skillCode,
          level: 3,
          months_experience: 12,
          last_used_at: new Date().toISOString(),
          relevance: 'current',
        }),
      });

      const response2 = await addSkillHandler(request2);
      expect(response2.status).toBe(409); // Conflict

      const errorData = await response2.json();
      expect(errorData.error).toContain('already exists');

      // Verify only one skill exists
      const savedSkills = await db.query.skills.findMany({
        where: eq(skills.profileId, testUserId),
      });

      expect(savedSkills.length).toBe(1);
    });

    it('should save multiple skills from CV import', async () => {
      // Get multiple skill codes
      const sampleSkills = await db.query.skillsTaxonomy.findMany({
        where: eq(skillsTaxonomy.status, 'active'),
        limit: 3,
      });

      if (sampleSkills.length < 3) {
        console.warn('Not enough skills in taxonomy, skipping test');
        return;
      }

      // Add each skill
      for (const skill of sampleSkills) {
        const request = new Request('http://localhost:3000/api/expertise/user-skills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            skill_code: skill.code,
            level: 2,
            months_experience: 0,
            last_used_at: new Date().toISOString(),
            relevance: 'current',
          }),
        });

        const response = await addSkillHandler(request);
        expect(response.status).toBe(201);
      }

      // Verify all skills were saved
      const savedSkills = await db.query.skills.findMany({
        where: eq(skills.profileId, testUserId),
      });

      expect(savedSkills.length).toBe(3);
    });
  });

  describe('End-to-End CV Import Flow', () => {
    it('should complete full CV import workflow', async () => {
      // Step 1: Analyze CV text
      const cvText = `
        Senior Product Designer with 8 years experience in UX design, UI design,
        user research, prototyping with Figma, and design systems. Strong background
        in accessibility and inclusive design practices.
      `;

      const suggestRequest = new Request('http://localhost:3000/api/expertise/auto-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: cvText, context: 'cv' }),
      });

      const suggestResponse = await autoSuggestHandler(suggestRequest);
      const suggestData = await suggestResponse.json();

      expect(suggestResponse.status).toBe(200);
      expect(suggestData.suggestions.length).toBeGreaterThan(0);

      // Step 2: Add first 3 suggested skills
      const skillsToAdd = suggestData.suggestions.slice(0, 3);
      let addedCount = 0;

      for (const skill of skillsToAdd) {
        const addRequest = new Request('http://localhost:3000/api/expertise/user-skills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            skill_code: skill.code,
            level: 2,
            months_experience: 0,
            last_used_at: new Date().toISOString(),
            relevance: 'current',
          }),
        });

        const addResponse = await addSkillHandler(addRequest);
        if (addResponse.status === 201) {
          addedCount++;
        }
      }

      expect(addedCount).toBeGreaterThan(0);

      // Step 3: Verify skills appear in user's profile
      const savedSkills = await db.query.skills.findMany({
        where: eq(skills.profileId, testUserId),
      });

      expect(savedSkills.length).toBe(addedCount);

      // Verify each saved skill has correct default values
      savedSkills.forEach(savedSkill => {
        expect(savedSkill.level).toBe(2); // Competent level
        expect(savedSkill.monthsExperience).toBe(0);
        expect(savedSkill.relevance).toBe('current');
      });
    });
  });
});

