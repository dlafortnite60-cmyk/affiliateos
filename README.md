# AffiliateOS — Performance Marketing Dashboard

A full-stack Next.js + Supabase app for managing affiliate offers, funnels, creatives, and campaign metrics with automatic KPI calculations.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **CSV Parsing**: PapaParse
- **Deployment**: Vercel + Supabase Cloud

---

## 🚀 Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/your-org/affiliateos.git
cd affiliateos
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it `affiliateos`, choose a region close to your users
3. Wait for the project to spin up (~2 min)

### 3. Run the database schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **Run**

This creates all 4 tables, indexes, RLS policies, and the `campaign_metrics` view.

### 4. Get your API keys

In Supabase dashboard → **Settings** → **API**:

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/affiliateos.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**

### 3. Configure Supabase Auth redirect URLs

In Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/**`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/           # Main dashboard with KPIs + charts
│   │   ├── page.tsx         # Server component (data fetching)
│   │   └── DashboardClient.tsx  # Client component (filters, charts)
│   ├── offers/              # Offers CRUD
│   │   ├── page.tsx         # List
│   │   ├── new/page.tsx     # Create
│   │   └── [id]/page.tsx    # Edit
│   ├── funnels/             # Funnels CRUD (same pattern)
│   ├── creatives/           # Creatives CRUD (same pattern)
│   ├── campaigns/           # Campaign metrics CRUD + table
│   │   ├── page.tsx
│   │   ├── CampaignsTableClient.tsx  # Filterable table
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── import/              # CSV import wizard
│   │   └── page.tsx
│   └── login/page.tsx       # Auth
├── components/
│   ├── ui/
│   │   ├── index.tsx        # Badge, Button, MetricCard, PageHeader, etc.
│   │   └── FilterBar.tsx    # Reusable filter bar
│   ├── charts/
│   │   └── index.tsx        # Recharts wrappers
│   ├── forms/
│   │   ├── OfferForm.tsx
│   │   ├── FunnelForm.tsx
│   │   ├── CreativeForm.tsx
│   │   └── CampaignForm.tsx
│   └── layout/
│       └── Sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser Supabase client
│   │   └── server.ts        # Server Supabase client
│   ├── metrics.ts           # KPI calculations (CTR, CPA, ROI, etc.)
│   ├── csv.ts               # CSV import/export with source mappings
│   └── utils.ts             # cn() helper
├── types/
│   └── index.ts             # All TypeScript types
└── middleware.ts             # Auth guard
```

---

## 📊 Metrics Calculated Automatically

| Metric | Formula |
|--------|---------|
| CTR | Clicks / Impressions × 100 |
| CPC | Spend / Clicks |
| CPM | Spend / Impressions × 1,000 |
| CVR | Sales / Clicks × 100 |
| CPA | Spend / Sales |
| Profit | Revenue − Spend |
| ROI | (Revenue − Spend) / Spend × 100 |
| EPC | Revenue / Clicks |

---

## 📥 CSV Import Sources

The app supports direct CSV exports from:

| Source | Instructions |
|--------|-------------|
| **Generic template** | Download template from Import page |
| **Meta Ads Manager** | Reports → Campaigns → Export → CSV |
| **TikTok Ads** | Ads Manager → Custom Report → Export |
| **Keitaro** | Reports → Campaign report → Export CSV |

Column headers are automatically mapped per source. After import, link campaigns to Offers/Funnels from the edit page.

---

## 🔮 Extending: API Integrations (Roadmap)

The `source` column on campaigns and the CSV import architecture are designed for easy extension.

### Adding Meta Ads API

1. Create `src/lib/integrations/meta.ts`
2. Use Meta Marketing API `/insights` endpoint
3. Map response to `ParsedCampaignRow` (same type as CSV import)
4. Reuse the bulk insert logic from `ImportPage`

```typescript
// src/lib/integrations/meta.ts
export async function fetchMetaCampaigns(accessToken: string, dateRange: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=campaigns{insights{...}}&access_token=${accessToken}`)
  // Map to ParsedCampaignRow[] and return
}
```

### Adding TikTok Ads API

Same pattern — create `src/lib/integrations/tiktok.ts`, map to `ParsedCampaignRow`.

### Adding Keitaro Postback

Add a Route Handler at `src/app/api/postback/keitaro/route.ts` to receive real-time conversion data.

### Adding affiliate network postbacks (e.g. HasOffers, Cake)

```typescript
// src/app/api/postback/[network]/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  // Parse postback params → update campaign sales/revenue
}
```

---

## 🔐 Security Notes

- All tables use **Row Level Security** — users can only see their own data
- Auth is handled by Supabase (bcrypt passwords, JWTs, secure cookies)
- The anon key is safe to expose publicly — RLS prevents data leakage
- Never expose your `service_role` key in client-side code

---

## 🛠 Useful Supabase Queries

```sql
-- Check your data
SELECT * FROM campaign_metrics ORDER BY date DESC LIMIT 20;

-- Best performing offers by ROI
SELECT offer_name, SUM(profit) as total_profit, AVG(roi) as avg_roi
FROM campaign_metrics
WHERE user_id = auth.uid()
GROUP BY offer_name ORDER BY avg_roi DESC;

-- Campaigns ready to scale (ROI > 50%, spend > $100)
SELECT campaign_name, spend, revenue, profit, roi
FROM campaign_metrics
WHERE roi > 50 AND spend > 100
ORDER BY roi DESC;
```

---

## 🐛 Troubleshooting

**"relation does not exist" error**
→ Make sure you ran the schema SQL in Supabase SQL Editor

**Auth redirect loop**
→ Check that your Supabase Site URL matches your deployment URL exactly

**RLS blocking queries**
→ Make sure you're inserting `user_id: user.id` in all insert operations

**CSV import not detecting columns**
→ Make sure the CSV export header language matches — try the Generic template first
