import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/assignments/route';
import { NextRequest } from 'next/server';
import { db } from '@/db';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizationMembers: {
        findFirst: vi.fn(),
      },
      assignments: {
        findFirst: vi.fn(),
      },
      matchingProfiles: {
        findMany: vi.fn(),
      },
      skills: {
        findMany: vi.fn(),
      },
      organizations: {
        findFirst: vi.fn(),
      },
      matches: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          $dynamic: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                  offset: vi.fn(() => Promise.resolve([])),
                })),
              })),
            })),
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() =>
          Promise.resolve([{ id: 'new-assignment-id', role: 'Developer', status: 'active' }])
        ),
      })),
    })),
  },
}));

vi.mock('@/lib/log', () => ({
  logContext: {
    run: (_ctx: any, fn: any) => fn(),
  },
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAssignmentPublished: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyAssignmentPublished: vi.fn(),
}));

vi.mock('@/lib/surveys/sus-triggers', () => ({
  triggerFirstAssignmentSurvey: vi.fn(),
}));

describe('Assignment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should create an assignment successfully', async () => {
      // Mock org membership
      (db.query.organizationMembers.findFirst as any).mockResolvedValue({ orgId: 'test-org-id' });

      const body = {
        role: 'Software Engineer',
        description: 'Build cool stuff',
        status: 'active',
        locationMode: 'remote',
        compMin: 100000,
        compMax: 150000,
        mustHaveSkills: [],
      };

      const req = new NextRequest('http://localhost/api/assignments', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.assignment).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
    });

    it('should accept skill metadata fields and persist them in assignment payload', async () => {
      (db.query.organizationMembers.findFirst as any).mockResolvedValue({ orgId: 'test-org-id' });

      const valuesMock = vi.fn(() => ({
        returning: vi.fn(() =>
          Promise.resolve([{ id: 'new-assignment-id', role: 'Developer', status: 'draft' }])
        ),
      }));
      (db.insert as any).mockReturnValue({ values: valuesMock });

      const body = {
        role: 'Senior Engineer',
        status: 'draft',
        mustHaveSkills: [
          {
            id: '03.01.01.001',
            level: 4,
            label: 'TypeScript',
            catId: 3,
            subcatId: 1,
            l3Id: 1,
            l1Label: 'Tools & Technologies',
            l2Label: 'Programming',
            l3Label: 'Typed Languages',
            linkedToBV: true,
            linkedToTO: false,
          },
        ],
      };

      const req = new NextRequest('http://localhost/api/assignments', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'test-org-id',
          mustHaveSkills: [
            expect.objectContaining({
              id: '03.01.01.001',
              level: 4,
              label: 'TypeScript',
              catId: 3,
              subcatId: 1,
              l3Id: 1,
              l1Label: 'Tools & Technologies',
              l2Label: 'Programming',
              l3Label: 'Typed Languages',
              linkedToBV: true,
              linkedToTO: false,
            }),
          ],
        })
      );
    });

    it('should return 403 if user has no org', async () => {
      // Mock no org membership
      (db.query.organizationMembers.findFirst as any).mockResolvedValue(null);

      const body = { role: 'Software Engineer' };
      const req = new NextRequest('http://localhost/api/assignments', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const res = await POST(req);

      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid input', async () => {
      // Mock org membership
      (db.query.organizationMembers.findFirst as any).mockResolvedValue({ orgId: 'test-org-id' });

      const body = { description: 'Missing role' }; // Missing required 'role'
      const req = new NextRequest('http://localhost/api/assignments', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('GET', () => {
    it('should fetch assignments', async () => {
      // Mock org membership
      (db.query.organizationMembers.findFirst as any).mockResolvedValue({ orgId: 'test-org-id' });

      // Mock db select chain
      const mockAssignments = [{ id: '1', role: 'Dev' }];
      const offsetMock = vi.fn().mockResolvedValue(mockAssignments);
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
      const dynamicMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = vi.fn().mockReturnValue({ $dynamic: dynamicMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      const selectMock = vi.fn().mockReturnValue({ from: fromMock });

      (db.select as any).mockImplementation(selectMock);

      const req = new NextRequest('http://localhost/api/assignments');
      const res = await GET(req);
      const data = await res.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].role).toBe('Dev');
    });
  });
});
