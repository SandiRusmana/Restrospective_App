export const WORKSPACE_PALETTE = [
  '#5b52f9', // Indigo/Purple
  '#2563eb', // Blue
  '#10b981', // Emerald/Teal
  '#f97316', // Orange
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

/**
 * Returns a permanent, consistent color for a workspace.
 * Uses localStorage persistence first, and falls back to a deterministic string hash
 * so that colors NEVER shift when workspaces are created, sorted, or re-rendered.
 */
export const getConsistentWorkspaceColor = (workspaceOrId, fallbackName = '') => {
  const id = typeof workspaceOrId === 'string' ? workspaceOrId : workspaceOrId?.id;
  const name = typeof workspaceOrId === 'object' ? (workspaceOrId?.name || fallbackName) : fallbackName;
  const explicitColor = typeof workspaceOrId === 'object' ? workspaceOrId?.color : null;

  // 1. Check localStorage by ID or Name
  try {
    if (id) {
      const storedById = localStorage.getItem(`retro_ws_color_${id}`);
      if (storedById) return storedById;
    }
    if (name) {
      const storedByName = localStorage.getItem(`retro_ws_color_${name}`);
      if (storedByName) return storedByName;
    }
  } catch {}

  // 2. If explicit color passed and not a generic default, persist and return it
  if (explicitColor && explicitColor !== '#5956e9') {
    if (id) {
      try { localStorage.setItem(`retro_ws_color_${id}`, explicitColor); } catch {}
    }
    return explicitColor;
  }

  // 3. Fallback: Deterministic Hash of ID or Name so it NEVER changes between renders/sorts
  const seed = id || name || 'default_ws';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = WORKSPACE_PALETTE[Math.abs(hash) % WORKSPACE_PALETTE.length];

  // Save the calculated color so it remains permanently locked
  try {
    if (id) localStorage.setItem(`retro_ws_color_${id}`, color);
  } catch {}

  return color;
};

export const saveWorkspaceColor = (workspaceId, color, workspaceName = '') => {
  try {
    if (workspaceId) localStorage.setItem(`retro_ws_color_${workspaceId}`, color);
    if (workspaceName) localStorage.setItem(`retro_ws_color_${workspaceName}`, color);
  } catch {}
};
