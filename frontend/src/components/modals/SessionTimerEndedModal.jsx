import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SessionTimerEndedModal({ isOpen, onClose }) {
  // Play subtle bell chime notification using Web Audio API when modal opens
  useEffect(() => {
    if (!isOpen) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Play 2-tone melodic chime (Ding-Dong)
        const playTone = (freq, startTime, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        playTone(587.33, now, 0.6); // D5
        playTone(880.0, now + 0.2, 0.9); // A5
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="session-timer-ended-modal-overlay" onClick={onClose}>
      <div
        className="session-timer-ended-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Close Button Top-Right */}
        <button
          type="button"
          className="session-timer-ended-close-btn"
          onClick={onClose}
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        {/* Ringing Bell Illustration with Sound Wave Rays */}
        <div className="session-timer-bell-wrapper">
          <div className="session-timer-bell-rays">
            <span className="bell-ray ray-tl-1"></span>
            <span className="bell-ray ray-tl-2"></span>
            <span className="bell-ray ray-tl-3"></span>
            <span className="bell-ray ray-tr-1"></span>
            <span className="bell-ray ray-tr-2"></span>
            <span className="bell-ray ray-tr-3"></span>
          </div>

          <div className="session-timer-bell-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <div className="session-timer-ended-body">
          <h2 className="session-timer-ended-title">Waktu Sesi Habis!</h2>
          <div className="session-timer-ended-desc">
            <p>Sesi retrospective ini telah selesai</p>
            <p>Saatnya melanjutkan ke tahap berikutnya</p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="session-timer-ended-actions">
          <button
            type="button"
            className="session-timer-ended-btn-close"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
