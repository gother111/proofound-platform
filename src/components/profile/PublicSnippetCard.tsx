import type { PublicSnippetPayload } from '@/lib/profile/public-snippet-resolver';

type RenderFormat = 'mini' | 'card' | 'full';

type PublicSnippetCardProps = {
  snippet: PublicSnippetPayload;
  format?: RenderFormat;
  compact?: boolean;
};

const THEME_CLASS_MAP: Record<PublicSnippetPayload['theme'], string> = {
  light: 'bg-white text-slate-900 border border-slate-200',
  dark: 'bg-slate-900 text-slate-100 border border-slate-800',
  auto: 'bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800',
};

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function getInitial(name?: string) {
  if (!name) {
    return 'P';
  }

  return name.charAt(0).toUpperCase();
}

function renderBadgeList(items: string[]) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function PublicSnippetCard({ snippet, format, compact = false }: PublicSnippetCardProps) {
  const renderFormat = format || snippet.format;
  const profile = snippet.profile;
  const name = profile.name || 'Proofound member';

  return (
    <article
      className={joinClasses(
        'w-full rounded-2xl shadow-sm',
        THEME_CLASS_MAP[snippet.theme],
        compact ? 'p-4' : 'p-6'
      )}
    >
      <header className="flex items-center gap-3">
        {profile.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- public snippet avatars can come from arbitrary remote domains.
          <img
            src={profile.profileImage}
            alt={profile.name ? `${profile.name} profile image` : 'Profile image'}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
            {getInitial(profile.name)}
          </div>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{name}</h1>
          {profile.headline && (
            <p className="truncate text-sm text-slate-600 dark:text-slate-300">
              {profile.headline}
            </p>
          )}
          {profile.location && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{profile.location}</p>
          )}
        </div>
      </header>

      {renderFormat !== 'mini' && (
        <div className="mt-4 space-y-4">
          {profile.bio && (
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{profile.bio}</p>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Skills
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                  >
                    {skill.name}
                    {typeof skill.level === 'number' ? ` · L${skill.level}` : ''}
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile.values && profile.values.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Values
              </h2>
              {renderBadgeList(
                profile.values.map((value) =>
                  value.icon && value.icon.trim().length > 0
                    ? `${value.icon.trim()} ${value.label}`
                    : value.label
                )
              )}
            </section>
          )}

          {profile.causes && profile.causes.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Causes
              </h2>
              {renderBadgeList(profile.causes)}
            </section>
          )}

          {renderFormat === 'full' && profile.experience && profile.experience.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Experience
              </h2>
              <div className="mt-2 space-y-3">
                {profile.experience.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.orgDescription}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.duration}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {renderFormat === 'full' && profile.education && profile.education.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Education
              </h2>
              <div className="mt-2 space-y-3">
                {profile.education.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <p className="text-sm font-medium">{item.institution}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.degree}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.duration}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
