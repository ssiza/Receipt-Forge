import { createAdminSupabaseClient } from '../lib/supabaseClient';
import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function fixExistingUsers() {
  console.log('Starting to fix existing users without auth_user_id...');
  
  const supabase = createAdminSupabaseClient();
  
  try {
    // Get all users without auth_user_id
    const usersWithoutAuth = await db
      .select()
      .from(users)
      .where(isNull(users.authUserId));
    
    console.log(`Found ${usersWithoutAuth.length} users without auth_user_id`);
    
    for (const user of usersWithoutAuth) {
      try {
        console.log(`Processing user: ${user.email} (ID: ${user.id})`);
        
        // Check if user already exists in Supabase Auth
        const { data: existingAuthUser, error: checkError } = await supabase.auth.admin.listUsers();
        
        if (checkError) {
          console.error(`Error checking Supabase Auth users:`, checkError);
          continue;
        }
        
        // Find user by email in Supabase Auth
        const authUser = existingAuthUser.users.find(u => u.email === user.email);
        
        if (authUser) {
          console.log(`Found existing Supabase Auth user for ${user.email}: ${authUser.id}`);
          
          // Update the user's auth_user_id
          await db
            .update(users)
            .set({ 
              authUserId: authUser.id,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
          
          console.log(`Updated user ${user.email} with auth_user_id: ${authUser.id}`);
        } else {
          console.log(`No Supabase Auth user found for ${user.email}, creating one...`);
          
          // Create user in Supabase Auth
          const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: 'temp-password-123', // Temporary password
            email_confirm: true,
            user_metadata: {
              name: user.name || '',
              role: user.role || 'member'
            }
          });
          
          if (createError) {
            console.error(`Error creating Supabase Auth user for ${user.email}:`, createError);
            continue;
          }
          
          if (newAuthUser.user) {
            // Update the user's auth_user_id
            await db
              .update(users)
              .set({ 
                authUserId: newAuthUser.user.id,
                updatedAt: new Date()
              })
              .where(eq(users.id, user.id));
            
            console.log(`Created Supabase Auth user and updated ${user.email} with auth_user_id: ${newAuthUser.user.id}`);
          }
        }
        
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }
    
    console.log('\nUser fixing completed!');
    
    // Show final status
    const finalUsers = await db
      .select()
      .from(users)
      .where(isNull(users.authUserId));
    
    console.log(`Users still without auth_user_id: ${finalUsers.length}`);
    
  } catch (error) {
    console.error('Error fixing users:', error);
    process.exit(1);
  }
}

// Run the fix
fixExistingUsers()
  .then(() => {
    console.log('User fixing script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('User fixing script failed:', error);
    process.exit(1);
  });
