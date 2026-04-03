import express from 'express';
import User from '../models/User.js';
import ConfidenceLog from '../models/ConfidenceLog.js';
import Activity from '../models/Activity.js';
import Feedback from '../models/Feedback.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All teacher routes require teacher or admin role
router.use(protect, authorize('teacher', 'admin'));

// GET /api/teacher/topics
// Return teacher-specific topics/skills plus global topics (no createdBy)
router.get('/topics', async (req, res) => {
  try {
    const teacherId = req.user._id;

    const [topics, skills] = await Promise.all([
      Topic.find({
        $or: [
          { createdBy: teacherId },
          { createdBy: null },
          { createdBy: { $exists: false } }
        ]
      }).sort({ subject: 1, name: 1 }),
      Skill.find({
        $or: [
          { createdBy: teacherId },
          { createdBy: null },
          { createdBy: { $exists: false } }
        ]
      }).sort({ name: 1 })
    ]);

    const my = [
      ...topics
        .filter((t) => t.createdBy && t.createdBy.equals(teacherId))
        .map((t) => ({
          id: t._id,
          name: t.name,
          subject: t.subject,
          kind: 'topic'
        })),
      ...skills
        .filter((s) => s.createdBy && s.createdBy.equals(teacherId))
        .map((s) => ({
          id: s._id,
          name: s.name,
          subject: null,
          kind: 'skill'
        }))
    ];

    const global = [
      ...topics
        .filter((t) => !t.createdBy)
        .map((t) => ({
          id: t._id,
          name: t.name,
          subject: t.subject,
          kind: 'topic'
        })),
      ...skills
        .filter((s) => !s.createdBy)
        .map((s) => ({
          id: s._id,
          name: s.name,
          subject: null,
          kind: 'skill'
        }))
    ];

    res.json({ my, global });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email learningGoals createdAt')
      .sort({ name: 1 });

    const withStats = await Promise.all(students.map(async (s) => {
      const [confCount, lastConf, activities] = await Promise.all([
        ConfidenceLog.countDocuments({ userId: s._id }),
        ConfidenceLog.findOne({ userId: s._id }).sort({ date: -1 }),
        Activity.find({ userId: s._id }).sort({ date: -1 }).limit(5)
      ]);

      const avgConf = lastConf ? lastConf.confidenceLevel : null;
      const struggling = avgConf !== null && avgConf <= 2;

      return {
        ...s.toObject(),
        confLogCount: confCount,
        lastConfidence: avgConf,
        recentActivities: activities.length,
        struggling
      };
    }));

    res.json(withStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/student/:id
router.get('/student/:id', async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const [confidenceLogs, activities, feedbacks] = await Promise.all([
      ConfidenceLog.find({ userId: student._id }).populate('topicId', 'name subject').populate('skillId', 'name description').sort({ date: -1 }).limit(50),
      Activity.find({ userId: student._id }).populate('topicId', 'name subject').populate('skillId', 'name description').sort({ date: -1 }).limit(30),
      Feedback.find({ studentId: student._id }).populate('teacherId', 'name').sort({ createdAt: -1 })
    ]);

    const confByTopic = {};
    confidenceLogs.forEach(c => {
      const ref = c.skillId || c.topicId;
      const key = ref?._id?.toString() || 'unknown';
      const label = c.skillId?.name || c.topicId?.name || 'Unknown';
      if (!confByTopic[key]) confByTopic[key] = { topic: label, levels: [] };
      confByTopic[key].levels.push(c.confidenceLevel);
    });

    const topicStats = Object.entries(confByTopic).map(([id, v]) => ({
      topicId: id,
      topicName: v.topic,
      avgConfidence: v.levels.reduce((a, b) => a + b, 0) / v.levels.length,
      count: v.levels.length
    }));

    res.json({
      student,
      confidenceLogs,
      activities,
      feedbacks,
      topicStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teacher/feedback
router.post('/feedback', [
  (req, res, next) => {
    const { studentId, feedback, topicId } = req.body;
    if (!studentId || !feedback) return res.status(400).json({ message: 'studentId and feedback required' });
    next();
  }
], async (req, res) => {
  try {
    const fb = await Feedback.create({
      teacherId: req.user.id,
      studentId: req.body.studentId,
      topicId: req.body.topicId,
      feedback: req.body.feedback
    });
    res.status(201).json(fb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
