import React, { useState, useEffect, useCallback } from 'react';
import {
  MoreHorizontal,
  MessageSquare,
  CheckSquare,
  Activity,
  LayoutGrid,
  ChevronDown,
  Check,
  User,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import RetroColumn from './RetroColumn';

// Template Columns Dictionary
const TEMPLATE_COLUMNS_MAP = {
  'start-stop-continue': [
    { id: 'start', type: 'start', title: 'START', name: 'START', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'stop', type: 'stop', title: 'STOP', name: 'STOP', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'continue', type: 'continue', title: 'CONTINUE', name: 'CONTINUE', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
  ],
  'mad-sad-glad': [
    { id: 'mad', type: 'mad', title: 'MAD', name: 'MAD', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'sad', type: 'sad', title: 'SAD', name: 'SAD', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'glad', type: 'glad', title: 'GLAD', name: 'GLAD', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
  ],
  '4ls': [
    { id: 'liked', type: 'liked', title: 'LIKED', name: 'LIKED (DISUKAI)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'learned', type: 'learned', title: 'LEARNED', name: 'LEARNED (DIPELAJARI)', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'lacked', type: 'lacked', title: 'LACKED', name: 'LACKED (KURANG)', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'longed', type: 'longed', title: 'LONGED FOR', name: 'LONGED FOR (DIHARAPKAN)', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', badgeBg: '#f3e8ff', badgeColor: '#9333ea' },
  ],
  '4l': [
    { id: 'liked', type: 'liked', title: 'LIKED', name: 'LIKED (DISUKAI)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'learned', type: 'learned', title: 'LEARNED', name: 'LEARNED (DIPELAJARI)', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'lacked', type: 'lacked', title: 'LACKED', name: 'LACKED (KURANG)', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'longed', type: 'longed', title: 'LONGED FOR', name: 'LONGED FOR (DIHARAPKAN)', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', badgeBg: '#f3e8ff', badgeColor: '#9333ea' },
  ],
  'went-well-wrong': [
    { id: 'went_well', type: 'start', title: 'WHAT WENT WELL', name: 'WHAT WENT WELL', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'went_wrong', type: 'stop', title: 'WHAT WENT WRONG', name: 'WHAT WENT WRONG', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'action_items', type: 'continue', title: 'ACTION ITEMS', name: 'ACTION ITEMS', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
  ],
};

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
  onSwitchBoard,
  currentUser,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('board');
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [cards, setCards] = useState([]);

  const boardId = board?.id;

  // Load Cards from API if available
  const loadCardsFromApi = useCallback(async () => {
    if (!boardId) return;
    try {
      const cardsData = await api.getCards(boardId);
      if (Array.isArray(cardsData)) {
        setCards(cardsData);
      }
    } catch {
      // Keep existing cards
    }
  }, [boardId]);

  useEffect(() => {
    loadCardsFromApi();
  }, [loadCardsFromApi]);

  // Handler: Share Board Link
  const handleShare = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);
    if (onShowToast) onShowToast('Link board berhasil disalin!');
  };

  // Handler: Add Card
  const handleAddCard = async (columnId, text) => {
    const defaultAvatar = currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'user'}`;
    const authorName = currentUser?.name || currentUser?.fullName?.replace(' (Anda)', '') || currentUser?.email?.split('@')[0] || 'Anda';

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newCard = {
      id: `card_${Date.now()}`,
      columnId,
      content: text,
      author: {
        id: currentUser?.id || 'current_user',
        name: authorName,
        email: currentUser?.email || ''
      },
      authorName,
      avatar: defaultAvatar,
      time: formattedTime,
      createdAt: now.toISOString()
    };

    setCards((prev) => [...prev, newCard]);
    if (onShowToast) onShowToast('Catatan berhasil ditambahkan!');

    // Async sync with API
    try {
      await api.createCard(boardId, columnId, text);
    } catch {
      // Local state already updated
    }
  };

  // Handler: Edit Card
  const handleEditCard = async (cardId, updatedText) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, content: updatedText, text: updatedText } : c))
    );
    if (onShowToast) onShowToast('Catatan berhasil diperbarui!');

    try {
      await api.updateCard(cardId, updatedText);
    } catch {
      // Local state updated
    }
  };

  // Handler: Delete Card
  const handleDeleteCard = async (card) => {
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    if (onShowToast) onShowToast('Catatan berhasil dihapus');

    try {
      await api.deleteCard(card.id);
    } catch {
      // Local state updated
    }
  };

  // Handler: Copy Card
  const handleCopyCard = () => {
    if (onShowToast) onShowToast('Teks catatan berhasil disalin!');
  };

  const boardTitle = board?.title || board?.name || 'Sprint 16 Retrospective';
  const wsName = workspace?.name || 'Mobile Team';
  const memberCount = workspace?.memberCount || board?.membersCount || 8;
  const dateText = board?.dateText || 'Dibuat 30 Jun 2026';
  const userAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

  // Resolve retro columns dynamically based on board template
  const rawTemplate = (board?.template || 'start-stop-continue').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  const activeColumns = TEMPLATE_COLUMNS_MAP[rawTemplate] || 
    (rawTemplate.includes('mad') || rawTemplate.includes('sad') || rawTemplate.includes('glad') ? TEMPLATE_COLUMNS_MAP['mad-sad-glad'] :
     rawTemplate.includes('4l') || rawTemplate.includes('liked') || rawTemplate.includes('learned') ? TEMPLATE_COLUMNS_MAP['4ls'] :
     rawTemplate.includes('went') || rawTemplate.includes('wrong') || rawTemplate.includes('well') ? TEMPLATE_COLUMNS_MAP['went-well-wrong'] :
     TEMPLATE_COLUMNS_MAP['start-stop-continue']);

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
          
          {workspace?.boards && workspace.boards.length > 1 ? (
            <div className="retro-board-switcher-container" style={{ position: 'relative', display: 'inline-block' }}>
              <button
                type="button"
                className="retro-crumb-active-btn"
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '13px'
                }}
              >
                <span>{boardTitle}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {isBoardDropdownOpen && (
                <div 
                  className="retro-board-dropdown-popup"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    padding: '6px',
                    zIndex: 50,
                    minWidth: '220px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Pindah Board di {wsName}
                  </div>
                  {workspace.boards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setIsBoardDropdownOpen(false);
                        if (onSwitchBoard) onSwitchBoard(b);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: b.id === board?.id ? '#5956e9' : '#334155',
                        fontWeight: b.id === board?.id ? 600 : 400,
                        backgroundColor: b.id === board?.id ? '#f1f5f9' : 'transparent',
                        borderRadius: '6px',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{b.title || b.name}</span>
                      {b.id === board?.id && <Check size={14} color="#5956e9" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="retro-crumb-active">{boardTitle}</span>
          )}
        </div>

        {/* Top right icons (grid, bell, avatar) */}
        <div className="retro-full-topbar-right">
          <button type="button" className="btn-icon-top" title="Tampilan">
            <LayoutGrid size={18} />
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
          {/* 4-dot squircle icon */}
          <div className="retro-board-icon-box" style={{ backgroundColor: '#f3f0ff' }}>
            <div className="four-dots-icon" style={{ '--dot-color': '#5956e9' }}>
              <span></span><span></span><span></span><span></span>
            </div>
          </div>

          <div className="retro-board-header-info">
            <h1 className="retro-board-header-title">{boardTitle}</h1>
            <div className="retro-board-header-meta">
              <span className="retro-meta-ws">{wsName}</span>
              <span className="retro-meta-sep">·</span>
              <User size={14} className="retro-meta-icon" />
              <span className="retro-meta-members">{memberCount} anggota</span>
              <span className="retro-meta-sep">·</span>
              <Clock size={14} className="retro-meta-icon" />
              <span className="retro-meta-date">{dateText}</span>
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

      {/* ── Tab 1: Interactive Board Canvas (Dynamic Template Columns) ── */}
      {activeTab === 'board' && (
        <div className="retro-board-columns-container">
          <div 
            className="retro-board-columns-grid" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${activeColumns.length}, minmax(260px, 1fr))`, 
              gap: '16px' 
            }}
          >
            {activeColumns.map((col) => {
              const colCards = cards.filter((c) => 
                c.columnId === col.id || 
                c.columnId?.toLowerCase() === col.id?.toLowerCase() ||
                c.columnId?.toLowerCase() === col.type?.toLowerCase()
              );
              return (
                <RetroColumn
                  key={col.id}
                  column={col}
                  cards={colCards}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                  onCopyCard={handleCopyCard}
                  currentUser={currentUser}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab 2: Diskusi ── */}
      {activeTab === 'diskusi' && (
        <div className="retro-tab-placeholder">
          <MessageSquare size={40} />
          <h3>Diskusi Tim</h3>
          <p>Fitur diskusi dan komentar sesama anggota workspace akan hadir di sini.</p>
        </div>
      )}

      {/* ── Tab 3: Action Items ── */}
      {activeTab === 'action-items' && (
        <div className="retro-tab-placeholder">
          <CheckSquare size={40} />
          <h3>Action Items</h3>
          <p>Daftar rencana tindakan perbaikan yang disepakati bersama tim.</p>
        </div>
      )}

      {/* ── Tab 4: Aktivitas ── */}
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
