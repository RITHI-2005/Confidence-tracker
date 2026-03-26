import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['topic', 'assignment', 'quiz', 'test', 'study'], required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  title: { type: String },
  description: { type: String },
  studyHours: { type: Number, default: 0 },
  score: { type: Number },
  maxScore: { type: Number },
  completed: { type: Boolean, default: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

activitySchema.index({ userId: 1, date: -1 });

export default mongoose.model('Activity', activitySchema);
