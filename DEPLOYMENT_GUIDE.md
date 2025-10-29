# 🚀 Deployment Guide - Intix AI Interview Coach

## Quick Start (Development)

### Option 1: One-Click Start (Recommended)
```bash
# Just double-click this file:
start-all.bat
```
This will:
- ✅ Start backend on http://localhost:8000
- ✅ Start frontend on http://localhost:5173
- ✅ Open both in separate terminal windows
- ✅ Stop both when you press any key

### Option 2: Using npm (Alternative)
```bash
# Install concurrently first (one time only)
npm install

# Start both servers
npm start
```

---

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free Tier Available)

#### Backend Deployment (Render)

1. **Create account** at https://render.com

2. **New Web Service**
   - Connect your GitHub repo
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ALLOWED_ORIGINS=https://your-frontend-url.netlify.app
   ```

4. **Deploy** → Get backend URL (e.g., `https://intix-backend.onrender.com`)

#### Frontend Deployment (Netlify)

1. **Create account** at https://netlify.com

2. **New Site from Git**
   - Connect your GitHub repo
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   ```
   VITE_API_URL=https://intix-backend.onrender.com
   ```

4. **Deploy** → Get frontend URL (e.g., `https://intix.netlify.app`)

---

### Option 2: Vercel + Railway

#### Backend (Railway)
```bash
# Railway CLI
railway login
railway init
railway up

# Add environment variables in Railway dashboard
GEMINI_API_KEY=your_key
```

#### Frontend (Vercel)
```bash
# Vercel CLI
npm i -g vercel
cd frontend
vercel

# Add environment variable
VITE_API_URL=your_railway_backend_url
```

---

### Option 3: Docker (All Platforms)

#### Create Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Create Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:8000
```

**Run with Docker:**
```bash
docker-compose up -d
```

---

### Option 4: AWS (Production Grade)

#### Backend (AWS Elastic Beanstalk)
```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init -p python-3.9 intix-backend

# Create environment
eb create intix-backend-env

# Set environment variables
eb setenv GEMINI_API_KEY=your_key

# Deploy
eb deploy
```

#### Frontend (AWS S3 + CloudFront)
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://intix-frontend

# Create CloudFront distribution
# Point to S3 bucket
# Add custom domain (optional)
```

---

### Option 5: Heroku (Simple but Paid)

#### Backend
```bash
# Login
heroku login

# Create app
cd backend
heroku create intix-backend

# Add buildpack
heroku buildpacks:set heroku/python

# Set environment variables
heroku config:set GEMINI_API_KEY=your_key

# Deploy
git push heroku main
```

#### Frontend
```bash
# Create app
cd frontend
heroku create intix-frontend

# Add buildpack
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set VITE_API_URL=https://intix-backend.herokuapp.com

# Deploy
git push heroku main
```

---

## 🔧 Configuration for Deployment

### Backend Environment Variables
```env
# .env (backend)
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:5173
PORT=8000
```

### Frontend Environment Variables
```env
# .env (frontend)
VITE_API_URL=https://your-backend-domain.com
```

---

## 📦 Pre-Deployment Checklist

### Backend
- [ ] `requirements.txt` is up to date
- [ ] `.env.example` exists with all variables
- [ ] CORS configured with production domain
- [ ] API key is set as environment variable (not hardcoded)
- [ ] Health check endpoint works (`/api/health`)

### Frontend
- [ ] `package.json` dependencies are correct
- [ ] Build command works (`npm run build`)
- [ ] API URL is environment variable (not hardcoded)
- [ ] Production build is optimized
- [ ] Assets are properly referenced

---

## 🚀 Recommended Deployment Stack

### For Free Tier / Learning
```
Backend:  Render (Free tier, auto-sleep after 15 min)
Frontend: Netlify (Free tier, unlimited bandwidth)
Database: Not needed (in-memory storage)
```

### For Production
```
Backend:  AWS Elastic Beanstalk or Railway
Frontend: Vercel or Netlify
Database: PostgreSQL (if adding persistence)
CDN:      CloudFront or Cloudflare
```

---

## 🔒 Security Checklist

### Before Deployment
- [ ] Remove all console.log statements
- [ ] Set secure CORS origins
- [ ] Use HTTPS only
- [ ] Environment variables for all secrets
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose internals

---

## 📊 Monitoring & Maintenance

### Backend Monitoring
```python
# Add to main.py
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
```

### Frontend Monitoring
- Use Vercel Analytics
- Add Google Analytics
- Monitor error logs
- Track user sessions

---

## 🐛 Troubleshooting Deployment

### Common Issues

#### CORS Errors
```python
# backend/main.py
allowed_origins = [
    "https://your-frontend.netlify.app",
    "http://localhost:5173"  # for development
]
```

#### API URL Not Working
```javascript
// frontend/.env
VITE_API_URL=https://your-backend.onrender.com
// No trailing slash!
```

#### Build Failures
```bash
# Clear cache and rebuild
npm clean-install
npm run build
```

#### Backend Not Starting
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

---

## 💰 Cost Estimates

### Free Tier (Perfect for Portfolio)
```
Backend:  Render Free (auto-sleep)
Frontend: Netlify Free
Total:    $0/month
```

### Hobby Tier (Always On)
```
Backend:  Render Starter ($7/month)
Frontend: Netlify Free
Total:    $7/month
```

### Production Tier
```
Backend:  AWS EB ($25-50/month)
Frontend: Vercel Pro ($20/month)
Database: AWS RDS ($15/month)
Total:    $60-85/month
```

---

## 🎯 Quick Deploy Commands

### Deploy to Render + Netlify (Recommended)

**Backend (Render):**
1. Push code to GitHub
2. Go to render.com → New Web Service
3. Connect repo → Select `backend` folder
4. Add environment variables
5. Deploy!

**Frontend (Netlify):**
1. Go to netlify.com → New Site
2. Connect repo → Select `frontend` folder
3. Build: `npm run build`
4. Publish: `dist`
5. Add environment variable: `VITE_API_URL`
6. Deploy!

---

## 📝 Deployment Notes

### Why Separate Backend and Frontend?

**Advantages:**
- ✅ Independent scaling
- ✅ Different hosting requirements
- ✅ Better security (API separate from static files)
- ✅ Easier to update one without affecting other
- ✅ Use best platform for each (Render for Python, Netlify for React)

**For Development:**
- Use `start-all.bat` to run both locally
- Both run on localhost
- Easy debugging

**For Production:**
- Backend on Render/Railway/AWS
- Frontend on Netlify/Vercel
- Connected via API URL

---

## 🔄 CI/CD Setup (Optional)

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          # Render auto-deploys on push
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        run: |
          # Netlify auto-deploys on push
```

---

## ✅ Final Checklist

### Before Going Live
- [ ] Test all features locally
- [ ] Backend health check works
- [ ] Frontend connects to backend
- [ ] Resume upload works
- [ ] Interview session works
- [ ] Report generation works
- [ ] Share feature works
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)

---

## 🎉 Summary

### Development (Local)
```bash
# One command to rule them all!
start-all.bat
```

### Production (Deployed)
```
Backend:  Render.com (Free tier)
Frontend: Netlify.com (Free tier)
Total:    $0/month
Time:     ~15 minutes to deploy
```

### Why This Setup?
- ✅ **Free**: Both platforms have generous free tiers
- ✅ **Easy**: Push to GitHub, auto-deploy
- ✅ **Fast**: Global CDN for frontend
- ✅ **Reliable**: 99.9% uptime
- ✅ **Scalable**: Upgrade when needed
- ✅ **Professional**: Production-grade infrastructure

---

**Ready to deploy? Just follow the Render + Netlify steps above!** 🚀

**For local development, just run `start-all.bat` and you're good to go!** ✨
