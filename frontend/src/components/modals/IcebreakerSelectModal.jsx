import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import '../../styles/icebreaker.css';

export default function IcebreakerSelectModal({ isOpen, onClose, onStartGame }) {
  const [selectedGame, setSelectedGame] = useState('fakta-hoaks');
  const [selectedQuestions, setSelectedQuestions] = useState(5);

  if (!isOpen) return null;

  const handleStart = () => {
    if (!selectedGame) return;
    onStartGame(selectedGame, selectedQuestions);
  };

  const games = [
    {
      id: 'fakta-hoaks',
      emoji: '🧠',
      title: 'Fakta atau Hoaks?',
      desc: 'Tebak apakah sebuah pernyataan fakta nyata atau hoaks belaka.',
      pill: '2 pilihan',
    },
    {
      id: 'tebak-lagu',
      emoji: '🎵',
      title: 'Tebak Lagu & Artis',
      desc: 'Tebak lagu & artis dari lirik hits populer Indonesia & luar negeri.',
      pill: '4 pilihan',
    },
    {
      id: 'tebak-film',
      emoji: '🎬',
      title: 'Tebak Film dari Emoji',
      desc: 'Pecahkan judul film populer dari rangkaian emoji petunjuk.',
      pill: '4 pilihan',
    },
    {
      id: 'would-you-rather',
      emoji: '🤔',
      title: 'Would You Rather?',
      desc: 'Pilih salah satu dari dua pilihan dilema yang seru.',
      pill: '2 pilihan',
    },
    {
      id: 'tebakan-receh',
      emoji: '🤣',
      title: 'Tebakan Receh',
      desc: 'Asah otak dengan tebak-tebakan receh dan jokes bapak-bapak.',
      pill: '4 pilihan',
    },
  ];

  return (
    <div className="icebreaker-modal-backdrop" onClick={onClose}>
      <div
        className="icebreaker-select-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="icebreaker-select-header">
          <div className="icebreaker-select-icon-title">
            <Gamepad2 size={24} color="#5956e9" />
            <h3 className="icebreaker-select-title">Icebreaker</h3>
          </div>
          <p className="icebreaker-select-subtitle">
            Bikin suasana lebih seru sebelum masuk ke pembahasan utama.
          </p>
        </div>

        {/* Section Title */}
        <div className="icebreaker-select-section-label">Pilih permainan</div>

        {/* 5 Games Grid */}
        <div className="icebreaker-games-grid">
          {games.map((g) => (
            <div
              key={g.id}
              className={`icebreaker-game-card ${
                selectedGame === g.id ? 'selected' : ''
              }`}
              onClick={() => setSelectedGame(g.id)}
            >
              <div className="icebreaker-game-emoji">{g.emoji}</div>
              <h4 className="icebreaker-game-title">{g.title}</h4>
              <p className="icebreaker-game-desc">{g.desc}</p>
              <span className="icebreaker-game-pill">{g.pill}</span>
            </div>
          ))}
        </div>

        {/* Section: Jumlah Pertanyaan */}
        <div className="icebreaker-question-count-section">
          <div className="icebreaker-select-section-label">Jumlah Pertanyaan</div>
          <div className="icebreaker-question-count-options">
            {[3, 5, 10].map((count) => (
              <button
                key={count}
                type="button"
                className={`icebreaker-count-btn ${
                  selectedQuestions === count ? 'selected' : ''
                }`}
                onClick={() => setSelectedQuestions(count)}
              >
                <span className="icebreaker-count-number">{count}</span>
                <span className="icebreaker-count-label">Soal</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="icebreaker-modal-actions">
          <button
            type="button"
            className="icebreaker-btn-cancel"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="icebreaker-btn-start"
            onClick={handleStart}
            disabled={!selectedGame}
          >
            Mulai
          </button>
        </div>
      </div>
    </div>
  );
}
