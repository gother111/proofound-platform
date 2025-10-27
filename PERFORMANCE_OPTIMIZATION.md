# Performance Optimization Guide

## 📊 Current Implementation Status

Your Proofound MVP already includes many performance optimizations. This guide documents what's in place and suggests further improvements.

---

## ✅ Built-In Optimizations

### 1. Next.js 15 Automatic Optimizations

**Already Active**:
- ✅ Automatic code splitting
- ✅ Route prefetching
- ✅ Static asset optimization
- ✅ Gzip/Brotli compression
- ✅ Tree shaking
- ✅ Minification
- ✅ Image optimization (Next.js Image component)

### 2. Font Optimization

**Current Implementation** (`app/layout.tsx`):
```typescript
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",  // Prevents FOIT (Flash of Invisible Text)
});

const crimsonPro = Crimson_Pro({ 
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  display: "swap",
});
```

**Benefits**:
- ✅ Fonts loaded via next/font/google
- ✅ Self-hosted fonts (no external requests)
- ✅ Automatic font subsetting
- ✅ Display swap prevents layout shift

---

## 🚀 Recommended Optimizations

### 1. Image Optimization

**Current Status**: Using Next.js Image component in some places

**Recommendation**: Ensure ALL images use `next/image`

```typescript
// ❌ Don't do this
<img src="/avatar.png" alt="Avatar" />

// ✅ Do this instead
import Image from 'next/image';
<Image 
  src="/avatar.png" 
  alt="Avatar" 
  width={100} 
  height={100}
  priority={false}
/>
```

**Implementation Checklist**:
- [ ] Update all `<img>` tags to use `<Image>`
- [ ] Add width/height to prevent layout shift
- [ ] Use `priority` prop for above-fold images
- [ ] Use `loading="lazy"` for below-fold images (default)
- [ ] Optimize image formats (WebP, AVIF)

---

### 2. Component Code Splitting

**Use dynamic imports for heavy components**:

```typescript
// Heavy components that aren't needed immediately
import dynamic from 'next/dynamic';

// Lazy load with loading state
const ExpertiseAtlas = dynamic(
  () => import('@/components/ExpertiseAtlas'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // If component has window/document dependencies
  }
);

// Lazy load dialogs (only load when needed)
const AddGoalDialog = dynamic(
  () => import('@/components/dialogs/AddGoalDialog')
);
```

**Components to Consider for Lazy Loading**:
- [ ] ExpertiseAtlas (complex visualization)
- [ ] ZenHub (not immediately needed)
- [ ] Chart components (recharts)
- [ ] Rich text editors
- [ ] File upload components
- [ ] Video players
- [ ] Complex animations

---

### 3. Database Query Optimization

**Current Implementation**: Using Supabase with RLS

**Recommendations**:

#### A. Add Indexes
```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_matches_profile_status 
ON matches(profile_id, status);

CREATE INDEX idx_messages_match_created 
ON messages(match_id, created_at DESC);

CREATE INDEX idx_proofs_profile_status 
ON proofs(profile_id, verification_status);

CREATE INDEX idx_expertise_profile_order 
ON expertise_atlas(profile_id, rank_order);
```

#### B. Optimize Queries
```typescript
// ❌ Fetch all data, filter client-side
const { data: all } = await supabase
  .from('matches')
  .select('*');
const filtered = all.filter(m => m.status === 'accepted');

// ✅ Filter on database
const { data } = await supabase
  .from('matches')
  .select('*')
  .eq('status', 'accepted')
  .limit(10);
```

#### C. Use Specific Selects
```typescript
// ❌ Fetch all columns
const { data } = await supabase
  .from('profiles')
  .select('*');

// ✅ Select only needed fields
const { data } = await supabase
  .from('profiles')
  .select('id, full_name, avatar_url, tagline');
```

---

### 4. Caching Strategy

**Implement SWR (Stale-While-Revalidate)**:

```typescript
import useSWR from 'swr';

// Fetcher function
const fetcher = async (key: string) => {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .eq('profile_id', key);
  return data;
};

// In component
function MatchesList({ userId }: { userId: string }) {
  const { data, error, isLoading } = useSWR(
    userId,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  return <MatchesDisplay matches={data} />;
}
```

**Install SWR**:
```bash
npm install swr
```

---

### 5. Bundle Size Optimization

**Analyze Current Bundle**:
```bash
# Add to package.json scripts
"analyze": "ANALYZE=true next build"

# Run analysis
npm run analyze
```

**Install Bundle Analyzer**:
```bash
npm install --save-dev @next/bundle-analyzer
```

**Configure** (`next.config.ts`):
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

**Common Bundle Bloat Sources**:
- [ ] Moment.js (use date-fns or day.js instead)
- [ ] Lodash (use lodash-es or individual imports)
- [ ] Large icon libraries (tree-shake lucide-react)
- [ ] Unused shadcn components
- [ ] Development-only code in production

---

### 6. Animation Performance

**Current**: Using framer-motion and GSAP

**Optimization Tips**:

#### A. Use CSS Transforms
```typescript
// ✅ GPU-accelerated
<motion.div
  animate={{ x: 100, opacity: 1 }}
  transition={{ duration: 0.3 }}
/>

// ❌ Causes reflow
<motion.div
  animate={{ left: '100px' }}
/>
```

#### B. Reduce Motion for Users
```typescript
// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

<motion.div
  animate={prefersReducedMotion ? {} : { x: 100 }}
/>
```

#### C. Lazy Load Animations
```typescript
// Only load GSAP when needed
const gsap = await import('gsap');
gsap.to('.element', { x: 100 });
```

---

### 7. Real-Time Optimization

**Current**: Using Supabase real-time subscriptions

**Recommendations**:

#### A. Limit Subscription Scope
```typescript
// ❌ Subscribe to all messages
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, callback)
  .subscribe();

// ✅ Subscribe only to user's messages
supabase
  .channel(`messages:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, callback)
  .subscribe();
```

#### B. Debounce Updates
```typescript
import { debounce } from 'lodash-es';

const handleUpdate = debounce((payload) => {
  // Update UI
}, 500);

supabase
  .channel('updates')
  .on('postgres_changes', {}, handleUpdate)
  .subscribe();
```

#### C. Unsubscribe on Unmount
```typescript
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', {}, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

### 8. Loading States & Suspense

**Implement React Suspense boundaries**:

```typescript
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

// Async server component
async function DashboardContent() {
  const data = await fetchDashboardData();
  return <Dashboard data={data} />;
}
```

**Create skeleton loaders for all major views**:
- [ ] Dashboard skeleton
- [ ] Profile skeleton
- [ ] Matches list skeleton
- [ ] Messages skeleton
- [ ] Expertise Atlas skeleton

---

### 9. Prefetching & Preloading

**Prefetch critical pages**:

```typescript
import Link from 'next/link';

// Automatically prefetches on hover/viewport
<Link href="/matches" prefetch>
  View Matches
</Link>

// Prefetch data ahead of navigation
import { useRouter } from 'next/navigation';

const router = useRouter();
router.prefetch('/profile');
```

**Preload critical resources**:
```typescript
// In <head>
<link rel="preload" href="/fonts/inter.woff2" as="font" crossOrigin="anonymous" />
<link rel="preconnect" href="https://your-supabase-url.supabase.co" />
```

---

### 10. Error Boundaries

**Create error boundary components**:

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Use in layout**:
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
</ErrorBoundary>
```

---

## 📊 Performance Monitoring

### 1. Add Web Vitals Reporting

**Create** `/app/_analytics.tsx`:
```typescript
'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to analytics
    console.log(metric);
    
    // Send to analytics service
    if (typeof window !== 'undefined') {
      // Your analytics service
      window.gtag?.('event', metric.name, {
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value
        ),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
      });
    }
  });

  return null;
}
```

**Add to root layout**:
```typescript
import { WebVitals } from './_analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
```

---

### 2. Lighthouse CI

**Add to CI/CD pipeline**:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm install -g @lhci/cli
      - run: lhci autorun
```

**Configure** (`lighthouserc.js`):
```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
  },
};
```

---

## 🎯 Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Contentful Paint | < 1.5s | ___ | ⏳ |
| Largest Contentful Paint | < 2.5s | ___ | ⏳ |
| Time to Interactive | < 3s | ___ | ⏳ |
| Total Blocking Time | < 300ms | ___ | ⏳ |
| Cumulative Layout Shift | < 0.1 | ___ | ⏳ |
| First Input Delay | < 100ms | ___ | ⏳ |
| Lighthouse Performance Score | > 90 | ___ | ⏳ |
| JavaScript Bundle (gzipped) | < 300KB | ___ | ⏳ |
| CSS Bundle (gzipped) | < 50KB | ___ | ⏳ |

---

## 🔧 Quick Wins Checklist

**Immediate improvements you can make**:

- [ ] Convert all `<img>` to `<Image>`
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Lazy load ZenHub and ExpertiseAtlas
- [ ] Add database indexes (see SQL above)
- [ ] Implement error boundaries
- [ ] Add skeleton loaders
- [ ] Enable bundle analyzer
- [ ] Set up Web Vitals reporting
- [ ] Add `preconnect` for Supabase
- [ ] Implement SWR for data fetching

---

## 📈 Monitoring Tools

**Free Tools**:
1. **Chrome DevTools** - Lighthouse, Performance, Network
2. **PageSpeed Insights** - https://pagespeed.web.dev/
3. **WebPageTest** - https://www.webpagetest.org/
4. **Vercel Analytics** - Built into Vercel deployments

**Paid Tools** (optional):
1. **Sentry** - Error tracking + performance
2. **LogRocket** - Session replay + performance
3. **New Relic** - Full stack monitoring

---

## 🚀 Continuous Optimization

**Regular checks** (monthly):
1. Run Lighthouse audit
2. Analyze bundle size
3. Check database query performance
4. Review Web Vitals
5. Test on slow 3G connection
6. Review error logs
7. Check Core Web Vitals in Search Console

---

**Performance is a feature! 🚀**

_Last updated: [Date]_

