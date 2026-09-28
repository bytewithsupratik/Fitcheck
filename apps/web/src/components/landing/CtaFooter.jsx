import { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { brand, footerLinks, systemTelemetry } from "../../data/mockData";
import { Logo } from "./Navbar";
import { Reveal, ParticleField } from "../ui";

function MagneticSubmit({ children, onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });
  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.2);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.2);
  };
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-cyan-400 px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[#060A12] shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all hover:bg-cyan-300 focus-visible:outline-none cursor-pointer"
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </motion.button>
  );
}

export function Cta({ onOpenAuth }) {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${mx}% ${my}%, rgba(34,211,238,0.1), transparent 60%)`;
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onOpenAuth?.("register");
  };

  return (
    <section id="cta" className="relative px-5 py-24 sm:px-8 sm:py-32 bg-[#060A12]">
      <Reveal className="mx-auto max-w-6xl">
        <motion.div
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            mx.set(((e.clientX - r.left) / r.width) * 100);
            my.set(((e.clientY - r.top) / r.height) * 100);
          }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0D131F]/90 p-8 sm:p-14 lg:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <motion.div aria-hidden style={{ background: spotlight }} className="pointer-events-none absolute inset-0" />
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <ParticleField density={30} />
          </div>

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                Immediate Access // Free Tier
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Most tech roadmaps are one-size-fits-all.
                <br />
                <span className="text-cyan-400">This one adapts directly to you.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-[#94A3B8]">
                Calibrate your target IT role, complete bite-sized daily missions, audit your code artifacts, and deploy with an undeniable readiness score.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="relative rounded-2xl border border-white/10 bg-[#060A12]/90 p-5 sm:p-6 backdrop-blur-md" aria-label="Get started">
              <label htmlFor="cta-email" className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                Work or Personal Email
              </label>
              <input
                id="cta-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D131F] px-4 py-3 text-xs text-white placeholder:text-slate-500 transition-all focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
              <label htmlFor="cta-course" className="mt-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                Target IT Role
              </label>
              <input
                id="cta-course"
                type="text"
                placeholder="e.g. Cloud Architect, Full-Stack Dev"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D131F] px-4 py-3 text-xs text-white placeholder:text-slate-500 transition-all focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
              <div className="mt-5">
                <MagneticSubmit onClick={() => onOpenAuth?.("register")}>
                  Initialize Living Roadmap
                </MagneticSubmit>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Free forever tier</span>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.("login")}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Existing Member? Sign In →
                </button>
              </div>
              <p className="mt-3 text-center text-[10px] font-mono text-slate-500">{systemTelemetry.privacyStatement}</p>
            </form>
          </div>
        </motion.div>
      </Reveal>
    </section>
  );
}

export function Footer({ onOpenAuth }) {
  return (
    <footer className="relative border-t border-white/10 bg-[#060A12]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-xs sm:text-sm leading-relaxed text-[#94A3B8]">{brand.tagline} {brand.subtext}</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                {systemTelemetry.status} // {systemTelemetry.latency}
              </span>
            </div>
            <div className="mt-6 flex gap-3">
              {["X", "GH", "DC", "LI"].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 font-mono text-[11px] font-semibold text-slate-400 transition-all hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-cyan-300 bg-white/5"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([group, links]) => (
            <nav key={group} aria-label={group}>
              <h4 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{group}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      onClick={(e) => {
                        if (l === "Getting Started") {
                          e.preventDefault();
                          onOpenAuth?.("register");
                        }
                      }}
                      className="group inline-flex items-center text-xs sm:text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      <span className="mr-0 h-px w-0 bg-cyan-400 transition-all group-hover:mr-2 group-hover:w-3" />
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs font-mono text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Active telemetry: <span className="font-mono text-cyan-400">48,290+ sessions monitored</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

