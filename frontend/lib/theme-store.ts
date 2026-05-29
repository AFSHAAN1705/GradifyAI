import { create } from "zustand";

export type ThemeMode = "dark" | "light" | "amoled";

const STORAGE_KEY = "gradifyai-theme";
let _initialized = false;

type ThemeStore = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
};

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

function persistTheme(theme: ThemeMode) {
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* noop */ }
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "dark",
  setTheme: (theme) => {
    applyTheme(theme);
    persistTheme(theme);
    set({ theme });
  },
  cycleTheme: () => {
    set((state) => {
      const next = state.theme === "dark" ? "light" : state.theme === "light" ? "amoled" : "dark";
      applyTheme(next);
      persistTheme(next);
      return { theme: next };
    });
  }
}));

// Initialize on client only — runs once after module load
if (typeof window !== "undefined" && !_initialized) {
  _initialized = true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "amoled") {
    applyTheme(stored);
    useThemeStore.setState({ theme: stored });
  } else {
    applyTheme("dark");
  }
}
