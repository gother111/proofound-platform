// L1 Domain colors (matching L1Grid)
export const DOMAIN_COLORS: Record<
  number,
  { bg: string; border: string; text: string; icon: string }
> = {
  1: { bg: 'bg-[#EEF1EA]', border: 'border-[#7A9278]', text: 'text-[#1C4D3A]', icon: '🌍' }, // U - Universal
  2: { bg: 'bg-[#FFF4E6]', border: 'border-[#D4A574]', text: 'text-[#8B6F47]', icon: '⚙️' }, // F - Functional
  3: { bg: 'bg-[#E8F3F8]', border: 'border-[#6B9AB8]', text: 'text-[#3E5C73]', icon: '🔧' }, // T - Tools
  4: { bg: 'bg-[#F5EEF8]', border: 'border-[#9B7BA8]', text: 'text-[#6B4C7A]', icon: '🗣️' }, // L - Languages
  5: { bg: 'bg-[#FFF0F0]', border: 'border-[#C76B4A]', text: 'text-[#8B4A36]', icon: '📋' }, // M - Methods
  6: { bg: 'bg-[#F0F8F0]', border: 'border-[#6B9B6B]', text: 'text-[#3E5C3E]', icon: '🎯' }, // D - Domain
};

export const LEVEL_LABELS = [
  { value: 1, label: 'Novice', description: 'Learning the basics' },
  { value: 2, label: 'Competent', description: 'Can work independently' },
  { value: 3, label: 'Proficient', description: 'Experienced practitioner' },
  { value: 4, label: 'Advanced', description: 'Deep expertise' },
  { value: 5, label: 'Expert', description: 'Recognized authority' },
] as const;

// Map cat_id to L1 code (U/F/T/L/M/D)
export const L1_CODE_MAP: Record<number, string> = {
  1: 'U', // Universal
  2: 'F', // Functional
  3: 'T', // Tools
  4: 'L', // Languages
  5: 'M', // Methods
  6: 'D', // Domain
};
