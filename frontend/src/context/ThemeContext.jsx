import { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { buildTheme } from "../theme/theme";

const ThemeContext = createContext(null);

export const AppThemeProvider = ({ children }) => {
  const [colorKey, setColorKey] = useState(
    () => {
      const saved = localStorage.getItem("themeColor");
      // migrate old keys that no longer exist
      const valid = ["indigo", "blue", "teal", "rose", "amber", "slate"];
      return valid.includes(saved) ? saved : "indigo";
    }
  );
  const [mode, setMode] = useState(
    () => localStorage.getItem("themeMode") || "light"
  );

  const theme = useMemo(() => buildTheme(colorKey, mode), [colorKey, mode]);

  const setColor = (key) => {
    setColorKey(key);
    localStorage.setItem("themeColor", key);
  };

  const toggleMode = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("themeMode", next);
  };

  return (
    <ThemeContext.Provider value={{ colorKey, mode, setColor, toggleMode, theme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within AppThemeProvider");
  return ctx;
};
