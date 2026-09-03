import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MoreHorizontal,
  MessageSquare,
  CheckSquare,
  Activity,
  LayoutGrid,
  ChevronDown,
  Check,
  User,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { useBoardPusher } from '../../hooks/useBoardPusher';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import RetroColumn from './RetroColumn';
import CardDetailModal from '../modals/CardDetailModal';

// Initial default cards for demonstration and fallback matching Sprint 16 Retrospective
const createInitialRetroCards = () => [
  {
    id: 'c_start_1',
    columnId: 'start',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal', email: 'afrizal@gmail.com' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }],
    votesCount: 5,
    commentCount: 5,
    commentsCount: 5,
    comments: [
      {
        id: 'cm_1',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cm_2',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cm_3',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cm_4',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'c_start_2',
    columnId: 'start',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal', email: 'afrizal@gmail.com' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }],
    votesCount: 5,
    commentCount: 5,
    commentsCount: 5,
    comments: [],
  },
  {
    id: 'c_start_3',
    columnId: 'start',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal', email: 'afrizal@gmail.com' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }],
    votesCount: 5,
    commentCount: 5,
    commentsCount: 5,
    comments: [],
  },
  {
    id: 'c_stop_1',
    columnId: 'stop',
    content: 'Testing sering terlambat',
    author: { name: 'Sarah Wijaya', email: 'sarah@gmail.com' },
    authorName: 'Sarah Wijaya',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    time: '10:20 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }, { userId: '6' }, { userId: '7' }, { userId: '8' }],
    votesCount: 8,
    commentCount: 4,
    commentsCount: 4,
    comments: [
      {
        id: 'cm_stop1_1',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cm_stop1_2',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cm_stop1_3',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cm_stop1_4',
        author: { name: 'Budi Santoso' },
        authorName: 'Budi Santoso',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Setuju, perlu dibuat checklist sebelum sprint',
        time: '10:25 AM',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'c_stop_2',
    columnId: 'stop',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal', email: 'afrizal@gmail.com' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }],
    votesCount: 5,
    commentCount: 5,
    commentsCount: 5,
    comments: [],
  },
  {
    id: 'c_continue_1',
    columnId: 'continue',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal', email: 'afrizal@gmail.com' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }],
    votesCount: 5,
    commentCount: 5,
    commentsCount: 5,
    comments: [],
  },
  {
    id: 'c_continue_2',
    columnId: 'continue',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal', email: 'afrizal@gmail.com' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }],
    votesCount: 5,
    commentCount: 5,
    commentsCount: 5,
    comments: [],
  },
  {
    id: 'c_continue_3',
    columnId: 'continue',
    content: 'Mulai melakukan daily meeting setiap pagi',
    author: { name: 'Afrizal', email: 'afrizal@gmail.com' },
    authorName: 'Afrizal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: '10:32 AM',
    createdAt: new Date().toISOString(),
    votes: [{ userId: '1' }, { userId: '2' }, { userId: '3' }, { userId: '4' }, { userId: '5' }],
    votesCount: 5,
    commentCount: 5,
    commentsCount: 5,
    comments: [],
  },
];

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
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('board');
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [cards, setCards] = useState(() => createInitialRetroCards());
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
  const [members, setMembers] = useState([]);

  const boardId = board?.id;

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
      if (Array.isArray(cardsData) && cardsData.length > 0) {
        setCards(cardsData);
      } else {
        setCards(createInitialRetroCards());
      }
    } catch {
      // Keep existing cards
    }
  }, [boardId]);

  useEffect(() => {
    loadCardsFromApi();
  }, [loadCardsFromApi]);

  // Hook Pusher Channels Realtime & Presence
  const { connectionStatus, onlineMembers, onlineCount } = useBoardPusher(boardId, currentUser, {
    onCardCreated: (newCard) => {
      setCards((prev) => {
        // Jika sudah ada (berdasarkan id yang sama), jangan duplikasi
        if (prev.some((c) => c.id === newCard.id)) return prev;

        // Jika ada temporary optimistic card dengan konten & kolom yang sama, replace
        const optIndex = prev.findIndex(
          (c) =>
            typeof c.id === 'string' &&
            c.id.startsWith('card_') &&
            c.columnId === newCard.columnId &&
            c.content === newCard.content
        );

        if (optIndex !== -1) {
          const next = [...prev];
          next[optIndex] = newCard;
          return next;
        }

        return [...prev, newCard];
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
  });

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

  // Handler: Share Board Link
  const handleShare = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);
    if (onShowToast) onShowToast('Link board berhasil disalin!');
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
      authorName,
      avatar: defaultAvatar,
      time: formattedTime,
      createdAt: now.toISOString(),
      votes: [],
      votesCount: 0,
      votedBy: [],
      hasVoted: false,
    };

    setCards((prev) => [...prev, newCard]);
    if (onShowToast) onShowToast('Catatan berhasil ditambahkan!');

    // Async sync with API
    try {
      const res = await api.createCard(boardId, columnId, text);
      if (res?.card) {
        setCards((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, ...res.card } : c))
        );
      }
    } catch {
      // Local state already updated
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

  const boardTitle = board?.title || board?.name || 'Sprint 16 Retrospective';
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
  const activeColumns =
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
                  {workspace.boards.map((b) => (
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

          <button type="button" className="btn-ghost-icon" title="Opsi board">
            <MoreHorizontal size={18} />
          </button>
          <button
            type="button"
            className="btn-share-board"
            onClick={handleShare}
          >
            + Bagikan Board
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs with Realtime Status Badge ── */}
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

        <div
          className={`retro-realtime-badge ${
            connectionStatus === 'connected' ? '' : connectionStatus
          }`}
        >
          <span
            className={`retro-realtime-dot ${
              connectionStatus === 'connected' ? '' : connectionStatus
            }`}
          ></span>
          <span>
            {connectionStatus === 'connected'
              ? 'Terhubung secara real-time'
              : connectionStatus === 'connecting'
              ? 'Menghubungkan...'
              : 'Offline (Polling)'}
          </span>
        </div>
      </div>

      {/* ── Tab 1: Interactive Board Canvas (Dynamic Template Columns) ── */}
      {activeTab === 'board' && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                      c.columnId?.toLowerCase() === col.id?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.type?.toLowerCase()
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
                    currentUser={currentUser}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
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
        <div className="retro-tab-placeholder">
          <CheckSquare size={40} />
          <h3>Action Items</h3>
          <p>Daftar rencana tindakan perbaikan yang disepakati bersama tim.</p>
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
      />
    </div>
  );
}
