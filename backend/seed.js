import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Topic from './models/Topic.js';

dotenv.config();

const topics = [
  { name: 'Algebra Basics', subject: 'Mathematics' },
  { name: 'Geometry', subject: 'Mathematics' },
  { name: 'Calculus Intro', subject: 'Mathematics' },
  { name: 'Chemical Reactions', subject: 'Science' },
  { name: 'Physics - Mechanics', subject: 'Science' },
  { name: 'Biology - Cells', subject: 'Science' },
  { name: 'English Grammar', subject: 'English' },
  { name: 'Essay Writing', subject: 'English' },
  { name: 'World History', subject: 'History' },
  { name: 'Geography', subject: 'Social Studies' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confidencetracker');
    console.log('Seeding...');

    if ((await Topic.countDocuments()) === 0) {
      await Topic.insertMany(topics);
      console.log('Topics seeded');
    }

    if ((await User.countDocuments()) === 0) {
      await User.create([
        { name: 'Admin', email: 'admin@test.com', password: 'admin123', role: 'admin' },
        { name: 'Teacher Jane', email: 'teacher@test.com', password: 'teacher123', role: 'teacher' },
        { name: 'Student John', email: 'student@test.com', password: 'student123', role: 'student', learningGoals: ['Math', 'Science'] }
      ]);
      console.log('Users seeded (admin@test.com, teacher@test.com, student@test.com - all password: ...123)');
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
