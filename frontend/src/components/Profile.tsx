import { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  THEMES,
  ThemeId,
  getLevelProgress,
  getXpForLevel,
} from '@anaroo/shared';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ProfileAvatar } from './ProfileAvatar';

interface ProfileProps {
  onBack: () => void;
  onLogout: () => void;
}

export function Profile({ onBack, onLogout }: ProfileProps) {
  const { updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

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
    try {
      await apiService.updateProfile({ theme: themeId });
    } catch {
      // Theme is saved locally anyway
    }
  };

  const handleSaveNickname = async () => {
    if (!profile || newNickname.trim() === profile.nickname) {
      setEditingNickname(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const trimmedNickname = newNickname.trim();
      const updated = await apiService.updateProfile({ nickname: trimmedNickname });
      setProfile(updated);
      updateUser({ nickname: trimmedNickname });
      setEditingNickname(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update nickname');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await apiService.deleteAccount();
      apiService.clearToken();
      onLogout();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('Please select an image file');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Image must be less than 2MB');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const updated = await apiService.updateProfile({ profileImage: base64 });
          setProfile(updated);
          updateUser({ profileImage: base64 });
        } catch (err) {
          setSaveError(err instanceof Error ? err.message : 'Failed to upload image');
        } finally {
          setSaving(false);
        }
      };
      reader.onerror = () => {
        setSaveError('Failed to read image file');
        setSaving(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to upload image');
      setSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await apiService.updateProfile({ profileImage: null });
      setProfile(updated);
      updateUser({ profileImage: undefined });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-header-bar">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h2>Profile</h2>
        <div />
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-container">
          <ProfileAvatar
            profileImage={profile.profileImage}
            nickname={profile.nickname}
            size="large"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="sr-only"
          />
          <div className="avatar-actions">
            <button
              className="btn-small"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              {profile.profileImage ? 'Change' : 'Upload'}
            </button>
            {profile.profileImage && (
              <button
                className="btn-small btn-secondary"
                onClick={handleRemoveImage}
                disabled={saving}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="profile-info">
          {editingNickname ? (
            <div className="nickname-edit">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                maxLength={20}
                className="nickname-input"
              />
              <button onClick={handleSaveNickname} disabled={saving} className="btn-small">
                Save
              </button>
              <button onClick={() => { setEditingNickname(false); setNewNickname(profile.nickname); }} className="btn-small">
                Cancel
              </button>
            </div>
          ) : (
            <h1 className="profile-nickname" onClick={() => setEditingNickname(true)}>
              {profile.nickname}
              <span className="edit-icon">✏️</span>
            </h1>
          )}
          <p className="profile-joined">Joined {formatDate(profile.createdAt)}</p>
        </div>
      </div>

      {saveError && <div className="save-error">{saveError}</div>}

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

      {/* Theme Selection */}
      <div className="profile-section">
        <h3>Theme</h3>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-option ${theme === t.id ? 'active' : ''}`}
              onClick={() => handleUpdateTheme(t.id)}
            >
              <span className="theme-name">{t.name}</span>
              <span className="theme-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="profile-section">
        <h3>Account</h3>
        <button
          className="btn-logout"
          onClick={() => {
            apiService.clearToken();
            onLogout();
          }}
        >
          Log Out
        </button>
      </div>

      {/* Danger Zone */}
      <div className="profile-section danger-zone">
        <h3>Danger Zone</h3>
        {!showDeleteConfirm ? (
          <button
            className="btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <div className="delete-confirm">
            <p>This will permanently delete your account and all data. This action cannot be undone.</p>
            <p>Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="delete-input"
            />
            <div className="delete-actions">
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
