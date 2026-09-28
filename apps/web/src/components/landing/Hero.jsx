import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { LivingRoadmap } from "./LivingRoadmap";
import { Counter, MagneticButton, Orb, ParticleField } from "../ui";
import { brand, heroStats, ROADMAP_STATES } from "../../data/mockData";

export default function Hero({ onOpenAuth }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const state = ROADMAP_STATES[idx];

  // Auto-evolve the interactive roadmap
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ROADMAP_STATES.length), 3800);
    return () => clearInterval(t);
  }, []);

  // Mouse 3D parallax tracking
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });
  const rotY = useTransform(smx, [-0.5, 0.5], [-14, 14]);
  const rotX = useTransform(smy, [-0.5, 0.5], [10, -10]);
  const layer1x = useTransform(smx, [-0.5, 0.5], [-24, 24]);
  const layer1y = useTransform(smy, [-0.5, 0.5], [-24, 24]);
  const layer2x = useTransform(smx, [-0.5, 0.5], [30, -30]);
  const layer2y = useTransform(smy, [-0.5, 0.5], [30, -30]);

  // Scroll-linked exit transition (subtle upward fade, no downward clashing push)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -25]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -15]);

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#060A12] pt-28 pb-16 sm:pt-36 lg:pt-40"
    >
      {/* Background ambient lighting and particle network */}
      <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] opacity-30" />
      <div className="absolute inset-0 -z-10">
        <ParticleField density={60} />
      </div>
      <Orb className="-left-32 top-10 h-[34rem] w-[34rem] bg-cyan-900/15 animate-float-slow pointer-events-none" />
      <Orb className="-right-40 bottom-0 h-[30rem] w-[30rem] bg-blue-900/15 animate-float pointer-events-none" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* Left: Copy & Value Proposition */}
        <motion.div style={{ y: textY }} className="relative z-10" id="vision">
          {/* Tactical chip badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0D131F]/90 py-1 pl-1.5 pr-4 text-xs text-slate-300"
          >
            <span className="rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
              New
            </span>
            <span className="font-mono text-xs text-[#94A3B8]">Precision tech role navigation & living roadmaps</span>
          </motion.div>

          {/* Massive Brand Heading */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_35px_rgba(34,211,238,0.2)] leading-none mb-4">
            FIT<span className="text-cyan-400">CHECK</span>
          </h1>

          {/* Value proposition quote */}
          <div className="mb-5">
            <p className="font-display text-xl sm:text-2xl font-medium tracking-tight text-white italic leading-snug">
              &ldquo;{brand.quote.start}{" "}
              <span className="text-cyan-400 not-italic font-bold underline decoration-cyan-400/40 underline-offset-4">
                {brand.quote.highlight}
              </span>
              &rdquo;
            </p>
          </div>

          {/* Subtitle / pitch */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-[#94A3B8]"
          >
            {brand.subtext}
          </motion.p>

          {/* Interactive CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth("register")}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 hover:bg-cyan-300 px-8 py-4 font-mono text-xs font-bold uppercase tracking-wider text-[#060A12] shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>START YOUR JOURNEY</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <a
              href="#story"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#0D131F] hover:border-cyan-400/40 hover:bg-white/5 px-7 py-4 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>EXPLORE FITCHECK</span>
              <ChevronDown className="h-4 w-4 text-cyan-400 transition-transform group-hover:translate-y-0.5" />
            </a>
          </motion.div>

          {/* Live Telemetry / Hero Stats */}
          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6"
          >
            {heroStats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-mono text-2xl font-bold text-white sm:text-3xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </dd>
                <dd className="mt-1 text-[11px] font-mono leading-snug text-[#94A3B8] sm:text-xs">{s.label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Right: 3D Living Roadmap Scene */}
        <motion.div
          style={{ y: sceneY, scale: sceneScale, opacity: sceneOpacity }}
          className="relative mx-auto w-full max-w-[520px] perspective-1600"
        >
          <motion.div
            initial={{ opacity: 0, rotateY: 30, x: 80 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            transition={{ duration: 1.3, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="preserve-3d"
          >
            <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }} className="relative">
              {/* Back glow plate */}
              <div
                aria-hidden
                className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-cyan-600/20 to-blue-600/10 blur-2xl"
                style={{ transform: "translateZ(-80px)" }}
              />

              {/* Main 3D Card */}
              <div
                className="relative rounded-3xl p-5 sm:p-7 border border-white/15 bg-[#0D131F]/90 backdrop-blur-xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
                style={{ transform: "translateZ(0px)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,0.8)]" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                      AI / ML Track · living roadmap
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {ROADMAP_STATES.map((s, i) => (
                      <button
                        key={s.key}
                        type="button"
                        aria-label={`Show ${s.day}`}
                        onClick={() => setIdx(i)}
                        className="relative h-1.5 w-6 overflow-hidden rounded-full bg-white/10"
                      >
                        {i === idx && (
                          <motion.span
                            layoutId="hero-progress"
                            className="absolute inset-0 rounded-full bg-cyan-400"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 aspect-[400/410] w-full">
                  <LivingRoadmap state={state} />
                </div>
              </div>

              {/* Floating chip 1: Day + Event */}
              <motion.div
                style={{ x: layer1x, y: layer1y, transform: "translateZ(70px)" }}
                className="absolute -left-3 top-16 w-[15.5rem] sm:-left-10"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={state.key}
                    initial={{ opacity: 0, y: 14, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ duration: 0.45 }}
                    className="rounded-2xl p-3.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] border border-white/15 bg-[#060A12]/95 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                        {state.day}
                      </span>
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                    </div>
                    <p className="mt-1 text-sm font-medium text-white">{state.event}</p>
                    <p className="mt-1 text-xs text-slate-400">→ {state.change}</p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Floating chip 2: Mastery Telemetry */}
              <motion.div
                style={{ x: layer2x, y: layer2y, transform: "translateZ(50px)" }}
                className="absolute -right-2 bottom-10 sm:-right-8"
              >
                <div className="flex items-center gap-3.5 rounded-2xl px-4 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] border border-white/15 bg-[#060A12]/95 backdrop-blur-xl">
                  <div className="relative h-11 w-11">
                    <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                      <motion.circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="100.5"
                        animate={{ strokeDashoffset: 100.5 - (100.5 * [64, 76, 88, 96][idx]) / 100 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute inset-0 grid place-items-center font-mono text-[11px] font-bold text-white">
                      {[64, 76, 88, 96][idx]}%
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-xs font-semibold text-white">Readiness Score</p>
                    <p className="text-[11px] text-slate-400">recomputed in real time</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Cue */}
      <motion.a
        href="#story"
        aria-label="Scroll to the story"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 hover:text-cyan-400 transition-colors md:flex"
      >
        Scroll
        <span className="relative h-10 w-5 rounded-full border border-white/20">
          <motion.span
            animate={{ y: [4, 18, 4], opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute left-1/2 top-0 h-2 w-1 -translate-x-1/2 rounded-full bg-cyan-400"
          />
        </span>
      </motion.a>
    </section>
  );
}
