import express from 'express';
import 'dotenv/config';

const router = express.Router();
const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
// Updated working free models
const MODEL_NAME = process.env.MODEL_NAME || 'microsoft/phi-3-mini-128k-instruct:free';

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Basic Hindi to Hinglish conversion (fallback)
function basicHinglishConversion(text) {
    const hindiToRoman = {
        'करसन': 'Karsan', 'के': 'ke', 'सीजन': 'season', 'थ्री': 'three', 'ने': 'ne',
        'क्रंची': 'Crunchy', 'रोल': 'Roll', 'सर्वर्स': 'servers', 'को': 'ko', 'भी': 'bhi',
        'क्रैश': 'crash', 'कर': 'kar', 'डाल': 'daal', 'ला': 'la', 'है': 'hai',
        'इस': 'is', 'में': 'mein', 'तरीके': 'tarike', 'का': 'ka', 'एनिमेशन': 'animation',
        'बीजीएम': 'BGM', 'दिखाया': 'dikhaya', 'गया': 'gaya', 'की': 'ki', 'जितनी': 'jitni',
        'तारीफ': 'tareef', 'जाए': 'jaaye', 'उतनी': 'utni', 'ही': 'hi', 'कम': 'kam',
        'ना': 'na', 'ज्यादा': 'zyada', 'पीक': 'peak', 'लेवल': 'level', 'एंड': 'and',
        'हर': 'har', 'सीन': 'scene', 'साथ': 'saath', 'बैक': 'back', 'ग्राउंड': 'ground',
        'म्यूजिक': 'music', 'मैच': 'match', 'करता': 'karta', 'आपको': 'aapko',
        'पूरा': 'pura', 'अन्दर': 'andar', 'तक': 'tak', 'फील': 'feel', 'होगा': 'hoga',
        'मेकर्स': 'makers', 'पुराने': 'purane', 'अकॉर्डिंग': 'according', 'पर': 'par',
        'काफी': 'kaafi', 'काम': 'kaam', 'किया': 'kiya', 'इसको': 'isko', 'देखने': 'dekhne',
        'बाद': 'baad', 'तो': 'to', 'बिल्कुल': 'bilkul', 'मजा': 'maja', 'आ': 'aa',
        'इसके': 'iske', 'अभी': 'abhi', 'एपिसोड्स': 'episodes', 'आये': 'aaye', 'और': 'aur',
        'दोनो': 'dono', 'एपिसोड': 'episode', 'बहुत': 'bahut', 'खतरनाक': 'khatarnak',
        'आपने': 'aapne', 'नहीं': 'nahi', 'देखी': 'dekhi', 'हो': 'ho', 'जाके': 'jaake',
        'क्या': 'kya', 'बवाल': 'bawal', 'बनाया': 'banaya'
    };
    
    let result = text;
    Object.entries(hindiToRoman).forEach(([hindi, roman]) => {
        const regex = new RegExp(hindi, 'g');
        result = result.replace(regex, roman);
    });
    
    return result;
}

/**
 * Convert captions to Hinglish using OpenRouter API
 * POST /api/captions/convert-hinglish
 * Body: { captions: [{ word, start, end }] }
 */
router.post('/convert-hinglish', async (req, res) => {
    try {
        const { captions } = req.body;

        if (!captions || captions.length === 0) {
            return res.status(400).json({ error: 'Captions are required' });
        }

        if (!OPEN_ROUTER_API_KEY) {
            return res.status(500).json({
                error: 'OpenRouter API key not configured',
                message: 'Please add OPEN_ROUTER_API_KEY to your .env file'
            });
        }

        console.log('🔄 Converting to Hinglish:', captions.length, 'words using OpenRouter');
        console.log('📝 Model:', MODEL_NAME);
        console.log('🔑 API Key exists:', !!OPEN_ROUTER_API_KEY);
        console.log('🔗 API URL:', OPENROUTER_API_URL);

        // Extract text from captions
        const originalText = captions.map(c => c.word).join(' ');
        console.log('Original Hindi text:', originalText);

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPEN_ROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:9000',
                'X-Title': 'Hindi to Hinglish Converter'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user", 
                        content: `Convert this Hindi text to Hinglish (Roman script). Return ONLY the converted text, word by word, no explanations:\n\n${originalText}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ OpenRouter API error: ${response.status} ${response.statusText}`);
            console.error('❌ Error details:', errorText);
            
            // Fallback: Basic rule-based conversion
            console.log('🔄 Using fallback rule-based conversion...');
            const hinglishText = basicHinglishConversion(originalText);
            
            const hinglishWords = hinglishText.split(/\s+/);
            const hinglishCaptions = captions.map((caption, index) => ({
                word: hinglishWords[index] || caption.word,
                start: caption.start,
                end: caption.end,
                confidence: caption.confidence || 1.0
            }));

            return res.json({
                success: true,
                captions: hinglishCaptions,
                wordCount: hinglishCaptions.length,
                originalText: originalText,
                hinglishText: hinglishText,
                model: 'fallback-rules',
                timestamps_preserved: true,
                note: 'Used rule-based conversion due to API error',
                apiError: `${response.status}: ${errorText}`
            });
        }

        const data = await response.json();
        console.log('📝 Full API Response:', JSON.stringify(data, null, 2));
        
        let hinglishText = data.choices?.[0]?.message?.content?.trim();
        
        // If content is empty but reasoning exists, try to extract from reasoning
        if (!hinglishText && data.choices?.[0]?.message?.reasoning) {
            console.log('🔄 Content empty, checking reasoning field...');
            const reasoning = data.choices[0].message.reasoning;
            
            // Try to find the actual conversion in reasoning text
            // Look for patterns like "word1 word2 word3" after conversion attempts
            const reasoningLines = reasoning.split('\n');
            for (const line of reasoningLines) {
                // Skip explanation lines, look for actual conversion
                if (line.includes('→') || line.toLowerCase().includes('convert')) continue;
                
                // Look for lines that might contain the converted text
                const trimmed = line.trim();
                if (trimmed && !trimmed.includes('rule') && !trimmed.includes('example') && 
                    trimmed.split(' ').length > 5) {
                    hinglishText = trimmed;
                    console.log('✅ Found conversion in reasoning:', hinglishText);
                    break;
                }
            }
        }
        
        if (!hinglishText) {
            console.error('❌ No content in API response:', data);
            console.error('❌ Choices array:', data.choices);
            
            // Use fallback conversion
            console.log('🔄 Using fallback conversion due to empty response...');
            const fallbackText = basicHinglishConversion(originalText);
            
            const hinglishWords = fallbackText.split(/\s+/);
            const hinglishCaptions = captions.map((caption, index) => ({
                word: hinglishWords[index] || caption.word,
                start: caption.start,
                end: caption.end,
                confidence: caption.confidence || 1.0
            }));

            return res.json({
                success: true,
                captions: hinglishCaptions,
                wordCount: hinglishCaptions.length,
                originalText: originalText,
                hinglishText: fallbackText,
                model: 'fallback-rules',
                timestamps_preserved: true,
                note: 'Used rule-based conversion - empty API response'
            });
        }

        console.log('✅ Converted Hinglish:', hinglishText);
        console.log('📏 Hinglish text length:', hinglishText.length);
        console.log('🔤 Raw Hinglish text (with quotes):', `"${hinglishText}"`);

        // Split back into words and map to original timing
        const hinglishWords = hinglishText.split(/\s+/).filter(word => word.trim() !== '');
        
        console.log('📋 Detailed Mapping:');
        console.log('   Original captions count:', captions.length);
        console.log('   Hinglish words count:', hinglishWords.length);
        console.log('   Original words:', captions.map(c => c.word));
        console.log('   Hinglish words:', hinglishWords);

        // Create new captions with Hinglish text but original timings from AssemblyAI
        const hinglishCaptions = captions.map((caption, index) => {
            const hinglishWord = hinglishWords[index] || caption.word;
            console.log(`   ${index}: "${caption.word}" → "${hinglishWord}" [${caption.start}-${caption.end}]`);
            
            return {
                word: hinglishWord,
                start: caption.start, // Keep original AssemblyAI timestamps
                end: caption.end,     // Keep original AssemblyAI timestamps
                confidence: caption.confidence || 1.0
            };
        });

        console.log('📊 Final Result:', {
            originalWords: captions.length,
            hinglishWords: hinglishWords.length,
            matched: captions.length === hinglishWords.length,
            samplingMismatch: captions.length !== hinglishWords.length
        });

        res.json({
            success: true,
            captions: hinglishCaptions,
            wordCount: hinglishCaptions.length,
            originalText: originalText,
            hinglishText: hinglishText,
            model: MODEL_NAME,
            timestamps_preserved: true
        });

    } catch (error) {
        console.error('❌ Hinglish conversion error:', error);
        res.status(500).json({
            error: 'Failed to convert to Hinglish',
            message: error.message,
            model: MODEL_NAME
        });
    }
});

export default router;
