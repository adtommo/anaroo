import { GameMode, TimedDuration, GAME_MODES, TIMED_DURATIONS } from '@anaroo/shared';

interface ModePickerProps {
  selectedMode: GameMode;
  selectedDuration: TimedDuration;
  onModeChange: (mode: GameMode) => void;
  onDurationChange: (duration: TimedDuration) => void;
}

export function ModePicker({
  selectedMode,
  selectedDuration,
  onModeChange,
  onDurationChange,
}: ModePickerProps) {
  return (
    <div className="mode-picker">
      {/* Mode Selection */}
      <div className="mode-selector">
        <button
          className={`mode-button ${selectedMode === GameMode.DAILY ? 'active' : ''}`}
          onClick={() => onModeChange(GameMode.DAILY)}
        >
          {GAME_MODES[GameMode.DAILY].name}
        </button>

        <button
          className={`mode-button ${selectedMode === GameMode.TIMED ? 'active' : ''}`}
          onClick={() => onModeChange(GameMode.TIMED)}
        >
          {GAME_MODES[GameMode.TIMED].name}
        </button>

        <button
          className={`mode-button ${selectedMode === GameMode.INFINITE_SURVIVAL ? 'active' : ''}`}
          onClick={() => onModeChange(GameMode.INFINITE_SURVIVAL)}
        >
          {GAME_MODES[GameMode.INFINITE_SURVIVAL].name}
        </button>
      </div>

      {/* Duration Selection (only for Timed mode) */}
      {selectedMode === GameMode.TIMED && (
        <div className="duration-selector">
          <button
            className={`duration-button ${selectedDuration === TimedDuration.THIRTY ? 'active' : ''}`}
            onClick={() => onDurationChange(TimedDuration.THIRTY)}
          >
            {TIMED_DURATIONS[TimedDuration.THIRTY].label}
          </button>
          <button
            className={`duration-button ${selectedDuration === TimedDuration.SIXTY ? 'active' : ''}`}
            onClick={() => onDurationChange(TimedDuration.SIXTY)}
          >
            {TIMED_DURATIONS[TimedDuration.SIXTY].label}
          </button>
          <button
            className={`duration-button ${selectedDuration === TimedDuration.ONE_TWENTY ? 'active' : ''}`}
            onClick={() => onDurationChange(TimedDuration.ONE_TWENTY)}
          >
            {TIMED_DURATIONS[TimedDuration.ONE_TWENTY].label}
          </button>
        </div>
      )}

      {/* Mode Description */}
      <div className="mode-description">
        {GAME_MODES[selectedMode].description}
      </div>
    </div>
  );
}