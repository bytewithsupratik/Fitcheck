import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ChevronRight, Crosshair, Layers, X } from "lucide-react";
import { brand, nav } from "../../data/mockData";
import { cn } from "../../utils/cn";

export function Logo({ className }) {
  return (
    <a href="#top" className={cn("flex items-center gap-3 group", className)} aria-label={`${brand.name} home`}>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-white/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        <Crosshair className="w-4 h-4 text-white transition-transform duration-500 group-hover:rotate-45" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping opacity-75" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      </div>
      <span className="font-display text-xl font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
        FITCHECK
      </span>
    </a>
  );
}

export default function Navbar({ onOpenAuth }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div
          className={cn(
            "mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-6",
            scrolled ? "bg-[#060A12]/90 backdrop-blur-xl border border-white/10 mx-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.9)] sm:mx-auto" : "bg-transparent",
          )}
        >
          <Logo />

          {/* Desktop Nav Links */}
          <nav aria-label="Primary" className="hidden items-center gap-1 rounded-full border border-white/10 bg-[#0D131F]/90 px-4 py-1.5 md:flex">
            {nav.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative rounded-full px-3.5 py-1 font-mono text-xs tracking-wider text-slate-300 transition-colors hover:text-white"
              >
                {l.label}
                <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-400 to-blue-500 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth("login")}
              className="hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25 px-4 py-2 font-mono text-xs uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer sm:block"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth("register")}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-cyan-400 hover:bg-cyan-300 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#060A12] shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all cursor-pointer"
            >
              <span>Register</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#0D131F] text-white md:hidden cursor-pointer"
            >
              {open ? <X className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Top Scroll Indicator */}
        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute left-0 top-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400"
        />
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#060A12]/95 backdrop-blur-xl md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
              className="flex h-full flex-col justify-center gap-3 px-8"
              onClick={(e) => e.stopPropagation()}
            >
              {nav.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                  className="flex items-baseline gap-4 border-b border-white/10 py-3.5 font-display text-2xl font-bold text-white"
                >
                  <span className="text-xs font-mono text-cyan-400">0{i + 1}</span>
                  {l.label}
                </motion.a>
              ))}

              <div className="pt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (onOpenAuth) onOpenAuth("login");
                  }}
                  className="w-full py-3 rounded-xl border border-white/10 bg-[#0D131F] font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (onOpenAuth) onOpenAuth("register");
                  }}
                  className="w-full py-3 rounded-xl bg-cyan-400 font-mono text-xs font-bold uppercase tracking-wider text-[#060A12] shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                >
                  Register
                </button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
