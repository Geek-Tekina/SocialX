// ─────────────────────────────────────────────────────────────────────────────
// SocialX Motion System — single source of truth for all animations
// WHY: Centralised variants = consistent timing, easy global tuning,
//      zero duplication across components.
// ─────────────────────────────────────────────────────────────────────────────

// ── Spring configs ────────────────────────────────────────────────────────────
export const springs = {
  snappy: { type: "spring", stiffness: 500, damping: 35 },
  smooth: { type: "spring", stiffness: 280, damping: 30 },
  bouncy: { type: "spring", stiffness: 380, damping: 22 },
};

// ── Page transition ───────────────────────────────────────────────────────────
// Slides up + fades. GPU-only (transform + opacity). No layout thrash.
export const pageVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0, y: -12,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

// ── Stagger list container ────────────────────────────────────────────────────
// WHY: Stagger creates anticipation — each item's entrance implies more are
//      coming. Users read the list as a narrative, not a data dump.
export const listVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

// ── List item ─────────────────────────────────────────────────────────────────
export const itemVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Card hover ────────────────────────────────────────────────────────────────
// WHY: Physical lift on hover creates depth perception. Users feel the card
//      is "pickable" — a tactile affordance that increases click confidence.
export const cardHover = {
  rest:  { y: 0,  transition: springs.smooth },
  hover: { y: -4, transition: springs.smooth },
};

// ── Fade in ───────────────────────────────────────────────────────────────────
export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// ── Scale pop (for chips, badges, counts) ────────────────────────────────────
export const scalePop = {
  hidden:  { scale: 0.7, opacity: 0 },
  visible: { scale: 1,   opacity: 1, transition: springs.bouncy },
};

// ── Slide in from bottom (modals, drawers, toasts) ───────────────────────────
export const slideUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0,  transition: springs.smooth },
  exit:    { opacity: 0, y: 16, transition: { duration: 0.18 } },
};
