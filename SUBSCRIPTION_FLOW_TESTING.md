# Subscription & Billing Flow Testing Guide

## Overview

This guide provides comprehensive testing procedures to verify that the subscription and billing flow works correctly end-to-end. Test all scenarios in Stripe test mode before going live.

## Pre-Testing Setup

### 1. Environment Configuration
- Ensure `STRIPE_SECRET_KEY` is set to test key (`sk_test_your_stripe_test_key_here`)
- Ensure `STRIPE_WEBHOOK_SECRET` is configured for test webhooks
- Verify database is connected and migrations are applied
- Start the development server: `npm run dev`

### 2. Stripe Test Mode Setup
- Use Stripe test card numbers for payments
- Configure webhook endpoints in Stripe dashboard
- Set up test products and prices in Stripe

## Test Scenarios

### 1. New User Subscription Flow

#### Test Case: Free User Subscribes to Monthly Plan
**Steps:**
1. Sign up as a new user
2. Navigate to `/pricing`
3. Click "Start Monthly Plan" button
4. Complete Stripe checkout with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
5. Verify redirect to `/dashboard?subscription=success&plan=Monthly Plan`
6. Check billing page shows active subscription
7. Verify monthly usage is reset to 0
8. Confirm receipt limit is now unlimited

**Expected Results:**
- ✅ User redirected to dashboard with success message
- ✅ Subscription status shows "Active"
- ✅ Billing page displays correct plan details
- ✅ Receipt creation is unlimited
- ✅ No more "5 receipt limit" warnings

#### Test Case: Free User Subscribes to 6-Month Plan
**Steps:**
1. Follow same steps as above but choose 6-Month Plan
2. Verify plan name shows correctly in billing
3. Check that savings are properly calculated

**Expected Results:**
- ✅ Plan shows as "6-Month Plan" 
- ✅ Billing shows $48 upfront payment
- ✅ Monthly equivalent shows $8/month

### 2. Subscription Status Verification

#### Test Case: Webhook Processing
**Steps:**
1. Complete a subscription payment
2. Check server logs for webhook events
3. Verify database is updated with subscription data
4. Confirm monthly usage is reset

**Expected Results:**
- ✅ Webhook logs show successful processing
- ✅ Database `teams` table updated with subscription data
- ✅ `monthly_usage` table shows receipt count reset to 0

#### Test Case: Real-time Status Updates
**Steps:**
1. Subscribe to a plan
2. Immediately check billing page
3. Verify subscription status updates without page refresh
4. Test that SWR polling works (every 5 seconds)

**Expected Results:**
- ✅ Billing page shows subscription status immediately
- ✅ Status updates automatically without manual refresh
- ✅ No loading states or delays

### 3. Limit Enforcement Testing

#### Test Case: Free User Limit Enforcement
**Steps:**
1. Create 5 receipts as free user
2. Try to create 6th receipt
3. Verify buttons are disabled
4. Check warning messages appear

**Expected Results:**
- ✅ 6th receipt creation is blocked
- ✅ UI shows "Monthly limit reached" warning
- ✅ Create/Edit/Download buttons are disabled
- ✅ Upgrade prompt appears

#### Test Case: Paid User Unlimited Access
**Steps:**
1. Subscribe to any paid plan
2. Create multiple receipts (more than 5)
3. Verify no limits are enforced
4. Check all features are accessible

**Expected Results:**
- ✅ Can create unlimited receipts
- ✅ No limit warnings appear
- ✅ All buttons remain enabled
- ✅ Full feature access

### 4. Billing Page Functionality

#### Test Case: Subscription Management
**Steps:**
1. Access billing page with active subscription
2. Test "Manage Subscription" button (Stripe Customer Portal)
3. Test "Cancel Subscription" functionality
4. Verify subscription status updates

**Expected Results:**
- ✅ Customer portal opens correctly
- ✅ Cancellation works as expected
- ✅ Status updates reflect in real-time
- ✅ Billing history shows correctly

#### Test Case: Plan Switching
**Steps:**
1. Subscribe to Monthly Plan
2. Use "Switch to 6-Month Plan" option
3. Verify plan change is processed
4. Check billing reflects new plan

**Expected Results:**
- ✅ Plan switch completes successfully
- ✅ Billing shows new plan details
- ✅ Proration is handled correctly
- ✅ No service interruption

### 5. Pricing Page State Management

#### Test Case: Subscribed User Pricing Page
**Steps:**
1. Subscribe to any plan
2. Navigate to `/pricing`
3. Verify subscription status is shown
4. Confirm pricing cards are hidden

**Expected Results:**
- ✅ Shows "You're currently subscribed" message
- ✅ Displays current plan name
- ✅ Pricing cards are hidden
- ✅ "Manage Subscription" link works

#### Test Case: Non-subscribed User Pricing Page
**Steps:**
1. Access pricing page as free user
2. Verify all pricing cards are visible
3. Test checkout links work
4. Confirm no subscription status shown

**Expected Results:**
- ✅ All pricing cards visible
- ✅ Checkout links redirect to Stripe
- ✅ No subscription status message
- ✅ Clear call-to-action buttons

### 6. Error Handling

#### Test Case: Payment Failure
**Steps:**
1. Use test card `4000 0000 0000 0002` (declined)
2. Complete checkout process
3. Verify error handling

**Expected Results:**
- ✅ Payment failure is handled gracefully
- ✅ User sees appropriate error message
- ✅ No subscription is created
- ✅ User can retry payment

#### Test Case: Webhook Failure
**Steps:**
1. Temporarily disable webhook endpoint
2. Complete a payment
3. Re-enable webhook
4. Verify subscription syncs when webhook processes

**Expected Results:**
- ✅ Payment completes successfully
- ✅ Subscription activates when webhook processes
- ✅ No data loss occurs
- ✅ System remains functional

## Test Data

### Stripe Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

### Test Scenarios
- **New User**: Create account and subscribe immediately
- **Existing User**: Subscribe with existing account
- **Plan Upgrade**: Switch from free to paid
- **Plan Downgrade**: Cancel subscription and return to free
- **Payment Retry**: Handle failed payments and retries

## Verification Checklist

### ✅ Subscription Creation
- [ ] Stripe checkout completes successfully
- [ ] User redirected to dashboard with success message
- [ ] Database updated with subscription data
- [ ] Monthly usage reset to 0
- [ ] Receipt limits removed

### ✅ Real-time Updates
- [ ] Billing page shows subscription status immediately
- [ ] SWR polling updates data every 5 seconds
- [ ] No manual refresh required
- [ ] Status changes reflect instantly

### ✅ Limit Enforcement
- [ ] Free users limited to 5 receipts/month
- [ ] Paid users have unlimited access
- [ ] UI clearly shows limit status
- [ ] Upgrade prompts appear when needed

### ✅ Billing Management
- [ ] Customer portal access works
- [ ] Plan switching functions correctly
- [ ] Cancellation process works
- [ ] Billing history displays properly

### ✅ Pricing Page States
- [ ] Subscribed users see current plan
- [ ] Non-subscribed users see pricing cards
- [ ] No duplicate subscription prompts
- [ ] Clear navigation to billing

### ✅ Error Handling
- [ ] Payment failures handled gracefully
- [ ] Webhook failures don't break system
- [ ] Error messages are user-friendly
- [ ] Recovery mechanisms work

## Post-Testing Actions

### 1. Clean Up Test Data
- Cancel test subscriptions in Stripe dashboard
- Clear test data from database if needed
- Reset any test configurations

### 2. Documentation
- Update any documentation based on test results
- Note any edge cases discovered
- Document any configuration requirements

### 3. Production Readiness
- Verify all environment variables are set
- Confirm webhook endpoints are configured
- Test with production Stripe keys (if available)
- Review security settings

## Troubleshooting

### Common Issues
1. **Webhook not processing**: Check webhook secret and endpoint URL
2. **Subscription not updating**: Verify database queries and webhook handlers
3. **UI not reflecting changes**: Check SWR configuration and API responses
4. **Payment failures**: Verify Stripe test mode and card numbers

### Debug Steps
1. Check server logs for webhook events
2. Verify database state directly
3. Test API endpoints manually
4. Check browser network tab for API calls
5. Verify Stripe dashboard for payment status

## Success Criteria

The subscription flow is working correctly when:
- ✅ Users can subscribe and immediately access paid features
- ✅ Subscription status updates in real-time across all pages
- ✅ Free user limits are properly enforced
- ✅ Billing management works seamlessly
- ✅ Error scenarios are handled gracefully
- ✅ No data loss or inconsistencies occur

This testing ensures a robust, user-friendly subscription experience that converts free users to paid subscribers effectively. 