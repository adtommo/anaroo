import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GameState,
  GameMode,
  TimedDuration,
  createInitialGameState,
  TIMED_DURATIONS,
} from '@anaroo/shared';
import { apiService } from '../services/api';

interface UseTimedModeOptions {
  duration: TimedDuration;
  language: string;
  difficulty: string;
}

export interface WordStat {
  word: string;
  attempts: number;
  solved: boolean;
  timeToSolve?: number; // ms from when word appeared to solve
}

export function useTimedMode({ duration, language, difficulty }: UseTimedModeOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(TIMED_DURATIONS[duration].duration);
  const [isGameActive, setIsGameActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Letter-based input
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');

  // Feedback state for correct/incorrect flash
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);

  // Track word stats (attempts per word)
  const [wordStats, setWordStats] = useState<WordStat[]>([]);
  const wordStartTimeRef = useRef<number>(Date.now());
  const currentAttemptsRef = useRef<number>(0);

  // Track settings to detect changes
  const settingsRef = useRef({ language, difficulty });

  /* Fetch words from backend on mount or when settings change */
  useEffect(() => {
    let isMounted = true;

    // Update settings ref for future comparisons
    settingsRef.current = { language, difficulty };

    async function initGame() {
      try {
        setLoading(true);
        // Fetch multiple words by making several requests
        const wordPromises = Array.from({ length: 20 }, () =>
          apiService.getWordPick(1, language, difficulty as 'easy' | 'medium' | 'hard')
        );
        const results = await Promise.all(wordPromises);

        if (!isMounted) return;

        const initialState = createInitialGameState({
          words: results.map(r => r.scrambled),
          mode: GameMode.TIMED,
          seed: results[0].seed,
          timedDuration: duration,
        });

        setGameState(initialState);
        setAnswers(results.map(r => r.answers[0]));
        setTimeRemaining(TIMED_DURATIONS[duration].duration);
        setIsGameActive(false);
        setSelectedIndexes([]);
        setCurrentGuess('');
        setWordStats([]);
        currentAttemptsRef.current = 0;
      } catch (err) {
        console.error('Failed to initialize timed mode:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initGame();
    return () => { isMounted = false; };
  }, [duration, language, difficulty]);

  const currentScrambled = useMemo(() => {
    if (!gameState) return '';
    return gameState.words[gameState.currentWordIndex] || '';
  }, [gameState]);

  const currentAnswer = useMemo(() => {
    if (!gameState) return '';
    return answers[gameState.currentWordIndex] || '';
  }, [gameState, answers]);

  const scrambledLetters = useMemo(
    () => (currentScrambled ? currentScrambled.split('') : []),
    [currentScrambled]
  );

  /* Timer - countdown for timed mode */
  useEffect(() => {
    if (!gameState || !isGameActive || gameState.endTime) return;

    const interval = setInterval(() => {
      if (!gameState.startTime) return;

      const elapsed = (Date.now() - gameState.startTime) / 1000;
      const remaining = Math.max(0, TIMED_DURATIONS[duration].duration - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        endGame();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGameActive, gameState?.startTime, gameState?.endTime, duration]);

  const startGame = useCallback(() => {
    const now = Date.now();
    setGameState(prev => prev && ({
      ...prev,
      startTime: now,
      endTime: null,
    }));
    setIsGameActive(true);
    wordStartTimeRef.current = now;
    currentAttemptsRef.current = 0;
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => prev && ({
      ...prev,
      endTime: Date.now(),
    }));
    setIsGameActive(false);
  }, []);

  /* Letter selection */
  const selectLetter = useCallback(
    (index: number) => {
      if (!gameState || !isGameActive || gameState.endTime) return;
      if (selectedIndexes.includes(index)) return;

      if (!gameState.startTime) {
        startGame();
      }

      setSelectedIndexes(prev => [...prev, index]);
      setCurrentGuess(prev => prev + scrambledLetters[index]);
    },
    [gameState, isGameActive, selectedIndexes, scrambledLetters, startGame]
  );

  const removeLastLetter = useCallback(() => {
    setSelectedIndexes(prev => prev.slice(0, -1));
    setCurrentGuess(prev => prev.slice(0, -1));
  }, []);

  const clearGuess = useCallback(() => {
    setSelectedIndexes([]);
    setCurrentGuess('');
  }, []);

  /* Auto-submit on full length */
  useEffect(() => {
    if (!currentAnswer) return;
    if (currentGuess.length !== currentAnswer.length) return;

    currentAttemptsRef.current += 1;

    if (currentGuess.toLowerCase() === currentAnswer.toLowerCase()) {
      // Correct - record word stat
      const timeToSolve = Date.now() - wordStartTimeRef.current;
      setWordStats(prev => [...prev, {
        word: currentAnswer,
        attempts: currentAttemptsRef.current,
        solved: true,
        timeToSolve,
      }]);

      setLastResult('correct');
      setGameState(prev => {
        if (!prev) return prev;
        const newCombo = prev.comboStreak + 1;
        return {
          ...prev,
          currentWordIndex: prev.currentWordIndex + 1,
          comboStreak: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          correctChars: prev.correctChars + currentAnswer.length,
          solvedWords: [...prev.solvedWords, currentAnswer],
        };
      });

      // Reset for next word
      wordStartTimeRef.current = Date.now();
      currentAttemptsRef.current = 0;
    } else {
      // Incorrect
      setLastResult('incorrect');
      setGameState(prev => prev && ({
        ...prev,
        comboStreak: 0,
        incorrectChars: prev.incorrectChars + currentAnswer.length,
      }));
    }

    // Clear result flash after animation
    setTimeout(() => setLastResult(null), 600);

    setSelectedIndexes([]);
    setCurrentGuess('');
  }, [currentGuess, currentAnswer]);

  const resetGame = useCallback(async () => {
    setLoading(true);
    try {
      const wordPromises = Array.from({ length: 20 }, () =>
        apiService.getWordPick(1, language, difficulty as 'easy' | 'medium' | 'hard')
      );
      const results = await Promise.all(wordPromises);

      setGameState(createInitialGameState({
        words: results.map(r => r.scrambled),
        mode: GameMode.TIMED,
        seed: results[0].seed,
        timedDuration: duration,
      }));

      setAnswers(results.map(r => r.answers[0]));
      setTimeRemaining(TIMED_DURATIONS[duration].duration);
      setIsGameActive(false);
      setSelectedIndexes([]);
      setCurrentGuess('');
      setWordStats([]);
      currentAttemptsRef.current = 0;
    } finally {
      setLoading(false);
    }
  }, [duration, language, difficulty]);

  return {
    gameState,
    timeRemaining,
    isGameActive,
    scrambledLetters,
    selectedIndexes,
    currentGuess,
    currentAnswer,
    lastResult,
    selectLetter,
    removeLastLetter,
    clearGuess,
    startGame,
    endGame,
    resetGame,
    loading,
    wordStats,
  };
}
