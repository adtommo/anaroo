import { useRef, useEffect, useCallback } from 'react';
import { useGameSettings } from '../contexts/GameSettingsContext';

const SOUND_PATHS = {
  correct: '/sounds/correct.wav',
  incorrect: '/sounds/incorrect.wav',
  skip: '/sounds/skip.wav',
  gameover: '/sounds/gameover.wav',
} as const;

export function useSound() {
  const { settings } = useGameSettings();
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    for (const [key, path] of Object.entries(SOUND_PATHS)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    }
  }, []);

  const play = useCallback((name: keyof typeof SOUND_PATHS) => {
    if (!settings.soundEnabled) return;
    const audio = audioRefs.current[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings.soundEnabled]);

  return {
    playCorrect: useCallback(() => play('correct'), [play]),
    playIncorrect: useCallback(() => play('incorrect'), [play]),
    playSkip: useCallback(() => play('skip'), [play]),
    playGameOver: useCallback(() => play('gameover'), [play]),
  };
}
