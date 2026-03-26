import express from 'express';
import MockTest from '../models/MockTest.js';
import TestAttempt from '../models/TestAttempt.js';
import ConfidenceLog from '../models/ConfidenceLog.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/teacher/mocktest/results
// List attempts for mock tests created by the current teacher
router.get(
  '/teacher/mocktest/results',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const teacherId = req.user._id;

      // Find all mock tests created by this teacher
      const tests = await MockTest.find({ createdBy: teacherId })
        .select('subject sourceType topic skill difficulty createdAt')
        .populate('topic', 'name subject')
        .populate('skill', 'name');

      if (!tests.length) {
        return res.json([]);
      }

      const testsById = tests.reduce((acc, t) => {
        acc[t._id.toString()] = t;
        return acc;
      }, {});

      const attempts = await TestAttempt.find({
        mockTest: { $in: tests.map((t) => t._id) }
      })
        .populate('student', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const result = attempts.map((a) => {
        const t = testsById[a.mockTest.toString()];
        const topicName = t?.topic?.name || t?.skill?.name || null;
        const topicId = t?.topic?._id || t?.skill?._id || null;
        return {
          id: a._id,
          mockTestId: t?._id,
          student: a.student,
          subject: t?.subject,
          sourceType: t?.sourceType,
          topicId,
          topicName,
          difficulty: t?.difficulty,
          createdAt: a.createdAt,
          score: a.score,
          correctCount: a.correctCount,
          totalQuestions: a.totalQuestions,
          confidenceAtTest: a.confidenceAtTest,
          validationStatus: a.validationStatus,
          evaluation: a.evaluation || null,
          answers: a.answers,
          questions: t?.questions?.map((q) => ({
            _id: q._id,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex
          }))
        };
      });

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Failed to load mock test results' });
    }
  }
);

// POST /api/teacher/mocktest/evaluate
// Add or update evaluation for a student's attempt
router.post(
  '/teacher/mocktest/evaluate',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { attemptId, remarks, rating } = req.body;
      if (!attemptId) {
        return res.status(400).json({ message: 'attemptId is required' });
      }

      const attempt = await TestAttempt.findById(attemptId).populate({
        path: 'mockTest',
        select: 'createdBy'
      });
      if (!attempt) {
        return res.status(404).json({ message: 'Attempt not found' });
      }
      if (!attempt.mockTest?.createdBy?.equals(req.user._id)) {
        return res
          .status(403)
          .json({ message: 'You are not allowed to evaluate this attempt' });
      }

      attempt.evaluation = {
        remarks: remarks || '',
        rating: rating ?? null,
        evaluatedBy: req.user._id,
        evaluatedAt: new Date()
      };
      await attempt.save();

      res.json({
        id: attempt._id,
        evaluation: attempt.evaluation
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Failed to save evaluation' });
    }
  }
);

// POST /api/teacher/mocktest
// Create a mock test and auto-assign to students with avg confidence >= 4 for the selected topic
router.post(
  '/teacher/mocktest',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { topicId, skillId, difficulty = 'medium', questions, subject } = req.body;

      if (!topicId && !skillId) {
        return res.status(400).json({ message: 'topicId or skillId is required' });
      }
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'At least one question is required' });
      }

      let topic = null;
      let skill = null;
      let sourceType = 'topic';
      let subjectValue;

      if (topicId) {
        topic = await Topic.findById(topicId);
        if (!topic) {
          return res.status(404).json({ message: 'Topic not found' });
        }
        subjectValue = subject || topic.subject;
        sourceType = 'topic';
      } else {
        skill = await Skill.findById(skillId);
        if (!skill) {
          return res.status(404).json({ message: 'Skill not found' });
        }
        subjectValue = subject || 'Skill';
        sourceType = 'skill';
      }

      const normalizedQuestions = questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex
      }));

      const mockTest = await MockTest.create({
        subject: subjectValue,
        sourceType,
        topic: topic?._id,
        skill: skill?._id,
        difficulty,
        questions: normalizedQuestions,
        createdBy: req.user.id
      });

      // Find students whose average confidence for this topic/skill is >= 4
      const matchField = topic ? 'topicId' : 'skillId';
      const refId = topic ? topic._id : skill._id;
      const highConfidence = await ConfidenceLog.aggregate([
        { $match: { [matchField]: refId } },
        {
          $group: {
            _id: '$userId',
            avgConfidence: { $avg: '$confidenceLevel' }
          }
        },
        { $match: { avgConfidence: { $gte: 4 } } }
      ]);

      const studentIds = highConfidence.map((h) => h._id);

      let eligibleStudents = [];
      if (studentIds.length > 0) {
        eligibleStudents = await User.find({
          _id: { $in: studentIds },
          role: 'student'
        }).select('_id');
      }

      const assignedIds = eligibleStudents.map((s) => s._id);
      if (assignedIds.length > 0) {
        mockTest.assignedTo = assignedIds;
        await mockTest.save();
      }

      res.status(201).json({
        mockTest,
        assignedCount: assignedIds.length
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Failed to create mock test' });
    }
  }
);

// GET /api/student/mocktests
// List mock tests assigned to a student with attempt status
router.get('/student/mocktests', protect, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    const tests = await MockTest.find({
      assignedTo: studentId,
      isActive: true
    })
      .populate('topic', 'name subject')
      .populate('skill', 'name')
      .sort({ createdAt: -1 });

    if (!tests.length) {
      return res.json([]);
    }

    const testIds = tests.map((t) => t._id);
    const attempts = await TestAttempt.find({
      mockTest: { $in: testIds },
      student: studentId
    }).lean();

    const attemptsByTest = attempts.reduce((acc, a) => {
      acc[a.mockTest.toString()] = a;
      return acc;
    }, {});

    const result = tests.map((t) => {
      const attempt = attemptsByTest[t._id.toString()];
      return {
        id: t._id,
        subject: t.subject,
        topicName: t.topic?.name || t.skill?.name,
        topicId: t.topic?._id || t.skill?._id,
        difficulty: t.difficulty,
        questionCount: t.questions.length,
        createdAt: t.createdAt,
        hasAttempted: !!attempt,
        score: attempt?.score ?? null,
        validationStatus: attempt?.validationStatus ?? null
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to load mock tests' });
  }
});

// GET /api/student/mocktests/:id
// Fetch full mock test definition (including questions) for a student if assigned and not yet attempted
router.get(
  '/student/mocktests/:id',
  protect,
  authorize('student'),
  async (req, res) => {
    try {
      const mockTestId = req.params.id;
      const studentId = req.user.id;

      const mockTest = await MockTest.findOne({
        _id: mockTestId,
        assignedTo: studentId,
        isActive: true
      })
        .populate('topic', 'name subject')
        .populate('skill', 'name');

      if (!mockTest) {
        return res.status(404).json({ message: 'Mock test not found' });
      }

      const existing = await TestAttempt.findOne({
        mockTest: mockTest._id,
        student: studentId
      });
      if (existing) {
        return res.status(403).json({ message: 'You have already attempted this test' });
      }

      res.json({
        id: mockTest._id,
        subject: mockTest.subject,
        topicName: mockTest.topic?.name || mockTest.skill?.name,
        topicId: mockTest.topic?._id || mockTest.skill?._id,
        difficulty: mockTest.difficulty,
        questions: mockTest.questions.map((q) => ({
          _id: q._id,
          text: q.text,
          options: q.options
        }))
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Failed to load mock test' });
    }
  }
);

// POST /api/student/submit-test
// Submit answers for a mock test and compute validation status
router.post('/student/submit-test', protect, authorize('student'), async (req, res) => {
  try {
    const { mockTestId, answers } = req.body;

    if (!mockTestId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'mockTestId and answers are required' });
    }

    const existing = await TestAttempt.findOne({
      mockTest: mockTestId,
      student: req.user.id
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already attempted this test' });
    }

    const mockTest = await MockTest.findById(mockTestId)
      .populate('topic', 'name subject')
      .populate('skill', 'name');
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const totalQuestions = mockTest.questions.length;
    if (answers.length !== totalQuestions) {
      return res.status(400).json({ message: 'Answers length does not match question count' });
    }

    let correctCount = 0;
    const answerDocs = mockTest.questions.map((q, idx) => {
      const selectedIndex = answers[idx];
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) correctCount += 1;
      return {
        questionId: q._id,
        selectedIndex,
        isCorrect
      };
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Compute average confidence for this topic/skill for the current student
    let avgConfidence = null;
    if (mockTest.topic || mockTest.skill) {
      const matchField = mockTest.topic ? 'topicId' : 'skillId';
      const refId = mockTest.topic ? mockTest.topic._id : mockTest.skill._id;
      const confAgg = await ConfidenceLog.aggregate([
        {
          $match: {
            userId: req.user._id,
            [matchField]: refId
          }
        },
        {
          $group: {
            _id: '$userId',
            avgConfidence: { $avg: '$confidenceLevel' }
          }
        }
      ]);
      if (confAgg.length > 0) {
        avgConfidence = confAgg[0].avgConfidence;
      }
    }

    let validationStatus = 'NO_CONFIDENCE_DATA';
    if (avgConfidence != null) {
      if (avgConfidence >= 4 && score >= 70) {
        validationStatus = 'CONFIDENCE_VALIDATED';
      } else if (avgConfidence >= 4 && score < 70) {
        validationStatus = 'OVERCONFIDENT';
      } else if (avgConfidence < 4 && score >= 70) {
        validationStatus = 'UNDERCONFIDENT';
      } else {
        validationStatus = 'PARTIALLY_ALIGNED';
      }
    }

    const attempt = await TestAttempt.create({
      mockTest: mockTest._id,
      student: req.user.id,
      answers: answerDocs,
      score: Math.round(score),
      correctCount,
      totalQuestions,
      confidenceAtTest: avgConfidence,
      validationStatus
    });

    res.status(201).json({
      attempt,
      topic: mockTest.topic || mockTest.skill,
      summary: {
        score: attempt.score,
        correctCount,
        totalQuestions,
        confidenceAtTest: avgConfidence,
        validationStatus
      }
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already attempted this test' });
    }
    res.status(500).json({ message: err.message || 'Failed to submit test' });
  }
});

export default router;

