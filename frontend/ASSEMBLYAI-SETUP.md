# AssemblyAI Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key

1. Visit [https://www.assemblyai.com/](https://www.assemblyai.com/)
2. Click "Sign Up" (Free account)
3. Verify your email
4. Go to Dashboard → Copy your API key

### Step 2: Add API Key to Project

**Option A: For Development (Local)**
```bash
cd backend
echo ASSEMBLYAI_API_KEY=your_actual_api_key_here > .env
```

**Option B: Manual**
1. Create a file named `.env` in the `backend` folder
2. Add this line:
```
ASSEMBLYAI_API_KEY=your_actual_api_key_here
```

### Step 3: Test It!

```bash
# Start backend
cd backend
npm start

# In another terminal, start frontend
npm run dev
```

Upload a video and click "✨ Auto-Generate from Video"

## 🎯 Features

### Free Tier Includes:
- ✅ **100 hours** of transcription per month
- ✅ **English & Hindi** support
- ✅ Word-level timestamps
- ✅ High accuracy (95%+)
- ✅ No credit card required

### Cost After Free Tier:
- $0.25 per hour (~₹20/hour)
- Very affordable for small projects

## 🌍 Supported Languages

- English (en)
- Hindi (hi)
- Auto-detect

## ⚙️ Environment Variables

```env
# Backend .env file
PORT=3000
ASSEMBLYAI_API_KEY=your_api_key_here
MAX_FILE_SIZE=500MB
```

## 🔧 Troubleshooting

### Error: "API key not configured"
- Make sure `.env` file exists in `backend/` folder
- Check API key is correct (no spaces)
- Restart backend server after adding key

### Error: "Failed to extract audio"
- Make sure FFmpeg is installed
- Check video file is valid format (mp4, mov, avi)

### Transcription taking too long?
- AssemblyAI typically takes 15-30% of video duration
- 1 minute video = ~10-15 seconds to transcribe
- 5 minute video = ~1-2 minutes to transcribe

## 📊 API Limits

| Plan | Hours/Month | Cost |
|------|------------|------|
| Free | 100 hours | $0 |
| Pay-as-you-go | Unlimited | $0.25/hour |

## 🎬 How It Works

1. **Upload Video** → Backend extracts audio using FFmpeg
2. **Send to AssemblyAI** → API transcribes with word timestamps
3. **Get Captions** → Returns accurate captions with timing
4. **Edit & Export** → Add to video timeline and export

## 💡 Pro Tips

1. **Use Auto-Detect** for mixed language videos
2. **Manual Edit** captions after generation for 100% accuracy
3. **Save API calls** by generating once and editing manually
4. **Check quality** before exporting final video

## 🆘 Need Help?

- AssemblyAI Docs: [https://www.assemblyai.com/docs](https://www.assemblyai.com/docs)
- Check backend logs for detailed errors
- Ensure backend is running before testing

## ✅ Setup Complete!

Your video editor is now powered by AI! 🎉

Try uploading a video and auto-generating captions.
