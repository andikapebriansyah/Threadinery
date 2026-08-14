"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
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

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchBooks();

    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsBookPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [project.id]);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/books`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
          if (!selectedBookId || !data.some((b) => b.id === selectedBookId)) {
            setSelectedBookId(data[0].id);
          }
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

  const currentBook = books.find((b) => b.id === selectedBookId) || books[0];
  const isEmpty = project._count.entities === 0 && project._count.chapters === 0;

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
      countText: `${project._count.entities} entity`,
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
      countText: `${project._count.events} event`,
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
      countText: `${project._count.chapters} chapter`,
    },
    {
      id: "events",
      href: `/project/${project.id}/events`,
      title: "Events",
      subtitle: "Kelola semua kejadian",
      icon: Calendar,
      color: "var(--accent)",
      bgSoft: "var(--accent-soft)",
      countText: `${project._count.events} event`,
    },
  ];

  // User initials
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RA";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Topbar Navigation */}
      <header className="topbar">
        <div className="topbar-inner flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
            <div className="w-px h-5 bg-[var(--border)]" />
            <ThreadinaryLogo size="sm" href="/dashboard" />
          </div>

          <div className="topbar-right flex items-center gap-3">
            {/* Custom Interactive Book Selector Popover (§9.1) */}
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs md:text-sm font-medium rounded-xl px-3.5 py-2 flex items-center gap-2 hover:border-[var(--accent)] transition-colors shadow-sm"
                onClick={() => setIsBookPopoverOpen(!isBookPopoverOpen)}
              >
                <BookOpen size={15} className="text-[var(--accent)] shrink-0" />
                <span className="truncate max-w-[140px] md:max-w-[180px] font-semibold">
                  {currentBook?.title || "Buku 1"}
                </span>
                <ChevronDown size={14} className="text-[var(--text-secondary)] shrink-0" />
              </button>

              {/* Custom Book Popover Menu */}
              {isBookPopoverOpen && (
                <div className="absolute right-0 top-11 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1.5 text-xs font-medium">
                  <div className="px-3 py-1 text-[10.5px] uppercase font-bold tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 flex items-center justify-between">
                    <span>Daftar Buku ({books.length})</span>
                    <span className="text-[10px] text-[var(--accent)] font-normal">Klik nama untuk pilih</span>
                  </div>

                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-0.5">
                    {books.map((b) => {
                      const isSelected = b.id === selectedBookId;
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-semibold"
                              : "bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
                          }`}
                        >
                          {/* Book Title Selector */}
                          <div
                            className="flex items-center gap-2 truncate cursor-pointer flex-1 py-0.5"
                            onClick={() => {
                              setSelectedBookId(b.id);
                              setIsBookPopoverOpen(false);
                            }}
                          >
                            {isSelected ? (
                              <Check size={14} className="text-[var(--accent)] shrink-0" />
                            ) : (
                              <BookOpen size={13} className="text-[var(--text-secondary)] shrink-0 opacity-60" />
                            )}
                            <span className="truncate text-xs">{b.title}</span>
                          </div>

                          {/* Explicit ALWAYS-VISIBLE Edit & Delete Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center gap-1 transition-all text-[11px]"
                              onClick={(e) => openEditBookModal(e, b)}
                              title="Edit nama buku"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--rose)] hover:border-[var(--rose)] transition-all"
                              onClick={(e) => openDeleteBookModal(e, b)}
                              title="Hapus buku"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="h-px bg-[var(--border)] my-0.5" />

                  {/* Add New Book Button */}
                  <button
                    type="button"
                    className="w-full px-3 py-2 rounded-xl font-semibold text-[var(--accent)] bg-[var(--accent-soft)] hover:bg-opacity-80 flex items-center justify-center gap-1.5 transition-colors text-xs"
                    onClick={() => {
                      setIsBookPopoverOpen(false);
                      setIsAddBookModalOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    <span>+ Tambah Buku Baru...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              aria-label="Ganti tema"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>

            {/* Avatar */}
            <div className="avatar" title={user.name || "User"}>
              {initials}
            </div>
          </div>
        </div>
      </header>

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
          <div className="text-sm text-[var(--text-secondary)] font-medium tracking-wide">
            {project._count.entities} entity &nbsp;·&nbsp; {project._count.relationships} relationship &nbsp;·&nbsp; {project._count.events} event &nbsp;·&nbsp; {books.length} buku
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
    </div>
  );
}
