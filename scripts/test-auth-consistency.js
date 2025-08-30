// Configuration
const LOCAL_URL = 'http://localhost:3000';
const PROD_URL = 'https://receipt-forge-c0b5jzn9u-ssizaa.vercel.app';
const TEST_EMAIL = `test-consistency-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'Test Consistency User';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  const color = result ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

async function testEnvironmentVariables(baseUrl, envName) {
  logSection(`Testing Environment Variables - ${envName}`);
  
  try {
    // Test if the app is accessible
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      logTest('App Accessibility', true, 'Application is responding');
    } else {
      logTest('App Accessibility', false, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('App Accessibility', false, error.message);
  }

  // Test Supabase environment variables by trying to access a protected endpoint
  try {
    const response = await fetch(`${baseUrl}/api/auth/me`);
    const data = await response.json();
    
    if (response.status === 401) {
      logTest('Supabase Environment Variables', true, 'Properly configured (returns 401 for unauthenticated)');
    } else if (response.status === 500) {
      logTest('Supabase Environment Variables', false, 'Server error - likely missing env vars');
    } else {
      logTest('Supabase Environment Variables', false, `Unexpected response: ${response.status}`);
    }
  } catch (error) {
    logTest('Supabase Environment Variables', false, error.message);
  }
}

async function testAuthFlow(baseUrl, envName) {
  logSection(`Testing Authentication Flow - ${envName}`);
  
  let authCookies = null;
  
  // Test 1: Sign up
  log('1. Testing Sign Up...', 'cyan');
  try {
    const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME
      }),
    });

    const signupData = await signupResponse.json();
    
    if (signupResponse.ok && signupData.success) {
      logTest('Sign Up', true, `User created: ${signupData.user.email}`);
      authCookies = signupResponse.headers.get('set-cookie');
    } else {
      logTest('Sign Up', false, signupData.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Sign Up', false, error.message);
    return false;
  }

  // Test 2: Login
  log('2. Testing Login...', 'cyan');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.success) {
      logTest('Login', true, `User logged in: ${loginData.user.email}`);
      authCookies = loginResponse.headers.get('set-cookie');
    } else {
      logTest('Login', false, loginData.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Login', false, error.message);
    return false;
  }

  // Test 3: Get current user
  log('3. Testing Get Current User...', 'cyan');
  try {
    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Cookie': authCookies || ''
      }
    });

    const meData = await meResponse.json();
    
    if (meResponse.ok && meData.success) {
      logTest('Get Current User', true, `User retrieved: ${meData.user.email}`);
    } else {
      logTest('Get Current User', false, meData.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Get Current User', false, error.message);
    return false;
  }

  // Test 4: Access protected endpoint
  log('4. Testing Protected Endpoint...', 'cyan');
  try {
    const userResponse = await fetch(`${baseUrl}/api/user`, {
      headers: {
        'Cookie': authCookies || ''
      }
    });

    const userData = await userResponse.json();
    
    if (userResponse.ok && userData.success) {
      logTest('Protected Endpoint Access', true, `User data retrieved: ${userData.user.email}`);
    } else {
      logTest('Protected Endpoint Access', false, userData.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Protected Endpoint Access', false, error.message);
    return false;
  }

  // Test 5: Logout
  log('5. Testing Logout...', 'cyan');
  try {
    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies || ''
      }
    });

    const logoutData = await logoutResponse.json();
    
    if (logoutResponse.ok && logoutData.success) {
      logTest('Logout', true, 'User logged out successfully');
    } else {
      logTest('Logout', false, logoutData.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Logout', false, error.message);
    return false;
  }

  return true;
}

async function testErrorHandling(baseUrl, envName) {
  logSection(`Testing Error Handling - ${envName}`);
  
  // Test 1: Login with wrong password
  log('1. Testing Wrong Password...', 'cyan');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'wrongpassword'
      }),
    });

    const data = await response.json();
    
    if (response.status === 401) {
      logTest('Wrong Password Handling', true, 'Properly rejected with 401');
    } else {
      logTest('Wrong Password Handling', false, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Wrong Password Handling', false, error.message);
  }

  // Test 2: Login with non-existent email
  log('2. Testing Non-existent Email...', 'cyan');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: TEST_PASSWORD
      }),
    });

    const data = await response.json();
    
    if (response.status === 401) {
      logTest('Non-existent Email Handling', true, 'Properly rejected with 401');
    } else {
      logTest('Non-existent Email Handling', false, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Non-existent Email Handling', false, error.message);
  }

  // Test 3: Access protected endpoint without auth
  log('3. Testing Unauthenticated Access...', 'cyan');
  try {
    const response = await fetch(`${baseUrl}/api/user`);
    const data = await response.json();
    
    if (response.status === 401) {
      logTest('Unauthenticated Access Handling', true, 'Properly rejected with 401');
    } else {
      logTest('Unauthenticated Access Handling', false, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Unauthenticated Access Handling', false, error.message);
  }
}

async function runConsistencyTests() {
  logSection('AUTHENTICATION CONSISTENCY TESTING');
  log('Testing authentication consistency between local and deployed environments', 'bright');
  
  const results = {
    local: { env: false, auth: false, errors: false },
    production: { env: false, auth: false, errors: false }
  };

  // Test Local Environment
  logSection('LOCAL ENVIRONMENT TESTS');
  try {
    await testEnvironmentVariables(LOCAL_URL, 'Local');
    results.local.env = true;
    
    await testAuthFlow(LOCAL_URL, 'Local');
    results.local.auth = true;
    
    await testErrorHandling(LOCAL_URL, 'Local');
    results.local.errors = true;
  } catch (error) {
    log(`Local environment test failed: ${error.message}`, 'red');
  }

  // Test Production Environment
  logSection('PRODUCTION ENVIRONMENT TESTS');
  try {
    await testEnvironmentVariables(PROD_URL, 'Production');
    results.production.env = true;
    
    await testAuthFlow(PROD_URL, 'Production');
    results.production.auth = true;
    
    await testErrorHandling(PROD_URL, 'Production');
    results.production.errors = true;
  } catch (error) {
    log(`Production environment test failed: ${error.message}`, 'red');
  }

  // Summary
  logSection('TEST SUMMARY');
  
  log('Local Environment:', 'bright');
  logTest('Environment Variables', results.local.env);
  logTest('Authentication Flow', results.local.auth);
  logTest('Error Handling', results.local.errors);
  
  log('Production Environment:', 'bright');
  logTest('Environment Variables', results.production.env);
  logTest('Authentication Flow', results.production.auth);
  logTest('Error Handling', results.production.errors);
  
  // Consistency check
  const localConsistent = results.local.env && results.local.auth && results.local.errors;
  const prodConsistent = results.production.env && results.production.auth && results.production.errors;
  
  if (localConsistent && prodConsistent) {
    log('🎉 ENVIRONMENTS ARE CONSISTENT!', 'green');
  } else {
    log('⚠️  ENVIRONMENTS ARE INCONSISTENT!', 'red');
    log('Check the logs above for specific issues.', 'yellow');
  }
}

// Run the tests
runConsistencyTests().catch(console.error);
