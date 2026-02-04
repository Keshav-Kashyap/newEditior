import { useRef, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { fabric } from 'fabric'
import Draggable from 'react-draggable'
import { useEditorStore } from '@/store/editorStore'
import { Play, Pause, SkipBack, SkipForward, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export function VideoPreview() {
    const playerRef = useRef(null)
    const canvasRef = useRef(null)
    const fabricCanvasRef = useRef(null)
    const [showAllWords, setShowAllWords] = useState(false)
    const [wordPosition, setWordPosition] = useState({ x: 0, y: 0 })

    const {
        videoUrl,
        currentTime,
        videoDuration,
        isPlaying,
        setCurrentTime,
        setVideoDuration,
        setIsPlaying,
        updateActiveWord,
        layers,
        selectedLayerId,
        setSelectedLayer,
        updateLayer,
        captionStyle
    } = useEditorStore()

    useEffect(() => {
        updateActiveWord()
    }, [currentTime, updateActiveWord])

    // Initialize fabric canvas for overlays
    useEffect(() => {
        if (!canvasRef.current) return

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 1920,
            height: 1080,
            backgroundColor: 'transparent',
        })

        fabricCanvasRef.current = canvas

        canvas.on('selection:created', (e) => {
            if (e.selected[0]?.layerId) {
                setSelectedLayer(e.selected[0].layerId)
            }
        })

        canvas.on('selection:updated', (e) => {
            if (e.selected[0]?.layerId) {
                setSelectedLayer(e.selected[0].layerId)
            }
        })

        canvas.on('selection:cleared', () => {
            setSelectedLayer(null)
        })

        canvas.on('object:modified', (e) => {
            const obj = e.target
            if (obj.layerId) {
                // Convert back from viewport coordinates to design space (1920x1080)
                const scaleX = canvas.getWidth() / 1920
                const scaleY = canvas.getHeight() / 1080
                const scale = Math.min(scaleX, scaleY)

                updateLayer(obj.layerId, {
                    left: obj.left / scale,
                    top: obj.top / scale,
                    scaleX: obj.scaleX / scale,
                    scaleY: obj.scaleY / scale,
                    angle: obj.angle,
                })
            }
        })

        // Set canvas dimensions to match container
        const resizeCanvas = () => {
            const container = canvasRef.current?.parentElement
            if (container) {
                const { width, height } = container.getBoundingClientRect()
                canvas.setDimensions({ width, height })
                canvas.calcOffset()
            }
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            canvas.dispose()
        }
    }, [])

    // Update canvas layers
    useEffect(() => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        // Check if canvas is properly initialized before clearing
        try {
            if (canvas.getContext()) {
                canvas.clear()
                canvas.backgroundColor = 'transparent'
            } else {
                return // Canvas not ready yet
            }
        } catch (error) {
            console.warn('Canvas not ready:', error)
            return
        }

        // Calculate scale factor from design space (1920x1080) to actual canvas size
        const scaleX = canvas.getWidth() / 1920
        const scaleY = canvas.getHeight() / 1080
        const scale = Math.min(scaleX, scaleY)

        let visibleWordCount = 0
        let totalWordLayers = 0

        console.log(`=== Canvas Update: Total layers = ${layers.length}, Time = ${currentTime.toFixed(2)} ===`)

        // Debug: Print first word layer details
        const firstWordLayer = layers.find(l => l.isWordLayer)
        if (firstWordLayer) {
            console.log('🔍 First word layer:', JSON.stringify(firstWordLayer, null, 2))
        }

        layers.forEach((layer, index) => {
            if (layer.isWordLayer) {
                totalWordLayers++
                if (totalWordLayers === 1) {
                    console.log(`🔍 Processing first word layer at index ${index}:`, layer)
                }
            }

            // For word layers, check if they should be visible with timing buffer
            if (layer.isWordLayer && !showAllWords) {
                // Add 0.3 second buffer for better sync
                const bufferedTime = currentTime + 0.3
                const isVisible = bufferedTime >= layer.startTime && bufferedTime <= (layer.endTime + 0.5)
                
                if (isVisible) {
                    visibleWordCount++
                    console.log(`✅ Showing word: "${layer.text}" at buffered time ${bufferedTime.toFixed(2)} (${layer.startTime}-${layer.endTime})`)
                } else {
                    // Skip invisible word layers
                    return
                }
            }

            let fabricObject = null

            if (layer.type === 'text') {
                // For word layers, use FIXED POSITION to test visibility
                let scaledLeft, scaledTop, scaledFontSize

                if (layer.isWordLayer) {
                    // Word layers: center of screen, no scaling issues
                    scaledLeft = canvas.getWidth() / 2
                    scaledTop = canvas.getHeight() / 2
                    scaledFontSize = 60
                    console.log(`🎯 WORD LAYER: "${layer.text}" at CENTER (${scaledLeft.toFixed(0)}, ${scaledTop.toFixed(0)}) fontSize: ${scaledFontSize}`)
                } else {
                    // Regular text layers: use design space scaling
                    scaledLeft = (layer.left || 100) * scale
                    scaledTop = (layer.top || 100) * scale
                    scaledFontSize = (layer.fontSize || 48) * scale
                    console.log(`📝 Regular text: "${layer.text}" at (${scaledLeft.toFixed(0)}, ${scaledTop.toFixed(0)}) fontSize: ${scaledFontSize.toFixed(0)}`)
                }

                fabricObject = new fabric.Text(layer.text || 'Text', {
                    left: scaledLeft,
                    top: scaledTop,
                    fontSize: scaledFontSize,
                    fill: layer.fill || '#FFFFFF',
                    fontFamily: layer.fontFamily || 'Arial',
                    fontWeight: layer.fontWeight || 'bold',
                    fontStyle: layer.fontStyle || 'normal',
                    stroke: layer.isWordLayer ? '#000000' : '#000000',
                    strokeWidth: layer.isWordLayer ? 3 : 2,
                    shadow: new fabric.Shadow({
                        color: 'rgba(0,0,0,0.8)',
                        blur: 10,
                        offsetX: 2,
                        offsetY: 2
                    }),
                    selectable: true,
                    editable: false,
                    originX: layer.isWordLayer ? 'center' : 'left',
                    originY: layer.isWordLayer ? 'center' : 'top'
                })
            } else if (layer.type === 'image') {
                fabric.Image.fromURL(layer.src, (img) => {
                    img.set({
                        left: (layer.left || 100) * scale,
                        top: (layer.top || 100) * scale,
                        scaleX: (layer.scaleX || 1) * scale,
                        scaleY: (layer.scaleY || 1) * scale,
                        angle: layer.angle || 0,
                    })
                    img.layerId = layer.id
                    canvas.add(img)
                    canvas.renderAll()
                })
                return
            } else {
                console.log(`❌ Skipping layer type: ${layer.type}, isWord: ${!!layer.isWordLayer}, text: "${layer.text}"`)
            }

            if (fabricObject) {
                fabricObject.layerId = layer.id
                fabricObject.set({
                    scaleX: (layer.scaleX || 1) * scale,
                    scaleY: (layer.scaleY || 1) * scale,
                    angle: layer.angle || 0,
                })
                canvas.add(fabricObject)
                console.log(`✅ Added to canvas: "${layer.text}" (ID: ${layer.id})`)
            }
        })

        console.log(`📊 Total word layers: ${totalWordLayers}, Visible words: ${visibleWordCount}, Canvas objects: ${canvas.getObjects().length}`)

        // ADD TEST OBJECTS TO VERIFY CANVAS RENDERING
        const testRect = new fabric.Rect({
            left: 50,
            top: 50,
            width: 200,
            height: 100,
            fill: 'red',
            opacity: 0.7
        })
        canvas.add(testRect)

        const testText = new fabric.Text('CANVAS TEST', {
            left: 100,
            top: 80,
            fontSize: 30,
            fill: 'white',
            fontWeight: 'bold'
        })
        canvas.add(testText)

        canvas.renderAll()
        console.log(`🎨 Final canvas objects after render: ${canvas.getObjects().length}`)
    }, [layers, currentTime, showAllWords])

    const handleProgress = ({ playedSeconds }) => {
        // Round to 2 decimal places for precise timing
        const preciseTiming = Math.round(playedSeconds * 100) / 100
        setCurrentTime(preciseTiming)
    }

    const handleDuration = (duration) => {
        setVideoDuration(duration)
    }

    const handleSeek = (value) => {
        const time = value[0]
        setCurrentTime(time)
        if (playerRef.current) {
            playerRef.current.seekTo(time, 'seconds')
        }
    }

    const togglePlay = () => {
        setIsPlaying(!isPlaying)
    }

    const skipTime = (seconds) => {
        const newTime = Math.max(0, Math.min(videoDuration, currentTime + seconds))
        setCurrentTime(newTime)
        if (playerRef.current) {
            playerRef.current.seekTo(newTime, 'seconds')
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!videoUrl) {
        return (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <p className="text-muted-foreground">No video loaded</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                <div className="relative w-full h-full">
                    <ReactPlayer
                        ref={playerRef}
                        url={videoUrl}
                        playing={isPlaying}
                        onProgress={handleProgress}
                        onDuration={handleDuration}
                        width="100%"
                        height="100%"
                        progressInterval={50} // Update every 50ms for smoother sync
                        playsinline
                        controls={false}
                    />

                    {/* Simple Word Overlay - Draggable */}
                    {(() => {
                        // Apply speed offset for timing adjustment
                        const adjustedTime = currentTime + captionStyle.speedOffset

                        // Find word with better precision
                        const visibleWord = layers.find(l =>
                            l.isWordLayer &&
                            adjustedTime >= l.startTime &&
                            adjustedTime <= l.endTime
                        )

                        if (!visibleWord && !showAllWords) return null

                        const displayWord = showAllWords
                            ? layers.find(l => l.isWordLayer)
                            : visibleWord

                        if (!displayWord) return null

                        return (
                            <Draggable
                                position={wordPosition}
                                onDrag={(e, data) => setWordPosition({ x: data.x, y: data.y })}
                                bounds="parent"
                            >
                                <div
                                    className="absolute cursor-move"
                                    style={{
                                        left: '50%',
                                        top: `${captionStyle.verticalPosition}%`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 15,
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: `${captionStyle.fontSize}px`,
                                            color: captionStyle.fill,
                                            fontFamily: captionStyle.fontFamily,
                                            fontWeight: captionStyle.fontWeight,
                                            textShadow: `${captionStyle.shadowX}px ${captionStyle.shadowY}px ${captionStyle.shadowBlur}px rgba(0,0,0,${captionStyle.shadowOpacity})`,
                                            padding: '10px 20px',
                                            userSelect: 'none',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {displayWord.text}
                                    </div>
                                </div>
                            </Draggable>
                        )
                    })()}

                    {/* Canvas overlay for layers */}
                    <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 10 }}>
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full"
                            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
                        />
                    </div>

                    {/* Debug info */}
                    <div className="absolute top-2 left-2 bg-black/90 text-white text-xs p-3 rounded font-mono max-w-xs" style={{ zIndex: 20 }}>
                        <div className="font-bold text-yellow-400 mb-1">DEBUG INFO</div>
                        <div>Layers: {layers.length}</div>
                        <div>Words: {layers.filter(l => l.isWordLayer).length}</div>
                        <div>Time: {currentTime.toFixed(2)}s</div>
                        <div className="text-green-400">
                            Visible: {layers.filter(l => l.isWordLayer && (currentTime + 0.3) >= l.startTime && (currentTime + 0.3) <= (l.endTime + 0.5)).length}
                        </div>
                        <div className="text-blue-400">
                            Buffered Time: {(currentTime + 0.3).toFixed(2)}s
                        </div>
                        {/* Show current visible word */}
                        {(() => {
                            const visibleWord = layers.find(l =>
                                l.isWordLayer &&
                                currentTime >= l.startTime &&
                                currentTime <= l.endTime
                            )
                            if (visibleWord) {
                                return (
                                    <div className="mt-2 pt-2 border-t border-yellow-500">
                                        <div className="text-yellow-300 font-bold">Current Word:</div>
                                        <div className="text-2xl font-bold text-yellow-400 my-1">"{visibleWord.text}"</div>
                                        <div className="text-xs text-gray-300">
                                            Time: {visibleWord.startTime.toFixed(2)} - {visibleWord.endTime.toFixed(2)}s
                                        </div>
                                        <div className="text-xs text-gray-300">
                                            Pos: ({visibleWord.left}, {visibleWord.top})
                                        </div>
                                    </div>
                                )
                            } else if (layers.filter(l => l.isWordLayer).length > 0) {
                                return (
                                    <div className="mt-2 pt-2 border-t border-red-500">
                                        <div className="text-red-400">No word at this time</div>
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-4">
                {/* Timeline Slider */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">
                        {formatTime(currentTime)}
                    </span>
                    <Slider
                        value={[currentTime]}
                        max={videoDuration || 100}
                        step={0.01}
                        onValueChange={handleSeek}
                        className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-12">
                        {formatTime(videoDuration)}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => skipTime(-5)}
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        onClick={togglePlay}
                    >
                        {isPlaying ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => skipTime(5)}
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>

                    <Button
                        variant={showAllWords ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAllWords(!showAllWords)}
                        className="ml-4"
                    >
                        {showAllWords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showAllWords ? 'Hide All Words' : 'Show All Words'}
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            console.log('=== LAYERS DEBUG ===')
                            console.log('Total layers:', layers.length)
                            console.log('Word layers:', layers.filter(l => l.isWordLayer))
                            console.log('All layers:', layers)
                            alert(`Total: ${layers.length} layers, Words: ${layers.filter(l => l.isWordLayer).length}`)
                        }}
                        className="ml-2"
                    >
                        Debug Layers
                    </Button>
                </div>
            </div>
        </div>
    )
}
