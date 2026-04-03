import express from 'express';
import { body, validationResult } from 'express-validator';
import ConfidenceLog from '../models/ConfidenceLog.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/confidence/add - students only (admin does not rate confidence)
router.post('/add', protect, authorize('student'), [
  body('confidenceLevel').isInt({ min: 1, max: 5 }).withMessage('Confidence must be 1-5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { skillId, topicId, confidenceLevel, notes } = req.body;
    if (!skillId && !topicId) return res.status(400).json({ message: 'skillId or topicId required' });

    const log = await ConfidenceLog.create({
      userId: req.user.id,
      skillId: skillId || undefined,
      topicId: topicId || undefined,
      confidenceLevel,
      notes
    });

    if (confidenceLevel <= 2) {
      await Notification.create({
        userId: req.user.id,
        type: 'low_confidence',
        title: 'Low Confidence Alert',
        message: `Your confidence was recorded as low (${confidenceLevel}/5). Consider revisiting the material.`
      });
    }

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/confidence/user/:id
router.get('/user/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { period = 'all', topicId, skillId } = req.query;
    const filter = { userId };

    if (topicId) filter.topicId = topicId;
    if (skillId) filter.skillId = skillId;

    let startDate;
    if (period === 'daily') startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (period === 'weekly') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'monthly') startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (startDate) filter.date = { $gte: startDate };

    const logs = await ConfidenceLog.find(filter)
      .populate('topicId', 'name subject')
      .populate('skillId', 'name description')
      .sort({ date: -1 })
      .limit(200);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/confidence/trends/:id
router.get('/trends/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await ConfidenceLog.find({ userId })
      .populate('topicId', 'name subject')
      .populate('skillId', 'name description')
      .sort({ date: 1 });

    const byTopic = {};
    logs.forEach(l => {
      const key = l.skillId?._id?.toString() || l.topicId?._id?.toString() || 'unknown';
      const label = l.skillId?.name || l.topicId?.name || 'Unknown';
      if (!byTopic[key]) byTopic[key] = { topic: label, data: [] };
      byTopic[key].data.push({ date: l.date, level: l.confidenceLevel });
    });

    res.json({ byTopic: Object.values(byTopic), raw: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
