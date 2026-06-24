import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Quiz from "@/models/Quiz";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Please sign in to generate a quiz" }, { status: 401 });
    }

    const { subject, count } = await req.json();

    if (!subject || !count) {
      return NextResponse.json({ error: "Subject and question count are required" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.credits <= 0) {
      return NextResponse.json({ error: "Insufficient credits. Please top up to continue." }, { status: 403 });
    }

    const prompt = `
      Generate a quiz about "${subject}" with exactly ${count} multiple choice questions.
      The response MUST be a valid JSON object with a key "quiz" containing an array of question objects.
      Each question object must have the following fields:
      - id: a unique string for the question
      - question: the question text
      - options: an array of exactly 4 strings
      - correctAnswer: the index (0-3) of the correct option in the options array

      Return ONLY the JSON object, no other text or formatting.
    `;

    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash",
      "gemini-flash-latest"
    ];
    let responseText = "";
    let generationError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting quiz generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText) {
          generationError = null;
          break;
        }
      } catch (err) {
        console.error(`Failed generation with model ${modelName}:`, err);
        generationError = err;
      }
    }

    if (generationError) {
      throw generationError;
    }

    const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const quizData = JSON.parse(cleanedJson);
      
      // Deduct 1 credit
      user.credits -= 1;
      await user.save();

      // Save quiz to history
      await Quiz.create({
        userId: user._id,
        subject,
        questions: quizData.quiz,
      });

      return NextResponse.json({ 
        ...quizData, 
        remainingCredits: user.credits 
      });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Response:", responseText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    
    const isQuotaError = errorMessage.includes("429") || 
                         errorMessage.toLowerCase().includes("quota") || 
                         errorMessage.toLowerCase().includes("limit") || 
                         errorMessage.toLowerCase().includes("exhausted");

    if (isQuotaError) {
      return NextResponse.json({ 
        error: "Gemini API Quota/Rate Limit Exceeded. To fix this:\n" +
               "1. Link a billing account to your Google Cloud project (even for the Free Tier).\n" +
               "2. Or, create a new API key in a fresh Google AI Studio project.\n" +
               "3. If you just made a request, wait 60 seconds before trying again."
      }, { status: 429 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
