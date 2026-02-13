import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  EnrichedUserProfile,
  GameMode,
  getLevelProgress,
  getXpForLevel,
} from '@anaroo/shared';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ProfileAvatar } from './ProfileAvatar';

const MODE_LABELS: Record<string, string> = {
  daily: 'Daily',
  timed: 'Timed',
  infinite_survival: 'Survival',
};

export function PublicProfile() {
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<EnrichedUserProfile | null>(null);
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

  if (loading) return <div className="loading">Loading profile...</div>;

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

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const formatShortDate = (date: Date | string) =>
    new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(1);
    return `${m}m ${s}s`;
  };

  const rankingEntries = [
    { label: 'Daily', data: profile.rankings.daily },
    { label: 'Timed 30s', data: profile.rankings.timed30 },
    { label: 'Timed 60s', data: profile.rankings.timed60 },
    { label: 'Timed 120s', data: profile.rankings.timed120 },
    { label: 'Survival', data: profile.rankings.survival },
  ].filter((r) => r.data);

  return (
    <div className="pf">
      <div className="profile-header-bar">
        <button onClick={() => navigate(-1)} className="btn-back">← Back</button>
        <h2>Player Profile</h2>
        <div />
      </div>

      {/* ── Details Card ── */}
      <div className="pf-details">
        <div className="pf-identity">
          <ProfileAvatar profileImage={profile.profileImage} nickname={profile.nickname} size="large" />
          <div className="pf-name-area">
            <span className="pf-nickname" style={{ cursor: 'default' }}>{profile.nickname}</span>
            <span className="pf-joined">Joined {formatDate(profile.createdAt)}</span>
            <div className="pf-xp-row">
              <span className="pf-level-badge">Lvl {profile.level}</span>
              <div className="pf-xp-track"><div className="pf-xp-fill" style={{ width: `${levelProgress * 100}%` }} /></div>
              <span className="pf-xp-label">{xpIntoLevel} / {xpNeeded} xp</span>
            </div>
          </div>
        </div>

        <div className="pf-sep" />

        <div className="pf-typing-stats">
          <div className="pf-stat-block">
            <span className="pf-stat-title">games played</span>
            <span className="pf-stat-big">{profile.gamesPlayed}</span>
          </div>
          <div className="pf-stat-block">
            <span className="pf-stat-title">words solved</span>
            <span className="pf-stat-big">{profile.stats?.globalStats?.wordsSolved || 0}</span>
          </div>
          <div className="pf-stat-block">
            <span className="pf-stat-title">daily streak</span>
            <span className="pf-stat-big">{profile.dailyStreak}</span>
          </div>
        </div>
      </div>

      {/* ── Leaderboard Rankings ── */}
      {rankingEntries.length > 0 && (
        <div className="pf-card">
          <div className="pf-ranks">
            {rankingEntries.map(({ label, data }) => (
              <div key={label} className="pf-rank-block">
                <span className="pf-rank-label">{label}</span>
                <span className="pf-rank-num">#{data!.rank.toLocaleString()}</span>
                <span className="pf-rank-total">/ {data!.totalPlayers.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Personal Bests ── */}
      <div className="pf-bests-row">
        <div className="pf-card pf-bests-card">
          <h3 className="pf-card-title">daily best</h3>
          <span className="pf-best-big">{profile.stats?.modeStats?.daily?.bestTime?.toFixed(1) || '—'}<small>s</small></span>
          <span className="pf-best-sub">{profile.stats?.modeStats?.daily?.completions || 0} completions</span>
        </div>

        <div className="pf-card pf-bests-card">
          <h3 className="pf-card-title">timed high scores</h3>
          <div className="pf-best-grid">
            {([30, 60, 120] as const).map((d) => (
              <div key={d} className="pf-best-item">
                <span className="pf-best-duration">{d}s</span>
                <span className="pf-best-val">{profile.stats?.modeStats?.timed?.[d]?.highestScore || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pf-card pf-bests-card">
          <h3 className="pf-card-title">survival</h3>
          <span className="pf-best-big">{profile.stats?.modeStats?.infinite_survival?.highestScore || 0}</span>
          <span className="pf-best-sub">streak: {profile.stats?.modeStats?.infinite_survival?.longestStreak || 0}</span>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {profile.recentRuns.length > 0 && (
        <div className="pf-card">
          <h3 className="pf-card-title">recent activity</h3>
          <table className="pf-activity-table">
            <thead>
              <tr>
                <th>mode</th>
                <th>result</th>
                <th>wpm</th>
                <th>acc</th>
                <th>date</th>
              </tr>
            </thead>
            <tbody>
              {profile.recentRuns.map((run, i) => (
                <tr key={i} className={i % 2 === 0 ? 'pf-row-alt' : ''}>
                  <td className="pf-act-mode">
                    {MODE_LABELS[run.mode] || run.mode}
                    {run.timedDuration ? ` ${run.timedDuration}s` : ''}
                  </td>
                  <td className="pf-act-result">
                    {run.mode === GameMode.DAILY ? formatTime(run.timeElapsed) : run.score.toLocaleString()}
                  </td>
                  <td>{Math.round(run.wpm)}</td>
                  <td>{Math.round(run.accuracy)}%</td>
                  <td className="pf-act-date">{formatShortDate(run.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
