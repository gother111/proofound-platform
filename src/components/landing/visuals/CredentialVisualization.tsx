import type { CSSProperties } from 'react';
import { CheckCircle2, Shield } from 'lucide-react';

interface CredentialVisualizationProps {
  shouldReduceMotion?: boolean;
}

export default function CredentialVisualization({
  shouldReduceMotion = false,
}: CredentialVisualizationProps) {
  const floatSlowClass = shouldReduceMotion ? '' : 'pf-personas-anim-float-slow';
  const floatSlowerClass = shouldReduceMotion ? '' : 'pf-personas-anim-float-slower';
  const morphSpinClass = shouldReduceMotion ? '' : 'pf-personas-anim-morph-spin';

  const badgeDelay: CSSProperties | undefined = shouldReduceMotion
    ? undefined
    : { animationDelay: '-2s' };
  const identityDelay: CSSProperties | undefined = shouldReduceMotion
    ? undefined
    : { animationDelay: '-4s' };

  return (
    <div
      className="group relative flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-[32px] bg-gradient-to-br from-[#F8F7F4] to-[#EBE9E2]"
      data-testid="landing-persona-visual-individual"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#D27C65]/5 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-75" />

      <svg
        className={`absolute h-[120%] w-[120%] origin-center text-[#D27C65]/5 ${morphSpinClass}`}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.2,-2.3C97.6,13.4,92.4,29.4,82.8,42.4C73.2,55.4,59.2,65.4,44.2,71.8C29.2,78.2,13.2,81,-2.6,85.5C-18.4,90,-34.1,96.2,-47.9,91C-61.7,85.8,-73.6,69.2,-81.4,52.2C-89.2,35.2,-92.9,17.8,-92.3,0.8C-91.7,-16.2,-86.8,-32,-77.4,-44.6C-68,-57.2,-54.1,-66.6,-39.8,-73.4C-25.5,-80.2,-10.8,-84.4,3.2,-89.6C17.2,-94.8,30.6,-83.6,44.7,-76.4Z"
          transform="translate(100 100)"
        />
      </svg>

      <div
        className={`relative z-10 w-64 rounded-2xl border border-white/80 bg-white/60 p-5 shadow-xl shadow-black/5 backdrop-blur-xl transition-transform duration-700 group-hover:scale-105 ${floatSlowClass}`}
      >
        <div className="mb-5 flex items-center gap-4 border-b border-[#242825]/5 pb-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-[#D27C65] to-[#E28A71] p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-white/50 backdrop-blur-sm">
              <span className="font-serif text-lg font-bold text-[#1F3F32]">JD</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2 h-2.5 w-16 rounded-full bg-[#242825]/20" />
            <div className="h-1.5 w-10 rounded-full bg-[#242825]/10" />
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1F3F32] shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="h-1.5 w-16 rounded-full bg-[#242825]/20" />
              <div className="h-1.5 w-6 rounded-full bg-[#D27C65]/40" />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
              <div className="h-full w-[85%] rounded-full bg-[#D27C65]" />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="h-1.5 w-24 rounded-full bg-[#242825]/20" />
              <div className="h-1.5 w-6 rounded-full bg-[#9AB09E]/60" />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
              <div className="h-full w-[92%] rounded-full bg-[#9AB09E]" />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`absolute right-[10%] top-[15%] flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md ${floatSlowerClass}`}
        style={badgeDelay}
      >
        <CheckCircle2 className="h-3 w-3 text-[#1F3F32]" />
        <span className="font-sans text-[10px] font-semibold text-[#242825]">Verified</span>
      </div>

      <div
        className={`absolute bottom-[20%] left-[5%] flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md ${floatSlowClass}`}
        style={identityDelay}
      >
        <Shield className="h-3 w-3 text-[#D27C65]" />
        <span className="font-sans text-[10px] font-semibold text-[#242825]">Identity</span>
      </div>

      <div className="absolute left-[15%] top-[40%] h-2 w-2 animate-pulse rounded-full bg-[#D27C65] shadow-[0_0_10px_rgba(210,124,101,0.5)]" />
    </div>
  );
}
