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
    const [convertingHinglish, setConvertingHinglish] = useState(false)
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
                // Set the generated captions as word timestamps
                setWordTimestamps(data.captions)

                // Also set the script text
                const scriptText = data.captions.map(c => c.word).join(' ')
                setScript(scriptText)

                // Automatically create word layers on canvas
                setTimeout(() => {
                    createWordLayers()
                }, 100)

                alert(`✅ ${data.wordCount} captions generated successfully!`)
            } else {
                throw new Error(data.error || 'Failed bro to generate captions')
            }
        } catch (error) {
            console.error('Auto-generate error:', error)
            alert('❌ Failed to generate captions: ' + error.message)
        } finally {
            setAutoGenerating(false)
        }
    }

    const convertToHinglish = async () => {
        if (wordTimestamps.length === 0) {
            alert('Please generate captions first!')
            return
        }

        setConvertingHinglish(true)
        try {
            const response = await fetch(`${API_URL}/api/captions/convert-hinglish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    captions: wordTimestamps
                })
            })

            const data = await response.json()

            if (data.success) {
                // Update captions with Hinglish text
                setWordTimestamps(data.captions)

                // Update script text
                const hinglishScript = data.captions.map(c => c.word).join(' ')
                setScript(hinglishScript)

                alert(`✅ Converted to Hinglish! ${data.wordCount} words`)
            } else {
                throw new Error(data.error || 'Failed to convert to Hinglish')
            }
        } catch (error) {
            console.error('Hinglish conversion error:', error)
            alert('❌ Failed to convert: ' + error.message)
        } finally {
            setConvertingHinglish(false)
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
                    <Label className="text-sm">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Auto Detect</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={autoGenerateCaptions}
                    disabled={!videoUrl || autoGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                    {autoGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {autoGenerating ? 'Generating Captions...' : '✨ Auto-Generate from Video'}
                </Button>

                <p className="text-xs text-muted-foreground">
                    Powered by AssemblyAI - Automatically transcribe video audio
                </p>
            </div>

            {/* Convert to Hinglish */}
            {wordTimestamps.length > 0 && (
                <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-orange-600" />
                        <Label className="text-base font-semibold">Convert to Hinglish</Label>
                    </div>

                    <Button
                        onClick={convertToHinglish}
                        disabled={convertingHinglish}
                        className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
                    >
                        {convertingHinglish && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {convertingHinglish ? 'Converting...' : '🔄 Convert Hindi/English to Hinglish'}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        Powered by OpenAI - Convert Hindi/English text to Roman Hindi (Hinglish)
                    </p>
                </div>
            )}

            {/* Manual Script Entry */}
            <div className="space-y-2">
                <Label>Manual Script Entry</Label>
                <Textarea
                    placeholder="Paste your script here or use auto-generate above..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="min-h-[200px] font-mono"
                />
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

                    <Button
                        onClick={createWordLayers}
                        variant="outline"
                        className="w-full"
                        disabled={layers.some(l => l.isWordLayer)}
                    >
                        <Layers className="mr-2 h-4 w-4" />
                        {layers.some(l => l.isWordLayer) ? 'Word Layers Created' : 'Create Word Layers on Video'}
                    </Button>

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
