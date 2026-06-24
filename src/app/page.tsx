"use client";

import React, { useState, useEffect } from "react";
import { QuizQuestion } from "@/types/quiz";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import Script from "next/script";

type AppState = "setup" | "loading" | "quiz" | "result";

export default function Home() {
  const { data: session, status } = useSession();
  const [appState, setAppState] = useState<AppState>("setup");
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setError(null);
    setAppState("loading");

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, count }),
      });

      const data = await response.json();

      if (response.ok && data.quiz) {
        setQuiz(data.quiz);
        setUserAnswers(new Array(data.quiz.length).fill(null));
        setCurrentQuestionIndex(0);
        setCredits(data.remainingCredits);
        setAppState("quiz");
      } else {
        throw new Error(data.error || "Failed to generate quiz");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setAppState("setup");
    }
  };

  const handlePayment = async (amount: number, creditAmount: number) => {
    if (!session?.user) return;

    const userId = (session.user as any).id;
    const orderId = `QZ${userId.slice(-6)}${Date.now()}`.toUpperCase();
    const currency = "LKR";

    try {
      const res = await fetch("/api/payhere/hash", {
        method: "POST",
        body: JSON.stringify({ orderId, amount, currency }),
      });
      const data = await res.json();
      
      if (!data.hash) throw new Error("Failed to generate hash");

      const payment = {
        sandbox: true,
        merchant_id: "1234862", 
        return_url: window.location.origin,
        cancel_url: window.location.origin,
        notify_url: process.env.NEXT_PUBLIC_PAYHERE_NOTIFY_URL || "https://webhook.site/dummy",
        order_id: orderId,
        items: `${creditAmount} Quiz Credits`,
        amount: amount.toFixed(2),
        currency: currency,
        first_name: session.user.name?.split(" ")[0] || "User",
        last_name: session.user.name?.split(" ").slice(1).join(" ") || "Doe",
        email: session.user.email || "test@example.com",
        phone: "0771234567",
        address: "No.1, Colombo",
        city: "Colombo",
        country: "Sri Lanka",
        hash: data.hash,
      };

      console.log("VERSION 4 (RESTORED): PayHere Payload:", payment);

      // Set callbacks before calling startPayment
      if ((window as any).payhere) {
        (window as any).payhere.onCompleted = function onCompleted() {
          alert("Payment completed! Your credits will be updated shortly.");
          setShowPaymentModal(false);
        };
        (window as any).payhere.onDismissed = function onDismissed() {
          console.log("Payment dismissed");
        };
        (window as any).payhere.onError = function onError(error: string) {
          console.error("Payment error", error);
        };

        // 3. Start PayHere Payment
        (window as any).payhere.startPayment(payment);
      } else {
        alert("PayHere library not loaded. Please refresh the page.");
      }
    } catch (err) {
      console.error("Payment initiation failed", err);
      alert("Failed to start payment. Please try again.");
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newUserAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setAppState("result");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    userAnswers.forEach((answer, index) => {
      if (answer === quiz[index].correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const handleRestart = () => {
    setAppState("setup");
    setSubject("");
    setCount(5);
    setQuiz([]);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <Script src="https://www.payhere.lk/lib/payhere.js" strategy="lazyOnload" />

      {/* Navbar/Header */}
      <div className="w-full max-w-6xl flex justify-between items-center py-6 mb-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">Q</div>
          <span className="text-xl font-black text-gray-800 tracking-tight">AI QUIZ</span>
        </div>
        
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-gray-100">
              <div 
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-50 px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-bold text-blue-700">{credits ?? (session.user as any).credits} Credits</span>
                <span className="text-blue-400 font-black">+</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={session.user?.image || ""} alt={session.user?.name || ""} className="w-8 h-8 rounded-full border border-gray-200" />
                <button onClick={() => signOut()} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">Sign Out</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => signIn("google")}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-black transition-all"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl text-center mb-12"
      >
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 tracking-tight leading-tight">
          Master Any Subject <br /> with AI Quizzes
        </h1>
        <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
          Personalized quizzes powered by Google Gemini. Get started with 5 free credits!
        </p>
      </motion.div>

      <div className="w-full flex items-center justify-center">
        {!session && appState === "setup" ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-3xl shadow-2xl w-full max-w-lg text-center border border-gray-100"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">🚀</div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">Ready to Start?</h2>
            <p className="text-gray-500 font-medium mb-8">Sign in with Google to generate your first quiz and claim 5 free credits.</p>
            <button 
              onClick={() => signIn("google")}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
            >
              Sign In with Google
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {appState === "setup" && (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100"
              >
                <form onSubmit={handleGenerateQuiz} className="space-y-8">
                  <div>
                    <label htmlFor="subject" className="block text-base font-bold text-gray-800 mb-3">
                      Select your topic
                    </label>
                    <input
                      id="subject"
                      type="text"
                      placeholder="e.g., Quantum Physics, Art History"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-0 outline-none transition-all text-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-3 flex justify-between">
                      Questions count
                      <span className="text-blue-600 text-sm">-1 Credit</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[5, 10, 15].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCount(num)}
                          className={`py-3 rounded-xl font-bold transition-all ${
                            count === num
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm font-medium bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    Generate My Quiz
                  </motion.button>
                </form>
              </motion.div>
            )}

            {appState === "loading" && (
              <motion.div key="loading" className="text-center py-20">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-black text-gray-800">Crafting Masterpiece...</h2>
                <p className="text-gray-500">AI is generating your quiz for &quot;{subject}&quot;</p>
              </motion.div>
            )}

            {appState === "quiz" && quiz.length > 0 && (
              <div className="w-full flex flex-col items-center">
                <ProgressBar current={currentQuestionIndex + 1} total={quiz.length} />
                <QuestionCard
                  question={quiz[currentQuestionIndex]}
                  selectedOption={userAnswers[currentQuestionIndex]}
                  onSelectOption={handleSelectOption}
                />
                <div className="flex justify-between w-full max-w-2xl mt-10">
                  <button onClick={handlePreviousQuestion} className="px-8 py-3 text-gray-500 font-bold disabled:opacity-0" disabled={currentQuestionIndex === 0}>Back</button>
                  <button onClick={handleNextQuestion} disabled={userAnswers[currentQuestionIndex] === null} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg">
                    {currentQuestionIndex === quiz.length - 1 ? "Get Results" : "Next"}
                  </button>
                </div>
              </div>
            )}

            {appState === "result" && (
              <motion.div key="result" className="bg-white p-12 rounded-3xl shadow-2xl w-full max-w-lg text-center">
                <h2 className="text-4xl font-black text-gray-800 mb-2">Quiz Complete!</h2>
                <p className="text-gray-500 mb-8 font-medium italic">&quot;{subject}&quot;</p>
                <div className="text-6xl font-black text-blue-600 mb-8">{calculateScore()} / {quiz.length}</div>
                <button onClick={handleRestart} className="w-full py-5 bg-gray-800 text-white rounded-2xl font-black">Create Another</button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
              
              <h2 className="text-2xl font-black text-gray-800 mb-2">Top Up Credits</h2>
              <p className="text-gray-500 mb-8 font-medium">Choose a pack to keep generating AI quizzes.</p>
              
              <div className="space-y-4">
                {[
                  { credits: 10, price: 100, label: "Starter Pack" },
                  { credits: 50, price: 400, label: "Master Pack", popular: true },
                  { credits: 150, price: 1000, label: "Expert Pack" },
                ].map((pack) => (
                  <button
                    key={pack.credits}
                    onClick={() => handlePayment(pack.price, pack.credits)}
                    className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex justify-between items-center group ${
                      pack.popular ? "border-blue-500 bg-blue-50/50" : "border-gray-100 hover:border-blue-200"
                    }`}
                  >
                    <div>
                      {pack.popular && <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded-full mb-1 inline-block">Most Popular</span>}
                      <h3 className="font-black text-gray-800 text-lg">{pack.credits} Credits</h3>
                      <p className="text-gray-500 text-sm font-medium">{pack.label}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-blue-600 group-hover:scale-110 transition-transform">LKR {pack.price}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <p className="mt-8 text-center text-xs text-gray-400 font-medium">Payments securely processed by PayHere</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
