export const PUBLIC_PROFILE_TOKENS = {
  forest: '#1C4D3A',
  terracotta: '#C76B4A',
  parchment: '#F7F6F1',
  stone: '#E8E6DD',
  charcoal: '#2D3330',
  muted: '#6B6760',
} as const;

export const PUBLIC_PROFILE_CLASSES = {
  page: 'bg-[#F7F6F1]',
  sheet: 'bg-white border border-[#E8E6DD] rounded-2xl shadow-[0_16px_38px_rgba(45,51,48,0.08)]',
  module: 'rounded-xl border border-[#E8E6DD] bg-[#FCFBF8]',
  sectionTitle: 'text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]',
  bodyText: 'text-sm text-[#2D3330]',
  mutedText: 'text-sm text-[#6B6760]',
  chip: 'inline-flex items-center rounded-full border border-[#D9D5CC] bg-[#F7F6F1] px-2.5 py-1 text-xs text-[#2D3330]',
} as const;
