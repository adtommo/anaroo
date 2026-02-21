import { useState, useEffect, useRef } from 'react';
import {
  EnrichedUserProfile,
  THEMES,
  ThemeId,
  GameMode,
  getLevelProgress,
  getXpForLevel,
} from '@anaroo/shared';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAds } from '../contexts/AdContext';
import { ProfileAvatar } from './ProfileAvatar';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  onBack: () => void;
  onLogout: () => void;
}

const MODE_LABELS: Record<string, string> = {
  daily: 'Daily',
  timed: 'Timed',
  infinite_survival: 'Survival',
};

export function Profile({ onBack, onLogout }: ProfileProps) {
  const { updateUser, logout, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { adLevel, setAdLevel } = useAds();
  const [profile, setProfile] = useState<EnrichedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [hasEmailIdentity, setHasEmailIdentity] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const hasEmail = user.app_metadata?.provider === 'email'
          || user.identities?.some((id) => id.provider === 'email');
        setHasEmailIdentity(!!hasEmail);
      }
    });
  }, []);

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProfile();
      setProfile(data);
      setNewNickname(data.nickname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTheme = async (themeId: ThemeId) => {
    setTheme(themeId);
    if (!profile) return;
    try { await apiService.updateProfile({ theme: themeId }); } catch { /* saved locally */ }
  };

  const handleSaveNickname = async () => {
    if (!profile || newNickname.trim() === profile.nickname) { setEditingNickname(false); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const trimmedNickname = newNickname.trim();
      const updated = await apiService.updateProfile({ nickname: trimmedNickname });
      setProfile((prev) => prev ? { ...prev, ...updated } : null);
      updateUser({ nickname: trimmedNickname });
      setEditingNickname(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update nickname');
    } finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await apiService.deleteAccount();
      await logout();
      onLogout();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSaveError('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { setSaveError('Image must be less than 2MB'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const updated = await apiService.updateProfile({ profileImage: base64 });
          setProfile((prev) => prev ? { ...prev, ...updated } : null);
          updateUser({ profileImage: base64 });
        } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to upload image'); }
        finally { setSaving(false); }
      };
      reader.onerror = () => { setSaveError('Failed to read image file'); setSaving(false); };
      reader.readAsDataURL(file);
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to upload image'); setSaving(false); }
  };

  const handleRemoveImage = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await apiService.updateProfile({ profileImage: null });
      setProfile((prev) => prev ? { ...prev, ...updated } : null);
      updateUser({ profileImage: undefined });
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to remove image'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  if (error || !profile) {
    return (
      <div className="profile-error">
        <p>Error: {error || 'Profile not found'}</p>
        <button className="btn-secondary" onClick={onBack}>Back</button>
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
        <button onClick={onBack} className="btn-back">← Back</button>
        <h2>Profile</h2>
        <button className="pf-header-logout" onClick={() => { logout(); onLogout(); }}>Log Out</button>
      </div>

      {/* ── Details Card ── */}
      <div className="pf-details">
        <div className="pf-identity">
          <div className="pf-avatar-wrap">
            <ProfileAvatar profileImage={profile.profileImage} nickname={profile.nickname} size="large" />
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="sr-only" />
            <div className="pf-avatar-actions">
              <button className="pf-avatar-btn" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                {profile.profileImage ? 'Change' : 'Upload'}
              </button>
              {profile.profileImage && (
                <button className="pf-avatar-btn" onClick={handleRemoveImage} disabled={saving}>Remove</button>
              )}
            </div>
          </div>
          <div className="pf-name-area">
            {editingNickname ? (
              <div className="nickname-edit">
                <input type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} maxLength={20} className="nickname-input" />
                <button onClick={handleSaveNickname} disabled={saving} className="btn-small">Save</button>
                <button onClick={() => { setEditingNickname(false); setNewNickname(profile.nickname); }} className="btn-small">Cancel</button>
              </div>
            ) : (
              <button className="pf-nickname" onClick={() => setEditingNickname(true)}>
                {profile.nickname}
                <span className="pf-edit-hint">✏</span>
              </button>
            )}
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

      {saveError && <div className="save-error">{saveError}</div>}

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

      {/* ── Theme ── */}
      <div className="profile-section">
        <h3>Theme</h3>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-option ${theme === t.id ? 'active' : ''}`} onClick={() => handleUpdateTheme(t.id)}>
              <span className="theme-name">{t.name}</span>
              <span className="theme-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Account Settings (collapsible) ── */}
      <div className="profile-section">
        <button
          className="pf-account-toggle"
          onClick={() => setShowAccountSettings(!showAccountSettings)}
        >
          <h3>Account Settings</h3>
          <svg
            className={`pf-chevron${showAccountSettings ? ' open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showAccountSettings && (
          <div className="pf-account-body">
            {/* ── Ads ── */}
            <div className="pf-account-section">
              <h4>Ads</h4>
              <p className="ad-section-desc">
                Ads help keep Anaroo free. You can adjust the level or turn them off entirely.
              </p>
              <div className="ad-level-options">
                {(['off', 'result', 'on', 'sellout'] as const).map((level) => (
                  <button
                    key={level}
                    className={`settings-button ${adLevel === level ? 'active' : ''}`}
                    onClick={() => setAdLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="ad-level-desc">
                {{ off: 'No ads. Thanks for playing!', result: 'One ad on the result screen.', on: 'Result + sidebar banners.', sellout: 'Maximum ads. Thanks for the support!' }[adLevel]}
              </p>
            </div>

            {/* ── Change Password ── */}
            {hasEmailIdentity && (
              <div className="pf-account-section">
                <h4>Change Password</h4>
                <div className="change-password-fields">
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordSuccess(false); }}
                      placeholder="New password"
                      minLength={6}
                      disabled={passwordSaving}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordSuccess(false); }}
                      placeholder="Confirm new password"
                      minLength={6}
                      disabled={passwordSaving}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    className="btn-small"
                    onClick={handleChangePassword}
                    disabled={passwordSaving || !newPassword || !confirmNewPassword}
                  >
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
                {passwordError && <div className="save-error">{passwordError}</div>}
                {passwordSuccess && <div className="save-success">Password updated successfully.</div>}
              </div>
            )}

            {/* ── Delete Account ── */}
            <div className="pf-account-section pf-account-danger">
              <h4>Delete Account</h4>
              {!showDeleteConfirm ? (
                <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
              ) : (
                <div className="delete-confirm">
                  <p>This will permanently delete your account and all data. This action cannot be undone.</p>
                  <p>Type <strong>DELETE</strong> to confirm:</p>
                  <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" className="delete-input" />
                  <div className="delete-actions">
                    <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting}>
                      {deleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button className="btn-secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
