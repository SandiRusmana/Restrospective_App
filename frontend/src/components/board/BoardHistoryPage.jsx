import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Search,
  Calendar,
  ChevronDown,
  CheckSquare,
  Layout,
  ArrowUpRight,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ExternalLink,
  Copy,
  Trash2,
  FileDown,
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * Icon grid 4 lingkaran khas board retrospective
 */
function BoardGridIcon({ size = 18, color = '#5956e9' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <circle cx="7" cy="7" r="3.5" fill={color} />
      <circle cx="17" cy="7" r="3.5" fill={color} />
      <circle cx="7" cy="17" r="3.5" fill={color} />
      <circle cx="17" cy="17" r="3.5" fill={color} />
    </svg>
  );
}

/**
 * Format tanggal dalam format: 30 Jun 2026
 */
function formatBoardDate(dateString) {
  if (!dateString) return '30 Jun 2026';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '30 Jun 2026';
    const day = d.getDate();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '30 Jun 2026';
  }
}

export default function BoardHistoryPage({
  workspace,
  currentBoard,
  currentUser,
  onSelectBoard,
}) {
  const [boards, setBoards] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('Semua Tahun');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [activeMenuBoardId, setActiveMenuBoardId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportingBoardId, setExportingBoardId] = useState(null);

  const yearDropdownRef = useRef(null);
  const actionMenuRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(e.target)
      ) {
        setIsYearDropdownOpen(false);
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target)
      ) {
        setActiveMenuBoardId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch boards from API with pagination
  useEffect(() => {
    let isMounted = true;
    async function loadBoards() {
      if (!workspace?.id) return;
      setIsLoading(true);
      try {
        const res = await api.getBoards(workspace.id, {
          page: currentPage,
          limit: 10,
        });

        if (!isMounted) return;

        if (res && res.data && res.meta) {
          setBoards(res.data);
          setMeta(res.meta);
        } else if (Array.isArray(res)) {
          // Fallback backward compatibility
          setBoards(res);
          setMeta({
            total: res.length,
            page: currentPage,
            limit: 10,
            totalPages: Math.max(1, Math.ceil(res.length / 10)),
            hasNextPage: currentPage < Math.ceil(res.length / 10),
            hasPrevPage: currentPage > 1,
          });
        }
      } catch (err) {
        console.error('Gagal mengambil riwayat board:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBoards();
    return () => {
      isMounted = false;
    };
  }, [workspace?.id, currentPage]);

  // Client-side search and year filter
  const filteredBoards = useMemo(() => {
    return boards.filter((b) => {
      const matchSearch =
        !searchQuery.trim() ||
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workspace?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchYear =
        selectedYear === 'Semua Tahun' ||
        (b.createdAt && new Date(b.createdAt).getFullYear().toString() === selectedYear);

      return matchSearch && matchYear;
    });
  }, [boards, searchQuery, selectedYear, workspace?.name]);

  // List of available years for filter
  const yearOptions = useMemo(() => {
    const years = new Set(['Semua Tahun']);
    boards.forEach((b) => {
      if (b.createdAt) {
        years.add(new Date(b.createdAt).getFullYear().toString());
      }
    });
    if (!years.has('2026')) years.add('2026');
    return Array.from(years);
  }, [boards]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (meta.totalPages || 1) || newPage === currentPage) {
      return;
    }
    setCurrentPage(newPage);
  };

  // Calculate items display range
  const totalItems = meta.total || filteredBoards.length;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * (meta.limit || 10) + 1;
  const endItem = Math.min(currentPage * (meta.limit || 10), totalItems);

  // Generate pagination buttons
  const pageNumbers = useMemo(() => {
    const totalPages = meta.totalPages || 1;
    const pages = [];
    const maxButtons = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, meta.totalPages]);

  const handleExportRowPdf = async (boardItem) => {
    if (!boardItem?.id || exportingBoardId) return;
    setExportingBoardId(boardItem.id);
    try {
      const { blob, filename } = await api.exportBoardPdf(boardItem.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Retro_${boardItem.name || 'Board'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
    } finally {
      setExportingBoardId(null);
      setActiveMenuBoardId(null);
    }
  };

  const defaultAvatar =
    currentUser?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'Afrizal'}`;

  return (
    <div className="board-history-container">
      {/* ── Top Header Card (Icon, Title, Search & Filter) ── */}
      <div className="board-history-header-card">
        <div className="board-history-title-group">
          <div className="board-history-icon-badge">
            <Clock size={24} color="#ffffff" />
          </div>
          <div className="board-history-text-col">
            <h2 className="board-history-title">History Board</h2>
            <p className="board-history-subtitle">
              Daftar semua sesi retrospective di workspace ini. Klik pada board untuk melihat detailnya
            </p>
          </div>
        </div>

        <div className="board-history-filters">
          {/* Search Box */}
          <div className="board-history-search-wrapper">
            <Search size={16} className="board-history-search-icon" />
            <input
              type="text"
              className="board-history-search-input"
              placeholder="Cari nama board..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Year Filter Dropdown */}
          <div className="board-history-dropdown-wrapper" ref={yearDropdownRef}>
            <button
              type="button"
              className="board-history-dropdown-trigger"
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            >
              <Calendar size={15} className="board-history-filter-calendar-icon" />
              <span>{selectedYear}</span>
              <ChevronDown size={14} className="board-history-dropdown-chevron" />
            </button>

            {isYearDropdownOpen && (
              <div className="board-history-dropdown-menu">
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`board-history-dropdown-item ${
                      selectedYear === year ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsYearDropdownOpen(false);
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Board History Table ── */}
      <div className="board-history-table-card">
        <table className="board-history-table">
          <thead>
            <tr>
              <th className="th-nama-board">Nama Board</th>
              <th className="th-tanggal">Tanggal</th>
              <th className="th-cards">Jumlah Card</th>
              <th className="th-action-items">Jumlah Action Item</th>
              <th className="th-creator">Dibuat Oleh</th>
              <th className="th-action">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="board-history-loading-cell">
                  <div className="board-history-loading-inner">
                    <Loader2 size={24} className="board-history-spinner" />
                    <span>Memuat history board...</span>
                  </div>
                </td>
              </tr>
            ) : filteredBoards.length === 0 ? (
              <tr>
                <td colSpan={6} className="board-history-empty-cell">
                  <div className="board-history-empty-inner">
                    <div className="board-history-empty-icon-wrap">
                      <BoardGridIcon size={28} color="#94a3b8" />
                    </div>
                    <h4>Tidak ada history board ditemukan</h4>
                    <p>
                      {searchQuery
                        ? `Tidak ada board dengan kata kunci "${searchQuery}"`
                        : 'Belum ada sesi retrospective di workspace ini'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBoards.map((b) => {
                const isCurrent = currentBoard?.id === b.id;
                const creatorName =
                  b.creator?.name ||
                  b.createdByName ||
                  currentUser?.name ||
                  'Afrizal';
                const creatorAvatar =
                  b.creator?.avatar ||
                  currentUser?.avatar ||
                  defaultAvatar;

                return (
                  <tr
                    key={b.id}
                    className={`board-history-row ${isCurrent ? 'is-current' : ''}`}
                  >
                    {/* Nama Board */}
                    <td className="td-nama-board">
                      <div
                        className="board-history-name-cell"
                        onClick={() => onSelectBoard && onSelectBoard(b)}
                        title="Klik untuk membuka board"
                      >
                        <div className="board-icon-badge">
                          <BoardGridIcon size={16} color="#5956e9" />
                        </div>
                        <div className="board-info-col">
                          <span className="board-name-text">{b.name}</span>
                          <span className="board-workspace-text">
                            {workspace?.name || 'Mobile Team'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="td-tanggal">
                      <div className="board-history-date-cell">
                        <Calendar size={15} className="board-date-icon" />
                        <span>{formatBoardDate(b.createdAt)}</span>
                      </div>
                    </td>

                    {/* Jumlah Card */}
                    <td className="td-cards">
                      <div className="board-history-count-cell">
                        <Layout size={15} className="board-count-icon" />
                        <span>{b.cardsCount ?? b.cards?.length ?? 0}</span>
                      </div>
                    </td>

                    {/* Jumlah Action Item */}
                    <td className="td-action-items">
                      <div className="board-history-count-cell">
                        <CheckSquare size={15} className="board-count-icon" />
                        <span>{b.actionItemsCount ?? 0}</span>
                      </div>
                    </td>

                    {/* Dibuat Oleh */}
                    <td className="td-creator">
                      <div className="board-history-creator-cell">
                        <img
                          src={creatorAvatar}
                          alt={creatorName}
                          className="board-creator-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultAvatar;
                          }}
                        />
                        <span className="board-creator-name">{creatorName}</span>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="td-action">
                      <div className="board-history-action-cell">
                        <button
                          type="button"
                          className="btn-buka-board"
                          onClick={() => onSelectBoard && onSelectBoard(b)}
                          title="Buka board retro ini"
                        >
                          <ArrowUpRight size={14} className="btn-buka-board-icon" />
                          <span>Buka Board</span>
                        </button>

                        <div className="board-row-menu-wrapper" ref={actionMenuRef}>
                          <button
                            type="button"
                            className="btn-board-more-options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuBoardId(
                                activeMenuBoardId === b.id ? null : b.id
                              );
                            }}
                            title="Opsi board"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuBoardId === b.id && (
                            <div className="board-row-menu-dropdown">
                              <button
                                type="button"
                                className="board-row-menu-item"
                                onClick={() => {
                                  if (onSelectBoard) onSelectBoard(b);
                                  setActiveMenuBoardId(null);
                                }}
                              >
                                <ExternalLink size={14} />
                                <span>Buka di tab utama</span>
                              </button>
                              <button
                                type="button"
                                className="board-row-menu-item"
                                onClick={() => {
                                  const url = `${window.location.origin}?workspace=${workspace?.id}&board=${b.id}`;
                                  navigator.clipboard.writeText(url);
                                  setActiveMenuBoardId(null);
                                }}
                              >
                                <Copy size={14} />
                                <span>Salin link board</span>
                              </button>
                              <button
                                type="button"
                                className="board-row-menu-item"
                                onClick={() => handleExportRowPdf(b)}
                                disabled={exportingBoardId === b.id}
                              >
                                {exportingBoardId === b.id ? (
                                  <Loader2 size={14} className="board-history-spinner" />
                                ) : (
                                  <FileDown size={14} />
                                )}
                                <span>{exportingBoardId === b.id ? 'Mengekspor PDF...' : 'Export PDF'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="board-history-footer">
        <div className="board-history-counter">
          Menampilkan {startItem} - {endItem} dari {totalItems} board
        </div>

        <div className="board-history-pagination">
          {/* Tombol Sebelumnya */}
          <button
            type="button"
            className="btn-pagination-nav"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Halaman sebelumnya"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Tombol Nomor Halaman */}
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`btn-pagination-page ${
                pageNum === currentPage ? 'active' : ''
              }`}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          {/* Tombol Selanjutnya */}
          <button
            type="button"
            className="btn-pagination-nav"
            disabled={
              currentPage >= (meta.totalPages || 1) || isLoading
            }
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Halaman selanjutnya"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
