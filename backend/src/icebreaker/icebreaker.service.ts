import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';

export type IcebreakerGameType =
  | 'fakta-hoaks'
  | 'tebak-lagu'
  | 'tebak-film'
  | 'would-you-rather'
  | 'tebakan-receh';

export interface IcebreakerSession {
  boardId: string;
  gameType: IcebreakerGameType;
  title: string;
  question: string;
  options: Array<{
    id: string;
    emoji?: string;
    label: string;
    description?: string;
  }>;
  correctOptionId?: string;
  explanation?: string;
  isRevealed?: boolean;
  roundNumber?: number;
  totalQuestions?: number;
  startedById: string;
  startedByName: string;
  startedAt: string;
  votes: Record<
    string,
    {
      userId: string;
      userName: string;
      avatarUrl?: string;
      optionId: string;
    }
  >;
  status: 'active' | 'ended';
  currentQuestionIndex?: number;
}

// 1. Fakta atau Hoaks?
const FAKTA_HOAKS_SETS = [
  {
    question:
      'Bug komputer pertama di dunia pada tahun 1947 adalah seekor serangga ngengat asli yang tersangkut di mesin komputer?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Grace Hopper dan timnya di Harvard menemukan ngengat asli yang terjepit di relay komputer Harvard Mark II, dan menempelkannya di logbook dengan catatan legendaris "First actual case of bug being found".',
  },
  {
    question:
      'Nama teknologi nirkabel "Bluetooth" diambil dari nama Raja Viking Harald Bluetooth yang gemar makan buah blueberry?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Jim Kardach mengusulkan nama Harald Bluetooth, raja yang menyatukan suku-suku Skandinavia, sebagaimana teknologi ini menyatukan berbagai perangkat elektronik.',
  },
  {
    question:
      'Domain website komersial pertama yang pernah didaftarkan di internet adalah www.google.com?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Domain komersial pertama di internet adalah symbolics.com yang didaftarkan pada 15 Maret 1985. Google baru didaftarkan tahun 1997.',
  },
  {
    question:
      'Susunan keyboard QWERTY awalnya dirancang untuk memisahkan huruf yang sering berdampingan agar tuas mekanik mesin tik tidak macet?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Christopher Sholes merancang tata letak QWERTY pada tahun 1870-an agar juru ketik tidak menekan tuts yang bersebelahan secara bersamaan sehingga mesin tik mekanik tidak gampang tersangkut.',
  },
  {
    question:
      'Nama awal mesin pencari Google saat masih berupa proyek riset mahasiswa di Stanford adalah "Backrub"?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Larry Page dan Sergey Brin awalnya menamakannya Backrub karena algoritma intinya menganalisis "backlinks" dari halaman web lain.',
  },
  {
    question:
      'Manusia normalnya hanya menggunakan 10% dari kapasitas seluruh otaknya sepanjang hidup?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Ini adalah mitos populer. Pemindaian otak modern (fMRI) membuktikan bahwa hampir 100% bagian otak aktif dan memiliki fungsi spesifik, bahkan saat kita sedang tidur lelap.',
  },
  {
    question:
      'Secara klasifikasi botani ilmiah, buah pisang sebenarnya termasuk dalam kategori buah beri (berry)?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Secara ilmu botani, berry adalah buah berdaging yang berasal dari bunga dengan satu ovarium. Pisang memenuhi syarat ini, sedangkan buah stroberi justru bukan berry sejati!',
  },
  {
    question:
      'Tembok Besar China dapat dilihat dengan mata telanjang manusia langsung dari permukaan Bulan?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Para astronaut NASA mengonfirmasi bahwa Tembok Besar China terlalu tipis dan warnanya menyerupai tanah sekitarnya, sehingga mustahil dilihat dengan mata telanjang dari orbit rendah bumi apalagi dari Bulan.',
  },
  {
    question:
      'Madu murni alami adalah makanan yang tidak pernah basi bahkan setelah disimpan ribuan tahun?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Karena kadar airnya yang sangat rendah dan tingkat keasaman alaminya, bakteri tidak dapat bertahan hidup di dalam madu. Arkeolog bahkan menemukan pot madu berumur 3.000 tahun di makam Firaun Mesir yang masih layak dimakan!',
  },
  {
    question:
      'Memori ingatan seekor ikan mas koki (goldfish) hanya bertahan selama 3 detik saja?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Berbagai penelitian membuktikan ingatan ikan mas koki bisa bertahan hingga 5 bulan. Mereka bahkan bisa mengenali wajah pemiliknya dan dilatih memencet tuas makanan.',
  },
  {
    question:
      'Kucing memiliki lebih dari 30 otot pada masing-masing daun telinganya sehingga bisa berputar hingga 180 derajat?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Kucing memiliki 32 otot di setiap telinganya yang memungkinkan mereka mengarahkan pendengaran ke dua arah berbeda secara independen untuk mendeteksi mangsa.',
  },
  {
    question:
      'Menelan permen karet akan membuatnya tertinggal dan menempel di dinding lambung selama 7 tahun?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Meskipun bahan karet sintetisnya tidak bisa dicerna oleh asam lambung, sistem pencernaan manusia tetap mendorongnya keluar lewat kotoran dalam waktu 1 hingga 3 hari.',
  },
  {
    question:
      'Logo Apple digigit dibuat untuk mengenang Alan Turing yang meninggal akibat memakan apel beracun?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Rob Janoff sang desainer logo Apple menjelaskan bahwa gigitan (bite) dibuat murni untuk skala, agar orang tidak mengira siluet logo itu adalah buah ceri atau tomat kecil.',
  },
  {
    question:
      'Perusahaan game Nintendo pertama kali didirikan pada tahun 1889 sebagai produsen kartu remi tradisional Jepang?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Fusajiro Yamauchi mendirikan Nintendo Koppai di Kyoto pada 23 September 1889 untuk membuat kartu permainan buatan tangan bernama Hanafuda jauh sebelum memproduksi video game.',
  },
  {
    question:
      'Tinggi Menara Eiffel di Paris bisa bertambah sekitar 15 cm lebih tinggi saat puncak musim panas?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Besi puddle pada struktur Menara Eiffel mengalami pemuaian termal akibat panas matahari terik, membuat ujung puncaknya meninggi hingga 15 cm dibandingkan saat musim dingin.',
  },
  {
    question:
      'Spesies hiu sudah berenang di samudera bumi jauh sebelum pohon pertama tumbuh di daratan?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Bukti fosil menunjukkan hiu purba sudah ada sejak sekitar 400-450 juta tahun yang lalu, sedangkan pohon pertama di daratan bumi baru berevolusi sekitar 350 juta tahun yang lalu.',
  },
  {
    question:
      'Istilah darah biru bangsawan berasal dari kenyataan bahwa darah aristokrat Eropa mengandung zat tembaga?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Semua manusia berdarah merah berbasis zat besi (hemoglobin). Istilah "sangre azul" muncul di Spanyol karena kulit bangsawan yang pucat membuat pembuluh darah vena birunya terlihat jelas dibanding kaum pekerja luar ruangan.',
  },
  {
    question:
      'Kecoak bisa tetap bertahan hidup selama berminggu-minggu meskipun kepalanya sudah terputus?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Kecoak bernapas melalui lubang spirakel di setiap ruas tubuhnya dan sistem peredaran darahnya terbuka, sehingga mereka baru mati setelah beberapa minggu murni karena dehidrasi (tidak bisa minum).',
  },
  {
    question:
      'Kaca jendela pada bangunan gereja kuno lebih tebal di bagian bawah karena kaca adalah cairan kental yang mengalir sangat lambat?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Kaca adalah padatan amorf. Ketebalan kaca kuno yang tidak rata murni disebabkan teknik pembuatan kaca tiup abad pertengahan yang belum sempurna, dan tukang memasangnya dengan bagian yang lebih berat di sisi bawah.',
  },
  {
    question:
      'Hewan gurita memiliki 3 buah jantung dan darahnya berwarna biru alami?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Dua jantung memompa darah ke insang, sementara satu jantung memompa ke seluruh tubuh. Darahnya berwarna biru karena mengandung hemosianin berbasis tembaga untuk mengikat oksigen di air laut dingin.',
  },
  {
    question:
      'Minum air es dingin setelah makan berminyak dapat membekukan lemak di dalam lambung dan memicu serangan jantung?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Lambung manusia memiliki suhu inti konstan sekitar 37°C. Makanan dan minuman apapun yang masuk akan segera disesuaikan ke suhu tubuh sebelum dicerna oleh enzim pencernaan.',
  },
  {
    question:
      'Semua spesies penguin di alam liar hanya hidup di belahan bumi selatan dan tidak ada yang hidup alami di Kutub Utara?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Semua penguin liar hidup di belahan bumi selatan (Antartika, Amerika Selatan, Afrika Selatan, Australia, Galapagos). Di Kutub Utara yang ada adalah beruang kutub!',
  },
  {
    question:
      'Petir petir kilat tidak akan pernah menyambar tempat yang sama lebih dari satu kali?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'hoaks',
    explanation:
      'Hoaks! Petir justru sangat sering menyambar tempat yang sama berkali-kali. Gedung Empire State di New York bahkan disambar petir rata-rata 25 hingga 100 kali setiap tahunnya!',
  },
  {
    question:
      'Pemberian warna wortel menjadi dominan oranye seperti sekarang awalnya dipopulerkan oleh petani Belanda pada abad ke-16?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Sebelum abad ke-16, wortel umumnya berwarna ungu, putih, atau kuning. Petani Belanda membudidayakan mutan wortel oranye manis sebagai penghormatan kepada bangsawan William of Orange.',
  },
  {
    question:
      'Kombinasi tombol "Atas, Atas, Bawah, Bawah, Kiri, Kanan, Kiri, Kanan, B, A" adalah Konami Code paling terkenal di sejarah video game?',
    options: [
      { id: 'fakta', emoji: '🟢', label: 'FAKTA' },
      { id: 'hoaks', emoji: '🔴', label: 'HOAKS' },
    ],
    correctOptionId: 'fakta',
    explanation:
      'Fakta! Kazuhisa Hashimoto menciptakan kode ini pada tahun 1986 saat menguji game Gradius di NES karena game tersebut terlalu sulit untuk diselesaikan tanpa jalan pintas 30 nyawa.',
  },
];

// 2. Tebak Lagu dan Artis (Koleksi Lengkap Musisi Seluruh Indonesia & Mancanegara)
const TEBAK_LAGU_SETS = [
  {
    question:
      '🎶 "Dan bila esok datang kembali, seperti sedia kala di mana kau bisa bercanda..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Kangen - Dewa 19' },
      { id: 'b', emoji: '🎵', label: 'Dan... - Sheila On 7' },
      { id: 'c', emoji: '🎵', label: 'Berharap Tak Berpisah - Reza Artamevia' },
      { id: 'd', emoji: '🎵', label: 'Salah - Potret' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu hits legendaris "Dan..." dari Sheila On 7 (album debut 1999) karya Eross Candra.',
  },
  {
    question:
      '🎶 "Lights will guide you home, and ignite your bones, and I will try to fix you..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Chasing Cars - Snow Patrol' },
      { id: 'b', emoji: '🎵', label: 'Fix You - Coldplay' },
      { id: 'c', emoji: '🎵', label: 'Somewhere Only We Know - Keane' },
      { id: 'd', emoji: '🎵', label: 'Stop and Stare - OneRepublic' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu anthemic "Fix You" dari album X&Y Coldplay (2005) karya Chris Martin.',
  },
  {
    question:
      '🎶 "Untungnya, bumi masih berputar... Untungnya, ku tak pilih menyerah..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Untungnya, Bumi Masih Berputar - Bernadya' },
      { id: 'b', emoji: '🎵', label: 'Rayuan Perempuan Gila - Nadin Amizah' },
      { id: 'c', emoji: '🎵', label: 'Tak Segampang Itu - Anggi Marito' },
      { id: 'd', emoji: '🎵', label: 'Jiwa Yang Bersedih - Ghea Indrawari' },
    ],
    correctOptionId: 'a',
    explanation:
      'Lagu viral "Untungnya, Bumi Masih Berputar" dari Bernadya yang sukses memuncaki Spotify Indonesia.',
  },
  {
    question:
      '🎶 "Is this the real life? Is this just fantasy? Caught in a landslide, no escape from reality..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Stairway to Heaven - Led Zeppelin' },
      { id: 'b', emoji: '🎵', label: 'Hotel California - Eagles' },
      { id: 'c', emoji: '🎵', label: 'Bohemian Rhapsody - Queen' },
      { id: 'd', emoji: '🎵', label: 'Dream On - Aerosmith' },
    ],
    correctOptionId: 'c',
    explanation:
      'Mahakarya rock opera abadi "Bohemian Rhapsody" oleh Freddie Mercury & Queen yang dirilis tahun 1975.',
  },
  {
    question:
      '🎶 "Kita bikin romantis, bikin paling romantis... Sambil bermain mata, turun ke hati..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Kita Bikin Romantis - Maliq & D\'Essentials' },
      { id: 'b', emoji: '🎵', label: 'Dekat di Hati - RAN' },
      { id: 'c', emoji: '🎵', label: 'Bersepeda - HIVI!' },
      { id: 'd', emoji: '🎵', label: 'Kesempurnaan Cinta - Rizky Febian' },
    ],
    correctOptionId: 'a',
    explanation:
      '"Kita Bikin Romantis" dari Maliq & D\'Essentials dengan aransemen jazzy pop yang manis dan viral.',
  },
  {
    question:
      '🎶 "I should have bought you flowers and held your hand... Should have gave you all my hours when I had the chance..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'All of Me - John Legend' },
      { id: 'b', emoji: '🎵', label: 'Say You Won\'t Let Go - James Arthur' },
      { id: 'c', emoji: '🎵', label: 'Stay With Me - Sam Smith' },
      { id: 'd', emoji: '🎵', label: 'When I Was Your Man - Bruno Mars' },
    ],
    correctOptionId: 'd',
    explanation:
      'Balada piano emosional "When I Was Your Man" oleh Bruno Mars dari album Unorthodox Jukebox (2012).',
  },
  {
    question:
      '🎶 "Ku rangkul semua kenangan, saat bersamamu... Mengharap kau kan kembali..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Sephia - Sheila On 7' },
      { id: 'b', emoji: '🎵', label: 'Kangen - Dewa 19' },
      { id: 'c', emoji: '🎵', label: 'Rahasia Hati - Element' },
      { id: 'd', emoji: '🎵', label: 'Menghapus Jejakmu - Peterpan' },
    ],
    correctOptionId: 'b',
    explanation:
      'Single debut monumental "Kangen" ciptaan Ahmad Dhani yang melambungkan nama Dewa 19.',
  },
  {
    question:
      '🎶 "Cause baby, now we got bad blood, you know it used to be mad love..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Roar - Katy Perry' },
      { id: 'b', emoji: '🎵', label: 'Bad Blood - Taylor Swift' },
      { id: 'c', emoji: '🎵', label: 'Thank U, Next - Ariana Grande' },
      { id: 'd', emoji: '🎵', label: 'Good 4 U - Olivia Rodrigo' },
    ],
    correctOptionId: 'b',
    explanation:
      '"Bad Blood" oleh Taylor Swift dari album mega hits "1989" yang memenangkan penghargaan Grammy Award.',
  },
  {
    question:
      '🎶 "Mungkin suatu saat nanti, kau temukan bahagia meski tak bersamaku..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Hati-Hati di Jalan - Tulus' },
      { id: 'b', emoji: '🎵', label: 'Komang - Raim Laode' },
      { id: 'c', emoji: '🎵', label: 'Sial - Mahalini' },
      { id: 'd', emoji: '🎵', label: 'Rumah Singgah - Fabio Asher' },
    ],
    correctOptionId: 'a',
    explanation:
      '"Hati-Hati di Jalan" karya Tulus dari album "Manusia" yang memecahkan rekor streaming di Indonesia.',
  },
  {
    question:
      '🎶 "And so Sally can wait, she knows it\'s too late as we\'re walking on by..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Bitter Sweet Symphony - The Verve' },
      { id: 'b', emoji: '🎵', label: 'Common People - Pulp' },
      { id: 'c', emoji: '🎵', label: 'Don\'t Look Back In Anger - Oasis' },
      { id: 'd', emoji: '🎵', label: 'Country House - Blur' },
    ],
    correctOptionId: 'c',
    explanation:
      'Lagu kebangsaan britpop "Don\'t Look Back In Anger" oleh Oasis karya Noel Gallagher (1995).',
  },
  {
    question:
      '🎶 "Masalah yang mengeruh, perasaan yang rapuh... Berdoalah, kau bukan superhero..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Rehat - Kunto Aji' },
      { id: 'b', emoji: '🎵', label: 'Zona Nyaman - Fourtwnty' },
      { id: 'c', emoji: '🎵', label: 'Runtuh - Feby Putri' },
      { id: 'd', emoji: '🎵', label: 'Evaluasi - Hindia' },
    ],
    correctOptionId: 'd',
    explanation:
      '"Evaluasi" oleh Baskara Putra (Hindia) dari album "Menari dengan Bayangan", lagu penyemangat saat lelah.',
  },
  {
    question:
      '🎶 "Never mind, I\'ll find someone like you... I wish nothing but the best for you, too..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Someone Like You - Adele' },
      { id: 'b', emoji: '🎵', label: 'Drivers License - Olivia Rodrigo' },
      { id: 'c', emoji: '🎵', label: 'Back to Black - Amy Winehouse' },
      { id: 'd', emoji: '🎵', label: 'Because of You - Kelly Clarkson' },
    ],
    correctOptionId: 'a',
    explanation:
      'Balada patah hati abadi "Someone Like You" oleh Adele dari album "21" yang mengguncang dunia.',
  },
  {
    question:
      '🎶 "Kini tiba saatnya kita harus berpisah... Menyambut hari esok yang penuh misteri..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Kenangan Manis - Pamungkas' },
      { id: 'b', emoji: '🎵', label: 'Mungkin Nanti - Peterpan / NOAH' },
      { id: 'c', emoji: '🎵', label: 'Selamat Jalan Kekasih - Chrisye' },
      { id: 'd', emoji: '🎵', label: 'Ruang Rindu - Letto' },
    ],
    correctOptionId: 'b',
    explanation:
      '"Mungkin Nanti" dari album fenomenal Bintang di Surga (2004) karya Ariel Peterpan (NOAH).',
  },
  {
    question:
      '🎶 "Baby, I\'m dancing in the dark with you between my arms, barefoot on the grass, listening to our favorite song..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Until I Found You - Stephen Sanchez' },
      { id: 'b', emoji: '🎵', label: 'Memories - Maroon 5' },
      { id: 'c', emoji: '🎵', label: 'Perfect - Ed Sheeran' },
      { id: 'd', emoji: '🎵', label: 'Golden Hour - Jvke' },
    ],
    correctOptionId: 'c',
    explanation:
      '"Perfect" oleh Ed Sheeran dari album "÷" (Divide) yang menjadi lagu pengiring cinta terpopuler.',
  },
  {
    question:
      '🎶 "Kala cinta menggoda, ku tak berdaya... Kau bisikkan kata manja, kau peluk diriku..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Kala Cinta Menggoda - Chrisye' },
      { id: 'b', emoji: '🎵', label: 'Inikah Cinta - M.E Voices' },
      { id: 'c', emoji: '🎵', label: 'Salah - Potret' },
      { id: 'd', emoji: '🎵', label: 'Cantik - Kahitna' },
    ],
    correctOptionId: 'a',
    explanation:
      'Lagu legendaris "Kala Cinta Menggoda" ciptaan Guruh Soekarnoputra yang dinyanyikan oleh Chrisye (1997).',
  },
  {
    question:
      '🎶 "Billie Jean is not my lover, she\'s just a girl who claims that I am the one..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Superstition - Stevie Wonder' },
      { id: 'b', emoji: '🎵', label: 'Billie Jean - Michael Jackson' },
      { id: 'c', emoji: '🎵', label: 'Stayin\' Alive - Bee Gees' },
      { id: 'd', emoji: '🎵', label: 'September - Earth, Wind & Fire' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu dansa bersejarah "Billie Jean" oleh Michael Jackson dengan ciri khas moonwalk dan bassline ikonik.',
  },
  {
    question:
      '🎶 "Take me home to the night we met... Cause I\'ve been thinking about you, but I\'m getting too close to the bone..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Melawan Restu - Mahalini' },
      { id: 'b', emoji: '🎵', label: 'Secukupnya - Hindia' },
      { id: 'c', emoji: '🎵', label: 'To the Bone - Pamungkas' },
      { id: 'd', emoji: '🎵', label: 'Bertaut - Nadin Amizah' },
    ],
    correctOptionId: 'c',
    explanation:
      '"To the Bone" oleh Pamungkas yang memecahkan rekor lagu lokal terlama di chart Top 50 Spotify Indonesia.',
  },
  {
    question:
      '🎶 "Sugar, yes please, won\'t you come and put it down on me... I\'m right here, cause I need little love and little sympathy..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Cake By The Ocean - DNCE' },
      { id: 'b', emoji: '🎵', label: 'Sugar - Maroon 5' },
      { id: 'c', emoji: '🎵', label: 'Can\'t Stop The Feeling! - Justin Timberlake' },
      { id: 'd', emoji: '🎵', label: 'Uptown Funk - Bruno Mars' },
    ],
    correctOptionId: 'b',
    explanation:
      '"Sugar" oleh Maroon 5 dari album "V", lagu pop funk ceria dengan video klip kejutan pernikahan.',
  },
  {
    question:
      '🎶 "Ada yang lain di senyummu, yang membuat lidahku gugup tak bergerak..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Kasih Putih - Glenn Fredly' },
      { id: 'b', emoji: '🎵', label: 'Nuansa Bening - Vidi Aldiano' },
      { id: 'c', emoji: '🎵', label: 'Cantik - Kahitna' },
      { id: 'd', emoji: '🎵', label: 'Sempurna - Andra and The Backbone' },
    ],
    correctOptionId: 'c',
    explanation:
      '"Cantik" karya Yovie Widianto yang dibawakan Kahitna (1995), lagu cinta paling ikonik di Indonesia.',
  },
  {
    question:
      '🎶 "If the world was ending, I\'d wanna be next to you... If the party was over and our time on Earth was through..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Die With A Smile - Lady Gaga & Bruno Mars' },
      { id: 'b', emoji: '🎵', label: 'Senorita - Shawn Mendes & Camila Cabello' },
      { id: 'c', emoji: '🎵', label: 'As It Was - Harry Styles' },
      { id: 'd', emoji: '🎵', label: 'Birds of a Feather - Billie Eilish' },
    ],
    correctOptionId: 'a',
    explanation:
      'Kolaborasi mega hits dunia "Die With A Smile" antara Lady Gaga dan Bruno Mars.',
  },
  {
    question:
      '🎶 "Pernah berpikir tuk pergi, terbang jauh menembus awan... Tapi ku tak bisa jauh, jauh darimu..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Pelangi di Matamu - Jamrud' },
      { id: 'b', emoji: '🎵', label: 'Ku Tak Bisa - Slank' },
      { id: 'c', emoji: '🎵', label: 'Terbang - Gigi' },
      { id: 'd', emoji: '🎵', label: 'Kasih Tak Sampai - Padi' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu legendaris Slankers "Ku Tak Bisa" dari album PLUR (2004) karya Bimbim dan Kaka Slank.',
  },
  {
    question:
      '🎶 "Semua tak sama, tak pernah sama... Semenjak kau relakan hati, menghilang tanpa kata..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Hampa - Ari Lasso' },
      { id: 'b', emoji: '🎵', label: 'Semua Tak Sama - Padi' },
      { id: 'c', emoji: '🎵', label: 'Cinta Ini Membunuhku - D\'Masiv' },
      { id: 'd', emoji: '🎵', label: 'Menghujam Jantungku - Tompi' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu megah "Semua Tak Sama" dari album Sesuatu Yang Tertunda (2001) karya Padi Band.',
  },
  {
    question:
      '🎶 "Syukuri apa yang ada, hidup adalah anugerah... Tetap jalani hidup ini, melakukan yang terbaik..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Laskar Pelangi - Nidji' },
      { id: 'b', emoji: '🎵', label: 'Buka Semangat Baru - Ello' },
      { id: 'c', emoji: '🎵', label: 'Jangan Menyerah - D\'Masiv' },
      { id: 'd', emoji: '🎵', label: 'Tetap Bersemangat - Bondan Prakoso' },
    ],
    correctOptionId: 'c',
    explanation:
      'Lagu inspiratif legendaris "Jangan Menyerah" oleh Rian D\'Masiv (2009) yang membakar semangat!',
  },
  {
    question:
      '🎶 "Kupikir kau sudah lupa padaku... Tata cara menghibur luka, ada di senyummu..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Gala Bunga Matahari - Sal Priadi' },
      { id: 'b', emoji: '🎵', label: 'Takut - Idgitaf' },
      { id: 'c', emoji: '🎵', label: 'Runtuh - Feby Putri' },
      { id: 'd', emoji: '🎵', label: 'Bertaut - Nadin Amizah' },
    ],
    correctOptionId: 'a',
    explanation:
      '"Gala Bunga Matahari" oleh Sal Priadi, lagu yang sangat menyentuh hati dan viral di seluruh penjuru negeri.',
  },
  {
    question:
      '🎶 "Lantas mengapa ku masih menaruh hati, padahal ku tahu kau t\'lah ada yang memiliki..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Pesan Terakhir - Lyodra' },
      { id: 'b', emoji: '🎵', label: 'Sial - Mahalini' },
      { id: 'c', emoji: '🎵', label: 'Lantas - Juicy Luicy' },
      { id: 'd', emoji: '🎵', label: 'Rumah Singgah - Fabio Asher' },
    ],
    correctOptionId: 'c',
    explanation:
      'Lagu anthem galau "Lantas" dari Juicy Luicy yang diputar jutaan kali di Spotify.',
  },
  {
    question:
      '🎶 "Di dunia yang fana ini, kau tempatku berlabuh... Tempat terbaik untuk berbagi resah..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Dunia Tipu-Tipu - Yura Yunita' },
      { id: 'b', emoji: '🎵', label: 'Jiwa Yang Bersedih - Ghea Indrawari' },
      { id: 'c', emoji: '🎵', label: 'Takut - Idgitaf' },
      { id: 'd', emoji: '🎵', label: 'Komang - Raim Laode' },
    ],
    correctOptionId: 'a',
    explanation:
      '"Dunia Tipu-Tipu" karya Yura Yunita dari album Tutur Batin yang sarat makna dan kehangatan.',
  },
  {
    question:
      '🎶 "Surat buat wakil rakyat, kami yang menaruh harap... Jangan tidur waktu sidang soal rakyat..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Surat Buat Wakil Rakyat - Iwan Fals' },
      { id: 'b', emoji: '🎵', label: 'Berita Kepada Kawan - Ebiet G. Ade' },
      { id: 'c', emoji: '🎵', label: 'Jadilah Legenda - Superman Is Dead' },
      { id: 'd', emoji: '🎵', label: 'Bongkar - Swami' },
    ],
    correctOptionId: 'a',
    explanation:
      'Lagu kritik sosial paling legendaris "Surat Buat Wakil Rakyat" (1987) oleh sang legenda Iwan Fals.',
  },
  {
    question:
      '🎶 "Ku ingin engkau tahu diriku di sini menanti dirimu... Meski ku tunggu hingga ujung waktuku..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Kenangan Terindah - Samsons' },
      { id: 'b', emoji: '🎵', label: 'Demi Waktu - Ungu' },
      { id: 'c', emoji: '🎵', label: 'Bukan Pujangga - Base Jam' },
      { id: 'd', emoji: '🎵', label: 'Ruang Rindu - Letto' },
    ],
    correctOptionId: 'a',
    explanation:
      'Lagu balada orkestra megah "Kenangan Terindah" (2006) ciptaan Irfan & Bams (Samsons).',
  },
  {
    question:
      '🎶 "Aku terjatuh dan tak bisa bangkit lagi, aku tenggelam dalam lautan luka dalam..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Lumpuhkan Ingatanku - Geisha' },
      { id: 'b', emoji: '🎵', label: 'Butiran Debu - Rumor' },
      { id: 'c', emoji: '🎵', label: 'Asal Kau Bahagia - Armada' },
      { id: 'd', emoji: '🎵', label: 'Surat Cinta Untuk Starla - Virgoun' },
    ],
    correctOptionId: 'b',
    explanation:
      '"Butiran Debu" lagu patah hati monumental yang dinyanyikan Rumor karya Ribas.',
  },
  {
    question:
      '🎶 "Hey Jude, don\'t make it bad, take a sad song and make it better..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Like a Rolling Stone - Bob Dylan' },
      { id: 'b', emoji: '🎵', label: 'Hey Jude - The Beatles' },
      { id: 'c', emoji: '🎵', label: 'Satisfaction - The Rolling Stones' },
      { id: 'd', emoji: '🎵', label: 'Good Vibrations - The Beach Boys' },
    ],
    correctOptionId: 'b',
    explanation:
      'Mahakarya sepanjang masa "Hey Jude" oleh Paul McCartney dan The Beatles (1968).',
  },
  {
    question:
      '🎶 "With the lights out, it\'s less dangerous... Here we are now, entertain us..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Smells Like Teen Spirit - Nirvana' },
      { id: 'b', emoji: '🎵', label: 'Black Hole Sun - Soundgarden' },
      { id: 'c', emoji: '🎵', label: 'Alive - Pearl Jam' },
      { id: 'd', emoji: '🎵', label: 'Creep - Radiohead' },
    ],
    correctOptionId: 'a',
    explanation:
      'Lagu kebangsaan grunge dunia "Smells Like Teen Spirit" oleh Kurt Cobain & Nirvana (1991).',
  },
  {
    question:
      '🎶 "I\'m a creep, I\'m a weirdo... What the hell am I doin\' here? I don\'t belong here..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Zombie - The Cranberries' },
      { id: 'b', emoji: '🎵', label: 'Losing My Religion - R.E.M.' },
      { id: 'c', emoji: '🎵', label: 'Creep - Radiohead' },
      { id: 'd', emoji: '🎵', label: '1979 - The Smashing Pumpkins' },
    ],
    correctOptionId: 'c',
    explanation:
      'Single debut legendaris "Creep" oleh Thom Yorke dan band Radiohead (1992).',
  },
  {
    question:
      '🎶 "I tried so hard and got so far, but in the end it doesn\'t even matter..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Bring Me To Life - Evanescence' },
      { id: 'b', emoji: '🎵', label: 'In The End - Linkin Park' },
      { id: 'c', emoji: '🎵', label: 'Last Resort - Papa Roach' },
      { id: 'd', emoji: '🎵', label: 'Chop Suey! - System of a Down' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu rock paling ikonik abad 21 "In The End" oleh Chester Bennington & Linkin Park (2000).',
  },
  {
    question:
      '🎶 "I walk a lonely road, the only one that I have ever known... Don\'t know where it goes, but it\'s home to me and I walk alone..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'All The Small Things - Blink-182' },
      { id: 'b', emoji: '🎵', label: 'The Reason - Hoobastank' },
      { id: 'c', emoji: '🎵', label: 'Boulevard of Broken Dreams - Green Day' },
      { id: 'd', emoji: '🎵', label: 'Welcome To The Black Parade - My Chemical Romance' },
    ],
    correctOptionId: 'c',
    explanation:
      'Lagu pemenang Grammy Award "Boulevard of Broken Dreams" oleh Green Day (album American Idiot 2004).',
  },
  {
    question:
      '🎶 "Woah, we\'re halfway there! Woah, livin\' on a prayer! Take my hand, we\'ll make it I swear..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Sweet Child O\' Mine - Guns N\' Roses' },
      { id: 'b', emoji: '🎵', label: 'Livin\' On A Prayer - Bon Jovi' },
      { id: 'c', emoji: '🎵', label: 'Pour Some Sugar On Me - Def Leppard' },
      { id: 'd', emoji: '🎵', label: 'The Final Countdown - Europe' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu rock anthem abadi "Livin\' On A Prayer" oleh Bon Jovi (1986) yang selalu dinyanyikan bersama.',
  },
  {
    question:
      '🎶 "She\'s got a smile that it seems to me reminds me of childhood memories..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Back In Black - AC/DC' },
      { id: 'b', emoji: '🎵', label: 'Sweet Child O\' Mine - Guns N\' Roses' },
      { id: 'c', emoji: '🎵', label: 'Smoke On The Water - Deep Purple' },
      { id: 'd', emoji: '🎵', label: 'Jump - Van Halen' },
    ],
    correctOptionId: 'b',
    explanation:
      'Intro gitar Slash paling terkenal di dunia dalam "Sweet Child O\' Mine" oleh Guns N\' Roses (1987).',
  },
  {
    question:
      '🎶 "I\'ve been on my own for long enough... Maybe you can show me how to love, maybe..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Watermelon Sugar - Harry Styles' },
      { id: 'b', emoji: '🎵', label: 'Levitating - Dua Lipa' },
      { id: 'c', emoji: '🎵', label: 'Blinding Lights - The Weeknd' },
      { id: 'd', emoji: '🎵', label: 'Stay - The Kid LAROI' },
    ],
    correctOptionId: 'c',
    explanation:
      '"Blinding Lights" oleh The Weeknd, lagu synth-pop pemegang rekor tangga lagu terlama Billboard.',
  },
  {
    question:
      '🎶 "So you\'re a tough guy, like it really rough guy... Just can\'t get enough guy..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Bad Guy - Billie Eilish' },
      { id: 'b', emoji: '🎵', label: 'Havana - Camila Cabello' },
      { id: 'c', emoji: '🎵', label: 'Dance Monkey - Tones and I' },
      { id: 'd', emoji: '🎵', label: 'New Rules - Dua Lipa' },
    ],
    correctOptionId: 'a',
    explanation:
      'Hit global peraih Grammy Record of the Year "Bad Guy" oleh Billie Eilish (2019).',
  },
  {
    question:
      '🎶 "For all the times that you rained on my parade, and all the clubs you get in using my name..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Treat You Better - Shawn Mendes' },
      { id: 'b', emoji: '🎵', label: 'Love Yourself - Justin Bieber' },
      { id: 'c', emoji: '🎵', label: 'Attention - Charlie Puth' },
      { id: 'd', emoji: '🎵', label: '7 Years - Lukas Graham' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu akustik hits "Love Yourself" oleh Justin Bieber karya Ed Sheeran (2015).',
  },
  {
    question:
      '🎶 "And I will always love you... I will always love you, ooh..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'My Heart Will Go On - Celine Dion' },
      { id: 'b', emoji: '🎵', label: 'Hero - Mariah Carey' },
      { id: 'c', emoji: '🎵', label: 'I Will Always Love You - Whitney Houston' },
      { id: 'd', emoji: '🎵', label: 'Un-Break My Heart - Toni Braxton' },
    ],
    correctOptionId: 'c',
    explanation:
      'Vokal monumental mendiang Whitney Houston dalam "I Will Always Love You" (The Bodyguard, 1992).',
  },
  {
    question:
      '🎶 "Near, far, wherever you are... I believe that the heart does go on..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'My Heart Will Go On - Celine Dion' },
      { id: 'b', emoji: '🎵', label: 'I Have Nothing - Whitney Houston' },
      { id: 'c', emoji: '🎵', label: 'Without You - Mariah Carey' },
      { id: 'd', emoji: '🎵', label: 'How Do I Live - LeAnn Rimes' },
    ],
    correctOptionId: 'a',
    explanation:
      'Soundtrack megah film Titanic peraih Oscar "My Heart Will Go On" oleh diva Celine Dion (1997).',
  },
  {
    question:
      '🎶 "You can dance, you can jive, having the time of your life... See that girl, watch that scene, digging the dancing queen..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Dancing Queen - ABBA' },
      { id: 'b', emoji: '🎵', label: 'Stayin\' Alive - Bee Gees' },
      { id: 'c', emoji: '🎵', label: 'I Will Survive - Gloria Gaynor' },
      { id: 'd', emoji: '🎵', label: 'Rasputin - Boney M.' },
    ],
    correctOptionId: 'a',
    explanation:
      'Lagu disko pop paling terkenal sepanjang sejarah "Dancing Queen" oleh kuartet legendaris ABBA (1976).',
  },
  {
    question:
      '🎶 "Aku tak sing ngalah, trimo mundur timbang loro ati... Tak oyako wong kowe wis lali..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Mendung Tanpo Udan - Ndarboy Genk' },
      { id: 'b', emoji: '🎵', label: 'Ojo Dibandingke - Farel Prayoga' },
      { id: 'c', emoji: '🎵', label: 'Suket Teki - Didi Kempot' },
      { id: 'd', emoji: '🎵', label: 'Rungkad - Happy Asmara' },
    ],
    correctOptionId: 'c',
    explanation:
      'Karya maestro campursari legendaris Didi Kempot "Suket Teki" (The Godfather of Broken Heart).',
  },
  {
    question:
      '🎶 "Ku ingin marah, melampiaskan... Tapi ku hanyalah sendiri di sini..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Pelan-Pelan Saja - Kotak' },
      { id: 'b', emoji: '🎵', label: 'Lumpuhkan Ingatanku - Geisha' },
      { id: 'c', emoji: '🎵', label: 'Cari Pacar Lagi - ST12' },
      { id: 'd', emoji: '🎵', label: 'Hapus Aku - Nidji' },
    ],
    correctOptionId: 'a',
    explanation:
      'Lagu rock balada penuh tenaga "Pelan-Pelan Saja" karya Tantri & Kotak dari album Energi (2010).',
  },
  {
    question:
      '🎶 "Beri tahu aku cara membencimu, tanpa harus merelakanmu... Sudah, lupakan semua, segala cinta yang kau beri..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Duka - Last Child' },
      { id: 'b', emoji: '🎵', label: 'Serana - For Revenge' },
      { id: 'c', emoji: '🎵', label: 'Hilang Harapan - Stand Here Alone' },
      { id: 'd', emoji: '🎵', label: 'Sebuah Rahasia - Pee Wee Gaskins' },
    ],
    correctOptionId: 'b',
    explanation:
      'Lagu anthem emo/patah hati paling fenomenal "Serana" oleh For Revenge (Boniex cs) dari album Perayaan Patah Hati Babak 1!',
  },
  {
    question:
      '🎶 "Beri tahu aku cara melupakanmu, seperti kau ajarkanku cara mengingatmu..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Jakarta Hari Ini - For Revenge' },
      { id: 'b', emoji: '🎵', label: 'Pedih - Last Child' },
      { id: 'c', emoji: '🎵', label: 'Berdiri Terhempas - Stand Here Alone' },
      { id: 'd', emoji: '🎵', label: 'Perih - Vierratale' },
    ],
    correctOptionId: 'a',
    explanation:
      '"Jakarta Hari Ini" kolaborasi epik For Revenge bersama Stereo Wall, lagu tentang merelakan kenangan di sudut kota Jakarta.',
  },
  {
    question:
      '🎶 "Kau hancurkan aku dengan sikapmu, tak pernah kau tahu betapa sakitnya... Aku mencintaimu setulus hatiku..."',
    options: [
      { id: 'a', emoji: '🎵', label: 'Kenangan Terindah - Samsons' },
      { id: 'b', emoji: '🎵', label: 'Cinta Ini Membunuhku - D\'Masiv' },
      { id: 'c', emoji: '🎵', label: 'Demi Waktu - Ungu' },
      { id: 'd', emoji: '🎵', label: 'Sandiwara Cinta - Repvblik' },
    ],
    correctOptionId: 'b',
    explanation:
      'Single debut monumental D\'Masiv "Cinta Ini Membunuhku" (2008) yang melambungkan nama Rian cs.',
  },
];

// 3. Tebak Film dari Emoji
const TEBAK_FILM_SETS = [
  {
    question: '🚢 🧊 💔 🌊',
    options: [
      { id: 'a', emoji: '🎬', label: 'Poseidon' },
      { id: 'b', emoji: '🎬', label: 'Pirates of the Caribbean' },
      { id: 'c', emoji: '🎬', label: 'Titanic' },
      { id: 'd', emoji: '🎬', label: 'Life of Pi' },
    ],
    correctOptionId: 'c',
    explanation:
      'Titanic (1997)! Kapal megah yang menabrak gunung es di Samudera Atlantik dan kisah cinta legendaris Jack & Rose.',
  },
  {
    question: '⚡ 🧙‍♂️ 🦉 🏰',
    options: [
      { id: 'a', emoji: '🎬', label: 'The Lord of the Rings' },
      { id: 'b', emoji: '🎬', label: 'Harry Potter' },
      { id: 'c', emoji: '🎬', label: 'The Chronicles of Narnia' },
      { id: 'd', emoji: '🎬', label: 'Fantastic Beasts' },
    ],
    correctOptionId: 'b',
    explanation:
      'Harry Potter! Si penyihir berkacamata dengan bekas luka kilat di dahi, burung hantu Hedwig, dan kastil Hogwarts.',
  },
  {
    question: '🏎️ 💨 👨‍👩‍👦 🔧',
    options: [
      { id: 'a', emoji: '🎬', label: 'Cars' },
      { id: 'b', emoji: '🎬', label: 'Transformers' },
      { id: 'c', emoji: '🎬', label: 'Need for Speed' },
      { id: 'd', emoji: '🎬', label: 'Fast & Furious' },
    ],
    correctOptionId: 'd',
    explanation:
      'Fast & Furious! Mobil balap super kencang, nitro NOS, dan yang terpenting: "Nothing is stronger than FAMILY"!',
  },
  {
    question: '🧟‍♂️ 🚄 👨‍👧 🩸',
    options: [
      { id: 'a', emoji: '🎬', label: 'Train to Busan' },
      { id: 'b', emoji: '🎬', label: 'World War Z' },
      { id: 'c', emoji: '🎬', label: 'All of Us Are Dead' },
      { id: 'd', emoji: '🎬', label: 'Kingdom' },
    ],
    correctOptionId: 'a',
    explanation:
      'Train to Busan (2016)! Thriller zombie menegangkan tentang perjuangan seorang ayah melindungi putrinya di kereta KTX cepat.',
  },
  {
    question: '🦖 🌴 🚙 🧬',
    options: [
      { id: 'a', emoji: '🎬', label: 'King Kong' },
      { id: 'b', emoji: '🎬', label: 'Godzilla' },
      { id: 'c', emoji: '🎬', label: 'Jurassic Park' },
      { id: 'd', emoji: '🎬', label: 'The Lost City' },
    ],
    correctOptionId: 'c',
    explanation:
      'Jurassic Park (1993)! Mahakarya Steven Spielberg tentang rekayasa genetika dinosaurus di pulau tropis Isla Nublar.',
  },
  {
    question: '🕷️ 🕸️ 🏙️ 🧑',
    options: [
      { id: 'a', emoji: '🎬', label: 'The Batman' },
      { id: 'b', emoji: '🎬', label: 'Spider-Man' },
      { id: 'c', emoji: '🎬', label: 'Iron Man' },
      { id: 'd', emoji: '🎬', label: 'Doctor Strange' },
    ],
    correctOptionId: 'b',
    explanation:
      'Spider-Man! "With great power comes great responsibility" di atas gedung-gedung New York.',
  },
  {
    question: '🦁 👑 🌅 🐗',
    options: [
      { id: 'a', emoji: '🎬', label: 'The Lion King' },
      { id: 'b', emoji: '🎬', label: 'Madagascar' },
      { id: 'c', emoji: '🎬', label: 'Tarzan' },
      { id: 'd', emoji: '🎬', label: 'Zootopia' },
    ],
    correctOptionId: 'a',
    explanation:
      'The Lion King! Perjalanan Simba menjadi raja sabana diiringi lagu Hakuna Matata bersama Timon dan Pumbaa.',
  },
  {
    question: '🎈 🤡 🌧️ 🚲',
    options: [
      { id: 'a', emoji: '🎬', label: 'Joker' },
      { id: 'b', emoji: '🎬', label: 'Annabelle' },
      { id: 'c', emoji: '🎬', label: 'The Conjuring' },
      { id: 'd', emoji: '🎬', label: 'IT' },
    ],
    correctOptionId: 'd',
    explanation:
      'IT (Pennywise)! Badut menyeramkan pemegang balon merah yang menghantui kota Derry.',
  },
  {
    question: '🍫 🎩 🏭 🎟️',
    options: [
      { id: 'a', emoji: '🎬', label: 'Alice in Wonderland' },
      { id: 'b', emoji: '🎬', label: 'Charlie and the Chocolate Factory' },
      { id: 'c', emoji: '🎬', label: 'The Greatest Showman' },
      { id: 'd', emoji: '🎬', label: 'Mary Poppins' },
    ],
    correctOptionId: 'b',
    explanation:
      'Charlie and the Chocolate Factory! Tiket emas menuju tur pabrik cokelat ajaib milik Willy Wonka.',
  },
  {
    question: '🤖 🕶️ 💊 🟢',
    options: [
      { id: 'a', emoji: '🎬', label: 'The Matrix' },
      { id: 'b', emoji: '🎬', label: 'Blade Runner' },
      { id: 'c', emoji: '🎬', label: 'Terminator' },
      { id: 'd', emoji: '🎬', label: 'Inception' },
    ],
    correctOptionId: 'a',
    explanation:
      'The Matrix (1999)! Pil merah atau pil biru bersama Neo untuk mengungkap rahasia dunia simulasi.',
  },
  {
    question: '🔔 👵 🧕 ⚰️',
    options: [
      { id: 'a', emoji: '🎬', label: 'Siksa Kubur' },
      { id: 'b', emoji: '🎬', label: 'Keramat' },
      { id: 'c', emoji: '🎬', label: 'Pengabdi Setan' },
      { id: 'd', emoji: '🎬', label: 'Kuntilanak' },
    ],
    correctOptionId: 'c',
    explanation:
      'Pengabdi Setan karya Joko Anwar! Denting lonceng Ibu dari atas ranjang yang bikin merinding seisi bioskop!',
  },
  {
    question: '🌈 🏝️ 🏫 👧👦',
    options: [
      { id: 'a', emoji: '🎬', label: 'Laskar Pelangi' },
      { id: 'b', emoji: '🎬', label: 'Petualangan Sherina' },
      { id: 'c', emoji: '🎬', label: 'Negeri 5 Menara' },
      { id: 'd', emoji: '🎬', label: 'Tanah Surga... Katanya' },
    ],
    correctOptionId: 'a',
    explanation:
      'Laskar Pelangi (2008)! Kisah inspiratif 10 murid di SD Muhammadiyah Gantong, Belitung karya Andrea Hirata.',
  },
  {
    question: '💃 🐍 🏚️ 🌲',
    options: [
      { id: 'a', emoji: '🎬', label: 'Mangkujiwo' },
      { id: 'b', emoji: '🎬', label: 'KKN di Desa Penari' },
      { id: 'c', emoji: '🎬', label: 'Sewu Dino' },
      { id: 'd', emoji: '🎬', label: 'Di Ambang Kematian' },
    ],
    correctOptionId: 'b',
    explanation:
      'KKN di Desa Penari! Film Indonesia terlaris sepanjang masa dengan kisah mistis Badarawuhi di hutan terlarang.',
  },
  {
    question: '👻 🎪 💰 👮‍♂️',
    options: [
      { id: 'a', emoji: '🎬', label: 'Ghost Writer' },
      { id: 'b', emoji: '🎬', label: 'Hello Ghost' },
      { id: 'c', emoji: '🎬', label: 'Warkop DKI Reborn' },
      { id: 'd', emoji: '🎬', label: 'Agak Laen' },
    ],
    correctOptionId: 'd',
    explanation:
      'Agak Laen (2024)! Komedi horor viral tentang 4 sekawan pengelola rumah hantu pasar malam yang kocak abis!',
  },
  {
    question: '🎈 🏠 👴 👦',
    options: [
      { id: 'a', emoji: '🎬', label: 'Coco' },
      { id: 'b', emoji: '🎬', label: 'Monsters, Inc.' },
      { id: 'c', emoji: '🎬', label: 'Up' },
      { id: 'd', emoji: '🎬', label: 'Inside Out' },
    ],
    correctOptionId: 'c',
    explanation:
      'Up (2009)! Petualangan kakek Carl Fredricksen dan anak pramuka Russell menerbangkan rumah dengan ribuan balon gas.',
  },
  {
    question: '🐠 🌊 🔍 🦈',
    options: [
      { id: 'a', emoji: '🎬', label: 'Finding Nemo' },
      { id: 'b', emoji: '🎬', label: 'Shark Tale' },
      { id: 'c', emoji: '🎬', label: 'The Little Mermaid' },
      { id: 'd', emoji: '🎬', label: 'Moana' },
    ],
    correctOptionId: 'a',
    explanation:
      'Finding Nemo (2003)! Petualangan Marlin dan Dory mengarungi samudera luas demi menemukan Nemo.',
  },
  {
    question: '🤠 🚀 🧸 📦',
    options: [
      { id: 'a', emoji: '🎬', label: 'The Lego Movie' },
      { id: 'b', emoji: '🎬', label: 'Toy Story' },
      { id: 'c', emoji: '🎬', label: 'Small Soldiers' },
      { id: 'd', emoji: '🎬', label: 'Pinocchio' },
    ],
    correctOptionId: 'b',
    explanation:
      'Toy Story! Persahabatan koboi Woody dan astronot Buzz Lightyear: "To infinity and beyond!"',
  },
  {
    question: '🪐 🚀 ⏳ 🕳️',
    options: [
      { id: 'a', emoji: '🎬', label: 'Gravity' },
      { id: 'b', emoji: '🎬', label: 'The Martian' },
      { id: 'c', emoji: '🎬', label: 'Arrival' },
      { id: 'd', emoji: '🎬', label: 'Interstellar' },
    ],
    correctOptionId: 'd',
    explanation:
      'Interstellar (2014) karya Christopher Nolan! Perjalanan melintasi lubang cacing Gargantua dan relativitas waktu.',
  },
  {
    question: '💣 👓 ☢️ 🔬',
    options: [
      { id: 'a', emoji: '🎬', label: 'Oppenheimer' },
      { id: 'b', emoji: '🎬', label: 'A Beautiful Mind' },
      { id: 'c', emoji: '🎬', label: 'The Imitation Game' },
      { id: 'd', emoji: '🎬', label: 'Chernobyl' },
    ],
    correctOptionId: 'a',
    explanation:
      'Oppenheimer (2023)! Kisah bapak bom atom J. Robert Oppenheimer dan Proyek Manhattan pemenang 7 Piala Oscar.',
  },
  {
    question: '💖 👠 🎀 👱‍♀️',
    options: [
      { id: 'a', emoji: '🎬', label: 'Legally Blonde' },
      { id: 'b', emoji: '🎬', label: 'Barbie' },
      { id: 'c', emoji: '🎬', label: 'Clueless' },
      { id: 'd', emoji: '🎬', label: 'Mean Girls' },
    ],
    correctOptionId: 'b',
    explanation:
      'Barbie (2023) karya Greta Gerwig! Petualangan serba pink Margot Robbie dan Ryan Gosling dari Barbieland ke dunia nyata.',
  },
  {
    question: '🏴‍☠️ ⚔️ 🪙 🦜',
    options: [
      { id: 'a', emoji: '🎬', label: 'Master and Commander' },
      { id: 'b', emoji: '🎬', label: 'Peter Pan' },
      { id: 'c', emoji: '🎬', label: 'Pirates of the Caribbean' },
      { id: 'd', emoji: '🎬', label: 'Treasure Planet' },
    ],
    correctOptionId: 'c',
    explanation:
      'Pirates of the Caribbean! Aksi eksentrik Kapten Jack Sparrow mengarungi lautan bersama kapal Black Pearl.',
  },
  {
    question: '🥋 🐼 🥟 🥢',
    options: [
      { id: 'a', emoji: '🎬', label: 'Shaolin Soccer' },
      { id: 'b', emoji: '🎬', label: 'The Karate Kid' },
      { id: 'c', emoji: '🎬', label: 'Mulan' },
      { id: 'd', emoji: '🎬', label: 'Kung Fu Panda' },
    ],
    correctOptionId: 'd',
    explanation:
      'Kung Fu Panda! Perjalanan Po sang panda pecinta bakpao dan mie hingga menjadi Pendekar Naga legendaris.',
  },
  {
    question: '🔵 🏹 🌿 🪐',
    options: [
      { id: 'a', emoji: '🎬', label: 'Avatar' },
      { id: 'b', emoji: '🎬', label: 'Guardians of the Galaxy' },
      { id: 'c', emoji: '🎬', label: 'Star Wars' },
      { id: 'd', emoji: '🎬', label: 'Dune' },
    ],
    correctOptionId: 'a',
    explanation:
      'Avatar (2009) karya James Cameron! Petualangan bangsa Na\'vi bertubuh biru di planet hutan rimbun Pandora.',
  },
  {
    question: '🛵 🧥 🎸 💌',
    options: [
      { id: 'a', emoji: '🎬', label: 'Catatan Si Boy' },
      { id: 'b', emoji: '🎬', label: 'Dilan 1990' },
      { id: 'c', emoji: '🎬', label: 'Ada Apa Dengan Cinta' },
      { id: 'd', emoji: '🎬', label: 'Dear Nathan' },
    ],
    correctOptionId: 'b',
    explanation:
      'Dilan 1990! Kisah cinta anak motor SMA di Bandung yang romantis dan puitis: "Jangan rindu, berat, kamu gak akan kuat, biar aku saja."',
  },
  {
    question: '👊 🏢 🔪 🩸',
    options: [
      { id: 'a', emoji: '🎬', label: 'John Wick' },
      { id: 'b', emoji: '🎬', label: 'The Night Comes for Us' },
      { id: 'c', emoji: '🎬', label: 'The Raid' },
      { id: 'd', emoji: '🎬', label: 'Headshot' },
    ],
    correctOptionId: 'c',
    explanation:
      'The Raid: Redemption (2011)! Aksi silat mendunia Iko Uwais menyerbu gedung apartemen sarang gembong narkoba.',
  },
];

// 4. Would You Rather?
const WOULD_YOU_RATHER_SETS = [
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'pantai', emoji: '🏖️', label: 'WFH dari Pinggir Pantai' },
      { id: 'gunung', emoji: '⛰️', label: 'WFH dari Villa Pegunungan' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'no-bug', emoji: '🐞', label: 'Kode Selalu Bebas Bug Selamanya' },
      { id: 'unlimited-coffee', emoji: '☕', label: 'Kopi & Camilan Gratis Tak Terbatas' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'undo', emoji: '⏪', label: 'Punya Tombol Undo di Dunia Nyata' },
      { id: 'pause', emoji: '⏸️', label: 'Punya Tombol Pause Waktu' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'fast-release', emoji: '🚀', label: 'Rilis Fitur 1 Minggu Lebih Cepat' },
      { id: 'zero-revision', emoji: '🛡️', label: 'Fitur Diterima Tanpa Revisi Sama Sekali' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'night-owl', emoji: '🦉', label: 'Fokus Kerja di Malam Hari (Night Owl)' },
      { id: 'early-bird', emoji: '🌅', label: 'Fokus Kerja di Pagi Buta (Early Bird)' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'standup-chat', emoji: '💬', label: 'Daily Standup Cukup Chat 3 Menit' },
      { id: 'no-estimate', emoji: '🎯', label: 'Sprint Planning Tanpa Estimasi Story Points' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'teleport', emoji: '✨', label: 'Bisa Teleportasi ke Kantor Sekejap' },
      { id: 'no-traffic', emoji: '🚗', label: 'Bebas Macet Total Seumur Hidup' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'double-salary', emoji: '💰', label: 'Gaji 2x Lipat tapi Kerja Sabtu' },
      { id: 'four-days', emoji: '🗓️', label: 'Kerja 4 Hari Seminggu Gaji Normal' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'free-lunch', emoji: '🍱', label: 'Makan Siang Enak Ditraktir Setiap Hari' },
      { id: 'early-leave', emoji: '⏰', label: 'Pulang 1 Jam Lebih Awal Setiap Hari' },
    ],
  },
  {
    question: 'Pilih salah satu dari dua pilihan yang tersedia.',
    options: [
      { id: 'super-pc', emoji: '💻', label: 'Laptop Spek Dewa tapi Berat 4 Kg' },
      { id: 'ultra-light', emoji: '🪶', label: 'Laptop Super Ringan Spek Cukup' },
    ],
  },
];

// 5. Tebakan Receh
const TEBAKAN_RECEH_SETS = [
  {
    question: 'Penyanyi luar negeri yang kalau nelen makanan seret?',
    options: [
      { id: 'a', emoji: '🎤', label: 'Bruno Mules' },
      { id: 'b', emoji: '🎤', label: 'Justin Bibir' },
      { id: 'c', emoji: '🎤', label: 'Ed Seret' },
      { id: 'd', emoji: '🎤', label: 'Taylor Nyelip' },
    ],
    correctOptionId: 'c',
    explanation: 'Ed Seret (plesetan Ed Sheeran)! Makanya kalau makan jangan lupa sambil minum air putih ya!',
  },
  {
    question: 'Hewan apa yang paling hening dan gak pernah bersuara sama sekali?',
    options: [
      { id: 'a', emoji: '🐱', label: 'Kucing ngantuk' },
      { id: 'b', emoji: '🐜', label: 'Se-mute' },
      { id: 'c', emoji: '🐟', label: 'Ikan cupang' },
      { id: 'd', emoji: '🐌', label: 'Siput galau' },
    ],
    correctOptionId: 'b',
    explanation: 'Se-mute (plesetan semut & mute)! Karena posisinya di-mute, jadi ga ada suaranya sama sekali.',
  },
  {
    question: 'Pocong apa yang paling disenangi dan ditunggu-tunggu ibu-ibu?',
    options: [
      { id: 'a', emoji: '👻', label: 'Pocong ramah' },
      { id: 'b', emoji: '👻', label: 'Pocong glow up' },
      { id: 'c', emoji: '👻', label: 'Pocong rajin menabung' },
      { id: 'd', emoji: '👻', label: 'Pocongan harga' },
    ],
    correctOptionId: 'd',
    explanation: 'Pocongan harga alias potongan harga (diskon)! Apalagi kalau diskonnya sampai 90% di tanggal kembar!',
  },
  {
    question: 'Sayur apa yang jago bela diri dan ditakuti musuh?',
    options: [
      { id: 'a', emoji: '🥬', label: 'Kangkung Fu' },
      { id: 'b', emoji: '🥦', label: 'Bro-koli' },
      { id: 'c', emoji: '🍅', label: 'Tomat Silat' },
      { id: 'd', emoji: '🥕', label: 'Wortel Baja' },
    ],
    correctOptionId: 'a',
    explanation: 'Kangkung Fu (plesetan Kung Fu)! Sekali tendang musuh langsung layu!',
  },
  {
    question: 'Kenapa matahari kalau sore selalu tenggelam?',
    options: [
      { id: 'a', emoji: '☀️', label: 'Karena sudah ngantuk berat' },
      { id: 'b', emoji: '☀️', label: 'Karena gak bisa berenang' },
      { id: 'c', emoji: '☀️', label: 'Takut sama kegelapan malam' },
      { id: 'd', emoji: '☀️', label: 'Mau ganti shift sama bulan' },
    ],
    correctOptionId: 'b',
    explanation: 'Karena matahari gak bisa berenang! Coba kalau bisa berenang, pasti matahari ngambang terus!',
  },
  {
    question: 'Ikan apa yang matanya ada lebih dari seratus?',
    options: [
      { id: 'a', emoji: '🦈', label: 'Ikan hiu mutant' },
      { id: 'b', emoji: '🐟', label: 'Ikan teri sekilo' },
      { id: 'c', emoji: '🐡', label: 'Ikan buntal raksasa' },
      { id: 'd', emoji: '🦑', label: 'Cumi-cumi alien' },
    ],
    correctOptionId: 'b',
    explanation: 'Ikan teri sekilo! Dalam sekilo ada ratusan ekor, jadi matanya banyak banget!',
  },
  {
    question: 'Artis Hollywood yang hobi banget nongkrong di warkop pesen kopi?',
    options: [
      { id: 'a', emoji: '☕', label: 'Leonardo Di-kopi-o' },
      { id: 'b', emoji: '☕', label: 'Tom Krus-es' },
      { id: 'c', emoji: '☕', label: 'Brad Pahit' },
      { id: 'd', emoji: '☕', label: 'Chris Mar-teh' },
    ],
    correctOptionId: 'a',
    explanation: 'Leonardo Di-kopi-o (plesetan Leonardo DiCaprio)! Tiap pagi nongkrong pesen kopi tubruk panas!',
  },
  {
    question: 'Ban apa yang kalau dipasang malah bikin orang lari ketakutan?',
    options: [
      { id: 'a', emoji: '🛞', label: 'Ban-ting harga' },
      { id: 'b', emoji: '🛞', label: 'Ban-jir bandang' },
      { id: 'c', emoji: '🛞', label: 'Ban-teng ngamuk' },
      { id: 'd', emoji: '🛞', label: 'Ban-gku patah' },
    ],
    correctOptionId: 'c',
    explanation: 'Ban-teng ngamuk! Coba kalau ketemu banteng ngamuk di jalanan, pasti langsung ngibrit kabur!',
  },
  {
    question: 'Kenapa Superman bajunya ada lambang huruf "S" besar di dada?',
    options: [
      { id: 'a', emoji: '🦸‍♂️', label: 'Singkatan dari Super' },
      { id: 'b', emoji: '🦸‍♂️', label: 'Biar kelihatan macho' },
      { id: 'c', emoji: '🦸‍♂️', label: 'Karena kalau "M" kegedean' },
      { id: 'd', emoji: '🦸‍♂️', label: 'Desain dari emaknya di Krypton' },
    ],
    correctOptionId: 'c',
    explanation: 'Karena kalau pakai ukuran "M" bajunya kegedean, pasnya ukuran "S" (Small)!',
  },
  {
    question: 'Pohon apa yang paling sering diucapkan orang saat Hari Raya Lebaran?',
    options: [
      { id: 'a', emoji: '🌴', label: 'Pohon ketupat' },
      { id: 'b', emoji: '🌴', label: 'Pohon maaf lahir batin' },
      { id: 'c', emoji: '🌴', label: 'Pohon beringin' },
      { id: 'd', emoji: '🌴', label: 'Pohon kurma manis' },
    ],
    correctOptionId: 'b',
    explanation: 'Pohon maaf lahir batin (plesetan mohon maaf lahir dan batin)!',
  },
  {
    question: 'Benda apa yang kalau dipotong bagian bawahnya malah tambah tinggi?',
    options: [
      { id: 'a', emoji: '👖', label: 'Celana panjang' },
      { id: 'b', emoji: '👖', label: 'Tiang bendera' },
      { id: 'c', emoji: '👖', label: 'Tali tambang' },
      { id: 'd', emoji: '👖', label: 'Pohon bambu' },
    ],
    correctOptionId: 'a',
    explanation: 'Celana panjang! Kalau dipotong bawahnya, pas dipake jadi makin tinggi atau ngatung!',
  },
  {
    question: 'Buah apa yang paling sopan dan selalu mempersilakan tamu masuk?',
    options: [
      { id: 'a', emoji: '🥭', label: 'Apel pagi' },
      { id: 'b', emoji: '🥭', label: 'Pisang raja' },
      { id: 'c', emoji: '🥭', label: 'Buah mangga' },
      { id: 'd', emoji: '🥭', label: 'Jeruk pamit' },
    ],
    correctOptionId: 'c',
    explanation: 'Buah mangga! Karena dalam bahasa Sunda "Mangga" artinya "Silakan"!',
  },
  {
    question: 'Penyanyi grup band yang hawanya paling dingin dan bikin meriang?',
    options: [
      { id: 'a', emoji: '🥶', label: 'Coldplay' },
      { id: 'b', emoji: '🥶', label: 'Afgan Salju' },
      { id: 'c', emoji: '🥶', label: 'Judika Kutub' },
      { id: 'd', emoji: '🥶', label: 'Tulus AC' },
    ],
    correctOptionId: 'a',
    explanation: 'Coldplay! Dari namanya aja udah "Cold" (dingin), kalau dengerin wajib pake jaket tebal!',
  },
  {
    question: 'Kutu apa yang paling menyeramkan dan bikin orang merinding?',
    options: [
      { id: 'a', emoji: '🧙‍♀️', label: 'Kutu beras' },
      { id: 'b', emoji: '🧙‍♀️', label: 'Kutu rambut' },
      { id: 'c', emoji: '🧙‍♀️', label: 'Kutu loncat' },
      { id: 'd', emoji: '🧙‍♀️', label: 'Kutu-kan penyihir' },
    ],
    correctOptionId: 'd',
    explanation: 'Kutu-kan penyihir! Kalau kena kutukan bisa langsung berubah jadi kodok!',
  },
  {
    question: 'Kota di Indonesia yang rasanya paling pahit di lidah?',
    options: [
      { id: 'a', emoji: '🏙️', label: 'Salatiga' },
      { id: 'b', emoji: '🏙️', label: 'Pare-pare' },
      { id: 'c', emoji: '🏙️', label: 'Semarang' },
      { id: 'd', emoji: '🏙️', label: 'Pekalongan' },
    ],
    correctOptionId: 'b',
    explanation: 'Kota Parepare! Karena sayur pare terkenal pahit banget kalau dimasak tanpa garam!',
  },
  {
    question: 'Hewan apa yang bersaudara dan selalu akur ke mana-mana bareng?',
    options: [
      { id: 'a', emoji: '🐸', label: 'Katak-beradik' },
      { id: 'b', emoji: '🐸', label: 'Ular tangga' },
      { id: 'c', emoji: '🐸', label: 'Semut rangrang' },
      { id: 'd', emoji: '🐸', label: 'Burung gereja' },
    ],
    correctOptionId: 'a',
    explanation: 'Katak-beradik (plesetan kakak beradik)! Kompak banget gak pernah berantem!',
  },
  {
    question: 'Gajah apa yang belalainya paling pendek di seluruh dunia?',
    options: [
      { id: 'a', emoji: '🐘', label: 'Gajah mini' },
      { id: 'b', emoji: '🐘', label: 'Gajah bungkuk' },
      { id: 'c', emoji: '🐘', label: 'Gajah pesek' },
      { id: 'd', emoji: '🐘', label: 'Gajah sirkus' },
    ],
    correctOptionId: 'c',
    explanation: 'Gajah pesek! Namanya juga pesek, belalainya pasti gak mancung ke depan!',
  },
  {
    question: 'Penyanyi luar negeri yang hobi banget minjem duit ke temennya?',
    options: [
      { id: 'a', emoji: '💸', label: 'Justin Minjem' },
      { id: 'b', emoji: '💸', label: 'Billie Eilish-kan' },
      { id: 'c', emoji: '💸', label: 'Shawn Ngutang' },
      { id: 'd', emoji: '💸', label: 'Drake Bon' },
    ],
    correctOptionId: 'a',
    explanation: 'Justin Minjem (plesetan Justin Bieber)! "Bro, pinjem dulu seratus, besok diganti!"',
  },
  {
    question: 'Ikan apa yang paling cerewet dan gak bisa berhenti ngomong?',
    options: [
      { id: 'a', emoji: '🐟', label: 'Ikan lele kumis' },
      { id: 'b', emoji: '🐟', label: 'Ikan cere' },
      { id: 'c', emoji: '🐟', label: 'Ikan mas koki' },
      { id: 'd', emoji: '🐟', label: 'Ikan tongkol' },
    ],
    correctOptionId: 'b',
    explanation: 'Ikan cere! Karena cere-wet banget dari pagi sampai malem ngoceh mulu!',
  },
  {
    question: 'Penyanyi yang selalu sabar dan gak pernah marah sama siapa pun?',
    options: [
      { id: 'a', emoji: '😇', label: 'Rossa Santai' },
      { id: 'b', emoji: '😇', label: 'Pasrah-band' },
      { id: 'c', emoji: '😇', label: 'Tulus Ikhlas' },
      { id: 'd', emoji: '😇', label: 'Judika Sabar' },
    ],
    correctOptionId: 'c',
    explanation: 'Tulus Ikhlas! Orangnya tulus banget dan ikhlas lahir batin!',
  },
  {
    question: 'Pintu apa yang didorong sama 10 orang kekar pun gak bakal kebuka?',
    options: [
      { id: 'a', emoji: '🚪', label: 'Pintu gerbang istana' },
      { id: 'b', emoji: '🚪', label: 'Pintu bertuliskan TARIK' },
      { id: 'c', emoji: '🚪', label: 'Pintu brankas baja' },
      { id: 'd', emoji: '🚪', label: 'Pintu kapal selam' },
    ],
    correctOptionId: 'b',
    explanation: 'Pintu yang ada tulisan TARIK! Didorong sekuat tenaga juga gak bakal kebuka, harus ditarik!',
  },
  {
    question: 'Bebek apa yang kalau jalan jalannya selalu belok ke kiri terus?',
    options: [
      { id: 'a', emoji: '🦆', label: 'Bebek ngantuk' },
      { id: 'b', emoji: '🦆', label: 'Bebek rem blong' },
      { id: 'c', emoji: '🦆', label: 'Bebek dikunci stang' },
      { id: 'd', emoji: '🦆', label: 'Bebek juling' },
    ],
    correctOptionId: 'c',
    explanation: 'Bebek dikunci stang! Karena stangnya dibelokin ke kiri terus dikunci sama pemiliknya!',
  },
  {
    question: 'Tentara apa yang ukurannya paling kecil di seluruh dunia?',
    options: [
      { id: 'a', emoji: '🪖', label: 'Tentara semut' },
      { id: 'b', emoji: '🪖', label: 'Tentara sekutu' },
      { id: 'c', emoji: '🪖', label: 'Tentara lego' },
      { id: 'd', emoji: '🪖', label: 'Tentara mikro' },
    ],
    correctOptionId: 'b',
    explanation: 'Tentara sekutu! Kutu aja udah kecil banget, ini tentara se-kutu!',
  },
  {
    question: 'Lemari apa yang bisa dimasukkan ke dalam kantong celana jeans?',
    options: [
      { id: 'a', emoji: '👖', label: 'Lemari boneka' },
      { id: 'b', emoji: '👖', label: 'Lemari lipat' },
      { id: 'c', emoji: '👖', label: 'Lemari-buan' },
      { id: 'd', emoji: '👖', label: 'Lemari mini' },
    ],
    correctOptionId: 'c',
    explanation: 'Lemari-buan (Lima ribuan)! Uang kertas lima ribu rupiah pas banget masuk kantong celana!',
  },
  {
    question: 'Sop apa yang kalau dinikmati bikin orang berasa kaya mendadak?',
    options: [
      { id: 'a', emoji: '🍲', label: 'Sop buntut sapi' },
      { id: 'b', emoji: '🍲', label: 'Sop iga bakar' },
      { id: 'c', emoji: '🍲', label: 'Sop-ing di mal mewah' },
      { id: 'd', emoji: '🍲', label: 'Sop kepiting emas' },
    ],
    correctOptionId: 'c',
    explanation: 'Sop-ing (Shopping)! Belanja barang branded sepuasnya kayak sultan!',
  },
  {
    question: 'Minyak apa yang paling disukai dan bikin girang para jomblo?',
    options: [
      { id: 'a', emoji: '👀', label: 'Minyak goreng murah' },
      { id: 'b', emoji: '👀', label: 'Minyak wangi impor' },
      { id: 'c', emoji: '👀', label: 'Minyak-sikan dia putus' },
      { id: 'd', emoji: '👀', label: 'Minyak kayu putih' },
    ],
    correctOptionId: 'c',
    explanation: 'Minyak-sikan (Menyaksikan) dia putus sama pacarnya! Langsung ada celah buat mendekat!',
  },
  {
    question: 'Bel apa yang kalau dibunyiin suaranya bikin orang langsung laper?',
    options: [
      { id: 'a', emoji: '🔔', label: 'Bel sekolah' },
      { id: 'b', emoji: '🔔', label: 'Bel istirahat' },
      { id: 'c', emoji: '🔔', label: 'Bel-i bakso seporsi' },
      { id: 'd', emoji: '🔔', label: 'Bel pintu tetangga' },
    ],
    correctOptionId: 'c',
    explanation: 'Bel-i bakso (Beli bakso)! Apalagi semangkuk bakso urat hangat pas hujan-hujan!',
  },
  {
    question: 'Kera apa yang paling betah nongkrong di atas pohon berjam-jam?',
    options: [
      { id: 'a', emoji: '🐒', label: 'Kera-sukan' },
      { id: 'b', emoji: '🐒', label: 'Kera-san tinggal di sana' },
      { id: 'c', emoji: '🐒', label: 'Kera sakti' },
      { id: 'd', emoji: '🐒', label: 'Kera ngantuk' },
    ],
    correctOptionId: 'b',
    explanation: 'Kera-san (Kerasan alias betah)! Saking nyamannya gak mau turun ke tanah!',
  },
  {
    question: 'Gitar apa yang kalau dipetik bunyinya malah bikin seisi mobil panik?',
    options: [
      { id: 'a', emoji: '🎸', label: 'Gitar listrik bocor' },
      { id: 'b', emoji: '🎸', label: 'Gitar-ik rem mendadak' },
      { id: 'c', emoji: '🎸', label: 'Gitar bas fals' },
      { id: 'd', emoji: '🎸', label: 'Gitar spanyol retak' },
    ],
    correctOptionId: 'b',
    explanation: 'Gitar-ik rem mendadak (Ditarik rem tangan)! Penumpang langsung jantungan!',
  },
  {
    question: 'Kuda apa yang paling bikin orang capek dan mandi keringat?',
    options: [
      { id: 'a', emoji: '🐎', label: 'Kuda balap' },
      { id: 'b', emoji: '🐎', label: 'Kuda lumping' },
      { id: 'c', emoji: '🐎', label: 'Kuda-kudaan push up' },
      { id: 'd', emoji: '🐎', label: 'Kuda nil lari' },
    ],
    correctOptionId: 'c',
    explanation: 'Kuda-kudaan waktu latihan silat atau push up! Kaki gemeteran keringat mengucur!',
  },
  {
    question: 'Batu apa yang paling disayang dan ditunggu sama anak sekolah?',
    options: [
      { id: 'a', emoji: '🪨', label: 'Batu akik' },
      { id: 'b', emoji: '🪨', label: 'Batu kali' },
      { id: 'c', emoji: '🪨', label: 'Batu-tur libur panjang' },
      { id: 'd', emoji: '🪨', label: 'Batu baterai' },
    ],
    correctOptionId: 'c',
    explanation: 'Batu-tur libur (Waktunya libur)! Tanggal merah paling dinanti-nanti!',
  },
  {
    question: 'Ban apa yang kalau kempes gak perlu dibawa ke tukang tambal ban?',
    options: [
      { id: 'a', emoji: '🐟', label: 'Ban mobil derek' },
      { id: 'b', emoji: '🐟', label: 'Ban sepeda ontel' },
      { id: 'c', emoji: '🐟', label: 'Ban-deng presto duri lunak' },
      { id: 'd', emoji: '🐟', label: 'Ban traktor sawah' },
    ],
    correctOptionId: 'c',
    explanation: 'Ban-deng presto (Ikan bandeng presto)! Tinggal dicocol sambal terasi enak banget!',
  },
  {
    question: 'Siapa atlet sepak bola dunia yang hobi banget makan soto ayam?',
    options: [
      { id: 'a', emoji: '⚽', label: 'Soto Ronaldo' },
      { id: 'b', emoji: '⚽', label: 'Lionel Mes-soto' },
      { id: 'c', emoji: '⚽', label: 'Kylian M-soto' },
      { id: 'd', emoji: '⚽', label: 'Erling Soto-land' },
    ],
    correctOptionId: 'b',
    explanation: 'Lionel Mes-soto (Lionel Messi)! Sarapannya selalu soto kuah koya hangat!',
  },
  {
    question: 'Kunci apa yang bisa bikin orang tiba-tiba joget asyik?',
    options: [
      { id: 'a', emoji: '🔑', label: 'Kunci rumah gedong' },
      { id: 'b', emoji: '🔑', label: 'Kunci mobil sport' },
      { id: 'c', emoji: '🔑', label: 'Kunci-pta lagu dangdut' },
      { id: 'd', emoji: '🔑', label: 'Kunci laci kantor' },
    ],
    correctOptionId: 'c',
    explanation: 'Kunci-pta lagu dangdut (Kucipta lagu)! Begitu musik koplo diputar, langsung ikutan goyang!',
  },
];

@Injectable()
export class IcebreakerService {
  // In-memory active icebreaker sessions per board
  private activeSessions = new Map<string, IcebreakerSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pusher: PusherService,
  ) {}

  /**
   * Validasi akses board dan cek apakah user adalah fasilitator/owner
   */
  private async checkFacilitatorAccess(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    const isMember = board.workspace.members.some((m) => m.userId === userId);
    const isOwner = board.workspace.ownerId === userId;
    if (!isMember && !isOwner) {
      throw new ForbiddenException('Anda bukan anggota dari workspace board ini');
    }

    const memberRole = board.workspace.members.find(
      (m) => m.userId === userId,
    )?.role?.toLowerCase();
    const isFacilitator =
      isOwner || ['owner', 'facilitator', 'admin'].includes(memberRole || '');

    return { board, isFacilitator };
  }

  private getGameData(gameType: IcebreakerGameType, index = 0) {
    let title = 'Fakta atau Hoaks?';
    let sets: any[] = FAKTA_HOAKS_SETS;

    if (gameType === 'fakta-hoaks') {
      title = 'Fakta atau Hoaks?';
      sets = FAKTA_HOAKS_SETS;
    } else if (gameType === 'tebak-lagu') {
      title = 'Tebak Lagu dan Artis';
      sets = TEBAK_LAGU_SETS;
    } else if (gameType === 'tebak-film') {
      title = 'Tebak Film dari Emoji';
      sets = TEBAK_FILM_SETS;
    } else if (gameType === 'would-you-rather') {
      title = 'Would You Rather?';
      sets = WOULD_YOU_RATHER_SETS;
    } else if (gameType === 'tebakan-receh') {
      title = 'Tebakan Receh';
      sets = TEBAKAN_RECEH_SETS;
    }

    const currentSet = sets[index % sets.length];
    return {
      title,
      question: currentSet.question,
      options: currentSet.options,
      correctOptionId: currentSet.correctOptionId || undefined,
      explanation: currentSet.explanation || undefined,
      totalSets: sets.length,
    };
  }

  /**
   * Memulai Sesi Icebreaker (Hanya Facilitator)
   */
  async startIcebreaker(
    userId: string,
    boardId: string,
    gameType: IcebreakerGameType,
    totalQuestions: number = 5,
  ) {
    const { isFacilitator } = await this.checkFacilitatorAccess(userId, boardId);
    if (!isFacilitator) {
      throw new ForbiddenException('Hanya fasilitator yang dapat memulai icebreaker');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const userName =
      user?.name || user?.email?.split('@')[0] || 'Fasilitator';

    const initialIndex = Math.floor(Math.random() * 50);
    const gameData = this.getGameData(gameType, initialIndex);
    const safeTotalQuestions = Math.max(1, Math.min(20, Number(totalQuestions) || 5));

    const session: IcebreakerSession = {
      boardId,
      gameType,
      title: gameData.title,
      question: gameData.question,
      options: gameData.options,
      correctOptionId: gameData.correctOptionId,
      explanation: gameData.explanation,
      isRevealed: false,
      roundNumber: 1,
      totalQuestions: safeTotalQuestions,
      startedById: userId,
      startedByName: userName,
      startedAt: new Date().toISOString(),
      votes: {},
      status: 'active',
      currentQuestionIndex: initialIndex,
    };

    this.activeSessions.set(boardId, session);

    // Broadcast ke Pusher Channels
    const channels = [
      `board-${boardId}`,
      `presence-board-${boardId}`,
      `private-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'icebreaker.started', session);
    } catch (err) {
      console.warn('[Pusher] Gagal broadcast icebreaker.started:', err.message);
    }

    return session;
  }

  /**
   * Mengirimkan Pilihan Vote Peserta
   */
  async submitVote(
    userId: string,
    boardId: string,
    optionId: string,
  ) {
    const session = this.activeSessions.get(boardId);
    if (!session || session.status !== 'active') {
      throw new NotFoundException('Tidak ada sesi icebreaker yang sedang aktif di board ini');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, avatarUrl: true },
    });
    const userName =
      user?.name || user?.email?.split('@')[0] || 'Anggota Tim';

    session.votes[userId] = {
      userId,
      userName,
      avatarUrl: user?.avatarUrl || undefined,
      optionId,
    };

    const channels = [
      `board-${boardId}`,
      `presence-board-${boardId}`,
      `private-board-${boardId}`,
    ];

    const votePayload = {
      boardId,
      userId,
      userName,
      avatarUrl: user?.avatarUrl,
      optionId,
      totalVotes: Object.keys(session.votes).length,
      votes: session.votes,
    };

    try {
      await this.pusher.trigger(channels, 'icebreaker.voted', votePayload);
    } catch (err) {
      console.warn('[Pusher] Gagal broadcast icebreaker.voted:', err.message);
    }

    return votePayload;
  }

  /**
   * Buka Kunci Jawaban / Reveal (Hanya Facilitator)
   */
  async revealAnswer(userId: string, boardId: string) {
    const { isFacilitator } = await this.checkFacilitatorAccess(userId, boardId);
    if (!isFacilitator) {
      throw new ForbiddenException('Hanya fasilitator yang dapat membuka jawaban');
    }

    const session = this.activeSessions.get(boardId);
    if (!session || session.status !== 'active') {
      throw new NotFoundException('Tidak ada sesi icebreaker yang sedang aktif');
    }

    session.isRevealed = true;

    const channels = [
      `board-${boardId}`,
      `presence-board-${boardId}`,
      `private-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'icebreaker.revealed', session);
    } catch (err) {
      console.warn('[Pusher] Gagal broadcast icebreaker.revealed:', err.message);
    }

    return session;
  }

  /**
   * Skip / Ganti Pertanyaan (Hanya Facilitator)
   */
  async skipIcebreaker(userId: string, boardId: string) {
    const { isFacilitator } = await this.checkFacilitatorAccess(userId, boardId);
    if (!isFacilitator) {
      throw new ForbiddenException('Hanya fasilitator yang dapat melakukan skip');
    }

    const session = this.activeSessions.get(boardId);
    if (!session || session.status !== 'active') {
      throw new NotFoundException('Tidak ada sesi icebreaker yang sedang aktif');
    }

    const currentRound = session.roundNumber || 1;
    const maxRounds = session.totalQuestions || 5;

    // Jika sudah di pertanyaan terakhir, selesaikan sesi
    if (currentRound >= maxRounds) {
      return this.endIcebreaker(userId, boardId);
    }

    const nextIdx = (session.currentQuestionIndex || 0) + 1;
    const gameData = this.getGameData(session.gameType, nextIdx);

    session.roundNumber = currentRound + 1;
    session.currentQuestionIndex = nextIdx;
    session.title = gameData.title;
    session.question = gameData.question;
    session.options = gameData.options;
    session.correctOptionId = gameData.correctOptionId;
    session.explanation = gameData.explanation;
    session.isRevealed = false;
    session.votes = {};
    session.startedAt = new Date().toISOString();

    const channels = [
      `board-${boardId}`,
      `presence-board-${boardId}`,
      `private-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'icebreaker.skipped', session);
    } catch (err) {
      console.warn('[Pusher] Gagal broadcast icebreaker.skipped:', err.message);
    }

    return session;
  }

  /**
   * Mengakhiri Sesi Icebreaker (Hanya Facilitator)
   */
  async endIcebreaker(userId: string, boardId: string) {
    const { isFacilitator } = await this.checkFacilitatorAccess(userId, boardId);
    if (!isFacilitator) {
      throw new ForbiddenException('Hanya fasilitator yang dapat mengakhiri icebreaker');
    }

    const session = this.activeSessions.get(boardId);
    if (session) {
      session.status = 'ended';
      this.activeSessions.delete(boardId);
    }

    const channels = [
      `board-${boardId}`,
      `presence-board-${boardId}`,
      `private-board-${boardId}`,
    ];

    const endPayload = {
      boardId,
      status: 'ended',
      endedAt: new Date().toISOString(),
    };

    try {
      await this.pusher.trigger(channels, 'icebreaker.ended', endPayload);
    } catch (err) {
      console.warn('[Pusher] Gagal broadcast icebreaker.ended:', err.message);
    }

    return endPayload;
  }

  /**
   * Mendapatkan State Sesi Icebreaker Saat Ini
   */
  async getIcebreakerState(userId: string, boardId: string) {
    await this.checkFacilitatorAccess(userId, boardId);
    const session = this.activeSessions.get(boardId);
    if (!session || session.status !== 'active') {
      return { active: false, session: null };
    }
    return { active: true, session };
  }
}
