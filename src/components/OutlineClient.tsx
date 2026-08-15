"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { SmartEntityPickerWithFilters } from "./SmartEntityPickerWithFilters";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Link2,
  X,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

interface BookData {
  id: string;
  title: string;
  orderIndex: number;
}

interface LinkedEntity {
  id: string;
  name: string;
}

interface EventInvolvedItem {
  entity: LinkedEntity;
}

interface EventData {
  id: string;
  name: string;
  worldDate?: string | null;
  writingStatus?: string | null;
  orderInChapter?: number | null;
  entitiesInvolved?: EventInvolvedItem[];
}

interface ChapterData {
  id: string;
  projectId: string;
  bookId: string;
  orderIndex: number;
  title: string;
  summary: string | null;
  book?: BookData;
  events?: EventData[];
}

interface EntitySimple {
  id: string;
  name: string;
  typeId: string;
  type?: { id: string; name: string };
  tags?: string[];
}

interface EntityTypeItem {
  id: string;
  name: string;
}

interface OutlineClientProps {
  projectId: string;
  projectName: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export function OutlineClient({
  projectId,
  projectName,
  user,
}: OutlineClientProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [books, setBooks] = useState<BookData[]>([]);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [allEntities, setAllEntities] = useState<EntitySimple[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Drawers
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);

  // Chapter Form State (§7.8)
  const [formTitle, setFormTitle] = useState("");
  const [formBookId, setFormBookId] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formLinkedEventIds, setFormLinkedEventIds] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Create Event Inline inside Chapter Modal (§7.8 & §7.6)
  const [isQuickCreateEventOpen, setIsQuickCreateEventOpen] = useState(false);
  const [quickEventName, setQuickEventName] = useState("");
  const [quickEventWorldDate, setQuickEventWorldDate] = useState("");
  const [quickEventEntityId, setQuickEventEntityId] = useState("");
  const [quickEventSubmitting, setQuickEventSubmitting] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchAllOutlineData();
  }, [projectId]);

  const fetchAllOutlineData = async () => {
    try {
      setLoading(true);
      const [chaptersRes, booksRes, eventsRes, entitiesRes, typesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/chapters`),
        fetch(`/api/projects/${projectId}/books`),
        fetch(`/api/projects/${projectId}/events`),
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/entity-types`),
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        if (Array.isArray(booksData)) setBooks(booksData);
      }

      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json();
        if (Array.isArray(chaptersData)) setChapters(chaptersData);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) setAllEvents(eventsData);
      }

      if (entitiesRes.ok) {
        const entData = await entitiesRes.json();
        if (Array.isArray(entData)) setAllEntities(entData);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (Array.isArray(typesData)) setEntityTypes(typesData);
      }
    } catch (err) {
      console.warn("Fetch outline data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Filtered Chapters based on Book Selector and Search Query
  const filteredChapters = useMemo(() => {
    let list = chapters;

    if (selectedBookFilter !== "ALL") {
      list = list.filter((c) => c.bookId === selectedBookFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.summary && c.summary.toLowerCase().includes(q)) ||
          (c.events && c.events.some((e) => e.name.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [chapters, selectedBookFilter, searchQuery]);

  const router = useRouter();

  // Open Create Chapter Page
  const handleOpenCreateModal = () => {
    router.push(`/project/${projectId}/outline/new`);
  };

  // Open Edit Chapter Page
  const handleOpenEditModal = (ch: ChapterData) => {
    router.push(`/project/${projectId}/outline/${ch.id}`);
  };

  // Submit Create / Edit Chapter
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Judul bab wajib diisi");
      return;
    }

    setFormError(null);
    setFormSubmitting(true);

    try {
      const payload = {
        title: formTitle.trim(),
        bookId: formBookId || (books.length > 0 ? books[0].id : undefined),
        summary: formSummary.trim() || null,
        eventIds: formLinkedEventIds,
      };

      const url = editingChapterId
        ? `/api/projects/${projectId}/chapters/${editingChapterId}`
        : `/api/projects/${projectId}/chapters`;

      const method = editingChapterId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan chapter");
      }

      await fetchAllOutlineData();
      setIsChapterModalOpen(false);
    } catch (err: any) {
      console.error("Save chapter error:", err);
      setFormError(err.message || "Gagal menyimpan chapter");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Delete Chapter
  const handleConfirmDelete = async () => {
    if (!deletingChapterId) return;

    try {
      const res = await fetch(
        `/api/projects/${projectId}/chapters/${deletingChapterId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        await fetchAllOutlineData();
      }
    } catch (err) {
      console.error("Delete chapter error:", err);
    } finally {
      setDeletingChapterId(null);
    }
  };

  // Reorder Chapter Sequence Up/Down
  const handleReorderChapter = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredChapters.length) return;

    const updatedList = [...filteredChapters];
    const temp = updatedList[currentIndex];
    updatedList[currentIndex] = updatedList[targetIndex];
    updatedList[targetIndex] = temp;

    // Update orderIndex values
    const payloadItems = updatedList.map((ch, idx) => ({
      id: ch.id,
      orderIndex: idx,
    }));

    setChapters((prev) =>
      prev.map((ch) => {
        const match = payloadItems.find((p) => p.id === ch.id);
        return match ? { ...ch, orderIndex: match.orderIndex } : ch;
      })
    );

    try {
      await fetch(`/api/projects/${projectId}/chapters/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });
    } catch (err) {
      console.warn("Reorder chapter request error:", err);
      fetchAllOutlineData();
    }
  };

  // Quick Create Event Inline (§7.8 & §7.6)
  const handleQuickCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEventName.trim()) return;

    setQuickEventSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickEventName.trim(),
          worldDate: quickEventWorldDate.trim() || null,
          bookId: formBookId || (books.length > 0 ? books[0].id : undefined),
          entitiesInvolved: quickEventEntityId
            ? [{ entityId: quickEventEntityId, role: "Involved" }]
            : [],
        }),
      });

      if (res.ok) {
        const createdEvent = await res.json();
        // Add new event ID to current formLinkedEventIds
        setFormLinkedEventIds((prev) => [...prev, createdEvent.id]);
        setAllEvents((prev) => [createdEvent, ...prev]);

        setQuickEventName("");
        setQuickEventWorldDate("");
        setQuickEventEntityId("");
        setIsQuickCreateEventOpen(false);
      }
    } catch (err) {
      console.error("Quick create event error:", err);
    } finally {
      setQuickEventSubmitting(false);
    }
  };

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
              href={`/project/${projectId}`}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Project Dashboard</span>
            </Link>
            <div className="w-px h-5 bg-[var(--border)]" />
            <ThreadinaryLogo size="sm" href="/dashboard" />
          </div>

          <div className="topbar-right flex items-center gap-3">
            <button
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              onClick={handleOpenCreateModal}
            >
              <Plus size={15} />
              <span>Tambah Bab Baru</span>
            </button>

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

            <div className="avatar" title={user.name || "User"}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Full-Width Container */}
      <main className="wrap py-8">
        {/* Header Controls Bar */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[var(--text)] flex items-center gap-2.5 mb-1">
              <BookOpen size={26} className="text-[var(--accent)]" />
              <span>Outline &amp; Ringkasan Cerita</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Garis besar alur bab cerita Anda ({chapters.length} bab tercatat). Klik bab mana saja untuk melihat ringkasan &amp; menautkan event.
            </p>
          </div>

          {/* Search & Book Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="search max-w-xs py-1.5 px-3">
              <Search size={14} className="text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Cari bab atau ringkasan..."
                className="text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {books.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer outline-none hover:border-[var(--accent)] transition-colors"
                  value={selectedBookFilter}
                  onChange={(e) => setSelectedBookFilter(e.target.value)}
                >
                  <option value="ALL">Semua Buku ({chapters.length} Bab)</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* FULL-WIDTH CHAPTER OUTLINE STREAM */}
        <div className="w-full">
          {loading ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--text-secondary)]">
              Memuat outline bab cerita...
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <BookOpen size={40} className="text-[var(--accent)] opacity-50" />
              <h3 className="font-serif text-lg font-semibold text-[var(--text)]">
                {chapters.length === 0
                  ? "Belum ada Bab di Outline"
                  : "Tidak ada bab yang sesuai pencarian"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                Tulis struktur garis besar bab cerita Anda. Cukup isi judul bab dulu sebagai placeholder, ringkasan sinopsis dan penautan event sepenuhnya opsional.
              </p>
              {chapters.length === 0 && (
                <button
                  type="button"
                  className="btn btn-primary text-xs px-5 mt-2"
                  onClick={handleOpenCreateModal}
                >
                  + Buat Bab Pertama (Bab 1)
                </button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 space-y-4">
              {/* Vertical Outline Spine */}
              <div className="absolute left-2.5 top-4 bottom-4 w-0.5 bg-[var(--border)] z-0" />

              {filteredChapters.map((ch, idx) => {
                const linkedCount = ch.events ? ch.events.length : 0;
                return (
                  <div
                    key={ch.id}
                    className="relative z-10 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    onClick={() => handleOpenEditModal(ch)}
                  >
                    {/* Left Section: Reorder Grip & Chapter Number */}
                    <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="flex flex-col gap-1 items-center justify-center p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] cursor-grab"
                          title="Grip Reorder"
                        >
                          <GripVertical size={18} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-30"
                            onClick={() => handleReorderChapter(idx, "up")}
                            title="Naikkan bab"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredChapters.length - 1}
                            className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-30"
                            onClick={() => handleReorderChapter(idx, "down")}
                            title="Turunkan bab"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-xs flex items-center justify-center shrink-0 font-serif">
                        Bab {idx + 1}
                      </div>

                      {/* Chapter Title & Free-Text Summary Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-serif text-lg font-semibold text-[var(--text)] truncate">
                            {ch.title}
                          </h3>

                          {ch.book && (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]">
                              {ch.book.title}
                            </span>
                          )}

                          <span className="text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Link2 size={11} />
                            <span>{linkedCount} event terkait</span>
                          </span>
                        </div>

                        {ch.summary ? (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--border)] font-sans">
                            {ch.summary}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--text-secondary)] italic">
                            (Belum ada ringkasan sinopsis untuk bab ini)
                          </p>
                        )}

                        {/* Linked Events Badges Row */}
                        {linkedCount > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {ch.events?.map((evt) => (
                              <span
                                key={evt.id}
                                className="text-[10.5px] font-semibold text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] px-2.5 py-0.5 rounded-lg flex items-center gap-1"
                              >
                                <span>🔗 {evt.name}</span>
                                {evt.worldDate && (
                                  <span className="text-[9px] text-[var(--sage)]">
                                    ({evt.worldDate})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 text-[var(--accent)] border-[var(--accent-soft)]"
                        onClick={() => handleOpenEditModal(ch)}
                      >
                        <Edit2 size={13} />
                        <span>Edit Bab</span>
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--rose)] rounded-lg hover:bg-[var(--bg)]"
                        onClick={() => setDeletingChapterId(ch.id)}
                        title="Hapus bab"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FULL CHAPTER DETAIL & EDITOR MODAL OVERLAY (§7.8) */}
      {isChapterModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsChapterModalOpen(false);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[92vh] animate-fadeIn"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-3">
              <h2 className="font-serif text-xl font-semibold text-[var(--text)] flex items-center gap-2">
                <BookOpen size={20} className="text-[var(--accent)]" />
                <span>{editingChapterId ? "Edit Chapter / Bab" : "Tambah Bab Baru"}</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsChapterModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2.5 rounded-xl text-xs font-medium my-3">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveChapter} className="flex flex-col gap-4 py-3">
              {/* Title & Book Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="form-group sm:col-span-2">
                  <label>Judul Bab * (Satu-satunya field wajib)</label>
                  <input
                    type="text"
                    className="form-input text-xs font-semibold"
                    placeholder='Misal: "Kedatangan", "Konflik di Aurora"...'
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {books.length > 0 && (
                  <div className="form-group">
                    <label>Buku</label>
                    <select
                      className="form-input text-xs"
                      value={formBookId}
                      onChange={(e) => setFormBookId(e.target.value)}
                    >
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* FREE-TEXT MARKDOWN SUMMARY TEXTAREA (§7.8 & Principles #4) */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <FileText size={14} className="text-[var(--accent)]" />
                    <span>Ringkasan Sinopsis (Free-Text Markdown)</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Opsional — Boleh 1 kalimat, sinopsis panjang, atau poin-poin
                  </span>
                </div>
                <textarea
                  className="form-input text-xs min-h-[140px] leading-relaxed font-sans"
                  placeholder="Ketik ringkasan bab bebas di sini...&#10;Contoh:&#10;Rara pindah ke Lunaris, ketemu Andi pertama kali di Aurora Café.&#10;- Rara masih trauma soal ibunya&#10;- Andi curiga sama identitas Rara"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                />
              </div>

              {/* LINKED EVENTS SECTION (§7.8) */}
              <div className="form-group pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                    <Link2 size={14} />
                    <span>Event Terkait di Chapter Ini ({formLinkedEventIds.length})</span>
                  </label>

                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] font-semibold flex items-center gap-1 hover:underline"
                    onClick={() => setIsQuickCreateEventOpen(true)}
                  >
                    <PlusCircle size={13} />
                    <span>+ Quick Create Event Inline</span>
                  </button>
                </div>

                {/* Event Selector Multi-Check List */}
                <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {allEvents.length === 0 ? (
                    <p className="text-xs text-[var(--text-secondary)] italic text-center py-2">
                      Belum ada event tercatat. Gunakan tombol + Quick Create Event untuk menambah event pertama.
                    </p>
                  ) : (
                    allEvents.map((evt) => {
                      const isChecked = formLinkedEventIds.includes(evt.id);
                      return (
                        <label
                          key={evt.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-[var(--surface)] border-[var(--accent)] text-[var(--text)] font-semibold shadow-sm"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormLinkedEventIds((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== evt.id)
                                    : [...prev, evt.id]
                                );
                              }}
                              className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                            />
                            <span className="truncate">{evt.name}</span>
                          </div>

                          {evt.worldDate && (
                            <span className="text-[9.5px] font-medium px-2 py-0.2 rounded-md bg-[var(--sage-soft)] text-[var(--sage)] shrink-0">
                              {evt.worldDate}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* QUICK CREATE EVENT INLINE POPUP FORM inside Chapter Modal */}
              {isQuickCreateEventOpen && (
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--accent)] shadow-md flex flex-col gap-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
                    <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1">
                      <Sparkles size={13} /> Quick-Create Event Inline (§7.6)
                    </span>
                    <button
                      type="button"
                      className="text-[var(--text-secondary)] hover:text-[var(--text)]"
                      onClick={() => setIsQuickCreateEventOpen(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="Nama Event Baru * (misal: Rara Tiba di Lunaris)..."
                      value={quickEventName}
                      onChange={(e) => setQuickEventName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="Tanggal/Era Dunia (Opsional)..."
                      value={quickEventWorldDate}
                      onChange={(e) => setQuickEventWorldDate(e.target.value)}
                    />
                  </div>

                  <SmartEntityPickerWithFilters
                    entities={allEntities}
                    entityTypes={entityTypes}
                    selectedEntityId={quickEventEntityId}
                    onSelectEntity={(id) => setQuickEventEntityId(id)}
                    placeholder="Pilih Karakter/Entitas Terlibat (Opsional)..."
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className="btn btn-ghost text-xs py-1 px-3"
                      onClick={() => setIsQuickCreateEventOpen(false)}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary text-xs py-1 px-4"
                      onClick={handleQuickCreateEvent}
                      disabled={quickEventSubmitting || !quickEventName.trim()}
                    >
                      {quickEventSubmitting ? "Membuat..." : "+ Buat & Link ke Bab Ini"}
                    </button>
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsChapterModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Menyimpan..." : "Simpan Bab"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CHAPTER MODAL */}
      {deletingChapterId && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingChapterId(null);
          }}
          style={{ zIndex: 110 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-2">
              <h2 className="text-[var(--rose)] font-serif font-semibold text-lg">
                Hapus Bab ini?
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeletingChapterId(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 py-3 text-xs leading-relaxed">
              <p className="text-sm font-medium text-[var(--text)]">
                Apakah Anda yakin ingin menghapus bab ini dari outline?
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--border)]">
                💡 Event yang di-link ke bab ini <strong>TIDAK akan terhapus</strong> dari dunia cerita. Event tersebut hanya dilepas penautannya dari bab ini.
              </p>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setDeletingChapterId(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn text-xs px-5 text-white bg-[var(--rose)] hover:bg-opacity-90"
                  onClick={handleConfirmDelete}
                >
                  Ya, Hapus Bab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
