import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import RetroCard from './RetroCard';
import RetroCardGroup from './RetroCardGroup';
import RetroCardInput from './RetroCardInput';

export default function RetroColumn({
  column,
  columns = [],
  cards = [],
  onAddCard,
  onEditCard,
  onDeleteCard,
  onCopyCard,
  onVoteCard,
  onUngroupCard,
  onUngroupAll,
  onRenameGroup,
  onMoveColumn,
  onMoveGroupColumn,
  onOpenDetail,
  onConvertToActionItem,
  currentUser,
  isAnonymous = false,
  isFacilitator = false,
  isReadOnly = false,
  actionItems = [],
  isPrivateMode = false,
  isRevealed = false,
}) {
  const [isAdding, setIsAdding] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-drop-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
    disabled: isReadOnly,
  });

  const handleSaveCard = (text) => {
    onAddCard(column.id, text);
    setIsAdding(false);
  };

  // Organize cards into standalone and grouped clusters
  // Saat private mode aktif & belum reveal: tampilkan HANYA card milik user saat ini
  const visibleCards = isPrivateMode && !isRevealed
    ? cards.filter(c => c.isOwner)
    : cards;

  const { standaloneCards, groupedCardsMap } = useMemo(() => {
    const standalone = [];
    const grouped = {};

    visibleCards.forEach((card) => {
      if (card.groupId) {
        if (!grouped[card.groupId]) {
          grouped[card.groupId] = [];
        }
        grouped[card.groupId].push(card);
      } else {
        standalone.push(card);
      }
    });

    return { standaloneCards: standalone, groupedCardsMap: grouped };
  }, [visibleCards]);

  // Render icon with column theme color
  const renderColumnIcon = () => {
    const iconColor = column.color || '#2563eb';

    if (column.id === 'stop' || column.type === 'stop' || column.id === 'mad' || column.type === 'mad') {
      return (
        <div className="retro-col-icon-circle" style={{ backgroundColor: iconColor, color: '#ffffff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </div>
      );
    }
    if (column.id === 'sad' || column.type === 'sad' || column.id === 'lacked' || column.type === 'lacked') {
      return (
        <div className="retro-col-icon-circle" style={{ backgroundColor: iconColor, color: '#ffffff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
          </svg>
        </div>
      );
    }
    if (column.id === 'longed' || column.type === 'longed') {
      return (
        <div className="retro-col-icon-circle" style={{ backgroundColor: iconColor, color: '#ffffff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>
      );
    }
    // Default (Play icon for Start, Continue, Liked, Learned, Glad)
    return (
      <div className="retro-col-icon-circle" style={{ backgroundColor: iconColor, color: '#ffffff' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  };

  const columnClass = `retro-board-column retro-column-${column.id || 'default'} ${
    isOver ? 'retro-column-drag-over' : ''
  }`;

  return (
    <div
      ref={setNodeRef}
      className={columnClass}
      style={{
        backgroundColor: column.bg || '#f8fafc',
        border: `1px solid ${column.border || '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      {/* ── Column Header ── */}
      <div className="retro-column-header">
        <div className="retro-column-header-title">
          {renderColumnIcon()}
          <h2 className="retro-column-name" style={{ color: column.color || '#0f172a' }}>
            {column.title || column.name}
          </h2>
        </div>
        <span
          className="retro-column-count-badge"
          style={{
            backgroundColor: column.badgeBg || '#e2e8f0',
            color: column.badgeColor || column.color || '#334155',
          }}
        >
          {/* Saat private mode, tampilkan hanya jumlah card milik user */}
          {isPrivateMode && !isRevealed ? visibleCards.length : cards.length}
        </span>
      </div>

      {/* ── "+ Tambah Catatan" Button (Hidden in Read-Only Mode) ── */}
      {!isReadOnly && (
        <button
          type="button"
          className="btn-column-add-note"
          onClick={() => setIsAdding(true)}
          style={{
            border: `1.5px solid ${column.border || column.color || '#cbd5e1'}`,
            color: column.color || '#2563eb',
          }}
        >
          + Tambah Catatan
        </button>
      )}

      {/* ── Active Inline Card Creation Form ── */}
      {!isReadOnly && isAdding && (
        <RetroCardInput
          onSave={handleSaveCard}
          onCancel={() => setIsAdding(false)}
          placeholder={`Tulis catatan untuk ${column.title || column.name}...`}
        />
      )}

      {/* ── Cards & Group Clusters List ── */}
      {visibleCards.length > 0 && (
        <div className="retro-column-cards-list">
          {/* Render Groups First */}
          {Object.entries(groupedCardsMap).map(([groupId, groupCards]) => (
            <RetroCardGroup
              key={groupId}
              groupId={groupId}
              cards={groupCards}
              columns={columns}
              onEditCard={onEditCard}
              onDeleteCard={onDeleteCard}
              onCopyCard={onCopyCard}
              onVoteCard={onVoteCard}
              onUngroupCard={onUngroupCard}
              onUngroupAll={onUngroupAll}
              onRenameGroup={onRenameGroup}
              onMoveColumn={onMoveColumn}
              onMoveGroupColumn={onMoveGroupColumn}
              onOpenDetail={onOpenDetail}
              onConvertToActionItem={onConvertToActionItem}
              currentUser={currentUser}
              isAnonymous={isAnonymous}
              isFacilitator={isFacilitator}
              isReadOnly={isReadOnly}
              actionItems={actionItems}
            />
          ))}

          {/* Render Standalone Cards */}
          {standaloneCards.map((card) => (
            <RetroCard
              key={card.id}
              card={card}
              isInGroup={false}
              columns={columns}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onCopy={onCopyCard}
              onVote={onVoteCard}
              onUngroup={onUngroupCard}
              onMoveColumn={onMoveColumn}
              onOpenDetail={onOpenDetail}
              onConvertToActionItem={onConvertToActionItem}
              currentUser={currentUser}
              isAnonymous={isAnonymous}
              isFacilitator={isFacilitator}
              isReadOnly={isReadOnly}
              actionItem={actionItems.find((ai) => ai.cardId === card.id) || null}
              isPrivateMode={isPrivateMode}
              isRevealed={isRevealed}
            />
          ))}
        </div>
      )}

      {/* ── Empty State: Private Mode (card anggota lain tersembunyi) ── */}
      {isPrivateMode && !isRevealed && visibleCards.length === 0 && (
        <div className="retro-private-empty-state">
          <div className="retro-private-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="9" y1="7" x2="15" y2="7" />
              <line x1="9" y1="11" x2="15" y2="11" />
              <line x1="9" y1="15" x2="12" y2="15" />
            </svg>
          </div>
          <p className="retro-private-empty-title">Tidak ada card yang terlihat</p>
          <p className="retro-private-empty-desc">
            Card anggota lain akan muncul<br />setelah reveal.
          </p>
        </div>
      )}

      {/* ── Regular Empty State ── */}
      {!isPrivateMode && visibleCards.length === 0 && (
        <div className="retro-column-empty-state">
          <p>Belum ada catatan</p>
          <p>Jadilah yang pertama</p>
          <p>menambahkan.</p>
        </div>
      )}
    </div>
  );
}
