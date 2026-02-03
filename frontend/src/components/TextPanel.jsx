import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Type, Image, Plus } from 'lucide-react'

export function TextPanel() {
    const [newText, setNewText] = useState('')
    const { addLayer } = useEditorStore()

    const addTextLayer = () => {
        if (!newText.trim()) return

        addLayer({
            type: 'text',
            text: newText,
            left: 100,
            top: 100,
            fontSize: 48,
            fill: '#ffffff',
            fontFamily: 'Arial',
        })

        setNewText('')
    }

    const addImageLayer = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'

        input.onchange = (e) => {
            const file = e.target.files[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = (event) => {
                addLayer({
                    type: 'image',
                    src: event.target.result,
                    name: file.name,
                    left: 100,
                    top: 100,
                })
            }
            reader.readAsDataURL(file)
        }

        input.click()
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="font-semibold">Add Text Layer</h3>
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter text..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') addTextLayer()
                        }}
                    />
                    <Button onClick={addTextLayer}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="font-semibold">Add Image Layer</h3>
                <Button onClick={addImageLayer} variant="outline" className="w-full">
                    <Image className="h-4 w-4 mr-2" />
                    Upload Image
                </Button>
            </div>

            <div className="pt-4 border-t space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            addLayer({
                                type: 'text',
                                text: 'Heading',
                                fontSize: 72,
                                fill: '#ffffff',
                                fontFamily: 'Arial',
                                fontWeight: 'bold',
                            })
                        }}
                    >
                        <Type className="h-3 w-3 mr-1" />
                        Heading
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            addLayer({
                                type: 'text',
                                text: 'Subtitle',
                                fontSize: 36,
                                fill: '#cccccc',
                                fontFamily: 'Arial',
                            })
                        }}
                    >
                        <Type className="h-3 w-3 mr-1" />
                        Subtitle
                    </Button>
                </div>
            </div>
        </div>
    )
}
