import { create } from 'zustand'

// Load custom fonts from localStorage on init
const loadCustomFonts = () => {
    try {
        const saved = localStorage.getItem('customFonts')
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

// Save custom fonts to localStorage
const saveCustomFonts = (fonts) => {
    try {
        localStorage.setItem('customFonts', JSON.stringify(fonts))
    } catch (error) {
        console.error('Failed to save fonts:', error)
    }
}

export const useEditorStore = create((set, get) => ({
    // Video state
    videoUrl: null,
    uploadedVideoPath: null,
    videoDuration: 0,
    currentTime: 0,
    isPlaying: false,

    setVideoUrl: (url) => set({ videoUrl: url }),
    setUploadedVideoPath: (path) => set({ uploadedVideoPath: path }),
    setVideoDuration: (duration) => set({ videoDuration: duration }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),

    // Caption styling
    captionStyle: {
        fontFamily: 'Arial',
        fontSize: 80,
        fill: '#FFFF00',
        fontWeight: 'bold',
        shadowBlur: 10,
        shadowX: 3,
        shadowY: 3,
        shadowOpacity: 0.9,
        verticalPosition: 50,
        speedOffset: 0
    },

    customFonts: loadCustomFonts(),

    updateCaptionStyle: (updates) => {
        const newStyle = { ...get().captionStyle, ...updates }
        
        set({ captionStyle: newStyle })
        
        // Force canvas re-render by updating timestamp
        const wordLayers = get().layers.filter(l => l.isWordLayer)
        if (wordLayers.length > 0) {
            console.log('🎨 Applying caption style changes to', wordLayers.length, 'word layers')
            // Trigger re-render - the canvas will pick up new captionStyle
            set({ layers: [...get().layers] })
        }
    },

    addCustomFont: (fontName) => set((state) => {
        const newFonts = [...state.customFonts, fontName]
        saveCustomFonts(newFonts)
        return { customFonts: newFonts }
    }),

    // Canvas layers
    layers: [],
    selectedLayerId: null,

    addLayer: (layer) => set((state) => ({
        layers: [...state.layers, { ...layer, id: Date.now().toString() + Math.random() }]
    })),

    updateLayer: (id, updates) => set((state) => ({
        layers: state.layers.map((layer) =>
            layer.id === id ? { ...layer, ...updates } : layer
        )
    })),

    updateAllWordLayers: (updates) => set((state) => ({
        layers: state.layers.map((layer) =>
            layer.isWordLayer ? { ...layer, ...updates } : layer
        )
    })),

    createWordLayers: () => {
        const { wordTimestamps, videoDuration, captionStyle } = get()
        if (!wordTimestamps.length) return

        const wordLayers = wordTimestamps.map((item, index) => ({
            id: `word-${Date.now()}-${index}`,
            type: 'text',
            text: item.word,
            left: 960, // Center horizontally for 1920px canvas
            top: 850,
            fontSize: captionStyle.fontSize,
            fill: captionStyle.fill,
            fontFamily: captionStyle.fontFamily,
            fontWeight: captionStyle.fontWeight,
            startTime: item.start,
            endTime: item.end,
            isWordLayer: true,
            wordIndex: index
        }))

        set((state) => ({
            layers: [...state.layers, ...wordLayers]
        }))
    },

    removeLayer: (id) => set((state) => ({
        layers: state.layers.filter((layer) => layer.id !== id),
        selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId
    })),

    reorderLayers: (newLayers) => set({ layers: newLayers }),

    setSelectedLayer: (id) => set({ selectedLayerId: id }),

    // Script sync
    script: '',
    wordTimestamps: [],
    activeWordIndex: -1,

    setScript: (text) => {
        // Clear old word layers when script is changed
        const { layers } = get()
        const nonWordLayers = layers.filter(l => !l.isWordLayer)
        
        set({ 
            script: text, 
            layers: nonWordLayers,
            wordTimestamps: [],
            activeWordIndex: -1
        })
    },

    setWordTimestamps: (timestamps) => {
        // Clear old word layers when new timestamps are set
        const { layers } = get()
        const nonWordLayers = layers.filter(l => !l.isWordLayer)
        
        set({ 
            wordTimestamps: timestamps,
            layers: nonWordLayers,
            activeWordIndex: -1
        })
    },

    updateActiveWord: () => {
        const { currentTime, wordTimestamps } = get()

        if (!wordTimestamps.length) {
            set({ activeWordIndex: -1 })
            return
        }

        // Add small buffer for better sync (0.2 seconds ahead)
        const adjustedTime = currentTime + 0.2;

        // Find the active word based on adjusted current time
        let activeIndex = -1
        for (let i = 0; i < wordTimestamps.length; i++) {
            const word = wordTimestamps[i]
            if (adjustedTime >= word.start && adjustedTime <= word.end) {
                activeIndex = i
                break
            }
        }
        
        // If no exact match, find the closest upcoming word
        if (activeIndex === -1) {
            for (let i = 0; i < wordTimestamps.length; i++) {
                if (adjustedTime <= wordTimestamps[i].start) {
                    activeIndex = Math.max(0, i - 1)
                    break
                }
            }
        }

        set({ activeWordIndex: activeIndex })
    },

    // Timeline clips
    clips: [],

    addClip: (clip) => set((state) => ({
        clips: [...state.clips, clip]
    })),

    updateClip: (id, updates) => set((state) => ({
        clips: state.clips.map((clip) =>
            clip.id === id ? { ...clip, ...updates } : clip
        )
    })),

    removeClip: (id) => set((state) => ({
        clips: state.clips.filter((clip) => clip.id !== id)
    })),

    // Export
    isExporting: false,
    exportProgress: 0,

    setExporting: (exporting) => set({ isExporting: exporting }),
    setExportProgress: (progress) => set({ exportProgress: progress }),
}))
