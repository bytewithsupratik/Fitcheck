import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { ROADMAP_STATES } from "../../data/mockData";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function getPath(a, b) {
  if (!a || !b || typeof a.x !== "number" || typeof b.x !== "number") return "";
  const my = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
}

const nodeStyle = {
  done: { fill: "#0891b2", stroke: "#22d3ee", text: "#ffffff", r: 7 },
  active: { fill: "#22d3ee", stroke: "#ffffff", text: "#22d3ee", r: 9 },
  next: { fill: "#0D131F", stroke: "rgba(255,255,255,0.2)", text: "rgba(255,255,255,0.6)", r: 7 },
  bridge: { fill: "#0e7490", stroke: "#22d3ee", text: "#22d3ee", r: 8 },
  skipped: { fill: "#060A12", stroke: "rgba(255,255,255,0.2)", text: "rgba(255,255,255,0.35)", r: 6 },
  recall: { fill: "#0891b2", stroke: "#22d3ee", text: "#ffffff", r: 8 },
  goal: { fill: "#060A12", stroke: "#22d3ee", text: "#ffffff", r: 10 },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export function LivingRoadmap({
  state = ROADMAP_STATES?.[0],
  className,
  showLabels = true,
}) {
  const safeState = state || ROADMAP_STATES?.[0] || { nodes: [], edges: [], day: 1, change: "" };
  const nodes = safeState.nodes || [];
  const edges = safeState.edges || [];

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const spring = { type: "spring", stiffness: 90, damping: 18, mass: 0.8 };

  return (
    <svg
      viewBox="0 0 400 410"
      className={cn("h-full w-full overflow-visible", className)}
      role="img"
      aria-label={`Roadmap on ${safeState.day}: ${safeState.change}`}
    >
      <defs>
        <linearGradient id="edgeMain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0891b2" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* edges */}
      <AnimatePresence>
        {edges.map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          const d = getPath(a, b);

          if (!d) return null;

          const key = `${e.from}-${e.to}`;

          if (e.kind === "main") {
            return (
              <motion.path
                key={key}
                d={d}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1, transition: spring }}
                exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.2 } }}
                fill="none"
                stroke="url(#edgeMain)"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            );
          }
          return (
            <motion.path
              key={key}
              d={d}
              initial={{ opacity: 0 }}
              animate={{ opacity: e.kind === "ghost" ? 0.35 : 1, transition: spring }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              fill="none"
              stroke={e.kind === "bridge" ? "#22d3ee" : "rgba(34,211,238,0.6)"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={e.kind === "ghost" ? "3 7" : "8 6"}
              className={e.kind === "bridge" ? "animate-dash" : undefined}
            />
          );
        })}
      </AnimatePresence>

      {/* nodes */}
      {nodes.map((n) => {
        const s = nodeStyle[n.state] || nodeStyle.next;
        const rVal = Number(s?.r) || 7;
        const visible = Boolean(!n.hidden);
        const currentR = visible ? rVal : 0;
        const labelRight = (n.x ?? 0) > 200;
        const labelLeft = (n.x ?? 0) < 200;

        return (
          <motion.g
            key={n.id}
            initial={false}
            animate={{ x: n.x ?? 0, y: n.y ?? 0, opacity: visible ? 1 : 0 }}
            transition={spring}
            style={{ pointerEvents: visible ? "auto" : "none" }}
          >
            {n.state === "active" && (
              <>
                <circle r={rVal} fill="none" stroke="#22d3ee" strokeWidth="1.5" className="animate-pulse-ring origin-center" />
                <circle r={rVal} fill="none" stroke="#22d3ee" strokeWidth="1" className="animate-pulse-ring origin-center [animation-delay:1.3s]" />
              </>
            )}
            {n.state === "goal" && (
              <motion.circle
                r={rVal + 6}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1"
                strokeDasharray="4 5"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
              />
            )}

            {/* Standard circle with safe non-undefined radius */}
            <circle
              r={currentR}
              fill={s.fill}
              stroke={s.stroke}
              strokeWidth={2}
              filter={n.state === "active" || n.state === "goal" ? "url(#glow)" : undefined}
            />

            {n.state === "done" && (
              <path d="M-3 0 L-1 2 L3 -2" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {n.state === "skipped" && (
              <path d="M-3 -3 L3 3 M3 -3 L-3 3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" />
            )}
            {showLabels && (
              <motion.text
                animate={{ fill: s.text }}
                x={labelRight ? rVal + 10 : labelLeft ? -(rVal + 10) : -(rVal + 12)}
                y={4}
                textAnchor={labelRight ? "start" : "end"}
                fontSize="12.5"
                fontFamily="Sora, Inter, sans-serif"
                fontWeight={n.state === "active" || n.state === "goal" ? 600 : 400}
                style={{ textDecoration: n.state === "skipped" ? "line-through" : "none" }}
              >
                {n.label}
              </motion.text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}