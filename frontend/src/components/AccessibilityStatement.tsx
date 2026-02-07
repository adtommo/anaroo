interface AccessibilityStatementProps {
  onBack: () => void;
}

export function AccessibilityStatement({ onBack }: AccessibilityStatementProps) {
  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={onBack} className="btn-back" aria-label="Go back to previous page">
          ← Back
        </button>
        <h1>Accessibility Statement</h1>
      </div>

      <div className="static-content">
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>Our Commitment</h2>
          <p>
            anaroo is committed to ensuring digital accessibility for people with disabilities.
            We continually improve the user experience for everyone and apply relevant
            accessibility standards to make our game enjoyable for all players.
          </p>
        </section>

        <section>
          <h2>Conformance Status</h2>
          <p>
            We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at
            Level AA. These guidelines explain how to make web content more accessible for
            people with disabilities and more user-friendly for everyone.
          </p>
        </section>

        <section>
          <h2>Accessibility Features</h2>

          <div className="accessibility-features">
            <div className="a11y-feature">
              <h4>Keyboard Navigation</h4>
              <p>
                All game controls and interface elements can be accessed and operated
                using only a keyboard. Use Tab to navigate and Enter/Space to activate.
              </p>
            </div>

            <div className="a11y-feature">
              <h4>Focus Indicators</h4>
              <p>
                Clear, visible focus indicators help you see which element is currently
                selected when navigating with a keyboard.
              </p>
            </div>

            <div className="a11y-feature">
              <h4>Skip Links</h4>
              <p>
                A "Skip to main content" link appears when you start tabbing, allowing
                keyboard users to bypass navigation and jump directly to the game.
              </p>
            </div>

            <div className="a11y-feature">
              <h4>Color Contrast</h4>
              <p>
                Text and interactive elements meet WCAG AA contrast requirements to
                ensure readability for users with low vision or color blindness.
              </p>
            </div>

            <div className="a11y-feature">
              <h4>Reduced Motion</h4>
              <p>
                Animations are reduced or disabled when you have "reduce motion"
                enabled in your system preferences.
              </p>
            </div>

            <div className="a11y-feature">
              <h4>Screen Reader Support</h4>
              <p>
                Important game information and status updates are announced to
                screen readers using ARIA live regions.
              </p>
            </div>

            <div className="a11y-feature">
              <h4>Responsive Design</h4>
              <p>
                The interface adapts to different screen sizes and supports zooming
                up to 200% without loss of content or functionality.
              </p>
            </div>

            <div className="a11y-feature">
              <h4>High Contrast Mode</h4>
              <p>
                Enhanced colors and borders are applied when high contrast mode
                is enabled in your system preferences.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Keyboard Shortcuts</h2>
          <p>The following keyboard shortcuts are available during gameplay:</p>
          <ul>
            <li><strong>Letter keys (A-Z)</strong> — Type letters to build your guess</li>
            <li><strong>Backspace</strong> — Remove the last letter from your guess</li>
            <li><strong>Enter</strong> — Submit your guess</li>
            <li><strong>Escape</strong> — Close modals and dialogs</li>
            <li><strong>Tab</strong> — Navigate between interactive elements</li>
            <li><strong>Space/Enter</strong> — Activate buttons and links</li>
          </ul>
        </section>

        <section>
          <h2>Known Limitations</h2>
          <p>
            While we strive for full accessibility, some aspects of the game may present
            challenges:
          </p>
          <ul>
            <li>
              <strong>Timed modes</strong> — The countdown timer creates time pressure that
              may be challenging for some users. Consider using the Daily mode which
              has no time limit.
            </li>
            <li>
              <strong>Word scrambles</strong> — The core game mechanic requires visual
              recognition of scrambled letters. We're exploring audio alternatives for
              future updates.
            </li>
          </ul>
        </section>

        <section>
          <h2>Assistive Technologies</h2>
          <p>anaroo has been tested with the following assistive technologies:</p>
          <ul>
            <li>VoiceOver on macOS and iOS</li>
            <li>NVDA on Windows</li>
            <li>Keyboard-only navigation</li>
            <li>Browser zoom up to 200%</li>
          </ul>
        </section>

        <section>
          <h2>Feedback</h2>
          <p>
            We welcome your feedback on the accessibility of anaroo. If you encounter
            any accessibility barriers or have suggestions for improvement, please let
            us know:
          </p>
          <ul>
            <li>
              Open an issue on our{' '}
              <a
                href="https://github.com/adtommo/anaroo/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository
              </a>
            </li>
            <li>
              Start a discussion in our{' '}
              <a
                href="https://github.com/adtommo/anaroo/discussions"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Discussions
              </a>
            </li>
          </ul>
          <p>
            We try to respond to accessibility feedback within 5 business days and aim
            to resolve accessibility issues promptly.
          </p>
        </section>

        <section>
          <h2>Compatibility</h2>
          <p>
            anaroo is designed to be compatible with the following browsers and
            assistive technologies:
          </p>
          <ul>
            <li>Chrome, Firefox, Safari, and Edge (latest versions)</li>
            <li>Screen readers: VoiceOver, NVDA, JAWS</li>
            <li>Voice control software</li>
            <li>Screen magnification software</li>
          </ul>
        </section>

        <section>
          <h2>Technical Specifications</h2>
          <p>
            The accessibility of anaroo relies on the following technologies:
          </p>
          <ul>
            <li>HTML5</li>
            <li>WAI-ARIA</li>
            <li>CSS</li>
            <li>JavaScript</li>
          </ul>
          <p>
            These technologies are relied upon for conformance with the accessibility
            standards used.
          </p>
        </section>
      </div>
    </div>
  );
}
