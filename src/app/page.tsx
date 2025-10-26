import dynamic from 'next/dynamic';

const FigmaExperience = dynamic(() => import('@/components/landing/FigmaExperience'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4A5943]/30 border-t-[#4A5943]" />
      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
        Preparing Figma experience…
      </p>
    </div>
  ),
});

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <FigmaExperience />
    </main>
  );
}
