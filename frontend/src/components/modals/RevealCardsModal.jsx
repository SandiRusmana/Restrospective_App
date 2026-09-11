import React, { useEffect, useRef } from 'react';
import { Eye, X, FileText } from 'lucide-react';

/**
 * RevealCardsModal
 * Konfirmasi sebelum mengungkap semua private card ke seluruh anggota tim.
 *
 * Props:
 *   isOpen         {boolean}  - apakah modal terbuka
 *   onClose        {function} - tutup modal tanpa reveal
 *   onConfirm      {function} - lanjutkan reveal semua card
 *   privateCount   {number}   - jumlah card yang akan di-reveal
 */
export default function RevealCardsModal({ isOpen, onClose, onConfirm, privateCount = 0 }) {
  const modalRef = useRef(null);

  // Tutup modal saat klik di luar area modal
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Tutup modal dengan Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="reveal-modal-overlay">
      <div className="reveal-modal-card" ref={modalRef}>
        {/* Tombol tutup */}
        <button
          type="button"
          className="reveal-modal-close-btn"
          onClick={onClose}
          title="Batal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="reveal-modal-header">
          <div className="reveal-modal-icon-wrap">
            <Eye size={26} color="#5956e9" strokeWidth={2} />
          </div>
          <h2 className="reveal-modal-title">Reveal semua card?</h2>
          <p className="reveal-modal-subtitle">
            Setelah di-reveal, semua feedback akan terlihat<br />
            oleh seluruh anggota tim
          </p>
        </div>

        {/* Card count preview */}
        <div className="reveal-modal-count-box">
          <FileText size={32} color="#5956e9" strokeWidth={1.5} />
          <span className="reveal-modal-count-text">
            {privateCount} card siap untuk di-reveal
          </span>
        </div>

        {/* Aksi */}
        <div className="reveal-modal-actions">
          <button
            type="button"
            className="reveal-modal-btn-cancel"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="reveal-modal-btn-confirm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Reveal Cards
          </button>
        </div>
      </div>
    </div>
  );
}
