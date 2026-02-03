import { useEditorStore } from '@/store/editorStore'
import { Eye, EyeOff, Trash2, MoveUp, MoveDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Timeline() {
  const { 
    layers, 
    selectedLayerId, 
    setSelectedLayer, 
    removeLayer,
    reorderLayers,
    videoDuration,
    currentTime 
  } = useEditorStore()

  const timelineWidth = 1600 // pixels - longer timeline for scrolling
  const secondWidth = 80 // pixels per second - fixed width

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const moveLayer = (index, direction) => {
    const newLayers = [...layers]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= layers.length) return
    
    ;[newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]]
    reorderLayers(newLayers)
  }

  return (
    <div className="h-full border-t bg-background flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Timeline</h3>
        <span className="text-xs text-muted-foreground">
          {layers.length} layer{layers.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Layer Names Column */}
        <div className="w-48 border-r bg-muted/20 overflow-y-auto">
          <div className="h-10 border-b bg-muted/30 flex items-center px-2">
            <span className="text-xs font-medium text-muted-foreground">LAYERS</span>
          </div>
          
          {layers.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">No layers</p>
            </div>
          ) : (
            <div className="py-1">
              {layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className={`h-12 px-2 flex items-center gap-2 border-b cursor-pointer transition-colors ${
                    selectedLayerId === layer.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-medium truncate">
                      {layer.type === 'text' ? layer.text || 'Text' : layer.name || 'Image'}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{layer.type}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveLayer(index, 'up')
                      }}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveLayer(index, 'down')
                      }}
                      disabled={index === layers.length - 1}
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLayer(layer.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline Track Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {/* Time Scale */}
          <div className="h-10 border-b bg-muted/30 relative" style={{ minWidth: `${timelineWidth}px` }}>
            {Array.from({ length: Math.ceil(videoDuration || 20) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-border/50"
                style={{ left: `${i * secondWidth}px` }}
              >
                <span className="text-xs text-muted-foreground ml-1 mt-1 inline-block">{i}</span>
              </div>
            ))}
            
            {/* Playhead */}
            <div
              className="absolute top-0 h-full w-0.5 bg-primary z-10"
              style={{ left: `${currentTime * secondWidth}px` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-primary rounded-full" />
            </div>
          </div>

          {/* Layer Duration Bars */}
          <div className="py-1" style={{ minWidth: `${timelineWidth}px` }}>
            {layers.length === 0 ? (
              <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
                Add layers to see them here
              </div>
            ) : (
              layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`h-12 border-b relative ${
                    selectedLayerId === layer.id ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  {/* Duration Bar - Full width for now */}
                  <div
                    className={`absolute top-2 bottom-2 left-0 rounded cursor-pointer transition-colors ${
                      selectedLayerId === layer.id
                        ? 'bg-primary'
                        : 'bg-primary/60 hover:bg-primary/80'
                    }`}
                    style={{ width: `${(videoDuration || 20) * secondWidth}px` }}
                  >
                    <div className="px-2 py-1 text-xs text-white font-medium truncate">
                      {layer.type === 'text' ? layer.text || 'Text' : layer.name || 'Image'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
