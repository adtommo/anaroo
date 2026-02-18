import { useEffect, useRef } from 'react';
import { useAds, AdPlacement } from '../contexts/AdContext';

interface AdUnitProps {
  placement: AdPlacement;
  format?: string;
  responsive?: boolean;
  className?: string;
}

const AD_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-XXXXXXX';

const SLOT_MAP: Record<AdPlacement, string> = {
  result: 'GAME_RESULT',
  sidebar: 'SIDEBAR',
  sellout: 'SELLOUT',
};

export function AdUnit({ placement, format = 'auto', responsive = true, className }: AdUnitProps) {
  const { shouldShow, adBlocked } = useAds();
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    if (!shouldShow(placement) || adBlocked) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded or ad-blocker active
    }
  }, [placement, adBlocked, shouldShow]);

  if (!shouldShow(placement)) return null;

  if (adBlocked && placement === 'result') {
    return (
      <div className={`ad-blocker-message ${className || ''}`}>
        <p>Using an ad blocker? No worries.</p>
        <p>You can disable ads in your profile settings.</p>
      </div>
    );
  }

  if (adBlocked) return null;

  return renderAdSense(SLOT_MAP[placement], format, responsive, className);
}

function renderAdSense(slot: string, format: string, responsive: boolean, className?: string) {
  const isDev = import.meta.env.DEV;
  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(isDev ? { "data-adtest": "on" } : {})}
      />
    </div>
  );
}
