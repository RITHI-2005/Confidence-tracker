import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['short-term', 'long-term'], default: 'short-term' },
  targetDate: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

goalSchema.index({ userId: 1 });

export default mongoose.model('Goal', goalSchema);
