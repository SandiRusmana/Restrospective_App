import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Play, 
  Check, 
  CheckCircle2, 
  Kanban, 
  Users, 
  Lock, 
  BarChart3, 
  ShieldCheck, 
  Menu, 
  X,
  Sparkles,
  ChevronDown,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';
import '../styles/landingpage.css';
import retro1Img from '../assets/retro1.jpeg';
import retro2Img from '../assets/retro2.jpeg';

export default function LandingPage({ 
  onNavigateLogin, 
  onNavigateRegister, 
  onDirectDashboard 
}) {
  const [activeSection, setActiveSection] = useState('beranda');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isStartingDemo, setIsStartingDemo] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Monitor scroll for navbar shadow and active section
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      const sections = ['beranda', 'fitur', 'alur', 'tentang', 'faq'];
      const scrollPosition = window.scrollY + 180;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartDemo = async () => {
    if (isStartingDemo) return;
    setIsStartingDemo(true);
    try {
      if (onDirectDashboard) {
        await onDirectDashboard();
      } else if (onNavigateRegister) {
        onNavigateRegister();
      }
      setIsDemoModalOpen(false);
      setIsMobileMenuOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsStartingDemo(false);
    }
  };

  const faqItems = [
    {
      q: 'Apakah RetroNerve benar-benar gratis untuk seluruh tim?',
      a: 'Ya, 100% gratis! Tidak ada biaya langganan bulanan, batas anggota tim, ataupun fitur berbayar yang dikunci. Anda bebas membuat workspace dan board retrospective sebanyak yang dibutuhkan tim Anda.'
    },
    {
      q: 'Bagaimana cara kerja Mode Privat saat tim menulis catatan?',
      a: 'Saat sesi menulis catatan berlangsung, tulisan seluruh peserta akan otomatis disamarkan (blurred). Peserta tidak dapat saling melihat ide sebelum fasilitator menekan tombol "Reveal Cards", mencegah bias dan keseragaman pemikiran (groupthink).'
    },
    {
      q: 'Bagaimana jika action item dari sesi sebelumnya belum selesai?',
      a: 'RetroNerve secara otomatis merangkum action item pending dari sesi sebelumnya di bagian atas board baru. Tim dapat langsung meninjau, mengubah status, atau memperbarui due date tanpa kehilangan jejak perbaikan.'
    },
    {
      q: 'Apakah pembaruan di board tersinkronisasi secara real-time?',
      a: 'Ya! Sistem didukung koneksi websocket realtime (Pusher). Setiap penambahan kartu, voting ide, komentar, timer fasilitator, hingga perubahan status action item langsung muncul seketika di layar seluruh rekan tim.'
    },
    {
      q: 'Apakah tim harus menginstal aplikasi tambahan di HP atau Laptop?',
      a: 'Tidak perlu instalasi apapun. RetroNerve adalah web app modern yang responsif dan dapat diakses langsung dari browser di laptop, tablet, maupun smartphone.'
    }
  ];

  return (
    <div className="landing-page" id="beranda">
      {/* 1. Navbar */}
      <header className={`landing-navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-navbar">
          {/* Brand Logo */}
          <button 
            type="button" 
            className="landing-brand"
            onClick={() => scrollToSection('beranda')}
          >
            <div className="landing-brand-icon">
              <Zap size={22} fill="#ffffff" strokeWidth={0} />
            </div>
            <span className="landing-brand-name">RetroNerve</span>
          </button>

          {/* Navigation Menu (Desktop) */}
          <nav className="landing-nav-links desktop-nav">
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'beranda' ? 'active' : ''}`}
              onClick={() => scrollToSection('beranda')}
            >
              Beranda
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'fitur' ? 'active' : ''}`}
              onClick={() => scrollToSection('fitur')}
            >
              Fitur
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'alur' ? 'active' : ''}`}
              onClick={() => scrollToSection('alur')}
            >
              Cara Kerja
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'tentang' ? 'active' : ''}`}
              onClick={() => scrollToSection('tentang')}
            >
              Tentang
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'faq' ? 'active' : ''}`}
              onClick={() => scrollToSection('faq')}
            >
              FAQ
            </button>
          </nav>

          {/* Nav Actions (Desktop) */}
          <div className="landing-nav-actions desktop-actions">
            <button 
              type="button" 
              className="btn-nav-login" 
              onClick={onNavigateLogin}
            >
              Masuk
            </button>
            <button 
              type="button" 
              className="btn-nav-register" 
              onClick={onNavigateRegister}
            >
              Daftar Gratis
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            type="button" 
            className="mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Buka Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <div className="mobile-nav-links">
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'beranda' ? 'active' : ''}`}
                onClick={() => scrollToSection('beranda')}
              >
                Beranda
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'fitur' ? 'active' : ''}`}
                onClick={() => scrollToSection('fitur')}
              >
                Fitur Unggulan
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'alur' ? 'active' : ''}`}
                onClick={() => scrollToSection('alur')}
              >
                Cara Kerja
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'tentang' ? 'active' : ''}`}
                onClick={() => scrollToSection('tentang')}
              >
                Tentang Platform
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'faq' ? 'active' : ''}`}
                onClick={() => scrollToSection('faq')}
              >
                Pertanyaan Umum (FAQ)
              </button>
            </div>

            <div className="mobile-nav-divider" />

            <div className="mobile-nav-actions">
              <button 
                type="button" 
                className="btn-mobile-login" 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigateLogin?.();
                }}
              >
                Masuk ke Akun
              </button>
              <button 
                type="button" 
                className="btn-mobile-register" 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigateRegister?.();
                }}
              >
                Daftar Akun Gratis
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-container">
          {/* Sisi Kiri: Headline & CTA */}
          <div className="hero-content">
            {/* Pill Badge */}
            <div className="hero-pill-badge">
              <Zap size={14} />
              <span>Platform Retrospective Kolaboratif & Real-time</span>
            </div>

            {/* Headline */}
            <h1 className="hero-title">
              Kelola Retrospective<br />
              Tim Kamu dengan<br />
              <span className="hero-title-highlight">Lebih Mudah</span>
            </h1>

            {/* Description */}
            <p className="hero-subtitle">
              RetroNerve adalah platform agile retrospective modern yang membantu tim kamu merefleksikan sprint, voting ide secara transparan, dan mengeksekusi action item hingga tuntas.
            </p>

            {/* CTA Group */}
            <div className="hero-cta-group">
              <button 
                type="button" 
                className="btn-hero-primary"
                onClick={onNavigateRegister}
              >
                <span>Mulai Gratis Sekarang</span>
                <ArrowRight size={18} />
              </button>

              <button 
                type="button" 
                className="btn-hero-secondary"
                onClick={() => setIsDemoModalOpen(true)}
              >
                <Play size={16} fill="currentColor" strokeWidth={0} />
                <span>Lihat Demo Board</span>
              </button>
            </div>

            {/* Trust Indicators / Checklist */}
            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <div className="trust-check-icon">
                  <Check size={12} strokeWidth={3.5} />
                </div>
                <span>100% Gratis Selamanya</span>
              </div>

              <div className="hero-trust-item">
                <div className="trust-check-icon">
                  <Check size={12} strokeWidth={3.5} />
                </div>
                <span>Tanpa Kartu Kredit</span>
              </div>

              <div className="hero-trust-item">
                <div className="trust-check-icon">
                  <Check size={12} strokeWidth={3.5} />
                </div>
                <span>Real-time Sync</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Visual Mockup */}
          <div className="hero-visual-wrapper">
            <div className="hero-visual-glow"></div>
            <img 
              src={retro2Img} 
              alt="RetroNerve Board Preview" 
              className="hero-mockup-img"
              onClick={() => setIsDemoModalOpen(true)}
            />
          </div>
        </div>
      </section>

      {/* 3. Highlights Bar: 5 Feature Items */}
      <section className="landing-highlights-section" id="fitur">
        <div className="landing-highlights-container">
          {/* Item 1: Board Interaktif */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Kanban size={24} />
            </div>
            <h3 className="highlight-title">Board Interaktif</h3>
            <p className="highlight-desc">
              Kelola kolom retro dengan drag & drop, warna fleksibel, dan pengelompokan ide.
            </p>
          </div>

          {/* Item 2: Kolaborasi Real-time */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Users size={24} />
            </div>
            <h3 className="highlight-title">Kolaborasi Real-time</h3>
            <p className="highlight-desc">
              Semua anggota tim berdiskusi dan melihat perubahan kartu dalam detik yang sama.
            </p>
          </div>

          {/* Item 3: Template Siap Pakai */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Layers size={24} />
            </div>
            <h3 className="highlight-title">Template Siap Pakai</h3>
            <p className="highlight-desc">
              Gunakan Start-Stop-Continue, Mad-Sad-Glad, 4Ls, hingga Sailboat secara instan.
            </p>
          </div>

          {/* Item 4: Mode Privat & Anonim */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Lock size={24} />
            </div>
            <h3 className="highlight-title">Privat & Anonim</h3>
            <p className="highlight-desc">
              Sembunyikan kartu sebelum di-reveal agar feedback jujur tanpa rasa sungkan.
            </p>
          </div>

          {/* Item 5: Action Items & Due Date */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <BarChart3 size={24} />
            </div>
            <h3 className="highlight-title">Action Items Terlacak</h3>
            <p className="highlight-desc">
              Lacak tugas, penanggung jawab, dan tenggat waktu hingga sesi sprint berikutnya.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Fitur Utama Showcase */}
      <section className="landing-showcase-section">
        <div className="landing-showcase-container">
          {/* Sisi Kiri: Content & Checklist */}
          <div className="showcase-content">
            <div className="showcase-pill-badge">
              FITUR UTAMA
            </div>

            <h2 className="showcase-title">
              Semua yang Kamu Butuhkan untuk Retrospective yang Efektif
            </h2>

            <p className="showcase-subtitle">
              Dari pemilihan template hingga pelacakan action item ber-tenggat waktu, RetroNerve menyediakan sarana komprehensif bagi tim agile.
            </p>

            <div className="showcase-checklist">
              <div className="showcase-check-item">
                <div className="showcase-check-circle">
                  <Check size={14} strokeWidth={3.5} />
                </div>
                <span>Icebreaker seru untuk mencairkan suasana sebelum evaluasi</span>
              </div>

              <div className="showcase-check-item">
                <div className="showcase-check-circle">
                  <Check size={14} strokeWidth={3.5} />
                </div>
                <span>Timer terpusat dan mode presentasi agar diskusi terarah</span>
              </div>

              <div className="showcase-check-item">
                <div className="showcase-check-circle">
                  <Check size={14} strokeWidth={3.5} />
                </div>
                <span>Review otomatis action item yang belum tuntas dari sesi sebelumnya</span>
              </div>

              <div className="showcase-check-item">
                <div className="showcase-check-circle">
                  <Check size={14} strokeWidth={3.5} />
                </div>
                <span>Notifikasi tugas penugasan dan pengingat deadline terlambat</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Visual Mockup */}
          <div className="showcase-visual-wrapper">
            <img 
              src={retro1Img} 
              alt="RetroNerve Feature Showcase" 
              className="showcase-mockup-img"
              onClick={() => setIsDemoModalOpen(true)}
            />
          </div>
        </div>
      </section>

      {/* 5. Alur Kerja (Cara Kerja 4 Langkah) */}
      <section className="landing-alur-section" id="alur">
        <div className="landing-section-container">
          <div className="section-header">
            <div className="section-pill-badge">CARA KERJA</div>
            <h2 className="section-title">4 Langkah Menjalankan Sesi yang Terarah</h2>
            <p className="section-desc">
              Dari pengumpulan masukan hingga eksekusi nyata, alur RetroNerve dirancang sistematis agar waktu tim lebih efisien dan bermakna.
            </p>
          </div>

          <div className="alur-steps-grid">
            <div className="alur-step-card">
              <div className="alur-step-header">
                <span className="alur-step-number">01</span>
                <div className="alur-step-icon-box">
                  <Kanban size={20} />
                </div>
              </div>
              <h3 className="alur-step-title">Pilih Template Sesi</h3>
              <p className="alur-step-desc">
                Gunakan template populer seperti <em>Start-Stop-Continue</em>, <em>Mad-Sad-Glad</em>, <em>4Ls</em>, atau <em>Sailboat</em> dalam sekali klik.
              </p>
            </div>

            <div className="alur-step-card">
              <div className="alur-step-header">
                <span className="alur-step-number">02</span>
                <div className="alur-step-icon-box">
                  <Lock size={20} />
                </div>
              </div>
              <h3 className="alur-step-title">Tulis Opini Secara Privat</h3>
              <p className="alur-step-desc">
                Mode privat menyamarkan isi kartu sebelum reveal agar setiap anggota bebas menuangkan evaluasi jujur tanpa rasa sungkan.
              </p>
            </div>

            <div className="alur-step-card">
              <div className="alur-step-header">
                <span className="alur-step-number">03</span>
                <div className="alur-step-icon-box">
                  <Users size={20} />
                </div>
              </div>
              <h3 className="alur-step-title">Reveal & Voting Bersama</h3>
              <p className="alur-step-desc">
                Buka seluruh kartu serentak, diskusikan bersama, satukan topik senada, dan vote poin yang paling mendesak untuk dibenahi.
              </p>
            </div>

            <div className="alur-step-card">
              <div className="alur-step-header">
                <span className="alur-step-number">04</span>
                <div className="alur-step-icon-box">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <h3 className="alur-step-title">Buat Action Item & PIC</h3>
              <p className="alur-step-desc">
                Ubah kesimpulan jadi aksi nyata ber-PIC dan ber-tenggat waktu (due date), yang otomatis dipantau di sesi sprint berikutnya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Tentang RetroNerve & Nilai Utama */}
      <section className="landing-tentang-section" id="tentang">
        <div className="landing-section-container">
          <div className="tentang-wrapper">
            <div className="tentang-content">
              <div className="section-pill-badge">TENTANG RETRONERVE</div>
              <h2 className="section-title">Dibuat Khusus untuk Budaya Tim yang Terus Berkembang</h2>
              <p className="tentang-paragraph">
                RetroNerve lahir dari kebutuhan praktis tim agile yang menginginkan sesi evaluasi sprint yang menyenangkan, transparan, dan tidak berhenti hanya sebagai obrolan tanpa aksi.
              </p>
              <p className="tentang-paragraph">
                Kami percaya refleksi tim tidak boleh dibatasi oleh biaya langganan software yang mahal. Karena itu, RetroNerve disediakan <strong>100% gratis</strong> agar tim dari berbagai skala dapat menikmati kolaborasi profesional.
              </p>

              <div className="tentang-values-list">
                <div className="tentang-val-item">
                  <div className="tentang-val-icon">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="tentang-val-title">100% Gratis Selamanya</h4>
                    <p className="tentang-val-desc">Akses bebas ke semua fitur, workspace, dan template tanpa batasan akun atau biaya tersembunyi.</p>
                  </div>
                </div>

                <div className="tentang-val-item">
                  <div className="tentang-val-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="tentang-val-title">Kebebasan & Kejujuran Berpendapat</h4>
                    <p className="tentang-val-desc">Didukung mode privat dan opsi anonim agar anggota tim dapat menyampaikan kritik membangun dengan nyaman.</p>
                  </div>
                </div>

                <div className="tentang-val-item">
                  <div className="tentang-val-icon">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="tentang-val-title">Sinkronisasi Realtime Tanpa Hambatan</h4>
                    <p className="tentang-val-desc">Pembaruan kartu, voting, timer fasilitator, dan due date terkirim otomatis secara instan ke layar seluruh tim.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="landing-faq-section" id="faq">
        <div className="landing-section-container">
          <div className="section-header">
            <div className="section-pill-badge">PERTANYAAN UMUM</div>
            <h2 className="section-title">Kerap Ditanyakan Seputar RetroNerve</h2>
            <p className="section-desc">
              Punya pertanyaan seputar cara penggunaan dan kemampuan RetroNerve? Temukan rangkuman jawabannya di bawah.
            </p>
          </div>

          <div className="faq-accordion-list">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button 
                    type="button" 
                    className="faq-question-btn"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">{faq.q}</span>
                    <ChevronDown size={18} className={`faq-chevron ${isOpen ? 'rotated' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CTA Banner Sebelum Footer */}
      <section className="landing-cta-banner-section">
        <div className="landing-cta-banner">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">Siap Tingkatkan Kualitas Sprint & Produktivitas Tim?</h2>
            <p className="cta-banner-desc">
              Mulai sesi retrospective tim kamu sekarang juga. 100% gratis, tanpa kartu kredit, dan langsung siap dipakai dalam hitungan detik.
            </p>
          </div>
          <div className="cta-banner-actions">
            <button 
              type="button" 
              className="btn-banner-primary"
              onClick={onNavigateRegister}
            >
              Mulai Gratis Sekarang
            </button>
            <button 
              type="button" 
              className="btn-banner-secondary"
              onClick={() => setIsDemoModalOpen(true)}
            >
              Lihat Demo Board
            </button>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-brand-col">
            <div className="landing-brand">
              <div className="landing-brand-icon">
                <Zap size={20} fill="#ffffff" strokeWidth={0} />
              </div>
              <span className="landing-brand-name">RetroNerve</span>
            </div>
            <p className="footer-brand-desc">
              Platform agile retrospective modern untuk meningkatkan transparansi, pemecahan masalah, dan kekompakan tim secara berkelanjutan.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-links-col">
              <h4>Navigasi</h4>
              <ul>
                <li><button type="button" onClick={() => scrollToSection('beranda')}>Beranda</button></li>
                <li><button type="button" onClick={() => scrollToSection('fitur')}>Fitur Unggulan</button></li>
                <li><button type="button" onClick={() => scrollToSection('alur')}>Cara Kerja</button></li>
                <li><button type="button" onClick={() => scrollToSection('tentang')}>Tentang</button></li>
                <li><button type="button" onClick={() => scrollToSection('faq')}>FAQ</button></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Akses Akun</h4>
              <ul>
                <li><button type="button" onClick={onNavigateLogin}>Masuk ke Akun</button></li>
                <li><button type="button" onClick={onNavigateRegister}>Daftar Gratis</button></li>
                <li><button type="button" onClick={() => setIsDemoModalOpen(true)}>Eksplor Demo Board</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} RetroNerve. 100% Gratis untuk Seluruh Tim.</span>
          <span>Dibuat dengan dedikasi untuk produktivitas tim agile.</span>
        </div>
      </footer>

      {/* 10. Demo Preview Modal */}
      {isDemoModalOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsDemoModalOpen(false)}>
          <div className="demo-modal-card" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="demo-modal-close"
              onClick={() => setIsDemoModalOpen(false)}
            >
              <X size={18} />
            </button>

            <div className="demo-modal-icon">
              <Sparkles size={28} />
            </div>

            <h3 className="demo-modal-title">Eksplor Demo RetroNerve</h3>
            <p className="demo-modal-desc">
              Rasakan pengalaman langsung berkolaborasi di board retrospective dengan template Start-Stop-Continue, voting ide, dan action items ber-due date tanpa perlu mendaftar.
            </p>

            <div className="demo-modal-actions">
              <button 
                type="button" 
                className="btn-hero-primary"
                onClick={handleStartDemo}
                disabled={isStartingDemo}
              >
                <span>{isStartingDemo ? 'Menyiapkan Demo Board...' : 'Buka Demo Board Langsung'}</span>
                <ArrowRight size={18} />
              </button>
              <button 
                type="button" 
                className="btn-hero-secondary"
                onClick={() => setIsDemoModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
