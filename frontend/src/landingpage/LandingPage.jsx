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
  Sparkles
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

  // Monitor scroll for navbar shadow and active section
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      const sections = ['beranda', 'fitur', 'harga', 'tentang'];
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

  const handleStartDemo = () => {
    setIsDemoModalOpen(false);
    if (onDirectDashboard) {
      onDirectDashboard();
    } else if (onNavigateRegister) {
      onNavigateRegister();
    }
  };

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

          {/* Navigation Menu */}
          <nav className={`landing-nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
              className={`landing-nav-link ${activeSection === 'harga' ? 'active' : ''}`}
              onClick={() => scrollToSection('harga')}
            >
              Harga
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'tentang' ? 'active' : ''}`}
              onClick={() => scrollToSection('tentang')}
            >
              Tentang
            </button>
          </nav>

          {/* Nav Actions */}
          <div className="landing-nav-actions">
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

            {/* Mobile Hamburger Button */}
            <button 
              type="button" 
              className="mobile-nav-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Image 1 Mockup) */}
      <section className="landing-hero-section">
        <div className="landing-hero-container">
          {/* Sisi Kiri: Headline & CTA */}
          <div className="hero-content">
            {/* Pill Badge */}
            <div className="hero-pill-badge">
              <Zap size={14} />
              <span>Retrospective lebih mudah, tim lebih kuat.</span>
            </div>

            {/* Headline */}
            <h1 className="hero-title">
              Kelola Retrospective<br />
              Tim Kamu dengan<br />
              <span className="hero-title-highlight">Lebih Mudah</span>
            </h1>

            {/* Description */}
            <p className="hero-subtitle">
              RetroNerve adalah platform retrospective modern yang membantu tim kamu merefleksikan, berdiskusi, dan mengambil tindakan dengan lebih efektif.
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
                <span>Lihat Demo</span>
              </button>
            </div>

            {/* Trust Indicators / Checklist */}
            <div className="hero-trust-row">
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
                <span>Setup dalam 1 Menit</span>
              </div>

              <div className="hero-trust-item">
                <div className="trust-check-icon">
                  <Check size={12} strokeWidth={3.5} />
                </div>
                <span>Akses di Semua Perangkat</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Visual Mockup (retro2.jpeg) */}
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

      {/* 3. Highlights Bar: 5 Feature Items (Image 2 Mockup) */}
      <section className="landing-highlights-section" id="fitur">
        <div className="landing-highlights-container">
          {/* Item 1: Board Interaktif */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Kanban size={24} />
            </div>
            <h3 className="highlight-title">Board Interaktif</h3>
            <p className="highlight-desc">
              Kelola board dengan tampilan yang intuitif dan mudah digunakan.
            </p>
          </div>

          {/* Item 2: Kolaborasi Real-time */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Users size={24} />
            </div>
            <h3 className="highlight-title">Kolaborasi Real-time</h3>
            <p className="highlight-desc">
              Semua anggota tim bisa berdiskusi dalam waktu yang sama.
            </p>
          </div>

          {/* Item 3: Template Siap Pakai */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Zap size={24} />
            </div>
            <h3 className="highlight-title">Template Siap Pakai</h3>
            <p className="highlight-desc">
              Pilih dari berbagai template retrospective yang sudah tersedia.
            </p>
          </div>

          {/* Item 4: Akses Aman */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <Lock size={24} />
            </div>
            <h3 className="highlight-title">Akses Aman</h3>
            <p className="highlight-desc">
              Setup board memakai URL, link dengan sistem keamanan yang kuat.
            </p>
          </div>

          {/* Item 5: Laporan & Insight */}
          <div className="highlight-card">
            <div className="highlight-icon-box">
              <BarChart3 size={24} />
            </div>
            <h3 className="highlight-title">Laporan & Insight</h3>
            <p className="highlight-desc">
              Lacak action item dan perkembangan tim dengan mudah.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Fitur Utama Showcase (Image 3 Mockup) */}
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
              Dari pemilihan template hingga pelacakan action item, RetroNerve menyediakan semua fitur yang kamu butuhkan dalam satu platform.
            </p>

            <div className="showcase-checklist">
              <div className="showcase-check-item">
                <div className="showcase-check-circle">
                  <Check size={14} strokeWidth={3.5} />
                </div>
                <span>Icebreaker untuk memulai sesi dengan hangat dan santai</span>
              </div>

              <div className="showcase-check-item">
                <div className="showcase-check-circle">
                  <Check size={14} strokeWidth={3.5} />
                </div>
                <span>Mode presentasi untuk memfokuskan diskusi</span>
              </div>

              <div className="showcase-check-item">
                <div className="showcase-check-circle">
                  <Check size={14} strokeWidth={3.5} />
                </div>
                <span>Notifikasi action item yang belum selesai</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Visual Mockup (retro1.jpeg) */}
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

      {/* 7. Footer */}
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
              Platform agile retrospective modern untuk meningkatkan kinerja, transparansi, dan kesehatan tim secara berkelanjutan.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-links-col">
              <h4>Navigasi</h4>
              <ul>
                <li><button type="button" onClick={() => scrollToSection('beranda')}>Beranda</button></li>
                <li><button type="button" onClick={() => scrollToSection('fitur')}>Fitur</button></li>
                <li><button type="button" onClick={() => scrollToSection('harga')}>Harga</button></li>
                <li><button type="button" onClick={() => scrollToSection('tentang')}>Tentang</button></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Akses Akun</h4>
              <ul>
                <li><button type="button" onClick={onNavigateLogin}>Masuk ke Akun</button></li>
                <li><button type="button" onClick={onNavigateRegister}>Daftar Gratis</button></li>
                <li><button type="button" onClick={() => setIsDemoModalOpen(true)}>Eksplor Demo</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} RetroNerve. Hak Cipta Dilindungi Undang-Undang.</span>
          <span>Dibuat dengan dedikasi untuk produktivitas tim.</span>
        </div>
      </footer>

      {/* 8. Demo Preview Modal */}
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
              Rasakan pengalaman langsung berkolaborasi di board retrospective dengan template Start-Stop-Continue, vote ide, dan lacak action item tanpa perlu mendaftar.
            </p>

            <div className="demo-modal-actions">
              <button 
                type="button" 
                className="btn-hero-primary"
                onClick={handleStartDemo}
              >
                <span>Buka Demo Board Langsung</span>
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
