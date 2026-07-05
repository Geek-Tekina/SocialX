import {
  Box, TextField, Button, Typography, Link, InputAdornment,
  IconButton, CircularProgress, LinearProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowForward, CheckCircle, DarkMode, LightMode } from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, googleAuth } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import UserAvatar, { AVATAR_OPTIONS } from "../components/UserAvatar";
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
    animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.11, 0.06] }}
    transition={{ duration: 10 + delay, repeat: Infinity, ease: "easeInOut", delay }}
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

const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#EF4444", "#F59E0B", "#22C55E", "#22C55E"];

const RegisterPage = () => {
  const { login } = useAuth();
  const { mode, toggleMode, theme } = useAppTheme();
  const AUTH = getAuthPalette(theme, mode);
  const inputSx = getInputSx(AUTH);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwValue, setPwValue] = useState("");
  const [avatar, setAvatar] = useState("nova");
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const pwStrength = getStrength(pwValue);

  const onSubmit = async (values) => {
    setServerError("");
    setLoading(true);
    try {
      const { data } = await registerUser({ ...values, avatar });
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        username: data.username || values.username,
        avatar: data.avatar || avatar,
      });
      toast.success("Welcome to SocialX!");
      navigate("/feed");
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed. Please try again.");
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
      toast.success("Welcome to SocialX!");
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
        <Orb auth={AUTH} size={300} style={{ bottom: "-10%", right: "-5%" }} delay={4} />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 340 }}
        >
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
              Join SocialX
            </Typography>
            <Typography sx={{ fontSize: 14, color: AUTH.textSec, mt: 1, lineHeight: 1.6 }}>
              Your creative space to share,<br />discover, and connect.
            </Typography>
          </Box>

          {[
            { label: "Free forever", sub: "No credit card required" },
            { label: "Secure & private", sub: "Your data stays yours" },
            { label: "Instant access", sub: "Start posting in seconds" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                <CheckCircle sx={{ fontSize: 16, color: AUTH.textPri, mt: 0.2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ color: AUTH.textPri, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ color: AUTH.textSec, fontSize: 12, mt: 0.25 }}>{item.sub}</Typography>
                </Box>
              </Box>
            </motion.div>
          ))}

          <Box sx={{ mt: 4, pt: 4, borderTop: `1px solid ${AUTH.border}` }}>
            <Typography sx={{ color: AUTH.textDis, fontSize: 12 }}>
              Already have an account?{" "}
              <Link component={RouterLink} to="/login"
                sx={{ color: AUTH.textPri, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                Sign in
              </Link>
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
        <Orb auth={AUTH} size={400} style={{ bottom: "-15%", right: "-10%" }} delay={2} />

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
            Create account
          </Typography>
          <Typography sx={{ fontSize: 14, color: AUTH.textSec, mb: 3.5 }}>
            Free forever. No credit card required.
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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <TextField
                {...register("username", {
                  required: "Username is required",
                  minLength: { value: 3, message: "At least 3 characters" },
                  maxLength: { value: 30, message: "Max 30 characters" },
                  pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Letters, numbers and underscores only" },
                })}
                label="Username"
                fullWidth
                error={!!errors.username}
                helperText={errors.username?.message}
                sx={{ ...inputSx, mb: 2 }}
                autoComplete="username"
                autoFocus
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
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
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <TextField
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                  onChange: (e) => setPwValue(e.target.value),
                })}
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ ...inputSx, mb: pwValue ? 1 : 3 }}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small" sx={{ color: AUTH.textPri }}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </motion.div>

            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ color: AUTH.textSec, fontSize: 12, fontWeight: 700, mb: 1 }}>
                Choose avatar
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1 }}>
                {AVATAR_OPTIONS.map((item) => (
                  <Box
                    key={item.id}
                    component="button"
                    type="button"
                    onClick={() => setAvatar(item.id)}
                    aria-label={`Select ${item.label} avatar`}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      border: avatar === item.id ? `2px solid ${AUTH.accent}` : `1px solid ${AUTH.border}`,
                      bgcolor: avatar === item.id ? `${AUTH.accent}22` : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 0,
                    }}
                  >
                    <UserAvatar avatar={item.id} username={item.label} sx={{ width: 30, height: 30 }} />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Password strength */}
            <AnimatePresence>
              {pwValue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden", marginBottom: 24 }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={(pwStrength / 4) * 100}
                    sx={{
                      height: 3, borderRadius: 4, mb: 0.75,
                      bgcolor: AUTH.border,
                      "& .MuiLinearProgress-bar": { bgcolor: strengthColor[pwStrength], borderRadius: 4 },
                    }}
                  />
                  <Typography sx={{ fontSize: 11, color: strengthColor[pwStrength], fontWeight: 600 }}>
                    {strengthLabel[pwStrength]}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
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
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </motion.div>
          </form>

          <Box sx={{ mt: 3, mb: 2 }}>
            <GoogleAuthButton
              action="signup"
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
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ color: AUTH.textPri, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default RegisterPage;
