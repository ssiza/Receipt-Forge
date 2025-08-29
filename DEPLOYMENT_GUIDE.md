# 🚀 ReceiptForge Deployment Guide

This guide will help you deploy ReceiptForge to production. The app is built with Next.js, uses PostgreSQL for the database, and integrates with Stripe for payments.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] A GitHub repository with your code
- [ ] A Stripe account (for payments)
- [ ] A PostgreSQL database (Vercel Postgres, Supabase, or similar)
- [ ] A deployment platform account (Vercel recommended)

## 🔧 Environment Variables

You'll need to set up the following environment variables in your production environment:

### Required Variables

```bash
# Database
POSTGRES_URL=postgresql://username:password@host:port/database

# Authentication
AUTH_SECRET=your-32-character-secret-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # Production Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Production webhook secret

# Application
BASE_URL=https://yourdomain.com # Your production domain
```

### Generating AUTH_SECRET

Generate a secure AUTH_SECRET using:

```bash
openssl rand -base64 32
```

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database
3. Choose PostgreSQL
4. Select your project and region
5. Copy the connection string to `POSTGRES_URL`

### Option 2: Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password

### Option 3: Other PostgreSQL Providers

- **Neon**: [neon.tech](https://neon.tech)
- **Railway**: [railway.app](https://railway.app)
- **PlanetScale**: [planetscale.com](https://planetscale.com)

## 🏗️ Database Migration

After setting up your database, run the migrations:

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed
```

## 💳 Stripe Configuration

### 1. Get Production Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to "Live" mode
3. Go to Developers → API Keys
4. Copy your "Secret key" (starts with `sk_live_`)

### 2. Create Production Webhook

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - Redeploy after adding variables

4. **Run Database Migration**
   ```bash
   # In Vercel dashboard or locally
   npm run db:migrate
   ```

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Railway will auto-deploy on push

### Option 3: Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables

## 🔍 Post-Deployment Checklist

After deployment, verify:

- [ ] **Homepage loads** at your domain
- [ ] **User registration** works
- [ ] **User login** works
- [ ] **Receipt creation** works
- [ ] **PDF generation** works
- [ ] **Stripe payments** work (test with test cards)
- [ ] **Database operations** work
- [ ] **File uploads** work (logos, etc.)

## 🧪 Testing Production

### Test Stripe Integration

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test User Flow

1. Create a new account
2. Create a receipt
3. Download PDF
4. Test payment flow
5. Verify webhook events in Stripe dashboard

## 🔧 Troubleshooting

### Common Issues

**Build Errors**
- Check that all dependencies are in `package.json`
- Ensure TypeScript compilation passes
- Verify environment variables are set

**Database Connection**
- Check `POSTGRES_URL` format
- Ensure database is accessible from your deployment region
- Verify SSL settings if required

**Stripe Webhooks**
- Check webhook endpoint URL is correct
- Verify webhook secret matches
- Test webhook delivery in Stripe dashboard

**PDF Generation**
- Ensure `@react-pdf/renderer` is properly configured
- Check for font loading issues
- Verify image URLs are accessible

### Debug Commands

```bash
# Check build locally
npm run build

# Test database connection
npm run db:setup

# Check environment variables
echo $POSTGRES_URL
echo $STRIPE_SECRET_KEY
```

## 📊 Monitoring

### Recommended Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **Stripe Dashboard**: Payment and webhook monitoring
- **Database Monitoring**: Use your provider's dashboard

### Key Metrics to Monitor

- Page load times
- API response times
- Database query performance
- Stripe webhook success rate
- Error rates and types

## 🔒 Security Considerations

- [ ] Use HTTPS everywhere
- [ ] Keep environment variables secure
- [ ] Regularly update dependencies
- [ ] Monitor for security vulnerabilities
- [ ] Use strong AUTH_SECRET
- [ ] Enable Stripe webhook signature verification

## 📈 Scaling Considerations

- **Database**: Consider connection pooling for high traffic
- **CDN**: Vercel provides global CDN automatically
- **Caching**: Implement appropriate caching strategies
- **Monitoring**: Set up alerts for performance issues

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Vercel/Stripe logs
3. Check GitHub issues for similar problems
4. Ensure all environment variables are correctly set

---

**🎉 Congratulations!** Your ReceiptForge application is now deployed and ready for production use.
