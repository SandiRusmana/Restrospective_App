import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MoreHorizontal,
  MessageSquare,
  CheckSquare,
  Activity,
  LayoutGrid,
  ChevronDown,
  Check,
  User,
  Clock,
  AlarmClock,
  Eye,
  EyeOff,
  FileDown,
  Loader2,
  BarChart2,
  Gamepad2,
  Share2,
  Link,
  Copy,
  Edit,
} from 'lucide-react';
import { api } from '../../services/api';
import { useBoardPusher } from '../../hooks/useBoardPusher';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import RetroColumn from './RetroColumn';
import ActionItemsTable from './ActionItemsTable';
import PreviousSessionActionItems from './PreviousSessionActionItems';
import SessionTimerBanner from './SessionTimerBanner';
import DashboardSummaryView from './DashboardSummaryView';
import CardDetailModal from '../modals/CardDetailModal';
import SessionTimerModal from '../modals/SessionTimerModal';
import SessionTimerEndedModal from '../modals/SessionTimerEndedModal';
import BoardSettingsModal from '../modals/BoardSettingsModal';
import ConvertToActionItemModal from '../modals/ConvertToActionItemModal';
import IcebreakerSelectModal from '../modals/IcebreakerSelectModal';
import IcebreakerOverlay from './IcebreakerOverlay';

// Template Columns Dictionary
const TEMPLATE_COLUMNS_MAP = {
  'start-stop-continue': [
    { id: 'start', type: 'start', title: 'START', name: 'START', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'stop', type: 'stop', title: 'STOP', name: 'STOP', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'continue', type: 'continue', title: 'CONTINUE', name: 'CONTINUE', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
  ],
  'mad-sad-glad': [
    { id: 'mad', type: 'mad', title: 'MAD', name: 'MAD', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'sad', type: 'sad', title: 'SAD', name: 'SAD', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'glad', type: 'glad', title: 'GLAD', name: 'GLAD', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
  ],
  '4ls': [
    { id: 'liked', type: 'liked', title: 'LIKED', name: 'LIKED (DISUKAI)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'learned', type: 'learned', title: 'LEARNED', name: 'LEARNED (DIPELAJARI)', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'lacked', type: 'lacked', title: 'LACKED', name: 'LACKED (KURANG)', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'longed', type: 'longed', title: 'LONGED FOR', name: 'LONGED FOR (DIHARAPKAN)', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', badgeBg: '#f3e8ff', badgeColor: '#9333ea' },
  ],
  '4l': [
    { id: 'liked', type: 'liked', title: 'LIKED', name: 'LIKED (DISUKAI)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'learned', type: 'learned', title: 'LEARNED', name: 'LEARNED (DIPELAJARI)', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'lacked', type: 'lacked', title: 'LACKED', name: 'LACKED (KURANG)', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'longed', type: 'longed', title: 'LONGED FOR', name: 'LONGED FOR (DIHARAPKAN)', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', badgeBg: '#f3e8ff', badgeColor: '#9333ea' },
  ],
  'went-well-wrong': [
    { id: 'went_well', type: 'start', title: 'WHAT WENT WELL', name: 'WHAT WENT WELL', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'went_wrong', type: 'stop', title: 'WHAT WENT WRONG', name: 'WHAT WENT WRONG', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'action_items', type: 'continue', title: 'ACTION ITEMS', name: 'ACTION ITEMS', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
  ],
};

// Board navigation tabs
const BOARD_TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
];

export default function RetroBoardDetail({
  workspace,
  board,
  onBack,
  onSwitchBoard,
  currentUser,
  onShowToast,
  onUpdateBoard,
}) {
  const boardId = board?.id;
  const [activeTab, setActiveTab] = useState('board');
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
  const [members, setMembers] = useState([]);

  // ── Board Settings & Anonymous Mode State ──
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(Boolean(board?.isAnonymous));
  // Mode Anonymous Personal (per-user): Setiap anggota maupun facilitator dapat mengaktifkannya untuk diri sendiri
  const [isMyAnonymous, setIsMyAnonymous] = useState(() => {
    try {
      const saved = localStorage.getItem(`retro_anon_${boardId}_${currentUser?.id || currentUser?.email || 'user'}`);
      return saved !== null ? saved === 'true' : Boolean(board?.isAnonymous);
    } catch {
      return Boolean(board?.isAnonymous);
    }
  });
  const [currentBoardTitle, setCurrentBoardTitle] = useState(
    board?.title || board?.name || 'Sprint 16 Retrospective'
  );

  // ── Read-Only Mode State & Share Dropdown ──
  const [isReadOnly, setIsReadOnly] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('readOnly') === 'true' || Boolean(board?.initialReadOnly);
    } catch {
      return Boolean(board?.initialReadOnly);
    }
  });
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setIsShareMenuOpen(false);
      }
    };
    if (isShareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareMenuOpen]);

  // Synchronize isReadOnly state if prop board changes
  useEffect(() => {
    if (board?.initialReadOnly !== undefined) {
      setIsReadOnly(Boolean(board.initialReadOnly));
    }
  }, [board?.initialReadOnly]);

  // ── Action Items State ──
  const [actionItems, setActionItems] = useState([]);
  const [convertModalCard, setConvertModalCard] = useState(null);
  const [boardColumns, setBoardColumns] = useState(board?.columns || []);
  const [isExporting, setIsExporting] = useState(false);

  // ── Icebreaker State ──
  const [isIcebreakerSelectModalOpen, setIsIcebreakerSelectModalOpen] = useState(false);
  const [activeIcebreaker, setActiveIcebreaker] = useState(null);

  // ── Previous Session Action Items State ──
  const [previousSessionItems, setPreviousSessionItems] = useState([]);

  const formatActionItem = useCallback((item) => {
    if (!item) return null;
    const dueDateDisplay = item.dueDate
      ? new Date(item.dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    return {
      ...item,
      id: item.id,
      cardId: item.cardId,
      boardId: item.boardId || item.board?.id,
      boardName: item.board?.name || item.board?.title || item.boardName || 'Sesi Sebelumnya',
      title: item.title || item.card?.content || 'Action Item',
      status: item.status || 'PENDING',
      dueDate: item.dueDate,
      dueDateDisplay: item.dueDateDisplay || dueDateDisplay,
      assignee: item.assignee || null,
      description: item.description || '',
    };
  }, []);

  const loadActionItemsFromApi = useCallback(async () => {
    if (!boardId) return;
    try {
      const res = await api.getActionItems(boardId);
      if (Array.isArray(res)) {
        setActionItems(res.map(formatActionItem));
      }
    } catch (err) {
      console.warn('[ActionItems] Gagal memuat action items:', err);
    }
  }, [boardId, formatActionItem]);

  // Load action items dari sesi / board sebelumnya di workspace yang sama
  const loadPreviousSessionItems = useCallback(async () => {
    const wsId = workspace?.id || board?.workspaceId;
    if (!wsId) return;
    try {
      const res = await api.getWorkspaceActionItems(wsId, 'pending');
      if (Array.isArray(res)) {
        // Filter action items dari sesi/board sebelumnya di workspace yang sama
        const prevItems = res
          .filter((item) => (item.boardId || item.board?.id) !== boardId)
          .map(formatActionItem);
        setPreviousSessionItems(prevItems);
      }
    } catch (err) {
      console.warn('[PrevSession] Gagal memuat action items sesi sebelumnya:', err);
    }
  }, [workspace?.id, board?.workspaceId, boardId, formatActionItem]);

  const handleUpdatePreviousSessionStatus = useCallback(
    async (itemId, newStatus) => {
      setPreviousSessionItems((prev) =>
        prev.map((ai) => (ai.id === itemId ? { ...ai, status: newStatus } : ai))
      );
      if (onShowToast) {
        onShowToast(`Status action item diubah menjadi ${newStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : newStatus}`);
      }
      try {
        await api.updateActionItem(itemId, { status: newStatus });
      } catch (err) {
        console.error('[PrevSession] Gagal update status action item:', err);
        if (onShowToast) onShowToast('Gagal memperbarui status action item ke server');
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    if (boardId) {
      loadActionItemsFromApi();
      loadPreviousSessionItems();
    }
  }, [boardId, loadActionItemsFromApi, loadPreviousSessionItems]);

  useEffect(() => {
    if (activeTab === 'action-items' && boardId) {
      loadActionItemsFromApi();
      loadPreviousSessionItems();
    }
  }, [activeTab, boardId, loadActionItemsFromApi, loadPreviousSessionItems]);

  // Sync state when board prop changes
  useEffect(() => {
    if (board) {
      setIsAnonymous(Boolean(board.isAnonymous));
      setCurrentBoardTitle(board.title || board.name || 'Sprint 16 Retrospective');
      if (board.columns && board.columns.length > 0) {
        setBoardColumns(board.columns);
      }
    }
  }, [board]);

  useEffect(() => {
    if (!boardId) return;
    api.getBoardById(boardId).then((fullBoard) => {
      if (fullBoard?.columns && fullBoard.columns.length > 0) {
        setBoardColumns(fullBoard.columns);
      }
    }).catch(() => {});
  }, [boardId]);

  // Cek apakah user saat ini adalah facilitator / admin / owner
  const isFacilitator = useMemo(() => {
    if (!currentUser) return false;
    const currentUserId = currentUser?.id || currentUser?.userId;
    if (workspace?.ownerId && workspace.ownerId === currentUserId) return true;
    const myRole = workspace?.role?.toLowerCase();
    if (['owner', 'facilitator', 'admin'].includes(myRole)) return true;
    const member = members.find(
      (m) => (m.id || m.userId) === currentUserId || m.email === currentUser?.email
    );
    if (member && ['owner', 'facilitator', 'admin'].includes(member.role?.toLowerCase())) {
      return true;
    }
    return true; // Default fallback dalam sesi retro
  }, [currentUser, workspace, members]);

  // ── Retro Session Timer State ──
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isTimerEndedModalOpen, setIsTimerEndedModalOpen] = useState(false);
  const [timerStatus, setTimerStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'ended'
  const [timerTotal, setTimerTotal] = useState(15 * 60); // 15 mins in seconds
  const [timerRemaining, setTimerRemaining] = useState(15 * 60);
  const [timerStartedById, setTimerStartedById] = useState(null);
  const [timerFacilitator, setTimerFacilitator] = useState(
    currentUser?.name || currentUser?.email?.split('@')[0] || 'Afrizal'
  );

  // Helper: Apply timer data from server or Pusher
  const applyTimerState = useCallback((data, isLiveUpdate = false) => {
    if (!data) return;
    const t = data.timer || data;

    const totalSecs = t.duration || t.totalSeconds || 900;
    setTimerTotal(totalSecs);

    let rem =
      typeof t.remaining === 'number'
        ? t.remaining
        : typeof t.remainingSeconds === 'number'
        ? t.remainingSeconds
        : totalSecs;

    if (t.isRunning && t.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(t.startedAt).getTime()) / 1000);
      rem = Math.max(0, rem - elapsed);
    }

    // Jika timer sudah tidak berjalan dan sisa waktunya 0 (sesi lama sudah selesai),
    // kembalikan ke totalSecs dan jadikan status idle saat user baru buka/refresh board
    if (!t.isRunning && rem <= 0 && !isLiveUpdate) {
      rem = totalSecs;
    }
    setTimerRemaining(rem);

    const facilitatorName = data.facilitator || t.facilitator;
    if (facilitatorName) {
      setTimerFacilitator(facilitatorName);
    }

    const starterId = data.startedById || t.startedById || data.user?.id || t.user?.id;
    if (starterId) {
      setTimerStartedById(starterId);
    }

    let nextStatus = 'idle';
    if (t.status) {
      nextStatus = t.status;
    } else if (t.isRunning) {
      nextStatus = rem > 0 ? 'running' : (isLiveUpdate ? 'ended' : 'idle');
    } else if (rem > 0 && rem < totalSecs) {
      nextStatus = 'paused';
    } else if (rem === 0 && isLiveUpdate) {
      nextStatus = 'ended';
    } else {
      nextStatus = 'idle';
    }

    setTimerStatus(nextStatus);
    // Hanya tampilkan popup modal jika timer aktif baru saja selesai (live update),
    // bukan saat baru membuka/refresh halaman yang sesi sebelumnya sudah selesai
    if (nextStatus === 'ended' && isLiveUpdate) {
      setIsTimerEndedModalOpen(true);
    }
  }, []);

  // Fetch initial timer status from server (isLiveUpdate = false agar tidak popup saat refresh)
  useEffect(() => {
    if (!boardId) return;
    api
      .getTimer(boardId)
      .then((res) => {
        if (res) applyTimerState(res, false);
      })
      .catch((err) => console.warn('[Timer] Gagal memuat timer:', err));
  }, [boardId, applyTimerState]);

  // Sync facilitator if current user changes
  useEffect(() => {
    if (currentUser?.name && timerFacilitator === 'Afrizal') {
      setTimerFacilitator(currentUser.name);
    }
  }, [currentUser?.name]);

  // Timer Countdown Ticker
  useEffect(() => {
    let interval = null;
    if (timerStatus === 'running') {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerStatus('ended');
            setIsTimerEndedModalOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus]);

  const handleStartTimer = async (durationMinutes) => {
    const totalSecs = Math.max(1, durationMinutes) * 60;
    setTimerTotal(totalSecs);
    setTimerRemaining(totalSecs);
    setTimerStatus('running');
    const currentUserId = currentUser?.id || currentUser?.userId;
    setTimerStartedById(currentUserId);
    setTimerFacilitator(currentUser?.name || currentUser?.email?.split('@')[0] || 'Anda');
    if (onShowToast) onShowToast(`Timer sesi dimulai: ${durationMinutes} menit`);

    if (!boardId) return;
    try {
      const res = await api.startTimer(boardId, totalSecs);
      if (res) applyTimerState(res, true);
    } catch (err) {
      console.warn('Gagal start timer di server:', err);
    }
  };

  const handlePauseTimer = async () => {
    setTimerStatus('paused');
    if (onShowToast) onShowToast('Timer sesi dijeda');
    if (!boardId) return;
    try {
      const res = await api.pauseTimer(boardId);
      if (res) applyTimerState(res);
    } catch (err) {
      console.warn('Gagal pause timer di server:', err);
    }
  };

  const handleResumeTimer = async () => {
    setTimerStatus('running');
    if (onShowToast) onShowToast('Timer sesi dilanjutkan');
    if (!boardId) return;
    try {
      const res = await api.startTimer(boardId);
      if (res) applyTimerState(res);
    } catch (err) {
      console.warn('Gagal resume timer di server:', err);
    }
  };

  const handleResetTimer = async () => {
    setTimerStatus('idle');
    setTimerRemaining(timerTotal);
    if (onShowToast) onShowToast('Timer sesi direset');
    if (!boardId) return;
    try {
      const res = await api.resetTimer(boardId);
      if (res) applyTimerState(res);
    } catch (err) {
      console.warn('Gagal reset timer di server:', err);
    }
  };

  const handleChangeFacilitator = (name) => {
    setTimerFacilitator(name);
    if (onShowToast) onShowToast(`Fasilitator diubah: ${name}`);
  };

  // Load Workspace Members from API
  useEffect(() => {
    const wsId = workspace?.id || board?.workspaceId;
    if (!wsId) return;
    api
      .getWorkspaceMembers(wsId)
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((m) => ({
            id: m.userId || m.id,
            name: m.user?.name || m.name || m.user?.email?.split('@')[0] || 'Member',
            email: m.user?.email || m.email || '',
            avatarUrl:
              m.user?.avatarUrl ||
              m.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.name || m.user?.email || m.userId || 'member'}`,
          }));
          setMembers(formatted);
        }
      })
      .catch(() => {});
  }, [workspace?.id, board?.workspaceId]);

  // Load Cards from API
  const loadCardsFromApi = useCallback(async () => {
    if (!boardId) return;
    try {
      const cardsData = await api.getCards(boardId);
      if (Array.isArray(cardsData)) {
        const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.email;
        const formatted = cardsData.map((c) => {
          const isOwner =
            Boolean(c.isOwner) ||
            (c.authorId && c.authorId === currentUserId) ||
            (c.author?.id && c.author.id === currentUserId) ||
            (c.author?.email && currentUser?.email && c.author.email === currentUser.email);
          const authorName = isOwner
            ? 'Anda'
            : (c.author?.name || c.author?.email?.split('@')[0] || 'Anggota');
          const authorEmail = c.author?.email || (isOwner ? (currentUser?.email || '') : '');
          const authorAvatar = isOwner && (currentUser?.avatarUrl || currentUser?.avatar)
            ? (currentUser.avatarUrl || currentUser.avatar)
            : (c.author?.avatarUrl || c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorEmail || authorName}`);
          const votesList = Array.isArray(c.votes) ? c.votes : [];
          const votesCount = typeof c.votesCount === 'number' ? c.votesCount : votesList.length;
          const hasVoted =
            votesList.some((v) => (v.userId || v.id || v) === currentUserId) ||
            Boolean(c.hasVoted);

          return {
            id: c.id,
            boardId: c.boardId,
            columnId: c.columnId || 'start',
            columnType: c.columnType || null,
            columnName: c.columnName || null,
            content: c.content,
            text: c.content,
            groupId: c.groupId || null,
            groupTitle: c.groupTitle || null,
            authorId: c.authorId,
            isOwner,
            isAnonymous: Boolean(c.isAnonymous),
            author: c.author,
            authorName,
            authorEmail,
            avatar: authorAvatar,
            createdAt: c.createdAt,
            time: c.createdAt
              ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Baru saja',
            votes: votesList,
            votesCount,
            hasVoted,
            comments: (c.comments || []).map((cm) => ({
              id: cm.id,
              cardId: c.id,
              content: cm.content || cm.text || '',
              text: cm.content || cm.text || '',
              userId: cm.userId,
              author: cm.user || cm.author,
              authorName: cm.user?.name || cm.authorName || 'Anggota',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cm.user?.email || cm.user?.name || 'Anggota'}`,
              createdAt: cm.createdAt,
              time: cm.createdAt
                ? new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Baru saja',
            })),
            commentsCount: c.commentsCount || (c.comments ? c.comments.length : 0),
          };
        });
        setCards(formatted);
      }
    } catch (err) {
      console.warn('Gagal memuat card dari backend:', err);
      setCards([]);
    }
  }, [boardId, currentUser]);

  useEffect(() => {
    loadCardsFromApi();
  }, [loadCardsFromApi]);

  // Hook Pusher Channels Realtime & Presence
  const { onlineMembers, onlineCount } = useBoardPusher(boardId, currentUser, {
    onCardCreated: (newCard) => {
      if (!newCard) return;
      const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.email;
      const isOwner =
        Boolean(newCard.isOwner) ||
        (newCard.authorId && newCard.authorId === currentUserId) ||
        (newCard.author?.id && newCard.author.id === currentUserId) ||
        (newCard.author?.email && currentUser?.email && newCard.author.email === currentUser.email);
      const authorName = isOwner
        ? 'Anda'
        : (newCard.author?.name || 'Anggota Tim');
      const authorEmail = newCard.author?.email || (isOwner ? (currentUser?.email || '') : '');
      const authorAvatar = isOwner && (currentUser?.avatarUrl || currentUser?.avatar)
        ? (currentUser.avatarUrl || currentUser.avatar)
        : (newCard.author?.avatarUrl ||
           newCard.author?.avatar ||
           newCard.avatar ||
           `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorEmail || authorName}`);
      const formattedCard = {
        ...newCard,
        content: newCard.content || newCard.text || '',
        text: newCard.content || newCard.text || '',
        authorId: newCard.authorId,
        isOwner,
        isAnonymous: Boolean(newCard.isAnonymous),
        authorName,
        authorEmail,
        avatar: authorAvatar,
        time: newCard.createdAt
          ? new Date(newCard.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Baru saja',
        votes: newCard.votes || [],
        votesCount: newCard.votesCount || (Array.isArray(newCard.votes) ? newCard.votes.length : 0),
        hasVoted: newCard.hasVoted || false,
        comments: newCard.comments || [],
        commentsCount: newCard.commentsCount || 0,
      };

      setCards((prev) => {
        // Jika sudah ada (berdasarkan id yang sama), jangan duplikasi
        if (prev.some((c) => c.id === formattedCard.id)) return prev;

        // Jika ada temporary optimistic card dengan konten & kolom yang sama, replace
        const optIndex = prev.findIndex(
          (c) =>
            typeof c.id === 'string' &&
            c.id.startsWith('card_') &&
            (c.columnId === formattedCard.columnId ||
              c.columnId?.toLowerCase() === formattedCard.columnId?.toLowerCase()) &&
            c.content === formattedCard.content
        );

        if (optIndex !== -1) {
          const next = [...prev];
          next[optIndex] = formattedCard;
          return next;
        }

        return [...prev, formattedCard];
      });
    },

    onCardUpdated: (updatedCard) => {
      setCards((prev) =>
        prev.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c))
      );
      setSelectedCardForDetail((prev) =>
        prev && prev.id === updatedCard.id ? { ...prev, ...updatedCard } : prev
      );
    },

    onCardDeleted: (deletedData) => {
      const targetId = deletedData?.id || deletedData?.cardId;
      setCards((prev) => prev.filter((c) => c.id !== targetId));
      setSelectedCardForDetail((prev) => (prev && prev.id === targetId ? null : prev));
    },

    onVoteUpdated: (voteData) => {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === voteData.cardId) {
            const currentVotes = Array.isArray(c.votes) ? [...c.votes] : [];
            const userVoteIndex = currentVotes.findIndex(
              (v) => (v.userId || v.id || v) === voteData.userId
            );

            let nextVotes;
            if (userVoteIndex >= 0) {
              nextVotes = currentVotes.filter((_, idx) => idx !== userVoteIndex);
            } else {
              nextVotes = [
                ...currentVotes,
                { userId: voteData.userId, votedAt: voteData.votedAt || new Date().toISOString() },
              ];
            }

            const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
            const updatedCardObj = {
              ...c,
              votes: nextVotes,
              votesCount: nextVotes.length,
              hasVoted: nextVotes.some(
                (v) => (v.userId || v.id || v) === currentUserId
              ),
            };
            return updatedCardObj;
          }
          return c;
        })
      );

      setSelectedCardForDetail((prev) => {
        if (prev && prev.id === voteData.cardId) {
          const currentVotes = Array.isArray(prev.votes) ? [...prev.votes] : [];
          const userVoteIndex = currentVotes.findIndex(
            (v) => (v.userId || v.id || v) === voteData.userId
          );
          let nextVotes;
          if (userVoteIndex >= 0) {
            nextVotes = currentVotes.filter((_, idx) => idx !== userVoteIndex);
          } else {
            nextVotes = [
              ...currentVotes,
              { userId: voteData.userId, votedAt: voteData.votedAt || new Date().toISOString() },
            ];
          }
          const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
          return {
            ...prev,
            votes: nextVotes,
            votesCount: nextVotes.length,
            hasVoted: nextVotes.some((v) => (v.userId || v.id || v) === currentUserId),
          };
        }
        return prev;
      });
    },

    onCommentCreated: (commentData) => {
      const cardId = commentData?.cardId;
      if (!cardId) return;

      const formattedComment = {
        id: commentData.id || `comment_${Date.now()}`,
        cardId,
        author: {
          id: commentData.authorId || 'author',
          name: commentData.authorName || 'Anggota Tim',
          avatarUrl:
            commentData.authorAvatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${commentData.authorId || 'member'}`,
        },
        authorName: commentData.authorName || 'Anggota Tim',
        text: commentData.text || commentData.content || '',
        time: new Date(commentData.createdAt || Date.now()).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        createdAt: commentData.createdAt || new Date().toISOString(),
      };

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === cardId) {
            const existingComments = Array.isArray(c.comments) ? [...c.comments] : [];
            if (existingComments.some((cm) => cm.id === formattedComment.id)) return c;
            const nextComments = [...existingComments, formattedComment];
            return {
              ...c,
              comments: nextComments,
              commentCount: nextComments.length,
              commentsCount: nextComments.length,
            };
          }
          return c;
        })
      );

      setSelectedCardForDetail((prev) => {
        if (prev && prev.id === cardId) {
          const existingComments = Array.isArray(prev.comments) ? [...prev.comments] : [];
          if (existingComments.some((cm) => cm.id === formattedComment.id)) return prev;
          const nextComments = [...existingComments, formattedComment];
          return {
            ...prev,
            comments: nextComments,
            commentCount: nextComments.length,
            commentsCount: nextComments.length,
          };
        }
        return prev;
      });
    },

    onCardGrouped: (groupData) => {
      const targetCardId = groupData?.cardId || groupData?.id;
      if (!targetCardId) return;

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === targetCardId) {
            return {
              ...c,
              groupId: groupData.groupId || null,
              groupTitle:
                groupData.groupTitle !== undefined ? groupData.groupTitle : c.groupTitle,
            };
          }
          if (
            groupData.groupId &&
            c.groupId === groupData.groupId &&
            groupData.groupTitle !== undefined
          ) {
            return { ...c, groupTitle: groupData.groupTitle };
          }
          return c;
        })
      );
    },

    onTimerUpdated: (timerData) => {
      applyTimerState(timerData, true);
    },

    onActionItemCreated: (payload) => {
      const item = payload?.actionItem || payload;
      if (!item) return;
      const formatted = formatActionItem(item);
      setActionItems((prev) => {
        const exists = prev.some(
          (ai) => ai.id === formatted.id || (ai.cardId && ai.cardId === formatted.cardId)
        );
        if (exists) {
          return prev.map((ai) =>
            ai.id === formatted.id || ai.cardId === formatted.cardId ? formatted : ai
          );
        }
        return [formatted, ...prev];
      });
    },

    onActionItemUpdated: (payload) => {
      const item = payload?.actionItem || payload;
      if (!item) return;
      const formatted = formatActionItem(item);
      setActionItems((prev) =>
        prev.map((ai) => (ai.id === formatted.id ? { ...ai, ...formatted } : ai))
      );
    },

    onAnonymousUpdated: (payload) => {
      if (payload && (payload.boardId === boardId || !payload.boardId)) {
        const newStatus = Boolean(payload.isAnonymous);
        setIsAnonymous(newStatus);
        if (onShowToast) {
          onShowToast(`Mode anonymous ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} oleh fasilitator`);
        }
        loadCardsFromApi();
      }
    },

    onIcebreakerStarted: (session) => {
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast(`Fasilitator memulai sesi Icebreaker: ${session.title || 'Emoji Mood'}!`);
      }
    },

    onIcebreakerVoted: (data) => {
      setActiveIcebreaker((prev) => {
        if (!prev) return prev;
        const updatedVotes = data.votes || {
          ...prev.votes,
          [data.userId]: {
            userId: data.userId,
            userName: data.userName,
            avatarUrl: data.avatarUrl,
            optionId: data.optionId,
          },
        };
        return { ...prev, votes: updatedVotes };
      });
    },

    onIcebreakerSkipped: (session) => {
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast('Pertanyaan icebreaker diganti oleh fasilitator');
      }
    },

    onIcebreakerRevealed: (session) => {
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast('Kunci jawaban dibuka oleh fasilitator!');
      }
    },

    onIcebreakerEnded: () => {
      setActiveIcebreaker((prev) => (prev ? { ...prev, status: 'ended' } : null));
      if (onShowToast) {
        onShowToast('Sesi icebreaker telah selesai!');
      }
    },
  });

  // Check initial active icebreaker session on mount
  useEffect(() => {
    if (!boardId) return;
    api
      .getIcebreakerState(boardId)
      .then((res) => {
        if (res?.active && res.session) {
          setActiveIcebreaker(res.session);
        }
      })
      .catch(() => {});
  }, [boardId]);

  // Handler: Start Icebreaker Game
  const handleStartIcebreaker = async (gameType, totalQuestions = 5) => {
    setIsIcebreakerSelectModalOpen(false);
    try {
      const session = await api.startIcebreaker(boardId, gameType, totalQuestions);
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast(`Icebreaker "${session.title}" dimulai (${totalQuestions} soal)!`);
      }
    } catch (err) {
      console.error('Gagal memulai icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal memulai icebreaker');
    }
  };

  // Handler: Submit Icebreaker Vote
  const handleVoteIcebreaker = async (optionId) => {
    try {
      await api.submitIcebreakerVote(boardId, optionId);
    } catch (err) {
      console.error('Gagal kirim vote icebreaker:', err);
    }
  };

  // Handler: Reveal Icebreaker Answer
  const handleRevealIcebreaker = async () => {
    try {
      const session = await api.revealIcebreaker(boardId);
      setActiveIcebreaker(session);
    } catch (err) {
      console.error('Gagal membuka jawaban icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal membuka jawaban');
    }
  };

  // Handler: Skip Icebreaker Question
  const handleSkipIcebreaker = async () => {
    try {
      const session = await api.skipIcebreaker(boardId);
      setActiveIcebreaker(session);
    } catch (err) {
      console.error('Gagal skip icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal skip icebreaker');
    }
  };

  // Handler: End Icebreaker Session
  const handleEndIcebreaker = async () => {
    try {
      await api.endIcebreaker(boardId);
      setActiveIcebreaker((prev) => (prev ? { ...prev, status: 'ended' } : null));
    } catch (err) {
      console.error('Gagal mengakhiri icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal mengakhiri icebreaker');
    }
  };

  // Handler: Toggle Personal Anonymous Mode
  const handleToggleMyAnonymous = () => {
    const nextState = !isMyAnonymous;
    setIsMyAnonymous(nextState);
    try {
      localStorage.setItem(
        `retro_anon_${boardId}_${currentUser?.id || currentUser?.email || 'user'}`,
        String(nextState)
      );
    } catch {}

    if (onShowToast) {
      if (nextState) {
        onShowToast('Mode Anonymous aktif untuk Anda. Catatan yang Anda buat akan bersifat anonim.');
      } else {
        onShowToast('Mode Anonymous dinonaktifkan. Catatan Anda akan menampilkan nama Anda.');
      }
    }
  };

  // Handler: Save Board Settings & Anonymous Mode
  const handleSaveBoardSettings = async ({ boardName: newName, isAnonymous: newAnon }) => {
    const hasAnonChanged = newAnon !== isAnonymous;
    const hasNameChanged = Boolean(newName && newName !== currentBoardTitle);

    if (hasNameChanged) {
      setCurrentBoardTitle(newName);
    }

    if (hasAnonChanged) {
      setIsAnonymous(newAnon);
      setIsMyAnonymous(newAnon);
      try {
        localStorage.setItem(
          `retro_anon_${boardId}_${currentUser?.id || currentUser?.email || 'user'}`,
          String(newAnon)
        );
      } catch {}
      try {
        await api.updateAnonymous(boardId, newAnon);
        if (onShowToast) {
          onShowToast(`Mode anonymous berhasil ${newAnon ? 'diaktifkan' : 'dinonaktifkan'}`);
        }
      } catch (err) {
        console.warn('Gagal update mode anonymous di server:', err);
        if (onShowToast) {
          onShowToast(err.message || 'Mode anonymous diperbarui');
        }
      }
    } else if (hasNameChanged) {
      if (onShowToast) {
        onShowToast('Pengaturan board berhasil disimpan');
      }
    }

    if (onUpdateBoard) {
      onUpdateBoard({
        id: boardId,
        name: newName || currentBoardTitle,
        title: newName || currentBoardTitle,
        isAnonymous: newAnon,
      });
    }
  };

  // Sensor drag dengan activation constraint agar tidak mengganggu klik vote/menu
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Calculate highest voted card for dynamic priority
  const maxVotes = useMemo(() => {
    if (!cards.length) return 0;
    return Math.max(
      ...cards.map((c) => {
        if (typeof c.votesCount === 'number') return c.votesCount;
        if (Array.isArray(c.votes)) return c.votes.length;
        if (typeof c.votes === 'number') return c.votes;
        return c.voteCount || 0;
      })
    );
  }, [cards]);

  // Handler: Toggle Read-Only Mode
  const handleToggleReadOnly = () => {
    const nextState = !isReadOnly;
    setIsReadOnly(nextState);
    try {
      const url = new URL(window.location.href);
      if (nextState) {
        url.searchParams.set('readOnly', 'true');
      } else {
        url.searchParams.delete('readOnly');
      }
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {}
    if (onShowToast) {
      onShowToast(
        nextState
          ? 'Mode Baca Saja (Read-Only) aktif'
          : 'Mode Interaktif (Edit) aktif'
      );
    }
  };

  // Handler: Share Board Link (Interactive or Read-Only)
  const handleCopyBoardLink = (asReadOnly = false) => {
    const origin = window.location.origin;
    const targetBoardId = board?.id || boardId;
    const url = asReadOnly
      ? `${origin}/board/${targetBoardId}?readOnly=true`
      : `${origin}/board/${targetBoardId}`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setIsShareMenuOpen(false);
    if (onShowToast) {
      onShowToast(
        asReadOnly
          ? 'Link Mode Baca Saja (Read-Only) berhasil disalin!'
          : 'Link Board Retrospective berhasil disalin!'
      );
    }
  };

  // Handler: Export Retro Board to PDF
  const handleExportPdf = async () => {
    if (!board?.id || isExporting) return;
    setIsExporting(true);
    try {
      const { blob, filename } = await api.exportBoardPdf(board.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Retro_${board.name || 'Board'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      if (onShowToast) onShowToast('Hasil retrospective berhasil diekspor ke PDF!');
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal mengekspor PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler: Add Card
  const handleAddCard = async (columnId, text) => {
    const defaultAvatar =
      currentUser?.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'user'}`;
    const authorName =
      currentUser?.name ||
      currentUser?.fullName?.replace(' (Anda)', '') ||
      currentUser?.email?.split('@')[0] ||
      'Anda';

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const isCardAnon = Boolean(isMyAnonymous);
    const tempId = `card_${Date.now()}`;
    const newCard = {
      id: tempId,
      columnId,
      content: text,
      author: {
        id: currentUser?.id || 'current_user',
        name: authorName,
        email: currentUser?.email || '',
      },
      isOwner: true,
      isAnonymous: isCardAnon,
      authorName,
      avatar: defaultAvatar,
      time: formattedTime,
      createdAt: now.toISOString(),
      votes: [],
      votesCount: 0,
      votedBy: [],
      hasVoted: false,
      comments: [],
      commentsCount: 0,
      commentCount: 0,
    };

    setCards((prev) => [...prev, newCard]);
    if (onShowToast) onShowToast('Catatan berhasil ditambahkan!');

    // Async sync with API
    try {
      const res = await api.createCard(boardId, columnId, text, isCardAnon);
      if (res?.card) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? {
                  ...c,
                  ...res.card,
                  text: res.card.content || c.text,
                  columnId: res.card.columnId || c.columnId,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('[API Error] Gagal menambahkan card:', err);
      // Hapus temporary card agar state sinkron dengan database
      setCards((prev) => prev.filter((c) => c.id !== tempId));
      if (onShowToast) {
        onShowToast(`Gagal menambahkan catatan: ${err.message || 'Server error'}`);
      }
    }
  };

  // Handler: Edit Card
  const handleEditCard = async (cardId, updatedText) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, content: updatedText, text: updatedText } : c
      )
    );
    setSelectedCardForDetail((prev) =>
      prev && prev.id === cardId ? { ...prev, content: updatedText, text: updatedText } : prev
    );
    if (onShowToast) onShowToast('Catatan berhasil diperbarui!');

    try {
      await api.updateCard(cardId, updatedText);
    } catch {
      // Local state updated
    }
  };

  // Handler: Delete Card
  const handleDeleteCard = async (card) => {
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    setSelectedCardForDetail((prev) => (prev && prev.id === card.id ? null : prev));
    if (onShowToast) onShowToast('Catatan berhasil dihapus');

    try {
      await api.deleteCard(card.id);
    } catch {
      // Local state updated
    }
  };

  // Handler: Toggle Vote on Card
  const handleVoteCard = async (cardId) => {
    const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
    let userHasVoted = false;

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const currentVotes = Array.isArray(c.votes) ? [...c.votes] : [];
          userHasVoted =
            Boolean(c.hasVoted) ||
            currentVotes.some((v) => (v.userId || v.id || v) === currentUserId);

          let updatedVotes;
          if (userHasVoted) {
            updatedVotes = currentVotes.filter(
              (v) => (v.userId || v.id || v) !== currentUserId
            );
            if (onShowToast) onShowToast('Vote dibatalkan');
          } else {
            updatedVotes = [
              ...currentVotes,
              { userId: currentUserId, votedAt: new Date().toISOString() },
            ];
            if (onShowToast) onShowToast('Vote berhasil ditambahkan! (+1)');
          }

          return {
            ...c,
            votes: updatedVotes,
            votesCount: updatedVotes.length,
            hasVoted: !userHasVoted,
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId) {
        const currentVotes = Array.isArray(prev.votes) ? [...prev.votes] : [];
        const isVoted =
          Boolean(prev.hasVoted) ||
          currentVotes.some((v) => (v.userId || v.id || v) === currentUserId);

        let updatedVotes;
        if (isVoted) {
          updatedVotes = currentVotes.filter(
            (v) => (v.userId || v.id || v) !== currentUserId
          );
        } else {
          updatedVotes = [
            ...currentVotes,
            { userId: currentUserId, votedAt: new Date().toISOString() },
          ];
        }

        return {
          ...prev,
          votes: updatedVotes,
          votesCount: updatedVotes.length,
          hasVoted: !isVoted,
        };
      }
      return prev;
    });

    try {
      if (userHasVoted) {
        await api.unvoteCard(cardId);
      } else {
        await api.voteCard(cardId);
      }
    } catch (err) {
      console.error('Failed to vote/unvote card:', err);
    }
  };

  // Handler: Add Comment to Card
  const handleAddComment = async (cardId, text) => {
    const defaultAvatar =
      currentUser?.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'afrizal'}`;
    const authorName =
      currentUser?.name ||
      currentUser?.fullName?.replace(' (Anda)', '') ||
      currentUser?.email?.split('@')[0] ||
      'Afrizal';

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newCommentId = `comment_${Date.now()}`;
    const newComment = {
      id: newCommentId,
      cardId,
      author: {
        id: currentUser?.id || 'current_user',
        name: authorName,
        email: currentUser?.email || '',
        avatarUrl: defaultAvatar,
      },
      authorName,
      avatar: defaultAvatar,
      text,
      time: formattedTime,
      createdAt: now.toISOString(),
      isHighlighted: true,
    };

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const prevComments = Array.isArray(c.comments) ? c.comments : [];
          const nextComments = [...prevComments, newComment];
          return {
            ...c,
            comments: nextComments,
            commentCount: nextComments.length,
            commentsCount: nextComments.length,
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId) {
        const prevComments = Array.isArray(prev.comments) ? prev.comments : [];
        const nextComments = [...prevComments, newComment];
        return {
          ...prev,
          comments: nextComments,
          commentCount: nextComments.length,
          commentsCount: nextComments.length,
        };
      }
      return prev;
    });

    if (onShowToast) onShowToast('Komentar berhasil ditambahkan!');

    try {
      await api.addComment(cardId, text);
    } catch {
      // Local state already updated
    }

    return newCommentId;
  };

  // Handler: Edit Comment
  const handleEditComment = async (cardId, commentId, newText) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId && Array.isArray(c.comments)) {
          return {
            ...c,
            comments: c.comments.map((cm) =>
              cm.id === commentId ? { ...cm, text: newText, content: newText } : cm
            ),
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId && Array.isArray(prev.comments)) {
        return {
          ...prev,
          comments: prev.comments.map((cm) =>
            cm.id === commentId ? { ...cm, text: newText, content: newText } : cm
          ),
        };
      }
      return prev;
    });

    if (onShowToast) onShowToast('Komentar berhasil diperbarui');
  };

  // Handler: Delete Comment
  const handleDeleteComment = async (cardId, commentId) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId && Array.isArray(c.comments)) {
          const nextComments = c.comments.filter((cm) => cm.id !== commentId);
          return {
            ...c,
            comments: nextComments,
            commentCount: nextComments.length,
            commentsCount: nextComments.length,
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId && Array.isArray(prev.comments)) {
        const nextComments = prev.comments.filter((cm) => cm.id !== commentId);
        return {
          ...prev,
          comments: nextComments,
          commentCount: nextComments.length,
          commentsCount: nextComments.length,
        };
      }
      return prev;
    });

    if (onShowToast) onShowToast('Komentar berhasil dihapus');
  };

  // Handler: Copy Card
  const handleCopyCard = () => {
    if (onShowToast) onShowToast('Teks catatan berhasil disalin!');
  };

  // Handler: Drag & Drop Card Grouping & Moving
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || !active) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // A. Dragging Entire Group Cluster
    if (activeData?.type === 'group' && activeData?.groupId) {
      if (overData?.type === 'column' && overData?.columnId !== activeData.columnId) {
        handleMoveGroupColumn(activeData.groupId, overData.columnId);
      }
      return;
    }

    // B. Dragging Individual Card
    if (!activeData?.card) return;
    const activeCard = activeData.card;

    // 1. Dropped on another card
    if (overData?.type === 'card' && overData?.card) {
      const targetCard = overData.card;
      if (activeCard.id === targetCard.id) return;

      const targetGroupId = targetCard.groupId || activeCard.groupId || `group_${Date.now()}`;
      const targetColumnId = targetCard.columnId || activeCard.columnId;

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === activeCard.id) {
            return { ...c, groupId: targetGroupId, columnId: targetColumnId };
          }
          if (c.id === targetCard.id) {
            return { ...c, groupId: targetGroupId };
          }
          return c;
        })
      );

      if (onShowToast) onShowToast('Catatan digabungkan ke dalam grup');

      try {
        if (activeCard.columnId !== targetColumnId) {
          await api.moveCard(activeCard.id, targetColumnId);
        }
        await api.groupCard(activeCard.id, targetGroupId);
        if (!targetCard.groupId) {
          await api.groupCard(targetCard.id, targetGroupId);
        }
      } catch (err) {
        console.error('Failed to group cards:', err);
      }
      return;
    }

    // 2. Dropped on existing group container
    if (overData?.type === 'group' && overData?.groupId) {
      const targetGroupId = overData.groupId;
      const targetColumnId = overData.columnId || activeCard.columnId;
      if (activeCard.groupId === targetGroupId && activeCard.columnId === targetColumnId) return;

      setCards((prev) =>
        prev.map((c) =>
          c.id === activeCard.id
            ? { ...c, groupId: targetGroupId, columnId: targetColumnId }
            : c
        )
      );

      if (onShowToast) onShowToast('Catatan ditambahkan ke grup');

      try {
        if (activeCard.columnId !== targetColumnId) {
          await api.moveCard(activeCard.id, targetColumnId);
        }
        await api.groupCard(activeCard.id, targetGroupId);
      } catch (err) {
        console.error('Failed to add card to group:', err);
      }
      return;
    }

    // 3. Dropped on column container (cross-column move or ungroup)
    if (overData?.type === 'column') {
      const targetColumnId = overData.columnId;
      if (targetColumnId && targetColumnId !== activeCard.columnId) {
        // Pindah ke kolom lain
        handleMoveCardColumn(activeCard.id, targetColumnId);
      } else if (activeCard.groupId) {
        // Drop di kolom yang sama untuk keluar dari grup
        handleUngroupCard(activeCard.id);
      }
    }
  };

  // Handler: Move Card to Another Column
  const handleMoveCardColumn = async (cardId, targetColumnId) => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard || targetCard.columnId === targetColumnId) return;

    const oldGroupId = targetCard.groupId;

    setCards((prev) => {
      const remainingInGroup = oldGroupId
        ? prev.filter((c) => c.groupId === oldGroupId && c.id !== cardId)
        : [];

      return prev.map((c) => {
        if (c.id === cardId) {
          return { ...c, columnId: targetColumnId, groupId: null };
        }
        if (remainingInGroup.length === 1 && c.groupId === oldGroupId) {
          return { ...c, groupId: null };
        }
        return c;
      });
    });

    const targetColName =
      activeColumns.find((col) => col.id === targetColumnId || col.type === targetColumnId)
        ?.title || targetColumnId.toUpperCase();
    if (onShowToast) onShowToast(`Catatan dipindahkan ke kolom ${targetColName}`);

    try {
      await api.moveCard(cardId, targetColumnId);
      if (oldGroupId) {
        const remainingInGroup = cards.filter(
          (c) => c.groupId === oldGroupId && c.id !== cardId
        );
        if (remainingInGroup.length === 1) {
          await api.groupCard(remainingInGroup[0].id, null);
        }
      }
    } catch (err) {
      console.error('Failed to move card column:', err);
    }
  };

  // Handler: Ungroup Individual Card
  const handleUngroupCard = async (cardId) => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard || !targetCard.groupId) return;

    const oldGroupId = targetCard.groupId;

    // Optimistically remove groupId from this card
    setCards((prev) => {
      const remainingInGroup = prev.filter(
        (c) => c.groupId === oldGroupId && c.id !== cardId
      );

      return prev.map((c) => {
        if (c.id === cardId) {
          return { ...c, groupId: null };
        }
        if (remainingInGroup.length === 1 && c.groupId === oldGroupId) {
          return { ...c, groupId: null };
        }
        return c;
      });
    });

    if (onShowToast) onShowToast('Catatan dikeluarkan dari grup');

    try {
      await api.groupCard(cardId, null);
      const remainingInGroup = cards.filter(
        (c) => c.groupId === oldGroupId && c.id !== cardId
      );
      if (remainingInGroup.length === 1) {
        await api.groupCard(remainingInGroup[0].id, null);
      }
    } catch (err) {
      console.error('Failed to ungroup card:', err);
    }
  };

  // Handler: Ungroup All Cards in a Group
  const handleUngroupAll = async (groupId) => {
    const cardsInGroup = cards.filter((c) => c.groupId === groupId);
    if (cardsInGroup.length === 0) return;

    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, groupId: null } : c))
    );

    if (onShowToast) onShowToast('Semua catatan dalam grup telah dipisahkan');

    try {
      await Promise.all(cardsInGroup.map((c) => api.groupCard(c.id, null)));
    } catch (err) {
      console.error('Failed to ungroup all cards:', err);
    }
  };

  // Handler: Rename Group Title
  const handleRenameGroup = async (groupId, newTitle) => {
    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, groupTitle: newTitle } : c))
    );

    if (onShowToast) onShowToast(`Nama grup diubah menjadi "${newTitle || 'Cluster'}"`);

    const groupCards = cards.filter((c) => c.groupId === groupId);
    if (groupCards.length > 0) {
      try {
        await api.groupCard(groupCards[0].id, groupId, newTitle);
      } catch (err) {
        console.error('Failed to rename group:', err);
      }
    }
  };

  // Handler: Convert Card to Action Item
  const handleConvertToActionItem = (card) => {
    setConvertModalCard(card);
  };

  const handleConfirmConvert = async ({ card, assignee, dueDate, status = 'PENDING', description }) => {
    const dueDateDisplay = dueDate
      ? new Date(dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    const optimisticItem = {
      id: `ai_${Date.now()}`,
      cardId: card.id,
      title: card.content || card.text || 'Action Item',
      assignee: assignee || null,
      dueDate,
      dueDateDisplay,
      description: description || '',
      status: status || 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setActionItems((prev) => {
      // Prevent duplicates: replace if card already converted
      const existingIdx = prev.findIndex((ai) => ai.cardId === card.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = optimisticItem;
        return updated;
      }
      return [optimisticItem, ...prev];
    });

    setConvertModalCard(null);
    setActiveTab('action-items');
    if (onShowToast) onShowToast('Kartu berhasil dikonversi menjadi Action Item!');

    try {
      const isRealUuid =
        assignee?.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignee.id);

      const payload = {
        title: card.content || card.text || 'Action Item',
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: status || 'PENDING',
        ...(isRealUuid ? { assigneeId: assignee.id } : {}),
      };

      const res = await api.convertCardToAction(card.id, payload);
      if (res?.actionItem) {
        const formatted = formatActionItem(res.actionItem);
        setActionItems((prev) =>
          prev.map((ai) =>
            ai.cardId === card.id || ai.id === optimisticItem.id ? formatted : ai
          )
        );
      }
    } catch (err) {
      console.error('Gagal konversi ke action item:', err);
    }
  };

  // Handler: Change Action Item Status
  const handleChangeActionItemStatus = async (itemId, newStatus) => {
    setActionItems((prev) =>
      prev.map((ai) => (ai.id === itemId ? { ...ai, status: newStatus } : ai))
    );
    if (onShowToast) onShowToast(`Status diubah menjadi ${newStatus}`);

    try {
      await api.updateActionItem(itemId, { status: newStatus });
    } catch (err) {
      console.error('Gagal update status action item:', err);
    }
  };

  // Handler: Delete Action Item
  const handleDeleteActionItem = (itemId) => {
    setActionItems((prev) => prev.filter((ai) => ai.id !== itemId));
    if (onShowToast) onShowToast('Action item berhasil dihapus');
  };

  // Handler: Move Entire Group Cluster to Another Column
  const handleMoveGroupColumn = async (groupId, targetColumnId) => {
    const groupCards = cards.filter((c) => c.groupId === groupId);
    if (groupCards.length === 0) return;

    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, columnId: targetColumnId } : c))
    );

    const targetColName =
      activeColumns.find((col) => col.id === targetColumnId || col.type === targetColumnId)
        ?.title || targetColumnId.toUpperCase();
    const groupTitle = groupCards[0]?.groupTitle || 'Cluster';
    if (onShowToast)
      onShowToast(`Seluruh grup "${groupTitle}" dipindahkan ke kolom ${targetColName}`);

    try {
      await Promise.all(
        groupCards.map((c) => api.moveCard(c.id, targetColumnId))
      );
    } catch (err) {
      console.error('Failed to move group column:', err);
    }
  };

  const boardTitle = currentBoardTitle || board?.title || board?.name || 'Sprint 16 Retrospective';
  const wsName = workspace?.name || 'Mobile Team';
  const memberCount = members.length > 0 ? members.length : workspace?.memberCount || board?.membersCount || 1;
  const totalMemberCount = memberCount;
  const dateText = board?.dateText || 'Dibuat 30 Jun 2026';

  // Daftar anggota yang ditampilkan (prioritas anggota online, fallback ke member workspace)
  const displayMembers = useMemo(() => {
    if (onlineMembers && onlineMembers.length > 0) {
      return onlineMembers;
    }
    if (members && members.length > 0) {
      return members;
    }
    const myEmail = currentUser?.email || '';
    const myName = currentUser?.name || currentUser?.fullName || (myEmail ? myEmail.split('@')[0] : 'Anda');
    return [
      {
        id: currentUser?.id || 'current_user',
        name: myName,
        email: myEmail,
        avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myEmail || myName}`,
      },
    ];
  }, [onlineMembers, members, currentUser]);

  // Resolve retro columns dynamically based on board template
  const rawTemplate = (board?.template || 'start-stop-continue')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
  const templateCols =
    TEMPLATE_COLUMNS_MAP[rawTemplate] ||
    (rawTemplate.includes('mad') ||
    rawTemplate.includes('sad') ||
    rawTemplate.includes('glad')
      ? TEMPLATE_COLUMNS_MAP['mad-sad-glad']
      : rawTemplate.includes('4l') ||
        rawTemplate.includes('liked') ||
        rawTemplate.includes('learned')
      ? TEMPLATE_COLUMNS_MAP['4ls']
      : rawTemplate.includes('went') ||
        rawTemplate.includes('wrong') ||
        rawTemplate.includes('well')
      ? TEMPLATE_COLUMNS_MAP['went-well-wrong']
      : TEMPLATE_COLUMNS_MAP['start-stop-continue']);

  const columnsSource =
    boardColumns && boardColumns.length > 0
      ? boardColumns
      : board?.columns && board.columns.length > 0
      ? board.columns
      : null;

  const activeColumns =
    columnsSource && columnsSource.length > 0
      ? columnsSource.map((bc, idx) => {
          const matched =
            templateCols.find(
              (tc) =>
                tc?.name?.toLowerCase() === bc?.name?.toLowerCase() ||
                tc?.id?.toLowerCase() === bc?.name?.toLowerCase() ||
                tc?.type?.toLowerCase() === bc?.name?.toLowerCase()
            ) ||
            templateCols[idx % templateCols.length] ||
            {};
          return {
            ...matched,
            id: bc.id,
            dbId: bc.id,
            templateId: matched.id || bc.name?.toLowerCase(),
            name: bc.name || matched.name,
            title: bc.name?.toUpperCase() || matched.title,
            type: matched.type || bc.name?.toLowerCase(),
          };
        })
      : templateCols;

  return (
    <div className="retro-board-full-view">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="retro-full-topbar">
        <div className="retro-full-breadcrumbs">
          <button type="button" className="retro-crumb-btn" onClick={onBack}>
            Workspace Saya
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>
          <button type="button" className="retro-crumb-btn" onClick={onBack}>
            {wsName}
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>

          {workspace?.boards && workspace.boards.length > 1 ? (
            <div
              className="retro-board-switcher-container"
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <button
                type="button"
                className="retro-crumb-active-btn"
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '13px',
                }}
              >
                <span>{boardTitle}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {isBoardDropdownOpen && (
                <div
                  className="retro-board-dropdown-popup"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    boxShadow:
                      '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    padding: '6px',
                    zIndex: 50,
                    minWidth: '220px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}
                  >
                    Pindah Board di {wsName}
                  </div>
                  {(workspace?.boards || []).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setIsBoardDropdownOpen(false);
                        if (onSwitchBoard) onSwitchBoard(b);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: b.id === board?.id ? '#5956e9' : '#334155',
                        fontWeight: b.id === board?.id ? 600 : 400,
                        backgroundColor:
                          b.id === board?.id ? '#f1f5f9' : 'transparent',
                        borderRadius: '6px',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{b.title || b.name}</span>
                      {b.id === board?.id && <Check size={14} color="#5956e9" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="retro-crumb-active">{boardTitle}</span>
          )}
        </div>

        {/* Top right icons (grid, bell, avatar) */}
        <div className="retro-full-topbar-right">
          <button type="button" className="btn-icon-top" title="Tampilan">
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            className="btn-icon-top notification-btn"
            title="Notifikasi"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-badge-dot"></span>
          </button>
          <div className="top-user-avatar-wrapper">
            <img
              src={
                currentUser?.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=user`
              }
              alt={currentUser?.name || 'User'}
              className="top-user-avatar"
            />
          </div>
        </div>
      </div>

      {/* ── Board Header Banner ── */}
      <div className="retro-board-header-banner">
        <div className="retro-board-header-left">
          {/* 4-dot squircle icon */}
          <div
            className="retro-board-icon-box"
            style={{ backgroundColor: '#f3f0ff' }}
          >
            <div className="four-dots-icon" style={{ '--dot-color': '#5956e9' }}>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div className="retro-board-header-info">
            <h1 className="retro-board-header-title">{boardTitle}</h1>
            <div className="retro-board-header-meta">
              <span className="retro-meta-ws">{wsName}</span>
              <span className="retro-meta-sep">·</span>
              <User size={14} className="retro-meta-icon" />
              <span className="retro-meta-members">{memberCount} anggota</span>
              <span className="retro-meta-sep">·</span>
              <Clock size={14} className="retro-meta-icon" />
              <span className="retro-meta-date">{dateText}</span>
              {isReadOnly && (
                <>
                  <span className="retro-meta-sep">·</span>
                  <span className="retro-readonly-badge" title="Mode Baca Saja Aktif">
                    <Eye size={12} />
                    <span>Mode Baca Saja</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="retro-board-header-right">
          {/* Online status indicator badge (Realtime Count) */}
          <div className="retro-online-badge">
            <span className="retro-online-dot"></span>
            <span>{onlineCount} online</span>
          </div>

          {/* Real member avatars stack */}
          <div className="retro-avatars-stack" title={`${onlineCount} anggota online`}>
            {displayMembers.slice(0, 3).map((m, idx) => (
              <img
                key={m.id || idx}
                src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name || m.email || idx}`}
                alt={m.name || 'Member'}
                title={m.name || m.email || 'Member'}
                className="retro-stack-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name || 'user'}`;
                }}
              />
            ))}
            {displayMembers.length > 3 && (
              <div className="retro-stack-more" title={`${displayMembers.length - 3} lainnya`}>
                +{displayMembers.length - 3}
              </div>
            )}
          </div>

          {/* Toggle Read-Only Mode Button */}
          <button
            type="button"
            className={`btn-toggle-readonly ${isReadOnly ? 'active-readonly' : ''}`}
            onClick={handleToggleReadOnly}
            title={isReadOnly ? 'Beralih ke Mode Interaktif (Bisa Edit & Vote)' : 'Beralih ke Mode Baca Saja (Terkunci)'}
          >
            {isReadOnly ? <Edit size={14} /> : <Eye size={14} />}
            <span>{isReadOnly ? 'Mode Edit' : 'Mode Baca'}</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              className="btn-ghost-icon"
              title="Pengaturan board"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <MoreHorizontal size={18} />
            </button>
          )}

          <button
            type="button"
            className="btn-export-board"
            onClick={handleExportPdf}
            disabled={isExporting}
            title="Ekspor hasil retrospective ke file PDF"
          >
            {isExporting ? (
              <Loader2 size={16} className="btn-export-spinner" />
            ) : (
              <FileDown size={16} />
            )}
            <span>{isExporting ? 'Mengekspor...' : 'Export PDF'}</span>
          </button>

          {/* Share Dropdown Button */}
          <div className="retro-share-wrapper" ref={shareMenuRef}>
            <button
              type="button"
              className="btn-share-board"
              onClick={() => setIsShareMenuOpen((prev) => !prev)}
              title="Bagikan URL Board Retro"
            >
              <Share2 size={14} />
              <span>+ Bagikan Board</span>
            </button>

            {isShareMenuOpen && (
              <div className="retro-share-dropdown">
                <div className="retro-share-dropdown-header">
                  <div className="retro-share-title">Bagikan Board Retrospective</div>
                  <div className="retro-share-subtitle">Akses aman hanya untuk anggota workspace ini</div>
                </div>

                <div className="retro-share-options">
                  <button
                    type="button"
                    className="retro-share-option-btn"
                    onClick={() => handleCopyBoardLink(false)}
                  >
                    <div className="retro-share-opt-icon edit-icon">
                      <Link size={15} />
                    </div>
                    <div className="retro-share-opt-content">
                      <div className="retro-share-opt-title">Salin Link Board (Interaktif)</div>
                      <div className="retro-share-opt-desc">Bisa menambah kartu, vote, & berdiskusi</div>
                    </div>
                    <Copy size={13} className="retro-share-copy-indicator" />
                  </button>

                  <button
                    type="button"
                    className="retro-share-option-btn"
                    onClick={() => handleCopyBoardLink(true)}
                  >
                    <div className="retro-share-opt-icon readonly-icon">
                      <Eye size={15} />
                    </div>
                    <div className="retro-share-opt-content">
                      <div className="retro-share-opt-title">Salin Link Mode Baca Saja</div>
                      <div className="retro-share-opt-desc">Hanya melihat kartu tanpa opsi edit atau vote</div>
                    </div>
                    <Copy size={13} className="retro-share-copy-indicator" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs with Realtime Status Badge & Mulai Timer Button ── */}
      <div className="retro-board-tabs">
        <div className="retro-tabs-left">
          {BOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`retro-board-tab-btn ${
                activeTab === tab.id ? 'active' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="retro-tabs-right">
          {!isReadOnly && isFacilitator && (
            <button
              type="button"
              className="retro-icebreaker-btn"
              onClick={() => setIsIcebreakerSelectModalOpen(true)}
              title="Mulai Sesi Icebreaker"
            >
              <Gamepad2 size={16} />
              <span>Icebreaker</span>
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              className={`retro-mode-anonymous-btn ${isMyAnonymous ? 'active' : ''}`}
              onClick={handleToggleMyAnonymous}
              title={
                isMyAnonymous
                  ? 'Mode Anonymous Aktif: Catatan yang Anda buat akan bersifat anonim (Klik untuk nonaktifkan)'
                  : 'Mode Anonymous Nonaktif: Klik untuk mengaktifkan mode anonim untuk Anda'
              }
            >
              {isMyAnonymous ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>Mode Anonymous</span>
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              className={`retro-mulai-timer-btn ${
                timerStatus === 'running' ? 'active-running' : ''
              }`}
              onClick={() => setIsTimerModalOpen(true)}
              title="Atur & Mulai Timer Sesi"
            >
              <AlarmClock size={16} />
              <span>Mulai Timer</span>
            </button>
          )}

          {isReadOnly && (
            <div className="retro-readonly-tabs-hint">
              <Eye size={14} />
              <span>Mode Baca Saja</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Persistent Session Timer Banner (Running / Paused across ALL tabs: Board, Action Items, etc.) ── */}
      {['running', 'paused'].includes(timerStatus) && (
        <div className="retro-session-timer-banner-wrapper" style={{ padding: '20px 28px 0 28px' }}>
          <SessionTimerBanner
            status={timerStatus}
            remainingSeconds={timerRemaining}
            facilitator={timerFacilitator}
            isStarter={
              !timerStartedById ||
              timerStartedById === (currentUser?.id || currentUser?.userId) ||
              (timerFacilitator && (
                timerFacilitator.toLowerCase() === (currentUser?.name || '').toLowerCase() ||
                timerFacilitator.toLowerCase() === (currentUser?.email?.split('@')[0] || '').toLowerCase()
              ))
            }
            onPause={handlePauseTimer}
            onResume={handleResumeTimer}
            onReset={handleResetTimer}
          />
        </div>
      )}

      {/* ── Tab 1: Interactive Board Canvas (Dynamic Template Columns) ── */}
      {activeTab === 'board' && (
        <>
          {/* Action Item Pending dari Sesi Sebelumnya (Awal Sesi Baru) */}
          {previousSessionItems && previousSessionItems.length > 0 && (
            <div className="retro-prev-session-ai-board-wrapper" style={{ padding: '0 28px 16px 28px' }}>
              <PreviousSessionActionItems
                items={previousSessionItems}
                onChangeStatus={handleUpdatePreviousSessionStatus}
              />
            </div>
          )}

          <DndContext sensors={isReadOnly ? [] : sensors} onDragEnd={handleDragEnd}>
          <div className="retro-board-columns-container">
            <div
              className="retro-board-columns-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${activeColumns.length}, minmax(260px, 1fr))`,
                gap: '16px',
              }}
            >
              {activeColumns.map((col) => {
                const colCards = cards
                  .filter(
                    (c) =>
                      c.columnId === col.id ||
                      c.columnId === col.dbId ||
                      c.columnId === col.templateId ||
                      c.columnType === col.id ||
                      c.columnType === col.type ||
                      c.columnType === col.templateId ||
                      c.columnName?.toLowerCase() === col.name?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.id?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.type?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.name?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.templateId?.toLowerCase()
                  )
                  .map((card) => {
                    const votesNum =
                      typeof card.votesCount === 'number'
                        ? card.votesCount
                        : Array.isArray(card.votes)
                        ? card.votes.length
                        : typeof card.votes === 'number'
                        ? card.votes
                        : 0;
                    const isCardPriority = Boolean(
                      card.isPriority ||
                        (votesNum >= 3 && (votesNum === maxVotes || votesNum >= 10))
                    );
                    return {
                      ...card,
                      isPriority: isCardPriority,
                    };
                  });

                return (
                  <RetroColumn
                    key={col.id}
                    column={col}
                    columns={activeColumns}
                    cards={colCards}
                    onAddCard={handleAddCard}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onCopyCard={handleCopyCard}
                    onVoteCard={handleVoteCard}
                    onUngroupCard={handleUngroupCard}
                    onUngroupAll={handleUngroupAll}
                    onRenameGroup={handleRenameGroup}
                    onMoveColumn={handleMoveCardColumn}
                    onMoveGroupColumn={handleMoveGroupColumn}
                    onOpenDetail={(cardToOpen) => setSelectedCardForDetail(cardToOpen)}
                    onConvertToActionItem={handleConvertToActionItem}
                    currentUser={currentUser}
                    isAnonymous={isAnonymous}
                    isFacilitator={isFacilitator}
                    isReadOnly={isReadOnly}
                    actionItems={actionItems}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
        </>
      )}

      {/* ── Tab: Dashboard Summary ── */}
      {activeTab === 'dashboard' && (
        <DashboardSummaryView
          workspace={workspace}
          board={board}
          currentUser={currentUser}
          onShowToast={onShowToast}
          onSwitchBoard={onSwitchBoard}
        />
      )}

      {/* ── Tab 2: Diskusi ── */}
      {activeTab === 'diskusi' && (
        <div className="retro-tab-placeholder">
          <MessageSquare size={40} />
          <h3>Diskusi Tim</h3>
          <p>Fitur diskusi dan komentar sesama anggota workspace akan hadir di sini.</p>
        </div>
      )}

      {/* ── Tab 3: Action Items ── */}
      {activeTab === 'action-items' && (
        <div className="action-items-tab-content">
          {/* Action Item dari Sesi Sebelumnya */}
          <PreviousSessionActionItems
            items={previousSessionItems}
            onChangeStatus={handleUpdatePreviousSessionStatus}
          />
          {/* Action Items Sesi Ini */}
          <ActionItemsTable
            actionItems={actionItems}
            onChangeStatus={handleChangeActionItemStatus}
            onDelete={handleDeleteActionItem}
          />
        </div>
      )}

      {/* ── Tab 4: Aktivitas ── */}
      {activeTab === 'aktivitas' && (
        <div className="retro-tab-placeholder">
          <Activity size={40} />
          <h3>Aktivitas Board</h3>
          <p>Log aktivitas semua anggota di board retrospective ini.</p>
        </div>
      )}

      {/* ── Modal Pengaturan Board & Mode Anonymous ── */}
      <BoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        board={{ ...board, name: currentBoardTitle, title: currentBoardTitle }}
        isAnonymous={isAnonymous}
        onSave={handleSaveBoardSettings}
      />

      {/* ── Modal Detail Catatan & Komentar ── */}
      <CardDetailModal
        isOpen={Boolean(selectedCardForDetail)}
        onClose={() => setSelectedCardForDetail(null)}
        card={selectedCardForDetail}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onVoteCard={handleVoteCard}
        isAnonymous={isAnonymous}
        isFacilitator={isFacilitator}
      />

      {/* ── Modal Atur Timer Sesi ── */}
      <SessionTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        onStartTimer={handleStartTimer}
        initialMinutes={Math.max(1, Math.round((timerTotal || 900) / 60))}
      />

      {/* ── Modal Waktu Sesi Habis! ── */}
      <SessionTimerEndedModal
        isOpen={isTimerEndedModalOpen}
        onClose={() => {
          setIsTimerEndedModalOpen(false);
          setTimerStatus('idle');
        }}
      />
      {/* ── Modal Convert Card to Action Item ── */}
      <ConvertToActionItemModal
        isOpen={Boolean(convertModalCard)}
        onClose={() => setConvertModalCard(null)}
        card={convertModalCard}
        members={members}
        onConfirm={handleConfirmConvert}
      />

      {/* ── Modal Pilihan Icebreaker (Facilitator) ── */}
      <IcebreakerSelectModal
        isOpen={isIcebreakerSelectModalOpen}
        onClose={() => setIsIcebreakerSelectModalOpen(false)}
        onStartGame={handleStartIcebreaker}
      />

      {/* ── Overlay Sesi Icebreaker Aktif / Selesai (Semua Anggota) ── */}
      {activeIcebreaker && (
        <IcebreakerOverlay
          session={activeIcebreaker}
          isFacilitator={isFacilitator}
          currentUser={currentUser}
          totalMembers={totalMemberCount}
          onVote={handleVoteIcebreaker}
          onReveal={handleRevealIcebreaker}
          onSkip={handleSkipIcebreaker}
          onEnd={handleEndIcebreaker}
          onClose={() => setActiveIcebreaker(null)}
        />
      )}
    </div>
  );
}
