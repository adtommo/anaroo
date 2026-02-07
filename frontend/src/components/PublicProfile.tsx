import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserProfile,
  getLevelProgress,
  getXpForLevel,
} from '@anaroo/shared';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ProfileAvatar } from './ProfileAvatar';

export function PublicProfile() {
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If viewing own profile, redirect to /profile
  useEffect(() => {
    if (currentUser?.nickname === nickname) {
      navigate('/profile', { replace: true });
    }
  }, [currentUser, nickname, navigate]);

  useEffect(() => {
    if (!nickname) return;
    loadProfile();
  }, [nickname]);

  const loadProfile = async () => {
    if (!nickname) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPublicProfile(nickname);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="profile-error">
        <p>Error: {error || 'Profile not found'}</p>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  const levelProgress = getLevelProgress(profile.xp);
  const currentLevelXp = getXpForLevel(profile.level);
  const nextLevelXp = getXpForLevel(profile.level + 1);
  const xpIntoLevel = profile.xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="profile-page public-profile">
      <div className="profile-header-bar">
        <button onClick={() => navigate(-1)} className="btn-back">← Back</button>
        <h2>Player Profile</h2>
        <div />
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <ProfileAvatar
          profileImage={profile.profileImage}
          nickname={profile.nickname}
          size="large"
        />

        <div className="profile-info">
          <h1 className="profile-nickname">{profile.nickname}</h1>
          <p className="profile-joined">Joined {formatDate(profile.createdAt)}</p>
        </div>
      </div>

      {/* Level & XP */}
      <div className="profile-section">
        <h3>Level & XP</h3>
        <div className="level-display">
          <div className="level-badge">Level {profile.level}</div>
          <div className="xp-bar-container">
            <div className="xp-bar" style={{ width: `${levelProgress * 100}%` }} />
          </div>
          <div className="xp-text">{xpIntoLevel} / {xpNeeded} XP</div>
        </div>
        <p className="total-xp">Total XP: {(profile.xp || 0).toLocaleString()}</p>
      </div>

      {/* Stats */}
      <div className="profile-section">
        <h3>Stats</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{profile.gamesPlayed}</span>
            <span className="stat-label">Games Played</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{profile.stats?.globalStats?.wordsSolved || 0}</span>
            <span className="stat-label">Words Solved</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{profile.dailyStreak}</span>
            <span className="stat-label">Daily Streak</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {profile.stats?.modeStats?.daily?.longestStreak || 0}
            </span>
            <span className="stat-label">Best Streak</span>
          </div>
        </div>

        {profile.stats?.modeStats && (
          <div className="mode-stats">
            <h4>Daily</h4>
            <div className="mode-stat-row">
              <span>Best Time: {profile.stats.modeStats.daily?.bestTime?.toFixed(1) || '—'}s</span>
              <span>Completions: {profile.stats.modeStats.daily?.completions || 0}</span>
            </div>

            <h4>Timed Mode</h4>
            <div className="mode-stat-row">
              <span>30s High: {profile.stats.modeStats.timed?.[30]?.highestScore || 0}</span>
              <span>60s High: {profile.stats.modeStats.timed?.[60]?.highestScore || 0}</span>
              <span>120s High: {profile.stats.modeStats.timed?.[120]?.highestScore || 0}</span>
            </div>

            <h4>Infinite Survival</h4>
            <div className="mode-stat-row">
              <span>Longest Streak: {profile.stats.modeStats.infinite_survival?.longestStreak || 0}</span>
              <span>High Score: {profile.stats.modeStats.infinite_survival?.highestScore || 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
