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

  // Initialise from localStorage on mount
  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("kinsous-dark")
      : null;
    if (stored === "1") {
      setDarkModeState(true);
      document.documentElement.classList.add("dark");
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
