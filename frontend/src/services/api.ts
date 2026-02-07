import {
  SubmitScoreRequest,
  SubmitScoreResponse,
  LeaderboardEntry,
  GameMode,
  Run,
  BestScore,
  PersonalStats,
  User,
  UserProfile,
  DailyChallenge,
  AvatarId,
  ThemeId,
} from '@anaroo/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(nickname: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
    this.setToken(result.token);
    return result;
  }

  async login(nickname: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
    this.setToken(result.token);
    return result;
  }

  // Score endpoints
  async submitScore(request: SubmitScoreRequest): Promise<SubmitScoreResponse> {
    return this.request<SubmitScoreResponse>('/submitScore', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Leaderboard endpoints
  async getDailyLeaderboard(
    mode: GameMode,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>(
      `/leaderboard/daily?mode=${mode}&limit=${limit}`
    );
  }

  async getGlobalLeaderboard(
    mode: GameMode,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>(
      `/leaderboard/global?mode=${mode}&limit=${limit}`
    );
  }

  async getUserRank(userId: string, mode: GameMode) {
    return this.request(`/leaderboard/user/${userId}?mode=${mode}`);
  }

  // User endpoints
  async getUserRuns(mode?: GameMode, limit: number = 20): Promise<Run[]> {
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    params.append('limit', limit.toString());
    return this.request<Run[]>(`/user/runs?${params}`);
  }

  async getUserBestScores(): Promise<BestScore[]> {
    return this.request<BestScore[]>('/user/best');
  }

  // Stats endpoints
  async getPersonalStats(): Promise<PersonalStats> {
    return this.request<PersonalStats>('/stats');
  }

  // Daily challenge endpoints
  async getTodayChallenge(): Promise<DailyChallenge> {
    return this.request<DailyChallenge>('/daily');
  }

  async getDailyStatus(): Promise<{ completed: boolean; timeElapsed?: number; word?: string }> {
    return this.request<{ completed: boolean; timeElapsed?: number; word?: string }>('/daily/status');
  }

  async getDailyHistory(limit: number = 30): Promise<(Run & { date: string })[]> {
    return this.request<(Run & { date: string })[]>(`/daily/history?limit=${limit}`);
  }

  async getWordPick(count: number, lang: string = 'en', difficulty: 'easy' | 'medium' | 'hard' = 'easy'): Promise<{ seed: string; scrambled: string; answers: string[] }> {
    return this.request<{ seed: string; scrambled: string; answers: string[] }>(`/word/pick?count=${count}&lang=${lang}&difficulty=${difficulty}`, { credentials: 'include' });
  }

  // Profile endpoints
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/profile');
  }

  async getPublicProfile(nickname: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/profile/user/${encodeURIComponent(nickname)}`);
  }

  async updateProfile(updates: {
    nickname?: string;
    avatarId?: AvatarId;
    theme?: ThemeId;
    profileImage?: string | null;
  }): Promise<UserProfile> {
    return this.request<UserProfile>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAccount(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/profile', {
      method: 'DELETE',
    });
  }

  // Health check
  async health() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();