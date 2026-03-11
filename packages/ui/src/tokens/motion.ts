/** Duration constants (seconds) for Framer Motion */
export const DURATION = {
  fast: 0.1,
  normal: 0.15,
  slow: 0.2,
  slower: 0.3,
} as const;

/** Easing presets for Framer Motion */
export const EASE = {
  out: 'easeOut' as const,
  in: 'easeIn' as const,
  smooth: [0.16, 1, 0.3, 1] as const,
};

/** Common animation variants for Framer Motion */
export const VARIANTS = {
  /** Dialog: scale(0.96→1) + fade */
  dialog: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: DURATION.slow, ease: EASE.smooth } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: DURATION.normal, ease: EASE.in } },
  },
  /** Page transition: fade + slide up */
  page: {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE.out } },
    exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
  },
  /** Command palette: slide down + fade */
  commandPalette: {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE.out } },
    exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
  },
  /** Stagger children container */
  staggerContainer: {
    visible: { transition: { staggerChildren: 0.03 } },
  },
  /** Stagger child item */
  staggerItem: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: DURATION.normal } },
  },
} as const;
