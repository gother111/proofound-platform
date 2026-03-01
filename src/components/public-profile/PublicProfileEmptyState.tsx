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
    <div className="rounded-lg border border-dashed border-[#D9D5CC] bg-japandi-bg px-3 py-3.5 text-sm text-muted-foreground">
      <p>{message}</p>
      {actions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              className="rounded-full border border-[#D9D5CC] bg-white px-3 py-1 text-xs font-medium text-foreground hover:border-proofound-forest/45 hover:text-proofound-forest"
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
