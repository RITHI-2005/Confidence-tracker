import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import confidenceRoutes from './routes/confidence.js';
import activityRoutes from './routes/activity.js';
import goalsRoutes from './routes/goals.js';
import reflectionRoutes from './routes/reflection.js';
import teacherRoutes from './routes/teacher.js';
import mockTestRoutes from './routes/mocktest.js';
import reportRoutes from './routes/report.js';
import topicRoutes from './routes/topics.js';
import notificationRoutes from './routes/notifications.js';
import skillsRoutes from './routes/skills.js';
import adminRoutes from './routes/admin.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); 
dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || 'https://confidence-tracker.vercel.app';
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/confidencetracker';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/confidence', confidenceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/reflection', reflectionRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api', mockTestRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err.stack);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ message: err.message || 'Server Error' });
});

let server;

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

async function start() {
  try {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err?.message || err);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000
    });

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CORS origin: ${CLIENT_URL}`);
    });

    server.on('error', (err) => {
      if (err?.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Set PORT in backend/.env.`);
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Startup error:', err?.message || err);
    process.exit(1);
  }
}

start();