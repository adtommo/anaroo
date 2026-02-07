interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>About anaroo</h1>
      </div>

      <div className="static-content">
        <section>
          <h2>What is anaroo?</h2>
          <p>
            anaroo is a fast-paced word unscrambling game designed to challenge your
            vocabulary and quick thinking. Race against the clock to unscramble words
            and climb the leaderboards.
          </p>
        </section>

        <section>
          <h2>Game Modes</h2>

          <h3>Daily</h3>
          <p>
            One word per day, shared by everyone. Complete it as fast as you can and
            compare your time with players worldwide. Build your streak by playing
            every day!
          </p>

          <h3>Timed Mode</h3>
          <p>
            Solve as many words as possible within the time limit. Choose from 30,
            60, or 120 second challenges. Build combos by solving consecutive words
            correctly.
          </p>

          <h3>Infinite Survival</h3>
          <p>
            The ultimate endurance test. Each word has a time limit that decreases
            as you progress. Wrong answers cost you time. How long can you survive?
          </p>
        </section>

        <section>
          <h2>Features</h2>
          <ul>
            <li><strong>Multiple Languages</strong> - Play in English, Spanish, French, or German</li>
            <li><strong>Difficulty Levels</strong> - Choose Easy, Medium, or Hard word sets</li>
            <li><strong>XP & Levels</strong> - Earn experience and level up as you play</li>
            <li><strong>Leaderboards</strong> - Compete globally and daily</li>
            <li><strong>Streaks</strong> - Track your daily playing streak</li>
            <li><strong>Themes</strong> - Customize the look with different color themes</li>
          </ul>
        </section>

        <section>
          <h2>Tips</h2>
          <ul>
            <li>Look for common letter patterns and prefixes/suffixes</li>
            <li>Use keyboard input for faster gameplay</li>
            <li>In Daily, hints are available but add time penalties</li>
            <li>Build combos in Timed mode for bonus points</li>
          </ul>
        </section>

        <section>
          <h2>Open Source</h2>
          <p>
            anaroo is open source! Check out the code, report issues, or contribute
            on{' '}
            <a href="https://github.com/adtommo/anaroo" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>.
          </p>
        </section>

        <section>
          <h2>Credits</h2>
          <p>
            Built with React, TypeScript, and Node.js. Inspired by games like
            Wordle and MonkeyType.
          </p>
        </section>
      </div>
    </div>
  );
}
