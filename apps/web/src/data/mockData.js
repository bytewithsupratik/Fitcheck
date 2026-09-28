import {
  Terminal,
  Database,
  Zap,
  GitBranch,
  Compass,
  Crosshair,
  Target,
  Activity,
} from "lucide-react";

/**
 * ============================================================
 *  FitCheck — Static Content, Brand & Neutralized Scaffold
 * ============================================================
 */

/* ------------------------------------------------------------ */
/*  1. Brand & Navigation (Marketing - PRESERVED)               */
/* ------------------------------------------------------------ */
export const brand = {
  name: "FitCheck",
  tagline: "Precision tech role navigation & living roadmaps.",
  quote: {
    start: "Stop grinding random tutorials.",
    highlight: "Know the exact path to your dream IT role.",
  },
  subtext: "No fluff, no tutorial hell. Pick your IT path, build verified project proof, and get job-ready with zero guesswork.",
};

export const nav = [
  { label: "Vision", href: "#vision" },
  { label: "Story", href: "#story" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#how-it-works" },
];

/* ------------------------------------------------------------ */
/*  3. Hero Statistics (Marketing - PRESERVED)                  */
/* ------------------------------------------------------------ */
export const heroStats = [
  { value: 48000, suffix: "+", label: "techies leveling up daily" },
  { value: 1200000, suffix: "+", label: "real-world skill checks" },
  { value: 89, suffix: "%", label: "hit target job readiness" },
];

/* ------------------------------------------------------------ */
/*  4. Core Features (Marketing - PRESERVED)                    */
/* ------------------------------------------------------------ */
export const coreFeatures = [
  {
    id: "feature-dna",
    tag: "01 // ROLE DNA",
    title: "Role DNA Engine",
    subtitle: "Real Skill Gap Breakdown",
    description:
      "Find out what you're actually lacking before an interviewer points it out. We map your skills against real production standards.",
    icon: Compass,
    metrics: [
      { label: "System Design", value: "94%", width: 94 },
      { label: "Distributed Systems", value: "88%", width: 88 },
      { label: "API & Concurrency", value: "78%", width: 78 },
    ],
    previewSnippet: "ROLE_VEC: [TARGET=DEV_LEAD, GAP_INDEX=0.14, STATUS=READY]",
  },
  {
    id: "feature-missions",
    tag: "02 // DAILY MISSIONS",
    title: "AI Daily Missions",
    subtitle: "Bite-Sized Practical Drills",
    description:
      "No 10-hour tutorial traps. Get targeted daily coding drills and architectural tasks so you never burn out or procrastinate.",
    icon: Target,
    metrics: [
      { label: "Daily Streak", value: "14 Days", width: 90 },
      { label: "Task Velocity", value: "96.2%", width: 96 },
      { label: "Skill Gain", value: "+4.8x", width: 85 },
    ],
    previewSnippet: "ACTIVE_MISSION: Build zero-copy buffer serializer (Rust/Go)",
  },
  {
    id: "feature-vault",
    tag: "03 // PROOF PROTOCOL",
    title: "Evidence Vault",
    subtitle: "Real Proof of Work",
    description:
      "Talk is cheap. Store your real repos, PRs, architecture docs, and live deployments to prove you can actually build.",
    icon: Database,
    metrics: [
      { label: "Verified Proofs", value: "28 Repos", width: 82 },
      { label: "Authenticity", value: "99.4%", width: 99 },
      { label: "Code Quality", value: "9.6/10", width: 96 },
    ],
    previewSnippet: "VERIFIED_PROOF: github.com/user/prod-api [PASSED]",
  },
  {
    id: "feature-readiness",
    tag: "04 // READINESS METER",
    title: "Readiness Score",
    subtitle: "Honest Employability Metric",
    description:
      "A no-bullshit index showing if you're actually ready to get hired. Continuously updated as you build and solve real tasks.",
    icon: Activity,
    metrics: [
      { label: "Job Ready Score", value: "89.2%", width: 89 },
      { label: "Market Percentile", value: "Top 3%", width: 97 },
      { label: "Salary Target", value: "+$45k", width: 88 },
    ],
    previewSnippet: "READINESS_SCORE: 88.4 / 100 // STATUS: READY_TO_HIRE",
  },
];

/* ------------------------------------------------------------ */
/*  6. Tactical Execution Workflow (Marketing - PRESERVED)      */
/* ------------------------------------------------------------ */
export const workflowSteps = [
  {
    step: "01",
    badge: "PICK ROLE",
    title: "Select Your Target IT Role",
    description:
      "Pick your target role: Cloud Architect, Full-Stack Dev, DevOps Specialist, or AI Developer. Zero gatekeeping.",
    icon: Crosshair,
  },
  {
    step: "02",
    badge: "GET ROADMAP",
    title: "Get Your Custom Tech Roadmap",
    description:
      "We generate an interactive, game-style skill tree showing only what you actually need. No filler topics.",
    icon: GitBranch,
  },
  {
    step: "03",
    badge: "BUILD & SHIP",
    title: "Tackle Daily Missions & Push Code",
    description:
      "Solve practical tech challenges, push real code to GitHub, and let automated AI evaluate your implementation.",
    icon: Terminal,
  },
  {
    step: "04",
    badge: "GET HIRED",
    title: "Hit 85%+ Readiness & Land Offers",
    description:
      "Unlock your verified readiness score, share your portfolio vault, and bypass generic interview trivia rounds.",
    icon: Zap,
  },
];

/* ------------------------------------------------------------ */
/*  7. Story Scroll Narrative (Marketing - PRESERVED)           */
/* ------------------------------------------------------------ */
export const storyCaptions = [
  {
    k: "01",
    title: "Everyone gets the same tired advice.",
    body: "Grind 500 LeetCode questions. Build another basic todo app. It's giving 2018.",
    from: 0,
    to: 0.22,
  },
  {
    k: "02",
    title: "No two tech journeys are identical.",
    body: "You get stuck on async code. Finals hit. Static roadmaps stay rigid while your life shifts.",
    from: 0.24,
    to: 0.48,
  },
  {
    k: "03",
    title: "So we built a roadmap that adapts to you.",
    body: "FitCheck calculates the shortest honest path for who you are and where you want to go.",
    from: 0.5,
    to: 0.74,
  },
  {
    k: "04",
    title: "A roadmap that evolves with every push.",
    body: "Stuck on APIs? A quick bridge appears. Master databases early? The timeline shrinks automatically.",
    from: 0.76,
    to: 1,
  },
];

export const storyNodes = [
  { t: 0.06, label: "Tensors & Vector Math", side: "l", state: "done" },
  { t: 0.24, label: "Deep Neural Nets", side: "r", state: "done" },
  { t: 0.42, label: "Transformers & Attention", side: "l", state: "active" },
  { t: 0.6, label: "Bridge · Autograd", side: "r", state: "bridge" },
  { t: 0.78, label: "Vector Search & RAG", side: "l", state: "next" },
  { t: 0.95, label: "Production AI Ready", side: "r", state: "goal" },
];

/* ------------------------------------------------------------ */
/*  8. Living Roadmap States (Landing Demo - PRESERVED)         */
/* ------------------------------------------------------------ */
const N = (id, label, x, y, state, hidden = false) => ({
  id,
  label,
  x,
  y,
  state,
  hidden,
});

export const ROADMAP_STATES = [
  {
    key: "day-01",
    day: "Day 01",
    event: "AI spun up your custom track",
    change: "Calibrated baseline curriculum",
    nodes: [
      N("limits", "Core Foundations", 200, 40, "done"),
      N("deriv", "Architecture Deep Dive", 200, 104, "active"),
      N("chain", "Systems & Concurrency", 200, 168, "next"),
      N("optim", "Production Capstone", 200, 232, "next"),
      N("exam", "Job Ready Certification", 200, 372, "goal"),
    ],
    edges: [
      { from: "limits", to: "deriv", kind: "main" },
      { from: "deriv", to: "chain", kind: "main" },
      { from: "chain", to: "optim", kind: "main" },
      { from: "optim", to: "exam", kind: "main" },
    ],
  },
];

/* ------------------------------------------------------------ */
/*  12. Platform Links & System Telemetry (PRESERVED)           */
/* ------------------------------------------------------------ */
export const systemTelemetry = {
  status: "SYSTEM OPERATIONAL",
  latency: "14MS",
  privacyStatement: "No credit card required · Instant roadmap synthesis · Complete telemetry privacy",
};

export const footerLinks = {
  Product: ["Role DNA Engine", "Action Pipeline", "Evidence Vault", "Readiness Telemetry"],
  Talent: ["Getting Started", "Interview Guides", "Artifact Audits", "Community"],
  Company: ["About FitCheck", "Methodology", "Security Protocol", "Join Us"],
  Legal: ["Zero-Trust Terms", "Privacy Telemetry", "Security Policy"],
};

/* ------------------------------------------------------------ */
/*  13. Onboarding & Quiz Bank (PRESERVED)                      */
/* ------------------------------------------------------------ */
export const QUIZ_BANK = {
  beginner: [
    {
      id: "b1",
      question: "What is the primary role of a variable in computer programming?",
      options: [
        "A mathematical equation that solves user input",
        "A named container in memory for storing data values",
        "A specific type of repeating loop construct",
        "A browser network error code",
      ],
      correctIndex: 1,
      explanation:
        "Variables serve as named storage locations in memory that hold data values for reference and manipulation throughout program execution.",
    },
    {
      id: "b2",
      question: "Which HTTP method is specifically designed to retrieve data from a web server without altering state?",
      options: ["POST", "DELETE", "GET", "PATCH"],
      correctIndex: 2,
      explanation:
        "GET is the standard idempotent HTTP method used to request and retrieve data from a specified resource.",
    },
    {
      id: "b3",
      question: "In Git version control, which command creates a local snapshot of your staged changes?",
      options: ["git commit", "git push", "git branch", "git checkout"],
      correctIndex: 0,
      explanation:
        "`git commit` captures a snapshot of currently staged project files with an associated log message.",
    },
  ],
  moderate: [
    {
      id: "m1",
      question: "In modern JavaScript, what does a Promise represent?",
      options: [
        "A synchronous lock on a database connection",
        "The eventual completion (or failure) of an asynchronous operation and its resulting value",
        "An immutable data structure for caching API responses",
        "A browser-only thread for executing heavy calculations",
      ],
      correctIndex: 1,
      explanation:
        "A Promise is an object representing the eventual fulfillment or rejection of an asynchronous task.",
    },
    {
      id: "m2",
      question: "Which HTTP response status code indicates that a client request lacks valid authentication credentials?",
      options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "500 Internal Error"],
      correctIndex: 0,
      explanation:
        "HTTP 401 Unauthorized indicates that the request has not been applied because it lacks valid authentication credentials for the target resource.",
    },
    {
      id: "m3",
      question: "Which SQL clause is used to combine rows from two or more tables based on a related column between them?",
      options: ["GROUP BY", "JOIN", "ORDER BY", "UNION DISTINCT"],
      correctIndex: 1,
      explanation:
        "A JOIN clause in SQL is used to combine records from two or more database tables based on related foreign/primary keys.",
    },
  ],
  advanced: [
    {
      id: "a1",
      question:
        "What is the worst-case and average-case time complexity of searching in a self-balancing Binary Search Tree (such as an AVL or Red-Black Tree)?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctIndex: 1,
      explanation:
        "Because the height of a balanced BST is strictly kept at O(log n), searches guarantee logarithmic O(log n) time complexity in both average and worst cases.",
    },
    {
      id: "a2",
      question:
        "What is the primary architectural trade-off when adding indexes (e.g., B-Tree indexes) to relational database tables?",
      options: [
        "It speeds up read queries but introduces overhead and slows down write/insert operations",
        "It reduces table storage requirements but decreases read throughput",
        "It forces all database queries to execute synchronously on a single CPU core",
        "It automatically encrypts records but prevents foreign key relations",
      ],
      correctIndex: 0,
      explanation:
        "Indexes create supplementary lookup trees that drastically accelerate read filtering, but every INSERT, UPDATE, and DELETE must also update those trees.",
    },
    {
      id: "a3",
      question:
        "In distributed systems and microservices architecture, what is the core purpose of the Circuit Breaker pattern?",
      options: [
        "To load balance DNS requests round-robin across availability zones",
        "To prevent catastrophic cascading failures by failing fast when a downstream dependency is unresponsive",
        "To automatically compile TypeScript code into WebAssembly binaries",
        "To generate cryptographic public/private keypairs for user sessions",
      ],
      correctIndex: 1,
      explanation:
        "Circuit Breakers monitor failing remote calls and trip open to halt requests to an ailing service, sparing downstream resources and allowing recovery.",
    },
  ],
};

export const timelinePresets = [
  "1 Week",
  "3 Weeks",
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
];

export const onboardingStepItems = [
  { num: 1, label: "About You" },
  { num: 2, label: "Your Focus" },
  { num: 3, label: "Deadline" },
  { num: 4, label: "Proof & Skills" },
];

/* ------------------------------------------------------------ */
/*  14. Home Workspace Defaults (CLEANED & NEUTRALIZED)         */
/* ------------------------------------------------------------ */
// Safe baseline: Day 1, 0 streak, 25% starting readiness
export const defaultWorkspaceStats = {
  userName: "Learner",
  fullName: "Learner",
  email: "",
  greetingTime: "Hello",
  greeting: "Welcome back",
  dayNumber: 1,
  streak: "0 Days",
  readiness: "25%",
  goal: "85%",
  focusTopic: "Core Foundations",
  targetRole: "Software Developer",
  sessionStatus: "Ready",
  nextMilestone: "Stage 1 Capstone",
  todayDayTitle: "Core Foundations",
  todayDaySummary: "Master foundational architecture and clean database boundaries.",
  todayDuration: "30 mins",
};

/* ------------------------------------------------------------ */
/*  15. Daily Forecast Defaults                                 */
/* ------------------------------------------------------------ */
export const dailyForecastTasks = [];
export const dailyForecastVideos = [];
export const dailyForecastDocs = [];
export const dailyForecastMaterials = [];

/* ------------------------------------------------------------ */
/*  16. Roadmap Config (NEUTRALIZED - NO HARDCODED DAY 56)      */
/* ------------------------------------------------------------ */
// Replaced with dynamic empty arrays so live PostgreSQL tasks render
export const ROADMAP_MONTH_CONFIG = [];
export const CANDY_CRUSH_SAGA_DAYS = [];
export const CANDY_CRUSH_SAGA_LEVELS = [];
export const DEFAULT_ROADMAP_LEVELS = [];

/* ------------------------------------------------------------ */
/*  17. Technical Gym Scaffolding                               */
/* ------------------------------------------------------------ */
export const gymQuizQuestions = [];
export const gymCodeChallenges = [];

/* ------------------------------------------------------------ */
/*  18. Evidence Records Scaffolding                            */
/* ------------------------------------------------------------ */
export const mockGymEvidence = [];

/* ------------------------------------------------------------ */
/*  19. Intelligence Telemetry Scaffolding                      */
/* ------------------------------------------------------------ */
export const mockIntelligenceData = null;

/* ------------------------------------------------------------ */
/*  20. Readiness Score Scaffolding                             */
/* ------------------------------------------------------------ */
export const mockReadinessScore = {
  currentScore: 25,
  maxScore: 100,
  dailyChange: 0,
  rankBadge: "FOUNDATIONAL",
  targetBenchmark: "85 / 100",
  activeGapPts: 60,
};

/* ------------------------------------------------------------ */
/*  21. Dashboard Grouped Analytics (CLEANED)                   */
/* ------------------------------------------------------------ */
export const RADIAL_SKILLS = [];
export const GROWTH_TIMELINE = [];
export const INITIAL_ACTIVITY_DAYS = [];
export const DEFAULT_TODAY_AIMS = [];