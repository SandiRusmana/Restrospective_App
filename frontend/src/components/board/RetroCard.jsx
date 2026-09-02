import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Copy, Trash2, Check, ThumbsUp, Flame } from 'lucide-react';

export default function RetroCard({
  card,
  onEdit,
  onDelete,
  onCopy,
  onVote,
  currentUser,
  isPriority: isPriorityProp
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(card?.content || card?.text || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isVoteAnimating, setIsVoteAnimating] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setEditText(card?.content || card?.text || '');
  }, [card]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const authorName = card?.author?.name || card?.authorName || card?.author || 'Afrizal';
  const authorAvatar = card?.author?.avatarUrl || card?.author?.avatar || card?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`;
  const timestamp = card?.time || (card?.createdAt ? new Date(card.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:32 AM');
  const cardText = card?.content || card?.text || '';
  const votes = card?.votes !== undefined ? card?.votes : 0;

  // Determine if current user has voted
  const userId = currentUser?.id || currentUser?.email || 'current_user';
  const hasVoted = card?.hasVoted !== undefined 
    ? card.hasVoted 
    : (Array.isArray(card?.votedBy) && card.votedBy.includes(userId));

  // Determine if this is a priority card (explicit prop, or card.isPriority, or votes >= 10)
  const isPriority = Boolean(isPriorityProp ?? card?.isPriority ?? (votes >= 10));

  const handleVoteClick = (e) => {
    e.stopPropagation();
    setIsVoteAnimating(true);
    setTimeout(() => setIsVoteAnimating(false), 400);
    if (onVote) {
      onVote(card.id);
    }
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editText.trim()) return;
    if (onEdit) {
      onEdit(card.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(cardText);
      setIsCopied(true);
      if (onCopy) onCopy(cardText);
      setTimeout(() => setIsCopied(false), 1500);
    }
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(card);
    }
  };

  if (isEditing) {
    return (
      <div className="retro-sticky-card retro-card-editing">
        <form onSubmit={handleSaveEdit}>
          <textarea
            className="retro-card-edit-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="retro-card-edit-actions">
            <button
              type="button"
              className="btn-retro-input-cancel"
              onClick={() => {
                setEditText(cardText);
                setIsEditing(false);
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-retro-input-submit"
              disabled={!editText.trim()}
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    );
  }

  const cardClasses = [
    'retro-sticky-card',
    isPriority ? 'retro-card-priority' : '',
    (!isPriority && hasVoted) ? 'retro-card-voted' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {/* Priority Badge */}
      {isPriority && (
        <div className="retro-card-priority-badge">
          <Flame size={12} className="retro-priority-badge-icon" />
          <span>PRIORITAS TIM</span>
        </div>
      )}

      <div className="retro-card-header-row">
        <div className="retro-card-body">
          <p className="retro-card-text">{cardText}</p>
        </div>

        {/* 3-Dots Menu Dropdown */}
        <div className="retro-card-actions-wrapper" ref={menuRef}>
          <button
            type="button"
            className="btn-retro-card-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Opsi Catatan"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div className="retro-card-menu-dropdown">
              <button
                type="button"
                className="retro-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEditing(true);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Catatan</span>
              </button>
              <button
                type="button"
                className="retro-menu-item"
                onClick={handleCopy}
              >
                {isCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
              <button
                type="button"
                className="retro-menu-item retro-menu-item-delete"
                onClick={handleDelete}
              >
                <Trash2 size={13} />
                <span>Hapus Catatan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Left Avatar/Author, Right Voting */}
      <div className="retro-card-footer">
        <div className="retro-card-author-info">
          <img
            src={authorAvatar}
            alt={authorName}
            className="retro-card-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`;
            }}
          />
          <div className="retro-card-author-meta">
            <span className="retro-card-author-name">{authorName}</span>
            <span className="retro-card-time">{timestamp}</span>
          </div>
        </div>

        {/* Voting Action Section */}
        <div className="retro-card-vote-section">
          <button
            type="button"
            className={`btn-retro-vote ${hasVoted ? 'voted' : ''} ${isPriority ? 'priority' : ''} ${isVoteAnimating ? 'vote-pop' : ''}`}
            onClick={handleVoteClick}
            title={hasVoted ? 'Batalkan vote Anda' : 'Beri vote (+1)'}
          >
            <ThumbsUp 
              size={15} 
              className={`retro-vote-icon ${hasVoted ? 'filled' : ''}`}
            />
            <span className="retro-vote-count">{votes}</span>
          </button>

          {/* Voted badge indicator pill (Screenshot 2) */}
          {hasVoted && !isPriority && (
            <span className="retro-voted-pill">Voted</span>
          )}
        </div>
      </div>
    </div>
  );
}
