import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameSettings {
  language: Language;
  difficulty: Difficulty;
  soundEnabled: boolean;
}

interface GameSettingsContextType {
  settings: GameSettings;
  setLanguage: (lang: Language) => void;
  setDifficulty: (diff: Difficulty) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'anaroo_game_settings';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'fr', 'de'];

function detectBrowserLanguage(): Language {
  // Get browser language (e.g., 'en-US', 'es', 'fr-FR')
  const browserLang = navigator.language?.split('-')[0]?.toLowerCase();

  // Check if it's a supported language
  if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  // Fallback to English
  return 'en';
}

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        language: SUPPORTED_LANGUAGES.includes(parsed.language) ? parsed.language : detectBrowserLanguage(),
        difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty) ? parsed.difficulty : 'easy',
        soundEnabled: parsed.soundEnabled !== false,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return {
    language: detectBrowserLanguage(),
    difficulty: 'easy',
    soundEnabled: true,
  };
}

function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

const GameSettingsContext = createContext<GameSettingsContextType | null>(null);

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  // Save to localStorage when settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setLanguage = (language: Language) => {
    setSettings(prev => ({ ...prev, language }));
  };

  const setDifficulty = (difficulty: Difficulty) => {
    setSettings(prev => ({ ...prev, difficulty }));
  };

  const setSoundEnabled = (soundEnabled: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled }));
  };

  return (
    <GameSettingsContext.Provider value={{ settings, setLanguage, setDifficulty, setSoundEnabled }}>
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings(): GameSettingsContextType {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider');
  }
  return context;
}
