"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore, type ThemeMode } from "@/lib/theme-store";
import { Button } from "@/components/ui/button";

const ICONS: Record<ThemeMode, React.ReactNode> = {
  dark: <Moon className="h-4 w-4" />,
  light: <Sun className="h-4 w-4" />,
  amoled: <Monitor className="h-4 w-4" />
};

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { theme, cycleTheme } = useThemeStore();

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-[var(--muted)]" aria-label="Theme toggle placeholder">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={cycleTheme}
      variant="ghost"
      size="sm"
      className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)]"
      aria-label={`Current theme: ${theme}. Click to cycle.`}
    >
      {ICONS[theme]}
      <span className="hidden text-xs sm:inline">{theme === "dark" ? "Dark" : theme === "light" ? "Light" : "AMOLED"}</span>
    </Button>
  );
}
