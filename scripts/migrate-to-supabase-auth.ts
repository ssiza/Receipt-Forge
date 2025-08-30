import { createAdminSupabaseClient } from '../lib/supabaseClient';
import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { compare } from 'bcryptjs';

async function migrateUsersToSupabase() {
  console.log('Starting user migration to Supabase Auth...');
  
  const supabase = createAdminSupabaseClient();
  
  try {
    // Get all active users from the current database
    const existingUsers = await db
      .select()
      .from(users)
      .where(isNull(users.deletedAt));
    
    console.log(`Found ${existingUsers.length} users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of existingUsers) {
      try {
        console.log(`Migrating user: ${user.email} (ID: ${user.id})`);
        
        // Check if user already exists in Supabase Auth
        const { data: existingAuthUser, error: checkError } = await supabase.auth.admin.getUserById(user.id.toString());
        
        if (existingAuthUser.user) {
          console.log(`User ${user.email} already exists in Supabase Auth, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create user in Supabase Auth with the same ID
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
          console.error(`Error creating user ${user.email}:`, createError);
          errorCount++;
          continue;
        }
        
        // Update the user's ID in our database to match Supabase Auth UUID
        if (authUser.user) {
          await db
            .update(users)
            .set({ 
              id: parseInt(authUser.user.id), // Convert UUID to integer if needed
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
          
          console.log(`Successfully migrated user: ${user.email}`);
          migratedCount++;
        }
        
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nMigration Summary:');
    console.log(`- Total users: ${existingUsers.length}`);
    console.log(`- Successfully migrated: ${migratedCount}`);
    console.log(`- Skipped (already exists): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some users failed to migrate. Check the logs above for details.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUsersToSupabase()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
