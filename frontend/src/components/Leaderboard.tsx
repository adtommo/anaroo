import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode, LeaderboardEntry } from '@anaroo/shared';
import { apiService } from '../services/api';
import { ProfileAvatar } from './ProfileAvatar';

interface LeaderboardProps {
  mode: GameMode;
  type: 'daily' | 'global';
}

export function Leaderboard({ mode, type }: LeaderboardProps) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [mode, type]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = type === 'daily'
        ? await apiService.getDailyLeaderboard(mode)
        : await apiService.getGlobalLeaderboard(mode);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard">
      <h2>{type === 'daily' ? 'Daily' : 'Global'} Leaderboard</h2>

      {loading ? (
        <div className="loading">Loading leaderboard...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : entries.length === 0 ? (
        <div className="empty">No scores yet. Be the first!</div>
      ) : (
        <div className="leaderboard-list">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={`leaderboard-card ${entry.rank <= 3 ? `top-${entry.rank}` : ''}`}
              onClick={() => navigate(`/player/${encodeURIComponent(entry.nickname)}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/player/${encodeURIComponent(entry.nickname)}`);
                }
              }}
            >
              <div className="leaderboard-rank">
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
                  #{entry.rank}
                </span>
              </div>

              <div className="leaderboard-avatar">
                <ProfileAvatar
                  profileImage={entry.profileImage}
                  nickname={entry.nickname}
                  size="small"
                />
              </div>

              <div className="leaderboard-player">
                <span className="leaderboard-nickname">{entry.nickname}</span>
                <span className="leaderboard-level">Lvl {entry.level || 1}</span>
              </div>

              <div className="leaderboard-score">
                <span className="score-value">{entry.score.toLocaleString()}</span>
                <span className="score-label">score</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
