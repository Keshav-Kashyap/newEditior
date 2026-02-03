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
    const { videoUrl } = useEditorStore()

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="border-b px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Video Editor</h1>
                <VideoUpload />
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Section - Video + Controls */}
                <div className="flex-1 flex overflow-hidden">
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

                {/* Bottom Section - Timeline */}
                <div className="h-48 border-t">
                    <Timeline />
                </div>
            </div>
        </div>
    )
}
