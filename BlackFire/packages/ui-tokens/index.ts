// Umlilo design tokens — shared between web (Tailwind) and mobile (StyleSheet)

export const colors = {
  // Dark palette
  coal:        '#0A0E19',
  navy:        '#141B26',
  charcoal:    '#1E2530',
  steelDark:   '#2B3340',
  ash:         '#7A8699',
  emberRed:    '#C0392B',
  fireOrange:  '#E05A1A',
  emberAmber:  '#F07820',
  flameGold:   '#F5A623',
  // Light palette
  bonePaper:   '#F5F1EA',
  inkText:     '#1A1814',
  // Status
  success:     '#27AE60',
  warning:     '#F39C12',
  danger:      '#E74C3C',
  info:        '#2980B9',
  // Compliance bands
  complianceRed:    '#C0392B',
  complianceOrange: '#E05A1A',
  complianceYellow: '#F5A623',
  complianceGreen:  '#27AE60',
} as const

export const fonts = {
  display: 'Big Shoulders Display',
  body:    'Instrument Sans',
  mono:    'IBM Plex Mono',
  serif:   'Instrument Serif',
} as const

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const

// Tailwind-compatible token map (used in tailwind.config.ts)
export const tailwindTokens = {
  colors: {
    coal:          colors.coal,
    navy:          colors.navy,
    charcoal:      colors.charcoal,
    'steel-dark':  colors.steelDark,
    ash:           colors.ash,
    'ember-red':   colors.emberRed,
    'fire-orange': colors.fireOrange,
    'ember-amber': colors.emberAmber,
    'flame-gold':  colors.flameGold,
    'bone-paper':  colors.bonePaper,
    'ink-text':    colors.inkText,
    success:       colors.success,
    warning:       colors.warning,
    danger:        colors.danger,
    info:          colors.info,
  },
  fontFamily: {
    display: [fonts.display, 'sans-serif'],
    body:    [fonts.body, 'sans-serif'],
    mono:    [fonts.mono, 'monospace'],
    serif:   [fonts.serif, 'serif'],
  },
} as const
