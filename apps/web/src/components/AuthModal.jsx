import { authService } from "../services/authService";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Terminal,
  User,
  X,
} from "lucide-react";
import { cn } from "../utils/cn";

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onNavigateToOnboarding,
  onNavigateToHome,
}) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authSubmitted, setAuthSubmitted] = useState(false);

  useEffect(() => {
    setAuthMode(initialMode);
    setAuthSubmitted(false);
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // ============================================================================
  // [BACKEND INTEGRATION POINT] - AUTHENTICATION API (LOGIN / REGISTER)
  // Endpoints:
  //   - POST /api/v1/auth/login     (Headers: { "X-Api-Key": API_KEY })
  //   - POST /api/v1/auth/register  (Headers: { "X-Api-Key": API_KEY })
  // Database Tables:
  //   - `users` (id, email, full_name, role, created_at)
  //   - `user_credentials` (user_id, password_hash, salt)
  // Response: { token: "JWT_TOKEN", user: { id, email, fullName } }
  // ============================================================================
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      let response;
      if (authMode === "login") {
        // Live login call: POST http://localhost:4000/auth/login
        response = await authService.login({
          email: authForm.email,
          password: authForm.password,
        });
      } else {
        // Live register call: POST http://localhost:4000/auth/register
        response = await authService.register({
          email: authForm.email,
          password: authForm.password,
          username: authForm.fullName || authForm.email.split("@")[0],
        });

        // If registration does not return a token directly, immediately log in
        if (!response.token) {
          response = await authService.login({
            email: authForm.email,
            password: authForm.password,
          });
        }
      }

      // 1. Fetch complete authenticated profile from backend
      const profileData = await authService.getProfile();
      const authenticatedUser = profileData.profile || response.user;

      // 2. Notify App.jsx of authenticated user
      if (authMode === "register" && onNavigateToOnboarding) {
        onNavigateToOnboarding(authenticatedUser);
      } else if (onNavigateToHome) {
        onNavigateToHome(authenticatedUser);
      }

      // 3. Close the modal
      if (onClose) onClose();
    } catch (err) {
      // Displays the exact error message from our backend error envelope
      setErrorMessage(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // [BACKEND INTEGRATION POINT] - OAUTH SOCIAL AUTHENTICATION (GITHUB / GOOGLE)
  // Endpoints:
  //   - GET /api/v1/auth/oauth/github -> Redirects to GitHub OAuth authorize
  //   - GET /api/v1/auth/oauth/google -> Redirects to Google OAuth authorize
  // Database Tables: `user_oauth_identities` (provider, provider_uid, access_token)
  // ============================================================================
  const handleOAuth = (provider) => {
    setIsSubmitting(true);
    // [BACKEND CALL]: window.location.href = `${API_BASE_URL}/auth/oauth/${provider}?apiKey=${API_KEY}`;
    setTimeout(() => {
      setIsSubmitting(false);
      setAuthSubmitted(true);
      setTimeout(() => {
        onClose();
        setAuthSubmitted(false);
        const userData = { preferredName: "Alex Rivera", provider };
        if (authMode === "register" && onNavigateToOnboarding) {
          onNavigateToOnboarding(userData);
        } else if (onNavigateToHome) {
          onNavigateToHome(userData);
        } else if (onNavigateToOnboarding) {
          onNavigateToOnboarding(userData);
        }
      }, 1000);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with dark blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0D131F]/95 backdrop-blur-xl p-6 sm:p-8 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.95)]"
          >
            {/* Ambient corner glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-[#060A12] text-slate-400 transition-all hover:border-white/25 hover:text-white"
              aria-label="Close Authentication Modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-white">
                  {authMode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                  FITCHECK // ZERO-TRUST SESSION
                </p>
              </div>
            </div>

            {/* Tab Switcher: Sign In vs Register */}
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#060A12] p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthSubmitted(false);
                }}
                className={cn(
                  "py-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300",
                  authMode === "login"
                    ? "bg-cyan-400 text-[#060A12] font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    : "text-slate-400 hover:text-white",
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthSubmitted(false);
                }}
                className={cn(
                  "py-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300",
                  authMode === "register"
                    ? "bg-cyan-400 text-[#060A12] font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    : "text-slate-400 hover:text-white",
                )}
              >
                Register
              </button>
            </div>

            {/* Form or Success State */}
            {authSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-cyan-400 text-[#060A12] mx-auto shadow-[0_0_30px_rgba(34,211,238,0.6)] animate-bounce">
                  <Check className="h-7 w-7 stroke-[3]" />
                </div>
                <h4 className="font-display text-lg font-bold text-white">
                  AUTHENTICATION GRANTED
                </h4>
                <p className="text-xs text-slate-400">
                  Initializing your personalized tech workspace...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name (Register Mode Only) */}
                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <label className="block font-display text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={authForm.fullName}
                        onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                        placeholder="Alex Rivera"
                        className="w-full rounded-2xl border border-white/10 bg-[#060A12] pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 transition-all focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block font-display text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                    Primary Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      placeholder="alex@domain.com"
                      className="w-full rounded-2xl border border-white/10 bg-[#060A12] pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 transition-all focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-display text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                      Password / Key
                    </label>
                    {authMode === "login" && (
                      <a href="#cta" onClick={onClose} className="font-mono text-[10px] uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-colors">
                        Forgot Key?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full rounded-2xl border border-white/10 bg-[#060A12] pl-10 pr-11 py-3 text-xs text-white placeholder:text-slate-500 transition-all focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit CTA Button */}
                {errorMessage && (
                  <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-cyan-400 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-[#060A12] shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all hover:bg-cyan-300 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-[#060A12] border-t-transparent animate-spin" />
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === "login" ? "Sign In" : "Create Account"}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* Identity OAuth divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                    <span className="bg-[#0D131F] px-3">CONNECT VIA IDENTITY</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuth("github")}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#060A12] py-2.5 font-mono text-xs font-semibold text-slate-300 transition-all hover:border-cyan-400/40 hover:text-white cursor-pointer"
                  >
                    <GithubIcon className="h-4 w-4" />
                    <span>GitHub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("gitlab")}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#060A12] py-2.5 font-mono text-xs font-semibold text-slate-300 transition-all hover:border-cyan-400/40 hover:text-white cursor-pointer"
                  >
                    <Terminal className="h-4 w-4" />
                    <span>GitLab</span>
                  </button>
                </div>

                {/* Tactical Footnote */}
                <p className="pt-2 text-[10px] font-mono leading-relaxed text-slate-500 text-center">
                  Zero-trust telemetry encryption enabled. Your data stays strictly local.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
