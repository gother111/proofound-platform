import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VerifySkillContent } from './VerifySkillContent';

export const dynamic = 'force-dynamic';

export default function VerifySkillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7A9278]" />
        </div>
      }
    >
      <VerifySkillContent />
    </Suspense>
  );
}
