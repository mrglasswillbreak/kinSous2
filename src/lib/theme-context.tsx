"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextValue {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  darkMode: false,
  setDarkMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);

  // Initialise from localStorage on mount, then inject a blocking script
  // so the <html> class is set before paint (avoids flash).
  useEffect(() => {
    const stored = localStorage.getItem("kinsous-dark");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "1" || (stored === null && prefersDark);
    if (isDark) {
      setDarkModeState(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    if (v) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kinsous-dark", "1");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kinsous-dark", "0");
    }
  };

  const toggle = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

