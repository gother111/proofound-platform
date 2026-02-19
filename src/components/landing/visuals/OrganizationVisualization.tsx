import type { CSSProperties } from 'react';
import { Network, Search, Target } from 'lucide-react';

interface OrganizationVisualizationProps {
  shouldReduceMotion?: boolean;
}

export default function OrganizationVisualization({
  shouldReduceMotion = false,
}: OrganizationVisualizationProps) {
  const floatSlowClass = shouldReduceMotion ? '' : 'pf-personas-anim-float-slow';
  const floatSlowerClass = shouldReduceMotion ? '' : 'pf-personas-anim-float-slower';
  const morphSpinReverseClass = shouldReduceMotion ? '' : 'pf-personas-anim-morph-spin-reverse';

  const alignedDelay: CSSProperties | undefined = shouldReduceMotion
    ? undefined
    : { animationDelay: '-3s' };
  const verifiedSkillDelay: CSSProperties | undefined = shouldReduceMotion
    ? undefined
    : { animationDelay: '-5s' };
  const cardDelay: CSSProperties | undefined = shouldReduceMotion
    ? undefined
    : { animationDelay: '-1s' };

  return (
    <div
      className="group relative flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-[32px] bg-gradient-to-br from-[#F8F7F4] to-[#EBE9E2]"
      data-testid="landing-persona-visual-organization"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#9AB09E]/10 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-75" />

      <svg
        className={`absolute h-[120%] w-[120%] origin-center text-[#9AB09E]/10 ${morphSpinReverseClass}`}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M39.9,-65.4C53.7,-58.5,68.3,-52.5,77.5,-41.3C86.7,-30.1,90.5,-13.7,87.7,1.8C84.9,17.3,75.5,31.9,64.4,43.2C53.3,54.5,40.5,62.5,26.7,69C12.9,75.5,-1.9,80.5,-16.4,78.7C-30.9,76.9,-45.1,68.3,-56.3,56.8C-67.5,45.3,-75.7,30.9,-81.2,15.1C-86.7,-0.7,-89.5,-17.9,-83.6,-32.5C-77.7,-47.1,-63.1,-59.1,-48,-65.4C-32.9,-71.7,-17.3,-72.3,-2.3,-68.9C12.7,-65.5,26.1,-72.3,39.9,-65.4Z"
          transform="translate(100 100)"
        />
      </svg>

      <div
        className={`relative z-10 w-64 rounded-2xl border border-white/80 bg-white/60 p-4 shadow-xl shadow-black/5 backdrop-blur-xl transition-transform duration-700 group-hover:scale-105 ${floatSlowClass}`}
        style={cardDelay}
      >
        <div className="mb-4 flex items-center justify-between border-b border-[#242825]/5 pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#242825]/40" />
            <div className="h-2 w-16 rounded-full bg-[#242825]/10" />
          </div>
          <div className="rounded-full bg-[#9AB09E]/20 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wide text-[#1F3F32]">
            1 Match
          </div>
        </div>

        <div className="rounded-xl border border-white bg-white/90 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F3F32] font-serif text-sm text-white shadow-inner">
              A
            </div>
            <div className="flex-1">
              <div className="mb-2 h-1.5 w-12 rounded-full bg-[#242825]/30" />
              <div className="flex gap-1.5">
                <div className="h-1 w-8 rounded-full bg-[#9AB09E]" />
                <div className="h-1 w-4 rounded-full bg-[#9AB09E]/40" />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-sans text-[11px] font-bold text-[#1F3F32]">98%</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`absolute left-[5%] top-[20%] flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md ${floatSlowerClass}`}
        style={alignedDelay}
      >
        <Target className="h-3 w-3 text-[#1F3F32]" />
        <span className="font-sans text-[10px] font-semibold text-[#242825]">Aligned</span>
      </div>

      <div
        className={`absolute bottom-[15%] right-[5%] flex items-center gap-1.5 rounded-full bg-[#1F3F32] px-3 py-1.5 shadow-lg ${floatSlowClass}`}
        style={verifiedSkillDelay}
      >
        <Network className="h-3 w-3 text-[#9AB09E]" />
        <span className="font-sans text-[10px] font-semibold text-white">Verified Skill</span>
      </div>

      <div className="absolute bottom-[35%] right-[15%] h-2 w-2 animate-pulse rounded-full bg-[#9AB09E] shadow-[0_0_10px_rgba(154,176,158,0.6)]" />
    </div>
  );
}
