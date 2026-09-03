import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Unlink,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
  ArrowRightLeft,
  MoreVertical,
} from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import RetroCard from './RetroCard';

export default function RetroCardGroup({
  groupId,
  cards = [],
  columns = [],
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
  currentUser,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Ambil groupTitle dari kartu pertama yang memiliki judul custom
  const existingTitle = cards.find((c) => c.groupTitle)?.groupTitle || '';
  const [titleInput, setTitleInput] = useState(existingTitle);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const currentColumnId = cards[0]?.columnId;

  useEffect(() => {
    setTitleInput(existingTitle);
  }, [existingTitle]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

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

  // Draggable hook for the entire group cluster
  const {
    attributes: groupDragAttrs,
    listeners: groupDragListeners,
    setNodeRef: setGroupDragRef,
    transform: groupTransform,
    isDragging: isGroupDragging,
  } = useDraggable({
    id: `drag-group-${groupId}`,
    data: {
      type: 'group',
      groupId,
      cards,
      columnId: currentColumnId,
    },
    disabled: isEditingTitle,
  });

  // Droppable zone for the group so cards can be dragged directly into it
  const { setNodeRef: setGroupDropRef, isOver } = useDroppable({
    id: `group-drop-${groupId}`,
    data: {
      type: 'group',
      groupId,
      columnId: currentColumnId,
    },
    disabled: isGroupDragging,
  });

  const setCombinedRef = (node) => {
    setGroupDragRef(node);
    setGroupDropRef(node);
  };

  const totalVotes = cards.reduce((acc, c) => {
    const num =
      typeof c.votesCount === 'number'
        ? c.votesCount
        : Array.isArray(c.votes)
        ? c.votes.length
        : typeof c.votes === 'number'
        ? c.votes
        : 0;
    return acc + num;
  }, 0);

  const handleSaveTitle = (e) => {
    if (e) e.preventDefault();
    const finalTitle = titleInput.trim();
    if (onRenameGroup) {
      onRenameGroup(groupId, finalTitle);
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setTitleInput(existingTitle);
    setIsEditingTitle(false);
  };

  const displayGroupName = existingTitle || `Cluster (${cards.length} Catatan)`;

  const groupStyle = {
    transform: CSS.Translate.toString(groupTransform),
    opacity: isGroupDragging ? 0.4 : 1,
  };

  const availableColumns = columns.filter(
    (col) => col.id !== currentColumnId && col.type !== currentColumnId
  );

  return (
    <div
      ref={setCombinedRef}
      style={groupStyle}
      className={`retro-card-group-container ${isOver ? 'retro-group-drag-over' : ''} ${
        isGroupDragging ? 'retro-group-dragging' : ''
      }`}
    >
      {/* ── Group Cluster Header ── */}
      <div
        className="retro-group-header"
        {...groupDragAttrs}
        {...groupDragListeners}
        style={{ cursor: isEditingTitle ? 'default' : 'grab' }}
      >
        {isEditingTitle ? (
          /* Inline Rename Mode: Clean Full-width Input */
          <form
            className="retro-group-rename-form"
            onSubmit={handleSaveTitle}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="retro-group-icon-box">
              <Layers size={13} />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="retro-group-rename-input"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Beri nama grup cluster..."
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleSaveTitle}
            />
            <button
              type="submit"
              className="btn-group-rename-save"
              title="Simpan (Enter)"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              className="btn-group-rename-cancel"
              onClick={handleCancelEdit}
              title="Batal (Esc)"
            >
              <X size={13} />
            </button>
          </form>
        ) : (
          /* Normal Header Mode: Title + Badge + Chevron on Left, 3-Dots Menu on Right */
          <>
            <div
              className="retro-group-title-wrapper"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <div
                className="retro-group-icon-box"
                title="Tarik untuk memindahkan seluruh grup"
              >
                <Layers size={13} />
              </div>

              <div className="retro-group-info">
                <span className="retro-group-name" title={displayGroupName}>
                  {displayGroupName}
                </span>
                {totalVotes > 0 && (
                  <span className="retro-group-votes-badge">
                    👍 {totalVotes}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn-group-collapse"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                title={isCollapsed ? 'Buka grup' : 'Tutup grup'}
              >
                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            {/* 3-Dots Dropdown Menu for Group Operations */}
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
                title="Opsi Grup Cluster"
              >
                <MoreVertical size={15} />
              </button>

              {isMenuOpen && (
                <div className="retro-card-menu-dropdown retro-group-actions-dropdown">
                  {/* Rename Option */}
                  <button
                    type="button"
                    className="retro-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditingTitle(true);
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Ubah Nama Grup</span>
                  </button>

                  {/* Move to another column submenu */}
                  {availableColumns.length > 0 && onMoveGroupColumn && (
                    <div className="retro-menu-move-section">
                      <div className="retro-menu-move-header">
                        <ArrowRightLeft size={11} />
                        <span>Pindahkan grup ke:</span>
                      </div>
                      {availableColumns.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          className="retro-menu-move-item"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onMoveGroupColumn(groupId, col.id);
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

                  {/* Ungroup All Option */}
                  {onUngroupAll && (
                    <button
                      type="button"
                      className="retro-menu-item retro-menu-item-delete"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onUngroupAll(groupId);
                      }}
                    >
                      <Unlink size={13} />
                      <span>Pisahkan Semua</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Cards inside this Cluster ── */}
      {!isCollapsed && (
        <div className="retro-group-cards-list">
          {cards.map((card) => (
            <RetroCard
              key={card.id}
              card={card}
              isInGroup={true}
              columns={columns}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onCopy={onCopyCard}
              onVote={onVoteCard}
              onUngroup={onUngroupCard}
              onMoveColumn={onMoveColumn}
              onOpenDetail={onOpenDetail}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {isOver && (
        <div className="retro-group-drop-indicator">
          + Lepaskan di sini untuk menggabungkan ke grup
        </div>
      )}
    </div>
  );
}
