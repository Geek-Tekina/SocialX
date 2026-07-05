import { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { buildTheme } from "../theme/theme";

const ThemeContext = createContext(null);

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(
    () => {
      localStorage.removeItem("themeColor");
      return localStorage.getItem("themeMode") || "light";
    }
  );

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const toggleMode = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("themeMode", next);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, theme }}>
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
