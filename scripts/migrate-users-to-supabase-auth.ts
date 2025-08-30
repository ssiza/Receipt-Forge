import { createAdminSupabaseClient } from '../lib/supabaseClient';
import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function migrateUsersToSupabaseAuth() {
  console.log('Starting comprehensive user migration to Supabase Auth...');
  
  const supabase = createAdminSupabaseClient();
  
  try {
    // Get all users from the database
    const allUsers = await db
      .select()
      .from(users)
      .where(isNull(users.deletedAt));
    
    console.log(`Found ${allUsers.length} users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of allUsers) {
      try {
        console.log(`\nProcessing user: ${user.email} (ID: ${user.id})`);
        
        // Check if user already exists in Supabase Auth
        const { data: existingAuthUser, error: checkError } = await supabase.auth.admin.getUserByEmail(user.email);
        
        if (existingAuthUser.user) {
          console.log(`User ${user.email} already exists in Supabase Auth with ID: ${existingAuthUser.user.id}`);
          
          // Update the user's auth_user_id to link with existing Supabase Auth user
          await db
            .update(users)
            .set({ 
              authUserId: existingAuthUser.user.id,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
          
          console.log(`Updated user ${user.email} to link with existing Supabase Auth user`);
          migratedCount++;
          continue;
        }
        
        // Create user in Supabase Auth
        console.log(`Creating user ${user.email} in Supabase Auth...`);
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'temp-password-123', // Temporary password, user will need to reset
          email_confirm: true,
          user_metadata: {
            name: user.name || '',
            role: user.role || 'member'
          },
          app_metadata: {
            provider: 'email',
            providers: ['email']
          }
        });
        
        if (createError) {
          console.error(`Error creating user ${user.email} in Supabase Auth:`, createError);
          errorCount++;
          continue;
        }
        
        if (!authUser.user) {
          console.error(`No user data returned for ${user.email}`);
          errorCount++;
          continue;
        }
        
        // Update the user's auth_user_id to link with the new Supabase Auth user
        await db
          .update(users)
          .set({ 
            authUserId: authUser.user.id,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
        
        console.log(`Successfully migrated user: ${user.email}`);
        console.log(`  - Database ID: ${user.id}`);
        console.log(`  - UUID: ${user.uuidId}`);
        console.log(`  - Supabase Auth ID: ${authUser.user.id}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`- Total users: ${allUsers.length}`);
    console.log(`- Successfully migrated: ${migratedCount}`);
    console.log(`- Skipped (already exists): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some users failed to migrate. Check the logs above for details.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
    
    // Verify migration
    console.log('\n=== Verification ===');
    const usersWithoutAuth = await db
      .select()
      .from(users)
      .where(isNull(users.authUserId));
    
    console.log(`Users still without auth_user_id: ${usersWithoutAuth.length}`);
    
    if (usersWithoutAuth.length === 0) {
      console.log('✅ All users now have auth_user_id!');
    } else {
      console.log('❌ Some users still missing auth_user_id:');
      usersWithoutAuth.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUsersToSupabaseAuth()
  .then(() => {
    console.log('\nMigration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
