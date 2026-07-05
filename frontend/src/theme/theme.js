import { createTheme } from "@mui/material/styles";

const LIGHT = {
  bg: "#F4F5F7",
  paper: "#FFFFFF",
  textPri: "#111827",
  textSec: "#6B7280",
  divider: "#E5E7EB",
  cardBorder: "#E5E7EB",
  cardShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const DARK = {
  bg: "#0D0F14",
  paper: "#161820",
  textPri: "#F1F5F9",
  textSec: "#C7CFDB",
  divider: "rgba(255,255,255,0.07)",
  cardBorder: "rgba(255,255,255,0.07)",
  cardShadow: "0 1px 6px rgba(0,0,0,0.4)",
};

const baseTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 600 },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  body1: { fontSize: "0.9375rem" },
  button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
};

export const buildTheme = (mode = "light") => {
  const isDark = mode === "dark";
  const n = isDark ? DARK : LIGHT;
  const primaryMain = isDark ? "#1F232B" : "#111111";
  const primaryHover = isDark ? "#2C313A" : "#000000";

  const neutralBorder = isDark ? "rgba(255,255,255,0.12)" : "#D1D5DB";
  const neutralHover = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const inputBg = isDark ? "#1C1F2B" : "#FFFFFF";
  const chipFill = isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6";
  const selectedFill = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        dark: primaryHover,
        contrastText: "#ffffff",
      },
      secondary: { main: primaryMain },
      background: { default: n.bg, paper: n.paper },
      text: { primary: n.textPri, secondary: n.textSec },
      divider: n.divider,
      action: { hover: neutralHover, selected: neutralHover },
      success: { main: "#059669" },
      error: { main: "#DC2626" },
      warning: { main: "#D97706" },
      info: { main: "#2563EB" },
    },
    typography: baseTypography,
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 7,
            padding: "7px 18px",
            boxShadow: "none",
            fontSize: "0.875rem",
            "&:hover": { boxShadow: "none" },
          },
          containedPrimary: {
            backgroundColor: primaryMain,
            color: "#ffffff",
            "&:hover": {
              backgroundColor: primaryHover,
              filter: "brightness(1.06)",
              boxShadow: "none",
            },
          },
          outlined: {
            borderColor: neutralBorder,
            color: n.textPri,
            "&:hover": {
              borderColor: neutralBorder,
              backgroundColor: neutralHover,
              boxShadow: "none",
            },
          },
          outlinedPrimary: {
            borderColor: primaryMain,
            color: primaryMain,
            "&:hover": {
              borderColor: primaryHover,
              backgroundColor: neutralHover,
            },
          },
          text: {
            color: n.textSec,
            "&:hover": { backgroundColor: neutralHover, color: n.textPri },
          },
          textPrimary: {
            color: primaryMain,
            "&:hover": { backgroundColor: neutralHover },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: n.cardShadow,
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
            borderRadius: 7,
            backgroundColor: inputBg,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: neutralBorder },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255,255,255,0.25)" : "#9CA3AF",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: primaryMain,
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: n.textSec, "&.Mui-focused": { color: primaryMain } },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 5,
            backgroundColor: chipFill,
            color: n.textSec,
            border: "none",
          },
          colorPrimary: { backgroundColor: selectedFill, color: primaryMain },
          outlinedPrimary: {
            borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.22)",
            color: primaryMain,
            backgroundColor: "transparent",
          },
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
              backgroundColor: selectedFill,
              color: primaryMain,
              "&:hover": { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
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
            borderRadius: 7,
            color: n.textSec,
            "&.Mui-selected": {
              backgroundColor: primaryMain,
              color: "#ffffff",
              "&:hover": { backgroundColor: primaryHover, filter: "brightness(0.98)" },
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB" },
          bar: { backgroundColor: primaryMain },
        },
      },
    },
    custom: { primary: primaryMain, mode },
  });
};

export default buildTheme("light");
