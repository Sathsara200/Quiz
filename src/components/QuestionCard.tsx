"use client";

import React from "react";
import { QuizQuestion } from "@/types/quiz";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionCardProps {
  question: QuizQuestion;
  selectedOption: number | null;
  onSelectOption: (optionIndex: number) => void;
  showCorrectAnswer?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOption,
  onSelectOption,
  showCorrectAnswer = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl"
    >
      <h2 className="text-xl md:text-2xl font-bold mb-8 text-gray-800 leading-tight">
        {question.question}
      </h2>
      <div className="space-y-4">
        {question.options.map((option, index) => {
          let optionClass = "w-full p-4 md:p-5 text-left rounded-xl border-2 transition-all duration-300 focus:outline-none flex items-center group ";
          
          if (selectedOption === index) {
            optionClass += "bg-blue-50 border-blue-500 text-blue-700 shadow-md ";
          } else {
            optionClass += "bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50/30 ";
          }

          if (showCorrectAnswer) {
            if (index === question.correctAnswer) {
              optionClass = "w-full p-4 md:p-5 text-left rounded-xl border-2 bg-green-50 border-green-500 text-green-700 font-medium flex items-center ";
            } else if (selectedOption === index && index !== question.correctAnswer) {
              optionClass = "w-full p-4 md:p-5 text-left rounded-xl border-2 bg-red-50 border-red-500 text-red-700 font-medium flex items-center ";
            }
          }

          return (
            <motion.button
              key={index}
              whileHover={{ scale: !showCorrectAnswer ? 1.01 : 1 }}
              whileTap={{ scale: !showCorrectAnswer ? 0.99 : 1 }}
              onClick={() => !showCorrectAnswer && onSelectOption(index)}
              className={optionClass}
              disabled={showCorrectAnswer}
            >
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mr-4 font-bold text-sm transition-colors ${
                selectedOption === index ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
