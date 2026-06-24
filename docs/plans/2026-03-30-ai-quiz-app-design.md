# AI Quiz App Design Document

**Date:** 2026-03-30
**Status:** Approved
**Phases:**
1. **Phase 1:** Quiz UI & Gemini API Communication (Current)
2. **Phase 2:** UI Development & Styling Refinement
3. **Phase 3:** Google Integration & MongoDB Database
4. **Phase 4:** PayHere Payment Gateway (Credit-based model)

## 1. Overview
A Next.js application that generates interactive multiple-choice quizzes based on a user-provided subject using the Gemini API.

## 2. Architecture
- **Framework:** Next.js (TypeScript)
- **Database:** MongoDB (Phase 3)
- **Payment:** PayHere (Phase 4 - Credits/Pay-per-Quiz model)
- **API Strategy:** Client-side fetching via Next.js API Routes (`/api/generate-quiz`).
- **AI Integration:** Google Generative AI SDK (`@google/generative-ai`) with structured JSON prompts.

## 3. Components & UI Structure
- **Layout:** Standard wrapper with header/footer.
- **Home Page (`/`):** Simple subject input, 5/10/15 question count selector, and a "Generate Quiz" button.
- **Quiz Page (`/quiz`):** Progress bar, single-question card with 4 options, and navigation buttons.
- **Result Page (`/result`):** Score summary and "Try Again/New Quiz" buttons.

## 4. Data Model
### Question Interface
```typescript
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index (0-3)
}
```

### MongoDB Schema (Phase 3)
- **User:** `{ email, name, googleId, credits }`
- **Quiz:** `{ userId, subject, questions: QuizQuestion[], createdAt }`

## 5. Error Handling & Validation
- **Client-side:** Basic input validation (non-empty subject).
- **API-side:** Gemini API error handling and strict JSON schema verification.
- **UX:** Clear loading states ("Generating Quiz...") and error messages.

## 6. Testing Strategy
- **Unit Tests:** Scoring logic and API response parsing.
- **Integration Tests:** End-to-end flow with mocked Gemini API responses.
