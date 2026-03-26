import express from 'express';
import { body, validationResult } from 'express-validator';
import Activity from '../models/Activity.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/activity/add - students only
router.post('/add', protect, authorize('student'), [
  body('type').isIn(['topic', 'assignment', 'quiz', 'test', 'study']).withMessage('Valid type required'),
  body('title').optional().trim(),
  body('studyHours').optional().isNumeric(),
  body('score').optional().isNumeric(),
  body('maxScore').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const activity = await Activity.create({
      userId: req.user.id,
      ...req.body
    });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/activity/user/:id
router.get('/user/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { period = 'all', limit = 100 } = req.query;
    const filter = { userId };

    let startDate;
    if (period === 'weekly') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'monthly') startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (startDate) filter.date = { $gte: startDate };

    const activities = await Activity.find(filter)
      .populate('topicId', 'name subject')
      .populate('skillId', 'name description')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    const totalStudyHours = activities.reduce((acc, a) => acc + (a.studyHours || 0), 0);
    const streak = await getStreak(userId);

    res.json({ activities, totalStudyHours, streak });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getStreak(userId) {
  const activities = await Activity.find({ userId })
    .sort({ date: -1 })
    .distinct('date');

  const dates = activities.map(d => new Date(d).toDateString());
  const unique = [...new Set(dates)].sort().reverse();

  let streak = 0;
  const today = new Date().toDateString();
  let check = new Date();

  for (let i = 0; i < 365; i++) {
    const d = check.toDateString();
    if (unique.includes(d)) streak++;
    else if (i > 0 || d !== today) break;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export default router;
