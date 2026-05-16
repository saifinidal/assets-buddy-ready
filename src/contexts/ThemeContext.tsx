import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const isBrowser = typeof window !== "undefined";

const getStoredBoolean = (key: string, fallback: boolean) => {
  if (!isBrowser) return fallback;
  const stored = window.localStorage.getItem(key);
  return stored !== null ? stored === "true" : fallback;
};

const getStoredTheme = (): "light" | "dark" => {
  if (!isBrowser) return "light";
  const stored = window.localStorage.getItem("theme");
  return stored === "dark" || stored === "light" ? stored : "light";
};

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  adminDarkModeEnabled: boolean;
  setAdminDarkModeEnabled: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  adminDarkModeEnabled: true,
  setAdminDarkModeEnabled: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [adminDarkModeEnabled, setAdminDarkModeEnabled] = useState(() => getStoredBoolean("admin-dark-mode-enabled", true));

  const [theme, setTheme] = useState<"light" | "dark">(() => getStoredTheme());

  useEffect(() => {
    if (!isBrowser) return;

    const root = document.documentElement;
    const isDark = theme === "dark" && adminDarkModeEnabled;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem("theme", theme);

    // Sync favicon + theme-color with active theme (overrides OS preference)
    const faviconHref = isDark ? "/favicon-dark.png" : "/favicon-light.png";
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link) => {
      link.removeAttribute("media");
      link.href = faviconHref;
    });
    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = isDark ? "#0a0a0a" : "#fdf6e3";
  }, [theme, adminDarkModeEnabled]);

  useEffect(() => {
    if (!isBrowser) return;

    window.localStorage.setItem("admin-dark-mode-enabled", String(adminDarkModeEnabled));
    // If admin disables dark mode, force light
    if (!adminDarkModeEnabled) {
      document.documentElement.classList.remove("dark");
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, [adminDarkModeEnabled, theme]);

  const toggleTheme = () => {
    if (!adminDarkModeEnabled) return;
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme: adminDarkModeEnabled ? theme : "light", toggleTheme, adminDarkModeEnabled, setAdminDarkModeEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
