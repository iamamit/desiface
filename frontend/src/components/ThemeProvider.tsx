"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type AccentTheme = "blue" | "heritage";

interface AccentContextValue {
  accent: AccentTheme;
  setAccent: (theme: AccentTheme) => void;
}

const AccentContext = createContext<AccentContextValue>({
  accent: "blue",
  setAccent: () => {},
});

export function useAccentTheme() {
  return useContext(AccentContext);
}

function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentTheme>("blue");

  useEffect(() => {
    const saved = (localStorage.getItem("accent-theme") as AccentTheme) ?? "blue";
    setAccentState(saved);
    document.documentElement.setAttribute("data-accent", saved);
  }, []);

  const setAccent = useCallback((theme: AccentTheme) => {
    localStorage.setItem("accent-theme", theme);
    document.documentElement.setAttribute("data-accent", theme);
    setAccentState(theme);
  }, []);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <AccentProvider>{children}</AccentProvider>
    </NextThemesProvider>
  );
}
