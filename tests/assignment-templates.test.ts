import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure Vite SSR helper exists before importing any app modules
(globalThis as any).__vite_ssr_exportName__ =
  (globalThis as any).__vite_ssr_exportName__ || ((_: string, value: any) => value);

// Mock next/server to avoid Next runtime in Vitest
vi.mock('next/server', () => {
  class MockNextResponse {
    body: any;
    status: number;
    constructor(body: any, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }
    static json(body: any, init?: { status?: number }) {
      return new MockNextResponse(body, init);
    }
    async json() {
      return this.body;
    }
  }

  class MockNextRequest {
    url: string;
    method: string;
    private _body?: string;
    constructor(url: string, init?: { method?: string; body?: string }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this._body = init?.body;
    }
    async json() {
      return this._body ? JSON.parse(this._body) : {};
    }
    get nextUrl() {
      return new URL(this.url);
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'user-1' })),
}));

let selectCall = 0;
const selectMock = vi.fn(() => {
  const callIndex = selectCall++;
  if (callIndex === 0) {
    return {
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [{ id: 'org-1' }]),
        })),
      })),
    };
  }

  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() =>
          Promise.resolve([
            {
              id: 'template-1',
              name: 'Template 1',
              roleFamily: 'software_engineering',
              summary: null,
              description: null,
              appliesToSteps: [],
              presetPayload: {},
              isGlobal: false,
              status: 'active',
              createdAt: new Date(),
            },
          ])
        ),
      })),
    })),
  };
});

const insertMock = vi.fn(() => ({
  values: vi.fn(() => ({
    returning: vi.fn(() =>
      Promise.resolve([
        {
          id: 'new-template',
          name: 'Template 1',
          roleFamily: 'software_engineering',
          summary: null,
          description: null,
          appliesToSteps: [],
          presetPayload: {},
          isGlobal: false,
          status: 'active',
          createdAt: new Date(),
        },
      ])
    ),
  })),
}));

const queryMock = {
  organizationMembers: {
    findFirst: vi.fn(),
  },
};

vi.mock('@/db', () => ({
  db: {
    select: selectMock,
    insert: insertMock,
    query: queryMock,
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('mapTemplateToAssignmentForm', () => {
  it('imports prefill module (smoke)', async () => {
    const mod = await import('../src/lib/templates/prefill.ts');
    expect(mod).toBeTruthy();
  });
});

describe('assignment template API routes', () => {
  beforeEach(() => {
    selectCall = 0;
    vi.clearAllMocks();
  });

  it('imports route module (smoke)', async () => {
    const mod = await import('../src/app/api/assignment-templates/route.ts');
    expect(mod).toBeTruthy();
  });
});

