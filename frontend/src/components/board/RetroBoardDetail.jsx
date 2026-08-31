import React, { useState } from 'react';
import {
  MoreHorizontal,
  Share2,
  MessageSquare,
  CheckSquare,
  Activity,
  LayoutGrid
} from 'lucide-react';


// Board navigation tabs
const BOARD_TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
];

export default function RetroBoardDetail({
  workspace,
  board,
  onBack,
  currentUser,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('board');

  const handleShare = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);
    if (onShowToast) onShowToast('Link board berhasil disalin!');
  };

  const boardTitle = board?.title || board?.name || 'Sprint Retrospective';
  const wsName = workspace?.name || 'Workspace Saya';
  const wsColor = workspace?.color || '#5956e9';
  const memberCount = workspace?.memberCount || board?.membersCount || 8;
  const dateText = board?.dateText || `Dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="retro-board-full-view">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="retro-full-topbar">
        <div className="retro-full-breadcrumbs">
          <button
            type="button"
            className="retro-crumb-btn"
            onClick={onBack}
          >
            Workspace Saya
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>
          <button
            type="button"
            className="retro-crumb-btn"
            onClick={onBack}
          >
            {wsName}
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>
          <span className="retro-crumb-active">{boardTitle}</span>
        </div>

        {/* Top right icons (grid, bell, avatar) */}
        <div className="retro-full-topbar-right">
          <button type="button" className="btn-icon-top" title="Tampilan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button type="button" className="btn-icon-top notification-btn" title="Notifikasi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-badge-dot"></span>
          </button>
          <div className="top-user-avatar-wrapper">
            <img
              src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`}
              alt={currentUser?.name || 'User'}
              className="top-user-avatar"
            />
          </div>
        </div>
      </div>

      {/* ── Board Header Banner ── */}
      <div className="retro-board-header-banner">
        <div className="retro-board-header-left">
          {/* 4-dot icon */}
          <div className="retro-board-icon-box" style={{ backgroundColor: board?.theme?.bg || '#f3f0ff' }}>
            <div className="four-dots-icon" style={{ '--dot-color': board?.color || wsColor }}>
              <span></span><span></span><span></span><span></span>
            </div>
          </div>

          <div className="retro-board-header-info">
            <h1 className="retro-board-header-title">{boardTitle}</h1>
            <div className="retro-board-header-meta">
              <span className="retro-meta-ws">{wsName}</span>
              <span className="retro-meta-sep">·</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="retro-meta-members">{memberCount} anggota</span>
              <span className="retro-meta-sep">·</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="retro-meta-date">{dateText}</span>

              {/* Saving indicator */}
              {isSaving && (
                <span className="retro-meta-sep" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '12px' }}>
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  Menyimpan...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="retro-board-header-right">
          <button type="button" className="btn-ghost-icon" title="Opsi board">
            <MoreHorizontal size={18} />
          </button>
          <button
            type="button"
            className="btn-share-board"
            onClick={handleShare}
          >
            + Bagikan Board
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="retro-board-tabs">
        {BOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`retro-board-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Board Tab ── */}
      {activeTab === 'board' && (
        <div className="retro-tab-placeholder">
          <LayoutGrid size={40} />
          <h3>Board Retrospective</h3>
          <p>Konten board retrospective akan hadir di sini.</p>
        </div>
      )}

      {/* ── Diskusi Tab ── */}
      {activeTab === 'diskusi' && (
        <div className="retro-tab-placeholder">
          <MessageSquare size={40} />
          <h3>Diskusi Tim</h3>
          <p>Fitur diskusi dan komentar sesama anggota workspace akan hadir di sini.</p>
        </div>
      )}

      {/* ── Action Items Tab ── */}
      {activeTab === 'action-items' && (
        <div className="retro-tab-placeholder">
          <CheckSquare size={40} />
          <h3>Action Items</h3>
          <p>Daftar rencana tindakan perbaikan yang disepakati bersama tim.</p>
        </div>
      )}

      {/* ── Aktivitas Tab ── */}
      {activeTab === 'aktivitas' && (
        <div className="retro-tab-placeholder">
          <Activity size={40} />
          <h3>Aktivitas Board</h3>
          <p>Log aktivitas semua anggota di board retrospective ini.</p>
        </div>
      )}
    </div>
  );
}
