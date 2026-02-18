import { useEffect, useState } from 'react';
import { SubmitScoreResponse } from '@anaroo/shared';
import { useDaily } from '../hooks/useDaily';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../hooks/useSound';
import { apiService } from '../services/api';
import { AuthModal } from './AuthModal';
import { AdUnit } from './AdUnit';

const DAILY_COMPLETION_KEY = 'anaroo_daily_completion';

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLocalDailyCompletion(): { completed: boolean; timeElapsed?: number; word?: string } {
  try {
    const raw = localStorage.getItem(DAILY_COMPLETION_KEY);
    if (!raw) return { completed: false };
    const data = JSON.parse(raw);
    if (data.date === getTodayUTC()) {
      return { completed: true, timeElapsed: data.timeElapsed, word: data.word };
    }
    return { completed: false };
  } catch {
    return { completed: false };
  }
}

function saveLocalDailyCompletion(timeElapsed: number, word: string): void {
  localStorage.setItem(
    DAILY_COMPLETION_KEY,
    JSON.stringify({ date: getTodayUTC(), timeElapsed, word })
  );
}

export function Daily() {
  const { user, loading: authLoading } = useAuth();
  const { playCorrect } = useSound();
  const [challenge, setChallenge] = useState<{
    _id?: string;
    date: string;
    letterCount: number;
    scrambled: string;
    seed: string;
    createdAt: Date;
  } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [previousTime, setPreviousTime] = useState<number | null>(null);
  const [previousWord, setPreviousWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitScoreResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  /** Load daily challenge (re-run when auth resolves) */
  useEffect(() => {
    if (authLoading) return;
    loadChallenge();
  }, [authLoading, user?._id]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const [challengeData, statusData] = await Promise.all([
        apiService.getTodayChallenge(),
        user
          ? apiService.getDailyStatus()
          : Promise.resolve(getLocalDailyCompletion()),
      ]);

      setChallenge(challengeData);
      setCompleted(statusData.completed);
      if (statusData.timeElapsed) setPreviousTime(statusData.timeElapsed);
      if (statusData.word) setPreviousWord(statusData.word);
    } catch (err) {
      console.error('Failed to load daily challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const {
    gameState,
    isGameActive,
    scrambledLetters,
    selectedIndexes,
    revealedTileIndexes,
    answer,
    buildAnswerWithReveals,
    selectLetter,
    removeLastLetter,
    clearGuess,
    revealLetter,
    canReveal,
    secondsUntilReveal,
    config,
    startGame,
  } = useDaily(
    challenge?.scrambled || '',
    challenge?.seed || '',
    challenge?.letterCount || 0
  );

  /** Start game once challenge is loaded */
  useEffect(() => {
    if (challenge && !completed && !loading) {
      startGame();
    }
  }, [challenge, completed, loading]);

  /** Timer - update elapsed time every 100ms */
  useEffect(() => {
    if (!isGameActive || !gameState.startTime || gameState.endTime) return;

    const interval = setInterval(() => {
      setElapsedTime((Date.now() - gameState.startTime!) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [isGameActive, gameState.startTime, gameState.endTime]);

  /** Sound on solve */
  useEffect(() => {
    if (gameState.endTime) playCorrect();
  }, [gameState.endTime, playCorrect]);

  /** Submit score on end */
  useEffect(() => {
    if (
      gameState.endTime &&
      user &&
      !submitting &&
      !result &&
      !completed &&
      challenge
    ) {
      submitScore();
    }
  }, [gameState.endTime, user, submitting, result, completed, challenge]);

  /** Save completion locally for anonymous users */
  useEffect(() => {
    if (gameState.endTime && gameState.startTime && !user && answer) {
      const rawTime = (gameState.endTime - gameState.startTime) / 1000;
      const finalTime = rawTime + gameState.timePenalty;
      saveLocalDailyCompletion(finalTime, answer);
      setCompleted(true);
      setPreviousTime(finalTime);
      setPreviousWord(answer);
    }
  }, [gameState.endTime, gameState.startTime, user, answer]);

  const submitScore = async () => {
    if (!user || !gameState.startTime || !gameState.endTime || !challenge) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const rawTime = (gameState.endTime - gameState.startTime) / 1000;
      const finalTime = rawTime + gameState.timePenalty;

      const response = await apiService.submitScore({
        userId: user._id || '',
        mode: gameState.mode,
        timeElapsed: finalTime,
        correctChars: gameState.correctChars,
        incorrectChars: gameState.incorrectChars,
        seed: challenge.seed,
        wordCount: 1,
        revealsUsed: gameState.revealsUsed,
        timePenalty: gameState.timePenalty,
      });

      setResult(response);
      setCompleted(true);
    } catch (err) {
      console.error('Failed to submit daily score:', err);
      setSubmitError('Failed to submit score. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /** Keyboard support */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive || gameState.endTime || completed) return;

      // Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        removeLastLetter();
        return;
      }

      // Letters only
      if (!/^[a-zA-Z]$/.test(e.key)) return;

      const key = e.key.toLowerCase();
      const index = scrambledLetters.findIndex(
        (letter, i) =>
          letter === key && !selectedIndexes.includes(i) && !revealedTileIndexes.includes(i)
      );

      if (index !== -1) selectLetter(index);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isGameActive,
    gameState.endTime,
    completed,
    scrambledLetters,
    selectedIndexes,
    revealedTileIndexes,
    selectLetter,
    removeLastLetter,
  ]);

  /** Loading / error states */
  if (loading) return <div className="loading">Loading daily…</div>;
  if (!challenge) return <div className="error">Failed to load daily challenge</div>;
  if (completed && !result) {
    return (
      <div className="game-complete">
        <h2 className="end-title">daily complete</h2>

        {previousTime && (
          <div className="score-highlight">{previousTime.toFixed(1)}s</div>
        )}

        {previousWord && (
          <div className="missed-word">
            <span className="label">Today's Word</span>
            <span className="word">{previousWord}</span>
          </div>
        )}

        <p className="come-back-text">Come back tomorrow for a new word!</p>
      </div>
    );
  }

  /** End screen - show when game ends, regardless of submit status */
  if (gameState.endTime && gameState.startTime) {
    const rawTime = (gameState.endTime - gameState.startTime) / 1000;
    const finalTime = rawTime + gameState.timePenalty;

    return (
      <div className="game-complete">
        <h2 className="end-title">daily complete</h2>

        <div className="score-highlight">{finalTime.toFixed(1)}s</div>

        <div className="stats-grid">
          <div className="stat">
            <span className="stat-label">Raw Time</span>
            <span className="stat-value">{rawTime.toFixed(1)}s</span>
          </div>

          <div className="stat">
            <span className="stat-label">Hints Used</span>
            <span className="stat-value">{gameState.revealsUsed}</span>
          </div>

          <div className="stat">
            <span className="stat-label">Penalty</span>
            <span className="stat-value">+{gameState.timePenalty}s</span>
          </div>
        </div>

        <div className="missed-word">
          <span className="label">Today's Word</span>
          <span className="word">{answer}</span>
        </div>

        {submitting && <div className="submitting">Saving score...</div>}
        {submitError && <div className="submit-error">{submitError}</div>}

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
          <button className="btn-primary" disabled>
            Come Back Tomorrow
          </button>
        </div>
      </div>
    );
  }

  /** In-game UI (Wordle-style like TimedMode) */
  const displayAnswer = buildAnswerWithReveals();

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <div className="timer">
          <span className="timer-value">{elapsedTime.toFixed(1)}s</span>
          {gameState.timePenalty > 0 && (
            <span className="timer-penalty">+{gameState.timePenalty}s</span>
          )}
        </div>
      </div>

      {/* Guess row */}
      <div className="guess-row">
        {scrambledLetters.map((_, i) => {
          const isRevealed = gameState.revealedLetters.includes(i);
          return (
            <div key={i} className={`guess-slot ${isRevealed ? 'revealed' : ''}`}>
              {displayAnswer[i] ?? ''}
            </div>
          );
        })}
      </div>

      {/* Scrambled letters */}
      <div className="scrambled-row">
        {scrambledLetters.map((letter, index) => {
          const isSelected = selectedIndexes.includes(index);
          const isRevealed = revealedTileIndexes.includes(index);
          const isUsed = isSelected || isRevealed;
          return (
            <button
              key={index}
              className={`letter-tile ${isUsed ? 'used' : ''} ${isRevealed ? 'revealed' : ''}`}
              onClick={() => selectLetter(index)}
              disabled={isUsed}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="game-controls">
        <button
          className="control-button"
          onClick={removeLastLetter}
          disabled={displayAnswer.replace(/_/g, '').length === 0}
        >
          ← Backspace
        </button>
        <button
          className="control-button"
          onClick={clearGuess}
          disabled={displayAnswer.replace(/_/g, '').length === 0}
        >
          Clear
        </button>
      </div>

      {/* Footer: hint/reveal button */}
      {config.hintsEnabled && (
        <div className="game-footer">
          <button
            className="btn-secondary"
            onClick={revealLetter}
            disabled={!canReveal || gameState.endTime !== null}
          >
            {canReveal
              ? `reveal (+${config.revealPenaltySeconds}s)`
              : secondsUntilReveal
              ? `Next hint in ${secondsUntilReveal}s`
              : 'Hints locked'}
          </button>
        </div>
      )}
    </div>
  );
}
