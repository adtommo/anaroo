import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode, TimedDuration, LeaderboardEntry } from '@anaroo/shared';
import { apiService } from '../services/api';
import { ProfileAvatar } from './ProfileAvatar';

interface LeaderboardProps {
  mode: GameMode;
  type: 'daily' | 'global';
  timedDuration?: TimedDuration;
}

export function Leaderboard({ mode, type, timedDuration }: LeaderboardProps) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [mode, type, timedDuration]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const duration = mode === GameMode.TIMED ? timedDuration : undefined;
      const data = type === 'daily'
        ? await apiService.getDailyLeaderboard(mode, 50, duration)
        : await apiService.getGlobalLeaderboard(mode, 50, duration);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const isDaily = mode === GameMode.DAILY;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(1);
    return `${m}m ${s}s`;
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="lb">
      {loading ? (
        <div className="loading">Loading leaderboard...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : entries.length === 0 ? (
        <div className="empty">No scores yet. Be the first!</div>
      ) : (
        <table className="lb-table">
          <thead>
            <tr>
              <th className="lb-th lb-th-rank">#</th>
              <th className="lb-th lb-th-name">name</th>
              <th className="lb-th lb-th-score">{isDaily ? 'time' : 'score'}</th>
              {!isDaily && <th className="lb-th lb-th-wpm">wpm</th>}
              <th className="lb-th lb-th-date">date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.userId}
                className={`lb-row ${i % 2 === 0 ? 'lb-row-alt' : ''}`}
                onClick={() => navigate(`/player/${encodeURIComponent(entry.nickname)}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/player/${encodeURIComponent(entry.nickname)}`);
                  }
                }}
              >
                <td className="lb-cell lb-cell-rank">
                  <span
                    className={
                      entry.rank === 1
                        ? 'rank-gold'
                        : entry.rank === 2
                        ? 'rank-silver'
                        : entry.rank === 3
                        ? 'rank-bronze'
                        : ''
                    }
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="lb-cell lb-cell-name">
                  <div className="lb-name-group">
                    <ProfileAvatar
                      profileImage={entry.profileImage}
                      nickname={entry.nickname}
                      size="small"
                    />
                    <span className="lb-nickname">{entry.nickname}</span>
                    <span className="lb-level">lvl {entry.level || 1}</span>
                  </div>
                </td>
                <td className="lb-cell lb-cell-score">
                  {isDaily && entry.timeElapsed != null
                    ? formatTime(entry.timeElapsed)
                    : entry.score.toLocaleString()}
                </td>
                {!isDaily && (
                  <td className="lb-cell lb-cell-wpm">
                    {entry.wpm ? Math.round(entry.wpm) : '—'}
                  </td>
                )}
                <td className="lb-cell lb-cell-date">
                  {formatDate(entry.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
