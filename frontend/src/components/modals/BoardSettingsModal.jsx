import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

export default function BoardSettingsModal({
  isOpen,
  onClose,
  board,
  isAnonymous,
  onSave,
}) {
  const [boardName, setBoardName] = useState('');
  const [anonymousActive, setAnonymousActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBoardName(board?.name || board?.title || '');
      setAnonymousActive(Boolean(isAnonymous));
      setIsSubmitting(false);
    }
  }, [isOpen, board, isAnonymous]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onSave) {
        await onSave({
          boardName: boardName.trim() || board?.name || board?.title,
          isAnonymous: anonymousActive,
        });
      }
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan pengaturan board:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="board-settings-modal-overlay" onClick={onClose}>
      <div
        className="board-settings-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="board-settings-modal-header">
          <h3 className="board-settings-modal-title">Pengaturan Board</h3>
          <button
            type="button"
            className="board-settings-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="board-settings-form">
          {/* Field: Nama Board */}
          <div className="board-settings-field">
            <label className="board-settings-label" htmlFor="board-name-input">
              Nama Board
            </label>
            <input
              id="board-name-input"
              type="text"
              className="board-settings-input"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Masukkan nama board..."
              required
            />
          </div>

          {/* Setting: Mode Anonymous Toggle */}
          <div className="board-settings-toggle-row">
            <div className="board-settings-toggle-info">
              <div className="board-settings-toggle-title">Mode Anonymous</div>
              <div className="board-settings-toggle-subtitle">
                Sembunyikan nama author card dari semua anggota.
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={anonymousActive}
              className={`board-settings-switch ${anonymousActive ? 'active' : ''}`}
              onClick={() => setAnonymousActive((prev) => !prev)}
            >
              <span className="board-settings-switch-thumb" />
            </button>
          </div>

          {/* Info Alert Box */}
          <div className="board-settings-info-box">
            <div className="board-settings-info-icon-wrapper">
              <Info size={18} className="board-settings-info-icon" />
            </div>
            <div className="board-settings-info-text">
              Nama author tetap tersimpan di sistem. Hanya fasilitator yang dapat melihat identitas author
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="board-settings-actions">
            <button
              type="button"
              className="board-settings-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              BATAL
            </button>
            <button
              type="submit"
              className="board-settings-btn-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
