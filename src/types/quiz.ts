export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index (0-3)
}

export interface QuizResponse {
  quiz: QuizQuestion[];
}
