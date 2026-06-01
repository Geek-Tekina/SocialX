import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { pageVariants } from "../../motion/variants";

/**
 * PageTransition
 *
 * WHY: Route changes without transitions feel like teleportation — jarring,
 *      disorienting. A 380ms slide-up tells the user "you moved somewhere new"
 *      without making them wait. It also masks any data-fetch latency.
 *
 * PERF: Only animates `opacity` and `transform` — both GPU-composited.
 *       Zero layout recalculation. Will not cause jank even on low-end devices.
 *
 * ACCESSIBILITY: Respects `prefers-reduced-motion` via Framer's global
 *       `MotionConfig reducedMotion="user"` (set in App.jsx).
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ width: "100%", willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
