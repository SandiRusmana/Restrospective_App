import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Check,
  Eye,
  X,
  Layers,
  Zap,
} from 'lucide-react';

export const TEMPLATES_CATALOG = [
  {
    id: 'start-stop-continue',
    name: 'Start Stop Continue',
    category: 'agile',
    categoryLabel: 'Agile & Sprint',
    emoji: '🔄',
    color: '#5956e9',
    bg: '#f3f0ff',
    desc: 'Format paling populer untuk mengevaluasi kebiasaan kerja tim dan menetapkan komitmen baru.',
    bestFor: 'Sprint retrospectives reguler dan evaluasi proses tim.',
    columns: [
      { name: 'START', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Apa yang perlu kita mulai lakukan?' },
      { name: 'STOP', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Apa yang tidak efektif dan harus dihentikan?' },
      { name: 'CONTINUE', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: 'Apa yang berjalan baik dan perlu dilanjutkan?' },
    ],
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad Sad Glad',
    category: 'morale',
    categoryLabel: 'Emosi & Moril Tim',
    emoji: '😤',
    color: '#ef4444',
    bg: '#fef2f2',
    desc: 'Fokus mendalam pada sisi emosional, kepuasan kerja, dan kelelahan mental tim selama sprint.',
    bestFor: 'Sprint yang penuh tekanan atau setelah perilisan fitur besar.',
    columns: [
      { name: 'MAD', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Hal apa yang membuat Anda kesal atau frustrasi?' },
      { name: 'SAD', color: '#d97706', bg: '#fffbeb', border: '#fde68a', desc: 'Hal apa yang membuat Anda kecewa atau cemas?' },
      { name: 'GLAD', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Hal apa yang membuat Anda bangga dan bahagia?' },
    ],
  },
  {
    id: '4ls',
    name: '4Ls Retrospective',
    category: 'comprehensive',
    categoryLabel: 'Refleksi Menyeluruh',
    emoji: '💎',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    desc: 'Template 4 dimensi seimbang untuk mengukur apresiasi, pembelajaran, dan harapan masa depan.',
    bestFor: 'Evaluasi akhir kuartal atau sprint jangka panjang.',
    columns: [
      { name: 'LIKED', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Apa yang Anda sukai dari sprint ini?' },
      { name: 'LEARNED', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: 'Apa pelajaran baru atau insight yang didapat?' },
      { name: 'LACKED', color: '#d97706', bg: '#fffbeb', border: '#fde68a', desc: 'Apa yang terasa kurang atau menjadi hambatan?' },
      { name: 'LONGED FOR', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', desc: 'Apa yang Anda dambakan ada di sprint berikutnya?' },
    ],
  },
  {
    id: 'went-well-wrong',
    name: 'Went Well / Went Wrong',
    category: 'action',
    categoryLabel: 'Fokus Aksi Nyata',
    emoji: '⚖️',
    color: '#10b981',
    bg: '#ecfdf5',
    desc: 'Format ringkas yang langsung menghubungkan evaluasi sprint dengan Action Items konkret.',
    bestFor: 'Tim yang menyukai kesederhanaan dan tindak lanjut cepat.',
    columns: [
      { name: 'WHAT WENT WELL', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Pencapaian dan hal positif selama sprint.' },
      { name: 'WHAT WENT WRONG', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Kendala teknis, komunikasi, atau hambatan kerja.' },
      { name: 'ACTION ITEMS', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: 'Langkah konkret yang harus dieksekusi.' },
    ],
  },
  {
    id: 'sailboat',
    name: 'Sailboat Retrospective',
    category: 'agile',
    categoryLabel: 'Metafora & Kreatif',
    emoji: '⛵',
    color: '#0284c7',
    bg: '#f0f9ff',
    desc: 'Menggunakan metafora kapal layar untuk memetakan dorongan angin, jangkar penahan, dan karang ancaman.',
    bestFor: 'Sesi workshop kreatif yang membutuhkan visualisasi arah tujuan tim.',
    columns: [
      { name: 'WIND (ANGIN)', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', desc: 'Faktor pendorong yang mempercepat laju tim.' },
      { name: 'ANCHOR (JANGKAR)', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', desc: 'Beban atau proses lambat yang menahan tim.' },
      { name: 'ROCKS (KARANG)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Risiko atau bahaya tersembunyi di depan.' },
      { name: 'ISLAND (PULAU)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Tujuan akhir dan visi sprint yang ingin dicapai.' },
    ],
  },
  {
    id: 'starfish',
    name: 'Starfish Retrospective',
    category: 'comprehensive',
    categoryLabel: 'Gradasi Tindakan',
    emoji: '⭐',
    color: '#d97706',
    bg: '#fffbeb',
    desc: 'Memberikan 5 level penyesuaian porsi kerja tim: Mempertahankan, Menghentikan, Memulai, Menambah, dan Mengurangi.',
    bestFor: 'Optimasi proses kerja yang sudah mapan dan ingin fine-tuning kebiasaan.',
    columns: [
      { name: 'KEEP DOING', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Kebiasaan baik yang wajib dipertahankan.' },
      { name: 'LESS OF', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', desc: 'Aktivitas yang perlu dikurangi porsinya.' },
      { name: 'MORE OF', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: 'Hal bermanfaat yang perlu diperbanyak.' },
      { name: 'STOP', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Proses yang tidak bernilai dan harus disetop.' },
      { name: 'START', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', desc: 'Eksperimen baru yang ingin dicoba tim.' },
    ],
  },
];

export default function TemplatesView({
  workspace,
  onUseTemplate,
  onShowToast,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const categories = [
    { id: 'all', label: 'Semua Template' },
    { id: 'agile', label: 'Agile & Sprint' },
    { id: 'morale', label: 'Emosi & Dinamika' },
    { id: 'action', label: 'Fokus Aksi' },
    { id: 'comprehensive', label: 'Refleksi Lengkap' },
  ];

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_CATALOG.filter((tpl) => {
      const matchesCat = activeCategory === 'all' || tpl.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.columns.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="templates-view-container">
      {/* Header Banner */}
      <header className="templates-view-header">
        <div>
          <div className="templates-header-badge">
            <Sparkles size={13} />
            <span>Katalog Template Retrospective</span>
          </div>
          <h1 className="templates-header-title">Template Retro</h1>
          <p className="templates-header-desc">
            Pilih format retrospective terbaik untuk sprint Anda. Setiap template dirancang khusus dengan warna, panduan
            pertanyaan, dan tujuan diskusi yang terstruktur.
          </p>
        </div>
      </header>

      {/* Controls Bar: Categories & Search */}
      <div className="templates-controls-bar">
        <div className="templates-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`templates-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="templates-search-box">
          <Search size={15} className="templates-search-icon" />
          <input
            type="text"
            placeholder="Cari nama template / kolom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="templates-search-input"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="templates-grid">
        {filteredTemplates.map((tpl) => (
          <div key={tpl.id} className="template-card">
            <div className="template-card-header">
              <div className="template-emoji-box" style={{ backgroundColor: tpl.bg }}>
                <span>{tpl.emoji}</span>
              </div>
              <div className="template-card-title-wrap">
                <span className="template-card-category">{tpl.categoryLabel}</span>
                <h3 className="template-card-name">{tpl.name}</h3>
              </div>
            </div>

            <p className="template-card-desc">{tpl.desc}</p>

            {/* Visual preview of columns */}
            <div className="template-columns-preview">
              <span className="template-preview-label">Kolom ({tpl.columns.length}):</span>
              <div className="template-columns-badges">
                {tpl.columns.map((col) => (
                  <span
                    key={col.name}
                    className="template-col-chip"
                    style={{
                      backgroundColor: col.bg,
                      color: col.color,
                      borderColor: col.border,
                    }}
                  >
                    {col.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="template-card-footer">
              <button
                type="button"
                className="btn-template-preview"
                onClick={() => setPreviewTemplate(tpl)}
              >
                <Eye size={14} />
                <span>Preview</span>
              </button>

              <button
                type="button"
                className="btn-template-use"
                onClick={() => {
                  if (onUseTemplate) {
                    onUseTemplate(tpl.id);
                  }
                }}
              >
                <span>Gunakan Template</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Preview Modal */}
      {previewTemplate && (
        <div className="template-modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="template-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="template-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{previewTemplate.emoji}</span>
                <div>
                  <h2 className="template-modal-title">{previewTemplate.name}</h2>
                  <span className="template-modal-subtitle">{previewTemplate.categoryLabel}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setPreviewTemplate(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="template-modal-body">
              <p className="template-modal-desc">{previewTemplate.desc}</p>
              <div className="template-modal-best-for">
                <strong>Sangat Cocok Untuk:</strong> {previewTemplate.bestFor}
              </div>

              <h4 style={{ margin: '20px 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Susunan Kolom Diskusi ({previewTemplate.columns.length} Kolom):
              </h4>

              <div className="template-modal-columns-grid">
                {previewTemplate.columns.map((col, idx) => (
                  <div
                    key={col.name}
                    className="template-modal-col-card"
                    style={{
                      borderTop: `4px solid ${col.color}`,
                      backgroundColor: col.bg,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="template-modal-col-name" style={{ color: col.color }}>
                        {col.name}
                      </span>
                      <span className="template-modal-col-number">Kolom {idx + 1}</span>
                    </div>
                    <p className="template-modal-col-desc">{col.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="template-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPreviewTemplate(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const tplId = previewTemplate.id;
                  setPreviewTemplate(null);
                  if (onUseTemplate) onUseTemplate(tplId);
                }}
              >
                <span>Mulai Board dengan Template Ini</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
