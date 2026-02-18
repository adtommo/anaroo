import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GameState,
  GameMode,
  TimedDuration,
  createInitialGameState,
  TIMED_DURATIONS,
} from '@anaroo/shared';

const SKIP_COOLDOWN_MS = 3000;
import { apiService } from '../services/api';

interface UseTimedModeOptions {
  duration: TimedDuration;
  difficulty: string;
}

export interface WordStat {
  word: string;
  attempts: number;
  solved: boolean;
  timeToSolve?: number; // ms from when word appeared to solve
}

export function useTimedMode({ duration, difficulty }: UseTimedModeOptions) {
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
  const [skippedWords, setSkippedWords] = useState<string[]>([]);
  const wordStartTimeRef = useRef<number>(Date.now());
  const currentAttemptsRef = useRef<number>(0);

  // Skip cooldown
  const lastSkipTimeRef = useRef<number>(0);
  const [skipCooldownRemaining, setSkipCooldownRemaining] = useState(0);

  // Track settings to detect changes
  const settingsRef = useRef({ difficulty });

  /* Fetch words from backend on mount or when settings change */
  useEffect(() => {
    let isMounted = true;

    // Update settings ref for future comparisons
    settingsRef.current = { difficulty };

    async function initGame() {
      try {
        setLoading(true);
        const { words: results } = await apiService.getWordPicks(20, 'en', difficulty as 'easy' | 'medium' | 'hard');

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
        setSkippedWords([]);
        currentAttemptsRef.current = 0;
      } catch (err) {
        console.error('Failed to initialize timed mode:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initGame();
    return () => { isMounted = false; };
  }, [duration, difficulty]);

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

  /* Skip cooldown ticker */
  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSkipTimeRef.current;
      if (elapsed >= SKIP_COOLDOWN_MS) {
        setSkipCooldownRemaining(0);
      } else {
        setSkipCooldownRemaining(Math.ceil((SKIP_COOLDOWN_MS - elapsed) / 100) / 10);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGameActive]);

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

  const skipWord = useCallback(() => {
    if (!gameState || !isGameActive || gameState.endTime || !gameState.startTime) return;
    if (Date.now() - lastSkipTimeRef.current < SKIP_COOLDOWN_MS) return;

    const SKIP_PENALTY = 5;
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    const durationSecs = TIMED_DURATIONS[duration].duration;
    const remaining = durationSecs - elapsed;

    if (remaining <= SKIP_PENALTY) {
      endGame();
      return;
    }

    // Move the start time forward to effectively subtract time
    setGameState(prev => {
      if (!prev || !prev.startTime) return prev;
      return {
        ...prev,
        startTime: prev.startTime - SKIP_PENALTY * 1000,
        currentWordIndex: prev.currentWordIndex + 1,
        comboStreak: 0,
      };
    });

    lastSkipTimeRef.current = Date.now();
    setSkipCooldownRemaining(SKIP_COOLDOWN_MS / 1000);
    setSkippedWords(prev => [...prev, currentAnswer]);
    setSelectedIndexes([]);
    setCurrentGuess('');
    wordStartTimeRef.current = Date.now();
    currentAttemptsRef.current = 0;
  }, [gameState, isGameActive, duration, currentAnswer, endGame]);

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
      const { words: results } = await apiService.getWordPicks(20, 'en', difficulty as 'easy' | 'medium' | 'hard');

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
      setSkippedWords([]);
      currentAttemptsRef.current = 0;
    } finally {
      setLoading(false);
    }
  }, [duration, difficulty]);

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
    skipWord,
    resetGame,
    loading,
    wordStats,
    skippedWords,
    skipCooldownRemaining,
  };
}
