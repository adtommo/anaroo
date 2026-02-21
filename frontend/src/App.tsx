import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { GameMode, TimedDuration, GAME_MODES } from '@anaroo/shared';
import { useAuth } from './contexts/AuthContext';
import { useGameSettings } from './contexts/GameSettingsContext';
import { GameSelector } from './components/GameSelector';
import { Daily } from './components/Daily';
import { TimedMode } from './components/TimedMode';
import { InfiniteSurvival } from './components/InfiniteSurvival';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { About } from './components/About';
import { TermsOfService, PrivacyPolicy, SecurityPolicy, Contact } from './components/LegalPages';

import { AccessibilityStatement } from './components/AccessibilityStatement';
import { NotFound } from './components/NotFound';
import { PublicProfile } from './components/PublicProfile';
import { ProfileAvatar } from './components/ProfileAvatar';
import { GameDemo } from './components/GameDemo';
import { AdUnit } from './components/AdUnit';
import './App.scss';
import { RooLogo } from './components/RooLogo';

/* -----------------------------
 * Page Components
 * ----------------------------- */

function MenuPage() {
  const navigate = useNavigate();
  const { settings } = useGameSettings();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.DAILY);
  const [selectedDuration, setSelectedDuration] = useState<TimedDuration>(TimedDuration.SIXTY);

  const handleStartGame = () => {
    const params = new URLSearchParams({
      mode: selectedMode,
      duration: selectedDuration.toString(),
      difficulty: settings.difficulty,
    });
    navigate(`/play?${params.toString()}`);
  };

  return (
    <div className="menu">
      <GameDemo />

      <GameSelector
        selectedMode={selectedMode}
        selectedDuration={selectedDuration}
        onModeChange={setSelectedMode}
        onDurationChange={setSelectedDuration}
        onStartGame={handleStartGame}
      />
    </div>
  );
}

function SoundToggle() {
  const { settings, setSoundEnabled } = useGameSettings();
  return (
    <button
      className="btn-sound-toggle"
      onClick={() => setSoundEnabled(!settings.soundEnabled)}
      title={settings.soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
      aria-label={settings.soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
    >
      {settings.soundEnabled ? (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      )}
    </button>
  );
}

function GamePage() {
  const navigate = useNavigate();
  const { settings } = useGameSettings();
  const searchParams = new URLSearchParams(window.location.search);

  const mode = (searchParams.get('mode') as GameMode) || GameMode.TIMED;
  const duration = (parseInt(searchParams.get('duration') || '60', 10) as TimedDuration) || TimedDuration.SIXTY;
  const difficulty = searchParams.get('difficulty') || settings.difficulty;

  const renderGameMode = () => {
    switch (mode) {
      case GameMode.DAILY:
        return <Daily />;
      case GameMode.TIMED:
        return (
          <TimedMode
            duration={duration}
            difficulty={difficulty}
          />
        );
      case GameMode.INFINITE_SURVIVAL:
        return (
          <InfiniteSurvival
            difficulty={difficulty}
          />
        );
      default:
        return <div>Mode not implemented</div>;
    }
  };

  return (
    <div className="game-view">
      <div className="game-header-bar">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back
        </button>
        <h2>{GAME_MODES[mode]?.name || 'Game'}</h2>
        <SoundToggle />
      </div>

      {renderGameMode()}
    </div>
  );
}

function LeaderboardPage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.DAILY);
  const [leaderboardType, setLeaderboardType] = useState<'daily' | 'global'>('daily');
  const [selectedDuration, setSelectedDuration] = useState<TimedDuration>(TimedDuration.SIXTY);

  return (
    <div className="leaderboard-view">
      <div className="leaderboard-header-bar">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back
        </button>
        <h2>Leaderboard</h2>
        <div />
      </div>

      <div className="leaderboard-controls">
        <div className="mode-tabs">
          <button
            onClick={() => setSelectedMode(GameMode.DAILY)}
            className={`tab ${selectedMode === GameMode.DAILY ? 'active' : ''}`}
          >
            Daily
          </button>
          <button
            onClick={() => setSelectedMode(GameMode.TIMED)}
            className={`tab ${selectedMode === GameMode.TIMED ? 'active' : ''}`}
          >
            Timed
          </button>
          <button
            onClick={() => setSelectedMode(GameMode.INFINITE_SURVIVAL)}
            className={`tab ${selectedMode === GameMode.INFINITE_SURVIVAL ? 'active' : ''}`}
          >
            Survival
          </button>
        </div>

        <div className="type-tabs">
          <button
            onClick={() => setLeaderboardType('daily')}
            className={`tab ${leaderboardType === 'daily' ? 'active' : ''}`}
          >
            Daily
          </button>
          <button
            onClick={() => setLeaderboardType('global')}
            className={`tab ${leaderboardType === 'global' ? 'active' : ''}`}
          >
            All-Time
          </button>
        </div>
      </div>

      {selectedMode === GameMode.TIMED && (
        <div className="duration-tabs">
          {([TimedDuration.THIRTY, TimedDuration.SIXTY, TimedDuration.ONE_TWENTY] as const).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`duration-tab ${selectedDuration === d ? 'active' : ''}`}
            >
              {d}s
            </button>
          ))}
        </div>
      )}

      <Leaderboard
        mode={selectedMode}
        type={leaderboardType}
        timedDuration={selectedMode === GameMode.TIMED ? selectedDuration : undefined}
      />
    </div>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <Profile
      onBack={() => navigate('/')}
      onLogout={() => {
        logout();
        navigate('/');
      }}
    />
  );
}

function AboutPage() {
  const navigate = useNavigate();
  return <About onBack={() => navigate('/')} />;
}

function TermsPage() {
  const navigate = useNavigate();
  return <TermsOfService onBack={() => navigate('/')} />;
}

function PrivacyPage() {
  const navigate = useNavigate();
  return <PrivacyPolicy onBack={() => navigate('/')} />;
}

function SecurityPage() {
  const navigate = useNavigate();
  return <SecurityPolicy onBack={() => navigate('/')} />;
}

function ContactPage() {
  const navigate = useNavigate();
  return <Contact onBack={() => navigate('/')} />;
}

function AccessibilityPage() {
  const navigate = useNavigate();
  return <AccessibilityStatement onBack={() => navigate('/')} />;
}

/* -----------------------------
 * App Shell
 * ----------------------------- */

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);


  const isActive = (path: string) => location.pathname === path;
  const isPlaying = location.pathname === '/play';

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="nav-left">
          <Link to="/" className="nav-logo" title="Home">
            <RooLogo colour="var(--main-color)" />
            <span className="nav-logo-text">anaroo</span>
          </Link>
        </div>

        <div className="nav-center">
          <Link to="/" className={`nav-icon ${isActive('/') ? 'active' : ''}`} title="Play">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </Link>
          <Link to="/leaderboard" className={`nav-icon ${isActive('/leaderboard') ? 'active' : ''}`} title="Leaderboard">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 14h2V9H7v8zm4 0h2V7h-2v10zm4 0h2v-6h-2v6z"/>
            </svg>
          </Link>
          <Link to="/about" className={`nav-icon ${isActive('/about') ? 'active' : ''}`} title="About">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </Link>
        </div>

        <div className="nav-right">
          {user ? (
            <Link
              to="/profile"
              className={`nav-icon nav-user ${isActive('/profile') ? 'active' : ''}`}
              title="Profile & Settings"
            >
              <ProfileAvatar
                profileImage={user.profileImage}
                nickname={user.nickname}
                size="small"
              />
              <span className="nav-username">{user.nickname}</span>
            </Link>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="nav-icon"
              title="Sign In"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
          )}
        </div>
      </nav>

      <div className="app-body">
        <div className={`ad-sidebar ad-sidebar-left${isPlaying ? ' focus' : ''}`}>
          <AdUnit placement="sidebar" format="vertical" />
        </div>

        <main id="main-content" className="main-content" role="main">
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/play" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/player/:nickname" element={<PublicProfile />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/accessibility" element={<AccessibilityPage />} />
            <Route path="*" element={<NotFound onBack={() => navigate(-1)} onHome={() => navigate('/')} />} />
          </Routes>
        </main>

        <div className={`ad-sidebar ad-sidebar-right${isPlaying ? ' focus' : ''}`}>
          <AdUnit placement="sidebar" format="vertical" />
        </div>
      </div>

      <Footer />

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default App;
