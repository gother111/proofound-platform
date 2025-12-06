import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/interviews/[id]/feedback/route';
import { db } from '@/db';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn(() => ({
  returning: mockInsertReturning,
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      interviews: { findFirst: vi.fn() },
      matches: { findFirst: vi.fn() },
      assignments: { findFirst: vi.fn() },
      organizationMembers: { findFirst: vi.fn() },
      interviewFeedback: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
  },
}));

const baseInterview = {
  id: 'interview-1',
  matchId: 'match-1',
  status: 'completed',
  decision: null,
};

const baseMatch = {
  id: 'match-1',
  profileId: 'candidate-1',
  assignmentId: 'assignment-1',
};

const baseAssignment = {
  id: 'assignment-1',
  orgId: 'org-1',
};

const orgMembership = { id: 'org-member-1', status: 'active', orgId: 'org-1', userId: 'org-user' };

const sampleFeedback = {
  id: 'feedback-1',
  interviewId: 'interview-1',
  authorUserId: 'org-user',
  authorRole: 'org',
  fairnessRating: 4,
  clarityRating: 4,
  experienceRating: 5,
  comments: 'Helpful conversation',
  createdAt: new Date().toISOString(),
};

function setUser(userId: string | null) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: null,
  });
}

describe('Interview feedback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUser('org-user');
    (db.query.interviews.findFirst as any).mockResolvedValue(baseInterview);
    (db.query.matches.findFirst as any).mockResolvedValue(baseMatch);
    (db.query.assignments.findFirst as any).mockResolvedValue(baseAssignment);
    (db.query.organizationMembers.findFirst as any).mockResolvedValue(orgMembership);
    (db.query.interviewFeedback.findFirst as any).mockResolvedValue(null);
    (db.query.interviewFeedback.findMany as any).mockResolvedValue([]);
    mockInsertReturning.mockResolvedValue([sampleFeedback]);
  });

  it('rejects unauthenticated users', async () => {
    setUser(null);
    const req = new NextRequest('http://localhost/api/interviews/interview-1/feedback', {
      method: 'POST',
      body: JSON.stringify({
        fairnessRating: 4,
        clarityRating: 4,
        experienceRating: 4,
        comments: 'test',
      }),
    });

    const res = await POST(req, { params: { id: 'interview-1' } });
    expect(res.status).toBe(401);
  });

  it('prevents duplicate submissions per role', async () => {
    (db.query.interviewFeedback.findFirst as any).mockResolvedValue(sampleFeedback);

    const req = new NextRequest('http://localhost/api/interviews/interview-1/feedback', {
      method: 'POST',
      body: JSON.stringify({
        fairnessRating: 4,
        clarityRating: 3,
        experienceRating: 5,
        comments: 'Already sent',
      }),
    });

    const res = await POST(req, { params: { id: 'interview-1' } });
    expect(res.status).toBe(409);
  });

  it('creates feedback for authorized org member', async () => {
    const req = new NextRequest('http://localhost/api/interviews/interview-1/feedback', {
      method: 'POST',
      body: JSON.stringify({
        fairnessRating: 5,
        clarityRating: 5,
        experienceRating: 4,
        comments: 'Great process',
      }),
    });

    const res = await POST(req, { params: { id: 'interview-1' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.feedback).toBeDefined();
    expect(mockInsertReturning).toHaveBeenCalled();
  });

  it('validates rating range', async () => {
    const req = new NextRequest('http://localhost/api/interviews/interview-1/feedback', {
      method: 'POST',
      body: JSON.stringify({
        fairnessRating: 6,
        clarityRating: 2,
        experienceRating: 4,
        comments: 'Invalid rating',
      }),
    });

    const res = await POST(req, { params: { id: 'interview-1' } });
    expect(res.status).toBe(400);
  });

  it('hides other-side feedback until a decision is recorded', async () => {
    (db.query.interviewFeedback.findMany as any).mockResolvedValue([
      { ...sampleFeedback, authorRole: 'candidate', authorUserId: 'candidate-1' },
      { ...sampleFeedback, authorRole: 'org', authorUserId: 'org-user' },
    ]);
    // Keep interview decision null to simulate hidden visibility
    (db.query.interviews.findFirst as any).mockResolvedValue({
      ...baseInterview,
      decision: null,
    });
    setUser('candidate-1');

    const req = new NextRequest('http://localhost/api/interviews/interview-1/feedback');
    const res = await GET(req, { params: { id: 'interview-1' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.feedback.mine).toBeDefined();
    expect(body.feedback.theirs).toBeNull();
    expect(body.feedback.decisionRecorded).toBe(false);
  });

  it('shows both sides once decision exists', async () => {
    (db.query.interviews.findFirst as any).mockResolvedValue({
      ...baseInterview,
      decision: 'accept',
    });
    (db.query.interviewFeedback.findMany as any).mockResolvedValue([
      { ...sampleFeedback, authorRole: 'candidate', authorUserId: 'candidate-1' },
      { ...sampleFeedback, authorRole: 'org', authorUserId: 'org-user' },
    ]);
    setUser('candidate-1');

    const req = new NextRequest('http://localhost/api/interviews/interview-1/feedback');
    const res = await GET(req, { params: { id: 'interview-1' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.feedback.mine).toBeDefined();
    expect(body.feedback.theirs).toBeDefined();
    expect(body.feedback.decisionRecorded).toBe(true);
  });
});
