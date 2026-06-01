import { createTheme } from "@mui/material/styles";

const LIGHT = {
  bg:        "#F4F5F7",
  paper:     "#FFFFFF",
  textPri:   "#111827",
  textSec:   "#6B7280",
  divider:   "#E5E7EB",
  cardBorder:"#E5E7EB",
  cardShadow:"0 1px 4px rgba(0,0,0,0.06)",
};

const DARK = {
  bg:        "#0D0F14",
  paper:     "#161820",
  textPri:   "#F1F5F9",
  textSec:   "#94A3B8",
  divider:   "rgba(255,255,255,0.07)",
  cardBorder:"rgba(255,255,255,0.07)",
  cardShadow:"0 1px 6px rgba(0,0,0,0.4)",
};

const baseTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700 }, h2: { fontWeight: 700 }, h3: { fontWeight: 600 },
  h4: { fontWeight: 600 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
  body1: { fontSize: "0.9375rem" },
  button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
};

export const themes = {
  indigo: { label: "Indigo", mood: "Default",   primary: "#4F46E5", gradient: "135deg, #4F46E5 0%, #6366F1 100%" },
  blue:   { label: "Blue",   mood: "Calm",      primary: "#2563EB", gradient: "135deg, #2563EB 0%, #3B82F6 100%" },
  teal:   { label: "Teal",   mood: "Fresh",     primary: "#0D9488", gradient: "135deg, #0D9488 0%, #14B8A6 100%" },
  rose:   { label: "Rose",   mood: "Warm",      primary: "#E11D48", gradient: "135deg, #E11D48 0%, #F43F5E 100%" },
  amber:  { label: "Amber",  mood: "Energetic", primary: "#D97706", gradient: "135deg, #D97706 0%, #F59E0B 100%" },
  slate:  { label: "Slate",  mood: "Neutral",   primary: "#475569", gradient: "135deg, #475569 0%, #64748B 100%" },
};

export const buildTheme = (colorKey = "indigo", mode = "light") => {
  const color = themes[colorKey] || themes.indigo;
  const isDark = mode === "dark";
  const n = isDark ? DARK : LIGHT;

  const neutralBorder = isDark ? "rgba(255,255,255,0.12)" : "#D1D5DB";
  const neutralHover  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const inputBg       = isDark ? "#1C1F2B" : "#FFFFFF";

  return createTheme({
    palette: {
      mode,
      primary:    { main: color.primary, contrastText: "#ffffff" },
      secondary:  { main: color.primary },
      background: { default: n.bg, paper: n.paper },
      text:       { primary: n.textPri, secondary: n.textSec },
      divider:    n.divider,
      action:     { hover: neutralHover, selected: neutralHover },
      success: { main: "#059669" },
      error:   { main: "#DC2626" },
      warning: { main: "#D97706" },
      info:    { main: "#2563EB" },
    },
    typography: baseTypography,
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 7, padding: "7px 18px",
            boxShadow: "none", fontSize: "0.875rem",
            "&:hover": { boxShadow: "none" },
          },
          containedPrimary: {
            backgroundColor: color.primary,
            "&:hover": { backgroundColor: color.primary, filter: "brightness(1.1)", boxShadow: "none" },
          },
          outlined: {
            borderColor: neutralBorder, color: n.textPri,
            "&:hover": { borderColor: neutralBorder, backgroundColor: neutralHover, boxShadow: "none" },
          },
          outlinedPrimary: {
            borderColor: color.primary, color: color.primary,
            "&:hover": { borderColor: color.primary, backgroundColor: `${color.primary}0d` },
          },
          text: {
            color: n.textSec,
            "&:hover": { backgroundColor: neutralHover, color: n.textPri },
          },
          textPrimary: {
            color: color.primary,
            "&:hover": { backgroundColor: `${color.primary}0d` },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12, boxShadow: n.cardShadow,
            border: `1px solid ${n.cardBorder}`,
            backgroundColor: n.paper,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none", backgroundColor: n.paper },
        },
      },
      MuiAppBar: {
        styleOverrides: { root: { backgroundImage: "none" } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 7, backgroundColor: inputBg,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: neutralBorder },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.25)" : "#9CA3AF" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: color.primary, borderWidth: 1.5 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: n.textSec, "&.Mui-focused": { color: color.primary } },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 5,
            backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "#F3F4F6",
            color: n.textSec, border: "none",
          },
          colorPrimary: { backgroundColor: `${color.primary}18`, color: color.primary },
          outlinedPrimary: { borderColor: `${color.primary}44`, color: color.primary, backgroundColor: "transparent" },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: n.divider } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 7,
            "&:hover": { backgroundColor: neutralHover },
            "&.Mui-selected": {
              backgroundColor: `${color.primary}12`, color: color.primary,
              "&:hover": { backgroundColor: `${color.primary}1a` },
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { borderRadius: 5, "&:hover": { backgroundColor: neutralHover } },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            borderRadius: 7, color: n.textSec,
            "&.Mui-selected": {
              backgroundColor: color.primary, color: "#fff",
              "&:hover": { backgroundColor: color.primary, filter: "brightness(1.1)" },
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB" },
          bar: { backgroundColor: color.primary },
        },
      },
    },
    custom: { primary: color.primary, colorKey, mode },
  });
};

export default buildTheme("indigo", "light");
