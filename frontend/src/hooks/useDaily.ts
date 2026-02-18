import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GameState,
  GameMode,
  createInitialGameState,
  getModeConfig,
  canRevealNext,
  getSecondsUntilNextReveal,
  getRevealPenalty,
} from '@anaroo/shared';
import { apiService } from '../services/api';

/**
 * Hook for daily mode - single word with hints
 * Answer is never known client-side until the server confirms a correct guess.
 */
export function useDaily(scrambled: string, seed: string, letterCount: number) {
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

  // Server-side state
  const [revealedLetterMap, setRevealedLetterMap] = useState<Record<number, string>>({});
  const [answer, setAnswer] = useState('');
  const [guessing, setGuessing] = useState(false);

  // Ref to prevent double-submit in strict mode
  const guessInFlight = useRef(false);

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
      setRevealedLetterMap({});
      setAnswer('');
      setGuessing(false);
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
      if (!isGameActive || gameState.endTime || guessing) return;
      if (selectedIndexes.includes(index)) return;

      if (!gameState.startTime) {
        startGame();
      }

      setSelectedIndexes(prev => [...prev, index]);
      setCurrentGuess(prev => prev + scrambledLetters[index]);
    },
    [isGameActive, gameState.endTime, gameState.startTime, scrambledLetters, selectedIndexes, startGame, guessing]
  );

  const removeLastLetter = useCallback(() => {
    if (guessing) return;
    setSelectedIndexes(prev => prev.slice(0, -1));
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [guessing]);

  const clearGuess = useCallback(() => {
    if (guessing) return;
    setSelectedIndexes([]);
    setCurrentGuess('');
  }, [guessing]);

  /* Build the current answer with revealed letters */
  const buildAnswerWithReveals = useCallback(() => {
    const result: string[] = [];
    let guessIndex = 0;

    for (let i = 0; i < letterCount; i++) {
      if (revealedLetterMap[i] !== undefined) {
        result.push(revealedLetterMap[i]);
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
  }, [letterCount, revealedLetterMap, currentGuess]);

  /* Auto-submit when full length reached */
  useEffect(() => {
    const revealedCount = gameState.revealedLetters.length;
    const requiredLength = letterCount - revealedCount;
    if (requiredLength <= 0 || currentGuess.length !== requiredLength) return;
    if (guessInFlight.current) return;

    // Build full word by merging revealed letters + user guess
    const fullWord: string[] = [];
    let guessIndex = 0;
    for (let i = 0; i < letterCount; i++) {
      if (revealedLetterMap[i] !== undefined) {
        fullWord.push(revealedLetterMap[i]);
      } else {
        fullWord.push(currentGuess[guessIndex]);
        guessIndex++;
      }
    }

    const guessWord = fullWord.join('');
    guessInFlight.current = true;
    setGuessing(true);

    apiService.dailyGuess(guessWord).then(result => {
      guessInFlight.current = false;
      setGuessing(false);

      if (result.correct && result.word) {
        setAnswer(result.word);
        setGameState(prev => ({
          ...prev,
          correctChars: letterCount,
          solvedWords: [result.word!],
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
    }).catch(() => {
      guessInFlight.current = false;
      setGuessing(false);
      // On network error, just reset the guess so user can try again
      setSelectedIndexes([]);
      setCurrentGuess('');
    });
  }, [currentGuess, letterCount, gameState.revealedLetters.length, revealedLetterMap, endGame]);

  const revealLetter = useCallback(() => {
    if (!config.hintsEnabled) return;
    if (!isGameActive || !gameState.startTime) return;

    // Check if reveal is available
    if (!canRevealNext(gameState.revealsUsed, currentTime, gameState.startTime, GameMode.DAILY)) {
      return;
    }

    // Clear user's current input when revealing
    setSelectedIndexes([]);
    setCurrentGuess('');

    apiService.dailyReveal(gameState.revealedLetters).then(result => {
      if (result.position === -1) return; // All letters revealed

      // Update revealed letter map with server response
      setRevealedLetterMap(prev => ({ ...prev, [result.position]: result.letter }));

      // Find a matching scrambled tile to mark as revealed
      const revealedChar = result.letter.toLowerCase();
      setRevealedTileIndexes(prev => {
        const tileIndex = scrambledLetters.findIndex(
          (letter, i) => letter.toLowerCase() === revealedChar && !prev.includes(i)
        );
        return tileIndex !== -1 ? [...prev, tileIndex] : prev;
      });

      setGameState(prev => ({
        ...prev,
        revealedLetters: [...prev.revealedLetters, result.position],
        revealsUsed: prev.revealsUsed + 1,
        timePenalty: getRevealPenalty(prev.revealsUsed + 1, GameMode.DAILY),
        lastRevealTime: Date.now(),
      }));
    }).catch(err => {
      console.error('Failed to reveal letter:', err);
    });
  }, [
    config.hintsEnabled,
    isGameActive,
    gameState.startTime,
    gameState.revealsUsed,
    gameState.revealedLetters,
    currentTime,
    scrambledLetters,
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
    setRevealedLetterMap({});
    setAnswer('');
    setGuessing(false);
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
    guessing,
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
