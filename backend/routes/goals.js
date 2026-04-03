import express from 'express';
import { body, validationResult } from 'express-validator';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/goals/add - students only
router.post('/add', protect, authorize('student'), [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('type').optional().isIn(['short-term', 'long-term']),
  body('targetDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const goal = await Goal.create({
      userId: req.user.id,
      ...req.body
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/goals/user/:id
router.get('/user/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const goals = await Goal.find({ userId })
      .populate('skillId', 'name description')
      .sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { progress, completed } = req.body;
    if (progress !== undefined) goal.progress = Math.min(100, Math.max(0, progress));
    if (completed !== undefined) {
      goal.completed = completed;
      if (completed) {
        goal.completedAt = new Date();
        await Notification.create({
          userId: req.user.id,
          type: 'goal_complete',
          title: 'Goal Completed!',
          message: `You completed your goal: ${goal.title}`
        });
      }
    }

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
