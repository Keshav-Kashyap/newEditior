# Video Editor Backend

Node.js + Express backend for video editing with FFmpeg and Whisper integration.

## Features

- **Video Upload** - Handle large video file uploads
- **Word Timestamps** - Generate word-level timestamps (Whisper integration ready)
- **Video Export** - Render videos with text overlays using FFmpeg
- **Progress Tracking** - Real-time export progress updates

## Prerequisites

1. **Node.js** (v18 or higher)
2. **FFmpeg** - Install from https://ffmpeg.org/download.html
3. **Whisper** (Optional) - Install with: `pip install openai-whisper`

### Install FFmpeg on Windows

```powershell
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
# Add to PATH after installation
```

### Install Whisper (Optional)

```bash
pip install openai-whisper
```

## Installation

```bash
cd backend
npm install
```

## Configuration

Create `.env` file:

```env
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=500
```

## Run Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:3000`

## API Endpoints

### 1. Upload Video
```http
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "fileUrl": "http://localhost:3000/uploads/video.mp4",
  "filename": "abc-123.mp4",
  "size": 1048576
}
```

### 2. Generate Timestamps
```http
POST /api/generate-timestamps
Content-Type: application/json

{
  "script": "hello everyone welcome to my video",
  "audioUrl": "http://localhost:3000/uploads/audio.mp3" (optional)
}

Response:
{
  "success": true,
  "timestamps": [
    { "word": "hello", "start": 0.4, "end": 0.6 },
    { "word": "everyone", "start": 0.8, "end": 1.2 }
  ],
  "wordCount": 5
}
```

### 3. Export Video
```http
POST /api/export
Content-Type: application/json

{
  "videoUrl": "http://localhost:3000/uploads/video.mp4",
  "layers": [
    {
      "type": "text",
      "text": "Hello World",
      "fontSize": 48,
      "fill": "#ffffff",
      "left": 100,
      "top": 100
    }
  ],
  "wordTimestamps": [
    { "word": "hello", "start": 0.4, "end": 0.6 }
  ]
}

Response:
{
  "success": true,
  "jobId": "abc-123-def-456",
  "message": "Export job created"
}
```

### 4. Check Export Progress
```http
GET /api/export/progress/:jobId

Response:
{
  "id": "abc-123-def-456",
  "status": "processing", // "processing" | "complete" | "failed"
  "progress": 75,
  "downloadUrl": null // Available when status is "complete"
}
```

### 5. Health Check
```http
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2026-02-01T12:00:00.000Z"
}
```

## FFmpeg Integration

The backend uses `fluent-ffmpeg` to:
- Add text overlays at specific positions
- Apply word-sync animations with timing
- Render final video with all effects

Example FFmpeg command generated:
```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=text='Hello':x=100:y=100:fontsize=48:fontcolor=white,
       drawtext=text='World':x=100:y=200:fontsize=48:fontcolor=white:enable='between(t,0.4,0.6)'" \
  -c:a copy output.mp4
```

## Whisper Integration

For production-quality word timestamps:

1. Install Whisper: `pip install openai-whisper`
2. The service will automatically use Whisper if available
3. Falls back to evenly-spaced timestamps if Whisper not found

## Project Structure

```
backend/
├── server.js              # Main Express server
├── routes/
│   ├── timestamps.js      # Timestamp generation routes
│   └── export.js          # Video export routes
├── services/
│   ├── whisperService.js  # Whisper integration
│   └── exportService.js   # FFmpeg export logic
├── uploads/               # Uploaded videos
├── exports/               # Rendered videos
├── temp/                  # Temporary files
└── package.json
```

## Production Deployment

1. Use Redis/Database for job storage (replace in-memory Map)
2. Add authentication and rate limiting
3. Use cloud storage (S3, Azure Blob) for files
4. Add webhook notifications for export completion
5. Use job queue (Bull, BullMQ) for background processing
6. Set up proper logging (Winston, Pino)

## Troubleshooting

### FFmpeg not found
```bash
# Check if FFmpeg is installed
ffmpeg -version

# Add to PATH on Windows
setx PATH "%PATH%;C:\path\to\ffmpeg\bin"
```

### Port already in use
```bash
# Change PORT in .env
PORT=3001
```

### Large file uploads failing
```bash
# Increase MAX_FILE_SIZE in .env
MAX_FILE_SIZE=1000
```

## License

MIT
