import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export function VideoUpload() {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const { setVideoUrl, setUploadedVideoPath } = useEditorStore()

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)

        try {
            // Create blob URL for immediate preview
            const blobUrl = URL.createObjectURL(file)
            setVideoUrl(blobUrl)

            // Upload to backend
            const formData = new FormData()
            formData.append('video', file)

            const response = await fetch('http://localhost:3000/api/upload-video', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                // Save the uploaded file path
                setUploadedVideoPath(data.filePath)
                console.log('Video uploaded to backend:', data.filePath)
            }

            setOpen(false)
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Failed to upload video to server')
        } finally {
            setUploading(false)
        }
    }

    const handleUrlInput = (url) => {
        if (!url.trim()) return
        setVideoUrl(url)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Video</DialogTitle>
                    <DialogDescription>
                        Upload a video file or paste a URL to get started
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="file-upload"
                            className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted hover:bg-accent"
                        >
                            <div className="text-center">
                                {uploading ? (
                                    <>
                                        <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
                                        <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-muted-foreground">MP4, MOV, WebM</p>
                                    </>
                                )}
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
