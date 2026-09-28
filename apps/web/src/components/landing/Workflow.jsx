import { workflowSteps } from "../../data/mockData";
import { Orb, SectionHeading, Stagger, StaggerItem, TiltCard } from "../ui";

export default function Workflow() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-24 sm:py-32 bg-[#060A12]">
      <Orb className="left-1/2 top-10 h-[30rem] w-[60rem] -translate-x-1/2 bg-blue-950/20 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="Action Roadmap // 4-Step Cycle"
          title={
            <>
              How FitCheck levels up{" "}
              <span className="text-cyan-400">your tech trajectory</span>
            </>
          }
          body="A continuous, hands-on feedback loop built to help you master real IT skills and get job-ready fast."
        />

        <Stagger className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {workflowSteps.map((item) => {
            const StepIcon = item.icon;
            return (
              <StaggerItem key={item.step} className="h-full flex flex-col">
                <TiltCard intensity={8} className="group h-full w-full rounded-3xl flex flex-col">
                  <article className="relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-7 border border-white/10 bg-[#0D131F]/90 backdrop-blur-xl transition-all duration-300 group-hover:border-cyan-400/40 shadow-lg">
                    {/* Step numbering watermark */}
                    <div className="pointer-events-none absolute right-4 top-4 font-mono text-5xl font-black text-white/[0.03] transition-colors group-hover:text-cyan-400/[0.08] select-none">
                      {item.step}
                    </div>

                    <div>
                      {/* Top icon and badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#060A12] text-cyan-400 transition-all group-hover:border-cyan-400/40 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                          <StepIcon className="h-6 w-6" />
                        </div>
                        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
                          {item.badge}
                        </span>
                      </div>

                      <div className="font-mono text-[11px] font-semibold tracking-wider text-cyan-400/80 mb-1">
                        PHASE {item.step}
                      </div>
                      <h3 className="font-display text-lg font-bold text-white mb-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#94A3B8]">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom progression indicator */}
                    <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Active
                      </span>
                      <span className="text-cyan-400 transition-transform group-hover:translate-x-1 flex items-center gap-1 font-bold">
                        Phase {item.step} &rarr;
                      </span>
                    </div>
                  </article>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

