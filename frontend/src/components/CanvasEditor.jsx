import { useRef, useEffect, useState } from 'react'
import { fabric } from 'fabric'
import { useEditorStore } from '@/store/editorStore'

export function CanvasEditor() {
    const canvasRef = useRef(null)
    const fabricCanvasRef = useRef(null)
    const [dimensions] = useState({ width: 1920, height: 1080 })

    const { layers, selectedLayerId, setSelectedLayer, updateLayer, currentTime, captionStyle } = useEditorStore()

    useEffect(() => {
        if (!canvasRef.current) return

        // Initialize Fabric canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: '#000000',
        })

        fabricCanvasRef.current = canvas

        // Handle object selection
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

        // Handle object modifications
        canvas.on('object:modified', (e) => {
            const obj = e.target
            if (obj.layerId) {
                updateLayer(obj.layerId, {
                    left: obj.left,
                    top: obj.top,
                    scaleX: obj.scaleX,
                    scaleY: obj.scaleY,
                    angle: obj.angle,
                })
            }
        })

        return () => {
            canvas.dispose()
        }
    }, [])

    useEffect(() => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        console.log('🎨 Canvas rendering with:', {
            layersCount: layers.length,
            wordLayers: layers.filter(l => l.isWordLayer).length,
            nonWordLayers: layers.filter(l => !l.isWordLayer).length,
            currentTime,
            captionStyle,
            wordLayerTexts: layers.filter(l => l.isWordLayer).map(l => l.text)
        })

        // Clear canvas
        canvas.clear()
        canvas.backgroundColor = '#000000'

        // Render layers
        layers.forEach((layer) => {
            // Skip word layers that are not in their time range (with sync buffer)
            if (layer.isWordLayer) {
                // Add timing buffer for better synchronization
                const syncBuffer = 0.3 // 300ms ahead
                const bufferedTime = currentTime + syncBuffer
                const isVisible = bufferedTime >= layer.startTime && bufferedTime <= (layer.endTime + 0.5)
                
                console.log(`Word "${layer.text}" - start:${layer.startTime} end:${layer.endTime} current:${currentTime.toFixed(2)} buffered:${bufferedTime.toFixed(2)} visible:${isVisible}`)
                if (!isVisible) return
            }

            let fabricObject = null

            if (layer.type === 'text') {
                // Calculate horizontal position based on alignment for word layers
                let horizontalPosition = layer.left || 100;
                let textAlign = 'left';
                
                if (layer.isWordLayer) {
                    textAlign = captionStyle.textAlign || 'center';
                    // Calculate position based on alignment
                    switch (textAlign) {
                        case 'left':
                            horizontalPosition = dimensions.width * 0.1; // 10% from left
                            break;
                        case 'center':
                            horizontalPosition = dimensions.width * 0.5; // Center
                            break;
                        case 'right':
                            horizontalPosition = dimensions.width * 0.9; // 10% from right
                            break;
                        default:
                            horizontalPosition = dimensions.width * 0.5; // Default to center
                    }
                }

                // Use captionStyle for word layers, otherwise use layer properties
                const textConfig = layer.isWordLayer ? {
                    left: horizontalPosition,
                    top: (dimensions.height * captionStyle.verticalPosition) / 100,
                    fontSize: captionStyle.fontSize || 48,
                    fill: captionStyle.fill || '#ffffff',
                    fontFamily: captionStyle.fontFamily || 'Arial',
                    fontWeight: captionStyle.fontWeight || 'normal',
                    fontStyle: layer.fontStyle || 'normal',
                    textAlign: textAlign,
                    shadow: captionStyle.shadowBlur > 0 ? new fabric.Shadow({
                        color: `rgba(0,0,0,${captionStyle.shadowOpacity})`,
                        blur: captionStyle.shadowBlur,
                        offsetX: captionStyle.shadowX,
                        offsetY: captionStyle.shadowY
                    }) : null,
                    originX: 'center',
                    originY: 'center',
                } : {
                    left: layer.left || 100,
                    top: layer.top || 100,
                    fontSize: layer.fontSize || 48,
                    fill: layer.fill || '#ffffff',
                    fontFamily: layer.fontFamily || 'Arial',
                    fontWeight: layer.fontWeight || 'normal',
                    fontStyle: layer.fontStyle || 'normal',
                    originX: layer.originX || 'left',
                    originY: layer.originY || 'top',
                };
                
                fabricObject = new fabric.IText(layer.text || 'Text', textConfig)
            } else if (layer.type === 'image') {
                fabric.Image.fromURL(layer.src, (img) => {
                    img.set({
                        left: layer.left || 100,
                        top: layer.top || 100,
                        scaleX: layer.scaleX || 1,
                        scaleY: layer.scaleY || 1,
                        angle: layer.angle || 0,
                    })
                    img.layerId = layer.id
                    canvas.add(img)
                    canvas.renderAll()
                })
                return
            }

            if (fabricObject) {
                fabricObject.layerId = layer.id
                fabricObject.set({
                    scaleX: layer.scaleX || 1,
                    scaleY: layer.scaleY || 1,
                    angle: layer.angle || 0,
                })
                canvas.add(fabricObject)
            }
        })

        canvas.renderAll()
    }, [layers, currentTime, captionStyle, dimensions])

    return (
        <div className="w-full h-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <div className="relative" style={{ aspectRatio: '16/9', maxHeight: '100%', maxWidth: '100%' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    )
}
