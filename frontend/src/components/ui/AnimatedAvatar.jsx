import { motion } from "framer-motion";
import { Avatar, Box } from "@mui/material";
import { springs } from "../../motion/variants";

/**
 * AnimatedAvatar
 *
 * WHY: Avatars are identity anchors — the most human element in any social UI.
 *      Making them spring-scale on hover creates a "human-aware" feel.
 *      The pulse ring signals presence/activity without text.
 *
 * PSYCHOLOGY: Users form emotional connections with responsive avatars.
 *      Instagram, Discord, and Slack all use avatar animations to signal
 *      "this is a real person" — not a data record.
 *
 * PERF: transform-only animation. The pulse ring uses opacity + scale,
 *       both GPU-composited.
 *
 * @param {boolean} pulse - Show animated presence ring
 * @param {string}  ringColor - CSS color for the pulse ring
 */
const AnimatedAvatar = ({ children, pulse = false, ringColor, sx = {}, ...props }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.93 }}
    transition={springs.snappy}
    style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
  >
    {pulse && (
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: `2px solid ${ringColor || "currentColor"}`,
          pointerEvents: "none",
        }}
      />
    )}
    <Avatar sx={sx} {...props}>{children}</Avatar>
  </motion.div>
);

export default AnimatedAvatar;
