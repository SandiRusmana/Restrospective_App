const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Helper internal untuk melakukan HTTP request dengan Fetch API
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Terjadi kesalahan pada server');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth API
  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken);
    }
    return res;
  },

  async register(email, password, name) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken);
    }
    return res;
  },

  async getMe() {
    return request('/auth/me', { method: 'GET' });
  },

  getGoogleAuthUrl() {
    return `${API_BASE_URL}/auth/google`;
  },

  logout() {
    localStorage.removeItem('access_token');
  },

  // Workspace API
  async getWorkspaces() {
    return request('/workspaces', { method: 'GET' });
  },

  async getWorkspaceById(id) {
    return request(`/workspaces/${id}`, { method: 'GET' });
  },

  async createWorkspace(name) {
    return request('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async updateWorkspace(id, data) {
    return request(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteWorkspace(id) {
    return request(`/workspaces/${id}`, {
      method: 'DELETE',
    });
  },

  // Invite API
  async createInvite(workspaceId) {
    return request(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
    });
  },

  async getActiveInvite(workspaceId) {
    return request(`/workspaces/${workspaceId}/invite`, {
      method: 'GET',
    });
  },

  async deactivateInvite(workspaceId) {
    return request(`/workspaces/${workspaceId}/invite/deactivate`, {
      method: 'PATCH',
    });
  },

  async getWorkspaceMembers(workspaceId) {
    return request(`/workspaces/${workspaceId}/members`, {
      method: 'GET',
    });
  },

  async getInviteInfo(token) {
    return request(`/invites/${token}`, {
      method: 'GET',
    });
  },

  async joinWorkspace(token) {
    return request(`/invites/${token}/join`, {
      method: 'POST',
    });
  },

  // Board API
  async getBoards(workspaceId, query = {}) {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page);
    if (query?.limit) params.append('limit', query.limit);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/workspaces/${workspaceId}/boards${qs}`, { method: 'GET' });
  },

  async getBoardById(boardId) {
    return request(`/boards/${boardId}`, { method: 'GET' });
  },

  async createBoard(workspaceId, boardData) {
    return request(`/workspaces/${workspaceId}/boards`, {
      method: 'POST',
      body: JSON.stringify(boardData),
    });
  },

  async deleteBoard(boardId) {
    return request(`/boards/${boardId}`, {
      method: 'DELETE',
    });
  },

  async updateAnonymous(boardId, isAnonymous) {
    return request(`/boards/${boardId}/anonymous`, {
      method: 'PATCH',
      body: JSON.stringify({ isAnonymous }),
    });
  },

  async exportBoardPdf(boardId) {
    const token = localStorage.getItem('access_token');
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}/export`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Gagal mengekspor PDF board');
    }
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let filename = `Retro_${boardId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    return { blob, filename };
  },

  // Card API
  async getCards(boardId) {
    return request(`/boards/${boardId}/cards`, { method: 'GET' });
  },

  async createCard(boardId, columnId, content, isAnonymous = undefined) {
    const payload = { columnId, content };
    if (typeof isAnonymous === 'boolean') {
      payload.isAnonymous = isAnonymous;
    }
    return request(`/boards/${boardId}/cards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCard(cardId, data) {
    const payload = typeof data === 'string' ? { content: data } : data;
    return request(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async moveCard(cardId, columnId) {
    return request(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ columnId }),
    });
  },

  async deleteCard(cardId) {
    return request(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  },

  async voteCard(cardId) {
    return request(`/cards/${cardId}/vote`, {
      method: 'POST',
    });
  },

  async unvoteCard(cardId) {
    return request(`/cards/${cardId}/vote`, {
      method: 'DELETE',
    });
  },

  async groupCard(cardId, groupId, groupTitle) {
    return request(`/cards/${cardId}/group`, {
      method: 'PATCH',
      body: JSON.stringify({
        groupId: groupId !== undefined ? (groupId || null) : undefined,
        groupTitle: groupTitle !== undefined ? groupTitle : undefined,
      }),
    });
  },

  async addComment(cardId, text) {
    return request(`/cards/${cardId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Action Item API
  async getActionItems(boardId) {
    return request(`/boards/${boardId}/action-items`, { method: 'GET' });
  },

  async convertCardToAction(cardId, data) {
    return request(`/cards/${cardId}/convert-to-action`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateActionItem(actionItemId, data) {
    return request(`/action-items/${actionItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getWorkspaceActionItems(workspaceId, status = 'pending') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/workspaces/${workspaceId}/action-items${query}`, { method: 'GET' });
  },

  async getPreviousSessionActionItems(workspaceId, status = 'pending') {
    return this.getWorkspaceActionItems(workspaceId, status);
  },

  // Dashboard Summary API
  async getDashboardSummary(workspaceId, { startDate, endDate } = {}) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/workspaces/${workspaceId}/dashboard-summary${queryString}`, {
      method: 'GET',
    });
  },

  // Timer API
  async getTimer(boardId) {
    return request(`/boards/${boardId}/timer`, { method: 'GET' });
  },

  async startTimer(boardId, duration = undefined) {
    const options = { method: 'POST' };
    if (typeof duration === 'number') {
      options.body = JSON.stringify({ duration });
    }
    return request(`/boards/${boardId}/timer/start`, options);
  },

  async pauseTimer(boardId) {
    return request(`/boards/${boardId}/timer/pause`, { method: 'POST' });
  },

  async resetTimer(boardId) {
    return request(`/boards/${boardId}/timer/reset`, { method: 'POST' });
  },

  async updateTimerDuration(boardId, duration) {
    return request(`/boards/${boardId}/timer/duration`, {
      method: 'PATCH',
      body: JSON.stringify({ duration }),
    });
  },

  // Icebreaker API
  async startIcebreaker(boardId, gameType = 'fakta-hoaks', totalQuestions = 5) {
    return request(`/boards/${boardId}/icebreaker/start`, {
      method: 'POST',
      body: JSON.stringify({ gameType, totalQuestions }),
    });
  },

  async submitIcebreakerVote(boardId, optionId) {
    return request(`/boards/${boardId}/icebreaker/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },

  async skipIcebreaker(boardId) {
    return request(`/boards/${boardId}/icebreaker/skip`, {
      method: 'POST',
    });
  },

  async endIcebreaker(boardId) {
    return request(`/boards/${boardId}/icebreaker/end`, {
      method: 'POST',
    });
  },

  async revealIcebreaker(boardId) {
    return request(`/boards/${boardId}/icebreaker/reveal`, {
      method: 'POST',
    });
  },

  async getIcebreakerState(boardId) {
    return request(`/boards/${boardId}/icebreaker/state`, {
      method: 'GET',
    });
  },
};
