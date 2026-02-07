import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GameState,
  GameMode,
  createInitialGameState,
  calculateSurvivalTimeLimit,
  SURVIVAL_CONFIG,
} from '@anaroo/shared';
import { apiService } from '../services/api';

const BATCH_SIZE = 10;

interface UseInfiniteSurvivalOptions {
  language: string;
  difficulty: string;
}

export function useInfiniteSurvival({ language, difficulty }: UseInfiniteSurvivalOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [wordTimeRemaining, setWordTimeRemaining] = useState(SURVIVAL_CONFIG.initialTimePerWord);
  const [isGameActive, setIsGameActive] = useState(false);
  const [loading, setLoading] = useState(true);
  // Track words that were skipped due to wrong answers or timeout
  const [skippedWords, setSkippedWords] = useState<string[]>([]);

  // Letter input
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');

  // Feedback state for correct/incorrect flash
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);

  /** Fetch a batch of distinct words */
  const fetchWords = useCallback(async (count: number) => {
    const promises = Array.from({ length: count }, () =>
      apiService.getWordPick(1, language, difficulty as 'easy' | 'medium' | 'hard')
    );
    const results = await Promise.all(promises);
    return results;
  }, [language, difficulty]);

  /* Fetch words from backend on mount or when settings change */
  useEffect(() => {
    let isMounted = true;

    async function initGame() {
      try {
        setLoading(true);
        const results = await fetchWords(BATCH_SIZE);

        if (!isMounted) return;

        const initialState = createInitialGameState({
          words: results.map(r => r.scrambled),
          mode: GameMode.INFINITE_SURVIVAL,
          seed: results[0].seed,
          currentWordTimeLimit: SURVIVAL_CONFIG.initialTimePerWord,
        });

        setGameState(initialState);
        setAnswers(results.map(r => r.answers[0]));
        setWordTimeRemaining(SURVIVAL_CONFIG.initialTimePerWord);
        setIsGameActive(false);
        setSelectedIndexes([]);
        setCurrentGuess('');
        setSkippedWords([]);
      } catch (err) {
        console.error('Failed to initialize infinite survival:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initGame();
    return () => {
      isMounted = false;
    };
  }, [fetchWords]);

  /** Fetch more words when running low */
  useEffect(() => {
    if (!gameState || !isGameActive || gameState.endTime) return;

    const remaining = gameState.words.length - gameState.currentWordIndex;
    if (remaining > 3) return;

    let cancelled = false;

    async function loadMore() {
      try {
        const results = await fetchWords(BATCH_SIZE);
        if (cancelled) return;

        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            words: [...prev.words, ...results.map(r => r.scrambled)],
          };
        });
        setAnswers(prev => [...prev, ...results.map(r => r.answers[0])]);
      } catch (err) {
        console.error('Failed to fetch more words:', err);
      }
    }

    loadMore();
    return () => { cancelled = true; };
  }, [gameState?.currentWordIndex, gameState?.words.length, isGameActive, gameState?.endTime, fetchWords]);

  const currentScrambled = useMemo(() => {
    if (!gameState) return '';
    return gameState.words[gameState.currentWordIndex] || '';
  }, [gameState]);

  const currentAnswer = useMemo(() => {
    if (!gameState) return '';
    return answers[gameState.currentWordIndex] || '';
  }, [gameState, answers]);

  const scrambledLetters = useMemo(
    () => currentScrambled.split(''),
    [currentScrambled]
  );

  /* Timer */
  useEffect(() => {
    if (!gameState || !isGameActive || gameState.endTime || !gameState.wordStartTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - gameState.wordStartTime!) / 1000;
      const remaining = Math.max(0, gameState.currentWordTimeLimit - elapsed);
      setWordTimeRemaining(remaining);

      if (remaining === 0) {
        endGame();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, isGameActive]);

  const startGame = useCallback(() => {
    if (!gameState) return;

    setGameState(prev => prev && ({
      ...prev,
      startTime: Date.now(),
      wordStartTime: Date.now(),
      endTime: null,
    }));
    setIsGameActive(true);
  }, [gameState]);

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

      if (!gameState.startTime) startGame();

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

  /* Auto-submit */
  useEffect(() => {
    if (!gameState || !currentAnswer) return;
    if (currentGuess.length !== currentAnswer.length) return;

    if (currentGuess.toLowerCase() === currentAnswer.toLowerCase()) {
      // Correct answer
      setLastResult('correct');
      setTimeout(() => setLastResult(null), 600);
      setGameState(prev => {
        if (!prev) return prev;

        const newStreak = prev.survivalStreak + 1;
        const newCombo = prev.comboStreak + 1;
        const newTimeLimit = calculateSurvivalTimeLimit(newStreak);
        const newDifficultyLevel = Math.floor(newStreak / SURVIVAL_CONFIG.difficultyIncreaseInterval);

        return {
          ...prev,
          currentWordIndex: prev.currentWordIndex + 1,
          comboStreak: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          correctChars: prev.correctChars + currentAnswer.length,
          solvedWords: [...prev.solvedWords, currentAnswer],
          survivalStreak: newStreak,
          currentWordTimeLimit: newTimeLimit,
          wordStartTime: Date.now(),
          difficultyLevel: newDifficultyLevel,
        };
      });

      setWordTimeRemaining(calculateSurvivalTimeLimit(gameState.survivalStreak + 1));
    } else {
      // Wrong answer - deduct time and skip to next word
      setLastResult('incorrect');
      setTimeout(() => setLastResult(null), 600);
      const newTimeRemaining = wordTimeRemaining - SURVIVAL_CONFIG.wrongAnswerPenalty;

      if (newTimeRemaining <= 0) {
        // Out of time - end game
        endGame();
      } else {
        // Deduct time, skip word, reset combo
        // Important: Update wordStartTime and currentWordTimeLimit so the timer
        // continues from the new reduced time instead of recalculating
        setSkippedWords(prev => [...prev, currentAnswer]);
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            currentWordIndex: prev.currentWordIndex + 1,
            comboStreak: 0,
            incorrectChars: prev.incorrectChars + currentAnswer.length,
            // Reset timer with the reduced time as the new limit
            wordStartTime: Date.now(),
            currentWordTimeLimit: newTimeRemaining,
          };
        });
        setWordTimeRemaining(newTimeRemaining);
      }
    }

    setSelectedIndexes([]);
    setCurrentGuess('');
  }, [currentGuess, currentAnswer, gameState, endGame, wordTimeRemaining]);

  const resetGame = useCallback(async () => {
    setLoading(true);
    try {
      const results = await fetchWords(BATCH_SIZE);

      const initialState = createInitialGameState({
        words: results.map(r => r.scrambled),
        mode: GameMode.INFINITE_SURVIVAL,
        seed: results[0].seed,
        currentWordTimeLimit: SURVIVAL_CONFIG.initialTimePerWord,
      });

      setGameState(initialState);
      setAnswers(results.map(r => r.answers[0]));
      setWordTimeRemaining(SURVIVAL_CONFIG.initialTimePerWord);
      setSelectedIndexes([]);
      setCurrentGuess('');
      setSkippedWords([]);
      setIsGameActive(false);
    } finally {
      setLoading(false);
    }
  }, [fetchWords]);

  return {
    gameState,
    wordTimeRemaining,
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
    skippedWords,
  };
}
