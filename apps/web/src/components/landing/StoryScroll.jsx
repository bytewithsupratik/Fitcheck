import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { storyCaptions as captions, storyNodes as NODES } from "../../data/mockData";

const LINES = 9;
const W = 400;
const H = 420;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const range = (p, a, b) => ease(clamp01((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

function Line({ i, p }) {
  const x0 = 40 + (i * (W - 80)) / (LINES - 1);
  const center = LINES >> 1;
  const isCenter = i === center;
  const dir = i % 2 === 0 ? 1 : -1;
  const mag = ((i * 7) % 5) + 1;

  const d = useTransform(p, (v = 0) => {
    const safeV = typeof v === "number" ? v : 0;
    const wob = range(safeV, 0.22, 0.48); // stage 2 wobble
    const conv = range(safeV, 0.5, 0.76); // stage 3 converge
    const amp = lerp(0, 22 * mag * dir, wob) * (1 - conv);
    const x = lerp(x0, W / 2, conv);
    const c1 = lerp(x + amp, W / 2 + 70, conv);
    const c2 = lerp(x - amp, W / 2 - 70, conv);
    return `M ${x} 10 C ${c1} ${H * 0.35}, ${c2} ${H * 0.65}, ${x} ${H - 10}`;
  });

  const dash = useTransform(p, (v = 0) => {
    const safeV = typeof v === "number" ? v : 0;
    const brk = range(safeV, 0.3, 0.48);
    if (isCenter || i % 3 === 0) return "1000 0";
    const seg = lerp(1000, 26 - mag * 2, brk);
    const gap = lerp(0, 14 + mag * 2, brk);
    return `${seg} ${gap}`;
  });

  const opacity = useTransform(p, (v = 0) => {
    const safeV = typeof v === "number" ? v : 0;
    const conv = range(safeV, 0.5, 0.76);
    if (isCenter) return 1;
    return lerp(0.55, 0, conv);
  });

  const width = useTransform(p, (v = 0) => (isCenter ? lerp(1.5, 3.2, range(typeof v === "number" ? v : 0, 0.5, 0.78)) : 1.5));
  
  const stroke = useTransform(p, (v = 0) => {
    const safeV = typeof v === "number" ? v : 0;
    const t = range(safeV, 0.5, 0.78);
    return isCenter ? (t > 0.5 ? "url(#storyGrad)" : "rgba(176,224,230,0.6)") : "rgba(176,224,230,0.6)";
  });

  return (
    <motion.path
      d={d}
      fill="none"
      style={{ opacity, strokeDasharray: dash, strokeWidth: width, stroke }}
      strokeLinecap="round"
    />
  );
}

/** point on the converged cubic curve with safety checks */
function curvePoint(t) {
  const safeT = typeof t === "number" ? t : 0;
  const p0 = { x: W / 2, y: 10 };
  const p1 = { x: W / 2 + 70, y: H * 0.35 };
  const p2 = { x: W / 2 - 70, y: H * 0.65 };
  const p3 = { x: W / 2, y: H - 10 };
  const u = 1 - safeT;
  return {
    x: u * u * u * p0.x + 3 * u * u * safeT * p1.x + 3 * u * safeT * safeT * p2.x + safeT * safeT * safeT * p3.x,
    y: u * u * u * p0.y + 3 * u * u * safeT * p1.y + 3 * u * safeT * safeT * p2.y + safeT * safeT * safeT * p3.y,
  };
}

export default function StoryScroll() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.4 });

  const rotateX = useTransform(p, [0.76, 1], [0, 22]);
  const rotateY = useTransform(p, [0.76, 1], [0, -18]);
  const scale = useTransform(p, [0, 0.5, 1], [0.92, 1, 1.04]);
  const gridOpacity = useTransform(p, [0.4, 0.7], [0.5, 0]);
  const nodeOpacity = useTransform(p, [0.78, 0.9], [0, 1]);
  const glow = useTransform(p, [0.5, 0.8], [0, 1]);

  const dot = useTransform(p, (v = 0) => {
    const safeV = typeof v === "number" ? v : 0;
    const t = range(safeV, 0.8, 1);
    return curvePoint(t);
  });
  const dotX = useTransform(dot, (d) => d?.x ?? W / 2);
  const dotY = useTransform(dot, (d) => d?.y ?? H / 2);

  return (
    <section id="story" ref={ref} className="relative h-[420vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        {/* stage lighting */}
        <motion.div
          style={{ opacity: glow }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/15 blur-[120px]"
        />
        <motion.div style={{ opacity: gridOpacity }} className="absolute inset-0 grid-bg opacity-30" />

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          {/* captions */}
          <div className="relative order-2 min-h-[15rem] lg:order-1 lg:min-h-[22rem] flex items-center">
            {captions.map((c) => (
              <Caption key={c.k} c={c} p={p} />
            ))}
          </div>

          {/* stage */}
          <div className="order-1 flex justify-center perspective-1600 lg:order-2">
            <motion.div
              style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
              className="relative h-[46svh] w-full max-w-[420px] lg:h-[70vh]"
            >
              <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" aria-hidden>
                <defs>
                  <linearGradient id="storyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#0891b2" />
                    <stop offset="0.5" stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#ffffff" />
                  </linearGradient>
                  <filter id="storyGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {Array.from({ length: LINES }, (_, i) => (
                  <Line key={i} i={i} p={p} />
                ))}

                {/* nodes on the converged path */}
                <motion.g style={{ opacity: nodeOpacity }}>
                  {NODES.map((n, i) => {
                    const pt = curvePoint(n.t);
                    const right = n.side === "r";
                    const fill =
                      n.state === "done" ? "#0891b2" : n.state === "active" ? "#22d3ee" : n.state === "bridge" ? "#0e7490" : n.state === "goal" ? "#060A12" : "#0D131F";
                    return (
                      <g key={i} transform={`translate(${pt.x} ${pt.y})`}>
                        {n.state === "active" && (
                          <circle r="9" fill="none" stroke="#22d3ee" className="animate-pulse-ring" />
                        )}
                        <circle r={n.state === "goal" ? 10 : 7} fill={fill} stroke="#22d3ee" strokeWidth="2" filter="url(#storyGlow)" />
                        <text
                          x={right ? 16 : -16}
                          y="4"
                          textAnchor={right ? "start" : "end"}
                          fontSize="12"
                          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                          fontWeight={n.state === "active" || n.state === "goal" ? 700 : 500}
                          fill={n.state === "bridge" ? "#22d3ee" : "rgba(255,255,255,0.9)"}
                        >
                          {n.label}
                        </text>
                      </g>
                    );
                  })}
                </motion.g>

                {/* travelling dot */}
                <motion.g style={{ opacity: nodeOpacity }}>
                  <motion.circle cx={dotX} cy={dotY} r="5" fill="#ffffff" filter="url(#storyGlow)" />
                </motion.g>
              </svg>

              {/* floating 3D badges in final stage */}
              <motion.div
                style={{ opacity: nodeOpacity, transform: "translateZ(60px)" }}
                className="absolute -right-2 top-[18%] rounded-xl px-3 py-2 text-[11px] font-mono text-white bg-[#0D131F]/90 border border-white/15 shadow-xl sm:right-0"
              >
                <span className="text-cyan-400 font-bold">Day 04</span> · bridge inserted
              </motion.div>
              <motion.div
                style={{ opacity: nodeOpacity, transform: "translateZ(40px)" }}
                className="absolute -left-2 bottom-[22%] rounded-xl px-3 py-2 text-[11px] font-mono text-white bg-[#0D131F]/90 border border-white/15 shadow-xl sm:left-0"
              >
                <span className="text-cyan-400 font-bold">Day 09</span> · timeline shrunk
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* chapter progress */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {captions.map((c) => (
            <Dot key={c.k} c={c} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Caption({ c, p }) {
  const mid = (c.from + c.to) / 2;
  const opacity = useTransform(p, [c.from, c.from + 0.04, c.to - 0.04, c.to], [0, 1, 1, 0]);
  const y = useTransform(p, [c.from, mid, c.to], [15, 0, -15]);
  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-x-0 flex flex-col justify-center pointer-events-none"
    >
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
        Chapter {c.k}
      </span>
      <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        {c.title}
      </h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[#94A3B8] sm:text-base lg:text-lg">
        {c.body}
      </p>
    </motion.div>
  );
}

function Dot({ c, p }) {
  const w = useTransform(p, [c.from, c.from + 0.04, c.to - 0.04, c.to], [8, 28, 28, 8]);
  const bg = useTransform(p, [c.from, c.from + 0.04, c.to - 0.04, c.to], [
    "rgba(255,255,255,0.2)",
    "rgba(34,211,238,1)",
    "rgba(34,211,238,1)",
    "rgba(255,255,255,0.2)",
  ]);
  return <motion.span style={{ width: w, backgroundColor: bg }} className="h-1.5 rounded-full" />;
}