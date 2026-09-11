import { motion } from "framer-motion";
import { useTheme } from "@mui/material";

const AmbientBackground = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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
      {isDark ? (
        // Dark Mode: Soft white glowing orbs
        <>
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
              background:
                "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.14, 0.08] }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
            style={{
              position: "absolute",
              bottom: "-10%",
              right: "-8%",
              width: "40vw",
              height: "40vw",
              maxWidth: 500,
              maxHeight: 500,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
        </>
      ) : (
        // Light Mode: Prominent colored gradient orbs with smooth animations
        <>
          {/* Top-left: Vibrant Blue accent */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: "-25%",
              left: "-15%",
              width: "55vw",
              height: "55vw",
              maxWidth: 650,
              maxHeight: 650,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.08) 40%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          {/* Bottom-right: Vibrant Purple accent */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.16, 0.26, 0.16] }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            style={{
              position: "absolute",
              bottom: "-20%",
              right: "-15%",
              width: "60vw",
              height: "60vw",
              maxWidth: 700,
              maxHeight: 700,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 70%)",
              filter: "blur(65px)",
            }}
          />
          {/* Top-right: Cyan accent */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.18, 0.1] }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
            style={{
              position: "absolute",
              top: "5%",
              right: "-10%",
              width: "45vw",
              height: "45vw",
              maxWidth: 550,
              maxHeight: 550,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.04) 40%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
          {/* Center-left: Green accent */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.14, 0.08] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
            style={{
              position: "absolute",
              top: "40%",
              left: "-8%",
              width: "40vw",
              height: "40vw",
              maxWidth: 500,
              maxHeight: 500,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.03) 40%, transparent 70%)",
              filter: "blur(55px)",
            }}
          />
          {/* Center: Pink/Rose accent */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.12, 0.06] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
            style={{
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "50vw",
              height: "50vw",
              maxWidth: 600,
              maxHeight: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.02) 40%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </>
      )}
    </div>
  );
};

export default AmbientBackground;
