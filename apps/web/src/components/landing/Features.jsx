import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { coreFeatures } from "../../data/mockData";
import { Orb, SectionHeading, Stagger, StaggerItem, TiltCard } from "../ui";
import { cn } from "../../utils/cn";

export default function Features() {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  return (
    <section id="features" className="relative overflow-hidden py-24 sm:py-32 bg-[#060A12]">
      <Orb className="left-1/2 top-0 h-[28rem] w-[60rem] -translate-x-1/2 bg-cyan-950/20 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="Platform Architecture // 4 Core Capabilities"
          title={
            <>
              Built for{" "}
              <span className="text-cyan-400">serious tech skill growth</span>
            </>
          }
          body="No more random tutorials or generic advice. FitCheck gives you a direct, actionable blueprint tailored to your chosen IT role."
        />

        <Stagger className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {coreFeatures.map((feature, idx) => {
            const IconComponent = feature.icon;
            const isSelected = activeFeatureIndex === idx;

            return (
              <StaggerItem key={feature.id}>
                <TiltCard intensity={6} className="h-full rounded-3xl">
                  <article
                    onClick={() => setActiveFeatureIndex(idx)}
                    className={cn(
                      "relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300",
                      isSelected
                        ? "bg-[#0D131F] border border-cyan-400/50 shadow-[0_0_35px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/30"
                        : "bg-[#0D131F]/80 border border-white/10 hover:border-white/25",
                    )}
                  >
                    {/* Top indicator glow bar on active card */}
                    {isSelected && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]" />
                    )}

                    <div>
                      {/* Top row: Tag & Icon */}
                      <div className="flex items-center justify-between mb-5">
                        <span className="font-mono text-[10px] font-semibold tracking-widest text-cyan-400 uppercase">
                          {feature.tag}
                        </span>
                        <div
                          className={cn(
                            "grid h-11 w-11 place-items-center rounded-2xl border transition-all duration-300",
                            isSelected
                              ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                              : "border-white/10 bg-[#060A12] text-slate-400",
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
                        {feature.title}
                      </h3>
                      <div className="font-mono text-xs text-cyan-300/80 mb-3 tracking-wide">
                        {feature.subtitle}
                      </div>
                      <p className="text-sm leading-relaxed text-[#94A3B8] mb-6">
                        {feature.description}
                      </p>

                      {/* Metrics Bar Breakdown */}
                      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#060A12]/80 p-4">
                        {feature.metrics.map((metric, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400 truncate pr-2">{metric.label}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-24 sm:w-28 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                  style={{ width: isSelected ? `${metric.width}%` : "65%" }}
                                />
                              </div>
                              <span className="text-white font-semibold min-w-[3rem] text-right">
                                {metric.value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Terminal Snippet Box */}
                    <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-[#060A12] px-4 py-2.5 font-mono text-[11px] text-slate-300">
                      <span className="truncate">{feature.previewSnippet}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 ml-2" />
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
