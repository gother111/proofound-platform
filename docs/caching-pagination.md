> Doc Class: `active`
> Last Verified: `2026-05-19`

# Caching and Pagination Implementation

## Overview

This document describes the caching and pagination strategies implemented to optimize performance and reduce database load in the Proofound application.

## Caching Strategy

### Cache Infrastructure

**Technology**: Vercel KV (Redis-compatible)
**Fallback**: In-memory cache for development

### Cache Keys and TTLs

| Data Type         | Prefix              | TTL        | Reason                                 |
| ----------------- | ------------------- | ---------- | -------------------------------------- |
| Taxonomy L1/L2/L3 | `taxonomy:`         | 24 hours   | Rarely changes, heavily accessed       |
| User Profile      | `profile:`          | 5 minutes  | Changes occasionally, frequently read  |
| Matching Profile  | `profile:matching:` | 5 minutes  | Used in matching engine                |
| User Skills       | `skills:`           | 10 minutes | Used in matching, updated infrequently |
| Organization      | `org:`              | 15 minutes | Organization data                      |
| Assignment        | `assignment:`       | 10 minutes | Assignment data                        |
| Match Results     | `match:`            | 2 minutes  | Real-time matching data                |

### Cached Endpoints

#### 1. Taxonomy API (`/api/expertise/taxonomy`)

**What's Cached:**

- L1 domains (full list)
- L2 categories (by L1 code)

**Cache Keys:**

- `taxonomy:l1` - All L1 domains
- `taxonomy:l2:{l1Code}` - L2 categories for specific L1

**Invalidation:** Manual (taxonomy rarely changes)

**Example:**

```typescript
// First request: Hits database
GET /api/expertise/taxonomy
// Subsequent requests: Hits cache (24h)

// Specific L1:
GET /api/expertise/taxonomy?l1=U
// Cached separately for each L1
```

#### 2. Matching Engine (`/api/core/matching/profile`)

**What's Cached:**

- User matching profile
- User skills list

**Cache Keys:**

- `profile:matching:{userId}`
- `skills:{userId}`

**Invalidation:**

- Automatic after TTL
- Manual on profile/skill updates

**Benefits:**

- Reduces database queries from 2+ per match to 0 (cached)
- Significantly faster matching for repeated requests
- TTL ensures relatively fresh data

#### 3. Future Caching Targets

The following endpoints would benefit from caching:

**User Profiles API:**

```typescript
// Cache full profile data
cacheProfile(userId, profileData);

// Invalidate on update
invalidateProfile(userId);
```

**Organization API:**

```typescript
// Cache organization details
cacheOrganization(orgId, orgData);
```

**Assignments API:**

```typescript
// Cache active assignments list
cacheKey = `assignments:active:${orgId}`;
```

### Cache Invalidation

**Automatic Invalidation:**

- All caches have TTL-based expiration
- Memory cache cleans up expired entries on read

**Manual Invalidation:**
When data is updated, invalidate relevant caches:

```typescript
// After profile update
await invalidateProfile(userId);

// After organization update
await invalidateOrganization(orgId);

// After assignment update
await invalidateMatchResults(assignmentId);

// Pattern-based invalidation
await deleteCachedPattern('profile:*'); // All profiles
```

### Cache Monitoring

**Get cache statistics:**

```typescript
const stats = await getCacheStats();
// Returns: { type: 'redis' | 'memory', size?: number, keys?: number }
```

**Development Mode:**

- Uses in-memory Map for caching
- No Redis connection required
- Automatically clears on server restart

**Production Mode:**

- Uses Vercel KV (Redis)
- Persistent across deployments
- Automatic scaling

## Pagination Strategy

### Pagination Pattern

All list endpoints use **offset-based pagination** with the following pattern:

**Query Parameters:**

- `limit`: Number of items to return (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response Format:**

```json
{
  "items": [...],
  "hasMore": true,
  "nextOffset": 20
}
```

### Paginated Endpoints

#### 1. Conversations API (`/api/conversations`)

**Default Limit:** 20
**Max Limit:** 100

**Usage:**

```typescript
// First page
GET /api/conversations?limit=20&offset=0

// Second page
GET /api/conversations?limit=20&offset=20

// Response
{
  "conversations": [...],
  "hasMore": true,
  "nextOffset": 20
}
```

**Optimizations:**

- Fetches `limit + 1` items to check if more exist
- Avoids expensive `COUNT(*)` queries
- Returns only requested items

#### 2. Conversation Messages API (`/api/conversations/[conversationId]/messages`)

**Default Limit:** 50
**Max Limit:** 100

**Usage:**

```typescript
// Get messages for a conversation
GET /api/conversations/{conversationId}/messages?limit=50

// Response
{
  "messages": [...],
  "hasMore": true,
  "conversationStage": "masked"
}
```

**Features:**

- Ordered by `sentAt` with newest messages returned first
- Auto-marks messages as read
- Supports conversation-specific filtering
- Supports cursor pagination with `before={messageId}`

#### 3. Assignments API (`/api/assignments`)

**Default Limit:** 20
**Max Limit:** 100

**Additional Filters:**

- `status`: Filter by status (draft, active, paused, closed)

**Usage:**

```typescript
// Get active assignments
GET /api/assignments?status=active&limit=20&offset=0

// Response
{
  "items": [...],
  "hasMore": false,
  "nextOffset": null
}
```

**Optimizations:**

- Organization-scoped queries (only user's org)
- Status filtering support
- Ordered by creation date (newest first)

### Pagination Best Practices

**Frontend Implementation:**

```typescript
// React example with infinite scroll
const [conversations, setConversations] = useState([]);
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const response = await fetch(`/api/conversations?limit=20&offset=${offset}`);
  const data = await response.json();

  setConversations((prev) => [...prev, ...data.conversations]);
  setHasMore(data.hasMore);
  setOffset(data.nextOffset || 0);
};
```

**Cursor-Based Pagination (Future Enhancement):**

For real-time data like messages, cursor-based pagination is more reliable:

```typescript
// Instead of offset
GET /api/conversations/{conversationId}/messages?before={lastMessageId}&limit=50

// Benefits:
// - No missed messages with concurrent updates
// - More efficient for large datasets
// - Better for real-time data
```

### Performance Considerations

**Offset Pagination Limits:**

- Large offsets (e.g., offset=10000) are slow
- Database still scans all skipped rows
- Not ideal for deep pagination

**Recommendations:**

1. **Limit max offset** to prevent performance issues
2. **Use cursor pagination** for real-time data (messages, notifications)
3. **Add indexes** on pagination sort columns (`createdAt`, `lastMessageAt`)
4. **Cache first page** for frequently accessed lists

**Example Index:**

```sql
-- For conversations pagination
CREATE INDEX idx_conversations_last_message
ON conversations(participant_one_id, last_message_at DESC);

CREATE INDEX idx_conversations_last_message_p2
ON conversations(participant_two_id, last_message_at DESC);
```

## Environment Setup

### Required Environment Variables

```bash
# Vercel KV (automatically set by Vercel)
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your-token
KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
```

### Local Development

No configuration needed! The app automatically falls back to in-memory caching.

To test with real Redis locally:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Set env vars
KV_REST_API_URL=redis://localhost:6379
KV_REST_API_TOKEN=your-token
```

## Monitoring

### Cache Backend Health

Monitor cache backend selection and key counts where the runtime can expose them:

```typescript
const stats = await getCacheStats();
console.log('Cache backend:', stats.type);
console.log('Known key count:', stats.keys ?? 'managed by provider');
```

### Pagination Usage

Track pagination patterns:

```typescript
// Log pagination requests
log.info('pagination.request', {
  endpoint: '/api/conversations',
  limit,
  offset,
  userId: user.id,
});
```

## Migration Guide

### Adding Cache to New Endpoint

```typescript
import { getOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const user = await requireAuth();

  // Define cache key
  const cacheKey = `${CACHE_KEYS.PROFILE}${user.id}`;

  // Use getOrSet pattern
  const profile = await getOrSet(
    cacheKey,
    async () => {
      // Fetch from database
      return await db.query.profiles.findFirst({
        where: eq(profiles.id, user.id),
      });
    },
    CACHE_TTL.PROFILE
  );

  return NextResponse.json({ profile });
}
```

### Adding Pagination to Existing Endpoint

```typescript
export async function GET(request: NextRequest) {
  // 1. Add pagination parameters
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // 2. Fetch limit + 1 items
  const items = await db.query.items.findMany({
    limit: limit + 1,
    offset: offset,
  });

  // 3. Check if there are more
  const hasMore = items.length > limit;
  const itemsToReturn = hasMore ? items.slice(0, limit) : items;

  // 4. Return with pagination metadata
  return NextResponse.json({
    items: itemsToReturn,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
  });
}
```

## Troubleshooting

### Cache Not Working

1. **Check environment variables:**

   ```bash
   echo $KV_REST_API_URL
   echo $KV_REST_API_TOKEN
   ```

2. **Check cache stats:**

   ```typescript
   const stats = await getCacheStats();
   console.log('Cache type:', stats.type);
   ```

3. **Verify cache is being set:**
   ```typescript
   await setCached('test-key', { foo: 'bar' }, 60);
   const value = await getCached('test-key');
   console.log('Test value:', value);
   ```

### Pagination Issues

1. **Missing items between pages:**
   - Items added/removed during pagination
   - Solution: Use cursor-based pagination for real-time data

2. **Slow pagination on large offsets:**
   - Database scans all skipped rows
   - Solution: Limit max offset or use cursor pagination

3. **Incorrect hasMore value:**
   - Ensure fetching `limit + 1` items
   - Check slice logic: `items.slice(0, limit)`

## Future Enhancements

1. **Cursor-Based Pagination**
   - Implement for messages and real-time data
   - More reliable for concurrent updates

2. **Cache Warming**
   - Pre-populate cache on deployment
   - Warm frequently accessed data

3. **Cache Tags**
   - Group related cache keys
   - Bulk invalidation by tag

4. **Cache Analytics**
   - Track hit rates per endpoint
   - Identify cache performance bottlenecks

5. **Distributed Cache**
   - Use Redis cluster for high availability
   - Implement cache replication

## Resources

- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [Pagination Best Practices](https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/)
