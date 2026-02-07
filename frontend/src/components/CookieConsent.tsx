import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'anaroo_cookie_consent';

interface CookiePreferences {
  essential: boolean; // Always true, required for the site to work
  analytics: boolean;
  accepted: boolean;
}

function loadConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function saveConsent(preferences: CookiePreferences): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore errors
  }
}

interface CookieConsentProps {
  onOpenPrivacy: () => void;
  forceOpen?: boolean;
  onClose?: () => void;
}

export function CookieConsent({ onOpenPrivacy, forceOpen, onClose }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    if (forceOpen) {
      // Load current preferences when opening settings
      const consent = loadConsent();
      setAnalytics(consent?.analytics ?? true);
      setShowSettings(true);
      setVisible(true);
      return;
    }

    const consent = loadConsent();
    if (!consent?.accepted) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setVisible(false);
    setShowSettings(false);
    onClose?.();
  };

  const handleAcceptAll = () => {
    const preferences: CookiePreferences = {
      essential: true,
      analytics: true,
      accepted: true,
    };
    saveConsent(preferences);
    handleClose();
  };

  const handleAcceptSelected = () => {
    const preferences: CookiePreferences = {
      essential: true,
      analytics,
      accepted: true,
    };
    saveConsent(preferences);
    handleClose();
  };

  const handleRejectNonEssential = () => {
    const preferences: CookiePreferences = {
      essential: true,
      analytics: false,
      accepted: true,
    };
    saveConsent(preferences);
    handleClose();
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        {!showSettings ? (
          <>
            <div className="cookie-text">
              <h3>Cookie Notice</h3>
              <p>
                We use cookies to enhance your experience. Essential cookies are required
                for the site to function. Analytics cookies help us improve the service.
                <button className="cookie-link" onClick={onOpenPrivacy}>
                  Learn more
                </button>
              </p>
            </div>
            <div className="cookie-actions">
              <button className="btn-cookie-settings" onClick={() => setShowSettings(true)}>
                Customize
              </button>
              <button className="btn-cookie-reject" onClick={handleRejectNonEssential}>
                Reject All
              </button>
              <button className="btn-cookie-accept" onClick={handleAcceptAll}>
                Accept All
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cookie-text">
              <h3>Cookie Preferences</h3>
            </div>
            <div className="cookie-settings">
              <label className="cookie-option">
                <input type="checkbox" checked disabled />
                <div className="cookie-option-info">
                  <span className="cookie-option-name">Essential Cookies</span>
                  <span className="cookie-option-desc">
                    Required for the site to function. Cannot be disabled.
                  </span>
                </div>
              </label>
              <label className="cookie-option">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <div className="cookie-option-info">
                  <span className="cookie-option-name">Analytics Cookies</span>
                  <span className="cookie-option-desc">
                    Help us understand how the site is used to improve it.
                  </span>
                </div>
              </label>
            </div>
            <div className="cookie-actions">
              <button className="btn-cookie-settings" onClick={() => setShowSettings(false)}>
                Back
              </button>
              <button className="btn-cookie-accept" onClick={handleAcceptSelected}>
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Hook to check cookie consent status
export function useCookieConsent(): CookiePreferences {
  const [consent, setConsent] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    accepted: false,
  });

  useEffect(() => {
    const stored = loadConsent();
    if (stored) {
      setConsent(stored);
    }
  }, []);

  return consent;
}
