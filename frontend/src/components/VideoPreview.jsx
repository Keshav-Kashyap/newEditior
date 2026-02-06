import { useRef, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { fabric } from 'fabric'
import Draggable from 'react-draggable'
import { useEditorStore } from '@/store/editorStore'
import { Play, Pause, SkipBack, SkipForward, Eye, EyeOff, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export function VideoPreview() {
    const playerRef = useRef(null)
    const canvasRef = useRef(null)
    const fabricCanvasRef = useRef(null)
    const [showAllWords, setShowAllWords] = useState(false)
    const [wordPosition, setWordPosition] = useState({ x: 0, y: 0 })
    const [showFullscreenControls, setShowFullscreenControls] = useState(true)

    const {
        videoUrl,
        currentTime,
        videoDuration,
        isPlaying,
        isFullscreen,
        setCurrentTime,
        setVideoDuration,
        setIsPlaying,
        toggleFullscreen,
        updateActiveWord,
        layers,
        selectedLayerId,
        setSelectedLayer,
        updateLayer,
        captionStyle,
        globalEditMode
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

                const updateData = {
                    left: obj.left / scale,
                    top: obj.top / scale,
                    scaleX: obj.scaleX / scale,
                    scaleY: obj.scaleY / scale,
                    angle: obj.angle,
                }

                if (globalEditMode) {
                    // Global mode: Apply changes to all word layers
                    const wordLayers = layers.filter(layer => layer.isWordLayer)
                    wordLayers.forEach(layer => {
                        updateLayer(layer.id, updateData)
                    })
                    console.log(`🌐 Global edit: Updated ${wordLayers.length} word layers`)
                } else {
                    // Individual mode: Update only the selected layer
                    updateLayer(obj.layerId, updateData)
                    console.log(`🎯 Individual edit: Updated layer ${obj.layerId}`)
                }
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
                // For word layers, calculate position based on alignment
                let scaledLeft, scaledTop, scaledFontSize

                if (layer.isWordLayer) {
                    // CONTAINER-BASED POSITIONING: Words stay within defined bounds
                    const canvasWidth = canvas.getWidth()
                    const canvasHeight = canvas.getHeight()
                    
                    // Define word container bounds (80% of screen width, centered)
                    const containerWidth = canvasWidth * 0.8
                    const containerLeft = canvasWidth * 0.1  // 10% margin from left
                    const containerRight = canvasWidth * 0.9 // 10% margin from right
                    const containerCenterX = canvasWidth / 2
                    
                    // Position word in center of container
                    scaledLeft = containerCenterX
                    scaledTop = (canvasHeight * captionStyle.verticalPosition) / 100
                    scaledFontSize = (captionStyle.fontSize || 80) * scale
                    
                    console.log(`📦 CONTAINER WORD "${layer.text}": bounds=[${containerLeft.toFixed(0)}, ${containerRight.toFixed(0)}], center=${scaledLeft.toFixed(0)}`)
                    
                    // Optional: Draw container bounds for debugging (uncomment if needed)
                    // const boundingBox = new fabric.Rect({
                    //     left: containerLeft,
                    //     top: scaledTop - scaledFontSize/2,
                    //     width: containerWidth,
                    //     height: scaledFontSize * 1.5,
                    //     fill: 'transparent',
                    //     stroke: 'rgba(255,255,0,0.3)',
                    //     strokeWidth: 2,
                    //     selectable: false,
                    //     evented: false
                    // })
                    // canvas.add(boundingBox)
                } else {
                    // Regular text layers: use design space scaling
                    scaledLeft = (layer.left || 100) * scale
                    scaledTop = (layer.top || 100) * scale
                    scaledFontSize = (layer.fontSize || 48) * scale
                    console.log(`📝 Regular text: "${layer.text}" at (${scaledLeft.toFixed(0)}, ${scaledTop.toFixed(0)}) fontSize: ${scaledFontSize.toFixed(0)}`)
                }

                // Create fabric text object with container bounds and wrapping
                const textConfig = layer.isWordLayer ? {
                    left: scaledLeft,
                    top: scaledTop,
                    fontSize: scaledFontSize,
                    fill: captionStyle.fill || '#FFFF00',
                    fontFamily: captionStyle.fontFamily || 'Arial',
                    fontWeight: captionStyle.fontWeight || 'bold',
                    fontStyle: layer.fontStyle || 'normal',
                    textAlign: 'center',
                    originX: 'center',
                    originY: 'center',
                    // Container bounds - text wraps within these limits
                    width: canvas.getWidth() * 0.8, // 80% of canvas width
                    splitByGrapheme: false, // Better word wrapping
                    breakWords: true, // Allow breaking long words if needed
                    charSpacing: 0, // Normal character spacing
                    lineHeight: 1.2, // Line height for wrapped text
                    // Enhanced shadow and stroke for better readability
                    stroke: '#000000',
                    strokeWidth: 3,
                    shadow: captionStyle.shadowBlur > 0 ? new fabric.Shadow({
                        color: `rgba(0,0,0,${captionStyle.shadowOpacity})`,
                        blur: captionStyle.shadowBlur * scale,
                        offsetX: captionStyle.shadowX * scale,
                        offsetY: captionStyle.shadowY * scale
                    }) : new fabric.Shadow({
                        color: 'rgba(0,0,0,0.8)',
                        blur: 10 * scale,
                        offsetX: 2 * scale,
                        offsetY: 2 * scale
                    }),
                    selectable: true,
                    editable: false,
                    lockRotation: true, // Prevent rotation to maintain text readability
                    hasControls: true,
                    hasBorders: true,
                } : {
                    left: scaledLeft,
                    top: scaledTop,
                    fontSize: scaledFontSize,
                    fill: layer.fill || '#FFFFFF',
                    fontFamily: layer.fontFamily || 'Arial',
                    fontWeight: layer.fontWeight || 'bold',
                    fontStyle: layer.fontStyle || 'normal',
                    stroke: '#000000',
                    strokeWidth: 2,
                    shadow: new fabric.Shadow({
                        color: 'rgba(0,0,0,0.8)',
                        blur: 10,
                        offsetX: 2,
                        offsetY: 2
                    }),
                    selectable: true,
                    editable: false,
                    originX: 'left',
                    originY: 'top'
                };

                fabricObject = new fabric.Text(layer.text || 'Text', textConfig)
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
                <p className="text-muted-foreground text-sm">No video loaded</p>
            </div>
        )
    }

    return (
        <div className={`flex flex-col ${isFullscreen ? 'h-screen w-screen' : 'h-full'}`}>
            <div className={`flex-1 bg-black ${isFullscreen ? 'rounded-none' : 'rounded-lg'} overflow-hidden relative ${isFullscreen ? '' : 'min-h-[250px] md:min-h-0'}`}>
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
                                        display:"flex",
                                        justifyContent:"center",
                                        alignItems:"center",
                                        width: '100px',
                                        height: '50px',
                                        left: '50%',
                                        top: `${captionStyle.verticalPosition}%`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 15,
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: isFullscreen ? `${captionStyle.fontSize}px` : `${Math.min(captionStyle.fontSize * 0.4, 32)}px`, // Responsive font size
                                            color: captionStyle.fill,
                                            fontFamily: captionStyle.fontFamily,
                                            fontWeight: captionStyle.fontWeight,
                                            textShadow: `${captionStyle.shadowX}px ${captionStyle.shadowY}px ${captionStyle.shadowBlur}px rgba(0,0,0,${captionStyle.shadowOpacity})`,
                                            padding: isFullscreen ? '10px 20px' : '5px 10px',
                                            userSelect: 'none',
                                            whiteSpace: 'nowrap',
                                            textAlign: captionStyle.textAlign,
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
                </div>
            </div>

            {/* Fullscreen Controls Hide/Show Button */}
            {isFullscreen && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullscreenControls(!showFullscreenControls)}
                    className="fixed top-4 right-4 z-50 bg-black/50 text-white hover:bg-black/70 border border-white/30"
                >
                    {showFullscreenControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            )}

            {/* Fullscreen Controls - Can be hidden */}
            {isFullscreen && showFullscreenControls && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg p-3 space-y-2 z-50 border border-white/20">
                    {/* Timeline Slider */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-white w-12">
                            {formatTime(currentTime)}
                        </span>
                        <Slider
                            value={[currentTime]}
                            max={videoDuration || 100}
                            step={0.01}
                            onValueChange={handleSeek}
                            className="flex-1 w-64"
                        />
                        <span className="text-xs text-white w-12">
                            {formatTime(videoDuration)}
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => skipTime(-5)}
                            className="text-xs bg-black/50 text-white border-white/30 hover:bg-white/20"
                        >
                            <SkipBack className="h-4 w-4" />
                            <span className="ml-1">-5s</span>
                        </Button>

                        <Button
                            size="default"
                            onClick={togglePlay}
                            className="text-xs bg-white text-black hover:bg-gray-200"
                        >
                            {isPlaying ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            <span className="ml-1">{isPlaying ? 'Pause' : 'Play'}</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => skipTime(5)}
                            className="text-xs bg-black/50 text-white border-white/30 hover:bg-white/20"
                        >
                            <SkipForward className="h-4 w-4" />
                            <span className="ml-1">+5s</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="default"
                            onClick={toggleFullscreen}
                            className="ml-2 text-xs bg-black/50 text-white border-white/30 hover:bg-white/20"
                        >
                            <Minimize className="h-4 w-4" />
                            <span className="ml-1">Exit</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Regular Controls (Non-fullscreen) */}
            {!isFullscreen && (
                <div className="mt-2 md:mt-4 space-y-2 md:space-y-4">
                    {/* Timeline Slider */}
                    <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-xs text-muted-foreground w-8 md:w-12">
                            {formatTime(currentTime)}
                        </span>
                        <Slider
                            value={[currentTime]}
                            max={videoDuration || 100}
                            step={0.01}
                            onValueChange={handleSeek}
                            className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 md:w-12">
                            {formatTime(videoDuration)}
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => skipTime(-5)}
                            className="text-xs md:text-sm"
                        >
                            <SkipBack className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>

                        <Button
                            size="icon"
                            onClick={togglePlay}
                            className="text-xs md:text-sm"
                        >
                            {isPlaying ? (
                                <Pause className="h-3 w-3 md:h-4 md:w-4" />
                            ) : (
                                <Play className="h-3 w-3 md:h-4 md:w-4" />
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => skipTime(5)}
                            className="text-xs md:text-sm"
                        >
                            <SkipForward className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleFullscreen}
                            className="ml-1 md:ml-2 text-xs md:text-sm"
                        >
                            <Maximize className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>

                        {showAllWords && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setShowAllWords(false)}
                                className="ml-1 md:ml-4 text-xs hidden md:flex"
                            >
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide All Words
                            </Button>
                        )}

                        {!showAllWords && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAllWords(true)}
                                className="ml-1 md:ml-4 text-xs hidden md:flex"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Show All Words
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
