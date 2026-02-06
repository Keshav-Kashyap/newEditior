import { VideoPreview } from './VideoPreview'
import { Timeline } from './Timeline'
import { CaptionSettings } from './CaptionSettings'
import { TextPanel } from './TextPanel'
import { ScriptPanel } from './ScriptPanel'
import { ExportPanel } from './ExportPanel'
import { VideoUpload } from './VideoUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useEditorStore } from '@/store/editorStore'

export function EditorLayout() {
    const { videoUrl, isFullscreen } = useEditorStore()

    // Fullscreen preview mode
    if (isFullscreen) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center">
                <VideoPreview />
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="border-b px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
                <h1 className="text-lg md:text-2xl font-bold">Video Editor</h1>
                <VideoUpload />
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Desktop Layout */}
                <div className="hidden md:flex flex-1 overflow-hidden">
                    {/* Video Preview - Full Width */}
                    <div className="flex-1 p-4 overflow-hidden">
                        <VideoPreview />
                    </div>

                    {/* Right Panel - Controls */}
                    <div className="w-80 border-l overflow-y-auto">
                        <Tabs defaultValue="text" className="h-full">
                            <TabsList className="w-full rounded-none border-b">
                                <TabsTrigger value="text" className="flex-1">Add</TabsTrigger>
                                <TabsTrigger value="captions" className="flex-1">Captions</TabsTrigger>
                                <TabsTrigger value="script" className="flex-1">Script</TabsTrigger>
                                <TabsTrigger value="export" className="flex-1">Export</TabsTrigger>
                            </TabsList>

                            <div className="p-4">
                                <TabsContent value="text" className="mt-0">
                                    <TextPanel />
                                </TabsContent>

                                <TabsContent value="captions" className="mt-0">
                                    <CaptionSettings />
                                </TabsContent>

                                <TabsContent value="script" className="mt-0">
                                    <ScriptPanel />
                                </TabsContent>

                                <TabsContent value="export" className="mt-0">
                                    <ExportPanel />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden flex flex-col h-full">
                    {/* Video Preview - Top - Much larger height for mobile */}
                    <div className="flex-1 p-2 min-h-[400px] max-h-[70vh]">
                        <VideoPreview />
                    </div>

                    {/* Controls Tabs - Bottom */}
                    <div className="h-72 bg-white flex-shrink-0 border-t">
                        <Tabs defaultValue="text" className="h-full">
                            <TabsList className="w-full rounded-none border-b bg-gray-100 h-10 flex-shrink-0">
                                <TabsTrigger value="text" className="flex-1 text-xs">Add</TabsTrigger>
                                <TabsTrigger value="captions" className="flex-1 text-xs">Captions</TabsTrigger>
                                <TabsTrigger value="script" className="flex-1 text-xs">Script</TabsTrigger>
                                <TabsTrigger value="export" className="flex-1 text-xs">Export</TabsTrigger>
                            </TabsList>

                            <div className="p-3 h-[calc(100%-2.5rem)] overflow-y-auto">
                                <TabsContent value="text" className="mt-0 h-full">
                                    <TextPanel />
                                </TabsContent>

                                <TabsContent value="captions" className="mt-0 h-full">
                                    <CaptionSettings />
                                </TabsContent>

                                <TabsContent value="script" className="mt-0 h-full">
                                    <ScriptPanel />
                                </TabsContent>

                                <TabsContent value="export" className="mt-0 h-full">
                                    <ExportPanel />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Desktop Timeline - Hidden on mobile */}
            <div className="hidden md:block h-48 border-t">
                <Timeline />
            </div>
        </div>
    )
}
