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

// 3 Standard Retrospective Columns matching the screenshot
const RETRO_COLUMNS = [
  {
    id: 'start',
    type: 'start',
    title: 'START',
    name: 'START',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    badgeBg: '#dcfce7',
    badgeColor: '#16a34a'
  },
  {
    id: 'stop',
    type: 'stop',
    title: 'STOP',
    name: 'STOP',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    badgeBg: '#fee2e2',
    badgeColor: '#dc2626'
  },
  {
    id: 'continue',
    type: 'continue',
    title: 'CONTINUE',
    name: 'CONTINUE',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badgeBg: '#dbeafe',
    badgeColor: '#2563eb'
  }
];

// Board navigation tabs
const BOARD_TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
];

// Initial demo cards matching Screenshot 3
const INITIAL_DEMO_CARDS = [
  {
    id: 'card_start_1',
    columnId: 'start',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString()
  },
  {
    id: 'card_start_2',
    columnId: 'start',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString()
  },
  {
    id: 'card_stop_1',
    columnId: 'stop',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString()
  },
  {
    id: 'card_stop_2',
    columnId: 'stop',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString()
  },
  {
    id: 'card_continue_1',
    columnId: 'continue',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString()
  },
  {
    id: 'card_continue_2',
    columnId: 'continue',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString()
  }
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
  const [cards, setCards] = useState(INITIAL_DEMO_CARDS);

  const boardId = board?.id;

  // Load Cards from API if available
  const loadCardsFromApi = useCallback(async () => {
    if (!boardId) return;
    try {
      const cardsData = await api.getCards(boardId);
      if (Array.isArray(cardsData) && cardsData.length > 0) {
        setCards(cardsData);
      }
    } catch {
      // Keep local cards
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
    const defaultAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    const authorName = currentUser?.name || currentUser?.fullName?.replace(' (Anda)', '') || 'Afrizal';

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newCard = {
      id: `card_${Date.now()}`,
      columnId,
      content: text,
      author: {
        id: currentUser?.id || 'current_user',
        name: authorName,
        email: currentUser?.email || 'afrizal@gmail.com'
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
            <div className="retro-board-switcher-container">
              <button
                type="button"
                className="retro-crumb-active-btn"
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
              >
                <span>{boardTitle}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {isBoardDropdownOpen && (
                <div className="retro-board-dropdown-popup">
                  <div className="retro-board-dropdown-header">
                    Pindah Board di {wsName}
                  </div>
                  {workspace.boards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`retro-board-dropdown-item ${b.id === board?.id ? 'active' : ''}`}
                      onClick={() => {
                        setIsBoardDropdownOpen(false);
                        if (onSwitchBoard) onSwitchBoard(b);
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
          <button type="button" className="btn-icon-top" title="Tampilan Grid">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
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
              src={userAvatar}
              alt={currentUser?.name || 'Afrizal'}
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

      {/* ── Tab 1: Interactive Board Canvas (START, STOP, CONTINUE) ── */}
      {activeTab === 'board' && (
        <div className="retro-board-columns-container">
          <div className="retro-board-columns-grid">
            {RETRO_COLUMNS.map((col) => {
              const colCards = cards.filter((c) => c.columnId === col.id);
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
