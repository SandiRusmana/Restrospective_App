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
  currentUser
}) {
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveCard = (text) => {
    onAddCard(column.id, text);
    setIsAdding(false);
  };

  // Render specific icon based on column type
  const renderColumnIcon = () => {
    if (column.id === 'start' || column.type === 'start') {
      return (
        <div className="retro-col-icon-circle retro-icon-start">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      );
    }
    if (column.id === 'stop' || column.type === 'stop') {
      return (
        <div className="retro-col-icon-circle retro-icon-stop">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </div>
      );
    }
    // Continue or default
    return (
      <div className="retro-col-icon-circle retro-icon-continue">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  };

  const columnClass = `retro-board-column retro-column-${column.id || 'default'}`;

  return (
    <div className={columnClass}>
      {/* ── Column Header ── */}
      <div className="retro-column-header">
        <div className="retro-column-header-title">
          {renderColumnIcon()}
          <h2 className="retro-column-name">{column.title || column.name}</h2>
        </div>
        <span className="retro-column-count-badge">
          {cards.length}
        </span>
      </div>

      {/* ── "+ Tambah Catatan" Button ── */}
      <button
        type="button"
        className="btn-column-add-note"
        onClick={() => setIsAdding(true)}
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
