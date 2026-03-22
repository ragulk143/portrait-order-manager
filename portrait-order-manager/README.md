# 🎨 Portrait Order Manager

A simple order management tool for portrait artists.
Replaces Instagram DMs with a clean form + dashboard.

**100% Free** — local testing AND online hosting.

---

## Free Stack Summary

| What | Tool | Cost |
|---|---|---|
| Database | Supabase (PostgreSQL) | Free |
| Image storage | Supabase Storage | Free (1 GB) |
| Backend hosting | Render | Free |
| Frontend hosting | Vercel | Free |
| Domain/URL | Vercel gives you one free | Free |

---

# PART 1 — Local Testing (Run on your laptop)

## Step 1 — Create Supabase project (5 minutes)

> You need this first because the app stores data there.

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New project"**, give it a name like `portrait-orders`
3. Set a database password (save it somewhere)
4. Wait ~2 minutes for it to spin up

### Create the orders table

In your Supabase project → go to **SQL Editor** → paste this and click Run:

```sql
CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  whatsapp    TEXT NOT NULL,
  photo_url   TEXT,
  num_people  INTEGER NOT NULL DEFAULT 1,
  size        TEXT NOT NULL DEFAULT 'A4',
  deadline    DATE,
  address     TEXT,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'New',
  payment     TEXT NOT NULL DEFAULT 'Pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Create the image storage bucket

In Supabase → go to **Storage** → click **"New bucket"**:
- Name: `reference-photos`
- Toggle **Public bucket** → ON
- Click Create

### Get your keys

Go to **Settings → API** in your Supabase project. Copy:
- **Project URL** (looks like `https://abcxyz.supabase.co`)
- **service_role** key (under "Project API keys" — the long one labeled `service_role`)

---

## Step 2 — Set up the backend

```bash
cd backend
npm install
```

Copy the env file:
```bash
cp .env.example .env
```

Open `.env` and fill it in:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001
```

Start the backend:
```bash
npm start
# → API running at http://localhost:3001
```

---

## Step 3 — Set up the frontend

```bash
cd frontend
npm install
```

Copy the env file:
```bash
cp .env.example .env
```

Open `.env`:
```
VITE_API_URL=http://localhost:3001
```

Start the frontend:
```bash
npm run dev
# → http://localhost:5173
```

---

## Local URLs

| URL | Who uses it |
|---|---|
| `http://localhost:5173/` | Customers — fill the order form |
| `http://localhost:5173/dashboard` | Artist — manage all orders |
| Click any row | Full order view |

---

# PART 2 — Deploy Online (Free Hosting)

> Do this when you're ready to give your friend a real URL.
> You'll need a GitHub account for this.

---

## Step 1 — Push code to GitHub

1. Go to **https://github.com** → New repository → name it `portrait-order-manager`
2. Run these commands in your project folder:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portrait-order-manager.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render (Free)

1. Go to **https://render.com** → Sign up with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add Environment Variables (click "Environment"):
   ```
   SUPABASE_URL         = https://your-project.supabase.co
   SUPABASE_SERVICE_KEY = your-service-role-key
   FRONTEND_URL         = https://your-app.vercel.app   ← fill this after Step 3
   PORT                 = 3001
   ```
6. Click **Deploy**
7. Copy your backend URL — it looks like `https://portrait-orders.onrender.com`

> ⚠️ Free Render services sleep after 15 minutes of inactivity.
> First request after sleep takes ~30 seconds. That's fine for this use case.

---

## Step 3 — Deploy Frontend on Vercel (Free)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New Project"** → Import your GitHub repo
3. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
4. Add Environment Variable:
   ```
   VITE_API_URL = https://your-backend-name.onrender.com
   ```
5. Click **Deploy**
6. Vercel gives you a free URL like `https://portrait-orders.vercel.app`

---

## Step 4 — Update backend CORS

Go back to Render → your backend service → Environment:

Update `FRONTEND_URL` to your actual Vercel URL:
```
FRONTEND_URL = https://portrait-orders.vercel.app
```

Click **Save** → Render will redeploy automatically.

---

## Final Result

| URL | Share with |
|---|---|
| `https://your-app.vercel.app/` | Customers (put in Instagram bio) |
| `https://your-app.vercel.app/dashboard` | Artist only (bookmark this) |

---

## Customisation

| Change | Where |
|---|---|
| Portrait sizes | `frontend/src/pages/OrderForm.jsx` → size `<select>` |
| Order status options | `Dashboard.jsx` → `STATUS_CONFIG` |
| Artist name in nav | `App.jsx` → nav `<span>` |
| WhatsApp message | `OrderDetail.jsx` → WhatsApp `href` |

---

## Project Structure

```
portrait-order-manager/
├── backend/
│   ├── server.js         ← Express API (connects to Supabase)
│   ├── .env.example      ← Copy to .env and fill in keys
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── OrderForm.jsx     ← Customer order form
    │   │   ├── Dashboard.jsx     ← Artist dashboard
    │   │   └── OrderDetail.jsx   ← Single order view
    │   └── index.css
    ├── .env.example
    └── package.json
```
