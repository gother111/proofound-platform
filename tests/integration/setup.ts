/**
 * Integration Test Setup & Utilities
 *
 * Provides helpers for integration testing with real database operations
 */

import { db } from '@/db';
import {
  profiles,
  individualProfiles,
  matchingProfiles,
  skills,
  assignments,
  organizations,
  organizationMembers,
  contracts,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

// Test database helpers
export const testDb = {
  /**
   * Clean up test data by user ID
   */
  async cleanupUser(userId: string) {
    await db.delete(skills).where(eq(skills.profileId, userId));
    await db.delete(matchingProfiles).where(eq(matchingProfiles.profileId, userId));
    await db.delete(individualProfiles).where(eq(individualProfiles.profileId, userId));
    await db.delete(contracts).where(eq(contracts.userId, userId));
    await db.delete(organizationMembers).where(eq(organizationMembers.userId, userId));
    await db.delete(profiles).where(eq(profiles.id, userId));
  },

  /**
   * Clean up test assignment
   */
  async cleanupAssignment(assignmentId: string) {
    await db.delete(assignments).where(eq(assignments.id, assignmentId));
  },

  /**
   * Clean up test organization
   */
  async cleanupOrganization(orgId: string) {
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgId));
    await db.delete(assignments).where(eq(assignments.orgId, orgId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
  },

  /**
   * Seed a test user profile with skills
   */
  async seedTestUser(data: {
    userId: string;
    email: string;
    displayName: string;
    skills?: Array<{ skillId: string; level: number; monthsExperience: number }>;
  }) {
    // Create profile
    await db.insert(profiles).values({
      id: data.userId,
      email: data.email,
      displayName: data.displayName,
      handle: `test-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create individual profile
    await db.insert(individualProfiles).values({
      profileId: data.userId,
      bio: 'Test user bio',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create matching profile
    await db.insert(matchingProfiles).values({
      profileId: data.userId,
      valuesTags: ['impact', 'sustainability'],
      causeTags: ['climate', 'education'],
      workMode: 'remote',
      availabilityEarliest: new Date(),
      hoursMin: 20,
      hoursMax: 40,
      compMin: 80000,
      compMax: 120000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add skills if provided
    if (data.skills && data.skills.length > 0) {
      await db.insert(skills).values(
        data.skills.map((skill) => ({
          profileId: data.userId,
          skillId: skill.skillId,
          level: skill.level,
          monthsExperience: skill.monthsExperience,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }
  },

  /**
   * Seed a test organization with assignment
   */
  async seedTestOrganization(data: {
    orgId: string;
    orgName: string;
    adminUserId: string;
    assignmentData?: {
      id: string;
      role: string;
      mustHaveSkills: Array<{ id: string; level: number }>;
    };
  }) {
    // Create organization
    await db.insert(organizations).values({
      id: data.orgId,
      displayName: data.orgName,
      slug: `test-org-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add admin member
    await db.insert(organizationMembers).values({
      userId: data.adminUserId,
      orgId: data.orgId,
      role: 'admin',
      status: 'active',
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create assignment if provided
    if (data.assignmentData) {
      await db.insert(assignments).values({
        id: data.assignmentData.id,
        orgId: data.orgId,
        role: data.assignmentData.role,
        status: 'active',
        mustHaveSkills: data.assignmentData.mustHaveSkills,
        niceToHaveSkills: [],
        valuesRequired: ['impact'],
        causeTags: ['climate'],
        locationMode: 'remote',
        startEarliest: new Date(),
        startLatest: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        hoursMin: 30,
        hoursMax: 40,
        compMin: 90000,
        compMax: 130000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },
};

// Supabase test client (for auth testing)
export function createTestSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables for testing');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Mock request helper
export function createMockRequest(options: {
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}) {
  const headers = new Headers(options.headers || {});

  if (options.cookies) {
    const cookieString = Object.entries(options.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headers.set('Cookie', cookieString);
  }

  const init: RequestInit = {
    method: options.method,
    headers,
  };

  if (options.body) {
    init.body = JSON.stringify(options.body);
    headers.set('Content-Type', 'application/json');
  }

  return new Request(options.url, init);
}

// Test data generators
export const generators = {
  userId: () => `test-user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  orgId: () => `test-org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  assignmentId: () => `test-assignment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  email: () => `test-${Date.now()}@example.com`,
};
