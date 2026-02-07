interface LegalPageProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: LegalPageProps) {
  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>Terms of Service</h1>
      </div>

      <div className="static-content legal">
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using anaroo ("the Service"), you accept and agree to be
            bound by these Terms of Service. If you do not agree to these terms, please
            do not use the Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            anaroo is a word unscrambling game that allows users to play various game
            modes, track their scores, and compete on leaderboards.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>
            To access certain features, you must create an account with a unique nickname.
            You are responsible for maintaining the confidentiality of your account and
            for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2>4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to cheat, exploit bugs, or manipulate scores</li>
            <li>Use offensive, inappropriate, or misleading nicknames</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned
            by anaroo and are protected by international copyright, trademark, and other
            intellectual property laws.
          </p>
        </section>

        <section>
          <h2>6. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account at any time,
            without prior notice, for conduct that we believe violates these Terms
            or is harmful to other users or the Service.
          </p>
        </section>

        <section>
          <h2>7. Disclaimer</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, either
            express or implied. We do not guarantee that the Service will be
            uninterrupted, secure, or error-free.
          </p>
        </section>

        <section>
          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of
            the Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us through our
            GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}

export function PrivacyPolicy({ onBack }: LegalPageProps) {
  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>Privacy Policy</h1>
      </div>

      <div className="static-content legal">
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Information We Collect</h2>

          <h3>Account Information</h3>
          <p>
            When you create an account, we collect your chosen nickname. We do not
            require or collect email addresses, passwords, or other personal identifiers.
          </p>

          <h3>Game Data</h3>
          <p>
            We collect game statistics including scores, completion times, accuracy,
            and gameplay patterns to provide leaderboards and personal statistics.
          </p>

          <h3>Technical Data</h3>
          <p>
            We may collect technical information such as browser type, device type,
            and general location (country level) for analytics and service improvement.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain the Service</li>
            <li>To display leaderboards and rankings</li>
            <li>To track your personal statistics and progress</li>
            <li>To improve and optimize the Service</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Storage</h2>
          <p>
            Your data is stored securely on our servers. Game statistics are retained
            as long as your account exists. You can delete your account and all
            associated data at any time through the Profile settings.
          </p>
        </section>

        <section>
          <h2>4. Cookies</h2>
          <p>
            We use essential cookies to maintain your session and preferences.
            We also use analytics cookies to understand how the Service is used.
            You can manage cookie preferences through your browser settings.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>
            We may use third-party services for analytics and hosting. These services
            have their own privacy policies governing the use of your information.
          </p>
        </section>

        <section>
          <h2>6. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your data. However,
            no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Delete your account and all associated data</li>
            <li>Export your game statistics</li>
          </ul>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly
            collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2>9. Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            users of any material changes by posting the new policy on this page.
          </p>
        </section>
      </div>
    </div>
  );
}

export function SecurityPolicy({ onBack }: LegalPageProps) {
  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>Security Policy</h1>
      </div>

      <div className="static-content legal">
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>Our Commitment to Security</h2>
          <p>
            We take the security of your data seriously. This document outlines
            our security practices and how to report vulnerabilities.
          </p>
        </section>

        <section>
          <h2>Security Measures</h2>
          <ul>
            <li><strong>Encryption</strong> - All data is transmitted over HTTPS</li>
            <li><strong>Authentication</strong> - Secure token-based authentication</li>
            <li><strong>Data Protection</strong> - Database access is restricted and monitored</li>
            <li><strong>Regular Updates</strong> - Dependencies are regularly updated</li>
          </ul>
        </section>

        <section>
          <h2>Reporting Vulnerabilities</h2>
          <p>
            If you discover a security vulnerability, please report it responsibly:
          </p>
          <ol>
            <li>
              <strong>Do not</strong> publicly disclose the vulnerability
            </li>
            <li>
              Report the issue through our{' '}
              <a href="https://github.com/adtommo/anaroo/security" target="_blank" rel="noopener noreferrer">
                GitHub Security Advisories
              </a>
            </li>
            <li>
              Provide detailed information about the vulnerability
            </li>
            <li>
              Allow reasonable time for us to address the issue
            </li>
          </ol>
        </section>

        <section>
          <h2>What We Don't Store</h2>
          <ul>
            <li>Passwords (we use passwordless authentication)</li>
            <li>Payment information (we don't process payments)</li>
            <li>Email addresses (not required for registration)</li>
            <li>Precise location data</li>
          </ul>
        </section>

        <section>
          <h2>Account Security Tips</h2>
          <ul>
            <li>Use a unique nickname that doesn't reveal personal information</li>
            <li>Log out when using shared devices</li>
            <li>Keep your browser updated</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export function Contact({ onBack }: LegalPageProps) {
  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>Contact Us</h1>
      </div>

      <div className="static-content">
        <section>
          <h2>Get in Touch</h2>
          <p>
            We'd love to hear from you! Here are the best ways to reach us:
          </p>
        </section>

        <section>
          <h2>Bug Reports & Feature Requests</h2>
          <p>
            Found a bug or have a feature idea? Please open an issue on our GitHub:
          </p>
          <a
            href="https://github.com/adtommo/anaroo/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            GitHub Issues
          </a>
        </section>

        <section>
          <h2>Security Concerns</h2>
          <p>
            For security-related issues, please use GitHub's security advisory feature:
          </p>
          <a
            href="https://github.com/adtommo/anaroo/security"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            Report a Vulnerability
          </a>
        </section>

        <section>
          <h2>General Inquiries</h2>
          <p>
            For general questions or feedback, you can start a discussion on GitHub:
          </p>
          <a
            href="https://github.com/adtommo/anaroo/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            GitHub Discussions
          </a>
        </section>

        <section>
          <h2>Social</h2>
          <p>
            Follow the project on GitHub to stay updated with the latest changes
            and releases.
          </p>
          <a
            href="https://github.com/adtommo/anaroo"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            GitHub Repository
          </a>
        </section>
      </div>
    </div>
  );
}
