import express from 'express';
import ConfidenceLog from '../models/ConfidenceLog.js';
import Activity from '../models/Activity.js';
import Reflection from '../models/Reflection.js';
import Goal from '../models/Goal.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const getDateRange = (type) => {
  const now = new Date();
  let start;
  if (type === 'weekly') start = new Date(now);
  else start = new Date(now);
  start.setDate(start.getDate() - (type === 'weekly' ? 7 : 30));
  return { start, end: now };
};

// GET /api/report/weekly/:id
router.get('/weekly/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { start, end } = getDateRange('weekly');
    const filter = { userId, date: { $gte: start, $lte: end } };

    const [confidenceLogs, activities, reflections, goals] = await Promise.all([
      ConfidenceLog.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description'),
      Activity.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description'),
      Reflection.find(filter).populate('skillId', 'name description'),
      Goal.find({ userId, createdAt: { $gte: start } }).populate('skillId', 'name description')
    ]);

    const avgConfidence = confidenceLogs.length
      ? confidenceLogs.reduce((a, c) => a + c.confidenceLevel, 0) / confidenceLogs.length
      : 0;

    const totalStudyHours = activities.reduce((a, b) => a + (b.studyHours || 0), 0);
    const completedGoals = goals.filter(g => g.completed).length;

    res.json({
      period: 'weekly',
      start,
      end,
      confidenceLogs,
      activities,
      reflections,
      goals,
      summary: {
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        totalStudyHours,
        activityCount: activities.length,
        reflectionCount: reflections.length,
        completedGoals
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/report/monthly/:id
router.get('/monthly/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { start, end } = getDateRange('monthly');
    const filter = { userId, date: { $gte: start, $lte: end } };

    const [confidenceLogs, activities, reflections] = await Promise.all([
      ConfidenceLog.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description'),
      Activity.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description'),
      Reflection.find(filter)
    ]);

    const avgConfidence = confidenceLogs.length
      ? confidenceLogs.reduce((a, c) => a + c.confidenceLevel, 0) / confidenceLogs.length
      : 0;

    const totalStudyHours = activities.reduce((a, b) => a + (b.studyHours || 0), 0);

    const byTopic = {};
    confidenceLogs.forEach(c => {
      const ref = c.skillId || c.topicId;
      const key = ref?._id?.toString() || 'Unknown';
      const name = c.skillId?.name || c.topicId?.name || 'Unknown';
      if (!byTopic[key]) byTopic[key] = { name, levels: [] };
      byTopic[key].levels.push(c.confidenceLevel);
    });

    const topicStats = Object.values(byTopic).map(t => ({
      topic: t.name,
      avgConfidence: t.levels.reduce((a, b) => a + b, 0) / t.levels.length,
      count: t.levels.length
    }));

    res.json({
      period: 'monthly',
      start,
      end,
      summary: {
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        totalStudyHours,
        activityCount: activities.length,
        reflectionCount: reflections.length
      },
      topicStats,
      confidenceLogs,
      activities
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/report/confidence-evolution/:id
router.get('/confidence-evolution/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await ConfidenceLog.find({ userId })
      .populate('topicId', 'name subject')
      .populate('skillId', 'name description')
      .sort({ date: 1 });

    const byWeek = {};
    logs.forEach(l => {
      const d = new Date(l.date);
      const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      if (!byWeek[weekKey]) byWeek[weekKey] = [];
      byWeek[weekKey].push(l.confidenceLevel);
    });

    const evolution = Object.entries(byWeek).map(([week, levels]) => ({
      week,
      avg: levels.reduce((a, b) => a + b, 0) / levels.length,
      count: levels.length
    })).sort((a, b) => a.week.localeCompare(b.week));

    res.json({ evolution, raw: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/report/export/excel/:id
router.get('/export/excel/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { start, end } = getDateRange(req.query.period || 'monthly');
    const filter = { userId, date: { $gte: start, $lte: end } };

    const [confidenceLogs, activities] = await Promise.all([
      ConfidenceLog.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description'),
      Activity.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description')
    ]);

    const workbook = new ExcelJS.Workbook();
    const confSheet = workbook.addWorksheet('Confidence Logs');
    confSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Skill / Topic', key: 'topic', width: 30 },
      { header: 'Level', key: 'level', width: 10 }
    ];
    confidenceLogs.forEach(c => {
      confSheet.addRow({
        date: c.date,
        topic: c.skillId?.name || c.topicId?.name || '-',
        level: c.confidenceLevel
      });
    });

    const actSheet = workbook.addWorksheet('Activities');
    actSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Hours', key: 'hours', width: 10 },
      { header: 'Score', key: 'score', width: 10 }
    ];
    activities.forEach(a => {
      actSheet.addRow({
        date: a.date,
        type: a.type,
        title: a.title || a.skillId?.name || a.topicId?.name || '-',
        hours: a.studyHours || 0,
        score: a.score ?? '-'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
    await workbook.xlsx.write(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/report/export/pdf/:id
router.get('/export/pdf/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { start, end } = getDateRange(req.query.period || 'monthly');
    const filter = { userId, date: { $gte: start, $lte: end } };

    const [confidenceLogs, activities] = await Promise.all([
      ConfidenceLog.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description'),
      Activity.find(filter).populate('topicId', 'name subject').populate('skillId', 'name description')
    ]);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Confidence & Learning Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${start.toDateString()} - ${end.toDateString()}`);
    doc.moveDown(2);

    doc.fontSize(16).text('Confidence Summary');
    const avgConf = confidenceLogs.length
      ? (confidenceLogs.reduce((a, c) => a + c.confidenceLevel, 0) / confidenceLogs.length).toFixed(2)
      : 0;
    doc.text(`Average Confidence: ${avgConf}/5`);
    doc.text(`Total Logs: ${confidenceLogs.length}`);
    doc.moveDown(2);

    doc.fontSize(16).text('Activity Summary');
    const totalHours = activities.reduce((a, b) => a + (b.studyHours || 0), 0);
    doc.text(`Total Study Hours: ${totalHours}`);
    doc.text(`Activities: ${activities.length}`);
    doc.moveDown(2);

    doc.fontSize(14).text('Recent Confidence Entries');
    confidenceLogs.slice(0, 15).forEach((c, i) => {
      doc.fontSize(10).text(`${i + 1}. ${c.skillId?.name || c.topicId?.name || '-'} - Level ${c.confidenceLevel} (${new Date(c.date).toLocaleDateString()})`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
