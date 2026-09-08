"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { InteractiveHeroGraph } from "@/components/InteractiveHeroGraph";
import { AuthModal } from "@/components/AuthModal";
import { ThreadinaryLogo } from "@/components/ThreadinaryLogo";

// ──────────────────────────────────────────────────────
// Mini UI Mockup Previews
// ──────────────────────────────────────────────────────

function GraphPreview() {
  return (
    <svg viewBox="0 0 220 130" className="w-full" aria-hidden="true">
      <line x1="60" y1="48" x2="110" y2="75" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
      <line x1="110" y1="75" x2="160" y2="48" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
      <line x1="60" y1="48" x2="110" y2="108" stroke="var(--text-secondary)" strokeWidth="1.2" opacity="0.35" />
      <line x1="160" y1="48" x2="110" y2="108" stroke="var(--text-secondary)" strokeWidth="1.2" opacity="0.35" />
      <line x1="110" y1="75" x2="110" y2="108" stroke="var(--sage)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7">
        <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.8s" repeatCount="indefinite" />
      </line>
      <text x="84" y="56" fontSize="6.5" fill="var(--text-secondary)" opacity="0.7" textAnchor="middle">kakak</text>
      <text x="138" y="56" fontSize="6.5" fill="var(--text-secondary)" opacity="0.7" textAnchor="middle">musuh</text>
      <circle cx="60" cy="48" r="18" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
      <text x="60" y="52" fontSize="8" fill="var(--text)" fontWeight="600" textAnchor="middle">Elira</text>
      <circle cx="160" cy="48" r="18" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
      <text x="160" y="52" fontSize="8" fill="var(--text)" fontWeight="600" textAnchor="middle">Kael</text>
      <circle cx="110" cy="75" r="16" fill="var(--bg)" stroke="var(--sage)" strokeWidth="2" />
      <text x="110" y="79" fontSize="7.5" fill="var(--text)" fontWeight="600" textAnchor="middle">Nara</text>
      <circle cx="110" cy="108" r="14" fill="var(--bg)" stroke="var(--rose)" strokeWidth="1.8" strokeDasharray="4 3" />
      <text x="110" y="112" fontSize="7" fill="var(--text)" fontWeight="500" textAnchor="middle">Kedai Teh</text>
      <rect x="148" y="100" width="66" height="15" rx="4" fill="var(--accent-soft)" />
      <text x="181" y="111" fontSize="6.5" fill="var(--accent)" fontWeight="600" textAnchor="middle">↝ Ditemukan sistem</text>
    </svg>
  );
}

function TimelinePreview() {
  const events = [
    { x: 40, top: true, label1: "Pertemuan", label2: "pertama", color: "var(--accent)", book: "B1" },
    { x: 90, top: false, label1: "Konflik", label2: "terjadi", color: "var(--rose)", book: "B1" },
    { x: 145, top: true, label1: "Aliansi", label2: "terbentuk", color: "var(--sage)", book: "B2" },
    { x: 190, top: false, label1: "Pengkhianatan", label2: "", color: "var(--rose)", book: "B2" },
  ];
  return (
    <svg viewBox="0 0 220 110" className="w-full" aria-hidden="true">
      <line x1="20" y1="55" x2="205" y2="55" stroke="var(--border)" strokeWidth="1.5" />
      {events.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy="55" r="6" fill={e.color} opacity="0.9" />
          <line x1={e.x} y1={e.top ? 49 : 61} x2={e.x} y2={e.top ? 22 : 88} stroke={e.color} strokeWidth="1" opacity="0.3" />
          <text x={e.x} y={e.top ? 17 : 97} fontSize="6.5" fill="var(--text)" textAnchor="middle" opacity="0.85">{e.label1}</text>
          {e.label2 && <text x={e.x} y={e.top ? 25 : 105} fontSize="6.5" fill="var(--text-secondary)" textAnchor="middle" opacity="0.7">{e.label2}</text>}
          <rect x={e.x - 7} y="61" width="14" height="9" rx="3" fill={e.color} opacity="0.15" />
          <text x={e.x} y="68" fontSize="5.5" fill={e.color} fontWeight="700" textAnchor="middle">{e.book}</text>
        </g>
      ))}
    </svg>
  );
}

function FamilyTreePreview() {
  return (
    <svg viewBox="0 0 220 120" className="w-full" aria-hidden="true">
      <line x1="110" y1="35" x2="110" y2="52" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="55" y1="52" x2="165" y2="52" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="55" y1="52" x2="55" y2="70" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="110" y1="52" x2="110" y2="70" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="165" y1="52" x2="165" y2="70" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="82" y="12" width="56" height="23" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="110" y="27" fontSize="8" fill="var(--accent)" fontWeight="700" textAnchor="middle">Raja Aldric</text>
      {[{ x: 30, name: "Elira" }, { x: 85, name: "Kael" }, { x: 140, name: "Mira" }].map((c, i) => (
        <g key={i}>
          <rect x={c.x} y="70" width="46" height="20" rx="5" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.3" />
          <text x={c.x + 23} y="83" fontSize="8" fill="var(--text)" fontWeight="600" textAnchor="middle">{c.name}</text>
        </g>
      ))}
      <rect x="130" y="102" width="82" height="13" rx="4" fill="var(--sage-soft)" />
      <text x="171" y="112" fontSize="6" fill="var(--sage)" fontWeight="600" textAnchor="middle">✓ Auto dari relasi parent/child</text>
    </svg>
  );
}

function MapPreview() {
  const pins = [
    { x: 55, y: 45, label: "Istana Ashmoor", color: "var(--accent)" },
    { x: 120, y: 65, label: "Hutan Norreth", color: "var(--sage)" },
    { x: 172, y: 42, label: "Pelabuhan Vael", color: "var(--rose)" },
  ];
  return (
    <svg viewBox="0 0 220 120" className="w-full" aria-hidden="true">
      <rect x="10" y="8" width="200" height="104" rx="8" fill="var(--bg)" stroke="var(--border)" strokeWidth="1" />
      <path d="M10 60 Q55 40 95 55 Q135 70 165 50 Q188 37 210 45" stroke="var(--sage)" strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M10 82 Q65 72 105 78 Q145 84 210 74" stroke="var(--sage)" strokeWidth="1" fill="none" opacity="0.18" />
      {pins.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="8" fill={p.color} opacity="0.12" />
          <circle cx={p.x} cy={p.y} r="4" fill={p.color} />
          <line x1={p.x} y1={p.y - 4} x2={p.x} y2={p.y - 12} stroke={p.color} strokeWidth="1.2" />
          <rect x={p.x - 30} y={p.y - 25} width="60" height="12" rx="3" fill="var(--surface)" stroke={p.color} strokeWidth="0.8" opacity="0.92" />
          <text x={p.x} y={p.y - 16} fontSize="6.5" fill="var(--text)" fontWeight="600" textAnchor="middle">{p.label}</text>
        </g>
      ))}
      <rect x="12" y="96" width="82" height="12" rx="4" fill="var(--accent-soft)" />
      <text x="53" y="105" fontSize="6" fill="var(--accent)" fontWeight="600" textAnchor="middle">↑ Upload peta custom-mu</text>
    </svg>
  );
}

function OutlinePreview() {
  const rows = [
    { label: "Bab 1 — Pertemuan di Kedai Teh", indent: 0, bold: true },
    { label: "Scene: Elira mendengar rumor...", indent: 14, bold: false },
    { label: "Bab 2 — Konflik Pasar Malam", indent: 0, bold: true },
    { label: "Scene: Kael menghadang perjalanan", indent: 14, bold: false },
    { label: "Scene: Kejar-kejaran di gang sempit", indent: 14, bold: false },
    { label: "Bab 3 — Aliansi Tak Terduga", indent: 0, bold: true },
  ];
  return (
    <svg viewBox="0 0 220 120" className="w-full" aria-hidden="true">
      <rect x="12" y="8" width="196" height="104" rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      {rows.map((row, i) => (
        <g key={i}>
          {row.bold && <rect x={22 + row.indent} y={20 + i * 16 - 9} width="3.5" height="12" rx="2" fill="var(--accent)" opacity="0.7" />}
          <text
            x={row.bold ? 30 + row.indent : 24 + row.indent}
            y={20 + i * 16}
            fontSize={row.bold ? 8 : 7}
            fill={row.bold ? "var(--text)" : "var(--text-secondary)"}
            fontWeight={row.bold ? "600" : "400"}
            opacity="0.9"
          >{row.label}</text>
        </g>
      ))}
    </svg>
  );
}

function MultibookPreview() {
  return (
    <svg viewBox="0 0 220 120" className="w-full" aria-hidden="true">
      <rect x="62" y="6" width="96" height="18" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1" />
      <text x="110" y="18" fontSize="7.5" fill="var(--accent)" fontWeight="700" textAnchor="middle">Kerajaan Ashmoor</text>
      <line x1="82" y1="24" x2="62" y2="50" stroke="var(--accent)" strokeWidth="1.2" opacity="0.35" />
      <line x1="138" y1="24" x2="158" y2="50" stroke="var(--accent)" strokeWidth="1.2" opacity="0.35" />
      <rect x="18" y="50" width="82" height="52" rx="8" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="22" y="54" width="4" height="44" rx="2" fill="var(--accent)" opacity="0.65" />
      <text x="62" y="76" fontSize="8.5" fill="var(--text)" fontWeight="700" textAnchor="middle">Buku 1</text>
      <text x="62" y="88" fontSize="7" fill="var(--text-secondary)" textAnchor="middle">Mahkota Terlupakan</text>
      <text x="62" y="98" fontSize="6" fill="var(--text-secondary)" textAnchor="middle" opacity="0.65">12 bab · 8 karakter</text>
      <rect x="120" y="50" width="82" height="52" rx="8" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="124" y="54" width="4" height="44" rx="2" fill="var(--sage)" opacity="0.65" />
      <text x="162" y="76" fontSize="8.5" fill="var(--text)" fontWeight="700" textAnchor="middle">Buku 2</text>
      <text x="162" y="88" fontSize="7" fill="var(--text-secondary)" textAnchor="middle">Bayangan Kerajaan</text>
      <text x="162" y="98" fontSize="6" fill="var(--text-secondary)" textAnchor="middle" opacity="0.65">9 bab · shares world</text>
      <rect x="72" y="108" width="76" height="12" rx="4" fill="var(--sage-soft)" />
      <text x="110" y="117" fontSize="6" fill="var(--sage)" fontWeight="700" textAnchor="middle">↑ Karakter & lokasi berbagi</text>
    </svg>
  );
}

// ──────────────────────────────────────────────────────
// Section fade-in wrapper
// ──────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────
// Feature data
// ──────────────────────────────────────────────────────
const features = [
  { tag: "Graph", tagColor: "accent", title: "Relationship graph", desc: "Setiap karakter, lokasi, dan objek tersambung sebagai simpul. Klik untuk menjelajah siapa terhubung dengan siapa — termasuk koneksi yang belum kamu sadari.", preview: <GraphPreview /> },
  { tag: "Timeline", tagColor: "sage", title: "Timeline dunia", desc: "Event tersusun otomatis secara kronologis. Filter per karakter, per buku, atau lihat seluruh dunia sekaligus — tanpa input manual.", preview: <TimelinePreview /> },
  { tag: "Family", tagColor: "rose", title: "Family tree", desc: "Silsilah muncul sendiri dari relationship parent/child yang sudah kamu catat. Tidak ada input dobel, tidak ada form terpisah.", preview: <FamilyTreePreview /> },
  { tag: "Map", tagColor: "sage", title: "Peta custom", desc: "Unggah peta duniamu sendiri, taruh penanda ke lokasi — klik penanda untuk buka profil entity secara langsung.", preview: <MapPreview /> },
  { tag: "Outline", tagColor: "accent", title: "Outline bebas format", desc: "Satu kalimat per bab atau dua halaman narasi — outline menyesuaikan gaya menulismu, bukan memaksakan struktur kaku.", preview: <OutlinePreview /> },
  { tag: "Multi-buku", tagColor: "rose", title: "Multi-buku, satu dunia", desc: "Sequel berbagi karakter dan lokasi dengan buku sebelumnya. Tidak perlu input ulang dari nol — worldnya sudah ada.", preview: <MultibookPreview /> },
] as const;

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  accent: { bg: "var(--accent-soft)", fg: "var(--accent)" },
  sage:   { bg: "var(--sage-soft)",   fg: "var(--sage)"   },
  rose:   { bg: "var(--rose-soft)",   fg: "var(--rose)"   },
};

// ──────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const [currentUser, setCurrentUser] = useState<{ id?: string; name?: string | null; email?: string | null } | null>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -30]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.5]);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    // Tangkap parameter URL jika diarahkan ke login/register
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get("auth");
      if (authParam === "login") {
        setAuthModalMode("login");
        setAuthModalOpen(true);
      } else if (authParam === "register") {
        setAuthModalMode("register");
        setAuthModalOpen(true);
      }
    }

    // Cek apakah user sudah memiliki sesi login aktif
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
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

            {currentUser ? (
              <a
                href="/dashboard"
                className="btn btn-primary inline-flex items-center gap-2 text-xs font-semibold py-2 px-4 shadow-sm"
              >
                <span>Buka Dashboard</span>
                <span>→</span>
              </a>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center justify-center pt-14 pb-20 overflow-hidden">
        <InteractiveHeroGraph />
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="wrap relative z-20 text-center max-w-3xl mx-auto px-4 pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow inline-flex items-center gap-2 mb-7">
              <span className="eyebrow-dot" />
              Untuk penulis novel, cerpen &amp; game master
            </span>
            <h1 className="text-4xl md:text-[3.5rem] font-serif font-semibold leading-[1.15] tracking-tight mb-6 text-[var(--text)]">
              Bangun duniamu.
              <br />
              Lihat{" "}
              <em className="italic text-[var(--accent)] font-serif">bagaimana</em>
              <br />
              semuanya terhubung.
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-10">
              Satu tempat untuk karakter, lokasi, event, dan garis waktu ceritamu — dengan graph yang menemukan koneksi tersembunyi, bukan cuma menggambar yang sudah kamu tahu.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {currentUser ? (
                <a
                  href="/dashboard"
                  className="btn btn-primary btn-lg px-8 py-3.5 text-base shadow-lg inline-flex items-center gap-2"
                >
                  <span>Lanjutkan ke Dashboard</span>
                  <span>→</span>
                </a>
              ) : (
                <button
                  id="hero-cta-register"
                  className="btn btn-primary btn-lg px-8 py-3.5 text-base shadow-lg"
                  onClick={() => openAuth("register")}
                >
                  Mulai bangun duniamu
                </button>
              )}
              <a href="#how" className="btn btn-ghost btn-lg px-8 py-3.5 text-base">
                Lihat cara kerjanya ↓
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Problem ────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="wrap">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12">
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-3">
              Masalahnya
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
              Sticky note dan spreadsheet cepat kehabisan tempat
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Semakin besar duniamu, semakin sulit mengingat siapa terhubung dengan siapa — dan tools yang ada cuma menggambar apa yang sudah kamu ketahui.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)]">
            {[
              { icon: "📂", title: "Detail tercecer di mana-mana", desc: "Karakter di satu dokumen, timeline di dokumen lain, peta cuma di kepala. Tidak ada yang saling nyambung." },
              { icon: "🔒", title: "Template yang terlalu kaku", desc: "Form karakter dengan 40 field wajib, padahal kamu baru butuh nama dan satu kalimat deskripsi hari ini." },
              { icon: "🔍", title: "Koneksi tersembunyi tak pernah ketemu", desc: "Dua karakter yang diam-diam dekat dengan tokoh ketiga — baru sadar setelah 200 halaman." },
            ].map((item, idx) => (
              <FadeIn key={idx} delay={idx * 0.12} className="bg-[var(--surface)] p-8">
                <span className="text-2xl mb-4 block">{item.icon}</span>
                <h3 className="text-base font-semibold mb-2 font-serif">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="wrap">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-3">
              Satu sumber data, banyak cara melihat
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
              Semua terhubung, karena memang berasal dari data yang sama
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Entity, relationship, dan event yang kamu catat sekali — muncul otomatis di graph, timeline, family tree, peta, dan outline.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, idx) => {
              const c = TAG_COLORS[f.tagColor];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
                  style={{ boxShadow: "0 2px 8px rgba(61,50,38,0.04)" }}
                >
                  {/* Preview area */}
                  <div className="px-4 pt-4 pb-2" style={{ background: "var(--bg)" }}>
                    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] p-3" style={{ minHeight: "128px" }}>
                      {f.preview}
                    </div>
                  </div>
                  {/* Text */}
                  <div className="px-5 pb-6 pt-4">
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                      style={{ background: c.bg, color: c.fg }}
                    >
                      {f.tag}
                    </span>
                    <h3 className="text-[15px] font-semibold mb-1.5 font-serif leading-snug">{f.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Differentiator ──────────────────────────────── */}
      <section className="py-24 bg-[var(--surface)] border-y border-[var(--border)]" id="how">
        <div className="wrap grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-3">
              Yang membedakan Threadinery
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-5 leading-snug">
              Threadinery ikut menemukan koneksi yang belum kamu sadari
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-7">
              Dua entity yang sama-sama terhubung ke entity ketiga — misalnya dua karakter yang sama-sama sering mengunjungi tempat yang sama — otomatis terdeteksi dan digambar berbeda dari relationship yang kamu buat sendiri.
            </p>
            <ul className="flex flex-col gap-4">
              {[
                { dot: "var(--text)", label: "Garis solid untuk relationship eksplisit yang kamu buat sendiri.", dashed: false },
                { dot: "var(--accent)", label: "Garis putus-putus untuk koneksi yang ditemukan sistem — bisa dinyalakan/dimatikan kapan saja.", dashed: true },
                { dot: "var(--sage)", label: "Tidak perlu form tambahan — koneksi muncul sendiri dari data yang sudah ada.", dashed: false },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--text)]">
                  <span className="mt-1.5 shrink-0" style={{ width: "20px", height: "12px", display: "inline-flex", alignItems: "center" }}>
                    <svg width="20" height="2" viewBox="0 0 20 2">
                      {item.dashed
                        ? <line x1="0" y1="1" x2="20" y2="1" stroke={item.dot} strokeWidth="2" strokeDasharray="4 3" />
                        : <line x1="0" y1="1" x2="20" y2="1" stroke={item.dot} strokeWidth="2" />
                      }
                    </svg>
                  </span>
                  <span className="leading-relaxed">{item.label}</span>
                </li>
              ))}
            </ul>
          </FadeIn>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(61,50,38,0.07)" }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface)]">
              <span className="font-serif font-semibold text-sm">Graph — Kerajaan Ashmoor</span>
              <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="2" viewBox="0 0 16 2"><line x1="0" y1="1" x2="16" y2="1" stroke="var(--text)" strokeWidth="2" /></svg>
                  Eksplisit
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="2" viewBox="0 0 16 2"><line x1="0" y1="1" x2="16" y2="1" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3" /></svg>
                  Ditemukan
                </span>
              </div>
            </div>
            <div className="p-4">
              <svg viewBox="0 0 440 270" className="w-full" aria-hidden="true">
                {/* explicit edges */}
                <line x1="75" y1="65" x2="225" y2="45" stroke="var(--text)" strokeWidth="1.8" opacity="0.45" />
                <line x1="75" y1="65" x2="95" y2="200" stroke="var(--text)" strokeWidth="1.8" opacity="0.45" />
                <line x1="360" y1="75" x2="225" y2="45" stroke="var(--text)" strokeWidth="1.8" opacity="0.45" />
                <line x1="360" y1="75" x2="310" y2="205" stroke="var(--text)" strokeWidth="1.8" opacity="0.45" />
                {/* edge labels */}
                <text x="147" y="45" fontSize="8" fill="var(--text-secondary)" opacity="0.65" textAnchor="middle">sama-sama menyukai</text>
                <text x="72" y="138" fontSize="8" fill="var(--text-secondary)" opacity="0.65" textAnchor="middle">mengunjungi</text>
                <text x="355" y="135" fontSize="8" fill="var(--text-secondary)" opacity="0.65" textAnchor="middle">pelanggan tetap</text>
                {/* discovered edge */}
                <line x1="95" y1="200" x2="310" y2="205" stroke="var(--accent)" strokeWidth="2.2" strokeDasharray="7 5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.6s" repeatCount="indefinite" />
                </line>
                <rect x="163" y="212" width="112" height="18" rx="5" fill="var(--accent-soft)" />
                <text x="219" y="225" fontSize="8.5" fill="var(--accent)" fontWeight="700" textAnchor="middle">↝ Ditemukan Threadinery</text>
                {/* nodes */}
                <g>
                  <circle cx="75" cy="65" r="26" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.2" />
                  <text x="75" y="62" textAnchor="middle" fontSize="9.5" fill="var(--text)" fontWeight="700">Elira</text>
                  <text x="75" y="74" textAnchor="middle" fontSize="7.5" fill="var(--text-secondary)">Penyihir</text>
                </g>
                <g>
                  <circle cx="225" cy="45" r="24" fill="var(--surface)" stroke="var(--sage)" strokeWidth="2" />
                  <text x="225" y="42" textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="700">Kucing Hitam</text>
                  <text x="225" y="54" textAnchor="middle" fontSize="7.5" fill="var(--text-secondary)">Familiar</text>
                </g>
                <g>
                  <circle cx="360" cy="75" r="26" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.2" />
                  <text x="360" y="72" textAnchor="middle" fontSize="9.5" fill="var(--text)" fontWeight="700">Kael</text>
                  <text x="360" y="84" textAnchor="middle" fontSize="7.5" fill="var(--text-secondary)">Ksatria</text>
                </g>
                <g>
                  <circle cx="95" cy="200" r="24" fill="var(--surface)" stroke="var(--rose)" strokeWidth="2" />
                  <text x="95" y="197" textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="700">Kedai Teh</text>
                  <text x="95" y="209" textAnchor="middle" fontSize="7.5" fill="var(--text-secondary)">Lokasi</text>
                </g>
                <g>
                  <circle cx="310" cy="205" r="24" fill="var(--surface)" stroke="var(--rose)" strokeWidth="2" />
                  <text x="310" y="202" textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="700">Pasar Malam</text>
                  <text x="310" y="214" textAnchor="middle" fontSize="7.5" fill="var(--text-secondary)">Lokasi</text>
                </g>
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Audience ────────────────────────────────────── */}
      <section id="for-you" className="py-24">
        <div className="wrap">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <div className="kicker font-semibold text-xs uppercase tracking-widest text-[var(--accent)] mb-3">
              Untuk siapa pun gaya menulismu
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
              Plotter atau pantser, Threadinery mengikuti caramu bekerja
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                tag: "Plotter", tagBg: "var(--accent-soft)", tagFg: "var(--accent)",
                title: "Petakan semuanya sebelum menulis",
                desc: "Detailkan setiap karakter, timeline, dan event sejak awal. Custom properties mengikuti sistem duniamu sendiri — bukan skema yang dipaksakan.",
                items: ["Outline terstruktur per bab & scene", "Timeline kronologis otomatis", "Custom properties tiap entity"],
                checkColor: "var(--accent)",
              },
              {
                tag: "Pantser", tagBg: "var(--sage-soft)", tagFg: "var(--sage)",
                title: "Tulis dulu, rapikan belakangan",
                desc: "Outline bebas tanpa struktur kaku. Tandai jadi Event kapan pun kamu siap — dunia tetap rapi tanpa kerja administratif ekstra.",
                items: ["Quick Add: catat ide dalam 2 detik", "Outline bisa diisi secara bertahap", "Koneksi muncul otomatis seiring waktu"],
                checkColor: "var(--sage)",
              },
            ].map((card, idx) => (
              <FadeIn key={idx} delay={idx * 0.15}>
                <div
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 h-full"
                  style={{ boxShadow: "0 2px 8px rgba(61,50,38,0.04)" }}
                >
                  <span
                    className="inline-block text-[10.5px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                    style={{ background: card.tagBg, color: card.tagFg }}
                  >
                    {card.tag}
                  </span>
                  <h3 className="text-xl font-serif font-semibold mb-3">{card.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">{card.desc}</p>
                  <ul className="flex flex-col gap-2.5">
                    {card.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--text)]">
                        <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none">
                          <circle cx="8" cy="8" r="7.5" stroke={card.checkColor} strokeWidth="1.2" opacity="0.4" />
                          <path d="M5 8l2 2 4-4" stroke={card.checkColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ──────────────────────────────────────── */}
      <section className="py-16">
        <div className="wrap">
          <FadeIn>
            <div
              className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
              style={{ background: "var(--text)", boxShadow: "0 8px 40px rgba(61,50,38,0.18)" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 25% 50%, rgba(201,123,74,0.18) 0%, transparent 55%), radial-gradient(circle at 78% 30%, rgba(138,154,123,0.15) 0%, transparent 50%)",
                }}
              />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-3" style={{ color: "var(--bg)" }}>
                  Mulai petakan duniamu hari ini
                </h2>
                <p className="text-sm mb-8" style={{ color: "var(--bg)", opacity: 0.55 }}>
                  Gratis. Tidak perlu kartu kredit. Langsung pakai.
                </p>
                <div className="flex justify-center">
                  {currentUser ? (
                    <a
                      href="/dashboard"
                      className="btn btn-lg px-8 py-3.5 text-base font-semibold rounded-xl inline-flex items-center gap-2"
                      style={{ background: "var(--bg)", color: "var(--text)", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                    >
                      <span>Buka Workspace Ceritamu</span>
                      <span>→</span>
                    </a>
                  ) : (
                    <button
                      className="btn btn-lg px-8 py-3.5 text-base font-semibold rounded-xl"
                      style={{ background: "var(--bg)", color: "var(--text)", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                      onClick={() => openAuth("register")}
                    >
                      Mulai bangun duniamu
                    </button>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="py-16 border-t border-[var(--border)]">
        <div className="wrap flex flex-wrap justify-between gap-8">
          <div>
            <div className="mb-3"><ThreadinaryLogo size="md" href="/" /></div>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
              Build your world. See how everything connects.<br />
              Dibuat untuk penulis yang worldnya sudah terlalu besar untuk diingat sendiri.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold mb-3">Produk</h4>
              <a href="#features" className="block text-sm hover:text-[var(--accent)] mb-2 transition-colors">Fitur</a>
              <a href="#how" className="block text-sm hover:text-[var(--accent)] mb-2 transition-colors">Cara kerja</a>
              <button onClick={() => openAuth("login")} className="block text-sm hover:text-[var(--accent)] bg-transparent border-none p-0 cursor-pointer text-left transition-colors">
                Masuk
              </button>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold mb-3">Untuk siapa</h4>
              <a href="#for-you" className="block text-sm hover:text-[var(--accent)] mb-2 transition-colors">Novelis</a>
              <a href="#for-you" className="block text-sm hover:text-[var(--accent)] mb-2 transition-colors">Game master</a>
              <a href="#for-you" className="block text-sm hover:text-[var(--accent)] transition-colors">Penulis cerpen</a>
            </div>
          </div>
        </div>
        <div className="wrap text-center text-xs text-[var(--text-secondary)] pt-8 mt-12 border-t border-[var(--border)]">
          © 2026 Threadinery. Dibuat untuk penulis, oleh penulis.
        </div>
      </footer>

      {/* ── Auth Modal ──────────────────────────────────── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
