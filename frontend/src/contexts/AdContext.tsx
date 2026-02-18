import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AdLevel = 'off' | 'result' | 'on' | 'sellout';
export type AdPlacement = 'result' | 'sidebar' | 'sellout';

const STORAGE_KEY = 'anaroo_ad_preference';
const DEFAULT_LEVEL: AdLevel = 'on';

interface AdContextType {
  adLevel: AdLevel;
  setAdLevel: (level: AdLevel) => void;
  adBlocked: boolean;
  shouldShow: (placement: AdPlacement) => boolean;
}

const AdContext = createContext<AdContextType | null>(null);

function loadAdLevel(): AdLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['off', 'result', 'on', 'sellout'].includes(stored)) {
      return stored as AdLevel;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LEVEL;
}

export function AdProvider({ children }: { children: ReactNode }) {
  const [adLevel, setAdLevelState] = useState<AdLevel>(loadAdLevel);
  const [adBlocked, setAdBlocked] = useState(false);

  const setAdLevel = (level: AdLevel) => {
    setAdLevelState(level);
    try {
      localStorage.setItem(STORAGE_KEY, level);
    } catch {
      // localStorage unavailable
    }
  };

  // Ad-blocker detection: check if AdSense script loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window.adsbygoogle === 'undefined') {
        setAdBlocked(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const shouldShow = (placement: AdPlacement): boolean => {
    if (adLevel === 'off') return false;
    if (adLevel === 'result') return placement === 'result';
    if (adLevel === 'on') return placement === 'result' || placement === 'sidebar';
    // sellout: show everything
    return true;
  };

  return (
    <AdContext.Provider value={{ adLevel, setAdLevel, adBlocked, shouldShow }}>
      {children}
    </AdContext.Provider>
  );
}

const DEFAULT_AD_CONTEXT: AdContextType = {
  adLevel: 'on',
  setAdLevel: () => {},
  adBlocked: false,
  shouldShow: () => false,
};

export function useAds() {
  const ctx = useContext(AdContext);
  return ctx ?? DEFAULT_AD_CONTEXT;
}
