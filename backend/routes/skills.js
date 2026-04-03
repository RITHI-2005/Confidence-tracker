import express from 'express';
import { body, validationResult } from 'express-validator';
import Skill from '../models/Skill.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/skills - all users can view (for dropdowns)
router.get('/', protect, async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 }).populate('createdBy', 'name');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/skills - teacher/admin only
router.post('/', protect, authorize('teacher', 'admin'), [
  body('name').trim().notEmpty().withMessage('Skill name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const exists = await Skill.findOne({ name: req.body.name.trim() });
    if (exists) return res.status(400).json({ message: 'Skill with this name already exists' });

    const skill = await Skill.create({
      name: req.body.name.trim(),
      description: req.body.description?.trim() || '',
      createdBy: req.user.id
    });
    res.status(201).json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/skills/:id - teacher/admin only
router.put('/:id', protect, authorize('teacher', 'admin'), [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    if (req.body.name !== undefined) skill.name = req.body.name.trim();
    if (req.body.description !== undefined) skill.description = req.body.description?.trim() || '';
    await skill.save();
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/skills/:id - teacher/admin only
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
