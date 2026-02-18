import { useGameSettings, Difficulty } from '../contexts/GameSettingsContext';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function SettingsPicker() {
  const { settings, setDifficulty } = useGameSettings();

  return (
    <div className="settings-picker">
      <div className="settings-row">
        <div className="setting-group">
          <span className="setting-label">Difficulty</span>
          <div className="setting-options">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.value}
                className={`setting-option ${settings.difficulty === diff.value ? 'active' : ''}`}
                onClick={() => setDifficulty(diff.value)}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
