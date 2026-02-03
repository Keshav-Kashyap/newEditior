import express from 'express';
import { createExportJob, getExportProgress } from '../services/exportService.js';

const router = express.Router();

router.post('/export', async (req, res) => {
  try {
    const { videoUrl, layers, wordTimestamps } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const jobId = await createExportJob({
      videoUrl,
      layers: layers || [],
      wordTimestamps: wordTimestamps || []
    });

    res.json({
      success: true,
      jobId,
      message: 'Export job created'
    });
  } catch (error) {
    console.error('Export creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/export/progress/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const progress = await getExportProgress(jobId);

    if (!progress) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Progress check error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
