"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import {
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Search,
  BookOpen,
  Users,
  AlertTriangle,
  Wand2,
  Rocket,
  SearchCode,
  Heart,
  Ghost,
  Scroll,
  Coffee,
  Swords,
  BookMarked,
} from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  subGenre: string | null;
  updatedAt: string;
  spineClass?: string;
  _count?: {
    entities?: number;
    books?: number;
    events?: number;
    relationships?: number;
  };
  archived?: boolean;
}

const GENRE_OPTIONS = [
  { name: "Fantasy", icon: Wand2, color: "var(--accent)" },
  { name: "Sci-Fi", icon: Rocket, color: "var(--sage)" },
  { name: "Mystery / Thriller", icon: SearchCode, color: "var(--rose)" },
  { name: "Romance", icon: Heart, color: "var(--rose)" },
  { name: "Horror", icon: Ghost, color: "var(--accent)" },
  { name: "Historical Fiction", icon: Scroll, color: "var(--sage)" },
  { name: "Slice of Life", icon: Coffee, color: "var(--accent)" },
  { name: "Action / Adventure", icon: Swords, color: "var(--accent)" },
];

function getGenreIcon(genreName: string | null) {
  const found = GENRE_OPTIONS.find(
    (g) => g.name.toLowerCase() === genreName?.toLowerCase()
  );
  return found || { name: genreName || "Fantasy", icon: BookMarked, color: "var(--accent)" };
}

function getRelativeTimeString(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Baru saja";
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  return `${weeks} minggu lalu`;
}

interface DashboardClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [activeTab, setActiveTab] = useState<"semua" | "baru" | "diarsipkan">("semua");
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "created">("updated");

  // Create Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectGenre, setNewProjectGenre] = useState("Fantasy");
  const [newProjectSubGenre, setNewProjectSubGenre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card Menu State
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);

  // Edit World Modal State
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editSubGenre, setEditSubGenre] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Multi-Step Delete Confirmation Modal State
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchProjects();

    const handleOutsideClick = () => setActiveMenuProjectId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const spines = ["book-spine-a", "book-spine-b", "book-spine-c"];
          const formatted: ProjectItem[] = data.map((p, idx) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            genre: p.genre || "Fantasy",
            subGenre: p.subGenre,
            updatedAt: p.updatedAt,
            spineClass: spines[idx % 3],
            _count: {
              books: p._count?.books ?? p.books?.length ?? 1,
              entities: p._count?.entities ?? p.entities?.length ?? 0,
              events: p._count?.events ?? 0,
              relationships: p._count?.relationships ?? 0,
            },
          }));
          setProjects(formatted);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
          genre: newProjectGenre,
          subGenre: newProjectSubGenre.trim(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsCreateModalOpen(false);
        setNewProjectName("");
        setNewProjectDesc("");
        setNewProjectGenre("Fantasy");
        setNewProjectSubGenre("");
        router.push(`/project/${created.id}`);
      }
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit World Modal
  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setEditName(p.name);
    setEditDesc(p.description || "");
    setEditGenre(p.genre || "Fantasy");
    setEditSubGenre(p.subGenre || "");
    setActiveMenuProjectId(null);
  };

  // Submit Edit World
  const handleSaveEditWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    try {
      setIsEditSubmitting(true);
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          genre: editGenre,
          subGenre: editSubGenre.trim(),
        }),
      });

      if (res.ok) {
        setEditingProject(null);
        fetchProjects();
      }
    } catch (err) {
      console.error("Edit project error:", err);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Open Multi-Step Delete Modal
  const openDeleteModal = (p: ProjectItem) => {
    setDeletingProject(p);
    setDeleteStep(1);
    setDeleteConfirmInput("");
    setActiveMenuProjectId(null);
  };

  // Submit Delete World
  const handleConfirmDeleteWorld = async () => {
    if (!deletingProject) return;
    if (deleteConfirmInput.trim() !== deletingProject.name.trim()) return;

    try {
      setIsDeleteSubmitting(true);
      const res = await fetch(`/api/projects/${deletingProject.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeletingProject(null);
        fetchProjects();
      }
    } catch (err) {
      console.error("Delete project error:", err);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // Filtering & Sorting
  const filteredProjects = projects.filter((p) => {
    if (activeTab === "diarsipkan") return p.archived;
    if (activeTab === "baru") {
      const oneDay = 24 * 60 * 60 * 1000;
      return Date.now() - new Date(p.updatedAt).getTime() < 3 * oneDay;
    }
    if (selectedGenreFilter !== "all" && p.genre !== selectedGenreFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.genre && p.genre.toLowerCase().includes(q)) ||
        (p.subGenre && p.subGenre.toLowerCase().includes(q))
      );
    }
    return !p.archived;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const totalBooks = projects.reduce((sum, p) => sum + (p._count?.books || 1), 0);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RA";

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-inner">
          <ThreadinaryLogo size="md" href="/dashboard" />

          <div className="search">
            <Search size={16} className="text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Cari dunia, genre, atau entitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="topbar-right flex items-center gap-3">
            <button
              className="theme-toggle"
              aria-label="Ganti tema"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>

            <button
              className="btn btn-primary whitespace-nowrap shrink-0"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Dunia baru</span>
            </button>

            <div className="avatar" title={user.name || user.email || "User"}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="wrap">
        <div className="page-head">
          <div>
            <h1>My Stories</h1>
            <p className="sub">
              {projects.length} dunia · {totalBooks} buku · {user.name ? `Selamat datang, ${user.name}` : "terakhir diedit hari ini"}
            </p>
          </div>
        </div>

        {/* Filter & Genre Row */}
        <div className="filter-row flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="tabs">
            <div
              className={`tab ${activeTab === "semua" ? "active" : ""}`}
              onClick={() => setActiveTab("semua")}
            >
              Semua Dunia
            </div>
            <div
              className={`tab ${activeTab === "baru" ? "active" : ""}`}
              onClick={() => setActiveTab("baru")}
            >
              Baru diedit
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Clean Genre Filter Dropdown (matching Threadinery typography) */}
            <select
              value={selectedGenreFilter}
              onChange={(e) => setSelectedGenreFilter(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-medium rounded-xl px-3.5 py-2 cursor-pointer outline-none hover:border-[var(--accent)] transition-colors"
            >
              <option value="all">Semua Genre</option>
              {GENRE_OPTIONS.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>

            <div className="sort">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-medium rounded-xl px-3.5 py-2 cursor-pointer outline-none"
              >
                <option value="updated">Terakhir diedit</option>
                <option value="name">Nama A–Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shelf Section */}
        <section className="shelf-section">
          {loading ? (
            <div className="text-center py-16 text-[var(--text-secondary)] text-sm">
              Memuat duniamu dari database...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProjects.map((p) => {
                const genreObj = getGenreIcon(p.genre);
                const GenreIconComp = genreObj.icon;

                return (
                  <div
                    key={p.id}
                    className={`book-card ${p.spineClass || "book-spine-a"} relative group cursor-pointer`}
                    onClick={() => router.push(`/project/${p.id}`)}
                  >
                    <div className="book-top flex items-center justify-between">
                      {/* Cohesive Threadinery SVG Icon Badge */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                        style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                        title={`Genre: ${p.genre || "Fantasy"}`}
                      >
                        <GenreIconComp size={18} />
                      </div>

                      {/* Dot-Three Menu Button */}
                      <div className="relative">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuProjectId(
                              activeMenuProjectId === p.id ? null : p.id
                            );
                          }}
                          title="Menu Opsi Dunia"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuProjectId === p.id && (
                          <div
                            className="absolute right-0 top-9 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1.5 z-50 flex flex-col gap-0.5 text-xs font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-[var(--text)] hover:bg-[var(--bg)] hover:text-[var(--accent)] flex items-center gap-2 transition-colors"
                              onClick={() => openEditModal(p)}
                            >
                              <Edit size={14} />
                              <span>Edit Dunia / Settings</span>
                            </button>

                            <div className="h-px bg-[var(--border)] my-1" />

                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-[var(--rose)] hover:bg-[var(--rose-soft)] flex items-center gap-2 transition-colors"
                              onClick={() => openDeleteModal(p)}
                            >
                              <Trash2 size={14} />
                              <span>Hapus Dunia</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {/* Genre & Sub-genre badges */}
                      <div className="flex items-center gap-1.5 my-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center gap-1">
                          <GenreIconComp size={11} />
                          <span>{p.genre || "Fantasy"}</span>
                        </span>
                        {p.subGenre && (
                          <span className="text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                            {p.subGenre}
                          </span>
                        )}
                      </div>

                      <h3 className="book-title text-lg font-serif font-semibold text-[var(--text)] mb-1">
                        {p.name}
                      </h3>
                      <p className="book-desc text-xs text-[var(--text-secondary)] line-clamp-2">
                        {p.description || "Belum ada deskripsi."}
                      </p>
                    </div>

                    <div className="book-meta mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <BookOpen size={13} />
                        {p._count?.books || 1} buku
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={13} />
                        {p._count?.entities || 0} entity
                      </span>
                      <span className="text-[11px]">
                        {getRelativeTimeString(p.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* New Project Card */}
              <div
                className="new-card border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[var(--accent-soft)] transition-all min-h-[220px]"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                  <Plus size={22} />
                </div>
                <span className="label font-serif font-semibold text-sm text-[var(--text)]">
                  Mulai dunia baru
                </span>
              </div>
            </div>
          )}
        </section>

        <footer className="page-footer text-center py-8 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] mt-12">
          Threadinery · Build your world. See how everything connects.
        </footer>
      </main>

      {/* MODAL 1: BUAT DUNIA BARU */}
      {isCreateModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", width: "100%" }}
          >
            <div className="modal-header">
              <h2>Mulai Dunia Baru</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Nama Dunia / Semesta *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="Misal: Kerajaan Ashmoor, Wesdonia, Galaksi Andromeda..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label>Genre Utama *</label>
                  <select
                    className="form-input text-xs"
                    value={newProjectGenre}
                    onChange={(e) => setNewProjectGenre(e.target.value)}
                    required
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub-Genre (Opsional)</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="High Fantasy, Noir, Space Opera..."
                    value={newProjectSubGenre}
                    onChange={(e) => setNewProjectSubGenre(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Deskripsi Singkat</label>
                <textarea
                  className="form-input text-xs"
                  rows={3}
                  placeholder="Gambaran umum dunia atau konflik utama cerita..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Membuat..." : "Buat Dunia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DUNIA / SETTINGS */}
      {editingProject && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingProject(null);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", width: "100%" }}
          >
            <div className="modal-header">
              <h2>Edit Dunia: {editingProject.name}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingProject(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditWorld} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Nama Dunia / Semesta *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label>Genre Utama</label>
                  <select
                    className="form-input text-xs"
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub-Genre</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="High Fantasy, Noir..."
                    value={editSubGenre}
                    onChange={(e) => setEditSubGenre(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Deskripsi Singkat</label>
                <textarea
                  className="form-input text-xs"
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setEditingProject(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? "Memperbarui..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MULTI-STEP CONFIRMATION DELETE WORLD (HIGH CONTRAST & PROPER HTML BOLD) */}
      {deletingProject && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingProject(null);
          }}
          style={{ zIndex: 110 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-3">
              <h2 className="text-[#991B1B] flex items-center gap-2">
                <AlertTriangle size={20} className="text-[#DC2626]" />
                <span>Konfirmasi Penghapusan Dunia</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeletingProject(null)}
              >
                ✕
              </button>
            </div>

            {deleteStep === 1 ? (
              <div className="flex flex-col gap-4 py-3 text-xs leading-relaxed">
                <p className="text-sm font-semibold text-[var(--text)]">
                  Apakah Anda yakin ingin menghapus dunia <strong>"{deletingProject.name}"</strong>?
                </p>

                {/* HIGH-CONTRAST WARNING BOX */}
                <div
                  className="p-4 rounded-xl flex flex-col gap-1.5"
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                  }}
                >
                  <span className="font-bold flex items-center gap-1 text-[#991B1B]">
                    ⚠️ Peringatan Penting:
                  </span>
                  <span className="text-[#7F1D1D] text-xs leading-normal">
                    Seluruh <strong>{deletingProject._count?.entities || 0} entitas</strong>,{" "}
                    <strong>{deletingProject._count?.relationships || 0} relasi</strong>, dan buku/outline di dalam dunia ini akan{" "}
                    <strong className="underline text-[#991B1B] font-bold">terhapus secara permanen dari database</strong> dan tidak dapat dikembalikan.
                  </span>
                </div>

                <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => setDeletingProject(null)}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn text-xs px-5 text-white font-semibold shadow-sm active:scale-95"
                    style={{ backgroundColor: "#DC2626" }}
                    onClick={() => setDeleteStep(2)}
                  >
                    Lanjutkan ke Konfirmasi Akhir →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-3 text-xs leading-relaxed">
                <p className="text-sm font-medium text-[var(--text)]">
                  Untuk mengonfirmasi penghapusan permanen, silakan ketik nama dunia:{" "}
                  <strong className="text-[#DC2626] font-bold font-mono underline select-all">
                    {deletingProject.name}
                  </strong>
                </p>

                <div className="form-group">
                  <input
                    type="text"
                    className="form-input text-xs font-mono border-[#FCA5A5] focus:border-[#DC2626]"
                    placeholder={`Ketik "${deletingProject.name}" persis di sini...`}
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => setDeleteStep(1)}
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    className="btn text-xs px-5 text-white font-semibold shadow-sm active:scale-95 disabled:opacity-40"
                    style={{ backgroundColor: "#DC2626" }}
                    disabled={
                      deleteConfirmInput.trim() !== deletingProject.name.trim() ||
                      isDeleteSubmitting
                    }
                    onClick={handleConfirmDeleteWorld}
                  >
                    {isDeleteSubmitting ? "Menghapus..." : "Hapus Permanen Dunia Ini"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
