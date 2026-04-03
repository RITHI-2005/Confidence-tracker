import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badge: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  earnedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ userId: 1 });

export default mongoose.model('Achievement', achievementSchema);
