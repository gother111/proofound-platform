# Production Readiness Checklist

## Overview

This document provides a comprehensive checklist for deploying Proofound to production. Review and complete all items before launching.

---

## ✅ Phase 1: Testing & Quality Assurance

### E2E Testing
- [x] **Authentication tests** - Signup, login, password reset, email verification
- [x] **Onboarding tests** - Individual and organization onboarding flows
- [x] **Core workflow tests** - Profile, assignments, matching, interviews, messaging
- [x] **Test data utilities** - Test user generation, data factories, cleanup helpers
- [ ] **Run E2E tests** - `npm run test:e2e` and verify all pass
- [ ] **Review test coverage** - Check critical paths are covered

**Command:**
```bash
npm run test:e2e
```

### Manual QA Testing
- [ ] **Authentication flows**
  - [ ] Sign up as individual user
  - [ ] Sign up as organization user
  - [ ] Login with valid credentials
  - [ ] Login with invalid credentials (verify error)
  - [ ] Password reset flow
  - [ ] Email verification (if implemented)

- [ ] **Onboarding**
  - [ ] Complete individual onboarding
  - [ ] Complete organization onboarding
  - [ ] Skip optional onboarding steps
  - [ ] Navigate between onboarding steps

- [ ] **Profile Management**
  - [ ] View profile
  - [ ] Edit basic information
  - [ ] Add skills
  - [ ] Upload avatar
  - [ ] Add experience/education
  - [ ] Update matching preferences

- [ ] **Matching & Assignments**
  - [ ] Create assignment (organization)
  - [ ] View matching results (individual)
  - [ ] Express interest in assignment
  - [ ] Review match explanations
  - [ ] Adjust matching weights

- [ ] **Messaging**
  - [ ] Send message
  - [ ] Receive message
  - [ ] Read/unread status updates
  - [ ] Conversation list updates

- [ ] **Interviews**
  - [ ] Schedule interview
  - [ ] View interview details
  - [ ] Join interview link

### Unit Tests
- [ ] **Run unit tests** - `npm test`
- [ ] **Check coverage** - Review critical path coverage
- [ ] **Fix failing tests** - All tests should pass

**Command:**
```bash
npm test
npm run test -- --coverage
```

### Privacy & RLS Tests
- [ ] **Run RLS tests** - `npm run test:privacy`
- [ ] **Verify data isolation** - Users can only access their own data
- [ ] **Test organization access** - Members can only access their org data

**Command:**
```bash
npm run test:privacy
```

---

## ✅ Phase 2: Error Monitoring & Debugging

### Sentry Configuration
- [x] **Sentry installed** - `@sentry/nextjs` package
- [x] **Client config** - `sentry.client.config.ts`
- [x] **Server config** - `sentry.server.config.ts`
- [x] **Edge config** - `sentry.edge.config.ts`
- [x] **Error boundaries** - Critical components wrapped
- [ ] **Set SENTRY_DSN** - Add to Vercel environment variables
- [ ] **Test error capture** - Trigger test error and verify in Sentry
- [ ] **Configure alerts** - Set up Sentry alerts for critical errors

**Environment Variables:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=proofound
SENTRY_AUTH_TOKEN=... # For source map uploads
```

**Verify:**
```typescript
// Add to any page temporarily
throw new Error('Test Sentry integration');
```

### Error Boundaries
- [x] **Root layout** - Global error boundary
- [x] **Form components** - FormErrorBoundary
- [x] **Data components** - DataErrorBoundary
- [x] **Critical flows** - Profile, matching, messaging wrapped
- [ ] **Test error recovery** - Verify error boundaries catch and display errors

---

## ✅ Phase 3: Performance & Caching

### Caching Infrastructure
- [x] **Vercel KV setup** - Redis-compatible caching
- [x] **Cache utilities** - `src/lib/cache.ts`
- [x] **Taxonomy caching** - L1/L2 cached for 24 hours
- [x] **Profile caching** - User profiles and skills cached
- [x] **Matching caching** - Matching profiles and skills cached
- [ ] **Add KV to Vercel** - Enable Vercel KV in dashboard
- [ ] **Test cache hit rates** - Monitor cache effectiveness

**Vercel Setup:**
1. Go to Vercel dashboard → Storage → Create Database → KV
2. Connect to project (environment variables auto-added)
3. Deploy to populate KV_* environment variables

**Cached Endpoints:**
- `/api/expertise/taxonomy` - L1/L2 taxonomy (24h TTL)
- `/api/core/matching/profile` - User profile & skills (5-10min TTL)

### Pagination
- [x] **Conversations** - 20 items/page, max 100
- [x] **Messages** - 50 items/page
- [x] **Assignments** - 20 items/page, max 100, status filtering
- [ ] **Test pagination** - Load multiple pages, verify hasMore
- [ ] **Test large datasets** - Verify performance with 100+ items

### Database Indexes
- [ ] **Review indexes** - Check all pagination columns indexed
- [ ] **Add missing indexes** - For frequently queried columns
- [ ] **Analyze slow queries** - Use database query analyzer

**Recommended Indexes:**
```sql
-- Conversations pagination
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_p1
ON conversations(participant_one_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_p2
ON conversations(participant_two_id, last_message_at DESC);

-- Messages pagination
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent
ON messages(conversation_id, sent_at ASC);

-- Assignments by organization
CREATE INDEX IF NOT EXISTS idx_assignments_org_created
ON assignments(org_id, created_at DESC);
```

---

## ✅ Phase 4: Logging & Monitoring

### Structured Logging
- [x] **Enhanced logger** - AsyncLocalStorage, context management
- [x] **Request correlation** - Unique request IDs
- [x] **PII protection** - Auto-removes email, name, displayName
- [x] **Middleware logging** - All console.* migrated in middleware
- [ ] **Set LOG_LEVEL** - Configure per environment
- [ ] **Test log output** - Verify JSON format and context
- [ ] **Review log volume** - Ensure not logging excessively

**Environment Variables:**
```bash
# Production
LOG_LEVEL=info

# Staging
LOG_LEVEL=debug

# Local Development
LOG_LEVEL=debug
```

**Test Logging:**
```typescript
// Verify logs include requestId and userId
log.info('test.event', { testData: 'value' });
// Check output includes: level, event, timestamp, requestId, userId, path, method
```

### Log Aggregation
- [ ] **Access Vercel logs** - Verify logs appear in Vercel dashboard
- [ ] **Set up log filtering** - Filter by level, event, userId, requestId
- [ ] **Create log alerts** - Alert on error rate spikes
- [ ] **Monitor log volume** - Ensure within Vercel limits

**Vercel Logs:**
```bash
# View logs
vercel logs --follow

# Filter by severity
vercel logs | grep '"level":"error"'

# Download for analysis
vercel logs > logs.json
```

---

## 🔒 Security

### Authentication
- [ ] **Supabase Auth configured** - Email/password, OAuth providers
- [ ] **Session management** - Verify session persistence and expiry
- [ ] **Password requirements** - Minimum 8 characters, complexity rules
- [ ] **Rate limiting** - Login attempts limited
- [ ] **CSRF protection** - Verify Supabase CSRF protection

### Authorization
- [ ] **Middleware protection** - Routes protected by authentication
- [ ] **RLS policies** - Database row-level security configured
- [ ] **Organization access** - Members can only access their org
- [ ] **Admin access** - Platform admin routes protected
- [ ] **API authentication** - All API routes require auth

### Data Privacy
- [ ] **PII handling** - No PII in logs
- [ ] **Data encryption** - Database encryption at rest
- [ ] **Secure headers** - HTTPS, HSTS, CSP configured
- [ ] **GDPR compliance** - Data export and deletion implemented
- [ ] **Privacy policy** - Updated and accessible

### Secrets Management
- [ ] **Environment variables** - All secrets in Vercel env vars
- [ ] **No secrets in code** - Verify no hardcoded secrets
- [ ] **Supabase keys** - Service role key secured
- [ ] **API keys rotated** - Recent rotation of all API keys

**Check for secrets:**
```bash
# Search for potential secrets
git grep -i "api_key\|secret\|password" src/
```

---

## 📊 Performance

### Build & Bundle
- [ ] **Production build** - `npm run build` succeeds
- [ ] **Bundle size** - Check bundle analysis
- [ ] **Code splitting** - Dynamic imports for large components
- [ ] **Tree shaking** - Unused code eliminated

**Commands:**
```bash
npm run build
npm run analyze # If bundle analyzer configured
```

### Core Web Vitals
- [ ] **LCP** - Largest Contentful Paint < 2.5s
- [ ] **FID** - First Input Delay < 100ms
- [ ] **CLS** - Cumulative Layout Shift < 0.1
- [ ] **Run Lighthouse** - Score > 90 for performance

**Test:**
```bash
# Run Lighthouse in Chrome DevTools
# Or use CLI
npm install -g lighthouse
lighthouse https://your-staging-url.vercel.app
```

### API Performance
- [ ] **Response times** - API routes respond in < 500ms
- [ ] **Database queries** - Queries complete in < 100ms
- [ ] **Caching effectiveness** - Cache hit rate > 70%
- [ ] **N+1 queries eliminated** - No N+1 query patterns

**Monitor:**
- Use Vercel Analytics for API response times
- Check database query analyzer
- Monitor cache stats

---

## 🚀 Deployment

### Environment Configuration
- [ ] **Production env vars** - All required variables set
- [ ] **Staging env vars** - Staging environment configured
- [ ] **Preview env vars** - Preview deployments configured
- [ ] **Database URLs** - Production and staging databases separated

**Required Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Caching
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Cron Jobs
CRON_SECRET=

# Feature Flags
MATCHING_FEATURE_ENABLED=true
```

### Vercel Configuration
- [ ] **Domain configured** - Custom domain set up
- [ ] **SSL certificate** - HTTPS enabled
- [ ] **Environment variables** - All secrets added to Vercel
- [ ] **Build settings** - Correct build command and output directory
- [ ] **Deployment protection** - Production password protected if needed

### Database
- [ ] **Production database** - Separate from development/staging
- [ ] **Migrations applied** - All migrations run
- [ ] **Backups configured** - Automated database backups
- [ ] **Connection pooling** - Supabase connection pooler configured
- [ ] **Data seeded** - Essential data (taxonomy) seeded

**Run Migrations:**
```bash
npm run db:push # Drizzle migrations
```

### Pre-Deployment Checklist
- [ ] **All tests pass** - E2E, unit, privacy tests
- [ ] **No console errors** - Clean browser console
- [ ] **No TypeScript errors** - `npm run typecheck` passes
- [ ] **No lint errors** - `npm run lint` passes
- [ ] **Build succeeds** - `npm run build` succeeds
- [ ] **Environment variables verified** - All required vars set

---

## 📈 Monitoring & Observability

### Application Monitoring
- [ ] **Vercel Analytics** - Enabled for production
- [ ] **Sentry monitoring** - Error tracking active
- [ ] **Log monitoring** - Structured logs viewable
- [ ] **Uptime monitoring** - Third-party uptime monitor configured

### Metrics to Monitor
- [ ] **Error rate** - Errors per minute/hour
- [ ] **Response times** - API and page load times
- [ ] **User activity** - Active users, signups
- [ ] **Matching usage** - Matches computed, interests expressed
- [ ] **Cache hit rate** - Percentage of cache hits
- [ ] **Database performance** - Query times, connection pool

### Alerts
- [ ] **Error rate spike** - Alert if errors > threshold
- [ ] **Response time degradation** - Alert if p95 > 2s
- [ ] **Database connection issues** - Alert on connection failures
- [ ] **Cron job failures** - Alert if scheduled jobs fail
- [ ] **Uptime alerts** - Alert if site down > 1 minute

**Set up in Sentry, Vercel, or monitoring tool of choice**

---

## 📚 Documentation

### User Documentation
- [ ] **User guide** - Help documentation for users
- [ ] **FAQ** - Common questions answered
- [ ] **Privacy policy** - Up to date
- [ ] **Terms of service** - Up to date
- [ ] **Contact information** - Support email/form available

### Developer Documentation
- [x] **Sentry setup** - `docs/sentry-setup.md`
- [x] **Caching & pagination** - `docs/caching-pagination.md`
- [x] **Structured logging** - `docs/structured-logging.md`
- [x] **Production readiness** - This document
- [ ] **API documentation** - API endpoints documented
- [ ] **Architecture overview** - System architecture documented
- [ ] **Deployment guide** - Step-by-step deployment instructions

### Runbooks
- [ ] **Incident response** - Steps for handling incidents
- [ ] **Database recovery** - Backup and restore procedures
- [ ] **Rollback procedure** - How to rollback deployment
- [ ] **Scaling guide** - How to scale infrastructure
- [ ] **Common issues** - Troubleshooting common problems

---

## 🔄 Post-Deployment

### Smoke Tests
- [ ] **Homepage loads** - Main landing page accessible
- [ ] **Signup works** - New user can sign up
- [ ] **Login works** - Existing user can login
- [ ] **Core features** - Matching, messaging, profiles work
- [ ] **No console errors** - Browser console clean
- [ ] **Logs appearing** - Structured logs visible in Vercel

### Monitoring First 24 Hours
- [ ] **Error rate** - Monitor for error spikes
- [ ] **Response times** - Check performance metrics
- [ ] **User feedback** - Monitor for user reports
- [ ] **Database load** - Check database performance
- [ ] **Cache effectiveness** - Verify cache hit rates

### Rollback Plan
- [ ] **Previous deployment** - Know how to revert to previous version
- [ ] **Database rollback** - Can restore from backup if needed
- [ ] **Communication plan** - How to notify users of issues
- [ ] **On-call rotation** - Team members available for issues

---

## ✅ Final Sign-Off

Before deploying to production, verify:

- [ ] **All critical tests pass** - E2E, unit, privacy
- [ ] **Performance acceptable** - Core Web Vitals, API response times
- [ ] **Security hardened** - Auth, authorization, secrets management
- [ ] **Monitoring active** - Errors, logs, metrics tracked
- [ ] **Documentation complete** - User and developer docs up to date
- [ ] **Team trained** - Team knows how to deploy, monitor, troubleshoot
- [ ] **Backup plan** - Can rollback if issues occur

**Deployment Approval:**
- [ ] Product Owner sign-off
- [ ] Engineering lead sign-off
- [ ] Security review complete

---

## 📞 Support

### Escalation Contacts
- **Engineering Lead:** [Name/Email]
- **Product Owner:** [Name/Email]
- **DevOps/Infrastructure:** [Name/Email]

### Useful Links
- **Vercel Dashboard:** https://vercel.com/your-project
- **Sentry Dashboard:** https://sentry.io/organizations/your-org
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Repository:** https://github.com/your-org/proofound

---

## 📅 Timeline

**Estimated completion:**
- Phase 1 (Testing): ✅ Complete
- Phase 2 (Error Monitoring): ✅ Complete
- Phase 3 (Performance): ✅ Complete
- Phase 4 (Logging): ✅ Complete
- Phase 5 (QA & Docs): 🔄 In Progress

**Recommended launch timeline:**
1. **Week 1:** Complete all automated tests and QA
2. **Week 2:** Performance testing and optimization
3. **Week 3:** Security review and final documentation
4. **Week 4:** Staging deployment and final smoke tests
5. **Week 5:** Production deployment and monitoring

---

**Last Updated:** 2025-01-03
**Document Version:** 1.0
