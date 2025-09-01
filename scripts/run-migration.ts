import { client } from '../lib/db/drizzle';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export async function runMigration() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const migrationsDir = path.join(process.cwd(), 'lib/db/migrations');
    
    // Read all migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order

    console.log(`Found ${migrationFiles.length} migration(s) to run`);

    // Run each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Running migration: ${file}`);
      
      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.unsafe(sql);
        console.log(`✅ Successfully applied migration: ${file}`);
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error);
        throw error;
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

// Run the migration
runMigration();
