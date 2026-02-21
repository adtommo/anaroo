import React, { useEffect, useRef, useState } from 'react';
import { TimedDuration, SubmitScoreResponse } from '@anaroo/shared';
import { useTimedMode } from '../hooks/useTimedMode';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../hooks/useSound';
import { apiService } from '../services/api';
import { AuthModal } from './AuthModal';
import { AdUnit } from './AdUnit';

interface TimedModeProps {
  duration: TimedDuration;
  difficulty: string;
}

export function TimedMode({ duration, difficulty }: TimedModeProps) {
  const { user } = useAuth();

  const {
    gameState,
    timeRemaining,
    isGameActive,
    scrambledLetters,
    selectedIndexes,
    currentGuess,
    lastResult,
    currentAnswer,
    selectLetter,
    removeLastLetter,
    clearGuess,
    startGame,
    skipWord,
    resetGame,
    loading,
    wordStats,
    skippedWords,
    skipCooldownRemaining,
  } = useTimedMode({ duration, difficulty });

  const { playCorrect, playIncorrect, playSkip, playGameOver } = useSound();
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<SubmitScoreResponse | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  /** Sound effects */
  const prevLastResult = useRef(lastResult);
  useEffect(() => {
    if (lastResult && lastResult !== prevLastResult.current) {
      if (lastResult === 'correct') playCorrect();
      else playIncorrect();
    }
    prevLastResult.current = lastResult;
  }, [lastResult, playCorrect, playIncorrect]);

  useEffect(() => {
    if (gameState?.endTime) playGameOver();
  }, [gameState?.endTime, playGameOver]);

  /** Start game once loaded */
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
    if (wordCount === 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const timeElapsed = (gameState.endTime - gameState.startTime) / 1000;

      const response = await apiService.submitScore({
        userId: user._id || '',
        mode: gameState.mode,
        timeElapsed,
        correctChars: gameState.correctChars,
        incorrectChars: gameState.incorrectChars,
        seed: gameState.seed,
        wordCount,
        timedDuration: duration,
      });

      setResult(response);
    } catch (error) {
      console.error('Failed to submit score:', error);
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
        (letter: string, i: number) =>
          letter === key && !selectedIndexes.includes(i)
      );

      if (index !== -1) {
        selectLetter(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isGameActive,
    gameState?.endTime,
    scrambledLetters,
    selectedIndexes,
    selectLetter,
    removeLastLetter,
  ]);

  /** Loading state */
  if (loading || !gameState) {
    return <div className="loading">Loading game...</div>;
  }

  /** END SCREEN */
  if (gameState.endTime) {
    const totalTime = (gameState.endTime - gameState.startTime!) / 1000;
    const wpm = gameState.correctChars / 5 / (totalTime / 60);
    const accuracy =
      gameState.correctChars + gameState.incorrectChars > 0
        ? (gameState.correctChars /
            (gameState.correctChars + gameState.incorrectChars)) *
          100
        : 0;

    // Calculate average attempts and time per word
    const avgAttempts = wordStats.length > 0
      ? wordStats.reduce((sum, w) => sum + w.attempts, 0) / wordStats.length
      : 0;
    const avgTimePerWord = wordStats.length > 0
      ? wordStats.reduce((sum, w) => sum + (w.timeToSolve || 0), 0) / wordStats.length / 1000
      : 0;

    return (
      <div className="game-complete">
        <h2 className="end-title">time's up</h2>

        <div className="score-highlight">{gameState.solvedWords.length}</div>

        <div className="stats-grid">
          <div className="stat">
            <span className="stat-label">Words</span>
            <span className="stat-value">{gameState.solvedWords.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">WPM</span>
            <span className="stat-value">{wpm.toFixed(1)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{accuracy.toFixed(0)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Best Combo</span>
            <span className="stat-value">{gameState.maxCombo}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Avg Attempts</span>
            <span className="stat-value">{avgAttempts.toFixed(1)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Avg Time/Word</span>
            <span className="stat-value">{avgTimePerWord.toFixed(1)}s</span>
          </div>
        </div>

        {currentAnswer && (
          <div className="missed-word">
            <span className="label">The word was</span>
            <span className="word">{currentAnswer}</span>
          </div>
        )}

        {result?.isPersonalBest && (
          <div className="personal-best-badge">new personal best</div>
        )}

        {submitError && <div className="submit-error">{submitError}</div>}

        {/* Word lists */}
        <div className="word-lists">
          {wordStats.length > 0 && (
            <div className="word-list solved">
              <h3 className="word-list-title">Words Solved ({wordStats.length})</h3>
              <div className="word-stats-list">
                {wordStats.map((stat, i) => (
                  <div key={i} className="word-stat-item">
                    <span className="word-stat-word">{stat.word}</span>
                    <span className="word-stat-details">
                      {stat.attempts > 1 && (
                        <span className="word-stat-attempts">{stat.attempts} tries</span>
                      )}
                      <span className="word-stat-time">
                        {((stat.timeToSolve || 0) / 1000).toFixed(1)}s
                      </span>
                    </span>
                  </div>
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

        {!user && (
          <div className="signup-prompt">
            <p>Sign up to save your scores!</p>
            <button className="btn-secondary" onClick={() => setShowAuthModal(true)}>
              Sign Up
            </button>
          </div>
        )}

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

        <AdUnit placement="result" format="horizontal" className="ad-h" />

        <div className="actions">
          <button onClick={resetGame} className="btn-primary">
            Play Again
          </button>
        </div>
      </div>
    );
  }

  /** GAME UI */
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
        <div className="timer">
          <span className="timer-label">Time</span>
          <span className="timer-value">{timeRemaining.toFixed(1)}s</span>
        </div>
        <div className="stats-bar">
          <span>Words: {gameState.solvedWords.length}</span>
          <span className={`combo ${lastResult === 'correct' ? 'combo-bump' : ''}`}>
            Combo: {gameState.comboStreak}
          </span>
        </div>
      </div>

      {/* Guess row */}
      <div className={`guess-row ${lastResult ? `result-${lastResult}` : ''}`}>
        {scrambledLetters.map((_: string, i: number) => (
          <div key={i} className="guess-slot">
            {currentGuess[i] ?? ''}
          </div>
        ))}
      </div>

      {/* Letter tiles */}
      <div className="scrambled-row">
        {scrambledLetters.map((letter: string, index: number) => (
          <button
            key={index}
            className={`letter-tile ${
              selectedIndexes.includes(index) ? 'used' : ''
            }`}
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
          onClick={removeLastLetter}
          className="control-button"
          disabled={currentGuess.length === 0}
        >
          ← Backspace
        </button>
        <button
          onClick={clearGuess}
          className="control-button"
          disabled={currentGuess.length === 0}
        >
          Clear
        </button>
        <button
          className="control-button"
          onClick={() => { skipWord(); playSkip(); }}
          disabled={skipCooldownRemaining > 0}
        >
          {skipCooldownRemaining > 0 ? `Skip (-5s) ${skipCooldownRemaining.toFixed(1)}s` : 'Skip (-5s)'}
        </button>
      </div>
    </div>
  );
}
