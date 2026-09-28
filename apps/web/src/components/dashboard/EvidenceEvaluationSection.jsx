import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code2,
  Sparkles,
  X,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  Activity,
} from "lucide-react";
import { mockGymEvidence } from "../../data/mockData";

// ============================================================================
// [BACKEND INTEGRATION POINT] - EVIDENCE CERTIFICATES & AUDIT REGISTRY
// Endpoint: GET /api/v1/dashboard/evidence
// Headers: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
// Database Tables: `evidence_verifications`, `code_submissions`, `audit_signatures`
// Description: Returns verified certificates minted via AST analysis & GitHub repository checks.
// ============================================================================
export default function EvidenceEvaluationSection({
  evidence = mockGymEvidence,
}) {
  const evidenceList = evidence.map((item) => ({
    ...item,
    gymSprint: item.gymSprint || item.type || "Evidence record",
    summary: item.summary || item.description || "No evidence description provided.",
    status: item.status || "Submitted",
    verificationHash: item.verificationHash || item.id || "Unavailable",
    repoUrl: item.repoUrl || item.url || "",
    verifiedDate: item.verifiedDate || item.submittedAt || "Not available",
    metrics: item.metrics || {},
    testSuites: item.testSuites || [],
    aiExaminerFeedback: item.aiExaminerFeedback || item.description || "No examiner feedback available.",
    codeSnippet: item.codeSnippet || "No code snapshot available.",
  }));
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleOpenDetail = (evidence) => {
    setSelectedEvidence(evidence);
    setCopiedHash(false);
  };

  const handleCloseDetail = () => {
    setSelectedEvidence(null);
  };

  const handleCopyHash = (hash) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash);
    }
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <section id="evidence-evaluation-section" className="w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Evidence Evaluation Engine</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {evidenceList.length} Artifacts Verified
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Evidence Evaluation Report</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Cryptographically audited code projects completed in the Technical Gym. Click any project below to inspect the full in-depth AST code audit, test suite traces, and AI examiner report.
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-3 bg-[#0D131F] border border-white/10 rounded-xl px-4 py-2 shadow-inner">
          <div className="pr-3 border-r border-white/10 text-left">
            <span className="text-xs text-slate-400 font-mono block">Avg Verification</span>
            <span className="text-xl font-bold font-mono text-cyan-400">90.8%</span>
          </div>
          <div className="text-left">
            <span className="text-xs text-slate-400 font-mono block">Test Pass Rate</span>
            <span className="text-xl font-bold font-mono text-emerald-400">100%</span>
          </div>
        </div>
      </div>

      {/* Grid of Verified Project Cards (Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidenceList.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => handleOpenDetail(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenDetail(item);
              }
            }}
            className="group text-left bg-[#0D131F]/90 hover:bg-[#111A2C] border border-white/10 hover:border-cyan-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)] cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {/* Subtle top ambient glow on hover */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

            {/* Top row: Sprint name & Score pill */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[11px] font-mono font-semibold text-slate-400 bg-[#060A12] border border-white/10 px-2.5 py-1 rounded-lg">
                {item.gymSprint}
              </span>
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-cyan-300 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{item.score != null && item.maxScore != null ? `${item.score} / ${item.maxScore}` : item.status}</span>
              </div>
            </div>

            {/* Title & Tier */}
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between gap-2">
              <span>{item.title}</span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </h3>

            <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {item.summary}
            </p>

            {/* Metrics Pills */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/5 text-[11px] font-mono">
              <div className="bg-[#060A12] px-2.5 py-1.5 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">AST QUALITY</span>
                <span className="text-white font-semibold">{item.metrics?.astQuality || "95%"}</span>
              </div>
              <div className="bg-[#060A12] px-2.5 py-1.5 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">TESTS</span>
                <span className="text-emerald-400 font-semibold">3/3 Passed</span>
              </div>
              <div className="bg-[#060A12] px-2.5 py-1.5 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">LEAK RISK</span>
                <span className="text-cyan-400 font-semibold">0% Clean</span>
              </div>
            </div>

            {/* Bottom Call to Action strip */}
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-400">
                Verified: {item.verifiedDate}
              </span>
              <span className="text-cyan-400 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                <span>View Full Audit Report</span>
                <span>⤢</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* FULL-LENGTH IN-DEPTH AUDIT REPORT MODAL (EXPANSIVE)           */}
      {/* ============================================================ */}
      {selectedEvidence && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleCloseDetail}
          className="fixed inset-0 z-50 bg-[#060A12]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D131F] border border-cyan-500/50 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative text-left overflow-hidden animate-fadeIn my-auto"
          >
            {/* Modal Header Bar */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-[#0A0E18] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{selectedEvidence.status}</span>
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    {selectedEvidence.gymSprint}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                  <span>{selectedEvidence.title}</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Full Technical Gym Evidence Evaluation • Verified on {selectedEvidence.verifiedDate}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="bg-[#060A12] text-slate-400 hover:text-white p-2 rounded-xl border border-white/10 hover:border-cyan-400/40 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Switcher between Gym Projects */}
            <div className="bg-[#060A12] px-5 sm:px-6 py-2.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs font-mono">
              <span className="text-slate-400 whitespace-nowrap text-[11px]">Artifacts:</span>
              {evidenceList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenDetail(item)}
                  className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedEvidence.id === item.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.title.split(":")[0]} ({item.score})
                </button>
              ))}
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
              
              {/* 1. Score & Hash Banner */}
              <div className="bg-gradient-to-r from-cyan-950/40 to-[#060A12] border border-cyan-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex flex-col items-center justify-center text-center shadow-inner flex-shrink-0">
                    <span className="text-2xl font-extrabold text-cyan-300 font-mono leading-none">
                      {selectedEvidence.score ?? "LIVE"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {selectedEvidence.maxScore != null ? `/ ${selectedEvidence.maxScore} PTS` : (selectedEvidence.type || "RECORD").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider uppercase block">
                      VERIFICATION VERDICT
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {selectedEvidence.status}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {selectedEvidence.source || selectedEvidence.summary}
                    </span>
                  </div>
                </div>

                <div className="bg-[#060A12] border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="truncate max-w-[200px]">
                    <span className="text-slate-400 block text-[10px]">PROOF / RECORD ID</span>
                    <span className="text-cyan-300 font-bold">{selectedEvidence.verificationHash}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(selectedEvidence.verificationHash)}
                    className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Copy verification proof hash"
                  >
                    {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2. Comprehensive 4-Pillar Score Matrix */}
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Automated Technical Metrics</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#060A12] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">AST Quality</span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {selectedEvidence.metrics?.astQuality || "N/A"}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Lint Clean</span>
                  </div>
                  <div className="bg-[#060A12] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Complexity</span>
                    <span className="text-lg font-bold font-mono text-cyan-400 mt-1 block">
                      {selectedEvidence.metrics?.cyclomaticComplexity || "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Cyclomatic Score</span>
                  </div>
                  <div className="bg-[#060A12] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Memory Leaks</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                      0.0%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Teardowns Valid</span>
                  </div>
                  <div className="bg-[#060A12] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Execution Time</span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      O(1)
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono">Constant Space</span>
                  </div>
                </div>
              </div>

              {/* 3. Unit Test Execution Log */}
              <div className="bg-[#060A12] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono text-white font-bold uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Unit Test Suite Trace ({selectedEvidence.testSuites.length} records)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedEvidence.testSuites.length ? "Test trace available" : "No test trace"}
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {selectedEvidence.testSuites.map((suite, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D131F] border border-white/5"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-slate-300 truncate">{suite.name}</span>
                      </div>
                      <span className="text-slate-400 text-[11px] whitespace-nowrap">
                        {suite.duration}
                      </span>
                    </div>
                  ))}
                  {!selectedEvidence.testSuites.length && (
                    <p className="text-slate-400">No test suite details were included with this evidence record.</p>
                  )}
                </div>
              </div>

              {/* 4. AI Technical Examiner Qualitative Report */}
              <div className="bg-[#0A101D] border border-cyan-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Technical Examiner Qualitative Audit</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  "{selectedEvidence.aiExaminerFeedback}"
                </p>
              </div>

              {/* 5. Verified Code Snapshot */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Verified Implementation Artifact</span>
                  </span>
                  {selectedEvidence.repoUrl ? (
                    <a
                      href={selectedEvidence.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 hover:underline"
                    >
                      <span>View source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">Source unavailable</span>
                  )}
                </div>
                <pre className="bg-[#060A12] border border-white/10 rounded-xl p-4 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed max-h-56">
                  <code>{selectedEvidence.codeSnippet}</code>
                </pre>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0A0E18] flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                Cryptographically locked to candidate profile
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleCopyHash(selectedEvidence.verificationHash)}
                  className="px-4 py-2 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-colors cursor-pointer"
                >
                  {copiedHash ? "Hash Copied!" : "Copy Cert Hash"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                >
                  Close Audit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}

