import React, { useState, useEffect } from 'react';
import {
  Zap,
  X,
  ArrowLeft,
  ArrowRight,
  Play,
  Square,
  FastForward,
  MoreVertical,
  ThumbsUp,
  MessageSquare,
  CircleSlash,
  Sparkles,
  User,
  Radio,
} from 'lucide-react';
import '../../styles/presentation.css';

/**
 * PresentationOverlay Component
 * Displays synchronized presentation mode for Retrospective Boards.
 * Facilitator has full navigation controls (Next, Prev, Stop).
 * Team members follow along in real-time with read-only state.
 */
export default function PresentationOverlay({
  isOpen = false,
  isFacilitator = false,
  card = null,
  currentIndex = 0,
  totalCards = 1,
  isFirst = true,
  isLast = false,
  onNext,
  onPrev,
  onStop,
  onClose,
  isNavigating = false,
}) {
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  // Close confirmation modal if overlay is closed
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmStop(false);
    }
  }, [isOpen]);

  // Keyboard navigation shortcuts for facilitator
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Escape closes confirmation or opens it
      if (e.key === 'Escape') {
        if (showConfirmStop) {
          setShowConfirmStop(false);
        } else if (isFacilitator) {
          setShowConfirmStop(true);
        } else if (onClose) {
          onClose();
        }
        return;
      }

      // Left and right arrow keys for facilitator
      if (isFacilitator && !isNavigating && !showConfirmStop) {
        if (e.key === 'ArrowLeft' && !isFirst && onPrev) {
          e.preventDefault();
          onPrev();
        } else if (e.key === 'ArrowRight' && !isLast && onNext) {
          e.preventDefault();
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFacilitator, isNavigating, showConfirmStop, isFirst, isLast, onNext, onPrev, onClose]);

  if (!isOpen) return null;

  // Determine Column Type and Styling
  const rawColName = (card?.columnName || card?.columnType || '').toUpperCase();
  let colTheme = 'theme-default';
  let ColIcon = Sparkles;
  let colDisplayName = card?.columnName || 'RETROSPECTIVE';

  if (rawColName.includes('START') || rawColName.includes('MULAI') || rawColName.includes('WENT WELL')) {
    colTheme = 'theme-start';
    ColIcon = Play;
    colDisplayName = card?.columnName || 'START';
  } else if (rawColName.includes('STOP') || rawColName.includes('BERHENTI') || rawColName.includes('NOT WELL')) {
    colTheme = 'theme-stop';
    ColIcon = Square;
    colDisplayName = card?.columnName || 'STOP';
  } else if (rawColName.includes('CONTINUE') || rawColName.includes('LANJUT') || rawColName.includes('ACTION')) {
    colTheme = 'theme-continue';
    ColIcon = FastForward;
    colDisplayName = card?.columnName || 'CONTINUE';
  }

  // Format Card Timestamp
  const formatTime = (dateString) => {
    if (!dateString) return '10:32 AM';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '10:32 AM';
    }
  };

  // Author details
  const isAnon = Boolean(card?.isAnonymous);
  const authorName = isAnon ? 'Anonymous' : (card?.author?.name || 'Afrizal');
  const authorAvatar = !isAnon && card?.author?.avatarUrl
    ? card.author.avatarUrl
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${isAnon ? 'anon' : (card?.author?.email || authorName)}`;

  // Vote & Comments count
  const votesCount = card?.votesCount ?? (Array.isArray(card?.votes) ? card.votes.length : 0);
  const commentsCount = card?.commentsCount ?? (Array.isArray(card?.comments) ? card.comments.length : 0);

  // Total safe cards count
  const safeTotal = Math.max(totalCards, 1);
  const displayIndex = Math.min(currentIndex + 1, safeTotal);

  return (
    <>
      {/* ── Main Fullscreen Backdrop ── */}
      <div className="presentation-overlay-backdrop">
        <div className="presentation-modal-container">
          
          {/* ── Header ── */}
          <div className="presentation-modal-header">
            <div className="presentation-header-left">
              <div className="presentation-header-badge">
                <Zap size={18} fill="#4f46e5" strokeWidth={2.5} />
              </div>
              <span className="presentation-header-title">PRESENTATION MODE</span>
            </div>

            <button
              type="button"
              className="presentation-header-close"
              onClick={() => {
                if (isFacilitator) {
                  setShowConfirmStop(true);
                } else if (onClose) {
                  onClose();
                }
              }}
              title={isFacilitator ? "Hentikan Presentation" : "Tutup Overlay"}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Modal Body ── */}
          <div className="presentation-modal-body">
            
            {/* ── Progress Stepper ── */}
            <div className="presentation-stepper-wrapper">
              <div className="presentation-stepper-header">
                Card {displayIndex} / {safeTotal}
              </div>

              <div className="presentation-stepper-track">
                {Array.from({ length: safeTotal }).map((_, idx) => (
                  <React.Fragment key={idx}>
                    {/* Dot circle */}
                    <div
                      className={`presentation-stepper-dot ${
                        idx <= currentIndex ? 'active' : ''
                      }`}
                      title={`Card ${idx + 1}`}
                    />
                    {/* Segment between dots (omit after last dot) */}
                    {idx < safeTotal - 1 && (
                      <div
                        className={`presentation-stepper-segment ${
                          idx < currentIndex ? 'active' : ''
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* ── Center Showcase Row: Prev Nav + Card Container + Next Nav ── */}
            <div className="presentation-showcase-row">
              
              {/* Previous Nav Column */}
              <div className="presentation-nav-col">
                <button
                  type="button"
                  className="presentation-nav-btn prev"
                  disabled={!isFacilitator || isFirst || isNavigating}
                  onClick={() => {
                    if (isFacilitator && !isFirst && onPrev) {
                      onPrev();
                    }
                  }}
                  title={!isFacilitator ? "Hanya fasilitator yang dapat bernavigasi" : "Card sebelumnya"}
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <span className="presentation-nav-label">Previous</span>
              </div>

              {/* Main Card Container with Column Theming */}
              <div className={`presentation-card-container ${colTheme}`}>
                
                {/* Column Header */}
                <div className="presentation-col-header">
                  <div className="presentation-col-left">
                    <div className={`presentation-col-icon ${colTheme}`}>
                      <ColIcon size={14} fill="currentColor" />
                    </div>
                    <span className={`presentation-col-name ${colTheme}`}>
                      {colDisplayName}
                    </span>
                  </div>
                  
                  {/* Optional column indicator badge */}
                  <span className={`presentation-col-badge ${colTheme}`}>
                    {displayIndex}
                  </span>
                </div>

                {/* Inner White Card */}
                <div className="presentation-inner-card">
                  <div className="presentation-card-body-top">
                    <div className="presentation-card-content">
                      {card?.content || 'Belum ada catatan pada card ini.'}
                    </div>
                    <button
                      type="button"
                      className="presentation-card-more-btn"
                      tabIndex={-1}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* Card Footer: Author + Metrics */}
                  <div className="presentation-card-footer">
                    <div className="presentation-card-author">
                      {isAnon ? (
                        <div className="presentation-card-avatar-fallback">
                          <User size={15} />
                        </div>
                      ) : (
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="presentation-card-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      )}
                      <div
                        className="presentation-card-avatar-fallback"
                        style={{ display: 'none' }}
                      >
                        {authorName.charAt(0).toUpperCase()}
                      </div>

                      <div className="presentation-author-meta">
                        <span className="presentation-author-name">{authorName}</span>
                        <span className="presentation-card-time">
                          {formatTime(card?.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="presentation-card-metrics">
                      <div className="presentation-metric-item" title="Votes">
                        <ThumbsUp size={14} />
                        <span>{votesCount}</span>
                      </div>
                      <div className="presentation-metric-item" title="Komentar">
                        <MessageSquare size={14} />
                        <span>{commentsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Nav Column */}
              <div className="presentation-nav-col">
                <button
                  type="button"
                  className="presentation-nav-btn next"
                  disabled={!isFacilitator || isLast || isNavigating}
                  onClick={() => {
                    if (isFacilitator && !isLast && onNext) {
                      onNext();
                    }
                  }}
                  title={!isFacilitator ? "Hanya fasilitator yang dapat bernavigasi" : "Card berikutnya"}
                >
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
                <span className="presentation-nav-label">Next</span>
              </div>
            </div>

            {/* ── Bottom Controls: Facilitator vs Member ── */}
            {isFacilitator ? (
              /* Facilitator: Hentikan Presentation Button (Screenshot 2) */
              <div className="presentation-bottom-actions">
                <button
                  type="button"
                  className="presentation-stop-btn"
                  onClick={() => setShowConfirmStop(true)}
                  title="Hentikan Mode Presentasi"
                >
                  <CircleSlash size={16} strokeWidth={2.2} />
                  <span>Hentikan Presentation</span>
                </button>
              </div>
            ) : (
              /* Member: Waiting Indicator Box (Screenshot 4) */
              <div className="presentation-member-waiting-box">
                <div className="presentation-waiting-icon-pulse">
                  <div className="presentation-waiting-icon-inner" />
                </div>
                <span className="presentation-waiting-title">Menunggu Facilitator</span>
                <span className="presentation-waiting-desc">
                  Untuk Melanjutkan Ke Card Berikutnya.......
                </span>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Stop Confirmation Modal (Screenshot 3) ── */}
      {showConfirmStop && (
        <div className="presentation-confirm-backdrop">
          <div className="presentation-confirm-dialog">
            <div className="presentation-confirm-icon-wrapper">
              <CircleSlash size={32} strokeWidth={2.5} />
            </div>

            <h3 className="presentation-confirm-title">
              Hentikan Presentation?
            </h3>

            <p className="presentation-confirm-subtitle">
              Semua Anggota Akan Kembali Ke Board
            </p>

            <div className="presentation-confirm-buttons">
              <button
                type="button"
                className="presentation-btn-cancel"
                onClick={() => setShowConfirmStop(false)}
              >
                Batal
              </button>

              <button
                type="button"
                className="presentation-btn-confirm-stop"
                onClick={() => {
                  setShowConfirmStop(false);
                  if (onStop) {
                    onStop();
                  }
                }}
              >
                <CircleSlash size={16} strokeWidth={2.2} />
                <span>Hentikan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
