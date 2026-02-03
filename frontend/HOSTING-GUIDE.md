# Video Editor - Hosting Guide

## 🎯 AI-Powered Caption Generation with AssemblyAI

यह application अब AssemblyAI API का use करता है जो affordable और accurate है।

## Features Available
✅ Video Upload
✅ **AI Auto-Caption Generation (AssemblyAI)**
✅ Manual Caption Editor
✅ Timeline Editing
✅ Text Overlay
✅ Video Export

## 🔑 AssemblyAI Setup (Required for Auto-Captions)

1. Go to [AssemblyAI](https://www.assemblyai.com/)
2. Create a free account
3. Get your API key from the dashboard
4. Free tier includes: **100 hours/month** (enough for most projects!)

### Adding API Key:

**For Development:**
```bash
cd backend
# Create .env file
echo "ASSEMBLYAI_API_KEY=your_api_key_here" > .env
```

**For Production (Vercel/Railway):**
Add environment variable in your hosting dashboard:
- Key: `ASSEMBLYAI_API_KEY`
- Value: Your API key from AssemblyAI

## Free/Low-Cost Hosting Options

### Option 1: Vercel (Frontend) + Railway (Backend) - **RECOMMENDED**

#### Frontend (Vercel - FREE)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` = your backend URL

#### Backend (Railway - $5/month)
1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set root directory: `backend`
5. Railway will auto-detect Node.js
6. Add environment variables if needed
7. Get your backend URL and update Vercel's `VITE_API_URL`

### Option 2: Netlify (Frontend) + Render (Backend)

#### Frontend (Netlify - FREE)
1. Go to [netlify.com](https://netlify.com)
2. "Add new site" → "Import from Git"
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment: `VITE_API_URL` = your backend URL

#### Backend (Render - FREE with limits)
1. Go to [render.com](https://render.com)
2. "New +" → "Web Service"
3. Connect GitHub
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

### Option 3: Shared Hosting (Hostinger/Namecheap)
- Cost: ₹100-300/month
- Upload build files via FTP
- Setup Node.js app in cPanel
- Good for small traffic

## Local Development

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm start
```

## Important Notes

1. **No Whisper AI**: Auto-caption feature को disable कर दिया गया है
2. **Manual Captions**: Users को manually captions add करने होंगे
3. **File Storage**: Uploaded videos को cloud storage (AWS S3, Cloudinary) में store करने की recommendation
4. **Database**: अभी file-based storage है, production के लिए MongoDB add करें

## Cost Estimate
- **Free Tier**: Vercel (Frontend) + Render Free (Backend) = ₹0/month
- **Recommended**: Vercel (Frontend) + Railway (Backend) = ~₹400/month
- **With Storage**: Add Cloudinary = +₹500/month

## Support
Questions? Check the README.md or raise an issue on GitHub.
