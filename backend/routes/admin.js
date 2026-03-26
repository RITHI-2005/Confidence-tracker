import express from 'express';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import ConfidenceLog from '../models/ConfidenceLog.js';
import Activity from '../models/Activity.js';
import Goal from '../models/Goal.js';
import MockTest from '../models/MockTest.js';
import TestAttempt from '../models/TestAttempt.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes - admin only
router.use(protect, authorize('admin'));

// GET /api/admin/dashboard - system overview
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalTeachers, totalSkills, confidenceLogs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Skill.countDocuments(),
      ConfidenceLog.find().select('confidenceLevel userId date')
    ]);

    const avgConfidence = confidenceLogs.length
      ? confidenceLogs.reduce((a, c) => a + c.confidenceLevel, 0) / confidenceLogs.length
      : 0;

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUserIds = [...new Set(confidenceLogs.filter(c => new Date(c.date) >= last7Days).map(c => c.userId?.toString()))];
    const activeUsers = activeUserIds.length;

    res.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalSkills,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      activeUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users - list all users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select('name email role createdAt')
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(users.map(async (u) => {
      const [confCount, activityCount, goalCount] = await Promise.all([
        ConfidenceLog.countDocuments({ userId: u._id }),
        Activity.countDocuments({ userId: u._id }),
        Goal.countDocuments({ userId: u._id })
      ]);
      return {
        ...u.toObject(),
        confLogCount: confCount,
        activityCount,
        goalCount
      };
    }));

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/students - students + stats
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email learningGoals createdAt')
      .sort({ name: 1 });

    const withStats = await Promise.all(students.map(async (s) => {
      const [confCount, lastConf, activityCount] = await Promise.all([
        ConfidenceLog.countDocuments({ userId: s._id }),
        ConfidenceLog.findOne({ userId: s._id }).sort({ date: -1 }),
        Activity.countDocuments({ userId: s._id })
      ]);
      const avgConf = lastConf ? lastConf.confidenceLevel : null;
      return {
        ...s.toObject(),
        confLogCount: confCount,
        lastConfidence: avgConf,
        activityCount,
        struggling: avgConf !== null && avgConf <= 2
      };
    }));

    res.json(withStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/teachers - teacher list
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('name email createdAt')
      .sort({ name: 1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/activities - all activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const activities = await Activity.find()
      .populate('userId', 'name email role')
      .populate('topicId', 'name subject')
      .populate('skillId', 'name description')
      .sort({ date: -1 })
      .limit(parseInt(limit));
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/confidence - overall confidence trends
router.get('/confidence', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await ConfidenceLog.find()
      .populate('userId', 'name email role')
      .populate('topicId', 'name subject')
      .populate('skillId', 'name description')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    const byWeek = {};
    logs.forEach(l => {
      const d = new Date(l.date);
      const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      if (!byWeek[weekKey]) byWeek[weekKey] = [];
      byWeek[weekKey].push(l.confidenceLevel);
    });

    const trends = Object.entries(byWeek).map(([week, levels]) => ({
      week,
      avg: (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(2),
      count: levels.length
    })).sort((a, b) => a.week.localeCompare(b.week));

    res.json({ logs, trends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/goals - all goals
router.get('/goals', async (req, res) => {
  try {
    const goals = await Goal.find()
      .populate('userId', 'name email role')
      .populate('skillId', 'name description')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/skills - all skills (for monitor/delete)
router.get('/skills', async (req, res) => {
  try {
    const skills = await Skill.find().populate('createdBy', 'name').sort({ name: 1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/reports/mocktests - mock test attempts with teacher/student/topic context
router.get('/reports/mocktests', async (req, res) => {
  try {
    const { teacherId, studentId, topicId, mockTestId } = req.query;

    const attemptFilter = {};
    let testIdsFilter = null;

    if (studentId) {
      attemptFilter.student = studentId;
    }

    const testFilter = {};
    if (teacherId) {
      testFilter.createdBy = teacherId;
    }
    if (topicId) {
      testFilter.$or = [{ topic: topicId }, { skill: topicId }];
    }
    if (mockTestId) {
      testFilter._id = mockTestId;
    }

    if (Object.keys(testFilter).length) {
      const tests = await MockTest.find(testFilter).select('_id');
      testIdsFilter = tests.map((t) => t._id);
      if (!testIdsFilter.length) {
        return res.json([]);
      }
      attemptFilter.mockTest = { $in: testIdsFilter };
    }

    const attempts = await TestAttempt.find(attemptFilter)
      .populate({
        path: 'mockTest',
        populate: [
          { path: 'topic', select: 'name subject' },
          { path: 'skill', select: 'name' },
          { path: 'createdBy', select: 'name email' }
        ]
      })
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = attempts.map((a) => {
      const t = a.mockTest;
      const topicName = t?.topic?.name || t?.skill?.name || null;
      const topicIdVal = t?.topic?._id || t?.skill?._id || null;
      return {
        id: a._id,
        mockTestId: t?._id,
        subject: t?.subject,
        sourceType: t?.sourceType,
        topicId: topicIdVal,
        topicName,
        difficulty: t?.difficulty,
        teacher: t?.createdBy || null,
        student: a.student,
        score: a.score,
        correctCount: a.correctCount,
        totalQuestions: a.totalQuestions,
        confidenceAtTest: a.confidenceAtTest,
        validationStatus: a.validationStatus,
        evaluation: a.evaluation || null,
        createdAt: a.createdAt
      };
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
