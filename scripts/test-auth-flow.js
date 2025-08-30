const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'Test User';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow');
  console.log('================================');
  
  try {
    // Test 1: Sign up
    console.log('\n1. Testing Sign Up...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
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
      console.log('✅ Sign up successful');
      console.log('   User created:', {
        id: signupData.user.id,
        email: signupData.user.email,
        name: signupData.user.name,
        role: signupData.user.role
      });
    } else {
      console.log('❌ Sign up failed:', signupData.error);
      return;
    }

    // Test 2: Login
    console.log('\n2. Testing Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
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
      console.log('✅ Login successful');
      console.log('   User logged in:', {
        id: loginData.user.id,
        email: loginData.user.email,
        name: loginData.user.name,
        role: loginData.user.role
      });
    } else {
      console.log('❌ Login failed:', loginData.error);
      return;
    }

    // Test 3: Login with wrong password
    console.log('\n3. Testing Login with Wrong Password...');
    const wrongPasswordResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'wrongpassword'
      }),
    });

    const wrongPasswordData = await wrongPasswordResponse.json();
    
    if (!wrongPasswordResponse.ok) {
      console.log('✅ Wrong password correctly rejected');
      console.log('   Error:', wrongPasswordData.error);
    } else {
      console.log('❌ Wrong password should have been rejected');
      return;
    }

    // Test 4: Login with non-existent email
    console.log('\n4. Testing Login with Non-existent Email...');
    const wrongEmailResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: TEST_PASSWORD
      }),
    });

    const wrongEmailData = await wrongEmailResponse.json();
    
    if (!wrongEmailResponse.ok) {
      console.log('✅ Non-existent email correctly rejected');
      console.log('   Error:', wrongEmailData.error);
    } else {
      console.log('❌ Non-existent email should have been rejected');
      return;
    }

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - Sign up: ✅ Working');
    console.log('   - Login: ✅ Working');
    console.log('   - Wrong password: ✅ Correctly rejected');
    console.log('   - Non-existent email: ✅ Correctly rejected');
    console.log('\n🔍 Next steps:');
    console.log('   1. Check Supabase Auth dashboard to see the new user');
    console.log('   2. Verify the user appears in the database');
    console.log('   3. Test the UI sign-up and sign-in forms');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAuthFlow();
