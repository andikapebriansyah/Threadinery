"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { InteractiveHeroGraph } from "@/components/InteractiveHeroGraph";
import { AuthModal } from "@/components/AuthModal";
import { ThreadinaryLogo } from "@/components/ThreadinaryLogo";

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -30]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.5]);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const openAuth = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300 relative overflow-x-hidden">
      {/* Top Navbar */}
      <header className="nav sticky top-0 z-50 backdrop-blur-md border-b border-[var(--border)]"
        style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}>
        <div className="max-w-[1180px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <ThreadinaryLogo size="md" href="/" />

          <nav className="hidden md:flex items-center gap-9 text-[14.5px] font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text)] transition-colors">Fitur</a>
            <a href="#how" className="hover:text-[var(--text)] transition-colors">Cara kerja</a>
            <a href="#for-you" className="hover:text-[var(--text)] transition-colors">Untuk siapa</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="theme-toggle"
              id="themeToggle"
              aria-label="Ganti tema"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg
                  id="themeIcon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg
                  id="themeIcon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>

            <button
              className="btn btn-ghost"
              onClick={() => openAuth("login")}
            >
              Masuk
            </button>
            <button
              className="btn btn-primary"
              onClick={() => openAuth("register")}
            >
              Mulai gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Interactive Background Graph */}
      <section className="relative min-h-[82vh] flex items-center justify-center pt-14 pb-16 overflow-hidden">
        {/* Interactive Graph Canvas Component */}
        <InteractiveHeroGraph />

        {/* Hero Central Content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="wrap relative z-20 text-center max-w-3xl mx-auto px-4 pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow inline-flex items-center gap-2 mb-6">
              <span className="eyebrow-dot" />
              Untuk penulis novel, cerpen &amp; game master
            </span>

            <h1 className="text-4xl md:text-6xl font-serif font-semibold leading-tight tracking-tight mb-6 text-[var(--text)] drop-shadow-sm">
              Bangun duniamu.
              <br />
              Lihat <em className="italic text-[var(--accent)] font-serif">bagaimana</em>
              <br />
              semuanya terhubung.
            </h1>

            <p className="lead text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-8">
              Satu tempat untuk karakter, lokasi, event, dan garis waktu ceritamu — dengan graph yang menemukan koneksi tersembunyi, bukan cuma menggambar yang sudah kamu tahu.
            </p>

            <div className="hero-ctas justify-center gap-4 flex flex-wrap mb-4">
              <button
                className="btn btn-primary btn-lg px-8 py-3.5 text-base shadow-lg"
                onClick={() => openAuth("register")}
              >
                Mulai bangun duniamu
              </button>
              <a href="#how" className="btn btn-ghost btn-lg px-8 py-3.5 text-base">
                Lihat cara kerjanya
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="problem py-20 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-head text-center max-w-2xl mx-auto mb-12"
          >
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
              Masalahnya
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
              Sticky note dan spreadsheet cepat kehabisan tempat
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Semakin besar duniamu, semakin sulit mengingat siapa terhubung dengan siapa — dan tools yang ada cuma menggambar apa yang sudah kamu ketahui.
            </p>
          </motion.div>

          <div className="problem-grid grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)]">
            {[
              {
                num: "Sebelum",
                title: "Detail tercecer di banyak tempat",
                desc: "Karakter di satu dokumen, garis waktu di dokumen lain, peta cuma di kepala. Tidak ada yang saling nyambung.",
              },
              {
                num: "Sebelum",
                title: "Template yang terlalu kaku",
                desc: "Form karakter dengan 40 field wajib, padahal kamu baru butuh nama dan satu kalimat deskripsi hari ini.",
              },
              {
                num: "Sebelum",
                title: "Koneksi tersembunyi tak pernah ketemu",
                desc: "Dua karakter yang diam-diam sama-sama dekat dengan tokoh ketiga — dan kamu baru sadar setelah 200 halaman.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="problem-cell bg-[var(--surface)] p-8"
              >
                <span className="num font-serif italic text-[var(--rose)] text-sm mb-3 block">
                  {item.num}
                </span>
                <h3 className="text-lg font-semibold mb-2 font-serif">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-head text-center max-w-2xl mx-auto mb-16"
          >
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
              Satu sumber data, banyak cara melihat
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
              Semua terhubung, karena memang berasal dari data yang sama
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Entity, relationship, dan event yang kamu catat sekali — muncul otomatis di graph, timeline, family tree, peta, dan outline.
            </p>
          </motion.div>

          <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                iconClass: "ic-clay",
                title: "Relationship graph",
                desc: "Lihat setiap karakter, lokasi, dan objek sebagai simpul yang saling terhubung — klik untuk menelusuri.",
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="18" cy="6" r="3" />
                    <circle cx="12" cy="18" r="3" />
                    <path d="M8.5 7.5 15 16.5M15.5 7.5 9 16.5" />
                  </svg>
                ),
              },
              {
                iconClass: "ic-sage",
                title: "Timeline dunia",
                desc: "Event tersusun otomatis secara kronologis, difilter per karakter atau per buku kapan saja kamu mau.",
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h4l2-6 4 12 2-6h6" />
                  </svg>
                ),
              },
              {
                iconClass: "ic-rose",
                title: "Family tree",
                desc: "Diturunkan otomatis dari relationship parent/child yang sudah kamu catat — tanpa input dobel.",
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v6M12 15v6M5 9h14M7 15h10" />
                    <circle cx="12" cy="9" r="2.5" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                ),
              },
              {
                iconClass: "ic-sage",
                title: "Peta custom",
                desc: "Unggah peta duniamu sendiri, taruh penanda ke entity — klik penanda untuk lihat detailnya.",
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3Z" />
                    <path d="M9 3v15M15 6v15" />
                  </svg>
                ),
              },
              {
                iconClass: "ic-clay",
                title: "Outline bebas format",
                desc: "Tulis satu kalimat per bab atau dua halaman penuh — outline mengikuti gaya menulismu, bukan sebaliknya.",
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h10M4 18h13" />
                  </svg>
                ),
              },
              {
                iconClass: "ic-rose",
                title: "Multi-buku, satu dunia",
                desc: "Sequel berbagi world yang sama — tidak perlu input ulang karakter dan lokasi dari nol.",
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                ),
              },
            ].map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="feature-card"
              >
                <div className={`feature-icon ${f.iconClass}`}>{f.svg}</div>
                <h3 className="text-lg font-semibold mb-2 font-serif">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiator Section */}
      <section className="differentiator py-24 bg-[var(--surface)] border-y border-[var(--border)]" id="how">
        <div className="wrap grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="diff-copy"
          >
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
              Yang membedakan Threadinery
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4 leading-snug">
              Threadinery ikut menemukan koneksi yang belum kamu sadari
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
              Dua entity yang sama-sama terhubung ke entity ketiga — misalnya dua karakter yang sama-sama "menyukai kucing" — otomatis terdeteksi dan digambar berbeda dari relationship yang kamu buat sendiri.
            </p>
            <ul className="diff-list flex flex-col gap-3">
              {[
                "Garis solid untuk relationship yang eksplisit kamu buat.",
                "Garis putus-putus untuk koneksi yang ditemukan sistem — bisa dinyalakan/dimatikan kapan saja.",
                "Tidak perlu form tambahan — koneksi ini muncul sendiri dari data yang sudah kamu catat.",
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-sm text-[var(--text)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="w-5 h-5 text-[var(--sage)] shrink-0 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="diff-panel bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-lg p-6"
          >
            <div className="diff-panel-head flex items-center justify-between gap-4 mb-4">
              <span className="font-serif font-semibold text-base">
                Graph — Kerajaan Ashmoor
              </span>
              <div className="legend flex gap-4 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <i className="line w-4 h-0 border-t-2 border-[var(--text)] inline-block" />
                  Eksplisit
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="line dashed w-4 h-0 border-t-2 border-dashed border-[var(--accent)] inline-block" />
                  Ditemukan
                </span>
              </div>
            </div>

            <svg viewBox="0 0 420 260" className="w-full">
              <line x1="70" y1="60" x2="210" y2="40" stroke="var(--text-secondary)" strokeWidth="1.6" opacity="0.55" />
              <line x1="70" y1="60" x2="90" y2="190" stroke="var(--text-secondary)" strokeWidth="1.6" opacity="0.55" />
              <line x1="350" y1="70" x2="210" y2="40" stroke="var(--text-secondary)" strokeWidth="1.6" opacity="0.55" />
              <line x1="350" y1="70" x2="300" y2="200" stroke="var(--text-secondary)" strokeWidth="1.6" opacity="0.55" />
              <line x1="90" y1="190" x2="300" y2="200" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 5">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.4s" repeatCount="indefinite" />
              </line>

              <g>
                <circle cx="70" cy="60" r="20" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.2" />
                <text x="70" y="64" textAnchor="middle" fontSize="9.5" fill="var(--text)" fontWeight="600">Elira</text>
              </g>
              <g>
                <circle cx="210" cy="40" r="18" fill="var(--surface)" stroke="var(--sage)" strokeWidth="2.2" />
                <text x="210" y="44" textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="600">Kucing Hitam</text>
              </g>
              <g>
                <circle cx="350" cy="70" r="20" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.2" />
                <text x="350" y="74" textAnchor="middle" fontSize="9.5" fill="var(--text)" fontWeight="600">Kael</text>
              </g>
              <g>
                <circle cx="90" cy="190" r="18" fill="var(--surface)" stroke="var(--rose)" strokeWidth="2.2" />
                <text x="90" y="194" textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="600">Kedai Teh</text>
              </g>
              <g>
                <circle cx="300" cy="200" r="18" fill="var(--surface)" stroke="var(--rose)" strokeWidth="2.2" />
                <text x="300" y="204" textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="600">Pasar Malam</text>
              </g>
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Audience Section */}
      <section id="for-you" className="py-24">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-head text-center max-w-2xl mx-auto mb-16"
          >
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
              Untuk siapa pun gaya menulismu
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
              Plotter atau pantser, Threadinery mengikuti caramu bekerja
            </h2>
          </motion.div>

          <div className="audience-grid grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="audience-card border border-[var(--border)] rounded-2xl p-8 bg-[var(--surface)]"
            >
              <span className="tag tag-plotter inline-block text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-4 bg-[var(--accent-soft)] text-[var(--accent)]">
                Plotter
              </span>
              <h3 className="text-xl font-serif font-semibold mb-3">Petakan semuanya sebelum menulis</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Detailkan setiap karakter, timeline, dan event sejak awal. Custom properties mengikuti sistem duniamu sendiri — bukan skema yang dipaksakan.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="audience-card border border-[var(--border)] rounded-2xl p-8 bg-[var(--surface)]"
            >
              <span className="tag tag-pantser inline-block text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-4 bg-[var(--sage-soft)] text-[var(--sage)]">
                Pantser
              </span>
              <h3 className="text-xl font-serif font-semibold mb-3">Tulis dulu, rapikan belakangan</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Outline bebas tanpa struktur kaku. Tandai jadi Event kapan pun kamu siap — dunia tetap rapi tanpa kerja administratif ekstra.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-12">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="cta-band bg-[var(--text)] text-[var(--bg)] rounded-3xl p-12 md:p-16 text-center relative overflow-hidden shadow-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4 text-inherit">
              Mulai petakan duniamu hari ini
            </h2>
            <button
              className="btn btn-primary btn-lg px-8 py-3.5 text-base bg-[var(--bg)] text-[var(--text)] border-none shadow-lg hover:opacity-90 mt-4"
              onClick={() => openAuth("register")}
            >
              Mulai bangun duniamu
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-[var(--border)] mt-12">
        <div className="wrap footer-inner flex flex-wrap justify-between gap-8">
          <div>
            <div className="mb-3">
              <ThreadinaryLogo size="md" href="/" />
            </div>
            <p className="tagline text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
              Build your world. See how everything connects. Dibuat untuk penulis yang worldnya sudah terlalu besar untuk diingat sendiri.
            </p>
          </div>
          <div className="footer-cols flex gap-12">
            <div className="footer-col">
              <h4 className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold mb-3">Produk</h4>
              <a href="#features" className="block text-sm hover:text-[var(--accent)] mb-2">Fitur</a>
              <a href="#how" className="block text-sm hover:text-[var(--accent)] mb-2">Cara kerja</a>
              <button onClick={() => openAuth("login")} className="block text-sm hover:text-[var(--accent)] bg-transparent border-none p-0 cursor-pointer text-left">
                Masuk
              </button>
            </div>
            <div className="footer-col">
              <h4 className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold mb-3">Untuk siapa</h4>
              <a href="#for-you" className="block text-sm hover:text-[var(--accent)] mb-2">Novelis</a>
              <a href="#for-you" className="block text-sm hover:text-[var(--accent)] mb-2">Game master</a>
            </div>
          </div>
        </div>
        <div className="wrap footer-bottom text-center text-xs text-[var(--text-secondary)] pt-8 mt-12 border-t border-[var(--border)]">
          © 2026 Threadinery. Dibuat untuk penulis, oleh penulis.
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
