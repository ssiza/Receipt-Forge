# ReceiptForge

ReceiptForge is a professional receipt and invoice generator built with **Next.js**. Create beautiful, branded receipts with ease using our intuitive interface, Stripe integration for payments, and a comprehensive dashboard for managing your business receipts.

**Demo: [https://receiptforge.vercel.app/](https://receiptforge.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) which connects to Stripe Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/yourusername/ReceiptForge
cd ReceiptForge
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `demo@receiptforge.com`
- Password: `demo123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

When you're ready to deploy ReceiptForge to production, follow these steps:

### Quick Start

1. **Run the deployment setup script:**
   ```bash
   npm run deploy:setup
   ```

2. **Follow the comprehensive deployment guide:**
   - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
   - Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step verification

### Required Environment Variables

Set these environment variables in your production environment:

```bash
# Database
POSTGRES_URL=postgresql://username:password@host:port/database

# Authentication
AUTH_SECRET=your-32-character-secret-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here # Production Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here # Production webhook secret

# Application
BASE_URL=https://yourdomain.com # Your production domain
```

### Deployment Options

- **Vercel** (Recommended): [vercel.com](https://vercel.com)
- **Railway**: [railway.app](https://railway.app)
- **Netlify**: [netlify.com](https://netlify.com)

### Health Check

After deployment, verify your application is healthy:
- Health check endpoint: `https://yourdomain.com/api/health`
- Should return: `{"status":"healthy","database":"connected"}`

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
