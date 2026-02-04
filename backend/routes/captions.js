import express from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

/**
 * Auto-generate captions from video using AssemblyAI
 * POST /api/captions/auto-generate
 * Body: { videoPath: string, language: 'hi' | 'en' | 'auto' }
 */
router.post('/auto-generate', async (req, res) => {
    try {
        const { videoPath, language = 'auto' } = req.body;

        if (!videoPath) {
            return res.status(400).json({ error: 'Video path is required' });
        }

        if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'your_api_key_here') {
            return res.status(500).json({
                error: 'AssemblyAI API key not configured',
                message: 'Please add ASSEMBLYAI_API_KEY to your .env file'
            });
        }

        console.log('Auto-generating captions with AssemblyAI for:', videoPath);
        console.log('Language:', language);

        // Extract audio from video
        const audioPath = await extractAudio(videoPath);

        // Upload audio to AssemblyAI
        console.log('Uploading audio to AssemblyAI...');
        const uploadUrl = await uploadToAssemblyAI(audioPath);

        // Start transcription
        console.log('Starting transcription...');
        const transcriptId = await startTranscription(uploadUrl, language);

        // Poll for completion
        console.log('Waiting for transcription...');
        const transcript = await pollTranscription(transcriptId);

        // Convert to word timestamps format with proper timing
        const captions = transcript.words.map(word => ({
            word: word.text,
            start: word.start / 1000, // Convert ms to seconds
            end: word.end / 1000,
            confidence: word.confidence || 0.9
        }));

        console.log('📊 Sample timing:', {
            firstWord: captions[0],
            lastWord: captions[captions.length - 1],
            totalDuration: captions[captions.length - 1]?.end || 0
        });

        // Cleanup audio file
        await fs.unlink(audioPath).catch(() => { });

        res.json({
            success: true,
            captions: captions,
            wordCount: captions.length,
            confidence: transcript.confidence
        });

    } catch (error) {
        console.error('Error generating captions:', error);
        res.status(500).json({
            error: 'Failed to generate captions',
            message: error.message
        });
    }
});

// Helper function: Upload audio to AssemblyAI
async function uploadToAssemblyAI(audioPath) {
    const audioData = await fs.readFile(audioPath);

    const response = await axios.post(`${ASSEMBLYAI_API_URL}/upload`, audioData, {
        headers: {
            'authorization': ASSEMBLYAI_API_KEY,
            'content-type': 'application/octet-stream'
        }
    });

    return response.data.upload_url;
}

// Helper function: Start transcription
async function startTranscription(audioUrl, language) {
    const languageCode = language === 'auto' ? null : (language === 'hi' ? 'hi' : 'en');

    const response = await axios.post(`${ASSEMBLYAI_API_URL}/transcript`, {
        audio_url: audioUrl,
        language_code: languageCode,
        word_boost: [],
        boost_param: 'default'
    }, {
        headers: {
            'authorization': ASSEMBLYAI_API_KEY,
            'content-type': 'application/json'
        }
    });

    return response.data.id;
}

// Helper function: Poll for transcription completion
async function pollTranscription(transcriptId) {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await axios.get(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
            headers: {
                'authorization': ASSEMBLYAI_API_KEY
            }
        });

        const status = response.data.status;

        if (status === 'completed') {
            return response.data;
        } else if (status === 'error') {
            throw new Error('Transcription failed: ' + response.data.error);
        }

        // Wait 5 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
    }

    throw new Error('Transcription timeout');
}

// Helper function: Extract audio from video using FFmpeg
async function extractAudio(videoPath) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const audioPath = path.join(path.dirname(__filename), '../temp', `audio_${Date.now()}.mp3`);

    try {
        // Use ffmpeg to extract audio
        const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}"`;
        await execAsync(command);
        return audioPath;
    } catch (error) {
        throw new Error('Failed to extract audio: ' + error.message);
    }
}

export default router;
