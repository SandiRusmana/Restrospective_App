import React from 'react';
import { Play, Pause, RotateCcw, User } from 'lucide-react';

export default function SessionTimerBanner({
  status = 'running', // 'running' | 'paused'
  remainingSeconds = 0,
  facilitator = 'Fasilitator',
  isStarter = true,
  onPause,
  onResume,
  onReset,
}) {
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

      {/* Right Section: Static Facilitator Badge + Action Controls (Only for Starter) */}
      <div className="session-timer-right">
        {/* Facilitator Pill (Informasi Statis tanpa Dropdown) */}
        <div
          className="session-timer-facilitator-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: 500,
            color: '#475569',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
          title={`Sesi timer dipandu oleh ${facilitator}`}
        >
          <User size={14} color="#64748b" />
          <span>
            Oleh <strong style={{ color: '#0f172a', fontWeight: 600 }}>{facilitator}</strong>
          </span>
        </div>

        {/* Action Controls: Hanya muncul dan aktif untuk pengguna yang memulai timer */}
        {isStarter && (
          <div className="session-timer-controls">
            {isPaused ? (
              <button
                type="button"
                className="session-timer-btn-resume"
                onClick={onResume}
                title="Lanjutkan timer sesi"
              >
                <Play size={16} fill="currentColor" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                className="session-timer-btn-pause"
                onClick={onPause}
                title="Jeda timer sesi"
              >
                <Pause size={16} fill="currentColor" strokeWidth={0} />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              className="session-timer-btn-reset"
              onClick={onReset}
              title="Reset timer sesi ke awal"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
