import express from 'express';
import OpenAI from 'openai';
import 'dotenv/config';

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Convert captions to Hinglish (Roman Hindi)
 * POST /api/captions/convert-hinglish
 * Body: { captions: [{ word, start, end }] }
 */
router.post('/convert-hinglish', async (req, res) => {
    try {
        const { captions } = req.body;

        if (!captions || captions.length === 0) {
            return res.status(400).json({ error: 'Captions are required' });
        }

        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
            return res.status(500).json({
                error: 'OpenAI API key not configured',
                message: 'Please add OPENAI_API_KEY to your .env file'
            });
        }

        console.log('Converting to Hinglish:', captions.length, 'words');

        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

        // Extract text from captions
        const originalText = captions.map(c => c.word).join(' ');

        // Call OpenAI to convert to Hinglish
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a text converter. Convert Hindi/Devanagari text to Hinglish (Roman Hindi). Keep English words as-is. Only transliterate Hindi words to Roman script. Maintain the same word count and order. Return ONLY the converted text, nothing else."
                },
                {
                    role: "user",
                    content: originalText
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        const hinglishText = completion.choices[0].message.content.trim();
        console.log('Original:', originalText);
        console.log('Hinglish:', hinglishText);

        // Split back into words and map to original timing
        const hinglishWords = hinglishText.split(/\s+/);

        // Create new captions with Hinglish text but original timings
        const hinglishCaptions = captions.map((caption, index) => ({
            word: hinglishWords[index] || caption.word,
            start: caption.start,
            end: caption.end
        }));

        res.json({
            success: true,
            captions: hinglishCaptions,
            wordCount: hinglishCaptions.length,
            originalText: originalText,
            hinglishText: hinglishText
        });

    } catch (error) {
        console.error('Hinglish conversion error:', error);
        res.status(500).json({
            error: 'Failed to convert to Hinglish',
            message: error.message
        });
    }
});

export default router;
