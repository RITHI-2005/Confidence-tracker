import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    isCorrect: { type: Boolean, required: true }
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    remarks: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    evaluatedAt: { type: Date }
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    score: { type: Number, required: true }, // percentage 0-100
    correctCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    confidenceAtTest: { type: Number }, // average confidence (1-5) for topic at time of test
    validationStatus: {
      type: String,
      enum: [
        'CONFIDENCE_VALIDATED',
        'OVERCONFIDENT',
        'UNDERCONFIDENT',
        'PARTIALLY_ALIGNED',
        'NO_CONFIDENCE_DATA'
      ],
      required: true
    },
    evaluation: evaluationSchema
  },
  { timestamps: true }
);

testAttemptSchema.index({ mockTest: 1, student: 1 }, { unique: true });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

export { evaluationSchema };
export default TestAttempt;

