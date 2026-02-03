# Hinglish Conversion Feature Setup

## 🎯 Convert Hindi/English to Hinglish (Roman Hindi)

This feature uses OpenAI API to convert Devanagari Hindi text or mixed Hindi-English text to clean Hinglish (Romanized Hindi).

## 🔑 Setup OpenAI API Key

### Step 1: Get API Key
1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or login
3. Click "Create new secret key"
4. Copy your API key

### Step 2: Add to Backend
```bash
cd backend
echo OPENAI_API_KEY=sk-your_key_here >> .env
```

Or manually edit `backend/.env`:
```env
OPENAI_API_KEY=sk-your_actual_api_key_here
```

### Step 3: Restart Backend
```bash
cd backend
npm start
```

## 💰 Pricing

OpenAI GPT-3.5-turbo (used for conversion):
- **$0.50 per 1M tokens** (input)
- **$1.50 per 1M tokens** (output)
- Average: ~₹1-2 per 100 conversions
- Very affordable for hosting!

## 🎬 How to Use

1. **Upload Video** → Generate Captions with AI
2. **Click "Convert to Hinglish"** button
3. Captions will be converted from Hindi/English to Hinglish
4. Example:
   - Original: "नमस्ते दोस्तों welcome to my channel"
   - Hinglish: "namaste doston welcome to my channel"

## ✨ Features

- ✅ Converts Devanagari Hindi to Roman Hindi
- ✅ Keeps English words unchanged
- ✅ Maintains word count and timing
- ✅ Perfect for YouTube Shorts/Reels
- ✅ Works with mixed Hindi-English text

## 🔧 Technical Details

**API Endpoint:**
```
POST /api/captions/convert-hinglish
Body: { "captions": [{ "word": "text", "start": 0.1, "end": 0.5 }] }
Response: { "success": true, "captions": [...], "hinglishText": "..." }
```

**Model Used:** `gpt-3.5-turbo`
- Fast and affordable
- High accuracy for Hindi-to-Hinglish
- Works perfectly for hosting

## 🆘 Troubleshooting

### Error: "API key not configured"
- Make sure `.env` file exists in `backend/` folder
- Check API key format (starts with `sk-`)
- Restart backend after adding key

### Conversion not accurate?
- GPT-3.5-turbo is very accurate for Hindi
- If needed, you can upgrade to GPT-4 in code (more expensive)

### Rate limits?
- Free tier: 3 requests/minute
- Paid tier: Higher limits
- More than enough for normal usage

## 📊 Cost Estimate

For a typical video editor usage:
- **10 conversions/day**: ~₹50/month
- **100 conversions/day**: ~₹500/month
- Still very affordable compared to hiring translators!

## ✅ Hosting Ready

This feature is perfect for hosting because:
- Uses API (no local models needed)
- Very low cost
- Fast response time
- Scalable
- No GPU required

Perfect for Vercel + Railway hosting! 🚀
