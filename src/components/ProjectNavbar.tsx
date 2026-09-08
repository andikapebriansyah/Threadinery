"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { GlobalSearchModal } from "./GlobalSearchModal";
import {
  ArrowLeft,
  Users,
  Network,
  Clock,
  GitFork,
  MapPin,
  FileText,
  Calendar,
  LayoutDashboard,
  Search,
  BookOpen,
  ChevronDown,
  Plus,
  BookPlus,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { QuickAddModal } from "./QuickAddModal";

interface BookItem {
  id: string;
  title: string;
  orderIndex: number;
}

interface ProjectNavbarProps {
  projectId: string;
  projectName?: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export function ProjectNavbar({ projectId, projectName, user }: ProjectNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Books State & Popover
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [isBookPopoverOpen, setIsBookPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // User Dropdown State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Add Book Modal State
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [addBookError, setAddBookError] = useState<string | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchBooks();

    // Global Cmd/Ctrl+K and Quick Add Keyboard Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") || (e.altKey && e.key.toLowerCase() === "n")) {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Outside click for book popover and user menu
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsBookPopoverOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleBookChange = (e: any) => {
      if (e.detail?.bookId) {
        setSelectedBookId(e.detail.bookId);
      }
    };
    window.addEventListener("threadinery:book_change", handleBookChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("threadinery:book_change", handleBookChange);
    };
  }, [projectId]);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/books`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
          const savedBookId = localStorage.getItem(`threadinery_active_book_${projectId}`);
          if (savedBookId === "ALL") {
            setSelectedBookId("ALL");
          } else {
            const validSaved = data.find((b: any) => b.id === savedBookId);
            const initialId = validSaved ? validSaved.id : data[0].id;
            setSelectedBookId(initialId);
            localStorage.setItem(`threadinery_active_book_${projectId}`, initialId);
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

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/", redirect: false });
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    window.location.href = "/";
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    setAddBookError(null);
    setIsAddingBook(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBookTitle.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat buku baru");
      }

      const createdBook = await res.json();
      setBooks((prev) => [...prev, createdBook]);
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

  const isAll = selectedBookId === "ALL";
  const currentBook = books.find((b) => b.id === selectedBookId) || (isAll ? null : books[0]);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RA";

  const NAV_TABS = [
    { id: "dashboard", label: "Dashboard", href: `/project/${projectId}`, icon: LayoutDashboard },
    { id: "entities", label: "Entities", href: `/project/${projectId}/entities`, icon: Users },
    { id: "graph", label: "Graph", href: `/project/${projectId}/graph`, icon: Network },
    { id: "timeline", label: "Timeline", href: `/project/${projectId}/timeline`, icon: Clock },
    { id: "family-tree", label: "Family Tree", href: `/project/${projectId}/family-tree`, icon: GitFork },
    { id: "map", label: "Map", href: `/project/${projectId}/map`, icon: MapPin },
    { id: "outline", label: "Outline", href: `/project/${projectId}/outline`, icon: FileText },
    { id: "events", label: "Events", href: `/project/${projectId}/events`, icon: Calendar },
  ];

  return (
    <>
      <header className="topbar sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-xs">
        {/* Top Header Bar */}
        <div className="wrap flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors shrink-0"
              title="Kembali ke My Stories"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">My Stories</span>
            </Link>
            <div className="w-px h-4 bg-[var(--border)] shrink-0" />
            <ThreadinaryLogo size="sm" href="/dashboard" />
            {projectName && (
              <span className="font-serif font-semibold text-xs text-[var(--text)] truncate max-w-[160px] hidden md:inline border-l border-[var(--border)] pl-3">
                {projectName}
              </span>
            )}
          </div>

          <div className="topbar-right flex items-center gap-2 md:gap-3">
            {/* Global Quick Add Button (§7.7) */}
            <button
              type="button"
              className="bg-[var(--accent)] text-white hover:opacity-90 font-medium text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
              onClick={() => setIsQuickAddOpen(true)}
              title="Quick Add Global: Tambah entitas, event, atau bab baru secara instan (Alt+N / Ctrl+J)"
            >
              <Plus size={13} className="stroke-[2.5]" />
              <span className="font-semibold hidden sm:inline">Quick Add</span>
            </button>

            {/* Global Search Button (Cmd/Ctrl + K) */}
            <button
              type="button"
              className="search max-w-[180px] md:max-w-[220px] py-1.5 px-3 flex items-center gap-2 cursor-pointer bg-[var(--bg)] hover:border-[var(--accent)] transition-all rounded-xl border border-[var(--border)]"
              onClick={() => setIsSearchOpen(true)}
              title="Cari entitas, event, chapter... (Ctrl+K)"
            >
              <Search size={13} className="text-[var(--text-secondary)] shrink-0" />
              <span className="text-xs text-[var(--text-secondary)] truncate">Cari (Ctrl+K)...</span>
            </button>

            {/* Book Selector Popover */}
            {books.length > 0 && (
              <div className="relative" ref={popoverRef}>
                <button
                  type="button"
                  className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-medium rounded-xl px-3 py-1.5 flex items-center gap-1.5 hover:border-[var(--accent)] transition-colors"
                  onClick={() => setIsBookPopoverOpen(!isBookPopoverOpen)}
                >
                  <BookOpen size={13} className="text-[var(--accent)] shrink-0" />
                  <span className="truncate max-w-[100px] md:max-w-[140px] font-semibold">
                    {isAll ? "Seluruh Dunia" : (currentBook?.title || "Buku 1")}
                  </span>
                  <ChevronDown size={13} className="text-[var(--text-secondary)] shrink-0" />
                </button>

                {isBookPopoverOpen && (
                  <div className="absolute right-0 top-9 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 text-xs font-medium">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[var(--text-secondary)] border-b border-[var(--border)] flex items-center justify-between">
                      <span>Daftar Buku ({books.length})</span>
                      <button
                        type="button"
                        className="text-[var(--accent)] hover:underline flex items-center gap-0.5"
                        onClick={() => {
                          setIsBookPopoverOpen(false);
                          setIsAddBookModalOpen(true);
                        }}
                      >
                        <Plus size={11} />
                        <span>Buku Baru</span>
                      </button>
                    </div>

                    {/* Option: Seluruh Dunia (Semua Buku) */}
                    <div
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border-b border-[var(--border)] pb-1.5 mb-0.5 ${
                        selectedBookId === "ALL"
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold"
                          : "hover:bg-[var(--bg)] text-[var(--text)]"
                      }`}
                      onClick={() => {
                        setSelectedBookId("ALL");
                        localStorage.setItem(`threadinery_active_book_${projectId}`, "ALL");
                        window.dispatchEvent(
                          new CustomEvent("threadinery:book_change", { detail: { bookId: "ALL" } })
                        );
                        setIsBookPopoverOpen(false);
                      }}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>🌐</span>
                        <span>Seluruh Dunia (Semua Buku)</span>
                      </span>
                      {selectedBookId === "ALL" && <Check size={12} />}
                    </div>

                    {books.map((b) => {
                      const isSelected = b.id === selectedBookId;
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold"
                              : "hover:bg-[var(--bg)] text-[var(--text)]"
                          }`}
                          onClick={() => {
                            setSelectedBookId(b.id);
                            localStorage.setItem(`threadinery_active_book_${projectId}`, b.id);
                            window.dispatchEvent(
                              new CustomEvent("threadinery:book_change", { detail: { bookId: b.id } })
                            );
                            setIsBookPopoverOpen(false);
                          }}
                        >
                          <span className="truncate">{b.title}</span>
                          {isSelected && <Check size={12} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              className="theme-toggle w-8 h-8 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text)]"
              aria-label="Ganti tema"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>

            {/* User Avatar & Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="avatar w-8 h-8 text-xs font-bold shrink-0 cursor-pointer hover:ring-2 hover:ring-[var(--accent)] transition-all flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen((prev) => !prev);
                }}
                title={user.name || "User"}
                aria-label="Menu Pengguna"
              >
                {initials}
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-10 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="font-semibold text-[var(--text)] truncate">{user.name || "Penulis"}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">{user.email || "writer@threadinery.dev"}</p>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <LayoutDashboard size={13} className="text-[var(--text-secondary)]" />
                    <span>My Stories (Semua Dunia)</span>
                  </Link>

                  <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <ExternalLink size={13} className="text-[var(--text-secondary)]" />
                    <span>Halaman Depan (Landing)</span>
                  </Link>

                  <div className="h-px bg-[var(--border)] my-1" />

                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--rose)] hover:bg-[var(--rose-soft)] transition-colors w-full text-left cursor-pointer font-semibold"
                    onClick={handleLogout}
                  >
                    <LogOut size={13} />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-[var(--border)]/60">
          <nav className="wrap flex items-center gap-1 overflow-x-auto scrollbar-none">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              // Active if exact match or subpath match
              const isActive =
                tab.id === "dashboard"
                  ? pathname === `/project/${projectId}`
                  : pathname?.startsWith(`/project/${projectId}/${tab.id}`);

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 ${
                    isActive
                      ? "border-[var(--accent)] text-[var(--accent)] font-bold bg-[var(--accent-soft)]/30"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]/50"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        projectId={projectId}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Add Book Modal */}
      {isAddBookModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddBookModalOpen(false);
          }}
          style={{ zIndex: 110 }}
        >
          <div
            className="modal-content overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px", width: "100%" }}
          >
            <div className="modal-header">
              <h2>Tambah Buku Baru</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsAddBookModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {addBookError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2.5 rounded-xl text-xs font-medium mb-3">
                {addBookError}
              </div>
            )}

            <form onSubmit={handleCreateBook} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Judul Buku *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder='Misal: "Buku 2: Kebangkitan Kegelapan"...'
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsAddBookModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5"
                  disabled={isAddingBook}
                >
                  {isAddingBook ? "Menyimpan..." : "Simpan Buku"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Persistent Floating Action Button (FAB) for Quick Add (§7.7) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent)] text-white font-medium text-xs shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group border border-white/20"
          title="Quick Add Global: Catat ide instan (Alt+N / Ctrl+J)"
        >
          <Sparkles size={14} className="text-yellow-200 group-hover:rotate-12 transition-transform duration-200" />
          <span className="font-semibold pr-0.5">Quick Add</span>
          <Plus size={14} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Global Quick Add Modal */}
      <QuickAddModal
        projectId={projectId}
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        activeBookId={selectedBookId}
      />
    </>
  );
}
