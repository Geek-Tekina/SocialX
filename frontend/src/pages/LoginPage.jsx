import {
  Box, TextField, Button, Typography, Link, InputAdornment,
  IconButton, CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowForward, DarkMode, LightMode } from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser, googleAuth } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import toast from "react-hot-toast";

const getAuthPalette = (theme, mode) => {
  const isDark = mode === "dark";
  return {
    panelBg: isDark ? "#050507" : "#F7F8FA",
    formBg: isDark ? "#090A0D" : "#FFFFFF",
    cardBg: isDark ? "#111215" : "#F9FAFB",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.1)",
    accent: theme.palette.primary.main,
    accentHov: theme.palette.primary.dark || theme.palette.primary.main,
    textPri: isDark ? "#F0F2F5" : "#111827",
    textSec: isDark ? "#C7CFDB" : "#6B7280",
    textDis: isDark ? "#A9B4C0" : "#9CA3AF",
    error: "#EF4444",
  };
};

const Orb = ({ size, style, delay, auth }) => (
  <motion.div
    animate={{ scale: [1, 1.12, 1], opacity: [0.06, 0.12, 0.06] }}
    transition={{ duration: 9 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    style={{
      position: "absolute", width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle, ${auth.accent}55 0%, transparent 70%)`,
      filter: "blur(40px)", pointerEvents: "none", ...style,
    }}
  />
);

const getInputSx = (auth) => ({
  "& .MuiOutlinedInput-root": {
    bgcolor: auth.cardBg,
    borderRadius: "8px",
    color: auth.textPri,
    "& fieldset": { borderColor: auth.border },
    "&:hover fieldset": { borderColor: auth.border },
    "&.Mui-focused fieldset": { borderColor: auth.accent, borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: auth.textSec },
  "& .MuiInputLabel-root.Mui-focused": { color: auth.accent },
  "& .MuiFormHelperText-root": { color: auth.error },
});

const LoginPage = () => {
  const { login } = useAuth();
  const { mode, toggleMode, theme } = useAppTheme();
  const AUTH = getAuthPalette(theme, mode);
  const inputSx = getInputSx(AUTH);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (values) => {
    setServerError("");
    setLoading(true);
    try {
      const { data } = await loginUser(values);
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        username: data.username,
        avatar: data.avatar,
      });
      toast.success("Welcome back!");
      navigate("/feed");
    } catch (err) {
      setServerError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (credential) => {
    if (googleLoading) return;
    setServerError("");
    setGoogleLoading(true);
    try {
      const { data } = await googleAuth(credential);
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        username: data.username,
        avatar: data.avatar,
        profileImageUrl: data.profileImageUrl,
      });
      toast.success("Welcome back!");
      navigate("/feed");
    } catch (err) {
      setServerError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: AUTH.formBg, overflow: "hidden" }}>

      {/* ── Left panel ── */}
      <Box sx={{
        display: { xs: "none", md: "flex" },
        flex: "0 0 44%",
        bgcolor: AUTH.panelBg,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 7,
        position: "relative",
        overflow: "hidden",
        borderRight: `1px solid ${AUTH.border}`,
      }}>
        <Orb auth={AUTH} size={500} style={{ top: "-15%", left: "-15%" }} delay={0} />
        <Orb auth={AUTH} size={350} style={{ bottom: "-10%", right: "-10%" }} delay={3} />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 340 }}
        >
          {/* Logo mark */}
          <Box sx={{ mb: 5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "12px",
              bgcolor: AUTH.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              mb: 3,
              boxShadow: `0 8px 24px ${AUTH.accent}44`,
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 20, lineHeight: 1 }}>S</Typography>
            </Box>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: AUTH.textPri, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              SocialX
            </Typography>
            <Typography sx={{ fontSize: 14, color: AUTH.textSec, mt: 1, lineHeight: 1.6 }}>
              Share your world. Connect with people.<br />Build your story.
            </Typography>
          </Box>

          {/* Feature list */}
          {[
            { icon: "→", text: "Create and share posts with media" },
            { icon: "→", text: "Search across the community" },
            { icon: "→", text: "Manage your content in one place" },
          ].map((f, i) => (
            <motion.div
              key={f.text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.75 }}>
                <Typography sx={{ color: AUTH.textPri, fontWeight: 700, fontSize: 14, mt: 0.1 }}>{f.icon}</Typography>
                <Typography sx={{ color: AUTH.textSec, fontSize: 14, lineHeight: 1.5 }}>{f.text}</Typography>
              </Box>
            </motion.div>
          ))}

          {/* Bottom quote */}
          <Box sx={{ mt: 5, pt: 4, borderTop: `1px solid ${AUTH.border}` }}>
            <Typography sx={{ color: AUTH.textDis, fontSize: 12, lineHeight: 1.6 }}>
              &ldquo;The best social experience is one that feels effortless.&rdquo;
            </Typography>
          </Box>
        </motion.div>
      </Box>

      {/* ── Right panel — form ── */}
      <Box sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, sm: 5 },
        position: "relative",
        overflow: "hidden",
        bgcolor: AUTH.formBg,
      }}>
        <Orb auth={AUTH} size={400} style={{ top: "-20%", right: "-10%" }} delay={1.5} />

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1.25, mb: 4 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: AUTH.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>S</Typography>
            </Box>
            <Typography sx={{ color: AUTH.textPri, fontWeight: 800, fontSize: 18 }}>SocialX</Typography>
          </Box>

          <Typography sx={{ fontSize: 24, fontWeight: 800, color: AUTH.textPri, letterSpacing: "-0.4px", mb: 0.75 }}>
            Sign in
          </Typography>
          <Typography sx={{ fontSize: 14, color: AUTH.textSec, mb: 3.5 }}>
            Welcome back. Enter your credentials to continue.
          </Typography>
          <IconButton
            onClick={toggleMode}
            size="small"
            sx={{ position: "absolute", top: 0, right: 0, color: AUTH.textPri, border: `1px solid ${AUTH.border}` }}
          >
            {mode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>

          <AnimatePresence>
            {serverError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Box sx={{
                  p: 1.5, mb: 2.5, borderRadius: "8px",
                  bgcolor: `${AUTH.error}14`,
                  border: `1px solid ${AUTH.error}33`,
                }}>
                  <Typography sx={{ color: AUTH.error, fontSize: 13 }}>{serverError}</Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <TextField
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                })}
                label="Email address"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ ...inputSx, mb: 2 }}
                autoComplete="email"
                autoFocus
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <TextField
                {...register("password", { required: "Password is required" })}
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ ...inputSx, mb: 3 }}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end" size="small"
                        sx={{ color: AUTH.textPri }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
            >
              <Button
                type="submit"
                fullWidth
                size="large"
                disabled={loading}
                endIcon={loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <ArrowForward />}
                sx={{
                  bgcolor: AUTH.accent,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  py: 1.4,
                  borderRadius: "8px",
                  textTransform: "none",
                  boxShadow: `0 4px 20px ${AUTH.accent}44`,
                  "&:hover": { bgcolor: AUTH.accentHov, boxShadow: `0 6px 28px ${AUTH.accent}55` },
                  "&:disabled": { bgcolor: AUTH.accent, opacity: 0.6, color: "#fff" },
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </motion.div>
          </form>

          <Box sx={{ my: 3 }}>
            <GoogleAuthButton
              action="signin"
              onCredential={handleGoogleSignIn}
              onError={() => setServerError("Google sign-in failed. Please try again.")}
            />
            {googleLoading && (
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: AUTH.textSec }}>
                Completing Google sign-in...
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography sx={{ fontSize: 13, color: AUTH.textSec }}>
              Don&apos;t have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ color: AUTH.textPri, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Create one free
              </Link>
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LoginPage;
