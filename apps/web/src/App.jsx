 import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import LandingPage from "./components/landing/LandingPage";
import Onboarding from "./components/onboarding/Onboarding";
import Home from "./components/home/Home";
import AuthModal from "./components/AuthModal";
import { ThemeProvider } from "./context/ThemeContext";
import { authService } from "./services/authService";

/** Soft glow that trails the cursor across the whole page (desktop only). */
function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 50, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 50, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e) => {
      x.set(e.clientX - 200);
      y.set(e.clientY - 200);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-[90px] md:block"
    />
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState("landing"); // 'landing' | 'onboarding' | 'home'
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");


   useEffect(() => {
    // If a token exists in localStorage, load the real user profile on page refresh
    if (authService.isAuthenticated()) {
      authService
        .getProfile()
        .then((data) => {
          // Set user in state
          setCurrentUser(data.profile);
          setCurrentView("home");
        })
        .catch(() => {
          // If the token is invalid or expired, clear it
          authService.logout();
          setCurrentUser(null);
          setCurrentView("landing");
        });
    }
  }, []); // Empty array means this runs once when the app loads
  
  const handleOpenAuth = (mode = "register") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleNavigateToOnboarding = (data) => {
    setCurrentUser(data);
    setIsAuthOpen(false);
    setCurrentView("onboarding");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateToHome = (data) => {
    const role =
      data?.goalType === "job"
        ? data?.goalInput
        : data?.goalInput || "AI/ML Specialist";
    const focus =
      data?.goalType === "topic"
        ? data?.goalInput
        : "PyTorch Tensors & Attention";
    const readinessScore = data?.quizScore
      ? `${Math.round(50 + (data.quizScore / 3) * 35)}%`
      : "54%";

    const user = {
      name: data?.preferredName || "Rishi",
      preferredName: data?.preferredName || "rishi06.kk",
      fullName: data?.preferredName || "Rishi Kumar",
      email: data?.email || "alex@fitcheck.app",
      targetRole: role,
      focusTopic: focus,
      timeline: data?.timeline || "3 Months",
      streak: "12 Days",
      readiness: readinessScore,
      goal: "85%",
      sessionStatus: "Session Active",
      nextMilestone: "2 Days",
      githubSlug: data?.githubSlug || "",
      uploadedFiles: data?.uploadedFiles || [],
    };

    setCurrentUser(user);
    setCurrentView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReturnToLanding = () => {
    setCurrentView("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ThemeProvider>
      <div className="relative min-h-screen bg-[#060A12] text-powder-100 selection:bg-teal-500 selection:text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-powder-300 focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <CursorGlow />

        <AnimatePresence mode="wait">
          {currentView === "landing" && (
            <motion.div
              key="landing-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <LandingPage onOpenAuth={handleOpenAuth} />
            </motion.div>
          )}

          {currentView === "onboarding" && (
            <motion.div
              key="onboarding-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Onboarding
                initialData={currentUser}
                onNavigateToHome={handleNavigateToHome}
                onBackToLanding={handleReturnToLanding}
              />
            </motion.div>
          )}

          {currentView === "home" && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Home
                currentUser={currentUser}
                onSignOut={handleReturnToLanding}
                onReconfigureOnboarding={() => {
                  setCurrentView("onboarding");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialMode={authMode}
          onNavigateToHome={handleNavigateToHome}
          onNavigateToOnboarding={handleNavigateToOnboarding}
        />
      </div>
    </ThemeProvider>
  );
}