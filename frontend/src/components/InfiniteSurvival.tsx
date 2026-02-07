import { useEffect, useState } from 'react';
import { SubmitScoreResponse } from '@anaroo/shared';
import { useInfiniteSurvival } from '../hooks/useInfiniteSurvival';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface InfiniteSurvivalProps {
  language: string;
  difficulty: string;
}

export function InfiniteSurvival({ language, difficulty }: InfiniteSurvivalProps) {
  const { user } = useAuth();
  const {
    gameState,
    wordTimeRemaining,
    isGameActive,
    scrambledLetters,
    selectedIndexes,
    currentGuess,
    lastResult,
    selectLetter,
    removeLastLetter,
    clearGuess,
    startGame,
    resetGame,
    loading,
    skippedWords,
  } = useInfiniteSurvival({ language, difficulty });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitScoreResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** 🚀 START GAME IMMEDIATELY once loaded */
  useEffect(() => {
    if (!loading && gameState && !isGameActive && !gameState.startTime) {
      startGame();
    }
  }, [loading, gameState, startGame, isGameActive]);

  /** Auto-submit when game ends */
  useEffect(() => {
    if (gameState?.endTime && !submitting && user && !result) {
      submitScore();
    }
  }, [gameState?.endTime, submitting, user, result]);

  const submitScore = async () => {
  if (!user || !gameState || !gameState.startTime || !gameState.endTime) return;

  const wordCount = gameState.solvedWords.length;
  if (wordCount === 0) {
    console.warn('No words solved, skipping score submission.');
    return;
  }

  setSubmitting(true);
  setSubmitError(null);
  try {
    const totalTime = (gameState.endTime - gameState.startTime) / 1000;

    const response = await apiService.submitScore({
      userId: user._id || '',
      mode: gameState.mode,
      timeElapsed: totalTime,
      correctChars: gameState.correctChars,
      incorrectChars: gameState.incorrectChars,
      seed: gameState.seed,
      wordCount: wordCount, // must be > 0
      survivalStreak: gameState.survivalStreak,
      wordsCompleted: wordCount,
    });

    setResult(response);
  } catch (err) {
    console.error('Failed to submit survival score:', err);
    setSubmitError('Failed to submit score. Please try again.');
  } finally {
    setSubmitting(false);
  }
};


  /** Keyboard support */
  useEffect(() => {
    if (!gameState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive || gameState.endTime) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        removeLastLetter();
        return;
      }

      if (!/^[a-zA-Z]$/.test(e.key)) return;

      const key = e.key.toLowerCase();
      const index = scrambledLetters.findIndex(
        (letter, i) => letter === key && !selectedIndexes.includes(i)
      );

      if (index !== -1) selectLetter(index);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameActive, gameState?.endTime, scrambledLetters, selectedIndexes, selectLetter, removeLastLetter]);

  /** Loading state */
  if (loading || !gameState) {
    return <div>Loading game...</div>;
  }

  /** End screen */
  if (gameState.endTime) {
    const totalTime = (gameState.endTime - gameState.startTime!) / 1000;
    const wordsCompleted = gameState.solvedWords.length;
    const avgTime = wordsCompleted > 0 ? totalTime / wordsCompleted : 0;
    const wpm = gameState.correctChars / 5 / (totalTime / 60);
    const accuracy =
      gameState.correctChars + gameState.incorrectChars > 0
        ? (gameState.correctChars /
            (gameState.correctChars + gameState.incorrectChars)) *
          100
        : 100;

    return (
      <div className="game-complete">
        <h2 className="end-title">game over</h2>

        <div className="score-highlight">{wordsCompleted}</div>

        <div className="stats-grid">
          <div className="stat">
            <span className="stat-label">Words Solved</span>
            <span className="stat-value">{wordsCompleted}</span>
          </div>

          <div className="stat">
            <span className="stat-label">Total Time</span>
            <span className="stat-value">{totalTime.toFixed(1)}s</span>
          </div>

          <div className="stat">
            <span className="stat-label">Avg / Word</span>
            <span className="stat-value">{avgTime.toFixed(1)}s</span>
          </div>

          <div className="stat">
            <span className="stat-label">Max Combo</span>
            <span className="stat-value">{gameState.maxCombo}</span>
          </div>

          <div className="stat">
            <span className="stat-label">WPM</span>
            <span className="stat-value">{wpm.toFixed(1)}</span>
          </div>

          <div className="stat">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{accuracy.toFixed(0)}%</span>
          </div>
        </div>

        {result?.isPersonalBest && (
          <div className="personal-best-badge">new personal best</div>
        )}

        {submitError && <div className="submit-error">{submitError}</div>}

        {/* Word lists */}
        <div className="word-lists">
          {gameState.solvedWords.length > 0 && (
            <div className="word-list solved">
              <h3 className="word-list-title">Solved ({gameState.solvedWords.length})</h3>
              <div className="word-list-items">
                {gameState.solvedWords.map((word, i) => (
                  <span key={i} className="word-item correct">{word}</span>
                ))}
              </div>
            </div>
          )}

          {skippedWords.length > 0 && (
            <div className="word-list skipped">
              <h3 className="word-list-title">Skipped ({skippedWords.length})</h3>
              <div className="word-list-items">
                {skippedWords.map((word, i) => (
                  <span key={i} className="word-item incorrect">{word}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="actions">
          <button className="btn-primary" onClick={resetGame}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /** In-game UI */
  return (
    <div className={`game-container ${lastResult ? `flash-${lastResult}` : ''}`}>
      {/* Feedback overlay */}
      {lastResult === 'correct' && (
        <div className="feedback-popup correct">+1</div>
      )}
      {lastResult === 'incorrect' && (
        <div className="feedback-popup incorrect">✗</div>
      )}

      {/* Header */}
      <div className="game-header">
        <div className={`stats-bar ${lastResult === 'correct' ? 'combo-bump' : ''}`}>
          Streak {gameState.survivalStreak} · Lvl {gameState.difficultyLevel}
        </div>
        <div className="timer">
          <span>{wordTimeRemaining.toFixed(1)}s</span>
        </div>
      </div>

      {/* Guess row */}
      <div className={`guess-row ${lastResult ? `result-${lastResult}` : ''}`}>
        {scrambledLetters.map((_, i) => (
          <div key={i} className="guess-slot">
            {currentGuess[i] ?? ''}
          </div>
        ))}
      </div>

      {/* Scrambled letters row */}
      <div className="scrambled-row">
        {scrambledLetters.map((letter, index) => (
          <button
            key={index}
            className={`letter-tile ${selectedIndexes.includes(index) ? 'used' : ''}`}
            onClick={() => selectLetter(index)}
            disabled={selectedIndexes.includes(index)}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="game-controls">
        <button
          className="control-button"
          onClick={removeLastLetter}
          disabled={currentGuess.length === 0}
        >
          ← Backspace
        </button>
        <button
          className="control-button"
          onClick={clearGuess}
          disabled={currentGuess.length === 0}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
