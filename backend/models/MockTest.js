import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: 'Each question must have exactly 4 options'
      },
      required: true
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    }
  },
  { _id: true }
);

const mockTestSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    // A mock test can be tied either to a Topic or to a Skill.
    sourceType: {
      type: String,
      enum: ['topic', 'skill'],
      default: 'topic'
    },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Mock test must contain at least one question'
      },
      required: true
    },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

mockTestSchema.index({ topic: 1, difficulty: 1 });
mockTestSchema.index({ skill: 1, difficulty: 1 });
mockTestSchema.index({ assignedTo: 1 });

export const Question = questionSchema;
const MockTest = mongoose.model('MockTest', mockTestSchema);

export default MockTest;

