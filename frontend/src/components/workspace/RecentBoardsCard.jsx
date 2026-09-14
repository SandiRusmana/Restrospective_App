import React from 'react';
import { FileText, FileCheck2, ArrowRight } from 'lucide-react';

export default function RecentBoardsCard({ workspace, onViewAllBoards, onOpenBoard }) {
  const boards = workspace?.recentBoards || (workspace?.boards || []).slice(0, 5);

  return (
    <div className="right-panel-card">
      <div className="panel-header-title">
        Board Terbaru
      </div>

      <div className="boards-list">
        {boards.length === 0 ? (
          <div style={{ padding: '16px 8px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
            Belum ada board di workspace ini
          </div>
        ) : (
          boards.map((board) => {
            const boardName = board.title || board.name || 'Untitled Board';
            const formattedDate = board.updatedAt 
              ? new Date(board.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              : 'Baru';

            return (
              <div key={board.id} className="board-item">
                <div className="board-info">
                  <div className="board-icon-box">
                    {board.iconType === 'check-doc' ? (
                      <FileCheck2 size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>
                  <div className="board-details">
                    <div className="board-title" title={boardName}>
                      {boardName}
                    </div>
                    <div className="board-updated">{formattedDate}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="btn-action-small"
                  onClick={() => onOpenBoard && onOpenBoard(board)}
                >
                  Buka
                </button>
              </div>
            );
          })
        )}
      </div>

      <button 
        type="button"
        className="panel-footer-link-btn"
        onClick={onViewAllBoards}
      >
        <span>Lihat semua board</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
