import React, { useState } from 'react';
import RetroCard from './RetroCard';
import RetroCardInput from './RetroCardInput';

export default function RetroColumn({
  column,
  cards = [],
  onAddCard,
  onEditCard,
  onDeleteCard,
  onCopyCard,
  onVoteCard,
  currentUser
}) {
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveCard = (text) => {
    onAddCard(column.id, text);
    setIsAdding(false);
  };

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

  const columnClass = `retro-board-column retro-column-${column.id || 'default'}`;

  return (
    <div 
      className={columnClass}
      style={{
        backgroundColor: column.bg || '#f8fafc',
        border: `1px solid ${column.border || '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '16px'
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
            color: column.badgeColor || column.color || '#334155'
          }}
        >
          {cards.length}
        </span>
      </div>

      {/* ── "+ Tambah Catatan" Button ── */}
      <button
        type="button"
        className="btn-column-add-note"
        onClick={() => setIsAdding(true)}
        style={{
          border: `1.5px solid ${column.border || column.color || '#cbd5e1'}`,
          color: column.color || '#2563eb'
        }}
      >
        + Tambah Catatan
      </button>

      {/* ── Active Inline Card Creation Form ── */}
      {isAdding && (
        <RetroCardInput
          onSave={handleSaveCard}
          onCancel={() => setIsAdding(false)}
          placeholder={`Tulis catatan untuk ${column.title || column.name}...`}
        />
      )}

      {/* ── Sticky Notes / Cards List ── */}
      {cards.length > 0 && (
        <div className="retro-column-cards-list">
          {cards.map((card) => (
            <RetroCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onCopy={onCopyCard}
              onVote={onVoteCard}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {cards.length === 0 && (
        <div className="retro-column-empty-state">
          <p>Belum ada catatan</p>
          <p>Jadilah yang pertama</p>
          <p>menambahkan.</p>
        </div>
      )}
    </div>
  );
}
