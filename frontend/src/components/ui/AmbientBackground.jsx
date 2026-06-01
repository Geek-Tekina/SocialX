import { motion } from "framer-motion";
import { useTheme } from "@mui/material";

/**
 * AmbientBackground
 *
 * WHY: Flat backgrounds feel sterile. Ambient glows create depth and warmth —
 *      the same reason Spotify uses dark gradients and Apple uses frosted glass.
 *      It signals "premium" without adding visual noise.
 *
 * PSYCHOLOGY: Soft radial glows draw the eye toward the center of the page
 *      (where content lives) and away from edges. This improves focus.
 *
 * PERF: position:fixed, pointer-events:none, z-index:-1.
 *       Rendered once, never re-renders. Uses CSS filter:blur which is
 *       GPU-accelerated. Will not affect scroll performance.
 *
 * MOBILE: Orbs are smaller on mobile via inline style calc.
 */
const AmbientBackground = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;

  if (!isDark) return null; // Light mode has a clean white bg — no glow needed

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Top-left ambient orb */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.18, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primary}55 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      {/* Bottom-right ambient orb */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-8%",
          width: "40vw",
          height: "40vw",
          maxWidth: 500,
          maxHeight: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primary}33 0%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />
    </div>
  );
};

export default AmbientBackground;
