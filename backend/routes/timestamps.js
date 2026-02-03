import express from 'express';
import { generateWordTimestamps } from '../services/whisperService.js';

const router = express.Router();

router.post('/generate-timestamps', async (req, res) => {
  try {
    const { script, audioUrl } = req.body;

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'Script is required' });
    }

    // Generate word-level timestamps
    // If audioUrl is provided, use Whisper to analyze the audio
    // Otherwise, generate evenly spaced timestamps as fallback
    
    const timestamps = await generateWordTimestamps(script, audioUrl);

    res.json({
      success: true,
      timestamps,
      wordCount: timestamps.length
    });
  } catch (error) {
    console.error('Timestamp generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
