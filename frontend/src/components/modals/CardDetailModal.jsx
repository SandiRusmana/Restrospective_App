import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ThumbsUp,
  MessageSquare,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Check
} from 'lucide-react';

export default function CardDetailModal({
  isOpen,
  onClose,
  card,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onVoteCard,
}) {
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const [copiedCommentId, setCopiedCommentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);

  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, card?.id]);

  // Handle click outside comment action menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuCommentId(null);
      }
    };
    if (activeMenuCommentId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuCommentId]);

  if (!isOpen || !card) return null;

  const authorName = card.author?.name || card.authorName || 'Sarah Wijaya';
  const timestamp = card.time || (card.createdAt ? new Date(card.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:20 AM');
  const cardText = card.content || card.text || 'Detail Catatan';

  const votesCount = typeof card.votesCount === 'number'
    ? card.votesCount
    : Array.isArray(card.votes)
    ? card.votes.length
    : typeof card.votes === 'number'
    ? card.votes
    : 8;

  const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
  const hasVoted = Boolean(
    card.hasVoted ||
    (Array.isArray(card.votes) && card.votes.some((v) => (v.userId || v.id || v) === currentUserId))
  );

  const comments = Array.isArray(card.comments) ? card.comments : [];
  const commentsCount = comments.length > 0 ? comments.length : (card.commentCount || 4);

  const userAvatar = currentUser?.avatarUrl || currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'afrizal'}`;

  // Handler: Submit New Comment
  const handleSendComment = async (e) => {
    if (e) e.preventDefault();
    const text = commentInput.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newCommentId = await onAddComment(card.id, text);
      setCommentInput('');
      if (newCommentId) {
        setHighlightedCommentId(newCommentId);
        setTimeout(() => setHighlightedCommentId(null), 3500);
      }
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Key press (Enter to send)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  // Handler: Copy Comment
  const handleCopyComment = (commentId, text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCommentId(commentId);
      setTimeout(() => setCopiedCommentId(null), 1500);
    }
    setActiveMenuCommentId(null);
  };

  // Handler: Start Editing Comment
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text || comment.content || '');
    setActiveMenuCommentId(null);
  };

  // Handler: Save Edited Comment
  const handleSaveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    if (onEditComment) {
      await onEditComment(card.id, commentId, editCommentText.trim());
    }
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // Handler: Delete Comment
  const handleDeleteCommentItem = (commentId) => {
    setActiveMenuCommentId(null);
    if (onDeleteComment) {
      onDeleteComment(card.id, commentId);
    }
  };

  return (
    <div className="retro-modal-backdrop" onClick={onClose}>
      <div
        className="retro-detail-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Modal Header ── */}
        <div className="retro-detail-header">
          <h2 className="retro-detail-title">Detail Catatan</h2>
          <button
            type="button"
            className="retro-detail-close-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Card Content Section ── */}
        <div className="retro-detail-content-section">
          <h3 className="retro-detail-card-text">{cardText}</h3>
          
          <div className="retro-detail-meta">
            <span className="retro-detail-meta-label">Dibuat oleh:</span>
            <span className="retro-detail-meta-author">{authorName}</span>
            <span className="retro-detail-meta-bullet">•</span>
            <span className="retro-detail-meta-time">{timestamp}</span>
          </div>

          {/* Stats Bar: Vote & Comment Counter */}
          <div className="retro-detail-stats-row">
            <button
              type="button"
              className={`retro-detail-vote-btn ${hasVoted ? 'voted' : ''}`}
              onClick={() => onVoteCard && onVoteCard(card.id)}
              title={hasVoted ? 'Batalkan vote' : 'Beri vote (+1)'}
            >
              <ThumbsUp size={15} className={`retro-detail-vote-icon ${hasVoted ? 'filled' : ''}`} />
              <span>{votesCount} Vote</span>
            </button>

            <div className="retro-detail-comment-pill">
              <MessageSquare size={15} className="retro-detail-comment-icon" />
              <span>{commentsCount} Komentar</span>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="retro-detail-divider" />

        {/* ── Comments Section ── */}
        <div className="retro-detail-comments-container">
          <h4 className="retro-detail-comments-heading">Komentar</h4>

          <div className="retro-detail-comments-list">
            {comments.length === 0 ? (
              <div className="retro-detail-no-comments">
                <MessageSquare size={28} className="retro-no-comments-icon" />
                <p>Belum ada komentar.</p>
                <span>Jadilah yang pertama memberikan masukan!</span>
              </div>
            ) : (
              comments.map((comment) => {
                const cAuthorName = comment.author?.name || comment.authorName || 'Budi Santoso';
                const cAuthorAvatar = comment.author?.avatarUrl || comment.author?.avatar || comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cAuthorName}`;
                const cTime = comment.time || (comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:25 AM');
                const cText = comment.text || comment.content || '';
                const isHighlighted = highlightedCommentId === comment.id || comment.isHighlighted;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`retro-comment-item ${isHighlighted ? 'retro-comment-highlighted' : ''}`}
                  >
                    <img
                      src={cAuthorAvatar}
                      alt={cAuthorName}
                      className="retro-comment-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${cAuthorName}`;
                      }}
                    />

                    <div className="retro-comment-body">
                      <div className="retro-comment-top-row">
                        <span className="retro-comment-author">{cAuthorName}</span>

                        {/* Comment Action Menu (3-dots) */}
                        <div
                          className="retro-comment-menu-wrapper"
                          ref={activeMenuCommentId === comment.id ? menuRef : null}
                        >
                          <button
                            type="button"
                            className="btn-comment-menu-trigger"
                            onClick={() =>
                              setActiveMenuCommentId(
                                activeMenuCommentId === comment.id ? null : comment.id
                              )
                            }
                            title="Opsi komentar"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenuCommentId === comment.id && (
                            <div className="retro-comment-dropdown">
                              <button
                                type="button"
                                className="retro-comment-dropdown-item"
                                onClick={() => handleStartEdit(comment)}
                              >
                                <Edit2 size={13} />
                                <span>Edit Komentar</span>
                              </button>
                              <button
                                type="button"
                                className="retro-comment-dropdown-item"
                                onClick={() => handleCopyComment(comment.id, cText)}
                              >
                                {copiedCommentId === comment.id ? (
                                  <Check size={13} color="#16a34a" />
                                ) : (
                                  <Copy size={13} />
                                )}
                                <span>{copiedCommentId === comment.id ? 'Tersalin!' : 'Salin Teks'}</span>
                              </button>
                              <button
                                type="button"
                                className="retro-comment-dropdown-item delete"
                                onClick={() => handleDeleteCommentItem(comment.id)}
                              >
                                <Trash2 size={13} />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comment Text or Inline Edit */}
                      {isEditing ? (
                        <div className="retro-comment-edit-box">
                          <input
                            type="text"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="retro-comment-edit-input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditComment(comment.id);
                              if (e.key === 'Escape') setEditingCommentId(null);
                            }}
                          />
                          <div className="retro-comment-edit-actions">
                            <button
                              type="button"
                              className="btn-comment-edit-cancel"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              className="btn-comment-edit-save"
                              onClick={() => handleSaveEditComment(comment.id)}
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="retro-comment-text">{cText}</p>
                          <span className="retro-comment-time">{cTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* ── Sticky Comment Input Bar at Bottom ── */}
        <form className="retro-detail-input-bar" onSubmit={handleSendComment}>
          <img
            src={userAvatar}
            alt={currentUser?.name || 'User'}
            className="retro-input-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=afrizal`;
            }}
          />

          <div className="retro-input-field-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="retro-detail-comment-input"
              placeholder="Tulis komentar..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn-retro-detail-send"
            disabled={!commentInput.trim() || isSubmitting}
            title="Kirim Komentar (Enter)"
            aria-label="Kirim Komentar"
          >
            <Send size={16} className="retro-send-icon" />
          </button>
        </form>
      </div>
    </div>
  );
}
