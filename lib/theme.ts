export const colors = {
  bg: '#0f172a',
  bgElevated: '#1e293b',
  border: '#334155',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#dc2626',
  primaryPressed: '#b91c1c',
  accent: '#f59e0b',
  success: '#22c55e',
  danger: '#ef4444',
  inputBg: '#1e293b',
  // Dartball board colors (for later use)
  board: {
    white: '#f8fafc',
    red: '#dc2626',
    brown: '#78350f',
    grey: '#64748b',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 32, fontWeight: '800' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
} as const;
