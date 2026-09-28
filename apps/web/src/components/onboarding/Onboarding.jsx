import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Target,
  Code2,
  Sparkles,
  Trash2,
  Calendar,
  CheckCircle2,
  BookOpen,
  Layers,
  Award,
  ArrowRight,
  HelpCircle,
  Crosshair,
  ArrowLeft,
} from "lucide-react";
import { QUIZ_BANK, timelinePresets, onboardingStepItems } from "../../data/mockData";
import { cn } from "../../utils/cn";
import { onboardingService } from "../../services/onboardingService";

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 35 : -35,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    x: direction < 0 ? 35 : -35,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Onboarding({ initialData, onNavigateToHome, onBackToLanding }) {
  // Stepper state: 1, 2, 3, or 4
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const goToStep = (newStep) => {
    setDirection(newStep > currentStep ? 1 : -1);
    setCurrentStep(newStep);
  };

  // Global collected form data
  const [formData, setFormData] = useState({
    // Section 1
    preferredName: initialData?.fullName || initialData?.preferredName || "",
    nameTouched: Boolean(initialData?.fullName || initialData?.preferredName),
    university: initialData?.university || "",
    yearOfStudy: initialData?.yearOfStudy || "",

    // Section 2
    goalType: initialData?.goalType || "topic", // 'topic' | 'job'
    goalInput: initialData?.goalInput || "",
    goalInputTouched: false,

    // Section 3
    timeline: initialData?.timeline || "3 Months",
    timelineTouched: false,

    // Section 4
    githubUrl: initialData?.githubUrl || "",
    githubSlug: initialData?.githubSlug || "",
    githubValid: Boolean(initialData?.githubSlug),
    uploadedFiles: initialData?.uploadedFiles || [],
    assessmentLevel: initialData?.assessmentLevel || null, // 'beginner' | 'moderate' | 'advanced'
    quizStarted: false,
    quizCompleted: Boolean(initialData?.quizCompleted),
    quizScore: initialData?.quizScore || 0,
    attestationChecked: Boolean(initialData?.attestationChecked),
  });

  // Section 4 Quiz state
  const [quizState, setQuizState] = useState({
    currentIndex: 0,
    selectedAnswer: null,
    showExplanation: false,
  });

  // Modal visibility states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  // Drag & drop state for Section 4
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // --- Handlers: Section 1 (Basic Info) ---
  const handleNameChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      preferredName: e.target.value,
      nameTouched: true,
    }));
  };

  const isNameValid = formData.preferredName.trim().length >= 2;
  const nameErrorMessage =
    formData.nameTouched && !isNameValid
      ? formData.preferredName.trim().length === 0
        ? "What should we call you? Please enter your name or nickname."
        : "Name must be at least 2 characters."
      : "";

  const handleSkipOptionalFields = () => {
    if (!isNameValid) {
      setFormData((prev) => ({ ...prev, nameTouched: true }));
      return;
    }
    goToStep(2);
  };

  // --- Handlers: Section 2 (Goals) ---
  const handleGoalTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      goalType: type,
      goalInput: "",
      goalInputTouched: false,
    }));
  };

  const handleGoalInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      goalInput: e.target.value,
      goalInputTouched: true,
    }));
  };

  const isGoalInputValid = formData.goalInput.trim().length >= 2;
  const goalInputErrorMessage =
    formData.goalInputTouched && !isGoalInputValid
      ? formData.goalType === "topic"
        ? "Topic sprint target is required. Tell us what you want to master!"
        : "Job role target is required. Tell us what role you are aiming for!"
      : "";

  const handleContinueToTimeline = () => {
    if (!isGoalInputValid) {
      setFormData((prev) => ({ ...prev, goalInputTouched: true }));
      return;
    }
    goToStep(3);
  };

  // --- Handlers: Section 3 (Timeline / Deadline) ---
  const handlePresetSelect = (preset) => {
    setFormData((prev) => ({
      ...prev,
      timeline: preset,
      timelineTouched: true,
    }));
  };

  const handleTimelineChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      timeline: e.target.value,
      timelineTouched: true,
    }));
  };

  const isTimelineValid = formData.timeline.trim().length >= 2;
  const timelineErrorMessage =
    formData.timelineTouched && !isTimelineValid
      ? "Deadline is required. Pick a timeframe or type your target date!"
      : "";

  const handleContinueToEvidence = () => {
    if (!isTimelineValid) {
      setFormData((prev) => ({ ...prev, timelineTouched: true }));
      return;
    }
    goToStep(4);
  };

  // --- Handlers: Section 4 (GitHub URL Parser) ---
  const handleGithubUrlChange = (e) => {
    const val = e.target.value;
    const match = val.match(/github\.com\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_.]+)/i);

    if (match && match[1] && match[2]) {
      const cleanRepo = match[2].replace(/\.git$/, "");
      setFormData((prev) => ({
        ...prev,
        githubUrl: val,
        githubSlug: `${match[1]}/${cleanRepo}`,
        githubValid: true,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        githubUrl: val,
        githubSlug: "",
        githubValid: false,
      }));
    }
  };

  // --- Handlers: Section 4 (File Upload) ---
  const processUploadedFiles = (filesList) => {
    const newItems = Array.from(filesList).map((file) => {
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      const sizeKb = (file.size / 1024).toFixed(1);
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: ext,
        size: `${sizeKb} KB`,
      };
    });

    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...newItems],
    }));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target?.files?.length) {
      processUploadedFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (idToRemove) => {
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== idToRemove),
    }));
  };

  // --- Handlers: Section 4 (Skills Assessment) ---
  const handleSelectAssessmentLevel = (level) => {
    setFormData((prev) => ({
      ...prev,
      assessmentLevel: level,
      quizStarted: true,
      quizCompleted: false,
      quizScore: 0,
      attestationChecked: false,
    }));
    setQuizState({
      currentIndex: 0,
      selectedAnswer: null,
      showExplanation: false,
    });
  };

  const handleAnswerSelect = (index) => {
    if (quizState.showExplanation) return;

    const currentQuestions = QUIZ_BANK[formData.assessmentLevel] || [];
    const currentQ = currentQuestions[quizState.currentIndex];
    const isCorrect = currentQ && index === currentQ.correctIndex;

    setQuizState((prev) => ({
      ...prev,
      selectedAnswer: index,
      showExplanation: true,
    }));

    if (isCorrect) {
      setFormData((prev) => ({
        ...prev,
        quizScore: prev.quizScore + 1,
      }));
    }
  };

  const handleNextQuestion = () => {
    const currentQuestions = QUIZ_BANK[formData.assessmentLevel] || [];
    const nextIdx = quizState.currentIndex + 1;

    if (nextIdx < currentQuestions.length) {
      setQuizState({
        currentIndex: nextIdx,
        selectedAnswer: null,
        showExplanation: false,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        quizCompleted: true,
      }));
      setQuizState((prev) => ({
        ...prev,
        showExplanation: false,
      }));
    }
  };

  const handleResetQuiz = () => {
    setFormData((prev) => ({
      ...prev,
      quizStarted: false,
      quizCompleted: false,
      quizScore: 0,
      assessmentLevel: null,
      attestationChecked: false,
    }));
    setQuizState({
      currentIndex: 0,
      selectedAnswer: null,
      showExplanation: false,
    });
  };

  const totalQuestions = formData.assessmentLevel
    ? (QUIZ_BANK[formData.assessmentLevel] || []).length
    : 0;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((formData.quizScore / totalQuestions) * 100) : 0;

  const isStep4ReadyToComplete =
    !formData.assessmentLevel ||
    (formData.quizCompleted && formData.attestationChecked);

  // ============================================================================
  // [BACKEND INTEGRATION POINT] - ONBOARDING QUESTIONNAIRE SUBMISSION
  // Endpoint: POST /api/v1/onboarding/submit
  // Headers: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>", "Content-Type": "application/json" }
  // Payload: formData (preferredName, institute, standardYear, goalType, goalInput, timeline, quizScore, uploadedFiles, githubSlug)
  // Database Tables:
  //   - `user_onboarding_responses` (stores answers, goal, timeline)
  //   - `curriculum_allocations` (allocates AI/ML track and calculates Day 1-75 schedule)
  // ============================================================================
  const handleCompleteOnboarding = async () => {
    if (!isStep4ReadyToComplete) return;

    setOnboardingError("");
    setIsSubmitting(true);

    try {
      // 1. Read directly from formData (the wizard's true state)
      const selectedGoal = formData?.goalInput?.trim();
      const selectedType = formData?.goalType || "job";

      if (!selectedGoal) {
        throw new Error("Please select or enter your target role or topic.");
      }

      const payload = {
        preferredName: formData?.preferredName?.trim() || "Alex",
        goalType: selectedType,
        goalInput: selectedGoal, // 👈 Pure user selection ("Java"), no stale fallback!
        timeline: formData?.timeline || "3 Months",
        githubUrl: formData?.githubUrl || null,
      };

      const result = await onboardingService.submitOnboarding(payload);
      console.log("[Onboarding] Successfully submitted to backend:", result);

      // Trigger the transition callback to switch App.jsx to the home view.
      if (typeof onNavigateToHome === "function") {
        onNavigateToHome(result.data || result);
      }
    } catch (err) {
      console.error("[Onboarding] Error submitting onboarding:", err);
      setOnboardingError(err.message || "Failed to save onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-white font-sans relative selection:bg-cyan-500/30 selection:text-white pb-24 overflow-x-hidden">
      {/* Tactical Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none noise opacity-25 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.12),transparent_70%)] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-20 w-full border-b border-white/10 bg-[#060A12]/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Crosshair className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-display font-extrabold tracking-tight text-white block">
                FIT<span className="text-cyan-400">CHECK</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase">
                // ROLE ONBOARDING
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {onBackToLanding && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onBackToLanding}
                className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                title="Return to Landing Page"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Back to Overview</span>
                <span className="sm:hidden">Exit</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setIsReviewOpen(true)}
              className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-white border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl transition-all duration-200 bg-cyan-500/10 hover:bg-cyan-500/20 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_-5px_rgba(34,211,238,0.25)]"
              title="Review captured profile data"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Review Details</span>
              <span className="sm:hidden">Review</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        
        {/* Step Navigation Bar */}
        <div className="mb-8 p-4 bg-[#0D131F]/90 border border-white/10 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center justify-between font-mono text-xs">
            {onboardingStepItems.map((step, idx) => {
              const isCurrent = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <React.Fragment key={step.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (step.num < currentStep) goToStep(step.num);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 transition-all text-left",
                      step.num < currentStep ? "cursor-pointer" : "cursor-default",
                      isCurrent
                        ? "text-white font-bold"
                        : isCompleted
                        ? "text-cyan-400"
                        : "text-slate-500"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono border transition-all duration-300",
                        isCurrent
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105"
                          : isCompleted
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-[#060A12] border-white/10 text-slate-500"
                      )}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : `0${step.num}`}
                    </span>
                    <span className="hidden sm:inline tracking-wider uppercase text-[11px]">
                      {step.label}
                    </span>
                  </button>

                  {idx < onboardingStepItems.length - 1 && (
                    <div className="flex-1 mx-3 h-[2px] bg-white/10 rounded-full relative overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                        style={{ width: currentStep > step.num ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>STEP 0{currentStep} OF 04</span>
            <span className="text-cyan-400 uppercase tracking-wider">
              {currentStep === 1 && "// 01: ABOUT YOU"}
              {currentStep === 2 && "// 02: YOUR FOCUS"}
              {currentStep === 3 && "// 03: DEADLINE"}
              {currentStep === 4 && "// 04: PROOF & SKILLS"}
            </span>
          </div>
        </div>

        {/* Step Transition Wrapper */}
        <AnimatePresence mode="wait" custom={direction}>
          {/* ======================================================== */}
          {/* --- STEP 1: ABOUT YOU --- */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="bg-[#0D131F]/90 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)]"
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono tracking-widest uppercase text-cyan-400 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  // STEP 01 — QUICK INTRO
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white mb-2">
                  What should we call you?
                </h1>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Let&apos;s set up your profile so your living roadmap, daily missions, and telemetry are tailored directly to you.
                </p>
              </div>

              <div className="space-y-6">
                {/* Field 1: What should we call you? (Required) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400">
                      What should we call you? <span className="text-cyan-400">*</span>
                    </label>
                    {isNameValid && (
                      <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.preferredName}
                    onChange={handleNameChange}
                    onBlur={() => setFormData((prev) => ({ ...prev, nameTouched: true }))}
                    placeholder="Your name or nickname (e.g. Alex Rivera)"
                    className={cn(
                      "w-full bg-[#060A12]/80 border rounded-2xl p-3.5 text-white placeholder:text-slate-600 outline-none transition-all font-mono text-sm",
                      nameErrorMessage
                        ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                        : isNameValid
                        ? "border-cyan-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        : "border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                    )}
                  />
                  {nameErrorMessage && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{nameErrorMessage}</span>
                    </p>
                  )}
                  {isNameValid && (
                    <p className="text-slate-300 text-xs mt-2 flex items-center gap-1.5 font-mono">
                      <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>Awesome to have you here, {formData.preferredName.trim()}!</span>
                    </p>
                  )}
                </div>

                {/* Field 2: Name of your institute or school? (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                      Name of your institute or school?
                    </label>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      OPTIONAL
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    placeholder="e.g. UC Berkeley, coding bootcamp, or self-taught"
                    className="w-full bg-[#060A12]/80 border border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl p-3.5 text-white placeholder:text-slate-600 outline-none transition-all font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    Your college, bootcamp, or whatever your current learning ground is.
                  </p>
                </div>

                {/* Field 3: Which standard or year? (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                      Which standard or year?
                    </label>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      OPTIONAL
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    placeholder="e.g. 2nd Year, Senior, or Self-taught"
                    className="w-full bg-[#060A12]/80 border border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl p-3.5 text-white placeholder:text-slate-600 outline-none transition-all font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    Helps us tune mission complexity so you stay in the flow state.
                  </p>
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSkipOptionalFields}
                  className="text-xs font-mono text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Skip optional fields
                </button>

                <motion.button
                  whileHover={isNameValid ? { scale: 1.02 } : {}}
                  whileTap={isNameValid ? { scale: 0.98 } : {}}
                  type="button"
                  disabled={!isNameValid}
                  onClick={() => goToStep(2)}
                  className={cn(
                    "px-6 py-3 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2",
                    isNameValid
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] cursor-pointer"
                      : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                  )}
                >
                  <span>Continue to Goals</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* --- STEP 2: YOUR FOCUS & GOALS --- */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="bg-[#0D131F]/90 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)]"
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono tracking-widest uppercase text-cyan-400 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  // STEP 02 — YOUR FOCUS
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white mb-2">
                  What&apos;s your target?
                </h1>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Choose whether you want to focus on a topic sprint or target a specific job role.
                </p>
              </div>

              {/* Choice Cards: Topic sprint vs Job role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleGoalTypeChange("topic")}
                  className={cn(
                    "p-5 rounded-2xl border text-left transition-all duration-300 relative cursor-pointer",
                    formData.goalType === "topic"
                      ? "border-cyan-400/80 bg-cyan-500/10 text-white shadow-[0_0_30px_-5px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/40"
                      : "border-white/10 bg-[#060A12]/60 text-slate-400 hover:border-white/20 hover:text-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                        formData.goalType === "topic"
                          ? "border-cyan-400 bg-cyan-400"
                          : "border-white/20"
                      )}
                    >
                      {formData.goalType === "topic" && (
                        <div className="w-2 h-2 rounded-full bg-[#060A12]" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-display text-base font-bold text-white mb-1">
                    Topic sprint
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Laser focus on an intensive domain: Transformers & LLMs, PyTorch Deep Learning, or Vector RAG.
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleGoalTypeChange("job")}
                  className={cn(
                    "p-5 rounded-2xl border text-left transition-all duration-300 relative cursor-pointer",
                    formData.goalType === "job"
                      ? "border-cyan-400/80 bg-cyan-500/10 text-white shadow-[0_0_30px_-5px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/40"
                      : "border-white/10 bg-[#060A12]/60 text-slate-400 hover:border-white/20 hover:text-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                        formData.goalType === "job"
                          ? "border-cyan-400 bg-cyan-400"
                          : "border-white/20"
                      )}
                    >
                      {formData.goalType === "job" && (
                        <div className="w-2 h-2 rounded-full bg-[#060A12]" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-display text-base font-bold text-white mb-1">
                    Job role
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Calibrate for a target tech role: AI/ML Specialist, Cloud Solutions Architect, or Full-Stack Lead.
                  </p>
                </motion.button>
              </div>

              {/* Dynamic Input Prompt (Required) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400">
                    {formData.goalType === "topic" ? "Topic sprint" : "Job role"}{" "}
                    <span className="text-cyan-400">*</span>
                  </label>
                  {isGoalInputValid ? (
                    <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ENTERED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      REQUIRED
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.goalInput}
                  onChange={handleGoalInputChange}
                  onBlur={() => setFormData((prev) => ({ ...prev, goalInputTouched: true }))}
                  placeholder={
                    formData.goalType === "topic"
                      ? "e.g. Transformers & PyTorch LLM Fine-Tuning"
                      : "e.g. AI/ML Specialist, Cloud Architect, or Security Lead"
                  }
                  className={cn(
                    "w-full bg-[#060A12]/80 border rounded-2xl p-3.5 text-white placeholder:text-slate-600 outline-none transition-all font-mono text-sm",
                    goalInputErrorMessage
                      ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                      : isGoalInputValid
                      ? "border-cyan-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      : "border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                  )}
                />
                {goalInputErrorMessage ? (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{goalInputErrorMessage}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    {formData.goalType === "topic"
                      ? "Your customized living roadmap and daily missions will be compiled around this domain."
                      : "Your roadmap DAG will mirror the exact skill vectors demanded for this role."}
                  </p>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <motion.button
                  whileHover={isGoalInputValid ? { scale: 1.02 } : {}}
                  whileTap={isGoalInputValid ? { scale: 0.98 } : {}}
                  type="button"
                  disabled={!isGoalInputValid}
                  onClick={handleContinueToTimeline}
                  className={cn(
                    "px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2",
                    isGoalInputValid
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] cursor-pointer"
                      : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                  )}
                >
                  <span>Continue to Deadline</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* --- STEP 3: DEADLINE --- */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="bg-[#0D131F]/90 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)]"
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono tracking-widest uppercase text-cyan-400 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  // STEP 03 — DEADLINE
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white mb-2">
                  Deadline
                </h1>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  When is your target milestone? We&apos;ll calibrate your sprint velocity without burnout.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="mb-6">
                <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400 mb-3">
                  Popular Deadlines
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {timelinePresets.map((preset) => (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "py-3 px-3.5 rounded-2xl border text-xs font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer text-center",
                        formData.timeline === preset
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/30"
                          : "border-white/10 bg-[#060A12]/60 text-slate-400 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {preset}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Manual Target Deadline Input (Required) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400">
                    Deadline <span className="text-cyan-400">*</span>
                  </label>
                  {isTimelineValid ? (
                    <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SET
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      REQUIRED
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={handleTimelineChange}
                    onBlur={() => setFormData((prev) => ({ ...prev, timelineTouched: true }))}
                    placeholder="e.g. 3 Months, or Next Month"
                    className={cn(
                      "w-full bg-[#060A12]/80 border rounded-2xl p-3.5 pr-10 text-white placeholder:text-slate-600 outline-none transition-all font-mono text-sm",
                      timelineErrorMessage
                        ? "border-red-500/60 focus:border-red-500 ring-1 ring-red-500/30"
                        : isTimelineValid
                        ? "border-cyan-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        : "border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                    )}
                  />
                  <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {timelineErrorMessage ? (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{timelineErrorMessage}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    Required — this dynamically shapes your sprint pace and spaced recall checkpoints.
                  </p>
                )}
              </div>

              {/* Step 3 Actions */}
              <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <motion.button
                  whileHover={isTimelineValid ? { scale: 1.02 } : {}}
                  whileTap={isTimelineValid ? { scale: 0.98 } : {}}
                  type="button"
                  disabled={!isTimelineValid}
                  onClick={handleContinueToEvidence}
                  className={cn(
                    "px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2",
                    isTimelineValid
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] cursor-pointer"
                      : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                  )}
                >
                  <span>Continue to Assessment</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* --- STEP 4: PROOF & SKILLS --- */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="bg-[#0D131F]/90 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)]"
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono tracking-widest uppercase text-cyan-400 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  // STEP 04 — PROOF & SKILLS
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white mb-2">
                  Prove what you&apos;ve got.
                </h1>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Drop your GitHub, attach benchmark projects or resumes, and take a quick 3-question diagnostic so we don&apos;t start you at square one.
                </p>
              </div>

              {/* Subsection 4A: GitHub URL Parser */}
              <div className="mb-8 p-4 sm:p-5 bg-[#060A12]/80 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400">
                    Connect GitHub Repository
                  </label>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    OPTIONAL
                  </span>
                </div>
                <div className="relative mb-2">
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={handleGithubUrlChange}
                    placeholder="https://github.com/username/repository"
                    className="w-full bg-[#0D131F] border border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 rounded-xl p-3.5 pr-10 text-white placeholder:text-slate-600 outline-none transition-all font-mono text-sm"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <GithubIcon />
                  </div>
                </div>

                {/* Instantaneous parsed slug badge */}
                {formData.githubValid ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CONNECTED REPOSITORY:</span>
                    <strong className="underline decoration-cyan-400/50">{formData.githubSlug}</strong>
                  </motion.div>
                ) : (
                  formData.githubUrl.trim().length > 0 && (
                    <p className="text-xs font-mono text-slate-400">
                      Paste a valid GitHub repository URL: https://github.com/owner/repository
                    </p>
                  )
                )}
              </div>

              {/* Subsection 4B: Drag and Drop Evidence Upload */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400">
                    Drop Resume or Technical Artifacts
                  </label>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    OPTIONAL
                  </span>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300",
                    isDragging
                      ? "border-cyan-400 bg-cyan-500/15 text-white scale-[1.01]"
                      : "border-white/15 hover:border-cyan-400/50 bg-[#060A12]/50 hover:bg-[#060A12]/80"
                  )}
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 text-cyan-400 animate-bounce" />
                  <p className="font-mono text-xs uppercase tracking-wider text-white font-semibold mb-1">
                    Drop artifacts here or click to browse
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Accepts PDF resumes, code exports, architectural RFCs, or Markdown files
                  </p>
                </motion.div>

                {/* Uploaded Files Badges */}
                {formData.uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.uploadedFiles.map((f) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={f.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#060A12]/90 border border-white/10 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis">
                          <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-white truncate">{f.name}</span>
                          <span className="text-slate-400 text-[10px]">({f.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(f.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subsection 4C: Skills Assessment & Technical Attestation */}
              <div className="mb-6 p-5 sm:p-6 bg-[#060A12]/80 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400">
                    Quick 3-Question Diagnostic Check
                  </label>
                  {formData.quizCompleted && (
                    <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SCORE: {formData.quizScore}/{totalQuestions}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mb-4">
                  Select your seniority tier so we calibrate your initial roadmap:
                </p>

                {/* Tier Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                  {[
                    { level: "beginner", label: "Level 1: Fundamentals" },
                    { level: "moderate", label: "Level 2: Building Projects" },
                    { level: "advanced", label: "Level 3: Deep Technical" },
                  ].map((tier) => (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={tier.level}
                      type="button"
                      onClick={() => handleSelectAssessmentLevel(tier.level)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-[11px] font-mono tracking-wider uppercase transition-all duration-200 text-center cursor-pointer",
                        formData.assessmentLevel === tier.level
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/30"
                          : "border-white/10 bg-[#0D131F] text-slate-400 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {tier.label}
                    </motion.button>
                  ))}
                </div>

                {/* Active Quiz Area */}
                {formData.quizStarted && !formData.quizCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0D131F] border border-white/15"
                  >
                    {(() => {
                      const questions = QUIZ_BANK[formData.assessmentLevel] || [];
                      const q = questions[quizState.currentIndex];
                      if (!q) return null;

                      return (
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                            <span>QUESTION 0{quizState.currentIndex + 1} OF 0{questions.length}</span>
                            <span className="uppercase text-cyan-400">TIER: {formData.assessmentLevel}</span>
                          </div>

                          <p className="text-sm font-medium text-white mb-4 leading-relaxed font-sans">
                            {q.question}
                          </p>

                          <div className="space-y-2 mb-4">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = quizState.selectedAnswer === optIdx;
                              const isCorrect = optIdx === q.correctIndex;
                              const showResult = quizState.showExplanation;

                              return (
                                <motion.button
                                  whileTap={!showResult ? { scale: 0.99 } : {}}
                                  key={optIdx}
                                  type="button"
                                  disabled={showResult}
                                  onClick={() => handleAnswerSelect(optIdx)}
                                  className={cn(
                                    "w-full p-3.5 rounded-xl border text-left text-xs font-mono transition-all flex items-start gap-3 cursor-pointer",
                                    showResult && isCorrect
                                      ? "border-cyan-400 bg-cyan-500/20 text-white"
                                      : showResult && isSelected && !isCorrect
                                      ? "border-red-500/60 bg-red-500/15 text-red-200"
                                      : isSelected
                                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold"
                                      : "border-white/10 bg-[#060A12]/70 text-slate-300 hover:border-white/25 hover:bg-[#060A12]"
                                  )}
                                >
                                  <span className="w-5 h-5 rounded-md border border-white/20 flex items-center justify-center text-[10px] flex-shrink-0">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="leading-relaxed">{opt}</span>
                                </motion.button>
                              );
                            })}
                          </div>

                          {quizState.showExplanation && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3.5 rounded-xl bg-[#060A12] border border-white/10 mb-3 text-xs"
                            >
                              <p className="text-slate-300 font-mono leading-relaxed">
                                {q.explanation}
                              </p>
                            </motion.div>
                          )}

                          {quizState.showExplanation && (
                            <div className="flex justify-end">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={handleNextQuestion}
                                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                              >
                                {quizState.currentIndex + 1 < questions.length ? "Next Question →" : "Complete Assessment"}
                              </motion.button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </motion.div>
                )}

                {/* Quiz Completed State */}
                {formData.quizCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0D131F] border border-cyan-500/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        Diagnostic Check Recorded
                      </span>
                      <button
                        type="button"
                        onClick={handleResetQuiz}
                        className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        Try another tier
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 font-mono mb-4">
                      Score: {formData.quizScore}/{totalQuestions} ({scorePercentage}%) — Integrated into your baseline telemetry.
                    </p>

                    {/* Attestation Checkbox */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#060A12] border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.attestationChecked}
                        onChange={(e) =>
                          setFormData({ ...formData, attestationChecked: e.target.checked })
                        }
                        className="mt-0.5 accent-cyan-400 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300 leading-relaxed">
                        I attest this represents my honest skill profile and authentic problem-solving baseline.
                      </span>
                    </label>
                  </motion.div>
                )}
              </div>

              {/* Step 4 Actions */}
              <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {onboardingError && (
                  <div className="mr-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                    {onboardingError}
                  </div>
                )}

                <motion.button
                  whileHover={isStep4ReadyToComplete ? { scale: 1.02 } : {}}
                  whileTap={isStep4ReadyToComplete ? { scale: 0.98 } : {}}
                  type="button"
                  disabled={!isStep4ReadyToComplete || isSubmitting}
                  onClick={handleCompleteOnboarding}
                  className={cn(
                    "px-8 py-3.5 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2",
                    isStep4ReadyToComplete
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.5)] cursor-pointer"
                      : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                  )}
                >
                  <span>{isSubmitting ? "Generating Curriculum..." : "Launch My Career Sprint"}</span>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ============================================================ */}
      {/* REVIEW SUMMARY MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isReviewOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0D131F] border border-white/15 rounded-3xl w-full max-w-lg shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    // YOUR ONBOARDING SUMMARY
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-mono">
                <div className="p-4 rounded-2xl bg-[#060A12] border border-white/10 space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
                    01 // ABOUT YOU
                  </span>
                  <p>Name: <span className="text-white font-bold">{formData.preferredName || "(Empty)"}</span></p>
                  <p>Institute / School: <span className="text-slate-300">{formData.university || "(None specified)"}</span></p>
                  <p>Standard / Year: <span className="text-slate-300">{formData.yearOfStudy || "(None specified)"}</span></p>
                </div>

                <div className="p-4 rounded-2xl bg-[#060A12] border border-white/10 space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
                    02 // YOUR FOCUS
                  </span>
                  <p>Focus Type: <span className="text-white uppercase">{formData.goalType === "topic" ? "Topic sprint" : "Job role"}</span></p>
                  <p>Target: <span className="text-cyan-400 font-bold">{formData.goalInput || "(Not set)"}</span></p>
                </div>

                <div className="p-4 rounded-2xl bg-[#060A12] border border-white/10 space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
                    03 // DEADLINE
                  </span>
                  <p>Deadline: <span className="text-white font-bold">{formData.timeline || "(Not set)"}</span></p>
                </div>

                <div className="p-4 rounded-2xl bg-[#060A12] border border-white/10 space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
                    04 // PROOF & SKILLS
                  </span>
                  <p>Repository: <span className="text-white">{formData.githubSlug || "None linked"}</span></p>
                  <p>Files Attached: <span className="text-white">{formData.uploadedFiles.length} file(s)</span></p>
                  <p>Skill Level: <span className="text-white uppercase">{formData.assessmentLevel || "Pending"}</span></p>
                  <p>Diagnostic Score: <span className="text-cyan-400">{formData.quizCompleted ? `${formData.quizScore}/${totalQuestions}` : "Incomplete"}</span></p>
                </div>
              </div>

              <div className="p-4 bg-[#060A12] border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  Close Summary
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* COMPLETION MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isCompletedModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0D131F] border border-white/15 rounded-3xl w-full max-w-md p-6 sm:p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.95)]"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h2 className="text-xl font-display font-extrabold uppercase text-white mb-2 tracking-tight">
                Roadmap Synthesized!
              </h2>
              <p className="text-xs text-slate-300 font-mono mb-6 leading-relaxed">
                Your customized living roadmap and tactical missions are locked in for {formData.preferredName.trim()}. Ready to dive into your workspace?
              </p>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    if (onNavigateToHome) {
                      onNavigateToHome(formData);
                    } else if (onBackToLanding) {
                      onBackToLanding();
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enter Living Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <button
                  type="button"
                  onClick={() => setIsCompletedModalOpen(false)}
                  className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Review Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
