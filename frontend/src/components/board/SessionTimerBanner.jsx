import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronDown, Check, User } from 'lucide-react';

export default function SessionTimerBanner({
  status = 'running', // 'running' | 'paused'
  remainingSeconds = 0,
  facilitator = 'Afrizal',
  members = [],
  onPause,
  onResume,
  onReset,
  onChangeFacilitator,
}) {
  const [isFacilitatorDropdownOpen, setIsFacilitatorDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsFacilitatorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format seconds into MM:SS
  const formatTime = (totalSecs) => {
    const safeSecs = Math.max(0, totalSecs || 0);
    const mins = Math.floor(safeSecs / 60);
    const secs = safeSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isPaused = status === 'paused';

  return (
    <div className={`session-timer-banner ${isPaused ? 'paused' : 'running'}`}>
      {/* Left Section: Icon + Timer digits + Status text */}
      <div className="session-timer-left">
        <div className={`session-timer-icon-badge ${isPaused ? 'paused' : 'running'}`}>
          {isPaused ? (
            <Pause size={18} fill="currentColor" strokeWidth={0} />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Play symbol with step icon style */}
              <path d="M5 4.5v15l11-7.5L5 4.5z" />
              <rect x="18" y="5" width="2.5" height="14" rx="1" />
            </svg>
          )}
        </div>

        <div className="session-timer-time-display">
          {formatTime(remainingSeconds)}
        </div>

        <span className={`session-timer-status-text ${isPaused ? 'paused' : 'running'}`}>
          {isPaused ? 'Sesi di jeda' : 'Sesi sedang berjalan'}
        </span>
      </div>

      {/* Right Section: Facilitator Selector + Action Controls */}
      <div className="session-timer-right">
        {/* Facilitator Pill Dropdown */}
        <div className="session-timer-facilitator-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="session-timer-facilitator-btn"
            onClick={() => setIsFacilitatorDropdownOpen(!isFacilitatorDropdownOpen)}
            title="Ganti Fasilitator"
          >
            <span>Oleh {facilitator || 'Afrizal'} ( Facilitator )</span>
            <ChevronDown size={14} className="facilitator-chevron" />
          </button>

          {isFacilitatorDropdownOpen && (
            <div className="session-timer-facilitator-dropdown">
              <div className="facilitator-dropdown-header">
                Pilih Fasilitator Sesi
              </div>
              <div className="facilitator-dropdown-list">
                {(members && members.length > 0 ? members : [{ id: '1', name: facilitator || 'Afrizal' }]).map((m) => {
                  const mName = m.name || m.email || 'Anggota Tim';
                  const isSelected = (facilitator || '').toLowerCase() === mName.toLowerCase();
                  return (
                    <button
                      key={m.id || mName}
                      type="button"
                      className={`facilitator-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (onChangeFacilitator) onChangeFacilitator(mName);
                        setIsFacilitatorDropdownOpen(false);
                      }}
                    >
                      <div className="facilitator-option-info">
                        <User size={14} />
                        <span>{mName}</span>
                      </div>
                      {isSelected && <Check size={14} className="facilitator-check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="session-timer-controls">
          {isPaused ? (
            <button
              type="button"
              className="session-timer-btn-resume"
              onClick={onResume}
            >
              <Play size={16} fill="currentColor" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              className="session-timer-btn-pause"
              onClick={onPause}
            >
              <Pause size={16} fill="currentColor" strokeWidth={0} />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            className="session-timer-btn-reset"
            onClick={onReset}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
