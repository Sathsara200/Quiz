import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  questions: [
    {
      id: String,
      question: String,
      options: [String],
      correctAnswer: Number,
    },
  ],
  score: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
