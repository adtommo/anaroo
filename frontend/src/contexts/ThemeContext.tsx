import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeId, THEMES } from '@anaroo/shared';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const STORAGE_KEY = 'anaroo_theme';

function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some(t => t.id === stored)) {
      return stored as ThemeId;
    }
  } catch {
    // Ignore errors
  }
  return 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Theme CSS variables — single source of truth for all color vars
const THEME_VARS: Record<ThemeId, Record<string, string>> = {
  dark: {
    '--bg-color': '#323437',
    '--bg-secondary': '#2c2e31',
    '--bg-tertiary': '#3a3c3f',
    '--main-color': '#60A5FA',
    '--main-color-hover': '#93c5fd',
    '--sub-color': '#a7a7a7',
    '--sub-alt-color': '#2c2e31',
    '--text-color': '#ebebe8',
    '--error-color': '#ca4754',
    '--error-light': 'rgba(202, 71, 84, 0.15)',
    '--success-color': '#7ec850',
    '--warning-color': '#e2b714',
    '--focus-ring': '0 0 0 3px rgba(96, 165, 250, 0.4)',
    '--focus-ring-error': '0 0 0 3px rgba(202, 71, 84, 0.4)',
  },
  light: {
    '--bg-color': '#f5f5f5',
    '--bg-secondary': '#e8e8e8',
    '--bg-tertiary': '#d4d4d4',
    '--main-color': '#2563eb',
    '--main-color-hover': '#3b82f6',
    '--sub-color': '#666666',
    '--sub-alt-color': '#e0e0e0',
    '--text-color': '#1a1a1a',
    '--error-color': '#dc2626',
    '--error-light': 'rgba(220, 38, 38, 0.1)',
    '--success-color': '#16a34a',
    '--warning-color': '#ca8a04',
    '--focus-ring': '0 0 0 3px rgba(37, 99, 235, 0.4)',
    '--focus-ring-error': '0 0 0 3px rgba(220, 38, 38, 0.4)',
  },
  midnight: {
    '--bg-color': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-tertiary': '#334155',
    '--main-color': '#818cf8',
    '--main-color-hover': '#a5b4fc',
    '--sub-color': '#94a3b8',
    '--sub-alt-color': '#1e293b',
    '--text-color': '#e2e8f0',
    '--error-color': '#f87171',
    '--error-light': 'rgba(248, 113, 113, 0.15)',
    '--success-color': '#4ade80',
    '--warning-color': '#fbbf24',
    '--focus-ring': '0 0 0 3px rgba(129, 140, 248, 0.4)',
    '--focus-ring-error': '0 0 0 3px rgba(248, 113, 113, 0.4)',
  },
  forest: {
    '--bg-color': '#1a2f1a',
    '--bg-secondary': '#243524',
    '--bg-tertiary': '#2e4a2e',
    '--main-color': '#4ade80',
    '--main-color-hover': '#86efac',
    '--sub-color': '#86efac',
    '--sub-alt-color': '#243524',
    '--text-color': '#dcfce7',
    '--error-color': '#fca5a5',
    '--error-light': 'rgba(252, 165, 165, 0.15)',
    '--success-color': '#4ade80',
    '--warning-color': '#fbbf24',
    '--focus-ring': '0 0 0 3px rgba(74, 222, 128, 0.4)',
    '--focus-ring-error': '0 0 0 3px rgba(252, 165, 165, 0.4)',
  },
  sunset: {
    '--bg-color': '#1c1917',
    '--bg-secondary': '#292524',
    '--bg-tertiary': '#3d3835',
    '--main-color': '#fb923c',
    '--main-color-hover': '#fdba74',
    '--sub-color': '#a8a29e',
    '--sub-alt-color': '#292524',
    '--text-color': '#fafaf9',
    '--error-color': '#f87171',
    '--error-light': 'rgba(248, 113, 113, 0.15)',
    '--success-color': '#4ade80',
    '--warning-color': '#fbbf24',
    '--focus-ring': '0 0 0 3px rgba(251, 146, 60, 0.4)',
    '--focus-ring-error': '0 0 0 3px rgba(248, 113, 113, 0.4)',
  },
};

function applyTheme(themeId: ThemeId) {
  const vars = THEME_VARS[themeId];
  const root = document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Apply saved theme immediately at module load to avoid flash of unstyled content
const initialTheme = loadTheme();
applyTheme(initialTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeId) => {
    if (THEMES.some(t => t.id === newTheme)) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
