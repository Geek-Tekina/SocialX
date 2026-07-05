import { motion } from "framer-motion";
import { useTheme } from "@mui/material";

const AmbientBackground = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!isDark) return null;

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
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
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
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
};

export default AmbientBackground;
