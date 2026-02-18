import { GameMode, TimedDuration, GAME_MODES, TIMED_DURATIONS } from '@anaroo/shared';
import { useGameSettings, Difficulty } from '../contexts/GameSettingsContext';
import { JSX } from 'react';

interface GameSelectorProps {
  selectedMode: GameMode;
  selectedDuration: TimedDuration;
  onModeChange: (mode: GameMode) => void;
  onDurationChange: (duration: TimedDuration) => void;
  onStartGame: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'easy' },
  { value: 'medium', label: 'medium' },
  { value: 'hard', label: 'hard' },
];

const MODE_ICONS: Record<GameMode, JSX.Element> = {
  [GameMode.DAILY]: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
      <circle cx="12" cy="15" r="2"/>
    </svg>
  ),
  [GameMode.TIMED]: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
      <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  ),
  [GameMode.INFINITE_SURVIVAL]: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
      <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"/>
    </svg>
  ),
};

export function GameSelector({
  selectedMode,
  selectedDuration,
  onModeChange,
  onDurationChange,
  onStartGame,
}: GameSelectorProps) {
  const { settings, setDifficulty } = useGameSettings();

  const showDuration = selectedMode === GameMode.TIMED;
  const showDifficulty = selectedMode !== GameMode.DAILY;

  const modes = [GameMode.DAILY, GameMode.TIMED, GameMode.INFINITE_SURVIVAL] as const;

  return (
    <div className="game-selector">
      {/* Game Mode Cards */}
      <div className="game-cards">
        {modes.map((mode) => (
          <button
            key={mode}
            className={`game-card ${selectedMode === mode ? 'selected' : ''}`}
            onClick={() => onModeChange(mode)}
          >
            <div className="game-card-icon">
              {MODE_ICONS[mode]}
            </div>
            <div className="game-card-content">
              <h3 className="game-card-title">{GAME_MODES[mode].name}</h3>
              <p className="game-card-description">{GAME_MODES[mode].description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Settings Panel */}
      <div className="game-settings-panel">
        {/* Difficulty */}
        {showDifficulty && (
          <div className="settings-row">
            <span className="settings-label">difficulty</span>
            <div className="settings-options">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.value}
                  className={`settings-button ${settings.difficulty === diff.value ? 'active' : ''}`}
                  onClick={() => setDifficulty(diff.value)}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duration (Timed mode only) */}
        {showDuration && (
          <div className="settings-row">
            <span className="settings-label">duration</span>
            <div className="settings-options">
              {([TimedDuration.THIRTY, TimedDuration.SIXTY, TimedDuration.ONE_TWENTY] as TimedDuration[]).map((duration) => (
                <button
                  key={duration}
                  className={`settings-button ${selectedDuration === duration ? 'active' : ''}`}
                  onClick={() => onDurationChange(duration)}
                >
                  {TIMED_DURATIONS[duration].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Start Button */}
      <button onClick={onStartGame} className="btn-start">
        play
      </button>
    </div>
  );
}
