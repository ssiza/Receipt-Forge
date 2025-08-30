# Supabase Auth Migration Guide

This document outlines the migration from manual authentication to Supabase Auth while maintaining user ID consistency.

## Overview

The migration involves:
1. Setting up Supabase Auth
2. Migrating existing users to Supabase Auth
3. Updating the database schema to work with Supabase Auth
4. Replacing manual authentication with Supabase Auth
5. Implementing Row Level Security (RLS)

## Prerequisites

1. **Supabase Project**: Create a new Supabase project at https://supabase.com
2. **Environment Variables**: Add the following to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Migration Steps

### Step 1: Database Schema Migration

Run the database migration to update the schema:

```bash
# Apply the Supabase Auth migration
psql -d your_database -f lib/db/migrations/0010_supabase_auth_migration.sql
```

This migration:
- Adds `auth_user_id` column to link with Supabase Auth
- Adds `uuid_id` as the new primary key
- Updates foreign key references to use UUIDs
- Enables Row Level Security on all tables
- Creates RLS policies for secure access

### Step 2: Migrate Existing Users

Run the migration script to move existing users to Supabase Auth:

```bash
pnpm run migrate:supabase-auth
```

This script:
- Fetches all active users from the current database
- Creates corresponding users in Supabase Auth
- Links the users via `auth_user_id`
- Preserves existing user IDs for consistency

### Step 3: Update Application Code

The following files have been updated to use Supabase Auth:

#### Authentication Files Updated:
- `lib/supabaseClient.ts` - Supabase client setup
- `app/(login)/actions.ts` - Sign in/up logic
- `middleware.ts` - Route protection
- `lib/db/queries.ts` - User queries
- `lib/db/schema.ts` - Database schema

#### New Files Created:
- `app/auth/callback/route.ts` - Auth callback handler
- `scripts/migrate-to-supabase-auth.ts` - Migration script

### Step 4: Remove Legacy Authentication

After confirming the migration works, remove these legacy files:

```bash
# Remove legacy authentication files
rm lib/auth/session.ts
rm lib/auth/token-auth.ts
rm lib/auth/middleware.ts
```

## Database Schema Changes

### Users Table
- **New**: `uuid_id` (UUID, Primary Key)
- **New**: `auth_user_id` (UUID, Unique, Links to Supabase Auth)
- **Legacy**: `id` (Serial, kept for migration)
- **Legacy**: `password_hash` (Text, will be removed)

### Foreign Key Updates
All tables referencing users now use `user_uuid_id` instead of `user_id`:
- `team_members.user_uuid_id`
- `activity_logs.user_uuid_id`
- `invitations.invited_by_uuid_id`

## Row Level Security (RLS)

RLS policies have been implemented for all tables:

### Users Table
```sql
CREATE POLICY "users_self_access" ON users
  FOR ALL USING (auth_user_id = auth.uid());
```

### Teams Table
```sql
CREATE POLICY "teams_member_access" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_uuid_id IN (
        SELECT uuid_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### Other Tables
Similar policies exist for receipts, business_templates, receipt_preferences, etc.

## Authentication Flow

### Sign In
1. User submits email/password
2. Supabase Auth validates credentials
3. User is redirected to dashboard
4. Session is managed by Supabase

### Sign Up
1. User submits email/password
2. Supabase Auth creates user account
3. User record is created in our database
4. Team is created (if no invitation)
5. User is redirected to dashboard

### Sign Out
1. Supabase Auth session is cleared
2. User is redirected to sign-in page

## Verification Checklist

After migration, verify:

- [ ] Users appear in Supabase Auth dashboard
- [ ] Login with existing credentials works
- [ ] New user registration works
- [ ] App events recognize correct user IDs
- [ ] Unauthorized cross-user access is blocked
- [ ] All existing functionality works as expected

## Troubleshooting

### Common Issues

1. **Migration Script Fails**
   - Check Supabase service role key
   - Verify database connection
   - Check user permissions

2. **Authentication Errors**
   - Verify environment variables
   - Check Supabase project settings
   - Ensure auth callback URL is configured

3. **RLS Policy Issues**
   - Check that `auth.uid()` returns correct user ID
   - Verify foreign key relationships
   - Test policies with direct database queries

### Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review application logs
3. Test authentication flow step by step
4. Verify database schema matches expectations

## Rollback Plan

If migration fails, you can rollback:

1. Restore database from backup
2. Revert code changes
3. Remove Supabase configuration
4. Restart with manual authentication

## Security Considerations

- Service role key should be kept secure
- RLS policies prevent unauthorized access
- Supabase handles password security
- Session management is handled by Supabase
- All authentication is now centralized

## Performance Impact

- Authentication is now handled by Supabase (faster)
- RLS adds minimal overhead
- UUID lookups are optimized with indexes
- Session management is more efficient

## Next Steps

After successful migration:

1. Monitor authentication logs
2. Test all user flows
3. Update documentation
4. Remove legacy code
5. Consider additional Supabase features (real-time, storage, etc.)
