import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Type, Palette, Move, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

export function CaptionSettings() {
    const { captionStyle, updateCaptionStyle, customFonts, addCustomFont, globalEditMode, toggleGlobalEditMode } = useEditorStore()
    const [uploading, setUploading] = useState(false)

    // Load custom fonts from localStorage on mount
    useEffect(() => {
        const loadSavedFonts = async () => {
            const savedFonts = JSON.parse(localStorage.getItem('customFonts') || '[]')
            const savedFontData = JSON.parse(localStorage.getItem('customFontData') || '{}')

            for (const fontName of savedFonts) {
                if (savedFontData[fontName]) {
                    try {
                        const arrayBuffer = Uint8Array.from(atob(savedFontData[fontName]), c => c.charCodeAt(0)).buffer
                        const fontFace = new FontFace(fontName, arrayBuffer)
                        await fontFace.load()
                        document.fonts.add(fontFace)
                    } catch (error) {
                        console.error(`Failed to load saved font ${fontName}:`, error)
                    }
                }
            }
        }

        loadSavedFonts()
    }, [])

    const handleFontUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '')
            const arrayBuffer = await file.arrayBuffer()

            // Load font using FontFace API
            const fontFace = new FontFace(fontName, arrayBuffer)
            await fontFace.load()
            document.fonts.add(fontFace)

            // Save font data to localStorage
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
            const savedFontData = JSON.parse(localStorage.getItem('customFontData') || '{}')
            savedFontData[fontName] = base64
            localStorage.setItem('customFontData', JSON.stringify(savedFontData))

            // Add to custom fonts list
            addCustomFont(fontName)
            updateCaptionStyle({ fontFamily: fontName })

            alert(`Font "${fontName}" loaded successfully!`)
        } catch (error) {
            console.error('Font upload error:', error)
            alert('Failed to load font. Please try another file.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 md:p-6 space-y-4 md:space-y-6"
        >
            <div className="flex items-center gap-2 pb-2 md:pb-4 border-b">
                <Type className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <h2 className="text-lg md:text-xl font-semibold">Caption Settings</h2>
            </div>

            {/* Font Family */}
            <div className="space-y-2 md:space-y-3">
                <Label className="flex items-center gap-2 text-sm md:text-base">
                    <Type className="h-3 w-3 md:h-4 md:w-4" />
                    Font Family
                </Label>
                <Select
                    value={captionStyle.fontFamily}
                    onValueChange={(value) => updateCaptionStyle({ fontFamily: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Impact">Impact</SelectItem>
                        <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                        <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                        {customFonts.map((font) => (
                            <SelectItem key={font} value={font}>
                                {font} (Custom)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Custom Font Upload */}
                <div className="pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={uploading}
                        onClick={() => document.getElementById('font-upload').click()}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Loading...' : 'Upload Custom Font'}
                    </Button>
                    <Input
                        id="font-upload"
                        type="file"
                        accept=".ttf,.otf,.woff,.woff2"
                        className="hidden"
                        onChange={handleFontUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Supports: TTF, OTF, WOFF, WOFF2
                    </p>
                </div>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Font Size</Label>
                    <span className="text-sm text-muted-foreground">{captionStyle.fontSize}px</span>
                </div>
                <Slider
                    value={[captionStyle.fontSize]}
                    min={20}
                    max={200}
                    step={2}
                    onValueChange={([value]) => updateCaptionStyle({ fontSize: value })}
                />
            </div>

            {/* Text Color */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Text Color
                </Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={captionStyle.fill}
                        onChange={(e) => updateCaptionStyle({ fill: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                        type="text"
                        value={captionStyle.fill}
                        onChange={(e) => updateCaptionStyle({ fill: e.target.value })}
                        placeholder="#FFFF00"
                        className="flex-1"
                    />
                </div>
            </div>

            {/* Font Weight */}
            <div className="space-y-3">
                <Label>Font Weight</Label>
                <Select
                    value={captionStyle.fontWeight}
                    onValueChange={(value) => updateCaptionStyle({ fontWeight: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="bolder">Bolder</SelectItem>
                        <SelectItem value="lighter">Lighter</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Global Edit Mode Controls */}
            <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <Type className="h-4 w-4" />
                        Edit Mode
                    </Label>
                    <Button
                        variant={globalEditMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleGlobalEditMode}
                        className={`text-xs ${globalEditMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'border-blue-400 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900'
                        }`}
                    >
                        {globalEditMode ? "🌐 Global Edit" : "🎯 Individual Edit"}
                    </Button>
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    {globalEditMode ? (
                        <>
                            <p>🌐 <strong>Global Mode:</strong> Style changes apply to ALL words</p>
                            <p>📝 Edit one word and all words update with the same formatting</p>
                        </>
                    ) : (
                        <>
                            <p>🎯 <strong>Individual Mode:</strong> Style changes apply to selected words only</p>
                            <p>📝 Each word can have unique formatting and positioning</p>
                        </>
                    )}
                    <p>📦 Container bounds keep text within safe viewing area with auto-wrapping</p>
                </div>
            </div>

            {/* Shadow Settings */}
            <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Shadow Settings</Label>

                {/* Shadow Blur */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Shadow Blur</Label>
                        <span className="text-sm text-muted-foreground">{captionStyle.shadowBlur}px</span>
                    </div>
                    <Slider
                        value={[captionStyle.shadowBlur]}
                        min={0}
                        max={50}
                        step={1}
                        onValueChange={([value]) => updateCaptionStyle({ shadowBlur: value })}
                    />
                </div>

                {/* Shadow X Offset */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm flex items-center gap-2">
                            <Move className="h-3 w-3" />
                            Shadow X Position
                        </Label>
                        <span className="text-sm text-muted-foreground">{captionStyle.shadowX}px</span>
                    </div>
                    <Slider
                        value={[captionStyle.shadowX]}
                        min={-20}
                        max={20}
                        step={1}
                        onValueChange={([value]) => updateCaptionStyle({ shadowX: value })}
                    />
                </div>

                {/* Shadow Y Offset */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm flex items-center gap-2">
                            <Move className="h-3 w-3" />
                            Shadow Y Position
                        </Label>
                        <span className="text-sm text-muted-foreground">{captionStyle.shadowY}px</span>
                    </div>
                    <Slider
                        value={[captionStyle.shadowY]}
                        min={-20}
                        max={20}
                        step={1}
                        onValueChange={([value]) => updateCaptionStyle({ shadowY: value })}
                    />
                </div>

                {/* Shadow Opacity */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Shadow Opacity</Label>
                        <span className="text-sm text-muted-foreground">{(captionStyle.shadowOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                        value={[captionStyle.shadowOpacity * 100]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={([value]) => updateCaptionStyle({ shadowOpacity: value / 100 })}
                    />
                </div>
            </div>

            {/* Position Controls */}
            <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Position</Label>

                {/* Vertical Position */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Vertical Position</Label>
                        <span className="text-sm text-muted-foreground">{captionStyle.verticalPosition}%</span>
                    </div>
                    <Slider
                        value={[captionStyle.verticalPosition]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={([value]) => updateCaptionStyle({ verticalPosition: value })}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Top</span>
                        <span>Center</span>
                        <span>Bottom</span>
                    </div>
                </div>
            </div>

            {/* Timing Controls */}
            <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Timing Control</Label>

                {/* Caption Speed Offset */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Caption Timing</Label>
                        <span className={`text-sm font-bold ${captionStyle.speedOffset > 0 ? 'text-red-500' :
                                captionStyle.speedOffset < 0 ? 'text-blue-500' :
                                    'text-green-500'
                            }`}>
                            {captionStyle.speedOffset === 0 ? 'Normal' :
                                captionStyle.speedOffset > 0 ? `Slower +${(captionStyle.speedOffset * 1000).toFixed(0)}ms` :
                                    `Faster ${(captionStyle.speedOffset * 1000).toFixed(0)}ms`}
                        </span>
                    </div>
                    <Slider
                        value={[captionStyle.speedOffset * 1000]}
                        min={-2000}
                        max={2000}
                        step={50}
                        onValueChange={([value]) => updateCaptionStyle({ speedOffset: value / 1000 })}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-blue-500">Faster ⏪</span>
                        <span className="text-green-500">Normal</span>
                        <span className="text-red-500">Slower ⏩</span>
                    </div>
                    <div className="bg-muted p-3 rounded text-xs">
                        <p className="font-semibold mb-1">How to use:</p>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• <span className="text-blue-500 font-semibold">Left (Faster)</span>: Words appear earlier</li>
                            <li>• <span className="text-green-500 font-semibold">Center (Normal)</span>: Perfect sync</li>
                            <li>• <span className="text-red-500 font-semibold">Right (Slower)</span>: Words appear later</li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
