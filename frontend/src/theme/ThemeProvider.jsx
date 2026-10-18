import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "portfolio_theme";
const ThemeContext = createContext(null);

// index.html already sets data-theme before React loads (no flash), so start from that.
function initialTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
