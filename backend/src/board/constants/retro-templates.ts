export interface RetroColumn {
  name: string;
  order: number;
  description?: string;
}

export interface RetroTemplate {
  id: string;
  name: string;
  description: string;
  columns: RetroColumn[];
}

export const RETRO_TEMPLATES: Record<string, RetroTemplate> = {
  'start-stop-continue': {
    id: 'start-stop-continue',
    name: 'Start, Stop, Continue',
    description: 'Format klasik untuk mengidentifikasi ide baru, kebiasaan buruk yang harus dihentikan, dan hal baik yang perlu dilanjutkan.',
    columns: [
      { name: 'Start', order: 1, description: 'Hal baru yang harus mulai dilakukan' },
      { name: 'Stop', order: 2, description: 'Hal yang tidak efektif dan harus dihentikan' },
      { name: 'Continue', order: 3, description: 'Hal yang berjalan baik dan harus dilanjutkan' },
    ],
  },
  'mad-sad-glad': {
    id: 'mad-sad-glad',
    name: 'Mad, Sad, Glad',
    description: 'Format berfokus pada emosi tim untuk mengevaluasi pengalaman kerja selama sprint.',
    columns: [
      { name: 'Mad', order: 1, description: 'Hal yang membuat frustrasi atau menghambat tim' },
      { name: 'Sad', order: 2, description: 'Hal yang mengecewakan atau kurang memuaskan' },
      { name: 'Glad', order: 3, description: 'Hal yang membuat tim senang dan bangga' },
    ],
  },
  '4ls': {
    id: '4ls',
    name: '4Ls (Liked, Learned, Lacked, Longed For)',
    description: 'Format komprehensif untuk mengeksplorasi pembelajaran dan harapan tim di masa depan.',
    columns: [
      { name: 'Liked', order: 1, description: 'Hal yang disukai selama sesi/sprint' },
      { name: 'Learned', order: 2, description: 'Pelajaran atau insight baru yang didapatkan' },
      { name: 'Lacked', order: 3, description: 'Hal yang dirasa kurang atau dibutuhkan' },
      { name: 'Longed For', order: 4, description: 'Harapan atau keinginan untuk sprint berikutnya' },
    ],
  },
  'went-well-wrong': {
    id: 'went-well-wrong',
    name: 'Went Well / Went Wrong',
    description: 'Format ringkas yang langsung menghubungkan evaluasi sprint dengan Action Items konkret.',
    columns: [
      { name: 'What Went Well', order: 1, description: 'Pencapaian dan hal positif selama sprint' },
      { name: 'What Went Wrong', order: 2, description: 'Kendala teknis, komunikasi, atau hambatan kerja' },
      { name: 'Action Items', order: 3, description: 'Langkah konkret yang harus dieksekusi' },
    ],
  },
  sailboat: {
    id: 'sailboat',
    name: 'Sailboat Retrospective',
    description: 'Menggunakan metafora kapal layar untuk memetakan dorongan angin, jangkar penahan, dan karang ancaman.',
    columns: [
      { name: 'Wind (Angin)', order: 1, description: 'Faktor pendorong yang mempercepat laju tim' },
      { name: 'Anchor (Jangkar)', order: 2, description: 'Beban atau proses lambat yang menahan tim' },
      { name: 'Rocks (Karang)', order: 3, description: 'Risiko atau bahaya tersembunyi di depan' },
      { name: 'Island (Pulau)', order: 4, description: 'Tujuan akhir dan visi sprint yang ingin dicapai' },
    ],
  },
  starfish: {
    id: 'starfish',
    name: 'Starfish Retrospective',
    description: 'Memberikan 5 level penyesuaian porsi kerja tim: Mempertahankan, Menghentikan, Memulai, Menambah, dan Mengurangi.',
    columns: [
      { name: 'Keep Doing', order: 1, description: 'Kebiasaan baik yang wajib dipertahankan' },
      { name: 'Less Of', order: 2, description: 'Aktivitas yang perlu dikurangi porsinya' },
      { name: 'More Of', order: 3, description: 'Hal bermanfaat yang perlu diperbanyak' },
      { name: 'Stop Doing', order: 4, description: 'Hal yang tidak membawa hasil dan harus dihentikan' },
      { name: 'Start Doing', order: 5, description: 'Inisiatif baru yang perlu segera dieksekusi' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom (Bebas / Tanpa Template)',
    description: 'Tentukan dan buat nama kolom sesuai keinginan dan alur tim Anda secara bebas.',
    columns: [
      { name: 'Kolom 1', order: 1 },
      { name: 'Kolom 2', order: 2 },
    ],
  },
};

/**
 * Mengambil daftar kolom untuk template tertentu
 */
export function getTemplateColumns(templateId: string): RetroColumn[] {
  const template = RETRO_TEMPLATES[templateId] || RETRO_TEMPLATES['start-stop-continue'];
  return template.columns;
}

/**
 * Mengambil semua template yang tersedia
 */
export function getAllTemplates(): RetroTemplate[] {
  return Object.values(RETRO_TEMPLATES);
}
