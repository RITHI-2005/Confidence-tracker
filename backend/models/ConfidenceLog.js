import mongoose from 'mongoose';

const confidenceLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  confidenceLevel: { type: Number, required: true, min: 1, max: 5 },
  sessionId: { type: String },
  notes: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

confidenceLogSchema.index({ userId: 1, date: -1 });
confidenceLogSchema.index({ userId: 1, topicId: 1, date: -1 });
confidenceLogSchema.index({ userId: 1, skillId: 1, date: -1 });

export default mongoose.model('ConfidenceLog', confidenceLogSchema);
