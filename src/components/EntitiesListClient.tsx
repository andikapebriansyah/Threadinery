"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { ProjectNavbar } from "./ProjectNavbar";
import { CreateEntityModal } from "./CreateEntityModal";
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  ChevronDown,
  Tag as TagIcon,
  LayoutGrid,
  List,
  FolderTree,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Sparkles,
  X,
  Check,
} from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface EntityItem {
  id: string;
  name: string;
  description: string | null;
  typeId: string;
  type?: EntityTypeItem | null;
  tags: string[];
  metadata?: Record<string, any> | null;
  imageUrl?: string | null;
  status?: string | null;
  updatedAt: string;
}

interface EntitiesListClientProps {
  projectId: string;
  projectName: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  initialEntities?: EntityItem[];
  initialEntityTypes?: EntityTypeItem[];
}

const DEFAULT_TYPE_NAMES = [
  "Character",
  "Location",
  "Organization",
  "Object",
  "Concept",
];

export function EntitiesListClient({
  projectId,
  projectName,
  user,
  initialEntities = [],
  initialEntityTypes = [],
}: EntitiesListClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [entities, setEntities] = useState<EntityItem[]>(initialEntities);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>(initialEntityTypes);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(initialEntities.length === 0);

  // Filters & View Modes (§7.2 & §7.3)
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table" | "grouped">("grid");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCameoModalOpen, setIsCameoModalOpen] = useState(false);
  const [cameoSubmitting, setCameoSubmitting] = useState(false);
  const [cameoSearchQuery, setCameoSearchQuery] = useState("");

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchTypesAndEntities();

    // Listen to book selection from universal topbar (ProjectNavbar)
    const handleBookChange = (e: any) => {
      if (e.detail?.bookId) {
        setSelectedBookFilter(e.detail.bookId);
      }
    };
    window.addEventListener("threadinery:book_change", handleBookChange);

    return () => {
      window.removeEventListener("threadinery:book_change", handleBookChange);
    };
  }, [projectId]);

  const fetchTypesAndEntities = async () => {
    try {
      const [typesRes, entitiesRes, booksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entity-types`),
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/books`),
      ]);

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setEntityTypes(typesData);
      }

      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        if (Array.isArray(entitiesData)) {
          setEntities(entitiesData);
        }
      }

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        if (Array.isArray(booksData) && booksData.length > 0) {
          setBooks(booksData);
          const savedBookId = localStorage.getItem(`threadinery_active_book_${projectId}`);
          const validSaved = booksData.find((b: any) => b.id === savedBookId);
          const activeId = validSaved ? validSaved.id : booksData[0].id;
          setSelectedBookFilter(activeId);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch entities data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Collect all unique tags used across entities (§7.2)
  const allUsedTags = Array.from(
    new Set(entities.flatMap((e) => e.tags || []))
  ).sort();

  // Book-Filtered entities (Multi-Book Series Scoping)
  const bookEntities = entities.filter((e) => {
    if (selectedBookFilter === "all") return true;
    const meta = e.metadata as any;
    const metaBooks: string[] = Array.isArray(meta?.bookIds) ? meta.bookIds : [];
    if (metaBooks.includes(selectedBookFilter)) return true;
    // If first book is selected and entity has no explicit bookIds yet, treat as book 1
    if (metaBooks.length === 0 && books.length > 0 && selectedBookFilter === books[0].id) {
      return true;
    }
    return false;
  });

  // Entities from other books available for Cameo inclusion into current book
  const cameoCandidates = entities.filter((e) => {
    if (selectedBookFilter === "all") return false;
    const meta = e.metadata as any;
    const metaBooks: string[] = Array.isArray(meta?.bookIds) ? meta.bookIds : [];
    const isInCurrentBook =
      metaBooks.includes(selectedBookFilter) ||
      (metaBooks.length === 0 && books.length > 0 && selectedBookFilter === books[0].id);
    return !isInCurrentBook;
  });

  // Include an existing entity into current book
  const handleIncludeCameo = async (entityId: string) => {
    if (!selectedBookFilter || selectedBookFilter === "all") return;
    setCameoSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/entities/${entityId}/include-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBookFilter }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      }
    } catch (err) {
      console.error("Include cameo error:", err);
    } finally {
      setCameoSubmitting(false);
    }
  };

  // Filtered entities based on Search, Type, & Tag
  const filteredEntities = bookEntities.filter((e) => {
    if (selectedTypeFilter !== "all" && e.typeId !== selectedTypeFilter) {
      return false;
    }
    if (selectedTagFilter !== "all" && !e.tags?.includes(selectedTagFilter)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.name?.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchTag = e.tags?.some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchTag;
    }
    return true;
  });

  // Filter type tabs: strictly 5 default types + active custom types
  const visibleTypeTabs = entityTypes.filter((t) => {
    const isBuiltIn = DEFAULT_TYPE_NAMES.includes(t.name);
    const count = bookEntities.filter((e) => e.typeId === t.id).length;
    return isBuiltIn || count > 0;
  });

  const currentBookObj = books.find((b) => b.id === selectedBookFilter);

  const initials = user.name
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Unified Project Navbar */}
      <ProjectNavbar projectId={projectId} projectName={projectName} user={user} />

      {/* Main Content */}
      <main className="wrap py-10">
        <div className="page-head mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1>Entities</h1>
            <p className="sub">
              {bookEntities.length} entitas tercatat {selectedBookFilter !== "all" && currentBookObj ? `pada ${currentBookObj.title}` : `di ${projectName}`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Cameo Inclusion Button (Only active when viewing a specific book and candidates exist) */}
            {selectedBookFilter !== "all" && cameoCandidates.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost text-xs py-2 px-3.5 flex items-center gap-1.5 text-[var(--accent)] border border-[var(--accent-soft)] hover:bg-[var(--accent-soft)] transition-colors rounded-xl font-semibold"
                onClick={() => setIsCameoModalOpen(true)}
                title="Masukkan entitas dari buku lain sebagai cameo di buku ini"
              >
                <Sparkles size={14} />
                <span>+ Ambil dari Buku Lain ({cameoCandidates.length})</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={14} />
              <span>+ Buat Entity Baru</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar (§7.2) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Entity Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTypeFilter === "all"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)]"
              }`}
              onClick={() => setSelectedTypeFilter("all")}
            >
              Semua Tipe ({bookEntities.length})
            </button>

            {visibleTypeTabs.map((t) => {
              const count = entities.filter((e) => e.typeId === t.id).length;
              return (
                <button
                  key={t.id}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedTypeFilter === t.id
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                  onClick={() => setSelectedTypeFilter(t.id)}
                >
                  {t.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Tag Filter Dropdown (§7.2) */}
            {allUsedTags.length > 0 && (
              <div className="relative">
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-medium rounded-xl pl-8 py-2 pr-7 cursor-pointer outline-none hover:border-[var(--accent)] transition-colors"
                >
                  <option value="all">Semua Tag</option>
                  {allUsedTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
                <TagIcon
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                />
                <ChevronDown
                  size={13}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                />
              </div>
            )}

            {/* View Mode Switcher Button Group */}
            <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] p-1 rounded-xl shrink-0">
              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                onClick={() => setViewMode("grid")}
                title="Tampilan Kartu Grid"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Kartu</span>
              </button>

              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "table"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                onClick={() => setViewMode("table")}
                title="Tampilan Tabel Padat Ringkas"
              >
                <List size={13} />
                <span className="hidden sm:inline">Tabel</span>
              </button>

              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "grouped"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                onClick={() => setViewMode("grouped")}
                title="Tampilan Dikelompokkan per Tipe"
              >
                <FolderTree size={13} />
                <span className="hidden sm:inline">Kelompok</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="search flex-1 md:w-64">
              <Search size={14} className="text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Cari entity atau tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Entities Section */}
        {loading ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">
            Memuat daftar entitas...
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center max-w-md mx-auto my-8 flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg mb-1">
                {searchQuery || selectedTypeFilter !== "all" || selectedTagFilter !== "all"
                  ? "Entitas Tidak Ditemukan"
                  : "Belum Ada Entity"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {searchQuery || selectedTypeFilter !== "all" || selectedTagFilter !== "all"
                  ? "Coba ubah kriteria pencarian atau filter yang kamu pilih."
                  : "Tambahkan karakter, lokasi, organisasi, objek, atau konsep pertama di duniamu."}
              </p>
            </div>
            <button
              className="btn btn-primary text-xs px-5 py-2.5 mt-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={14} />
              <span>Buat Entity Baru</span>
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* Mode 2: Tabel Padat High-Density (Mencegah Overwhelm saat Roster Banyak) */
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold uppercase text-[10.5px] tracking-wider">
                  <th className="py-3 px-4">Nama Entitas</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4 hidden md:table-cell">Deskripsi Singkat</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Tags</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {filteredEntities.map((entity) => {
                  const typeName = entity.type?.name || "Generic";
                  return (
                    <tr
                      key={entity.id}
                      className="hover:bg-[var(--bg)]/70 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/project/${projectId}/entities/${entity.id}`)}
                    >
                      <td className="py-2.5 px-4 font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                        <div className="flex items-center gap-2.5">
                          {entity.imageUrl ? (
                            <img
                              src={entity.imageUrl}
                              alt={entity.name}
                              className="w-7 h-7 rounded-lg object-cover border border-[var(--border)] shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                              {entity.name[0]}
                            </div>
                          )}
                          <span className="truncate max-w-[180px]">{entity.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]">
                          {typeName}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)] truncate max-w-[220px] hidden md:table-cell">
                        {entity.description || "-"}
                      </td>
                      <td className="py-2.5 px-4 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {entity.tags && entity.tags.length > 0 ? (
                            entity.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                                #{t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[var(--text-secondary)] opacity-50">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-[11px] font-semibold text-[var(--accent)] group-hover:underline inline-flex items-center gap-0.5">
                          Profil <ArrowRight size={11} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : viewMode === "grouped" ? (
          /* Mode 3: Dikelompokkan per Tipe Entitas */
          <div className="flex flex-col gap-6">
            {entityTypes.map((t) => {
              const typeItems = filteredEntities.filter((e) => e.typeId === t.id);
              if (typeItems.length === 0) return null;

              return (
                <div key={t.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-[var(--border)]">
                    <h3 className="font-serif font-semibold text-base text-[var(--text)] flex items-center gap-2">
                      <FolderTree size={16} className="text-[var(--accent)]" />
                      <span>{t.name}</span>
                      <span className="text-xs text-[var(--text-secondary)] font-sans font-normal">
                        ({typeItems.length})
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeItems.map((entity) => (
                      <div
                        key={entity.id}
                        className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all cursor-pointer group flex items-start gap-3"
                        onClick={() => router.push(`/project/${projectId}/entities/${entity.id}`)}
                      >
                        {entity.imageUrl ? (
                          <img
                            src={entity.imageUrl}
                            alt={entity.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[var(--border)] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                            {entity.name[0]}
                          </div>
                        )}
                        <div className="truncate flex-1">
                          <h4 className="font-serif font-semibold text-xs text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                            {entity.name}
                          </h4>
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-normal">
                            {entity.description || "Belum ada deskripsi."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Mode 1: Kartu Grid Standar */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntities.map((entity) => {
              const typeName = entity.type?.name || "Generic";

              const bgBadge =
                typeName === "Character"
                  ? "var(--accent-soft)"
                  : typeName === "Location"
                  ? "var(--sage-soft)"
                  : typeName === "Concept"
                  ? "var(--rose-soft)"
                  : "var(--accent-soft)";

              const colorBadge =
                typeName === "Character"
                  ? "var(--accent)"
                  : typeName === "Location"
                  ? "var(--sage)"
                  : typeName === "Concept"
                  ? "var(--rose)"
                  : "var(--accent)";

              return (
                <div
                  key={entity.id}
                  className="group bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow)] transition-all duration-200 cursor-pointer min-h-[160px]"
                  onClick={() =>
                    router.push(`/project/${projectId}/entities/${entity.id}`)
                  }
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: bgBadge, color: colorBadge }}
                      >
                        {typeName}
                      </span>
                      {entity.status && (
                        <span className="text-[10.5px] font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                          {entity.status}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-semibold text-lg text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                      {entity.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                      {entity.description || "Belum ada deskripsi."}
                    </p>
                  </div>

                  {/* Tags Footer (§7.2) */}
                  {entity.tags && entity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-[var(--border)]">
                      {entity.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10.5px] font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded-md border border-[var(--border)]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entity.tags.length > 3 && (
                        <span className="text-[10.5px] text-[var(--text-secondary)] self-center ml-1">
                          +{entity.tags.length - 3} lagi
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Entity Modal */}
      <CreateEntityModal
        projectId={projectId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setSelectedTypeFilter("all");
          setSelectedTagFilter("all");
          fetchTypesAndEntities();
        }}
        entityTypes={entityTypes}
      />

      {/* Cameo / Cross-Book Inclusion Modal */}
      {isCameoModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsCameoModalOpen(false);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[85vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", width: "100%" }}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--accent)]" />
                <h2 className="font-serif font-semibold text-lg text-[var(--text)]">
                  Ambil Entitas dari Buku Lain
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsCameoModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Pilih entitas yang sudah ada di duniamu untuk dimasukkan ke dalam <strong>{currentBookObj?.title || "Buku ini"}</strong> tanpa perlu mengetik ulang biodatanya.
            </p>

            {/* Search filter in cameo modal */}
            <div className="search mb-4">
              <Search size={14} className="text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Cari nama entitas..."
                value={cameoSearchQuery}
                onChange={(e) => setCameoSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {cameoCandidates
                .filter((c) =>
                  !cameoSearchQuery.trim() ||
                  c.name.toLowerCase().includes(cameoSearchQuery.toLowerCase())
                )
                .map((candidate) => {
                  const typeName = candidate.type?.name || "Generic";
                  return (
                    <div
                      key={candidate.id}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 truncate">
                        {candidate.imageUrl ? (
                          <img
                            src={candidate.imageUrl}
                            alt={candidate.name}
                            className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                            {candidate.name[0]}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-xs text-[var(--text)] truncate">
                            {candidate.name}
                          </div>
                          <div className="text-[10.5px] text-[var(--text-secondary)] font-medium">
                            {typeName} {candidate.tags?.length > 0 ? `· #${candidate.tags.join(" #")}` : ""}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                        disabled={cameoSubmitting}
                        onClick={() => handleIncludeCameo(candidate.id)}
                      >
                        <Check size={12} />
                        <span>Tambahkan</span>
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                className="btn btn-secondary text-xs px-4 py-2"
                onClick={() => setIsCameoModalOpen(false)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
