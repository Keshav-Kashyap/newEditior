import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to set FFmpeg path (optional - works if ffmpeg is in PATH)
try {
  // If ffmpeg not in PATH, you can set it manually:
  // ffmpeg.setFfmpegPath('C:\\path\\to\\ffmpeg.exe');
} catch (error) {
  console.log('FFmpeg path not set, using system PATH');
}

// In-memory job store (use Redis/DB in production)
const jobs = new Map();

export async function createExportJob(data) {
  const jobId = uuidv4();

  jobs.set(jobId, {
    id: jobId,
    status: 'processing',
    progress: 0,
    createdAt: new Date(),
    data
  });

  // Start processing in background
  processExport(jobId, data).catch(error => {
    console.error(`Job ${jobId} failed:`, error);
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'failed',
      error: error.message
    });
  });

  return jobId;
}

export async function getExportProgress(jobId) {
  return jobs.get(jobId) || null;
}

function formatSrtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

async function processExport(jobId, data) {
  const { videoUrl, layers, wordTimestamps, captionStyle } = data;
  const outputFilename = `export_${jobId}.mp4`;
  const outputPath = path.join(__dirname, '../exports', outputFilename);
  const subtitlePath = path.join(__dirname, '../temp', `subtitles_${jobId}.srt`);

  // Use caption style from frontend or defaults
  const style = captionStyle || {
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
  };

  console.log('📝 Export with caption style:', style);
  console.log('📝 Word timestamps count:', wordTimestamps?.length || 0);

  // Create SRT subtitle file for word timestamps
  if (wordTimestamps && wordTimestamps.length > 0) {
    let srtContent = '';
    const speedOffset = style.speedOffset || 0;
    
    wordTimestamps.forEach((item, index) => {
      // Apply speed offset to timestamps
      const startTime = formatSrtTime((item.start || 0) + speedOffset);
      const endTime = formatSrtTime((item.end || (item.start + 0.3)) + speedOffset);

      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${item.word || ''}\n\n`;
    });

    console.log('📝 Created SRT file with', wordTimestamps.length, 'captions');
    await fs.writeFile(subtitlePath, srtContent, 'utf-8');
  } else {
    console.warn('⚠️ No word timestamps found for export!');
  }

  // Build FFmpeg command
  const command = ffmpeg(videoUrl);

  console.log('🎬 Building FFmpeg command...');
  console.log('📹 Input video:', videoUrl);

  // If we have subtitles, burn them into video with custom style
  if (wordTimestamps && wordTimestamps.length > 0) {
    console.log('✅ Adding subtitles with custom style...');
    const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');

    // Convert hex color to ASS format (AABBGGRR in hex)
    const hexColor = style.fill.replace('#', '');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    // ASS format: &HAABBGGRR (transparency + blue + green + red)
    const assColor = `&H00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`.toUpperCase();

    console.log('🎨 Color conversion:', {
      input: style.fill,
      r, g, b,
      assColor
    });

    // Calculate Y position from verticalPosition percentage (0-100)
    // Video height assumed 1080, margin from bottom
    const marginV = Math.round((100 - style.verticalPosition) * 10.8); // Convert % to pixels

    // Shadow settings - use simple outline for better visibility
    const outlineSize = Math.max(2, Math.round(style.shadowBlur / 3));
    const shadowDepth = Math.max(1, Math.round(Math.sqrt(style.shadowX ** 2 + style.shadowY ** 2) / 2));

    const forceStyle = [
      `FontName=${style.fontFamily}`,
      `FontSize=${style.fontSize}`,
      `PrimaryColour=${assColor}`,
      `OutlineColour=&H00000000`, // Black outline
      `BackColour=&H80000000`, // Semi-transparent black shadow
      `BorderStyle=1`,
      `Outline=${outlineSize}`,
      `Shadow=${shadowDepth}`,
      `Bold=${style.fontWeight === 'bold' ? -1 : 0}`,
      `Alignment=2`, // Bottom center
      `MarginV=${marginV}`,
      `Spacing=0`
    ].join(',');

    console.log('📐 Force style:', forceStyle);

    // Don't apply subtitles here, combine with other filters below
  }

  // Combine all video filters together
  const allFilters = [];
  
  // Add SRT subtitles if available
  if (wordTimestamps && wordTimestamps.length > 0) {
    const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const hexColor = style.fill.replace('#', '');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    const assColor = `&H00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`.toUpperCase();
    
    const marginV = Math.round((100 - style.verticalPosition) * 10.8);
    const outlineSize = Math.max(2, Math.round(style.shadowBlur / 3));
    const shadowDepth = Math.max(1, Math.round(Math.sqrt(style.shadowX ** 2 + style.shadowY ** 2) / 2));
    
    const forceStyle = [
      `FontName=${style.fontFamily}`,
      `FontSize=${style.fontSize}`,
      `PrimaryColour=${assColor}`,
      `OutlineColour=&H00000000`,
      `BackColour=&H80000000`,
      `BorderStyle=1`,
      `Outline=${outlineSize}`,
      `Shadow=${shadowDepth}`,
      `Bold=${style.fontWeight === 'bold' ? -1 : 0}`,
      `Alignment=2`,
      `MarginV=${marginV}`,
      `Spacing=0`
    ].join(',');
    
    allFilters.push(`subtitles='${escapedSubPath}':force_style='${forceStyle}'`);
    console.log('✅ Added SRT subtitles filter');
  }

  // Add static text layers
  const staticLayers = layers.filter(l => !l.isWordLayer && l.type === 'text');
  const wordLayers = layers.filter(l => l.isWordLayer && l.type === 'text');
  
  // Process static layers
  staticLayers.forEach((layer) => {
    const text = (layer.text || 'Text').replace(/'/g, "\\'").replace(/:/g, '\\:');
    const fontSize = layer.fontSize || 48;
    const fontColor = (layer.fill || '#ffffff').replace('#', '');
    const x = layer.left || 100;
    const y = layer.top || 100;

    allFilters.push(
      `drawtext=text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=0x${fontColor}`
    );
  });
  
  // Process word layers with timing if no SRT subtitles
  if (wordLayers.length > 0 && (!wordTimestamps || wordTimestamps.length === 0)) {
    console.log(`📝 Adding ${wordLayers.length} word layers as text overlays`);
    wordLayers.forEach((layer) => {
      const text = (layer.text || '').replace(/'/g, "\\'").replace(/:/g, '\\:');
      const fontSize = style.fontSize || 80;
      const fontColor = (style.fill || '#FFFF00').replace('#', '');
      const x = '(w-text_w)/2'; // Center horizontally
      const y = `(h*${style.verticalPosition || 85})/100`;
      
      const startTime = layer.startTime || 0;
      const endTime = layer.endTime || (startTime + 1);
      
      allFilters.push(
        `drawtext=text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=0x${fontColor}:enable='between(t,${startTime},${endTime})'`
      );
    });
  }

  // Apply all filters at once
  if (allFilters.length > 0) {
    command.videoFilters(allFilters);
    console.log('🎨 Applied all filters:', allFilters.length);
    console.log('🔍 Filters:', allFilters);
  } else {
    console.warn('⚠️ No filters to apply - captions may not appear!');
  }

  return new Promise((resolve, reject) => {
    command
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('copy')
      .on('start', (commandLine) => {
        console.log('FFmpeg started:', commandLine);
      })
      .on('progress', (progress) => {
        const percent = Math.min(Math.round(progress.percent || 0), 99);
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          jobs.set(jobId, {
            ...currentJob,
            progress: percent
          });
        }
        console.log(`Job ${jobId}: ${percent}%`);
      })
      .on('end', () => {
        console.log(`Job ${jobId}: Complete`);
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          jobs.set(jobId, {
            ...currentJob,
            status: 'complete',
            progress: 100,
            downloadUrl: `http://localhost:3000/exports/${outputFilename}`
          });
        }

        // Cleanup subtitle file
        fs.unlink(subtitlePath).catch(() => { });

        resolve();
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`Job ${jobId}: Error -`, err.message);
        console.error('FFmpeg stderr:', stderr);
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          jobs.set(jobId, {
            ...currentJob,
            status: 'failed',
            error: err.message
          });
        }

        // Cleanup subtitle file
        fs.unlink(subtitlePath).catch(() => { });

        reject(err);
      })
      .run();
  });
}
