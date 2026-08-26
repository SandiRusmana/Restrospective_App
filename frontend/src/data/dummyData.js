export const currentUser = {
  name: "Afrizal",
  fullName: "Afrizal (Anda)",
  email: "afrizal@gmail.com",
  role: "Owner",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  isOnline: true
};

export const initialWorkspaces = [
  {
    id: "ws_01H8J2KX6PYZQ4M5N2R7D3E1F",
    name: "Mobile Team",
    initial: "M",
    color: "#5b52f9",
    role: "Owner",
    description: "Tim pengembangan aplikasi mobile",
    longDescription: "Workspace untuk tim pengembangan aplikasi mobile. Semua retrospective dan diskusi tim dilakukan di sini",
    memberCount: 8,
    dateText: "Dibuat 12 Mei 2024",
    isRecent: true,
    members: [
      {
        id: "m1",
        name: "Afrizal (Anda)",
        role: "Owner",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      },
      {
        id: "m2",
        name: "Sarah Wijaya",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        isOnline: false
      },
      {
        id: "m3",
        name: "Budi Santoso",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        isOnline: false
      },
      {
        id: "m4",
        name: "Dewi Lestari",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        isOnline: false
      }
    ],
    recentBoards: [
      {
        id: "b1",
        title: "Sprint 15 Retrospective",
        updatedAt: "Diperbarui 20 Jun 2024",
        iconType: "doc"
      },
      {
        id: "b2",
        title: "Sprint 14 Retrospective",
        updatedAt: "Diperbarui 6 Jun 2024",
        iconType: "doc"
      },
      {
        id: "b3",
        title: "Quarter 2 Review",
        updatedAt: "Diperbarui 30 Mei 2024",
        iconType: "check-doc"
      }
    ]
  },
  {
    id: "ws_02W3K9LZ8QAZB7P1M4N5K6L7W",
    name: "Web Team",
    initial: "W",
    color: "#2563eb",
    role: "Owner",
    description: "Tim pengembangan aplikasi web",
    longDescription: "Workspace untuk tim engineering web frontend & backend. Sesi retro dan post-mortem rilis mingguan.",
    memberCount: 6,
    dateText: "Dibuat 10 Mei 2024",
    isRecent: true,
    members: [
      {
        id: "m1",
        name: "Afrizal (Anda)",
        role: "Owner",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      },
      {
        id: "m5",
        name: "Rian Prasetya",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      },
      {
        id: "m6",
        name: "Nadia Putri",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
        isOnline: false
      }
    ],
    recentBoards: [
      {
        id: "b4",
        title: "Web Release v2.4 Retro",
        updatedAt: "Diperbarui 18 Jun 2024",
        iconType: "doc"
      },
      {
        id: "b5",
        title: "Design System Migration",
        updatedAt: "Diperbarui 5 Jun 2024",
        iconType: "check-doc"
      }
    ]
  },
  {
    id: "ws_03Q7M1KX9PYXB8R2N3M4K5L8Q",
    name: "QA Squad",
    initial: "Q",
    color: "#10b981",
    role: "Member",
    description: "Quality Assurance Team",
    longDescription: "Quality Assurance Squad untuk retro otomasi testing, penanganan regression bugs, dan peningkatan kualitas rilis.",
    memberCount: 5,
    dateText: "Diikuti 5 Jun 2024",
    isRecent: true,
    members: [
      {
        id: "m7",
        name: "Fajar Nugraha",
        role: "Owner",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      },
      {
        id: "m1",
        name: "Afrizal (Anda)",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      },
      {
        id: "m8",
        name: "Lisa Amelia",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        isOnline: false
      }
    ],
    recentBoards: [
      {
        id: "b6",
        title: "Automation Sprint Retro",
        updatedAt: "Diperbarui 12 Jun 2024",
        iconType: "doc"
      },
      {
        id: "b7",
        title: "E2E Test Stability Review",
        updatedAt: "Diperbarui 1 Jun 2024",
        iconType: "doc"
      }
    ]
  },
  {
    id: "ws_04D5N2LX7QZYA9S3M2N1K4L9D",
    name: "Design Team",
    initial: "D",
    color: "#f97316",
    role: "Member",
    description: "UI/UX Design Team",
    longDescription: "Workspace tim UI/UX Design untuk evaluasi flow, usability testing review, dan kolaborasi design sprint.",
    memberCount: 4,
    dateText: "Diikuti 3 Jun 2024",
    isRecent: false,
    members: [
      {
        id: "m9",
        name: "Jessica Tan",
        role: "Owner",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isOnline: false
      },
      {
        id: "m1",
        name: "Afrizal (Anda)",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      }
    ],
    recentBoards: [
      {
        id: "b8",
        title: "Design Sprint: Checkout Revamp",
        updatedAt: "Diperbarui 8 Jun 2024",
        iconType: "doc"
      }
    ]
  },
  {
    id: "ws_05S8M3KX6PYZC0T4M1N0K3L0S",
    name: "Scrum Masters",
    initial: "S",
    color: "#ec4899",
    role: "Member",
    description: "Scrum Master Community",
    longDescription: "Komunitas Scrum Master untuk standardisasi sprint review, agile metrics, dan continuous improvement lintas squad.",
    memberCount: 12,
    dateText: "Diikuti 1 Jun 2024",
    isRecent: false,
    members: [
      {
        id: "m10",
        name: "Arif Kurniawan",
        role: "Owner",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      },
      {
        id: "m1",
        name: "Afrizal (Anda)",
        role: "Member",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isOnline: true
      }
    ],
    recentBoards: [
      {
        id: "b9",
        title: "Agile Maturity Assessment",
        updatedAt: "Diperbarui 15 Jun 2024",
        iconType: "check-doc"
      }
    ]
  }
];

export const sidebarNavItems = [
  { id: "workspace", label: "Workspace", icon: "LayoutGrid", active: true },
  { id: "my-boards", label: "My Boards", icon: "Kanban", active: false },
  { id: "activity", label: "Activity", icon: "Clock", active: false },
  { id: "templates", label: "Templates", icon: "FileText", active: false },
  { id: "settings", label: "Settings", icon: "Settings", active: false }
];
