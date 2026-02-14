import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GameState,
  GameMode,
  createInitialGameState,
  getModeConfig,
  canRevealNext,
  getSecondsUntilNextReveal,
  revealNextLetter,
  getRevealPenalty,
} from '@anaroo/shared';

/**
 * Hook for daily mode - single word with hints
 */
export function useDaily(answer: string, scrambled: string, seed: string) {
  const config = getModeConfig(GameMode.DAILY);
  
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState({
      words: [scrambled],
      mode: GameMode.DAILY,
      seed,
    })
  );

  const [isGameActive, setIsGameActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Letter-based input
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  // Track which scrambled tile indexes are consumed by reveals
  const [revealedTileIndexes, setRevealedTileIndexes] = useState<number[]>([]);

  const scrambledLetters = useMemo(
    () => scrambled.split(''),
    [scrambled]
  );

  // Reinitialize game state when scrambled changes from empty to a real value
  useEffect(() => {
    if (scrambled.length > 0) {
      setGameState(createInitialGameState({
        words: [scrambled],
        mode: GameMode.DAILY,
        seed,
      }));
      setIsGameActive(false);
      setSelectedIndexes([]);
      setCurrentGuess('');
      setRevealedTileIndexes([]);
    }
  }, [scrambled, seed]);

  // Update current time for hint availability checks
  useEffect(() => {
    if (!isGameActive || gameState.endTime) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [isGameActive, gameState.endTime]);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      startTime: Date.now(),
      endTime: null,
    }));
    setIsGameActive(true);
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      endTime: Date.now(),
    }));
    setIsGameActive(false);
  }, []);

  /* Letter selection */
  const selectLetter = useCallback(
    (index: number) => {
      if (!isGameActive || gameState.endTime) return;
      if (selectedIndexes.includes(index)) return;

      if (!gameState.startTime) {
        startGame();
      }

      setSelectedIndexes(prev => [...prev, index]);
      setCurrentGuess(prev => prev + scrambledLetters[index]);
    },
    [isGameActive, gameState.endTime, gameState.startTime, scrambledLetters, selectedIndexes, startGame]
  );

  const removeLastLetter = useCallback(() => {
    setSelectedIndexes(prev => prev.slice(0, -1));
    setCurrentGuess(prev => prev.slice(0, -1));
  }, []);

  const clearGuess = useCallback(() => {
    setSelectedIndexes([]);
    setCurrentGuess('');
  }, []);

  /* Build the current answer with revealed letters */
  const buildAnswerWithReveals = useCallback(() => {
    const result: string[] = [];
    let guessIndex = 0;

    for (let i = 0; i < answer.length; i++) {
      if (gameState.revealedLetters.includes(i)) {
        result.push(answer[i]);
      } else {
        if (guessIndex < currentGuess.length) {
          result.push(currentGuess[guessIndex]);
          guessIndex++;
        } else {
          result.push('_');
        }
      }
    }

    return result.join('');
  }, [answer, gameState.revealedLetters, currentGuess]);

  /* Check if word is solved */
  const checkSolved = useCallback(() => {
    const requiredLength = answer.length - gameState.revealedLetters.length;
    if (currentGuess.length !== requiredLength) return false;

    // Build complete answer from guess + revealed letters
    let guessIndex = 0;
    for (let i = 0; i < answer.length; i++) {
      if (gameState.revealedLetters.includes(i)) {
        continue; // Skip revealed positions
      }

      if (guessIndex >= currentGuess.length) return false;
      if (currentGuess[guessIndex].toLowerCase() !== answer[i].toLowerCase()) {
        return false;
      }
      guessIndex++;
    }

    return true;
  }, [answer, currentGuess, gameState.revealedLetters]);

  /* Auto-submit when full length reached */
  useEffect(() => {
    const requiredLength = answer.length - gameState.revealedLetters.length;
    if (currentGuess.length !== requiredLength) return;

    if (checkSolved()) {
      // Correct - end game
      setGameState(prev => ({
        ...prev,
        correctChars: answer.length,
        solvedWords: [answer],
      }));
      endGame();
    } else {
      // Incorrect - reset guess
      setGameState(prev => ({
        ...prev,
        incorrectChars: prev.incorrectChars + currentGuess.length,
      }));
      setSelectedIndexes([]);
      setCurrentGuess('');
    }
  }, [currentGuess, answer, gameState.revealedLetters.length, checkSolved, endGame]);

  const revealLetter = useCallback(() => {
    if (!config.hintsEnabled) return;
    if (!isGameActive || !gameState.startTime) return;

    // Check if reveal is available
    if (!canRevealNext(gameState.revealsUsed, currentTime, gameState.startTime, GameMode.DAILY)) {
      return;
    }

    // Reveal next letter
    const nextIndex = revealNextLetter(answer, gameState.revealedLetters);

    if (nextIndex === -1) return; // All letters revealed

    // Clear user's current input when revealing
    setSelectedIndexes([]);
    setCurrentGuess('');

    // Find a matching scrambled tile to mark as revealed (only exclude already-revealed tiles)
    const revealedChar = answer[nextIndex].toLowerCase();
    const tileIndex = scrambledLetters.findIndex(
      (letter, i) => letter.toLowerCase() === revealedChar && !revealedTileIndexes.includes(i)
    );

    if (tileIndex !== -1) {
      setRevealedTileIndexes(prev => [...prev, tileIndex]);
    }

    setGameState(prev => ({
      ...prev,
      revealedLetters: [...prev.revealedLetters, nextIndex],
      revealsUsed: prev.revealsUsed + 1,
      timePenalty: getRevealPenalty(prev.revealsUsed + 1, GameMode.DAILY),
      lastRevealTime: currentTime,
    }));
  }, [
    config.hintsEnabled,
    isGameActive,
    gameState.startTime,
    gameState.revealsUsed,
    gameState.revealedLetters,
    currentTime,
    answer,
    scrambledLetters,
    selectedIndexes,
    revealedTileIndexes,
  ]);

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState({
      words: [scrambled],
      mode: GameMode.DAILY,
      seed,
    }));
    setIsGameActive(false);
    setSelectedIndexes([]);
    setCurrentGuess('');
    setRevealedTileIndexes([]);
  }, [scrambled, seed]);

  // Calculate hint availability
  const canReveal = config.hintsEnabled &&
    isGameActive &&
    gameState.startTime !== null &&
    canRevealNext(gameState.revealsUsed, currentTime, gameState.startTime, GameMode.DAILY);
  
  const secondsUntilReveal = config.hintsEnabled &&
    gameState.startTime !== null
      ? getSecondsUntilNextReveal(gameState.revealsUsed, currentTime, gameState.startTime, GameMode.DAILY)
      : null;

  return {
    gameState,
    isGameActive,
    scrambledLetters,
    selectedIndexes,
    revealedTileIndexes,
    currentGuess,
    answer,
    buildAnswerWithReveals,
    selectLetter,
    removeLastLetter,
    clearGuess,
    resetGame,
    startGame,
    endGame,
    revealLetter,
    canReveal,
    secondsUntilReveal,
    config,
  };
}