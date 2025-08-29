#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

console.log('🚀 ReceiptForge Deployment Setup\n');

async function generateAuthSecret() {
  return crypto.randomBytes(32).toString('base64');
}

async function validateEnvironment() {
  console.log('📋 Checking environment setup...\n');
  
  const requiredVars = [
    'POSTGRES_URL',
    'AUTH_SECRET', 
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'BASE_URL'
  ];
  
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease set these variables in your deployment platform.');
    return false;
  }
  
  console.log('✅ All required environment variables are set!\n');
  return true;
}

async function generateEnvTemplate() {
  console.log('📝 Generating .env.example template...\n');
  
  const template = `# Database
POSTGRES_URL=postgresql://username:password@host:port/database

# Authentication
AUTH_SECRET=${await generateAuthSecret()}

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # Production Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Production webhook secret

# Application
BASE_URL=https://yourdomain.com # Your production domain
`;
  
  await fs.writeFile(path.join(process.cwd(), '.env.example'), template);
  console.log('✅ .env.example created!\n');
}

async function checkDependencies() {
  console.log('📦 Checking dependencies...\n');
  
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
    );
    
    const requiredDeps = [
      'next',
      'react',
      'react-dom',
      '@react-pdf/renderer',
      'drizzle-orm',
      'postgres',
      'jose'
    ];
    
    const missing = [];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        missing.push(dep);
      }
    }
    
    if (missing.length > 0) {
      console.log('❌ Missing required dependencies:');
      missing.forEach(dep => console.log(`   - ${dep}`));
      console.log('\nRun: npm install');
      return false;
    }
    
    console.log('✅ All required dependencies are installed!\n');
    return true;
  } catch (error) {
    console.log('❌ Error checking dependencies:', error.message);
    return false;
  }
}

async function checkBuild() {
  console.log('🔨 Checking build process...\n');
  
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build completed successfully!\n');
    return true;
  } catch (error) {
    console.log('❌ Build failed. Please fix the issues before deploying.\n');
    return false;
  }
}

async function main() {
  console.log('Welcome to ReceiptForge deployment setup!\n');
  
  // Generate environment template
  await generateEnvTemplate();
  
  // Check dependencies
  const depsOk = await checkDependencies();
  if (!depsOk) {
    process.exit(1);
  }
  
  // Check build
  const buildOk = await checkBuild();
  if (!buildOk) {
    process.exit(1);
  }
  
  // Validate environment (if running in deployment)
  if (process.env.NODE_ENV === 'production') {
    const envOk = await validateEnvironment();
    if (!envOk) {
      process.exit(1);
    }
  }
  
  console.log('🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Set up your PostgreSQL database');
  console.log('2. Configure Stripe webhooks');
  console.log('3. Set environment variables in your deployment platform');
  console.log('4. Deploy to your chosen platform');
  console.log('\nSee DEPLOYMENT_GUIDE.md for detailed instructions.\n');
}

main().catch(console.error);
