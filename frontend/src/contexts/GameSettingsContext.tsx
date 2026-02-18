import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameSettings {
  difficulty: Difficulty;
  soundEnabled: boolean;
}

interface GameSettingsContextType {
  settings: GameSettings;
  setDifficulty: (diff: Difficulty) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'anaroo_game_settings';

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty) ? parsed.difficulty : 'easy',
        soundEnabled: parsed.soundEnabled !== false,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return {
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

  const setDifficulty = (difficulty: Difficulty) => {
    setSettings(prev => ({ ...prev, difficulty }));
  };

  const setSoundEnabled = (soundEnabled: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled }));
  };

  return (
    <GameSettingsContext.Provider value={{ settings, setDifficulty, setSoundEnabled }}>
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
