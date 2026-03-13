import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DARK, LIGHT, ColorScheme } from "../lib/theme";

interface ThemeCtx {
  scheme: "dark" | "light";
  colors: ColorScheme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  scheme: "dark",
  colors: DARK,
  toggle: () => {},
});

const KEY = "ft_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === "light" || v === "dark") setScheme(v);
    });
  }, []);

  const toggle = async () => {
    const next = scheme === "dark" ? "light" : "dark";
    setScheme(next);
    await AsyncStorage.setItem(KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ scheme, colors: scheme === "dark" ? DARK : LIGHT, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
