"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { ProjectNavbar } from "./ProjectNavbar";
import {
  Users,
  Network,
  Clock,
  GitFork,
  MapPin,
  FileText,
  Calendar,
  ArrowLeft,
  ChevronDown,
  Plus,
  BookPlus,
  Edit2,
  Trash2,
  BookOpen,
  Check,
  AlertTriangle,
  Activity,
  ArrowRight,
} from "lucide-react";

interface BookItem {
  id: string;
  title: string;
  orderIndex: number;
}

interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  books: BookItem[];
  _count: {
    entities: number;
    relationships: number;
    events: number;
    chapters: number;
  };
}

interface ProjectDashboardClientProps {
  project: ProjectData;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export function ProjectDashboardClient({ project, user }: ProjectDashboardClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [books, setBooks] = useState<BookItem[]>(project.books || []);
  const [selectedBookId, setSelectedBookId] = useState<string>(
    project.books[0]?.id || ""
  );

  // Book Popover Dropdown state
  const [isBookPopoverOpen, setIsBookPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Add Book Modal State
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [addBookError, setAddBookError] = useState<string | null>(null);

  // Edit Book Modal State
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [editBookTitle, setEditBookTitle] = useState("");
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [editBookError, setEditBookError] = useState<string | null>(null);

  // Delete Book Modal State
  const [deletingBook, setDeletingBook] = useState<BookItem | null>(null);
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [deleteBookError, setDeleteBookError] = useState<string | null>(null);

  // Recent Activity Feed State & Scoped Counts
  const [recentEntities, setRecentEntities] = useState<any[]>([]);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [allEntities, setAllEntities] = useState<any[]>([]);

  // Book Selection Gate Modal (Triggered on entry when project has > 1 books)
  const [isBookSelectModalOpen, setIsBookSelectModalOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchBooks();
    fetchProjectOverviewData();

    // Check if user has chosen a book in this session
    const hasChosen = sessionStorage.getItem(`threadinery_book_chosen_${project.id}`);
    if (!hasChosen && project.books && project.books.length > 1) {
      setIsBookSelectModalOpen(true);
    }

    // Listen to book selection changes from ProjectNavbar
    const handleBookChange = (e: any) => {
      if (e.detail?.bookId) {
        setSelectedBookId(e.detail.bookId);
      }
    };
    window.addEventListener("threadinery:book_change", handleBookChange);

    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsBookPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("threadinery:book_change", handleBookChange);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [project.id]);

  const selectActiveBook = (bookId: string) => {
    setSelectedBookId(bookId);
    localStorage.setItem(`threadinery_active_book_${project.id}`, bookId);
    sessionStorage.setItem(`threadinery_book_chosen_${project.id}`, "true");
    window.dispatchEvent(new CustomEvent("threadinery:book_change", { detail: { bookId } }));
    setIsBookSelectModalOpen(false);
  };

  const fetchProjectOverviewData = async () => {
    try {
      const [entitiesRes, chaptersRes, eventsRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/entities`),
        fetch(`/api/projects/${project.id}/chapters`),
        fetch(`/api/projects/${project.id}/events`),
      ]);

      if (entitiesRes.ok) {
        const entData = await entitiesRes.json();
        if (Array.isArray(entData)) {
          setAllEntities(entData);
          setRecentEntities(entData.slice(0, 5));
        }
      }

      if (chaptersRes.ok) {
        const chapData = await chaptersRes.json();
        if (Array.isArray(chapData)) {
          setAllChapters(chapData);
        }
      }

      if (eventsRes.ok) {
        const evData = await eventsRes.json();
        if (Array.isArray(evData)) {
          setAllEvents(evData);
        }
      }
    } catch (err) {
      console.warn("Fetch project overview data error:", err);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/books`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
          const savedBookId = localStorage.getItem(`threadinery_active_book_${project.id}`);
          const validSaved = data.find((b: any) => b.id === savedBookId);
          const initialId = validSaved ? validSaved.id : data[0].id;
          setSelectedBookId(initialId);
        }
      }
    } catch (err) {
      console.warn("Fetch books error:", err);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Add New Book Submit
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    setAddBookError(null);
    setIsAddingBook(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBookTitle.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat buku baru");
      }

      const createdBook = await res.json();
      const updatedBooks = [...books, createdBook];
      setBooks(updatedBooks);
      setSelectedBookId(createdBook.id);
      setIsAddBookModalOpen(false);
      setNewBookTitle("");
    } catch (err: any) {
      console.error("Create book error:", err);
      setAddBookError(err.message || "Gagal menambah buku");
    } finally {
      setIsAddingBook(false);
    }
  };

  // Open Edit Book Modal
  const openEditBookModal = (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    setEditingBook(book);
    setEditBookTitle(book.title);
    setEditBookError(null);
    setIsBookPopoverOpen(false);
  };

  // Submit Edit Book
  const handleSaveEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !editBookTitle.trim()) return;

    setEditBookError(null);
    setIsEditingBook(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/books/${editingBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editBookTitle.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengedit buku");
      }

      const updated = await res.json();
      setBooks(books.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBook(null);
    } catch (err: any) {
      console.error("Edit book error:", err);
      setEditBookError(err.message || "Gagal mengedit nama buku");
    } finally {
      setIsEditingBook(false);
    }
  };

  // Open Delete Book Modal
  const openDeleteBookModal = (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    if (books.length <= 1) {
      alert("Dunia harus memiliki minimal 1 buku. Tidak dapat menghapus buku terakhir.");
      return;
    }
    setDeletingBook(book);
    setDeleteBookError(null);
    setIsBookPopoverOpen(false);
  };

  // Submit Delete Book
  const handleConfirmDeleteBook = async () => {
    if (!deletingBook) return;

    setDeleteBookError(null);
    setIsDeletingBook(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/books/${deletingBook.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus buku");
      }

      const updatedBooks = books.filter((b) => b.id !== deletingBook.id);
      setBooks(updatedBooks);

      if (selectedBookId === deletingBook.id && updatedBooks.length > 0) {
        setSelectedBookId(updatedBooks[0].id);
      }

      setDeletingBook(null);
    } catch (err: any) {
      console.error("Delete book error:", err);
      setDeleteBookError(err.message || "Gagal menghapus buku");
    } finally {
      setIsDeletingBook(false);
    }
  };

  const isAllBooks = selectedBookId === "ALL";
  const currentBook = books.find((b) => b.id === selectedBookId) || (isAllBooks ? null : books[0]);
  const isEmpty = project._count.entities === 0 && project._count.chapters === 0;

  const bookScopedChaptersCount = useMemo(() => {
    if (isAllBooks || !selectedBookId) return allChapters.length || project._count.chapters;
    return allChapters.filter((c) => c.bookId === selectedBookId).length;
  }, [allChapters, selectedBookId, isAllBooks, project._count.chapters]);

  const bookScopedEventsCount = useMemo(() => {
    if (isAllBooks || !selectedBookId) return allEvents.length || project._count.events;
    const isPrimary = books.length > 0 && selectedBookId === books[0].id;
    return allEvents.filter((e) => e.bookId === selectedBookId || (!e.bookId && isPrimary)).length;
  }, [allEvents, selectedBookId, isAllBooks, books, project._count.events]);

  const bookScopedEntitiesCount = useMemo(() => {
    if (isAllBooks || !selectedBookId) return allEntities.length || project._count.entities;
    const isPrimary = books.length > 0 && selectedBookId === books[0].id;
    return allEntities.filter((e) => {
      const bookIds = e.metadata?.bookIds;
      if (Array.isArray(bookIds) && bookIds.length > 0) {
        return bookIds.includes(selectedBookId);
      }
      return isPrimary;
    }).length;
  }, [allEntities, selectedBookId, isAllBooks, books, project._count.entities]);

  // 7 Navigation Cards specified in instruction.md Section 9.1
  const NAV_CARDS = [
    {
      id: "entities",
      href: `/project/${project.id}/entities`,
      title: "Entities",
      subtitle: "Karakter, lokasi, objek",
      icon: Users,
      color: "var(--accent)",
      bgSoft: "var(--accent-soft)",
      countText: `${bookScopedEntitiesCount} entity ${!isAllBooks && currentBook ? `(${currentBook.title})` : ""}`.trim(),
    },
    {
      id: "graph",
      href: `/project/${project.id}/graph`,
      title: "Graph",
      subtitle: "Koneksi antar entity",
      icon: Network,
      color: "var(--sage)",
      bgSoft: "var(--sage-soft)",
      countText: `${project._count.relationships} koneksi`,
    },
    {
      id: "timeline",
      href: `/project/${project.id}/timeline`,
      title: "Timeline",
      subtitle: "Urutan kronologi world",
      icon: Clock,
      color: "var(--rose)",
      bgSoft: "var(--rose-soft)",
      countText: `${bookScopedEventsCount} event kronologi`,
    },
    {
      id: "family-tree",
      href: `/project/${project.id}/family-tree`,
      title: "Family tree",
      subtitle: "Pohon keluarga",
      icon: GitFork,
      color: "var(--accent)",
      bgSoft: "var(--accent-soft)",
      countText: null,
    },
    {
      id: "map",
      href: `/project/${project.id}/map`,
      title: "Map",
      subtitle: "Peta custom + marker",
      icon: MapPin,
      color: "var(--sage)",
      bgSoft: "var(--sage-soft)",
      countText: null,
    },
    {
      id: "outline",
      href: `/project/${project.id}/outline`,
      title: "Outline",
      subtitle: "Ringkasan per chapter",
      icon: FileText,
      color: "var(--rose)",
      bgSoft: "var(--rose-soft)",
      countText: `${bookScopedChaptersCount} chapter ${!isAllBooks && currentBook ? `(${currentBook.title})` : ""}`.trim(),
    },
    {
      id: "events",
      href: `/project/${project.id}/events`,
      title: "Events",
      subtitle: "Kelola semua kejadian",
      icon: Calendar,
      color: "var(--accent)",
      bgSoft: "var(--accent-soft)",
      countText: `${bookScopedEventsCount} event ${!isAllBooks && currentBook ? `(${currentBook.title})` : ""}`.trim(),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Unified Project Navbar */}
      <ProjectNavbar projectId={project.id} projectName={project.name} user={user} />

      {/* Main Content Wrap */}
      <main className="wrap pb-16" style={{ paddingTop: "24px" }}>
        {/* Project Header Info */}
        <div className="mb-8" style={{ marginTop: "16px" }}>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[var(--text)] mb-2 tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mb-3">
              {project.description}
            </p>
          )}

          {/* Counts Total as Subtle Text (§9.1: BUKAN kartu metric besar) */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)] font-medium tracking-wide">
            <div>
              {bookScopedEntitiesCount} entity &nbsp;·&nbsp; {project._count.relationships} relationship &nbsp;·&nbsp; {bookScopedEventsCount} event &nbsp;·&nbsp; {books.length} buku
            </div>

            {books.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                onClick={() => setIsBookSelectModalOpen(true)}
              >
                <BookOpen size={13} className="text-[var(--accent)]" />
                <span>Buku Aktif: <strong>{isAllBooks ? "Seluruh Dunia (Semua Buku)" : (currentBook?.title || "Buku 1")}</strong></span>
                <span className="text-[10px] text-[var(--text-secondary)] underline ml-1">(Ganti)</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State Banner — DUAL CTA (§9.1) dengan Warm Accent Palette */}
        {isEmpty && (
          <div
            className="mb-10 p-6 md:p-8 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
            style={{ backgroundColor: "var(--accent)", color: "#FFF9F3" }}
          >
            <div className="max-w-xl">
              <h2 className="font-serif text-xl md:text-2xl font-semibold mb-2" style={{ color: "#FFF9F3" }}>
                Mulai bangun duniamu
              </h2>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: "rgba(255, 249, 243, 0.9)" }}>
                Belum ada apa-apa di sini. Mau mulai dari mana?
              </p>
            </div>

            {/* DUAL CTA: 2 Tombol Setara (§9.1) tanpa simbol ganda & kontras teks tajam */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link
                href={`/project/${project.id}/entities`}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 text-decoration-none flex items-center gap-1.5"
                style={{ backgroundColor: "#FFFFFF", color: "var(--accent)" }}
              >
                <Plus size={16} />
                <span>Tambah karakter</span>
              </Link>
              <Link
                href={`/project/${project.id}/outline`}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 text-decoration-none flex items-center gap-1.5"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                }}
              >
                <Plus size={16} />
                <span>Mulai outline</span>
              </Link>
            </div>
          </div>
        )}

        {/* 7 Navigation Cards Grid (§9.1: Persis 7 Kartu Navigasi) */}
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {NAV_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.id} href={card.href}>
                  <div className="group bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between min-h-[148px] hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow)] transition-all duration-200 cursor-pointer">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ background: card.bgSoft, color: card.color }}
                      >
                        <Icon size={20} />
                      </div>
                      {card.countText && (
                        <span className="text-[11.5px] font-semibold text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                          {card.countText}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-serif font-semibold text-lg text-[var(--text)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Activity Feed (§9.1: Aktivitas terbaru muncul di sini setelah mulai menambah data) */}
        {!isEmpty && recentEntities.length > 0 && (
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[var(--accent)]" />
                <h3 className="font-serif font-semibold text-lg text-[var(--text)]">
                  Aktivitas Terbaru
                </h3>
              </div>
              <Link
                href={`/project/${project.id}/entities`}
                className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <span>Kelola Semua Entitas</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentEntities.map((ent) => (
                <Link
                  key={ent.id}
                  href={`/project/${project.id}/entities/${ent.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all group"
                >
                  <div className="flex items-center gap-3 truncate">
                    {ent.imageUrl ? (
                      <img
                        src={ent.imageUrl}
                        alt={ent.name}
                        className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                        {ent.name[0]}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-semibold text-xs text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {ent.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-medium truncate">
                        {ent.type?.name || "Entitas"} {ent.tags?.length > 0 ? `· ${ent.tags.join(", ")}` : ""}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--text-secondary)] shrink-0 ml-2 group-hover:text-[var(--accent)]">
                    Lihat Profil →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: TAMBAH BUKU BARU */}
      {isAddBookModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddBookModalOpen(false);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px", width: "100%" }}
          >
            <div className="modal-header">
              <h2 className="flex items-center gap-2">
                <BookPlus size={18} className="text-[var(--accent)]" />
                <span>Tambah Buku Baru</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsAddBookModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {addBookError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2 rounded-xl text-xs font-medium mb-3">
                {addBookError}
              </div>
            )}

            <form onSubmit={handleCreateBook} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Judul Buku *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="Misal: Buku 2: Badai Wesdonia, Bagian 3..."
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsAddBookModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={isAddingBook}
                >
                  {isAddingBook ? "Menambah..." : "Simpan Buku"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT NAMA BUKU */}
      {editingBook && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingBook(null);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px", width: "100%" }}
          >
            <div className="modal-header">
              <h2 className="flex items-center gap-2">
                <Edit2 size={18} className="text-[var(--accent)]" />
                <span>Edit Nama Buku</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingBook(null)}
              >
                ✕
              </button>
            </div>

            {editBookError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2 rounded-xl text-xs font-medium mb-3">
                {editBookError}
              </div>
            )}

            <form onSubmit={handleSaveEditBook} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Judul Buku *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={editBookTitle}
                  onChange={(e) => setEditBookTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setEditingBook(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={isEditingBook}
                >
                  {isEditingBook ? "Memperbarui..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE BOOK */}
      {deletingBook && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingBook(null);
          }}
          style={{ zIndex: 110 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-3">
              <h2 className="text-[#991B1B] flex items-center gap-2">
                <AlertTriangle size={20} className="text-[#DC2626]" />
                <span>Hapus Buku {deletingBook.title}?</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeletingBook(null)}
              >
                ✕
              </button>
            </div>

            {deleteBookError && (
              <div className="bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] px-3.5 py-2.5 rounded-xl text-xs font-medium my-2">
                {deleteBookError}
              </div>
            )}

            <div className="flex flex-col gap-4 py-3 text-xs leading-relaxed">
              <p className="text-sm font-medium text-[var(--text)]">
                Apakah Anda yakin ingin menghapus buku <strong>"{deletingBook.title}"</strong>?
              </p>

              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] flex flex-col gap-1">
                <span className="font-bold">⚠️ Peringatan:</span>
                <span>
                  Buku ini beserta seluruh outline chapter di dalamnya akan terhapus dari daftar.
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setDeletingBook(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn text-xs px-5 text-white font-semibold shadow-sm active:scale-95"
                  style={{ backgroundColor: "#DC2626" }}
                  onClick={handleConfirmDeleteBook}
                  disabled={isDeletingBook}
                >
                  {isDeletingBook ? "Menghapus..." : "Ya, Hapus Buku Ini"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: BOOK SELECTION ENTRY GATE ── */}
      {isBookSelectModalOpen && books.length > 1 && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsBookSelectModalOpen(false);
          }}
          style={{ zIndex: 120 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[var(--text)]">
                  <BookOpen size={20} className="text-[var(--accent)]" />
                  <span>Pilih Buku untuk Dikelola</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Proyek <strong>"{project.name}"</strong> memiliki {books.length} buku. Pilih buku yang ingin Anda tulis atau kelola saat ini:
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsBookSelectModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* List of Books Cards */}
            <div className="flex flex-col gap-3 my-4">
              {books.map((b, idx) => {
                const isCurrent = b.id === selectedBookId;
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isCurrent
                        ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-sm"
                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:shadow-md"
                    }`}
                    onClick={() => selectActiveBook(b.id)}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] font-serif font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-semibold text-sm text-[var(--text)] truncate">
                            {b.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Kelola outline, event, dan alur cerita buku ini
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn text-xs px-4 py-2 shrink-0 ${
                        isCurrent ? "btn-primary" : "btn-secondary"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectActiveBook(b.id);
                      }}
                    >
                      Buka Buku Ini →
                    </button>
                  </div>
                );
              })}

              {/* Option: Seluruh Dunia (Semua Buku) */}
              <div
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  selectedBookId === "ALL"
                    ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-sm"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:shadow-md"
                }`}
                onClick={() => selectActiveBook("ALL")}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] font-serif font-bold text-sm shrink-0">
                    🌐
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-semibold text-sm text-[var(--text)] truncate">
                        Seluruh Dunia (Semua Buku)
                      </h4>
                      {selectedBookId === "ALL" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Lihat seluruh data entitas, chapter, dan event se-dunia tanpa filter
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn text-xs px-4 py-2 shrink-0 ${
                    selectedBookId === "ALL" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectActiveBook("ALL");
                  }}
                >
                  Lihat Semua →
                </button>
              </div>
            </div>

            {/* Footer with Create New Book option */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                className="btn btn-ghost text-xs text-[var(--accent)] flex items-center gap-1.5"
                onClick={() => {
                  setIsBookSelectModalOpen(false);
                  setIsAddBookModalOpen(true);
                }}
              >
                <Plus size={14} />
                <span>+ Buat Buku Baru di Seri Ini</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs px-4"
                onClick={() => setIsBookSelectModalOpen(false)}
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
