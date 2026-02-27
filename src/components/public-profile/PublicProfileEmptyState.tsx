import Link from 'next/link';

type PublicProfileEmptyAction = {
  label: string;
  href: string;
};

type PublicProfileEmptyStateProps = {
  message: string;
  actions?: PublicProfileEmptyAction[];
  example?: string;
};

export function PublicProfileEmptyState({
  message,
  actions = [],
  example,
}: PublicProfileEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[#D9D5CC] bg-[#F7F6F1] px-3 py-3.5 text-sm text-[#6B6760]">
      <p>{message}</p>
      {actions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              className="rounded-full border border-[#D9D5CC] bg-white px-3 py-1 text-xs font-medium text-[#2D3330] hover:border-[#1C4D3A]/45 hover:text-[#1C4D3A]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
      {example ? <p className="mt-2 text-xs text-[#827E76]">Example: {example}</p> : null}
    </div>
  );
}
