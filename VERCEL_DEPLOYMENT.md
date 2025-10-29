# 🚀 Deploy to Vercel - Complete Guide

## ✨ Why Vercel?

**Perfect for React/Vite apps!**
- ✅ **Free tier** - Generous limits
- ✅ **Super fast** - Global CDN
- ✅ **Auto-deploy** - Push to GitHub = Deploy
- ✅ **Easy setup** - 5 minutes
- ✅ **HTTPS included** - Free SSL
- ✅ **Custom domains** - Free

---

## 🎯 Deployment Options

### Option 1: Frontend on Vercel + Backend on Render (Recommended)
```
Frontend: Vercel (Free, super fast)
Backend:  Render (Free, Python support)
Cost:     $0/month
```

### Option 2: Both on Vercel (Possible but tricky)
```
Frontend: Vercel (Easy)
Backend:  Vercel Serverless Functions (Requires changes)
Cost:     $0/month
Note:     Need to convert FastAPI to serverless
```

---

## 🚀 Quick Deploy - Frontend to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. **Go to https://vercel.com**
   - Sign up with GitHub (free)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Vercel auto-detects it's a Vite project!

3. **Configure**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables**
   - Click "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-backend.onrender.com`
   - (You'll get backend URL after deploying backend)

5. **Deploy!**
   - Click "Deploy"
   - Wait 1-2 minutes
   - Get URL: `https://intix.vercel.app`

#### Option B: Using Vercel CLI (For Developers)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from frontend folder
cd frontend
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? intix
# - Directory? ./
# - Override settings? No

# Add environment variable
vercel env add VITE_API_URL

# Deploy to production
vercel --prod
```

---

## 🔧 Backend Options for Vercel

### Option 1: Keep Backend on Render (Recommended)

**Why?**
- ✅ Render is built for Python/FastAPI
- ✅ No code changes needed
- ✅ Easy to set up
- ✅ Free tier available

**Setup:**
1. Deploy backend to Render (see DEPLOYMENT_GUIDE.md)
2. Get backend URL: `https://intix-backend.onrender.com`
3. Add to Vercel as `VITE_API_URL`

---

### Option 2: Backend on Vercel Serverless (Advanced)

**Requires converting FastAPI to serverless functions**

Create `api/index.py`:
```python
from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

# Your routes here
@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Vercel handler
handler = Mangum(app)
```

Create `vercel.json` in root:
```json
{
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

**Challenges:**
- ❌ Need to refactor code
- ❌ Serverless has limitations (cold starts, timeouts)
- ❌ MediaPipe might not work in serverless
- ❌ File uploads are tricky

**Verdict:** Not recommended for this project. Use Render for backend!

---

## 📋 Complete Deployment Plan

### Recommended Setup

```
┌─────────────────────────────────────┐
│                                     │
│  Frontend (React + Vite)            │
│  Deployed on: Vercel                │
│  URL: https://intix.vercel.app      │
│  Cost: $0/month                     │
│                                     │
└──────────────┬──────────────────────┘
               │
               │ API Calls
               ↓
┌─────────────────────────────────────┐
│                                     │
│  Backend (FastAPI + Gemini)         │
│  Deployed on: Render                │
│  URL: https://intix-backend.onrender.com │
│  Cost: $0/month                     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 Step-by-Step Deployment

### Phase 1: Deploy Backend to Render

1. **Go to Render.com**
   - Sign up (free)
   - New Web Service
   - Connect GitHub repo

2. **Configure**
   ```
   Name: intix-backend
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   ```
   GEMINI_API_KEY = your_actual_gemini_key
   ALLOWED_ORIGINS = https://intix.vercel.app
   ```

4. **Deploy & Get URL**
   - Example: `https://intix-backend.onrender.com`
   - Test: Visit `https://intix-backend.onrender.com/api/health`

---

### Phase 2: Deploy Frontend to Vercel

1. **Go to Vercel.com**
   - Sign up with GitHub
   - Import Project
   - Select your repo

2. **Configure**
   ```
   Framework: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

3. **Environment Variables**
   ```
   VITE_API_URL = https://intix-backend.onrender.com
   ```
   ⚠️ **Important:** Use your actual Render backend URL!

4. **Deploy & Get URL**
   - Example: `https://intix.vercel.app`
   - Visit and test!

---

### Phase 3: Update CORS

Update backend to allow Vercel domain:

```python
# backend/main.py
allowed_origins = [
    "https://intix.vercel.app",  # Your Vercel URL
    "http://localhost:5173"       # For local development
]
```

Push changes:
```bash
git add .
git commit -m "Update CORS for Vercel"
git push origin main
```

Render will auto-deploy the update!

---

## 🔄 Auto-Deployment Workflow

```bash
# Make changes to your code
git add .
git commit -m "Added new feature"
git push origin main

# 🎉 Automatic deployment!
# ✅ Vercel rebuilds frontend (1-2 min)
# ✅ Render rebuilds backend (2-3 min)
# ✅ Both live with latest changes!
```

---

## 🎨 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. **Buy domain** (e.g., intix.ai from Namecheap)

2. **In Vercel Dashboard**
   - Go to your project
   - Settings → Domains
   - Add domain: `intix.ai`

3. **Update DNS**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     ```

4. **Wait for DNS propagation** (5-60 minutes)

5. **Done!** Your app is now at `https://intix.ai`

---

## 💰 Cost Breakdown

### Free Tier (Perfect for Portfolio)
```
Frontend (Vercel Free):
- 100GB bandwidth/month
- Unlimited deployments
- Auto HTTPS
- Custom domain included
- Cost: $0/month

Backend (Render Free):
- 750 hours/month
- Auto-sleep after 15 min
- Wakes in ~30 seconds
- Cost: $0/month

Total: $0/month ✨
```

### Hobby Tier (Always On)
```
Frontend (Vercel Free):
- Still free!
- Cost: $0/month

Backend (Render Starter):
- Always on, no sleep
- 512MB RAM
- Cost: $7/month

Total: $7/month
```

### Pro Tier (Production)
```
Frontend (Vercel Pro):
- 1TB bandwidth
- Analytics
- Cost: $20/month

Backend (Render Pro):
- 2GB RAM
- Better performance
- Cost: $25/month

Total: $45/month
```

---

## 🔍 Vercel vs Netlify

| Feature | Vercel | Netlify |
|---------|--------|---------|
| **Best For** | React/Next.js | Any static site |
| **Speed** | ⚡ Super fast | ⚡ Very fast |
| **Free Tier** | 100GB bandwidth | 100GB bandwidth |
| **Auto-deploy** | ✅ Yes | ✅ Yes |
| **HTTPS** | ✅ Free | ✅ Free |
| **Custom Domain** | ✅ Free | ✅ Free |
| **Analytics** | ✅ Built-in | ✅ Built-in |
| **Edge Functions** | ✅ Yes | ✅ Yes |

**Verdict:** Both are excellent! Choose based on preference.

---

## 🐛 Troubleshooting

### Issue: API calls fail (CORS error)

**Solution:**
```python
# backend/main.py - Update CORS
allowed_origins = [
    "https://intix.vercel.app",  # Add your Vercel URL
    "http://localhost:5173"
]
```

### Issue: Environment variable not working

**Solution:**
```bash
# In Vercel dashboard:
# Settings → Environment Variables
# Add: VITE_API_URL = https://your-backend-url.onrender.com
# Redeploy: Deployments → ... → Redeploy
```

### Issue: 404 on refresh

**Solution:**
Already fixed! The `vercel.json` I created handles this:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Issue: Build fails

**Solution:**
```bash
# Check build locally first:
cd frontend
npm install
npm run build

# If it works locally, it should work on Vercel
```

---

## ✅ Deployment Checklist

### Before Deploying

- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render
- [ ] Backend URL obtained
- [ ] CORS configured with Vercel domain
- [ ] Environment variables ready

### Vercel Setup

- [ ] Signed up on Vercel
- [ ] Repository connected
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variable `VITE_API_URL` added
- [ ] Deployed successfully

### Testing

- [ ] Frontend loads
- [ ] API calls work
- [ ] Resume upload works
- [ ] Interview session works
- [ ] Report generation works
- [ ] Share feature works

---

## 🎯 Quick Commands

### Deploy Frontend to Vercel
```bash
# Using CLI
cd frontend
vercel --prod

# Or just push to GitHub
git push origin main
# Vercel auto-deploys!
```

### Update Environment Variable
```bash
# Using CLI
vercel env add VITE_API_URL production

# Or in dashboard:
# Settings → Environment Variables → Add
```

### View Logs
```bash
# Using CLI
vercel logs

# Or in dashboard:
# Deployments → Click deployment → View logs
```

---

## 📊 Performance Comparison

### Vercel
```
Global CDN: ✅ Yes (70+ locations)
Build Time: ~1-2 minutes
Deploy Time: ~30 seconds
First Load: ⚡ Super fast
Uptime: 99.99%
```

### Netlify
```
Global CDN: ✅ Yes (100+ locations)
Build Time: ~1-2 minutes
Deploy Time: ~30 seconds
First Load: ⚡ Super fast
Uptime: 99.99%
```

**Both are excellent!** Choose Vercel if you prefer their UI/DX.

---

## 🎉 Summary

### Yes, You Can Deploy on Vercel!

**Frontend on Vercel:**
- ✅ Perfect for React/Vite
- ✅ Super easy setup
- ✅ Free tier is generous
- ✅ Auto-deploy on push
- ✅ Global CDN

**Backend on Render:**
- ✅ Perfect for FastAPI
- ✅ Free tier available
- ✅ No code changes needed
- ✅ Easy to configure

**Total Cost:** $0/month (free tier)  
**Total Time:** ~15 minutes to deploy both  
**Result:** Professional, fast, scalable app!

---

## 🚀 Next Steps

1. **Deploy Backend to Render**
   - Follow DEPLOYMENT_GUIDE.md
   - Get backend URL

2. **Deploy Frontend to Vercel**
   - Go to vercel.com
   - Import project
   - Add `VITE_API_URL` environment variable
   - Deploy!

3. **Test Everything**
   - Visit your Vercel URL
   - Try all features
   - Share with friends!

---

**Files Created:**
- ✅ `frontend/vercel.json` - Vercel configuration
- ✅ `VERCEL_DEPLOYMENT.md` - This guide

**Ready to deploy? Just follow the steps above!** 🚀✨
