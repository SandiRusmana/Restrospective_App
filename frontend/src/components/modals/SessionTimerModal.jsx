import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PRESET_DURATIONS = [5, 10, 15, 20, 25, 30];

export default function SessionTimerModal({
  isOpen,
  onClose,
  onStartTimer,
  initialMinutes = 15,
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [customMinutes, setCustomMinutes] = useState(String(initialMinutes));

  useEffect(() => {
    if (isOpen) {
      const init = initialMinutes || 15;
      setSelectedMinutes(init);
      setCustomMinutes(String(init));
    }
  }, [isOpen, initialMinutes]);

  if (!isOpen) return null;

  const handleSelectPreset = (minutes) => {
    setSelectedMinutes(minutes);
    setCustomMinutes(String(minutes));
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    // Allow empty during typing, or positive numbers
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      setCustomMinutes(val);
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSelectedMinutes(parsed);
      } else {
        setSelectedMinutes(0);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const duration = selectedMinutes > 0 ? selectedMinutes : parseInt(customMinutes, 10) || 5;
    onStartTimer(duration);
    onClose();
  };

  return (
    <div className="session-timer-modal-overlay" onClick={onClose}>
      <div
        className="session-timer-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="session-timer-modal-header">
          <div className="session-timer-modal-title-wrap">
            <h3 className="session-timer-modal-title">Atur Timer Sesi</h3>
            <p className="session-timer-modal-subtitle">
              Tentukan durasi untuk sesi retrespective ini
            </p>
          </div>
          <button
            type="button"
            className="session-timer-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Durasi Presets */}
        <div className="session-timer-section">
          <label className="session-timer-label">Durasi</label>
          <div className="session-timer-presets-grid">
            {PRESET_DURATIONS.map((preset) => {
              const isSelected = selectedMinutes === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  className={`session-timer-preset-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  {preset} Menit
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider "atau" */}
        <div className="session-timer-divider">
          <span className="session-timer-divider-line"></span>
          <span className="session-timer-divider-text">atau</span>
          <span className="session-timer-divider-line"></span>
        </div>

        {/* Section Custom */}
        <div className="session-timer-section">
          <label className="session-timer-label">Custom (menit)</label>
          <div className="session-timer-custom-wrap">
            <input
              type="number"
              min="1"
              max="180"
              className="session-timer-custom-input"
              value={customMinutes}
              onChange={handleCustomChange}
              placeholder="15"
            />
            <span className="session-timer-custom-unit">Menit</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="session-timer-modal-actions">
          <button
            type="button"
            className="session-timer-btn-cancel"
            onClick={onClose}
          >
            BATAL
          </button>
          <button
            type="button"
            className="session-timer-btn-submit"
            onClick={handleSubmit}
            disabled={!selectedMinutes && (!customMinutes || parseInt(customMinutes, 10) <= 0)}
          >
            MULAI TIMER
          </button>
        </div>
      </div>
    </div>
  );
}
