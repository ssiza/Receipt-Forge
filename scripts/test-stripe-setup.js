#!/usr/bin/env node

/**
 * Test script to verify Stripe integration
 * Run with: node scripts/test-stripe-setup.js
 */

const Stripe = require('stripe');

// Load environment variables
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

async function testStripeSetup() {
  console.log('🧪 Testing Stripe Integration...\n');

  try {
    // Test 1: Check API key
    console.log('1. Testing API key...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ API key is valid');
    console.log(`   Account: ${account.business_profile?.name || 'Test Account'}\n`);

    // Test 2: List products
    console.log('2. Testing products...');
    const products = await stripe.products.list({ limit: 10 });
    console.log(`✅ Found ${products.data.length} products`);
    products.data.forEach(product => {
      console.log(`   - ${product.name} (${product.id})`);
    });
    console.log('');

    // Test 3: List prices
    console.log('3. Testing prices...');
    const prices = await stripe.prices.list({ 
      active: true, 
      type: 'recurring',
      limit: 10 
    });
    console.log(`✅ Found ${prices.data.length} active recurring prices`);
    prices.data.forEach(price => {
      const product = price.product;
      const productName = typeof product === 'string' ? product : product.name;
      console.log(`   - ${productName}: $${price.unit_amount / 100}/${price.recurring.interval} (${price.id})`);
    });
    console.log('');

    // Test 4: Check webhook endpoints
    console.log('4. Testing webhook endpoints...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    console.log(`✅ Found ${webhooks.data.length} webhook endpoints`);
    webhooks.data.forEach(webhook => {
      console.log(`   - ${webhook.url} (${webhook.status})`);
      console.log(`     Events: ${webhook.enabled_events.join(', ')}`);
    });
    console.log('');

    // Test 5: Create a test customer
    console.log('5. Testing customer creation...');
    const testCustomer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: {
        test: 'true'
      }
    });
    console.log(`✅ Created test customer: ${testCustomer.id}`);
    console.log(`   Email: ${testCustomer.email}`);
    console.log('');

    // Test 6: Create a test checkout session
    if (prices.data.length > 0) {
      console.log('6. Testing checkout session creation...');
      const session = await stripe.checkout.sessions.create({
        customer: testCustomer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          test: 'true'
        }
      });
      console.log(`✅ Created test checkout session: ${session.id}`);
      console.log(`   URL: ${session.url}`);
      console.log('');

      // Clean up test session
      await stripe.checkout.sessions.expire(session.id);
      console.log('✅ Expired test checkout session');
    }

    // Clean up test customer
    await stripe.customers.del(testCustomer.id);
    console.log('✅ Deleted test customer');

    console.log('\n🎉 All tests passed! Stripe integration is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your webhook endpoint in Stripe Dashboard');
    console.log('2. Add the webhook secret to your environment variables');
    console.log('3. Test the full subscription flow with test cards');
    console.log('4. Use test card: 4242 4242 4242 4242 for successful payments');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your STRIPE_SECRET_KEY environment variable');
    console.error('2. Ensure you have the correct API version');
    console.error('3. Verify your Stripe account is active');
    process.exit(1);
  }
}

// Run the test
testStripeSetup(); 