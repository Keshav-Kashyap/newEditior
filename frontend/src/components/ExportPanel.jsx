import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Download, Loader2 } from 'lucide-react'

export function ExportPanel() {
    const {
        videoUrl,
        uploadedVideoPath,
        layers,
        wordTimestamps,
        captionStyle,
        isExporting,
        exportProgress,
        setExporting,
        setExportProgress,
    } = useEditorStore()

    const handleExport = async () => {
        console.log('🎬 Export button clicked!')
        console.log('Video URL:', videoUrl)
        console.log('Uploaded Path:', uploadedVideoPath)
        console.log('Layers:', layers.length)

        if (!videoUrl || !uploadedVideoPath) {
            alert('Please upload a video first')
            return
        }

        setExporting(true)
        setExportProgress(0)

        try {
            // Extract word timestamps from word layers
            const wordLayers = layers.filter(l => l.isWordLayer)
            const timestamps = wordLayers.length > 0
                ? wordLayers.map(l => ({
                    word: l.text,
                    start: l.startTime,
                    end: l.endTime
                }))
                : wordTimestamps

            console.log('🎬 Exporting with:', {
                wordLayers: wordLayers.length,
                timestamps: timestamps.length,
                captionStyle
            })

            console.log('📤 Sending export request to backend...')

            const exportData = {
                videoUrl: uploadedVideoPath, // Backend needs file path, not blob URL
                captionStyle: {
                    fontFamily: captionStyle.fontFamily,
                    fontSize: captionStyle.fontSize,
                    fill: captionStyle.fill,
                    fontWeight: captionStyle.fontWeight,
                    shadowBlur: captionStyle.shadowBlur,
                    shadowX: captionStyle.shadowX,
                    shadowY: captionStyle.shadowY,
                    shadowOpacity: captionStyle.shadowOpacity,
                    verticalPosition: captionStyle.verticalPosition,
                    speedOffset: captionStyle.speedOffset || 0
                },
                layers: layers.map(layer => ({
                    type: layer.type,
                    text: layer.text,
                    fontSize: layer.fontSize,
                    fontFamily: layer.fontFamily,
                    fill: layer.fill,
                    left: layer.left,
                    top: layer.top,
                    scaleX: layer.scaleX,
                    scaleY: layer.scaleY,
                    angle: layer.angle,
                    src: layer.src,
                    isWordLayer: layer.isWordLayer,
                    startTime: layer.startTime,
                    endTime: layer.endTime
                })),
                wordTimestamps: timestamps,
            }

            // Send to backend for FFmpeg rendering
            const response = await fetch('http://localhost:3000/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportData)
            })

            console.log('📥 Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Export failed:', errorText)
                throw new Error('Export failed: ' + errorText)
            }

            // Poll for progress
            const { jobId } = await response.json()
            console.log('✅ Export job started:', jobId)

            const pollProgress = setInterval(async () => {
                try {
                    const progressResponse = await fetch(`http://localhost:3000/api/export/progress/${jobId}`)
                    const progressData = await progressResponse.json()

                    console.log('📊 Progress:', progressData)

                    const { progress, status, downloadUrl } = progressData

                    setExportProgress(progress)

                    if (status === 'complete') {
                        clearInterval(pollProgress)
                        setExporting(false)

                        console.log('✅ Export complete! Download URL:', downloadUrl)

                        // Download the file
                        const a = document.createElement('a')
                        a.href = downloadUrl
                        a.download = 'exported-video.mp4'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)

                        alert('✅ Video exported successfully!')
                    } else if (status === 'failed') {
                        clearInterval(pollProgress)
                        setExporting(false)
                        console.error('❌ Export failed')
                        alert('❌ Export failed. Check backend console for details.')
                    }
                } catch (err) {
                    console.error('❌ Progress check error:', err)
                }
            }, 1000)

        } catch (error) {
            console.error('Export error:', error)
            alert('Export failed: ' + error.message)
            setExporting(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Debug Info */}
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                <div><strong>Debug:</strong></div>
                <div>Video: {videoUrl ? '✅' : '❌'}</div>
                <div>Path: {uploadedVideoPath ? '✅' : '❌'}</div>
                <div>Layers: {layers.length}</div>
                <div>Word Layers: {layers.filter(l => l.isWordLayer).length}</div>
                <div>Can Export: {(videoUrl && !isExporting) ? '✅ YES' : '❌ NO'}</div>
            </div>

            <div className="space-y-2">
                <h3 className="font-semibold">Export Settings</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolution:</span>
                        <span className="font-medium">1920x1080</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span className="font-medium">MP4</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Codec:</span>
                        <span className="font-medium">H.264</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Layers:</span>
                        <span className="font-medium">{layers.length}</span>
                    </div>
                </div>
            </div>

            {isExporting && (
                <div className="space-y-2">
                    <Label>Rendering: {Math.round(exportProgress)}%</Label>
                    <Progress value={exportProgress} />
                    <p className="text-xs text-muted-foreground">
                        FFmpeg is rendering your video with all layers and effects...
                    </p>
                </div>
            )}

            <Button
                onClick={handleExport}
                disabled={!videoUrl || isExporting}
                className="w-full"
                size="lg"
                variant={(!videoUrl || isExporting) ? "secondary" : "default"}
            >
                {isExporting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        {!videoUrl ? 'Upload Video First' : 'Export Video'}
                    </>
                )}
            </Button>

            <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium">Export Notes</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Backend uses FFmpeg for high-quality rendering</li>
                    <li>All layers and text overlays will be burned in</li>
                    <li>Word sync animations are rendered at precise timestamps</li>
                    <li>Export time depends on video length (~1x realtime)</li>
                </ul>
            </div>
        </div>
    )
}
