# Stripe Integration Guide

This guide covers the complete Stripe subscription integration that replaces the previous hardcoded payment links with a dynamic, secure subscription flow.

## 🚀 Overview

The new implementation provides:
- **Dynamic Checkout Sessions**: Real-time Stripe checkout creation
- **Webhook Handling**: Secure subscription event processing
- **Subscription Badges**: Visual indicators for premium users
- **Plan Enforcement**: Automatic usage limits based on subscription status
- **Live Billing Management**: Real-time subscription status and billing history

## 📋 Requirements Met

### ✅ 1. Stripe Checkout
- **Dynamic Sessions**: `/api/stripe/create-checkout` creates real-time checkout sessions
- **Environment Integration**: Uses `STRIPE_SECRET_KEY` from environment variables
- **No Hardcoded Links**: All payment flows are generated dynamically

### ✅ 2. Webhook Handling
- **Event Processing**: Handles `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`
- **Database Updates**: Immediately updates user records after verification
- **Secure Verification**: Uses `STRIPE_WEBHOOK_SECRET` for signature verification

### ✅ 3. Subscription Badge
- **Premium Indicator**: Shows "Premium" badge in dashboard header
- **Real-time Updates**: Refreshes every 10 seconds
- **Trial Support**: Shows "Trial" badge for trial subscriptions

### ✅ 4. Plan Enforcement
- **Free Tier**: 5 receipts/month limit
- **Premium Tier**: Unlimited receipts
- **Monthly Reset**: Usage resets monthly or on upgrade
- **Automatic Enforcement**: Built into receipt creation API

### ✅ 5. Billing Page
- **Live Status**: Real-time subscription status display
- **Plan Details**: Shows plan name, status, renewal date, amount
- **Payment Methods**: Displays saved payment methods
- **Billing History**: Complete invoice history with download links

### ✅ 6. Redirect Flow
- **Success Handling**: Redirects to dashboard with success notification
- **Status Updates**: Subscription status immediately visible
- **Error Handling**: Graceful error handling with user feedback

### ✅ 7. Testing Support
- **Test Script**: `scripts/test-stripe-setup.js` for integration testing
- **Test Cards**: Support for Stripe test mode
- **Sandbox Environment**: Full testing capabilities

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_...
BASE_URL=http://localhost:3000
```

### 2. Stripe Dashboard Setup

1. **Create Products & Prices**:
   - Monthly Plan: $10/month
   - 6-Month Plan: $48 upfront ($8/month)
   - Yearly Plan: $72 upfront ($6/month)

2. **Set Up Webhook**:
   - Endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`

3. **Get Webhook Secret**:
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Test the Integration

Run the test script:

```bash
node scripts/test-stripe-setup.js
```

## 🏗️ Architecture

### API Endpoints

#### `/api/stripe/create-checkout`
- **Method**: POST
- **Purpose**: Creates dynamic Stripe checkout sessions
- **Input**: `{ priceId: string }`
- **Output**: `{ sessionId: string, url: string }`

#### `/api/stripe/webhook`
- **Method**: POST
- **Purpose**: Handles Stripe webhook events
- **Security**: Signature verification
- **Events**: Subscription lifecycle events

#### `/api/pricing`
- **Method**: GET
- **Purpose**: Fetches available plans from Stripe
- **Output**: `{ prices: [], products: [] }`

#### `/api/billing`
- **Method**: GET
- **Purpose**: Returns subscription and billing data
- **Output**: `{ subscription, invoices, paymentMethods }`

### Database Schema

```sql
-- Teams table with subscription fields
ALTER TABLE teams ADD COLUMN stripe_customer_id TEXT UNIQUE;
ALTER TABLE teams ADD COLUMN stripe_subscription_id TEXT UNIQUE;
ALTER TABLE teams ADD COLUMN stripe_product_id TEXT;
ALTER TABLE teams ADD COLUMN plan_name VARCHAR(50);
ALTER TABLE teams ADD COLUMN subscription_status VARCHAR(20);

-- Monthly usage tracking
CREATE TABLE monthly_usage (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  receipt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, year, month)
);
```

### Component Structure

```
components/
├── subscription-badge.tsx          # Premium user indicator
└── ui/
    └── button.tsx                  # Updated with loading states

app/
├── api/
│   ├── stripe/
│   │   ├── create-checkout/        # Dynamic checkout creation
│   │   └── webhook/                # Webhook event handling
│   ├── pricing/                    # Plan fetching
│   └── billing/                    # Subscription management
├── (dashboard)/
│   ├── dashboard/
│   │   ├── billing/                # Billing management page
│   │   └── layout.tsx              # Updated with subscription badge
│   └── pricing/                    # Updated pricing page
```

## 🔄 Subscription Flow

### 1. User Selects Plan
```typescript
// User clicks plan button
const handleCheckout = async (priceId: string) => {
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId })
  });
  const { url } = await response.json();
  window.location.href = url;
};
```

### 2. Stripe Checkout
- User completes payment on Stripe's secure checkout page
- Stripe redirects to success URL with session ID

### 3. Webhook Processing
```typescript
// Webhook handles subscription creation
case 'checkout.session.completed':
  await handleCheckoutSessionCompleted(session);
  // Updates database with subscription details
  // Resets monthly usage for premium users
```

### 4. Success Redirect
- User redirected to dashboard with success notification
- Subscription badge appears immediately
- Usage limits updated

## 🛡️ Security Features

### Webhook Security
- **Signature Verification**: All webhooks verified with `STRIPE_WEBHOOK_SECRET`
- **Event Validation**: Only processes expected event types
- **Error Handling**: Graceful error handling with logging

### Database Security
- **RLS Policies**: Row-level security on all tables
- **Input Validation**: All inputs validated before database operations
- **SQL Injection Protection**: Uses parameterized queries

### API Security
- **Authentication**: All endpoints require valid session
- **Rate Limiting**: Built-in rate limiting on checkout creation
- **Error Sanitization**: Errors don't expose sensitive information

## 📊 Usage Tracking

### Plan Enforcement Logic
```typescript
export function canCreateReceipt(team: Team | null, currentReceiptCount: number): boolean {
  if (!team) return false;
  
  const limit = getReceiptLimit(team);
  
  // Unlimited plan
  if (limit === -1) return true;
  
  // Check if under limit
  return currentReceiptCount < limit;
}
```

### Monthly Usage Reset
```typescript
// Reset usage when user upgrades
if (status === 'active' || status === 'trialing') {
  await resetMonthlyUsage(team.id);
}
```

## 🧪 Testing

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

### Test Scenarios
1. **New Subscription**: Complete checkout flow
2. **Subscription Update**: Change plans
3. **Subscription Cancel**: Cancel and reactivate
4. **Payment Failure**: Test declined payments
5. **Usage Limits**: Verify free tier limits

### Running Tests
```bash
# Test Stripe integration
node scripts/test-stripe-setup.js

# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test checkout flow
npm run dev
# Navigate to /pricing and test checkout
```

## 🚨 Error Handling

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check server logs

2. **Checkout Session Creation Fails**
   - Verify Stripe API key
   - Check price ID exists
   - Ensure user is authenticated

3. **Subscription Not Updating**
   - Check webhook processing
   - Verify database connection
   - Check subscription status in Stripe

### Debugging

```bash
# Check webhook events
stripe events list --limit 10

# Check subscription status
stripe subscriptions list

# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 📈 Monitoring

### Key Metrics
- **Conversion Rate**: Checkout completion rate
- **Churn Rate**: Subscription cancellation rate
- **Revenue**: Monthly recurring revenue
- **Usage**: Receipt creation patterns

### Logging
- All webhook events logged
- Checkout session creation logged
- Subscription status changes logged
- Error events logged with context

## 🔄 Migration from Old System

### Database Migration
```sql
-- Add subscription fields to existing teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20);
```

### Code Changes
- Remove hardcoded payment links
- Update pricing page to use dynamic checkout
- Add subscription badge to dashboard
- Update billing page with live data

## 🎯 Best Practices

1. **Always Test in Stripe Test Mode First**
2. **Use Webhook Signatures for Security**
3. **Handle All Subscription States**
4. **Provide Clear User Feedback**
5. **Monitor Webhook Delivery**
6. **Keep API Keys Secure**
7. **Test Error Scenarios**
8. **Document All Changes**

## 📞 Support

For issues with the Stripe integration:
1. Check the test script output
2. Review webhook event logs
3. Verify environment variables
4. Test with Stripe test cards
5. Check database connection

The integration is now production-ready and provides a complete, secure subscription management system. 