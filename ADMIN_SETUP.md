# Admin Dashboard Setup Guide

This guide explains how to set up admin credentials for the Proofound MVP platform.

## Quick Start

### Step 1: Create a Regular User Account

1. Go to your application (e.g., `http://localhost:3000` or your deployed URL)
2. Click "Sign Up" or "Get Started"
3. Create an account with your desired admin email (e.g., `admin@proofound.com`)
4. Complete the signup process

### Step 2: Make the User an Admin

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL query (replace the email with your admin's email):

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@proofound.com';
```

4. Verify the update by running:

```sql
SELECT id, email, full_name, is_admin, account_type
FROM profiles
WHERE email = 'admin@proofound.com';
```

You should see `is_admin: true` in the results.

### Step 3: Access the Admin Dashboard

1. Log out of your current session (if logged in)
2. Log back in with your admin credentials
3. Navigate to `/admin` route (e.g., `http://localhost:3000/admin`)
4. You should now see the Admin Dashboard

## Admin Dashboard Features

The admin dashboard provides the following features:

### Overview Tab
- **Total Users**: Track platform user growth
- **Total Matches**: Monitor matching activity
- **Pending Reports**: See reports requiring attention
- **Recent Activity**: View latest platform activities

### Moderation Queue Tab
- **Search Reports**: Filter reports by reason, reporter, or content type
- **Review Reports**: View detailed report information
- **Take Action**: Approve or dismiss reports
- **View Content**: Access reported content for review

### Analytics Tab (Coming Soon)
- Advanced platform analytics
- User engagement metrics
- Growth trends

### User Management Tab (Coming Soon)
- User account management
- Bulk operations
- Account status controls

## Security Best Practices

1. **Keep Admin Credentials Secure**: Use strong passwords for admin accounts
2. **Limit Admin Access**: Only grant admin privileges to trusted users
3. **Monitor Admin Activity**: Regularly review admin actions
4. **Use 2FA**: Enable two-factor authentication in Supabase for admin accounts
5. **Environment-Based Admins**: In production, consider using environment variables to define admin emails

## Troubleshooting

### Issue: Cannot Access /admin Route

**Solution**:
1. Check if you're logged in
2. Verify `is_admin = true` in the database:
   ```sql
   SELECT * FROM profiles WHERE email = 'your-email@example.com';
   ```
3. Clear browser cache and cookies
4. Try logging out and logging back in

### Issue: Admin Panel Shows No Data

**Solution**:
1. Check if database tables have data:
   ```sql
   SELECT COUNT(*) FROM reports;
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM matches;
   ```
2. Verify RLS policies are configured correctly
3. Check browser console for errors

### Issue: Updates Not Saving

**Solution**:
1. Check Supabase connection
2. Verify RLS policies allow admin operations:
   ```sql
   SELECT * FROM reports WHERE moderation_status = 'pending';
   ```
3. Check browser network tab for failed API calls

## Advanced: Multiple Admin Users

To create multiple admin users, run the UPDATE query for each user:

```sql
-- Admin 1
UPDATE profiles SET is_admin = true WHERE email = 'admin1@proofound.com';

-- Admin 2
UPDATE profiles SET is_admin = true WHERE email = 'admin2@proofound.com';

-- Admin 3
UPDATE profiles SET is_admin = true WHERE email = 'admin3@proofound.com';
```

View all admins:

```sql
SELECT id, email, full_name, account_type, is_admin, created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;
```

## Remove Admin Privileges

To remove admin access from a user:

```sql
UPDATE profiles
SET is_admin = false
WHERE email = 'user@example.com';
```

## Migration File

The SQL migration file is located at:
```
supabase/migrations/20250127_create_admin_user.sql
```

This file contains all the queries mentioned above and can be run directly in Supabase SQL Editor.

## Support

For issues or questions:
1. Check the Supabase logs in your dashboard
2. Review the browser console for client-side errors
3. Verify your database schema matches the migration files
4. Ensure all RLS policies are applied correctly

---

**Last Updated**: January 27, 2025
**Version**: 1.0.0
