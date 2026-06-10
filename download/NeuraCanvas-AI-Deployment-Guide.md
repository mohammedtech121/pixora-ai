# NeuraCanvas AI — Deployment & Monetization Guide

## 🚀 Part 1: Deploy on GitHub + Vercel

### Step 1: Create GitHub Repository

1. Go to **github.com/new**
2. Repository name: `neuracanvas-ai`
3. Set to **Private** (protect your API keys & business logic)
4. Don't initialize with README (we already have code)
5. Click **Create Repository**

### Step 2: Push Code to GitHub

```bash
cd /home/z/my-project

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/neuracanvas-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel

1. Go to **vercel.com** → Sign up / Log in with GitHub
2. Click **"Add New" → "Project"**
3. Select your `neuracanvas-ai` repo
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
5. Add **Environment Variables**:
   - `BLOB_READ_WRITE_TOKEN` — (auto-created when you add Vercel Blob)
   - `KV_REST_API_URL` — (auto-created when you add Vercel KV)
   - `KV_REST_API_TOKEN` — (auto-created when you add Vercel KV)
6. Click **Deploy**

### Step 4: Add Vercel Storage

In your Vercel project dashboard:

1. Go to **Storage** tab
2. Click **Create Database** → Select **Vercel Blob** (free tier: 250MB)
3. Click **Create Database** → Select **Vercel KV** (free tier: 30K commands/day)
4. Both will auto-inject env vars into your project
5. **Redeploy** to pick up the new env vars

### Step 5: Custom Domain (Optional)

1. In Vercel → Settings → Domains
2. Add your domain (e.g., `neuracanvas.ai`)
3. Update DNS records as instructed
4. SSL is automatic

---

## 💰 Part 2: Monetization Strategies

### Strategy 1: Freemium Credits (Recommended)

| Tier | Price | Credits | Features |
|------|-------|---------|----------|
| **Free** | $0 | 10 images/month | Basic styles, 1024x1024 only |
| **Starter** | $9/mo | 100 images/month | All styles, all sizes, HD |
| **Pro** | $29/mo | 500 images/month | Priority queue, upscaling, API access |
| **Enterprise** | $99/mo | Unlimited | Custom models, team features, SLA |

**How to implement:**
- Use **Stripe** for payments (`npm install stripe @stripe/stripe-js`)
- Use **Supabase** or **Vercel Postgres** for user accounts + credit tracking
- Add NextAuth.js for authentication (`npm install next-auth`)

### Strategy 2: Pay-Per-Image

- Charge $0.05–$0.50 per image depending on size/quality
- Implement with Stripe micropayments
- Package deals: 10 images for $2, 50 for $8, 200 for $25

### Strategy 3: API Access (High Revenue)

- Offer REST API for developers
- Charge per API call ($0.02–$0.10/image)
- Use API key authentication + rate limiting
- Documentation with Swagger/OpenAPI

### Strategy 4: Marketplace

- Let users sell their style presets
- Take 20-30% commission
- Featured styles on homepage
- Creator profiles with followers

---

## 🔧 Part 3: Production Enhancements Needed

### Must-Have Before Launch

1. **User Authentication**
   ```bash
   npm install next-auth @auth/prisma-adapter
   ```
   - Google/GitHub OAuth login
   - Email/password with verification

2. **Database (Vercel Postgres)**
   ```bash
   npm install @prisma/client
   npx prisma init
   ```
   - Store users, credits, generation history
   - Replace in-memory job store

3. **Payment Processing (Stripe)**
   ```bash
   npm install stripe @stripe/stripe-js
   ```
   - Checkout sessions for credit packs
   - Webhook for payment confirmation
   - Subscription management

4. **Rate Limiting (Vercel KV)**
   - Limit free users: 10 images/day
   - Prevent abuse with IP + user rate limiting

### Nice-to-Have

5. **Image Upscaling** — Use Real-ESRGAN or AI upscale API
6. **Image Variations** — Generate variations of existing images
7. **Prompt Templates** — Curated prompt library
8. **Social Features** — Share, like, follow creators
9. **API Documentation** — Swagger UI for developer API
10. **Email Notifications** — Welcome emails, low credit alerts

---

## 📊 Part 4: Revenue Projections

### Month 1-3 (Launch)
- 1,000 free users × $0 = $0
- 50 paid users × $15 avg = $750/mo
- **Total: ~$750/mo**

### Month 4-6 (Growth)
- 5,000 free users × $0 = $0
- 250 paid users × $20 avg = $5,000/mo
- API users: 10 × $50 avg = $500/mo
- **Total: ~$5,500/mo**

### Month 7-12 (Scale)
- 20,000 free users
- 1,000 paid users × $25 avg = $25,000/mo
- API users: 50 × $100 avg = $5,000/mo
- Marketplace commission: $2,000/mo
- **Total: ~$32,000/mo**

---

## 🛡️ Part 5: Cost Analysis

### Vercel Costs
- **Hobby** (Free): 100GB bandwidth, serverless functions
- **Pro** ($20/mo): 1TB bandwidth, 60s function timeout
- **Enterprise**: Custom pricing

### AI Generation Costs
- Using z-ai-web-dev-sdk: Included in platform
- If using OpenAI DALL-E: ~$0.040/image (1024×1024)
- If using Stability AI: ~$0.002–$0.01/image

### Other Costs
- Domain: ~$10/year
- Stripe fees: 2.9% + $0.30 per transaction
- Email (Resend): Free tier or $20/mo
- Monitoring (Sentry): Free tier available

---

## ⚡ Quick Start Commands

```bash
# 1. Initialize git and push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/neuracanvas-ai.git
git push -u origin main

# 2. Deploy on Vercel (after connecting repo on vercel.com)

# 3. Add Stripe
npm install stripe @stripe/stripe-js

# 4. Add authentication
npm install next-auth @auth/prisma-adapter

# 5. Add database
npm install @prisma/client
npx prisma init

# 6. Add email
npm install resend

# 7. Local development
npm run dev
```

---

**You're ready to launch! 🚀 Start with GitHub → Vercel → Stripe, and iterate from there.**
