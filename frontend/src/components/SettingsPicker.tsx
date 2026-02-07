import { useGameSettings, Language, Difficulty } from '../contexts/GameSettingsContext';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function SettingsPicker() {
  const { settings, setLanguage, setDifficulty } = useGameSettings();

  return (
    <div className="settings-picker">
      <div className="settings-row">
        <div className="setting-group">
          <span className="setting-label">Language</span>
          <div className="setting-options">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                className={`setting-option ${settings.language === lang.value ? 'active' : ''}`}
                onClick={() => setLanguage(lang.value)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

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
