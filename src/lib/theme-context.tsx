"use client";
import { createContext, useContext, useEffect, useState } from "react";
export type Theme = "system" | "light" | "dark";
const ThemeContext = createContext({
  darkMode: false,
  theme: "system" as Theme,
  setTheme: (value: Theme) => {
    void value;
  },
  setDarkMode: (value: boolean) => {
    void value;
  },
  toggle: () => {},
});
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);
  const [darkMode, setDark] = useState(false);
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("kinsous-theme") ||
        (localStorage.getItem("kinsous-dark") === "1"
          ? "dark"
          : localStorage.getItem("kinsous-dark") === "0"
            ? "light"
            : "system");
      updateTheme(
        ["light", "dark"].includes(saved) ? (saved as Theme) : "system",
      );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      setDark(dark);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, ready]);
  const setTheme = (value: Theme) => {
    updateTheme(value);
    try {
      localStorage.setItem("kinsous-theme", value);
    } catch {}
  };
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        darkMode,
        setDarkMode: (v) => setTheme(v ? "dark" : "light"),
        toggle: () => setTheme(darkMode ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
