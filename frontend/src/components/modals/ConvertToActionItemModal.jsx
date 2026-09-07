import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, ChevronDown, Check, User } from 'lucide-react';

export default function ConvertToActionItemModal({
  isOpen,
  onClose,
  card,
  members = [],
  currentUser,
  onConfirm,
}) {
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assigneeDropdownRef = useRef(null);
  const dateInputRef = useRef(null);

  // Format date helper: "2026-06-30" -> "30 Jun 2026"
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Pilih Tanggal';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = d.getDate();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Default due date to current date + 7 days
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);

      // Default Assignee: First member or currentUser
      const defaultMember =
        members.length > 0
          ? members[0]
          : {
              id: currentUser?.id || 'u1',
              name: currentUser?.name || 'Budi Santoso',
              avatarUrl:
                currentUser?.avatarUrl ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=budi',
            };
      setSelectedAssignee(defaultMember);

      setDescription('');
      setIsAssigneeDropdownOpen(false);
      setIsSubmitting(false);
    }
  }, [isOpen, members, currentUser]);

  // Click outside listener for assignee dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(e.target)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    if (isAssigneeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssigneeDropdownOpen]);

  if (!isOpen || !card) return null;

  const cardText = card.content || card.text || 'Catatan Retrospective';
  const authorName =
    card.author?.name || card.authorName || (typeof card.author === 'string' ? card.author : 'Anggota Tim');
  const authorTime =
    card.time ||
    (card.createdAt
      ? new Date(card.createdAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '10:20 AM');

  // Available members list
  const availableMembers =
    members.length > 0
      ? members
      : [
          {
            id: 'm1',
            name: 'Budi Santoso',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          },
          {
            id: 'm2',
            name: 'Afrizal',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          },
          {
            id: 'm3',
            name: 'Sarah Wijaya',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          },
        ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (onConfirm) {
      onConfirm({
        card,
        assignee: selectedAssignee || availableMembers[0],
        dueDate,
        description: description.trim(),
      });
    }
    // onClose is called by parent (handleConfirmConvert) after setting state
  };

  return (
    <div className="convert-modal-overlay" onClick={onClose}>
      <div
        className="convert-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="convert-modal-header">
          <h3 className="convert-modal-title">Convert Card to Action Item</h3>
          <button
            type="button"
            className="convert-close-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="convert-modal-form">
          {/* Card Preview Banner (Screenshot 3) */}
          <div className="convert-card-preview">
            <div className="convert-card-preview-icon-box">
              <div className="four-dots-icon" style={{ '--dot-color': '#5956e9' }}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="convert-card-preview-info">
              <h4 className="convert-card-preview-title">{cardText}</h4>
              <p className="convert-card-preview-meta">
                Dibuat oleh: <span className="convert-author-bold">{authorName}</span> • {authorTime}
              </p>
            </div>
          </div>

          {/* Field 1: Assignee */}
          <div className="convert-field" ref={assigneeDropdownRef}>
            <label className="convert-label">Assignee</label>
            <div
              className={`convert-select-box ${isAssigneeDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
            >
              <div className="convert-select-left">
                {selectedAssignee?.avatarUrl ? (
                  <img
                    src={selectedAssignee.avatarUrl}
                    alt={selectedAssignee.name}
                    className="convert-member-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAssignee?.name || 'user'}`;
                    }}
                  />
                ) : (
                  <div className="convert-member-avatar-placeholder">
                    <User size={14} />
                  </div>
                )}
                <span className="convert-member-name">
                  {selectedAssignee?.name || 'Pilih Assignee'}
                </span>
              </div>
              <ChevronDown
                size={18}
                className={`convert-chevron ${isAssigneeDropdownOpen ? 'rotated' : ''}`}
              />
            </div>

            {/* Dropdown popup */}
            {isAssigneeDropdownOpen && (
              <div className="convert-dropdown-list">
                {availableMembers.map((m) => {
                  const isSelected = selectedAssignee?.id === m.id || selectedAssignee?.name === m.name;
                  return (
                    <div
                      key={m.id || m.name}
                      className={`convert-dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAssignee(m);
                        setIsAssigneeDropdownOpen(false);
                      }}
                    >
                      <div className="convert-select-left">
                        <img
                          src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                          alt={m.name}
                          className="convert-member-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`;
                          }}
                        />
                        <span className="convert-member-name">{m.name}</span>
                      </div>
                      {isSelected && <Check size={16} color="#5956e9" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Field 2: Due Date */}
          <div className="convert-field">
            <label className="convert-label">Due Date</label>
            <div
              className="convert-date-box"
              onClick={() => {
                if (dateInputRef.current) {
                  try {
                    dateInputRef.current.showPicker();
                  } catch {
                    dateInputRef.current.focus();
                  }
                }
              }}
            >
              <div className="convert-date-left">
                <Calendar size={18} className="convert-calendar-icon" />
                <span className="convert-date-text">
                  {formatDateDisplay(dueDate)}
                </span>
              </div>
              <ChevronDown size={18} className="convert-chevron" />
              <input
                ref={dateInputRef}
                type="date"
                className="convert-hidden-date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Field 3: Deskripsi (opsional) */}
          <div className="convert-field">
            <label className="convert-label">Deskripsi (opsional)</label>
            <textarea
              className="convert-textarea"
              rows={3}
              placeholder="Perlu dibuat checklist dan automation test agar testing tidak terlambat"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Action Buttons (BATAL & CONVERT) */}
          <div className="convert-modal-actions">
            <button
              type="button"
              className="convert-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              BATAL
            </button>
            <button
              type="submit"
              className="convert-btn-submit"
              disabled={isSubmitting}
            >
              CONVERT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
