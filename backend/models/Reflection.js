import mongoose from 'mongoose';

const reflectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  reflectionText: { type: String, required: true },
  mood: { type: String, enum: ['Happy', 'Neutral', 'Stressed'], required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  selfAssessment: { type: Number, min: 1, max: 5 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

reflectionSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Reflection', reflectionSchema);
