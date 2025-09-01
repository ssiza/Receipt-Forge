const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Check required environment variables
const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required Supabase environment variables: ${missingVars.join(', ')}`);
  console.error('Please set these variables in your .env.local file');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    const migrationsDir = path.join(__dirname, '../lib/db/migrations');
    
    // Ensure migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found. Creating...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('✅ Created migrations directory');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No migration files found in the migrations directory');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration(s) to run`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Running migration: ${file}`);
      
      try {
        // Read and execute the SQL file
        const sql = fs.readFileSync(filePath, 'utf8');
        const { data, error } = await supabase.rpc('execute_sql', { query: sql });
        
        if (error) throw error;
        
        console.log(`✅ Successfully applied migration: ${file}`);
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error.message);
        process.exit(1);
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error.message);
    process.exit(1);
  }
}

runMigration();
