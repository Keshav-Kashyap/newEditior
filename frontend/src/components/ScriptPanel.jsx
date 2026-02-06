import { useState } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import API_URL from '@/lib/api'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Layers, Sparkles } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export function ScriptPanel() {
    const [loading, setLoading] = useState(false)
    const [autoGenerating, setAutoGenerating] = useState(false)
    const [language, setLanguage] = useState('auto')
    const {
        script,
        setScript,
        wordTimestamps,
        setWordTimestamps,
        activeWordIndex,
        currentTime,
        createWordLayers,
        layers,
        setLayers,
        videoUrl,
        uploadedVideoPath
    } = useEditorStore()

    const generateTimestamps = async () => {
        if (!script.trim()) return

        setLoading(true)
        try {
            // Call backend API to generate word timestamps
            // Backend uses Whisper to analyze audio and return word-level timestamps
            const response = await fetch(`${API_URL}/api/generate-timestamps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ script })
            })

            const data = await response.json()
            setWordTimestamps(data.timestamps)
        } catch (error) {
            console.error('Failed to generate timestamps:', error)
            // Fallback: Generate mock timestamps for demo
            const words = script.trim().split(/\s+/)
            const mockTimestamps = words.map((word, i) => ({
                word: word,
                start: i * 0.5, // 0.5 seconds per word
                end: (i + 1) * 0.5
            }))
            setWordTimestamps(mockTimestamps)
        } finally {
            setLoading(false)
        }
    }

    const autoGenerateCaptions = async () => {
        if (!videoUrl) {
            alert('Please upload a video first!')
            return
        }

        if (!uploadedVideoPath) {
            alert('Please wait for video upload to complete!')
            return
        }

        setAutoGenerating(true)
        try {
            // Step 1: Generate captions from AssemblyAI
            const response = await fetch(`${API_URL}/api/captions/auto-generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoPath: uploadedVideoPath,
                    language: language
                })
            })

            const data = await response.json()

            if (data.success) {
                console.log('✅ AssemblyAI captions generated:', data.captions.length, 'words')
                
                let finalCaptions = data.captions
                let finalScript = data.captions.map(c => c.word).join(' ')
                
                // Step 2: Auto-convert to Hinglish if Hindi language was selected or detected
                if (language === 'hi' || language === 'auto') {
                    console.log('🔄 Auto-converting to Hinglish with OpenRouter...')
                    
                    try {
                        const hinglishResponse = await fetch(`${API_URL}/api/captions/convert-hinglish`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                captions: data.captions
                            })
                        })
                        
                        const hinglishData = await hinglishResponse.json()
                        
                        if (hinglishData.success) {
                            console.log('✅ Automatic Hinglish conversion successful!')
                            finalCaptions = hinglishData.captions
                            finalScript = hinglishData.captions.map(c => c.word).join(' ')
                        } else {
                            console.log('⚠️ Hinglish conversion failed, using original Hindi captions')
                        }
                    } catch (hinglishError) {
                        console.error('⚠️ Hinglish conversion error, using original captions:', hinglishError)
                    }
                }
                
                // Set the final captions (Hindi or Hinglish)
                setWordTimestamps(finalCaptions)
                setScript(finalScript)

                // Clear existing word layers first
                const nonWordLayers = layers.filter(layer => !layer.isWordLayer)
                setLayers(nonWordLayers)

                // Automatically create word layers on canvas with a delay
                setTimeout(() => {
                    console.log('🎯 Creating word layers automatically...')
                    createWordLayers()
                    console.log('✅ Word layers created and should be visible on video')
                }, 500)

                const conversionStatus = (language === 'hi' || language === 'auto') ? ' → Auto-converted to Hinglish!' : ''
                alert(`✅ ${finalCaptions.length} captions generated and displayed on video!${conversionStatus}`)
            } else {
                throw new Error(data.error || 'Failed to generate captions')
            }
        } catch (error) {
            console.error('Auto-generate error:', error)
            alert('❌ Failed to generate captions: ' + error.message)
        } finally {
            setAutoGenerating(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Auto Generate Captions Section - AssemblyAI */}
            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 space-y-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <Label className="text-base font-semibold">Auto-Generate Captions (AI)</Label>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm">Language (AssemblyAI will auto-detect and transcribe)</Label>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">🌐 Auto Detect</SelectItem>
                            <SelectItem value="en">🇺🇸 English</SelectItem>
                            <SelectItem value="hi">🇮🇳 हिंदी (Hindi)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        💡 For Hindi videos: Auto-generates Hindi captions → Automatically converts to Hinglish using OpenRouter (Free!)
                    </p>
                </div>

                <Button
                    onClick={autoGenerateCaptions}
                    disabled={!videoUrl || autoGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                    {autoGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {autoGenerating ? 'Generating & Converting...' : '✨ Auto-Generate Captions (→ Hinglish for Hindi)'}
                </Button>

                <p className="text-xs text-muted-foreground">
                    🤖 AssemblyAI + OpenRouter - Auto-converts Hindi to Hinglish seamlessly
                </p>
            </div>

            {/* Manual Script Entry */}
            <div className="space-y-2">
                <Label>Manual Script Entry</Label>
                <Textarea
                    placeholder="Paste your script here or use auto-generate above..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="min-h-[200px] font-mono"
                />
                <p className="text-xs text-muted-foreground">
                    ✏️ Changes to script will clear existing word layers. Click "Generate Word Timestamps" to sync with video.
                </p>
            </div>

            <Button
                onClick={generateTimestamps}
                disabled={!script.trim() || loading}
                className="w-full"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Generating Timestamps...' : 'Generate Word Timestamps'}
            </Button>

            {wordTimestamps.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <Label>Word Sync Preview</Label>
                        <span className="text-xs text-muted-foreground">
                            {wordTimestamps.length} words
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={createWordLayers}
                            variant="outline"
                            className="flex-1"
                            disabled={layers.some(l => l.isWordLayer)}
                        >
                            <Layers className="mr-2 h-4 w-4" />
                            {layers.some(l => l.isWordLayer) ? 'Word Layers Created ✅' : 'Create Word Layers on Video'}
                        </Button>
                        
                        {layers.some(l => l.isWordLayer) && (
                            <Button
                                onClick={() => {
                                    const nonWordLayers = layers.filter(layer => !layer.isWordLayer)
                                    setLayers(nonWordLayers)
                                }}
                                variant="destructive"
                                size="sm"
                            >
                                Clear Words
                            </Button>
                        )}
                    </div>

                    <div className="p-4 bg-muted rounded-lg min-h-[120px] flex flex-wrap gap-2 items-start">
                        {wordTimestamps.map((item, index) => (
                            <motion.span
                                key={index}
                                className={`px-2 py-1 rounded text-sm transition-all ${index === activeWordIndex
                                    ? 'bg-primary text-primary-foreground font-semibold scale-110'
                                    : 'bg-background'
                                    }`}
                                animate={{
                                    scale: index === activeWordIndex ? 1.1 : 1,
                                    y: index === activeWordIndex ? -2 : 0,
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20
                                }}
                            >
                                {item.word}
                            </motion.span>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Active word highlights as the video plays based on timestamps
                    </p>
                </div>
            )}
        </div>
    )
}
