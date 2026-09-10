import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, X, Users, Clock, CheckCircle2, Eye, Sparkles } from 'lucide-react';
import '../../styles/icebreaker.css';

export default function IcebreakerOverlay({
  session,
  isFacilitator = false,
  currentUser,
  totalMembers = 8,
  onVote,
  onReveal,
  onSkip,
  onEnd,
  onClose,
}) {
  const currentUserId = currentUser?.id || currentUser?.userId;

  // Cek apakah user saat ini sudah memilih di sesi/ronde ini
  const userVote =
    session?.votes && currentUserId && session.votes[currentUserId]
      ? session.votes[currentUserId].optionId
      : null;
  const [localVote, setLocalVote] = useState(userVote || null);
  const [countdown, setCountdown] = useState(null);
  const autoRevealTriggeredRef = useRef(false);

  // Reset pilihan ketika pertanyaan berganti atau ronde di-skip (votes dikosongkan)
  useEffect(() => {
    if (!session?.votes || Object.keys(session.votes).length === 0) {
      setLocalVote(null);
    } else if (currentUserId && session.votes[currentUserId]) {
      setLocalVote(session.votes[currentUserId].optionId);
    } else {
      setLocalVote(null);
    }
  }, [
    session?.question,
    session?.currentQuestionIndex,
    session?.votes,
    currentUserId,
  ]);

  if (!session) return null;

  const isEnded = session.status === 'ended';
  const isRevealed = Boolean(session.isRevealed);
  const isTrivia = Boolean(session.correctOptionId);
  const isEmojiGame =
    session.gameType === 'tebak-film' ||
    /^(\p{Extended_Pictographic}|\s)+$/u.test(session.question?.trim() || '');

  // Hitung jumlah anggota yang sudah menjawab
  const answeredCount = session.votes ? Object.keys(session.votes).length : 0;
  const safeTotalMembers = Math.max(totalMembers || 8, answeredCount || 1);
  const progressPercent = Math.min(
    100,
    Math.round((answeredCount / safeTotalMembers) * 100)
  );

  const QUESTION_TIME_LIMIT = 20;
  const [questionTimer, setQuestionTimer] = useState(QUESTION_TIME_LIMIT);

  // Synchronized 20s question timer per soal
  useEffect(() => {
    if (isEnded || isRevealed) return;

    const updateRemaining = () => {
      if (!session?.startedAt) {
        setQuestionTimer((prev) => Math.max(0, prev - 1));
        return;
      }
      const elapsed = Math.floor(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      );
      const remaining = Math.max(0, QUESTION_TIME_LIMIT - elapsed);
      setQuestionTimer(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [session?.startedAt, session?.roundNumber, session?.question, isEnded, isRevealed]);

  // Reset auto-reveal flag and countdown when round/question changes
  useEffect(() => {
    autoRevealTriggeredRef.current = false;
    setCountdown(null);
    setQuestionTimer(QUESTION_TIME_LIMIT);
  }, [session?.currentQuestionIndex, session?.roundNumber, session?.question]);

  // 1. Auto Buka Jawaban ketika 100% anggota sudah menjawab ATAU waktu 20 detik habis
  useEffect(() => {
    if (!isFacilitator || isRevealed || autoRevealTriggeredRef.current || isEnded) return;

    const allVoted = answeredCount >= safeTotalMembers && safeTotalMembers > 0;
    const timesUp = questionTimer === 0;

    if (allVoted || timesUp) {
      autoRevealTriggeredRef.current = true;
      if (isTrivia && onReveal) {
        onReveal();
      }
    }
  }, [
    isFacilitator,
    isTrivia,
    isRevealed,
    answeredCount,
    safeTotalMembers,
    questionTimer,
    onReveal,
    isEnded,
  ]);

  // 2. Auto Pertanyaan Berikutnya (Countdown 5 detik setelah jawaban terbuka / vote selesai / waktu habis)
  useEffect(() => {
    const isQuestionFinished =
      (isTrivia && isRevealed) ||
      (!isTrivia && (answeredCount >= safeTotalMembers || questionTimer === 0));

    const shouldCountdown = !isEnded && isQuestionFinished;

    if (!shouldCountdown) {
      setCountdown(null);
      return;
    }

    // Mulai hitung mundur 5 detik jika belum aktif
    if (countdown === null) {
      setCountdown(5);
      return;
    }

    // Ketika countdown mencapai 0, fasilitator otomatis memicu skip ke pertanyaan berikutnya
    if (countdown <= 0) {
      if (isFacilitator && onSkip) {
        onSkip();
      }
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    isEnded,
    isTrivia,
    isRevealed,
    answeredCount,
    safeTotalMembers,
    questionTimer,
    countdown,
    isFacilitator,
    onSkip,
  ]);

  const handleManualSkip = () => {
    setCountdown(null);
    if (onSkip) {
      onSkip();
    }
  };

  const handleSelectOption = (optionId) => {
    if (isEnded || isRevealed || questionTimer === 0) return;
    setLocalVote(optionId);
    if (onVote) {
      onVote(optionId);
    }
  };

  // State 3: Icebreaker Selesai (Image 5)
  if (isEnded) {
    return (
      <div className="icebreaker-overlay-backdrop">
        <div className="icebreaker-celebration-card">
          <button
            type="button"
            className="icebreaker-overlay-close-btn"
            onClick={onClose}
            title="Tutup"
          >
            <X size={18} />
          </button>

          {/* Celebration Emoji Icon */}
          <div className="icebreaker-celebration-icon-circle">
            <span>🎉</span>
          </div>

          <h3 className="icebreaker-celebration-title">Icebreaker Selesai!</h3>
          <p className="icebreaker-celebration-subtitle">
            Terima kasih sudah berpartisipasi.<br />
            Saatnya masuk ke pembahasan utama.
          </p>

          <button
            type="button"
            className="icebreaker-btn-return-board"
            onClick={onClose}
          >
            Kembali ke Board
          </button>
        </div>
      </div>
    );
  }

  // Active Gameplay (Images 3 & 4)
  const options = session.options || [];
  const isTwoOptions = options.length <= 2;

  return (
    <div className="icebreaker-overlay-backdrop">
      <div className="icebreaker-overlay-card">
        {/* Close Button */}
        <button
          type="button"
          className="icebreaker-overlay-close-btn"
          onClick={onClose}
          title="Tutup overlay"
        >
          <X size={18} />
        </button>

        {/* Header Badges Row */}
        <div className="icebreaker-header-badges-row">
          <span className="icebreaker-pill-badge">
            <Gamepad2 size={13} />
            <span>
              ICEBREAKER • SOAL {session.roundNumber || 1} DARI {session.totalQuestions || 5}
            </span>
          </span>

          {/* 20s Question Timer Badge */}
          {!isRevealed && !isEnded && (
            <span
              className={`icebreaker-timer-badge ${
                questionTimer <= 5 ? 'urgent' : ''
              }`}
              title="Sisa waktu menjawab pertanyaan ini"
            >
              <Clock size={13} />
              <span>{questionTimer}s</span>
            </span>
          )}
        </div>

        {/* Title & Question */}
        <h3 className="icebreaker-overlay-title">{session.title || 'Icebreaker'}</h3>
        {isEmojiGame ? (
          <div className="icebreaker-emoji-cinema-box">
            <div className="icebreaker-emoji-cinema-clues">{session.question}</div>
            <span className="icebreaker-emoji-cinema-hint">
              🎬 Tebak judul film dari petunjuk emoji di atas
            </span>
          </div>
        ) : (
          <p className="icebreaker-overlay-question">{session.question}</p>
        )}

        {/* Options Grid */}
        <div
          className={
            isTwoOptions
              ? 'icebreaker-wyr-options-grid'
              : 'icebreaker-trivia-options-grid'
          }
        >
          {options.map((opt, idx) => {
            const isSelected = localVote === opt.id || userVote === opt.id;
            const isCorrect = isRevealed && opt.id === session.correctOptionId;
            const isWrong =
              isRevealed &&
              isSelected &&
              opt.id !== session.correctOptionId;

            // Voters who chose this option
            const voters = session.votes
              ? Object.values(session.votes).filter((v) => v.optionId === opt.id)
              : [];

            const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D

            return (
              <button
                key={opt.id}
                type="button"
                className={`icebreaker-option-card ${
                  isSelected ? 'selected' : ''
                } ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => handleSelectOption(opt.id)}
                disabled={isRevealed || questionTimer === 0}
              >
                <div className="icebreaker-option-top-row">
                  <span className="icebreaker-option-emoji">
                    {opt.emoji || optionLetter}
                  </span>
                  {isCorrect && (
                    <span className="icebreaker-badge-correct">
                      <CheckCircle2 size={13} /> Benar
                    </span>
                  )}
                  {isWrong && (
                    <span className="icebreaker-badge-wrong">
                      Salah
                    </span>
                  )}
                </div>

                <span className="icebreaker-option-label">{opt.label}</span>

                {/* Voters Avatars Stack */}
                {voters.length > 0 && (
                  <div className="icebreaker-option-voters">
                    {voters.slice(0, 5).map((v, vIdx) => (
                      <img
                        key={v.userId || vIdx}
                        src={
                          v.avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                            v.userName || v.userId
                          }`
                        }
                        alt={v.userName}
                        title={v.userName}
                        className="icebreaker-voter-avatar"
                      />
                    ))}
                    {voters.length > 5 && (
                      <span className="icebreaker-voter-more">
                        +{voters.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation box after answer revealed */}
        {isRevealed && session.explanation && (
          <div className="icebreaker-explanation-box">
            <div className="icebreaker-explanation-header">
              <Sparkles size={16} color="#16a34a" />
              <strong>Penjelasan:</strong>
            </div>
            <p className="icebreaker-explanation-text">{session.explanation}</p>
          </div>
        )}

        {/* Progress Bar Row */}
        <div className="icebreaker-progress-container">
          <div className="icebreaker-progress-meta">
            <div className="icebreaker-progress-label">
              <Users size={15} color="#5956e9" />
              <span>
                {answeredCount} dari {safeTotalMembers} anggota menjawab
              </span>
            </div>
            <span className="icebreaker-progress-pct">{progressPercent}%</span>
          </div>
          <div className="icebreaker-progress-bar-track">
            <div
              className="icebreaker-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Countdown Banner if active */}
        {countdown !== null && (
          <div className="icebreaker-countdown-banner">
            <Clock size={14} className="icebreaker-countdown-icon" />
            <span>
              {(session.roundNumber || 1) >= (session.totalQuestions || 5)
                ? `Icebreaker selesai otomatis dalam ${countdown} detik...`
                : `Lanjut ke pertanyaan berikutnya otomatis dalam ${countdown} detik...`}
            </span>
          </div>
        )}

        {/* Footer Actions */}
        {isFacilitator ? (
          /* Facilitator Controls (Image 3) */
          <div className="icebreaker-facilitator-actions">
            {isTrivia && !isRevealed && (
              <button
                type="button"
                className="icebreaker-btn-reveal"
                onClick={onReveal}
                title="Buka kunci jawaban untuk semua peserta"
              >
                <Eye size={16} />
                <span>Buka Jawaban</span>
              </button>
            )}
            <button
              type="button"
              className="icebreaker-btn-skip"
              onClick={handleManualSkip}
              title="Lewati atau selesaikan ke pertanyaan berikutnya"
            >
              {(session.roundNumber || 1) >= (session.totalQuestions || 5)
                ? countdown !== null
                  ? `Selesai (${countdown}s)`
                  : isRevealed
                  ? 'Selesai & Lihat Hasil'
                  : 'Skip & Selesai'
                : countdown !== null
                ? `Pertanyaan Berikutnya (${countdown}s)`
                : isRevealed
                ? 'Pertanyaan Berikutnya'
                : 'Skip'}
            </button>
            <button
              type="button"
              className="icebreaker-btn-end"
              onClick={onEnd}
              title="Akhiri sesi icebreaker untuk semua anggota"
            >
              Akhiri Icebreaker
            </button>
          </div>
        ) : (
          /* Member Biasa Waiting Info (Image 4) */
          <div className="icebreaker-waiting-box">
            {countdown !== null ? (
              <>
                <Clock size={15} color="#5956e9" />
                <span>
                  {(session.roundNumber || 1) >= (session.totalQuestions || 5)
                    ? `Icebreaker selesai otomatis dalam ${countdown} detik...`
                    : `Pertanyaan berikutnya otomatis dalam ${countdown} detik...`}
                </span>
              </>
            ) : isRevealed ? (
              <>
                <CheckCircle2 size={15} color="#16a34a" />
                <span>Kunci jawaban telah dibuka!</span>
              </>
            ) : (
              <>
                <Clock size={14} color="#64748b" />
                <span>Menunggu semua anggota untuk menyelesaikan icebreaker...</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
