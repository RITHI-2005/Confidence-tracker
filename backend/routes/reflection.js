import express from 'express';
import { body, validationResult } from 'express-validator';
import Reflection from '../models/Reflection.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reflection/add - students only
router.post('/add', protect, authorize('student'), [
  body('reflectionText').trim().notEmpty().withMessage('Reflection text required'),
  body('mood').isIn(['Happy', 'Neutral', 'Stressed']).withMessage('Valid mood required'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Valid difficulty required'),
  body('selfAssessment').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const reflection = await Reflection.create({
      userId: req.user.id,
      ...req.body
    });
    res.status(201).json(reflection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reflection/user/:id
router.get('/user/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { limit = 50 } = req.query;
    const reflections = await Reflection.find({ userId })
      .populate('topicId', 'name subject')
      .populate('skillId', 'name description')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(reflections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
