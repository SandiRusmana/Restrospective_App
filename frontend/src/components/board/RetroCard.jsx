import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Check,
  ThumbsUp,
  Flame,
  Unlink,
  ArrowRightLeft,
  MessageSquare
} from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function RetroCard({
  card,
  isInGroup = false,
  columns = [],
  onEdit,
  onDelete,
  onCopy,
  onVote,
  onUngroup,
  onMoveColumn,
  onOpenDetail,
  currentUser,
  isPriority: isPriorityProp,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(card?.content || card?.text || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isVoteAnimating, setIsVoteAnimating] = useState(false);
  const menuRef = useRef(null);

  // DnD Draggable hook
  const {
    attributes,
    listeners,
    setNodeRef: setDragNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `drag-card-${card.id}`,
    data: {
      type: 'card',
      card,
      columnId: card.columnId,
      groupId: card.groupId,
    },
    disabled: isEditing,
  });

  // DnD Droppable hook (for dropping another card onto this card to create/expand a cluster)
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: `drop-card-${card.id}`,
    data: {
      type: 'card',
      card,
      columnId: card.columnId,
      groupId: card.groupId,
    },
    disabled: isDragging || isEditing,
  });

  const setCombinedRef = (node) => {
    setDragNodeRef(node);
    setDropNodeRef(node);
  };

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

  const authorName = card?.author?.name || card?.authorName || card?.author || 'Anggota Tim';
  const authorAvatar =
    card?.author?.avatarUrl ||
    card?.author?.avatar ||
    card?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${card?.author?.email || authorName}`;
  const timestamp =
    card?.time ||
    (card?.createdAt
      ? new Date(card.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true })
      : 'Baru saja');
  const cardText = card?.content || card?.text || '';

  // Determine comments count
  const commentsArray = Array.isArray(card?.comments) ? card.comments : [];
  const commentsCount =
    typeof card?.commentsCount === 'number'
      ? card.commentsCount
      : typeof card?.commentCount === 'number'
      ? card.commentCount
      : commentsArray.length;

  // Determine vote count & voted state
  const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
  const votesArray = Array.isArray(card?.votes) ? card.votes : [];
  const votesCount =
    typeof card?.votesCount === 'number'
      ? card.votesCount
      : votesArray.length > 0
      ? votesArray.length
      : typeof card?.votes === 'number'
      ? card.votes
      : card?.voteCount || (card?.hasVoted ? 1 : 0);

  const hasVoted =
    Boolean(card?.hasVoted) ||
    votesArray.some((v) => (v.userId || v.id || v) === currentUserId) ||
    (Array.isArray(card?.votedBy) && card.votedBy.includes(currentUserId));

  // Determine if this is a priority card
  const isPriority = Boolean(isPriorityProp ?? card?.isPriority ?? (votesCount >= 3));

  const handleVoteClick = (e) => {
    if (e) e.stopPropagation();
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

  const handleUngroup = () => {
    setIsMenuOpen(false);
    if (onUngroup) {
      onUngroup(card.id);
    }
  };

  const isAuthor =
    !currentUser?.id ||
    card?.author?.id === currentUser?.id ||
    card?.authorId === currentUser?.id ||
    card?.author === currentUser?.name;

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
    !isPriority && hasVoted ? 'retro-card-voted' : '',
    isInGroup ? 'retro-card-grouped' : '',
    isDragging ? 'retro-card-dragging' : '',
    isOver ? 'retro-card-drop-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isEditing ? 'default' : 'grab',
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={cardClasses}
      {...attributes}
      {...listeners}
    >
      {/* Priority Badge */}
      {isPriority && (
        <div className="retro-card-priority-badge">
          <Flame size={12} className="retro-priority-badge-icon" />
          <span>PRIORITAS TIM</span>
        </div>
      )}

      {/* Card Header: Text on Left, 3-dots Menu on Right */}
      <div className="retro-card-header-row">
        <div
          className="retro-card-body"
          onClick={() => {
            if (!isEditing && onOpenDetail) {
              onOpenDetail(card);
            }
          }}
          title="Klik untuk membuka detail & komentar"
          style={{ cursor: 'pointer' }}
        >
          <p className="retro-card-text">{cardText}</p>
        </div>

        {/* 3-Dots Menu Dropdown */}
        <div
          className="retro-card-actions-wrapper"
          ref={menuRef}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn-retro-card-menu"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            title="Opsi Catatan"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div className="retro-card-menu-dropdown">
              {isAuthor && (
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
              )}

              <button
                type="button"
                className="retro-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onOpenDetail) onOpenDetail(card);
                }}
              >
                <MessageSquare size={13} />
                <span>Detail & Komentar</span>
              </button>

              {(isInGroup || Boolean(card.groupId)) && onUngroup && (
                <button
                  type="button"
                  className="retro-menu-item"
                  onClick={handleUngroup}
                >
                  <Unlink size={13} />
                  <span>Keluarkan dari Grup</span>
                </button>
              )}

              {/* Move to another column submenu */}
              {columns && columns.length > 1 && onMoveColumn && (
                <div className="retro-menu-move-section">
                  <div className="retro-menu-move-header">
                    <ArrowRightLeft size={12} />
                    <span>Pindahkan ke:</span>
                  </div>
                  {columns
                    .filter((col) => col.id !== card.columnId && col.type !== card.columnId)
                    .map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        className="retro-menu-move-item"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onMoveColumn(card.id, col.id);
                        }}
                      >
                        <span
                          className="retro-menu-col-dot"
                          style={{ backgroundColor: col.color || '#2563eb' }}
                        />
                        <span>{col.title || col.name}</span>
                      </button>
                    ))}
                </div>
              )}

              <button
                type="button"
                className="retro-menu-item"
                onClick={handleCopy}
              >
                {isCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>

              {isAuthor && (
                <button
                  type="button"
                  className="retro-menu-item retro-menu-item-delete"
                  onClick={handleDelete}
                >
                  <Trash2 size={13} />
                  <span>Hapus Catatan</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Left Avatar/Author, Right Voting & Comment */}
      <div className="retro-card-footer" onPointerDown={(e) => e.stopPropagation()}>
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

        {/* Voting & Comment Action Section */}
        <div className="retro-card-footer-stats">
          <button
            type="button"
            className={`btn-retro-vote ${hasVoted ? 'voted' : ''} ${isPriority ? 'priority' : ''} ${
              isVoteAnimating ? 'vote-pop' : ''
            }`}
            onClick={handleVoteClick}
            title={hasVoted ? 'Batalkan vote Anda' : 'Beri vote (+1)'}
          >
            <ThumbsUp
              size={15}
              className={`retro-vote-icon ${hasVoted ? 'filled' : ''}`}
            />
            <span className="retro-vote-count">{votesCount}</span>
          </button>

          <button
            type="button"
            className="btn-retro-comment-stat"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenDetail) onOpenDetail(card);
            }}
            title="Lihat & tambah komentar"
          >
            <MessageSquare size={14} className="retro-comment-stat-icon" />
            <span className="retro-comment-stat-count">{commentsCount}</span>
          </button>

          {/* Voted badge indicator pill */}
          {hasVoted && !isPriority && (
            <span className="retro-voted-pill">Voted</span>
          )}
        </div>
      </div>
    </div>
  );
}
