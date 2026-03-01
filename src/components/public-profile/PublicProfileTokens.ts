export const PUBLIC_PROFILE_TOKENS = {
  forest: '#1C4D3A',
  terracotta: '#C76B4A',
  parchment: '#F7F6F1',
  stone: '#E8E6DD',
  charcoal: '#2D3330',
  muted: '#6B6760',
} as const;

export const PUBLIC_PROFILE_CLASSES = {
  page: 'bg-japandi-bg',
  sheet:
    'bg-white border border-proofound-stone rounded-2xl shadow-[0_16px_38px_rgba(45,51,48,0.08)]',
  module: 'rounded-xl border border-proofound-stone bg-[#FCFBF8]',
  sectionTitle: 'text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground',
  bodyText: 'text-sm text-foreground',
  mutedText: 'text-sm text-muted-foreground',
  chip: 'inline-flex items-center rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs text-foreground',
} as const;
