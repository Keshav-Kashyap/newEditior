import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Trash2, MoveUp, MoveDown, Copy } from 'lucide-react'

export function LayersPanel() {
    const { layers, selectedLayerId, setSelectedLayer, removeLayer, reorderLayers, updateLayer, updateAllWordLayers, currentTime } = useEditorStore()

    const selectedLayer = layers.find((l) => l.id === selectedLayerId)
    const hasWordLayers = layers.some(l => l.isWordLayer)
    const isSelectedLayerWordLayer = selectedLayer?.isWordLayer

    const moveLayer = (index, direction) => {
        const newLayers = [...layers]
        const newIndex = direction === 'up' ? index - 1 : index + 1

        if (newIndex < 0 || newIndex >= layers.length) return

            ;[newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]]
        reorderLayers(newLayers)
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="font-semibold">Layers</h3>
                <div className="space-y-1">
                    {layers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No layers yet</p>
                    ) : (
                        layers.map((layer, index) => {
                            const isWordLayerVisible = layer.isWordLayer &&
                                currentTime >= layer.startTime &&
                                currentTime <= layer.endTime

                            return (
                                <div
                                    key={layer.id}
                                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${selectedLayerId === layer.id ? 'bg-accent border-primary' : 'border-border'
                                        } ${isWordLayerVisible ? 'ring-2 ring-green-500' : ''}`}
                                    onClick={() => setSelectedLayer(layer.id)}
                                >
                                    {layer.isWordLayer && (
                                        <span className={`w-2 h-2 rounded-full ${isWordLayerVisible ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    )}
                                    <span className="flex-1 text-sm truncate">
                                        {layer.type === 'text' ? layer.text || 'Text' : layer.name || layer.type}
                                    </span>
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
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            removeLayer(layer.id)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {selectedLayer && selectedLayer.type === 'text' && (
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Text Properties</h3>
                        {isSelectedLayerWordLayer && hasWordLayers && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const { text, fontSize, fill, fontFamily, fontWeight, ...otherProps } = selectedLayer
                                    updateAllWordLayers({
                                        fontSize,
                                        fill,
                                        fontFamily,
                                        fontWeight: fontWeight || 'normal',
                                        left: selectedLayer.left,
                                        top: selectedLayer.top
                                    })
                                }}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                Apply to All Words
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Text Content</Label>
                        <Input
                            value={selectedLayer.text || ''}
                            onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Font Size: {selectedLayer.fontSize || 48}px</Label>
                        <Slider
                            value={[selectedLayer.fontSize || 48]}
                            min={12}
                            max={200}
                            step={1}
                            onValueChange={([value]) => updateLayer(selectedLayer.id, { fontSize: value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <Input
                            type="color"
                            value={selectedLayer.fill || '#ffffff'}
                            onChange={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Input
                            value={selectedLayer.fontFamily || 'Arial'}
                            onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                            placeholder="Arial, Helvetica, etc."
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
