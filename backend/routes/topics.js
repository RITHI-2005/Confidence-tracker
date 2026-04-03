import express from 'express';
import Topic from '../models/Topic.js';
import ConfidenceLog from '../models/ConfidenceLog.js';
import Activity from '../models/Activity.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/topics - list topics
router.get('/', protect, async (req, res) => {
  try {
    const topics = await Topic.find().sort({ subject: 1, name: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/topics - create topic (admin/teacher)
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const topic = await Topic.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/topics/recommendations/:userId - weak/strong topics for recommendations
router.get('/recommendations/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [confLogs, activities] = await Promise.all([
      ConfidenceLog.find({ userId }).populate('topicId').populate('skillId'),
      Activity.find({ userId, type: { $in: ['quiz', 'test'] } }).populate('topicId').populate('skillId')
    ]);

    const topicScores = {};
    confLogs.forEach(c => {
      const ref = c.skillId || c.topicId;
      const key = ref?._id?.toString();
      if (!key) return;
      if (!topicScores[key]) topicScores[key] = { topic: ref, confLevels: [], scores: [] };
      topicScores[key].confLevels.push(c.confidenceLevel);
    });

    activities.forEach(a => {
      const ref = a.skillId || a.topicId;
      const key = ref?._id?.toString();
      if (!key) return;
      if (!topicScores[key]) topicScores[key] = { topic: ref, confLevels: [], scores: [] };
      if (a.score != null && a.maxScore) topicScores[key].scores.push((a.score / a.maxScore) * 100);
    });

    const weakTopics = [];
    const strongTopics = [];

    Object.entries(topicScores).forEach(([id, data]) => {
      const avgConf = data.confLevels.length
        ? data.confLevels.reduce((a, b) => a + b, 0) / data.confLevels.length
        : 0;
      const avgScore = data.scores.length
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0;

      if (avgConf <= 2.5 || avgScore < 60) {
        weakTopics.push({ topicId: id, topic: data.topic, avgConfidence: avgConf, avgScore });
      } else if (avgConf >= 4 || avgScore >= 80) {
        strongTopics.push({ topicId: id, topic: data.topic, avgConfidence: avgConf, avgScore });
      }
    });

    weakTopics.sort((a, b) => a.avgConfidence - b.avgConfidence);
    strongTopics.sort((a, b) => b.avgConfidence - a.avgConfidence);

    res.json({ weakTopics, strongTopics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
