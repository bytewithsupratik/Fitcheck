import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Check,
  ArrowRight,
  Flame,
  Link2,
  Terminal,
} from "lucide-react";
import {
  fetchGymChallenges,
  verifyGymRepository,
  submitCodeSolution,
} from "../../services/gymService";

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function TechnicalGym({ onNavigate = () => {} }) {
  const [quizzes, setQuizzes] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [challengeLoadError, setChallengeLoadError] = useState("");

  // Quiz Core State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // 30-Second Countdown Timer State
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // Code Challenges Single-Card Stepper State
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [codeInputs, setCodeInputs] = useState({});
  const [codeResults, setCodeResults] = useState({});
  const [submittingCodeId, setSubmittingCodeId] = useState(null);
  const [repoInputs, setRepoInputs] = useState({});
  const [submittedRepos, setSubmittedRepos] = useState({});
  const [isSubmittingRepo, setIsSubmittingRepo] = useState(false);

  const currentQuestion = quizzes[currentQuestionIndex] || null;
  const totalQuestions = quizzes.length;
  const quizHasAnswerKeys = totalQuestions > 0 && quizzes.every((question) => question.correctAnswer != null);
  const isUrgent = timeLeft <= 10;

  const activeChallenge = challenges[currentChallengeIndex] || null;
  const totalChallenges = challenges.length;

  useEffect(() => {
    let cancelled = false;

    async function loadGym() {
      try {
        setLoadingChallenges(true);
        setChallengeLoadError("");
        const data = await fetchGymChallenges();
        if (cancelled) return;
        setQuizzes(Array.isArray(data?.quizzes) ? data.quizzes : []);
        setChallenges(Array.isArray(data?.codeChallenges) ? data.codeChallenges : []);
      } catch (error) {
        if (cancelled) return;
        console.error("[TechnicalGym] Failed to load challenges:", error);
        setChallengeLoadError(error.message || "Failed to load technical gym challenges.");
      } finally {
        if (!cancelled) setLoadingChallenges(false);
      }
    }

    loadGym();
    return () => {
      cancelled = true;
    };
  }, []);

  // Active Timer Effect
  useEffect(() => {
    if (loadingChallenges || !currentQuestion || quizCompleted || isAnswerSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleTimerExpired();
          return 0;
        }
        return prevTime - 1;
      });

      setTotalTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, currentQuestion, isAnswerSubmitted, quizCompleted, loadingChallenges]);

  // Handle automatic timer expiration (30s hits 0)
  const handleTimerExpired = () => {
    if (!currentQuestion) return;
    setIsAnswerSubmitted(true);
    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selected: null,
        correct: currentQuestion.correctAnswer,
        isCorrect: false,
        timedOut: true,
      },
    ]);
  };

  // Select multiple choice option
  const handleSelectOption = (optionId) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optionId);
  };

  // ============================================================================
  // [BACKEND INTEGRATION POINT] - QUIZ ANSWER EVALUATION & TELEMETRY
  // Endpoint: POST /api/v1/gym/quiz/submit
  // Headers: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
  // Payload: { questionId, selectedOption, timeSpentSeconds }
  // Database Table: `gym_quiz_attempts` (tracks accuracy, response time, topic mastery)
  // ============================================================================
  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedOption || isAnswerSubmitted) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswerSubmitted(true);

    const isCorrect = currentQuestion.correctAnswer == null
      ? null
      : selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // [BACKEND CALL]: Log answer telemetry to backend database
    // submitQuizAnswer({ questionId: currentQuestion.id, selectedOption, isCorrect });

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selected: selectedOption,
        correct: currentQuestion.correctAnswer,
        isCorrect,
        timedOut: false,
      },
    ]);
  };

  // Navigate to Next Question or Complete Quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setTimeLeft(30);
    } else {
      setQuizCompleted(true);
    }
  };

  // Reset Quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setTimeLeft(30);
    setTotalTimeSpent(0);
  };

  // Smooth scroll to Code Challenges section
  const handleScrollToChallenges = () => {
    const el = document.getElementById("code-challenges");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle GitHub Repo Link Input
  const handleRepoInputChange = (challengeId, value) => {
    setRepoInputs((prev) => ({
      ...prev,
      [challengeId]: value,
    }));
  };

  // ============================================================================
  // [BACKEND INTEGRATION POINT] - REPOSITORY EVIDENCE VERIFICATION & AST AUDIT
  // Endpoint: POST /api/v1/gym/verify-repo
  // Headers: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
  // Payload: { challengeId, repoUrl }
  // Database Tables: `evidence_verifications`, `code_submissions`
  // AI / Engine Pipeline: GitHub API scanner -> AST parsing -> Complexity check -> Certificate hash
  // ============================================================================
  const handleSubmitRepo = async (challengeId) => {
    const val = repoInputs[challengeId]?.trim();
    if (!val) return;
    setIsSubmittingRepo(true);
    try {
      const result = await verifyGymRepository(val, challengeId);
      console.log("[TechnicalGym] Repository verification result:", result);
      setSubmittedRepos((prev) => ({
        ...prev,
        [challengeId]: val,
      }));
    } catch (error) {
      console.error("[TechnicalGym] Repository verification failed:", error);
      alert(error.message || "Failed to verify repository.");
    } finally {
      setIsSubmittingRepo(false);
    }
  };

  const handleSubmitCode = async (challenge) => {
    const code = codeInputs[challenge.id] ?? challenge.starterCode ?? "";
    if (!code.trim()) return;

    setSubmittingCodeId(challenge.id);
    try {
      const result = await submitCodeSolution(challenge.id, code);
      setCodeResults((prev) => ({ ...prev, [challenge.id]: result }));
    } catch (error) {
      console.error("[TechnicalGym] Code submission failed:", error);
      alert(error.message || "Failed to evaluate code.");
    } finally {
      setSubmittingCodeId(null);
    }
  };

  // Completion percentage
  const progressPercentage = totalQuestions
    ? Math.round(((currentQuestionIndex + (isAnswerSubmitted ? 1 : 0)) / totalQuestions) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#060A12] text-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* ============================================================ */}
        {/* SECTION 1: TIMED DAILY ROADMAP QUIZ MODULE                   */}
        {/* ============================================================ */}
        <section className="space-y-6">
          {/* A. Quiz Header & Metadata Block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Roadmap Sync: Frontend & AI Architecture</span>
              </span>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight font-display">
                Technical Gym: Daily Roadmap Blitz
              </h1>

              <p className="text-[#94A3B8] text-sm mt-1">
                Rapid-fire 30-second concept checks aligned with your daily focus.
              </p>
            </div>

            {/* Overall Gym Streak / Stats Badge */}
            <div className="flex items-center gap-3 bg-[#0D131F]/85 border border-white/10 rounded-2xl px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] self-start sm:self-auto">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono text-[#94A3B8] uppercase">
                  Roadmap Blitz
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  14 Checkpoints Clear
                </span>
              </div>
            </div>
          </div>

          {/* B. Interactive 30-Second Quiz Card or Quiz Complete Summary */}
          {!quizCompleted && currentQuestion ? (
            <div className="bg-[#0D131F]/90 border border-white/10 rounded-3xl p-6 sm:p-7 my-6 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              {/* Ambient Cyan Glow */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* 1. Active Timer Header Row */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                {/* Left: Question Counter */}
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-mono font-bold text-sm sm:text-base">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                    // 30s Blitz Pace
                  </span>
                </div>

                {/* Right: Live 30-Second Countdown Timer Widget */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border transition-all ${
                      isUrgent
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "bg-[#060A12] text-cyan-300 border-cyan-500/30"
                    }`}
                  >
                    <Clock
                      className={`w-4 h-4 ${
                        isUrgent ? "text-amber-400" : "text-cyan-400"
                      }`}
                    />
                    <span>{timeLeft}s remaining</span>
                  </div>
                </div>
              </div>

              {/* Linear Animated Timer Bar (Shrinks from 100% to 0%) */}
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-3 mb-6 border border-white/5">
                <div
                  className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                    isUrgent
                      ? "bg-amber-400 shadow-[0_0_12px_#f59e0b]"
                      : "bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
                  }`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>

              {/* 2. Question Display */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white my-3 leading-snug font-display">
                  {currentQuestion.prompt}
                </h2>

                {/* Monospace Code Snippet Callout */}
                {currentQuestion.codeSnippet && (
                  <pre className="bg-[#060A12] border border-white/10 rounded-2xl p-4 font-mono text-xs sm:text-sm text-cyan-300/95 overflow-x-auto my-4 leading-relaxed selection:bg-cyan-500/30">
                    <code>{currentQuestion.codeSnippet}</code>
                  </pre>
                )}
              </div>

              {/* 3. Multiple Choice Options Grid (4 Options) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const hasAnswerKey = currentQuestion.correctAnswer != null;
                  const isCorrect = hasAnswerKey && option.id === currentQuestion.correctAnswer;
                  const showResult = isAnswerSubmitted;

                  let optionStyle =
                    "bg-[#060A12] border border-white/10 text-slate-300 hover:border-cyan-400 hover:text-white";

                  if (showResult) {
                    if (!hasAnswerKey) {
                      optionStyle = isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold"
                        : "bg-[#060A12]/50 border-white/5 text-slate-500 opacity-60";
                    } else if (isCorrect) {
                      optionStyle =
                        "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold shadow-[0_0_15px_rgba(34,211,238,0.2)]";
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        "bg-rose-500/20 border-rose-500 text-rose-300 font-semibold";
                    } else {
                      optionStyle =
                        "bg-[#060A12]/50 border-white/5 text-slate-500 opacity-60";
                    }
                  } else if (isSelected) {
                    optionStyle =
                      "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold shadow-[0_0_15px_rgba(34,211,238,0.2)]";
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(option.id)}
                      className={`p-4 rounded-2xl text-left cursor-pointer transition-all flex items-start gap-3 relative ${optionStyle} ${
                        isAnswerSubmitted ? "cursor-default" : ""
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-cyan-300 flex-shrink-0 mt-0.5">
                        {option.id}
                      </span>
                      <span className="text-sm leading-relaxed flex-1">
                        {option.text}
                      </span>

                      {/* State icon indicators after answer submitted */}
                      {showResult && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 4. Automated Timer Logic Callout / Explanation Block */}
              {isAnswerSubmitted && (
                <div className="bg-[#060A12] border border-cyan-500/30 p-4 sm:p-5 rounded-2xl text-slate-300 text-sm mt-4 animate-fade-in space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>
                      {currentQuestion.correctAnswer == null
                        ? "Answer Recorded // Evaluation Pending"
                        : selectedOption === currentQuestion.correctAnswer
                        ? "Accurate Precision // Checkpoint Cleared"
                        : selectedOption
                        ? "Concept Divergence // Architecture Review"
                        : "Timer Expired (0s) // Answer Locked"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-sans">
                    {currentQuestion.explanation || (currentQuestion.correctAnswer == null
                      ? "The live challenge has not supplied an answer key."
                      : "")}
                  </p>
                </div>
              )}

              {/* Action Controls Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-white/10 mt-6">
                <div className="text-xs font-mono text-[#94A3B8]">
                  <span>Blitz Progress: </span>
                  <span className="text-cyan-400 font-bold">
                    {progressPercentage}%
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={!selectedOption}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedOption
                          ? "bg-cyan-400 hover:bg-cyan-300 text-[#060A12] shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95"
                          : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Submit Answer</span>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="w-full sm:w-auto bg-cyan-400 hover:bg-cyan-300 text-[#060A12] font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>
                        {currentQuestionIndex + 1 < totalQuestions
                          ? "Next Question →"
                          : "View Quiz Summary →"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : !quizCompleted ? (
            <div className="bg-[#0D131F]/90 border border-white/10 rounded-3xl p-8 text-center text-slate-400 font-mono text-sm">
              {loadingChallenges
                ? "Loading live technical quiz questions..."
                : challengeLoadError || "No quiz questions available."}
            </div>
          ) : (
            /* Quiz Complete Summary Panel */
            <div className="bg-[#0D131F]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 my-6 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.8)] animate-fade-in text-center backdrop-blur-xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mx-auto shadow-[0_0_25px_rgba(34,211,238,0.25)]">
                  <Trophy className="w-8 h-8 text-cyan-400" />
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                    Roadmap Blitz Complete
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-display">
                    Checkpoint Mastered
                  </h2>
                  <p className="text-[#94A3B8] text-sm mt-2 font-sans">
                    You completed the React State Management & Async Hooks rapid check.
                  </p>
                </div>

                {/* Score & Time Breakdown Grid */}
                <div className="grid grid-cols-3 gap-3 bg-[#060A12] border border-white/10 rounded-2xl p-4 text-center font-mono">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">
                      Score
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-cyan-400">
                      {quizHasAnswerKeys ? `${score} / ${totalQuestions}` : "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">
                      Accuracy
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      {quizHasAnswerKeys ? `${Math.round((score / totalQuestions) * 100)}%` : "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">
                      Time Spent
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-slate-300">
                      {totalTimeSpent}s
                    </span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRestartQuiz}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Blitz</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScrollToChallenges}
                    className="w-full sm:w-auto bg-cyan-400 hover:bg-cyan-300 text-[#060A12] font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Proceed to Practical Challenges</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: PRACTICAL CODE CHALLENGES (SINGLE CARD STEPPER)   */}
        {/* ============================================================ */}
        <section
          id="code-challenges"
          className="space-y-6 pt-6 border-t border-white/10"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-0.5 rounded-full text-xs font-mono font-medium">
                Hands-on Lab
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">
                Phase 2 // Execution Engine
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-display">
              Practical Code Challenges
            </h2>
            <p className="text-cyan-400 text-sm font-mono">
              Implement production-grade architecture patterns with verifiable tests.
            </p>
          </div>

          {/* Single Full-Width Focus Card */}
          <div className="bg-[#0D131F]/90 border border-white/10 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-[0_16px_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300 backdrop-blur-xl">
            {/* Ambient Cyan Glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {loadingChallenges ? (
              <p className="relative py-8 text-center text-slate-400 font-mono text-sm">
                Loading live code challenges...
              </p>
            ) : !activeChallenge ? (
              <p className="relative py-8 text-center text-slate-400 font-mono text-sm">
                {challengeLoadError || "No practical code challenges available."}
              </p>
            ) : (
              <>

            {/* A. Top Metadata & Pagination Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center">
                <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-mono font-semibold">
                  {activeChallenge.category || activeChallenge.tier}
                </span>
                <span className="text-slate-400 font-mono text-xs ml-3">
                  Challenge {currentChallengeIndex + 1} of {totalChallenges}
                </span>
              </div>

              <div className="text-amber-400 font-mono font-bold text-xs flex items-center gap-2">
                <span>{activeChallenge.difficulty}</span>
                <span>·</span>
                <span>{activeChallenge.timeEst}</span>
              </div>
            </div>

            {/* B. Challenge Details & Code Snippet */}
            <div>
              <h3 className="text-2xl font-bold text-white my-3 tracking-tight font-display">
                {activeChallenge.title}
              </h3>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed font-sans">
                {activeChallenge.description}
              </p>

              {/* Code Viewer Box */}
              <pre className="bg-[#060A12] border border-white/10 rounded-2xl p-4 font-mono text-xs md:text-sm text-cyan-300 overflow-x-auto my-4 leading-relaxed selection:bg-cyan-500/30">
                <code>{activeChallenge.starterCode}</code>
              </pre>

              <label
                htmlFor={`gym-code-${activeChallenge.id}`}
                className="block text-xs font-mono uppercase text-cyan-400 font-semibold mb-2"
              >
                Your Implementation
              </label>
              <textarea
                id={`gym-code-${activeChallenge.id}`}
                value={codeInputs[activeChallenge.id] ?? activeChallenge.starterCode ?? ""}
                onChange={(event) =>
                  setCodeInputs((prev) => ({ ...prev, [activeChallenge.id]: event.target.value }))
                }
                rows={10}
                spellCheck={false}
                className="w-full resize-y bg-[#060A12] border border-white/10 focus:border-cyan-400 rounded-xl p-4 font-mono text-xs md:text-sm text-cyan-200 outline-none"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => handleSubmitCode(activeChallenge)}
                  disabled={submittingCodeId === activeChallenge.id || !(codeInputs[activeChallenge.id] ?? activeChallenge.starterCode ?? "").trim()}
                  className="bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-[#060A12] font-bold px-5 py-2.5 rounded-xl text-sm font-mono transition-all flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  {submittingCodeId === activeChallenge.id ? "Evaluating..." : "Evaluate Code"}
                </button>
                {codeResults[activeChallenge.id] && (
                  <span className="text-xs font-mono text-cyan-300">
                    {codeResults[activeChallenge.id].passed ? "Passed" : "Needs revision"}
                    {codeResults[activeChallenge.id].score != null && ` · Score ${codeResults[activeChallenge.id].score}`}
                  </span>
                )}
              </div>

              {/* Target Verification Specs Checklist */}
              <div className="space-y-1.5 my-4 bg-[#060A12]/60 border border-white/10 rounded-2xl p-4">
                <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold mb-1">
                  Target Verification Specs:
                </span>
                {(activeChallenge.tests || []).map((test, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs font-mono text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{test}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* C. GITHUB REPOSITORY / PR LINK FIELD */}
            <div className="my-6 pt-5 border-t border-white/10">
              <label
                htmlFor="github-repo-input"
                className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-2 block flex items-center gap-2"
              >
                <GithubIcon className="w-4 h-4 text-cyan-400" />
                <span>GITHUB REPOSITORY / PR LINK (VERIFIED PROOF)</span>
              </label>

              <div className="space-y-3">
                <input
                  id="github-repo-input"
                  type="text"
                  placeholder="https://github.com/username/repository-name"
                  value={repoInputs[activeChallenge.id] || ""}
                  onChange={(e) =>
                    handleRepoInputChange(activeChallenge.id, e.target.value)
                  }
                  className="w-full bg-[#060A12] border border-cyan-500/30 focus:border-cyan-400 text-cyan-200 placeholder-slate-600 font-mono text-sm rounded-xl px-4 py-3 outline-none transition-all shadow-inner"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubmitRepo(activeChallenge.id)}
                    disabled={
                      !repoInputs[activeChallenge.id]?.trim() || isSubmittingRepo
                    }
                    className="bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:hover:bg-cyan-400 text-[#060A12] font-bold px-6 py-2.5 rounded-xl text-sm font-mono transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] mt-1 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>
                      {isSubmittingRepo
                        ? "Submitting..."
                        : "Submit Repository Link"}
                    </span>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  {submittedRepos[activeChallenge.id] && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg max-w-md truncate">
                      <Link2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">
                        Linked: {submittedRepos[activeChallenge.id]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* D. Sequential Navigation Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
              <button
                type="button"
                disabled={currentChallengeIndex === 0}
                onClick={() => setCurrentChallengeIndex((prev) => prev - 1)}
                className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>← Previous Challenge</span>
              </button>

              <button
                type="button"
                disabled={currentChallengeIndex === totalChallenges - 1}
                onClick={() => setCurrentChallengeIndex((prev) => prev + 1)}
                className="bg-cyan-500/20 hover:bg-cyan-400 hover:text-[#060A12] disabled:opacity-30 disabled:hover:bg-cyan-500/20 disabled:hover:text-cyan-300 text-cyan-300 font-semibold px-6 py-2.5 rounded-xl text-xs font-mono border border-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-95"
              >
                <span>Pass & Next Challenge →</span>
              </button>
            </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
