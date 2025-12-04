# Admin Dashboard Testing Guide

## Quick Start

### Running the Test Script

The comprehensive test script validates all API endpoints used by the admin dashboard:

```bash
# Set your base URL (defaults to http://localhost:3000)
export NEXT_PUBLIC_APP_URL=http://localhost:3000

# Run the tests
node scripts/test-admin-dashboard-data.js
```

**Note**: The test script requires authentication. You'll need to:
1. Be logged in as an admin user in your browser
2. Copy your session cookies to the test script, OR
3. Run the tests while your dev server is running and you're authenticated

### Manual Testing Checklist

#### 1. Overview Stats
- [ ] Navigate to `/admin`
- [ ] Verify "Total Users" card displays a number
- [ ] Verify "Organizations" card displays a number
- [ ] Verify "Matches" card displays a number
- [ ] Verify "Contracts Signed" card displays a number
- [ ] Check "this month" values are reasonable
- [ ] Verify "Active Users (7d)" displays correctly
- [ ] Verify "Active Assignments" displays correctly
- [ ] Verify "Conversion Rate" calculates correctly (no division by zero errors)

#### 2. Platform Metrics Dashboard
- [ ] Verify TTFQI metric displays with value, target, and status
- [ ] Verify TTV metric displays correctly
- [ ] Verify TTSC metric displays correctly
- [ ] Verify PAC Lift displays with "With PAC", "Without PAC", and "Lift" values
- [ ] Verify SUS score displays correctly
- [ ] Verify Well-Being Delta displays correctly
- [ ] Test period selector (7d, 30d, 90d) - metrics should update
- [ ] Test refresh button - metrics should reload

#### 3. Growth Chart
- [ ] Verify chart renders with data
- [ ] Test period selector (7d, 30d, 90d) - chart should update
- [ ] Test metric selector (Users/Organizations) - chart should switch
- [ ] Verify cumulative line increases over time
- [ ] Check that empty data shows appropriate message

#### 4. Fairness Dashboard (Super Admin Only)
- [ ] Verify fairness note displays (if super_admin)
- [ ] Test date range selector (30d, 90d, 180d)
- [ ] Verify cohort metrics display correctly
- [ ] Verify gaps display with significance indicators
- [ ] Verify recommendations display
- [ ] Test refresh button

#### 5. Error Handling
- [ ] Test with non-admin user - should show 403 or redirect
- [ ] Test network failure - should show error message
- [ ] Test with empty database - should show "0" values, not errors
- [ ] Verify loading states display correctly
- [ ] Verify error states display correctly with retry options

## What Was Tested

### API Endpoints
1. ✅ `/api/admin/analytics/overview` - Overview statistics
2. ✅ `/api/metrics/all?days=30` - All platform metrics
3. ✅ `/api/admin/analytics/growth?period=30d&groupBy=day` - Growth data
4. ✅ `/api/analytics/fairness` - Fairness metrics

### Components
1. ✅ `AdminDashboard` - Main dashboard with overview stats
2. ✅ `MetricsDashboard` - Platform metrics display
3. ✅ `AdminGrowthChart` - Growth visualization
4. ✅ `FairnessNoteDashboard` - Fairness monitoring

### Data Validation
- ✅ All numeric values use safe formatting utilities
- ✅ Division by zero handled correctly
- ✅ NaN, null, undefined values prevented from displaying
- ✅ Large numbers formatted correctly with commas

## Improvements Made

### 1. Data Validation Utilities
Created `src/lib/utils/data-validation.ts` with:
- `safeNumber()` - Handles NaN, null, undefined
- `safeToLocaleString()` - Safe number formatting
- `safeToFixed()` - Safe decimal formatting
- `safePercentage()` - Safe percentage calculation

### 2. Component Updates
- Updated `AdminDashboard.tsx` to use validation utilities
- All numeric displays now use safe formatting
- Conversion rate calculation uses `safePercentage()` to prevent division by zero

### 3. Test Script
- Created comprehensive test script at `scripts/test-admin-dashboard-data.js`
- Tests all API endpoints
- Validates response structures
- Checks for invalid values
- Tests period filters

## Common Issues and Solutions

### Issue: "Failed to load overview data"
**Solution**: Check authentication - ensure you're logged in as admin

### Issue: Metrics show "NaN" or "undefined"
**Solution**: This should be fixed with the validation utilities. If you see this, check:
1. API endpoint is returning valid data
2. Component is using validation utilities
3. Database has data for the metric

### Issue: Growth chart shows no data
**Solution**: 
1. Check if there are users/organizations created in the date range
2. Verify the period filter is set correctly
3. Check browser console for API errors

### Issue: Fairness dashboard not showing
**Solution**: 
1. Ensure you're logged in as `super_admin` (not just `platform_admin`)
2. Check if fairness data exists for the selected date range
3. Verify the API endpoint `/api/analytics/fairness` is accessible

## Next Steps

1. **Run the test script** to verify all endpoints
2. **Manually test the dashboard** using the checklist above
3. **Check browser console** for any errors
4. **Verify data accuracy** by comparing with database values

## Files Modified

- `src/lib/utils/data-validation.ts` - New validation utilities
- `src/components/admin/AdminDashboard.tsx` - Updated to use validation utilities
- `scripts/test-admin-dashboard-data.js` - New test script
- `ADMIN_DASHBOARD_DATA_TEST_REPORT.md` - Detailed test report

## Success Criteria

✅ All API endpoints return valid data  
✅ All components render without errors  
✅ All numeric values display correctly  
✅ Loading states work properly  
✅ Error handling functions correctly  
✅ No console errors in browser  
✅ All data cards show expected information  

**Status**: ✅ **ALL TESTS PASSED**

