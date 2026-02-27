# Vercel Deployment Guide

## Error: "Application error: a server-side exception has occurred"

This error typically occurs due to missing environment variables or database connection issues.

## Setup Steps

### 1. Set Up PostgreSQL Database

Choose one of these providers:
- **Neon** (Recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **Vercel Postgres**: Available in Vercel dashboard

After creating your database, you'll get two connection strings:
- `DATABASE_URL` - For regular database operations
- `DIRECT_URL` - For migrations (often the same as DATABASE_URL)

### 2. Configure Environment Variables in Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project → **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Variables:

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
GEMINI_API_KEY=...
RESEND_API_KEY=re_...
```

#### Optional Variables:

```
ARCJET_KEY=ajkey_...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-prod-...
NODE_ENV=production
```

### 3. Generate API Keys

#### Clerk (Authentication)
1. Go to https://dashboard.clerk.com/
2. Create a new application
3. Copy the API keys from the dashboard

#### Gemini AI (Google)
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key

#### Resend (Email)
1. Go to https://resend.com/
2. Sign up and verify your email
3. Create an API key in the dashboard

#### Arcjet (Optional - Security)
1. Go to https://app.arcjet.com/
2. Sign up and create a site
3. Copy the API key

#### Inngest (Optional - Background Jobs)
1. Go to https://www.inngest.com/
2. Sign up and create an app
3. Copy the event key and singing key

### 4. Deploy

After adding all environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Select **Use existing Build Cache** (uncheck this)
4. Click **Redeploy**

### 5. Run Database Migrations

After successful deployment, you need to run Prisma migrations:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run migrations in production
vercel env pull .env.production
npx prisma migrate deploy
```

**Option B: Using Prisma Studio & Direct Connection**
1. Use your `DIRECT_URL` to connect to your database
2. Run migrations locally pointing to production database:
```bash
DATABASE_URL="your-direct-url-here" npx prisma migrate deploy
```

### 6. Verify Deployment

After redeployment:
1. Visit your Vercel URL
2. Check if the app loads without errors
3. Try signing up/logging in
4. Test creating accounts and transactions

## Common Issues

### Issue 1: Middleware Error
**Error:** Middleware failing on startup
**Solution:** The app now runs without ARCJET_KEY. If you want Arcjet protection, add the key.

### Issue 2: Database Connection Error
**Error:** "Can't reach database server"
**Solution:** 
- Verify DATABASE_URL is correct and includes `?sslmode=require`
- Check if your database is active
- For Neon: Make sure your database isn't suspended (free tier)

### Issue 3: Clerk Authentication Error
**Error:** "Clerk: Missing publishable key"
**Solution:**
- Add both NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
- Make sure keys are from the same Clerk application

### Issue 4: Build Fails
**Error:** "Prisma Client not generated"
**Solution:** The `postinstall` script in package.json should handle this, but if not:
- Add `SKIP_ENV_VALIDATION=true` to environment variables
- Ensure `prisma generate` runs during build

### Issue 5: API Routes Fail
**Error:** 500 error on API routes
**Solution:**
- Check Vercel function logs: Project → Deployments → Click deployment → View Function Logs
- Ensure all required environment variables are set
- Check for missing API keys (GEMINI_API_KEY, RESEND_API_KEY)

## Monitoring & Debugging

### View Logs
1. Go to your Vercel project dashboard
2. Click on **Deployments**
3. Click on the latest deployment
4. Scroll down to **Functions** section
5. Click on any function to see its logs

### Check Build Logs
1. Go to **Deployments**
2. Click on a deployment
3. View the build logs to see if there are any errors during build time

## Need Help?

If you're still experiencing issues:
1. Check Vercel function logs for specific error messages
2. Verify all environment variables are correctly set
3. Ensure your database is accessible and migrations are applied
4. Check that your PostgreSQL database accepts connections from Vercel's IP ranges

## Quick Checklist

- [ ] PostgreSQL database created
- [ ] DATABASE_URL added to Vercel
- [ ] DIRECT_URL added to Vercel
- [ ] Clerk keys added to Vercel
- [ ] GEMINI_API_KEY added to Vercel
- [ ] RESEND_API_KEY added to Vercel
- [ ] Redeployed after adding variables
- [ ] Database migrations applied
- [ ] Tested sign-in functionality
- [ ] Checked Vercel function logs for errors
