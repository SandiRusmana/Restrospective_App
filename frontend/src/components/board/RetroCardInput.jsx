import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

export default function RetroCardInput({
  onSave,
  onCancel,
  placeholder = 'Tulis catatan retrospective...',
  isPrivate = false,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSave(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form className="retro-card-input-box" onSubmit={handleSubmit}>
      {isPrivate && (
        <div className="retro-input-private-pill">
          <Lock size={12} strokeWidth={2.4} />
          <span>Mode Privat — Hanya Anda yang dapat melihat catatan ini sampai di-reveal</span>
        </div>
      )}
      <textarea
        ref={textareaRef}
        className="retro-card-input-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
      />
      <div className="retro-card-input-actions">
        <button
          type="button"
          className="btn-retro-input-cancel"
          onClick={onCancel}
        >
          Batal
        </button>
        <button
          type="submit"
          className="btn-retro-input-submit"
          disabled={!text.trim()}
        >
          {isPrivate && <Lock size={12} style={{ marginRight: 4 }} />}
          {isPrivate ? 'Simpan Catatan Privat' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}
