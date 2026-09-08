"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { ProjectNavbar } from "./ProjectNavbar";
import { SmartEntityPickerWithFilters } from "./SmartEntityPickerWithFilters";
import { EditEntityModal } from "./EditEntityModal";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Filter,
  User,
  Plus,
  X,
  Search,
  BookOpen,
  Eye,
  Edit,
  ExternalLink,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Shield,
  LayoutList,
  LayoutGrid,
  Hash,
} from "lucide-react";

interface BookData {
  id: string;
  title: string;
  orderIndex: number;
}

interface ChapterData {
  id: string;
  title: string;
  orderIndex: number;
}

interface EntityTypeItem {
  id: string;
  name: string;
}

interface EntitySimple {
  id: string;
  name: string;
  typeId: string;
  type?: EntityTypeItem;
  tags?: string[];
  description?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
}

interface EventData {
  id: string;
  name: string;
  worldDate?: string | null;
  writingStatus?: string | null;
  description?: string | null;
  bookId?: string | null;
  chapterId?: string | null;
  book?: BookData | null;
  chapter?: ChapterData | null;
  entitiesInvolved?: { entity: EntitySimple }[];
}

interface TimelineClientProps {
  projectId: string;
  projectName: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export function TimelineClient({
  projectId,
  projectName,
  user,
}: TimelineClientProps) {
  const searchParams = useSearchParams();
  const entityQuery = searchParams.get("entity");

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: World Chronological Timeline vs Chapter Narrative Flow
  const [viewMode, setViewMode] = useState<"world" | "chapter">("world");

  // Display Mode: Detail list vs Compact card grid
  const [displayMode, setDisplayMode] = useState<"detail" | "compact">("detail");

  // Selected event for click-to-animate (compact view)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Project Calendar System Type ('fantasy' | 'real' | 'custom') inherited from Project Settings
  const [calendarSystem, setCalendarSystem] = useState<"fantasy" | "real" | "custom">("fantasy");

  // Project Master Data States
  const [datedEvents, setDatedEvents] = useState<EventData[]>([]);
  const [undatedEvents, setUndatedEvents] = useState<EventData[]>([]);
  const [books, setBooks] = useState<BookData[]>([]);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [allEntities, setAllEntities] = useState<EntitySimple[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);

  // Filter States
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entityQuery || "");
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (entityQuery) {
      setSelectedEntityId(entityQuery);
    }
  }, [entityQuery]);

  // Quick Set Date Modal State
  const [editingDateEvent, setEditingDateEvent] = useState<EventData | null>(null);
  const [inputWorldDate, setInputWorldDate] = useState("");
  const [selectedEra, setSelectedEra] = useState<string>("");
  const [customEraInput, setCustomEraInput] = useState<string>("");
  const [inputYearNumber, setInputYearNumber] = useState("");
  const [savingDate, setSavingDate] = useState(false);

  // Side Drawer Preview State
  const [previewEntityId, setPreviewEntityId] = useState<string | null>(null);
  const [editingEntityModal, setEditingEntityModal] = useState<EntitySimple | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchMasterData();

    const handleBookChange = (e: any) => {
      if (e.detail?.bookId !== undefined) {
        if (e.detail.bookId === "ALL") {
          setSelectedBookId("");
        } else {
          setSelectedBookId(e.detail.bookId);
        }
      }
    };
    window.addEventListener("threadinery:book_change", handleBookChange);

    return () => {
      window.removeEventListener("threadinery:book_change", handleBookChange);
    };
  }, [projectId]);

  useEffect(() => {
    fetchTimelineData();
  }, [projectId, selectedEntityId, selectedBookId]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const fetchMasterData = async () => {
    try {
      const [booksRes, chaptersRes, entitiesRes, typesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/books`),
        fetch(`/api/projects/${projectId}/chapters`),
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/entity-types`),
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(booksData);

        const savedBookId = localStorage.getItem(`threadinery_active_book_${projectId}`);
        if (savedBookId && savedBookId !== "ALL") {
          const validSaved = booksData.find((b: any) => b.id === savedBookId);
          if (validSaved) setSelectedBookId(validSaved.id);
        } else if (savedBookId === "ALL") {
          setSelectedBookId("");
        } else if (booksData.length > 0) {
          setSelectedBookId(booksData[0].id);
        }
      }
      if (chaptersRes.ok) setChapters(await chaptersRes.json());
      if (entitiesRes.ok) setAllEntities(await entitiesRes.json());
      if (typesRes.ok) setEntityTypes(await typesRes.json());
    } catch (err) {
      console.warn("Fetch master data error:", err);
    }
  };

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedEntityId) params.append("entityId", selectedEntityId);
      if (selectedBookId) params.append("bookId", selectedBookId);

      const res = await fetch(`/api/projects/${projectId}/timeline?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data timeline");

      const data = await res.json();
      if (data.project?.calendarType) {
        setCalendarSystem(data.project.calendarType as any);
      }
      setDatedEvents(data.datedEvents || []);
      setUndatedEvents(data.undatedEvents || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data timeline");
    } finally {
      setLoading(false);
    }
  };

  // Known Eras derived from existing events
  const knownEras = useMemo(() => {
    const eraSet = new Set<string>();
    datedEvents.forEach((evt) => {
      if (evt.worldDate) {
        const eraMatch = evt.worldDate.match(/Era\s+[^,\)\)]+/i) || evt.worldDate.match(/Zaman\s+[^,\)\)]+/i);
        if (eraMatch) {
          eraSet.add(eraMatch[0].trim());
        } else {
          // If contains comma, part after comma
          const parts = evt.worldDate.split(",");
          if (parts.length > 1) {
            eraSet.add(parts[1].trim());
          }
        }
      }
    });

    if (eraSet.size === 0) {
      eraSet.add("Era Pertama");
      eraSet.add("Era Kedua");
      eraSet.add("Era Ketiga");
    }

    return Array.from(eraSet);
  }, [datedEvents]);

  // Filtered dated events by search query
  const filteredDatedEvents = useMemo(() => {
    if (!searchQuery.trim()) return datedEvents;
    const q = searchQuery.toLowerCase();
    return datedEvents.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.worldDate && e.worldDate.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
    );
  }, [datedEvents, searchQuery]);

  // Chapter-based grouped events for Mode 2
  const chapterEventsGrouped = useMemo(() => {
    const groups: { chapter: ChapterData | null; events: EventData[] }[] = [];
    const chapterMap = new Map<string, EventData[]>();
    const unchapteredEvents: EventData[] = [];

    const allEvts = [...datedEvents, ...undatedEvents];

    allEvts.forEach((evt) => {
      if (evt.chapterId) {
        if (!chapterMap.has(evt.chapterId)) {
          chapterMap.set(evt.chapterId, []);
        }
        chapterMap.get(evt.chapterId)!.push(evt);
      } else {
        unchapteredEvents.push(evt);
      }
    });

    chapters.forEach((ch) => {
      groups.push({
        chapter: ch,
        events: chapterMap.get(ch.id) || [],
      });
    });

    if (unchapteredEvents.length > 0) {
      groups.push({
        chapter: null,
        events: unchapteredEvents,
      });
    }

    return groups;
  }, [datedEvents, undatedEvents, chapters]);

  // Selected event index for compact view click animation
  const selectedIdx = selectedEventId
    ? filteredDatedEvents.findIndex(e => e.id === selectedEventId)
    : -1;

  // Open Edit Date Modal
  const openEditDateModal = (evt: EventData) => {
    setEditingDateEvent(evt);

    if (calendarSystem === "fantasy") {
      const existingDate = evt.worldDate || "";
      // Try to parse "Tahun X, Era Y"
      const yearMatch = existingDate.match(/Tahun\s+(\d+)/i);
      const eraMatch = existingDate.match(/(?:Era|Zaman)\s+[^,\)\)]+/i);

      if (yearMatch) setInputYearNumber(yearMatch[1]);
      else setInputYearNumber("");

      if (eraMatch) {
        setSelectedEra(eraMatch[0]);
        setCustomEraInput("");
      } else {
        setSelectedEra(knownEras[0] || "Era Pertama");
        setCustomEraInput("");
      }
    } else {
      setInputWorldDate(evt.worldDate || "");
    }
  };

  // Handle Quick Save Date for an Event
  const handleSaveDate = async () => {
    if (!editingDateEvent) return;

    let finalDate = "";

    if (calendarSystem === "fantasy") {
      const activeEra = selectedEra === "NEW_CUSTOM" ? customEraInput.trim() : selectedEra;
      if (inputYearNumber.trim()) {
        finalDate = activeEra
          ? `Tahun ${inputYearNumber.trim()}, ${activeEra}`
          : `Tahun ${inputYearNumber.trim()}`;
      } else {
        finalDate = activeEra || "";
      }
    } else {
      finalDate = inputWorldDate.trim();
    }

    try {
      setSavingDate(true);
      const res = await fetch(`/api/projects/${projectId}/events/${editingDateEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldDate: finalDate }),
      });

      if (res.ok) {
        setEditingDateEvent(null);
        setInputWorldDate("");
        setSelectedEra("");
        setCustomEraInput("");
        setInputYearNumber("");
        fetchTimelineData();
      }
    } catch (err) {
      console.error("Save event date error:", err);
    } finally {
      setSavingDate(false);
    }
  };

  const selectedEntity = allEntities.find((e) => e.id === selectedEntityId);
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const previewEntity = allEntities.find((e) => e.id === previewEntityId);

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
      {/* Unified Project Navbar */}
      <ProjectNavbar projectId={projectId} projectName={projectName} user={user} />

      {/* Main Workspace Container */}
      <main className="wrap py-8">
        {/* Header Title Section */}
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-serif">
            Garis Waktu
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text)] mt-1">
            Timeline Peristiwa Cerita
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Sistem Penanggalan:{" "}
            <strong className="text-[var(--accent)]">
              {calendarSystem === "fantasy"
                ? "⚔️ Era & Tahun Fantasi"
                : calendarSystem === "real"
                ? "🌐 Kalender Masehi"
                : "🎨 Teks Bebas Custom"}
            </strong>
          </p>
        </div>

        {/* UNIFIED TOOLBAR: View Mode tabs + Display Mode icons */}
        <div className="flex items-center justify-between gap-3 mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-2 py-1.5 shadow-sm">
          {/* Left: World / Chapter Tab Toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "world"
                  ? "bg-[var(--accent)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
              }`}
              onClick={() => setViewMode("world")}
            >
              <Clock size={13} />
              <span>Kronologi Dunia</span>
            </button>

            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "chapter"
                  ? "bg-[var(--accent)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
              }`}
              onClick={() => setViewMode("chapter")}
            >
              <BookOpen size={13} />
              <span>Alur Bab</span>
            </button>
          </div>

          {/* Right: Detail / Compact Display Toggle (only for world view) */}
          {viewMode === "world" && (
            <div className="flex items-center gap-1 border border-[var(--border)] rounded-xl p-0.5">
              <button
                type="button"
                title="Tampilan Detail"
                className={`p-1.5 rounded-lg transition-all ${
                  displayMode === "detail"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                onClick={() => setDisplayMode("detail")}
              >
                <LayoutList size={14} />
              </button>
              <button
                type="button"
                title="Tampilan Kompak"
                className={`p-1.5 rounded-lg transition-all ${
                  displayMode === "compact"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                onClick={() => setDisplayMode("compact")}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          )}
        </div>

        {/* CONTROLS BAR: SEARCH & ENTITY / BOOK FILTERS */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Filter 1: Entity Filter */}
            <div className="w-full sm:w-64">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">
                Filter Karakter / Entitas:
              </label>
              <SmartEntityPickerWithFilters
                entities={allEntities}
                entityTypes={entityTypes}
                selectedEntityId={selectedEntityId}
                onSelectEntity={(id) => setSelectedEntityId(id)}
                placeholder="Semua Karakter / Entitas..."
              />
            </div>

            {/* Filter 2: Book Filter */}
            <div className="w-full sm:w-48">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">
                Filter Buku / Jilid:
              </label>
              <select
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs rounded-xl px-3 py-2 outline-none focus:border-[var(--accent)] font-medium cursor-pointer"
                value={selectedBookId}
                onChange={(e) => {
                  const bId = e.target.value;
                  setSelectedBookId(bId);
                  localStorage.setItem(`threadinery_active_book_${projectId}`, bId || "ALL");
                  window.dispatchEvent(
                    new CustomEvent("threadinery:book_change", { detail: { bookId: bId || "ALL" } })
                  );
                }}
              >
                <option value="">Semua Buku Jilid (Dunia)</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Active Filters Badge */}
            {(selectedEntityId || selectedBookId) && (
              <div className="flex items-center gap-2 self-end pb-1">
                <button
                  type="button"
                  className="text-xs text-[var(--rose)] font-bold flex items-center gap-1 hover:underline"
                  onClick={() => {
                    setSelectedEntityId("");
                    setSelectedBookId("");
                    localStorage.setItem(`threadinery_active_book_${projectId}`, "ALL");
                    window.dispatchEvent(
                      new CustomEvent("threadinery:book_change", { detail: { bookId: "ALL" } })
                    );
                  }}
                >
                  <X size={13} />
                  <span>Bersihkan Filter</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Query Input */}
          <div className="w-full md:w-64 self-end">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="text"
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[var(--accent)] font-medium"
                placeholder="Cari event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER SUMMARY BANNER */}
        {(selectedEntity || selectedBook) && (
          <div className="bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent)] px-4 py-2.5 rounded-2xl mb-6 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Filter size={14} />
            <span>Menampilkan event yang melibatkan:</span>
            {selectedEntity && (
              <span className="bg-[var(--surface)] px-2.5 py-0.5 rounded-md border border-[var(--accent)] font-bold">
                👤 {selectedEntity.name}
              </span>
            )}
            {selectedBook && (
              <span className="bg-[var(--surface)] px-2.5 py-0.5 rounded-md border border-[var(--accent)] font-bold">
                📖 {selectedBook.title}
              </span>
            )}
          </div>
        )}

        {/* MAIN LAYOUT CONTENT: STREAM VS UNDATED EVENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* MAIN LEFT COLUMN: EVENT STREAM (WORLD TIMELINE OR CHAPTER FLOW) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {loading ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--text-secondary)] flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin text-[var(--accent)]" />
                <span>Memuat garis waktu timeline...</span>
              </div>
            ) : error ? (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] p-6 rounded-2xl text-xs font-medium">
                {error}
              </div>
            ) : viewMode === "world" ? (
              /* MODE 1: GARIS WAKTU KRONOLOGIS DUNIA */
              filteredDatedEvents.length > 0 ? (
                displayMode === "detail" ? (
                  /* DETAIL VIEW: Vertical timeline with 100% physically centered dot column */
                  <div className="flex flex-col my-2">
                    {filteredDatedEvents.map((evt, idx) => (
                      <div key={evt.id} className="flex gap-4 group animate-fadeIn">
                        {/* Centered vertical line & dot column */}
                        <div className="flex flex-col items-center shrink-0 w-6">
                          <div className={`w-0.5 flex-1 min-h-[16px] ${idx === 0 ? 'bg-transparent' : 'bg-[var(--accent)] opacity-40'}`} />
                          <div className="w-5 h-5 rounded-full bg-[var(--surface)] border-4 border-[var(--accent)] shadow-sm group-hover:scale-125 transition-all shrink-0 z-10" />
                          <div className={`w-0.5 flex-1 min-h-[16px] ${idx === filteredDatedEvents.length - 1 ? 'bg-transparent' : 'bg-[var(--accent)] opacity-40'}`} />
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 min-w-0 pb-6">
                          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:border-[var(--accent)] hover:shadow-md transition-all flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
                              <span className="text-xs font-serif font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-full border border-[var(--accent)] border-opacity-20 flex items-center gap-1.5">
                                <Clock size={13} />
                                <span>{evt.worldDate}</span>
                              </span>

                              <div className="flex items-center gap-2 text-xs">
                                {evt.chapter && (
                                  <Link
                                    href={`/project/${projectId}/outline/${evt.chapter.id}`}
                                    className="text-[11px] font-semibold text-[var(--sage)] bg-[var(--sage-soft)] px-2.5 py-0.5 rounded-md hover:underline flex items-center gap-1"
                                  >
                                    <BookOpen size={12} />
                                    <span>Bab {evt.chapter.orderIndex + 1}: {evt.chapter.title}</span>
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1"
                                  onClick={() => openEditDateModal(evt)}
                                  title="Edit Tanggal"
                                >
                                  <Edit size={14} />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-serif text-lg font-semibold text-[var(--text)]">⚡ {evt.name}</h3>
                              {evt.description && (
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1.5 bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] whitespace-pre-line">
                                  {evt.description}
                                </p>
                              )}
                            </div>

                            {evt.entitiesInvolved && evt.entitiesInvolved.length > 0 && (
                              <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)]">
                                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mr-1">Terlibat:</span>
                                {evt.entitiesInvolved.map((ei) => (
                                  <button
                                    key={ei.entity.id}
                                    type="button"
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold border border-[var(--accent)] border-opacity-30 hover:scale-105 transition-all cursor-pointer"
                                    onClick={() => setPreviewEntityId(ei.entity.id)}
                                  >
                                    <User size={11} />
                                    <span>{ei.entity.name}</span>
                                    <Eye size={10} className="opacity-70" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* COMPACT VIEW: Infographic Serpentine Flowchart Diagram (Diagram Alir) */
                  <div className="flex flex-col gap-4 my-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                    {/* Flowchart Header Note */}
                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pb-3 border-b border-[var(--border)]">
                      <span className="font-semibold text-[var(--accent)] flex items-center gap-1.5">
                        <LayoutGrid size={14} />
                        <span>Diagram Alir Kronologis ({filteredDatedEvents.length} Event)</span>
                      </span>
                      <span className="hidden sm:inline italic">Klik event mana saja untuk menganimasikan alur kronologis</span>
                    </div>

                    {/* Serpentine Grid Nodes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-8 relative pt-2">
                      {filteredDatedEvents.map((evt, evtIdx) => {
                        const isSelected = evt.id === selectedEventId;
                        const isPast = selectedIdx >= 0 && evtIdx < selectedIdx;
                        const hasChapter = !!evt.chapterId;

                        // Grid Row and Serpentine Column (Row 0: LTR, Row 1: RTL, Row 2: LTR)
                        const row = Math.floor(evtIdx / 3);
                        const isLTR = row % 2 === 0;
                        const col = isLTR ? (evtIdx % 3) : (2 - (evtIdx % 3));
                        const isRowEnd = (evtIdx + 1) % 3 === 0 || evtIdx === filteredDatedEvents.length - 1;

                        const nextEvt = filteredDatedEvents[evtIdx + 1];
                        const hasNext = evtIdx < filteredDatedEvents.length - 1;
                        const isConnectorFlowing = selectedIdx >= 0 && evtIdx < selectedIdx;
                        const isConnectorChapter = !isConnectorFlowing && hasChapter && !!nextEvt?.chapterId;

                        return (
                          <div
                            key={evt.id}
                            className="relative flex flex-col items-center justify-center animate-fadeIn"
                            style={{ gridRow: row + 1, gridColumn: col + 1 }}
                          >
                            {/* Flowchart Node Card */}
                            <div
                              role="button"
                              tabIndex={0}
                              className={`w-full border rounded-2xl p-4 shadow-sm transition-all duration-300 relative flex flex-col gap-2 cursor-pointer z-10 ${
                                isSelected
                                  ? 'border-2 border-[var(--accent)] bg-[var(--accent-soft)] shadow-lg scale-105'
                                  : isPast
                                  ? 'border-[var(--accent)] border-opacity-60 bg-[var(--surface)] hover:border-[var(--accent)]'
                                  : hasChapter
                                  ? 'border-[var(--sage)] border-opacity-60 bg-[var(--surface)] hover:border-[var(--sage)]'
                                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-md'
                              }`}
                              onClick={() => setSelectedEventId(prev => prev === evt.id ? null : evt.id)}
                              onKeyDown={(e) => e.key === 'Enter' && setSelectedEventId(prev => prev === evt.id ? null : evt.id)}
                            >
                              {/* Date & Chapter Badges */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className={`text-[10.5px] font-serif font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 border ${
                                  isSelected
                                    ? 'text-[var(--accent)] bg-[var(--surface)] border-[var(--accent)]'
                                    : 'text-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent)] border-opacity-20'
                                }`}>
                                  <Clock size={10} />
                                  <span>{evt.worldDate}</span>
                                </span>

                                {hasChapter && evt.chapter && (
                                  <span className="text-[9.5px] font-bold text-[var(--sage)] bg-[var(--sage-soft)] px-2 py-0.5 rounded-md shrink-0">
                                    📖 Bab {evt.chapter.orderIndex + 1}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h4 className={`font-serif text-sm font-bold leading-snug line-clamp-2 ${
                                isSelected ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                              }`}>
                                ⚡ {evt.name}
                              </h4>

                              {/* Entities & Edit */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] mt-1">
                                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                                  {evt.entitiesInvolved && evt.entitiesInvolved.slice(0, 2).map((ei) => (
                                    <span
                                      key={ei.entity.id}
                                      role="button"
                                      tabIndex={0}
                                      className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded-md cursor-pointer hover:scale-105 transition-all truncate"
                                      onClick={(e) => { e.stopPropagation(); setPreviewEntityId(ei.entity.id); }}
                                    >
                                      {ei.entity.name}
                                    </span>
                                  ))}
                                  {evt.entitiesInvolved && evt.entitiesInvolved.length > 2 && (
                                    <span className="text-[10px] text-[var(--text-secondary)]">+{evt.entitiesInvolved.length - 2}</span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1 shrink-0"
                                  onClick={(e) => { e.stopPropagation(); openEditDateModal(evt); }}
                                  title="Edit Tanggal"
                                >
                                  <Edit size={12} />
                                </button>
                              </div>
                            </div>

                            {/* SVG CONNECTORS BETWEEN FLOWCHART NODES */}
                            {hasNext && (
                              isRowEnd ? (
                                /* VERTICAL CONNECTOR AT ROW END */
                                <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 w-8 h-10 flex items-center justify-center z-0 pointer-events-none">
                                  <svg className="w-full h-full" viewBox="0 0 32 40" fill="none">
                                    <path
                                      d="M 16 0 V 30"
                                      stroke={
                                        isConnectorFlowing
                                          ? 'var(--accent)'
                                          : isConnectorChapter
                                          ? 'var(--sage)'
                                          : 'var(--border)'
                                      }
                                      strokeWidth={isConnectorFlowing ? 3 : 2}
                                      strokeDasharray={isConnectorFlowing ? "6 4" : isConnectorChapter ? "4 4" : "none"}
                                      style={{
                                        animation: isConnectorFlowing
                                          ? 'flowDashForward 0.5s linear infinite'
                                          : isConnectorChapter
                                          ? 'flowDashForward 1.8s linear infinite'
                                          : 'none'
                                      }}
                                    />
                                    <polygon
                                      points="11,28 16,38 21,28"
                                      fill={isConnectorFlowing ? 'var(--accent)' : isConnectorChapter ? 'var(--sage)' : 'var(--border)'}
                                    />
                                  </svg>
                                </div>
                              ) : (
                                /* HORIZONTAL CONNECTOR BETWEEN NODES IN SAME ROW */
                                <div
                                  className={`hidden md:flex absolute top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center z-0 pointer-events-none ${
                                    isLTR ? '-right-8' : '-left-8'
                                  }`}
                                >
                                  <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
                                    <path
                                      d={isLTR ? "M 0 16 H 22" : "M 32 16 H 10"}
                                      stroke={
                                        isConnectorFlowing
                                          ? 'var(--accent)'
                                          : isConnectorChapter
                                          ? 'var(--sage)'
                                          : 'var(--border)'
                                      }
                                      strokeWidth={isConnectorFlowing ? 3 : 2}
                                      strokeDasharray={isConnectorFlowing ? "6 4" : isConnectorChapter ? "4 4" : "none"}
                                      style={{
                                        animation: isConnectorFlowing
                                          ? (isLTR ? 'flowDashForward 0.5s linear infinite' : 'flowDashBackward 0.5s linear infinite')
                                          : isConnectorChapter
                                          ? (isLTR ? 'flowDashForward 1.8s linear infinite' : 'flowDashBackward 1.8s linear infinite')
                                          : 'none'
                                      }}
                                    />
                                    <polygon
                                      points={isLTR ? "20,11 30,16 20,21" : "12,11 2,16 12,21"}
                                      fill={isConnectorFlowing ? 'var(--accent)' : isConnectorChapter ? 'var(--sage)' : 'var(--border)'}
                                    />
                                  </svg>
                                </div>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )

              ) : (
                /* EMPTY STATE FOR DATED EVENTS */
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[var(--text)]">Belum Ada Event Ber-Tanggal Dunia</h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1 leading-relaxed">
                      Seluruh event tersimpan di panel <strong>📌 Event Tanpa Tanggal</strong> di kanan. Klik <strong>[+ Atur Tanggal]</strong> untuk memasukkannya ke garis waktu!
                    </p>
                  </div>
                </div>
              )
            ) : (
              /* MODE 2: ALUR NARASI PER BAB (CHAPTER PLOTLINE FLOW) */
              <div className="flex flex-col gap-4">
                {/* Summary Header */}
                <div className="bg-[var(--accent-soft)] border border-[var(--accent)] border-opacity-30 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-[var(--accent)] font-semibold">
                  <BookOpen size={14} />
                  <span>
                    {chapters.length} bab · {chapterEventsGrouped.filter(g => g.chapter && g.events.length > 0).length} bab aktif · {[...filteredDatedEvents, ...undatedEvents].length} total event
                  </span>
                </div>

                {/* Show ALL chapters (empty ones dimmed), then unchaptered group at bottom */}
                {chapterEventsGrouped.map((group, gIdx) => {
                  const isEmpty = group.events.length === 0;
                  const isUnchaptered = !group.chapter;

                  return (
                    <div
                      key={group.chapter?.id || `unchaptered-${gIdx}`}
                      className={`border rounded-2xl shadow-sm flex flex-col gap-0 overflow-hidden transition-all ${
                        isUnchaptered
                          ? "bg-[var(--bg)] border-dashed border-[var(--border)]"
                          : isEmpty
                          ? "bg-[var(--surface)] border-[var(--border)] opacity-50"
                          : "bg-[var(--surface)] border-[var(--border)]"
                      }`}
                    >
                      {/* Chapter Header */}
                      <div className={`flex items-center justify-between px-5 py-3.5 ${
                        group.events.length > 0 ? "border-b border-[var(--border)]" : ""
                      } ${
                        !isUnchaptered ? "bg-[var(--bg)]" : ""
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-serif ${
                            isUnchaptered
                              ? "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]"
                              : isEmpty
                              ? "bg-[var(--border)] text-[var(--text-secondary)]"
                              : "bg-[var(--accent)] text-white"
                          }`}>
                            {isUnchaptered ? "📌" : `Bab ${group.chapter!.orderIndex + 1}`}
                          </span>
                          <div>
                            <h3 className="font-serif text-sm font-bold text-[var(--text)] leading-tight">
                              {isUnchaptered ? "Event Belum Dimasukkan ke Bab" : group.chapter!.title}
                            </h3>
                            <span className="text-[10.5px] text-[var(--text-secondary)]">
                              {isEmpty && !isUnchaptered ? "Belum ada event" : `${group.events.length} event`}
                            </span>
                          </div>
                        </div>

                        {!isUnchaptered && (
                          <Link
                            href={`/project/${projectId}/outline/${group.chapter!.id}`}
                            className="text-xs text-[var(--accent)] font-semibold hover:underline flex items-center gap-1 shrink-0"
                          >
                            <span>Buka Bab</span>
                            <ChevronRight size={13} />
                          </Link>
                        )}
                      </div>

                      {/* Events in Chapter */}
                      {group.events.length > 0 && (
                        <div className="flex flex-col divide-y divide-[var(--border)]">
                          {group.events.map((evt) => (
                            <div
                              key={evt.id}
                              className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[var(--accent-soft)] transition-all"
                            >
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="font-serif font-bold text-sm text-[var(--text)] truncate">⚡ {evt.name}</span>
                                {evt.entitiesInvolved && evt.entitiesInvolved.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {evt.entitiesInvolved.slice(0, 4).map((ei) => (
                                      <button
                                        key={ei.entity.id}
                                        type="button"
                                        className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded-md cursor-pointer hover:scale-105 transition-all"
                                        onClick={() => setPreviewEntityId(ei.entity.id)}
                                      >
                                        {ei.entity.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {evt.worldDate ? (
                                  <span className="text-[10.5px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full border border-[var(--accent)] border-opacity-20 whitespace-nowrap">
                                    {evt.worldDate}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="text-[10px] text-[var(--text-secondary)] italic bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                                    onClick={() => openEditDateModal(evt)}
                                  >
                                    + Tanggal
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {chapters.length === 0 && (
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-xs text-[var(--text-secondary)]">
                    <BookOpen size={28} className="mx-auto mb-3 text-[var(--accent)] opacity-40" />
                    Belum ada bab yang dibuat. Buat bab di halaman Outline terlebih dahulu.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDE PANEL: UNDATED EVENTS DRAWER & SIDE ENTITY PREVIEW */}
          <div className="flex flex-col gap-6">
            {/* ENTITY PROFILE SIDE DRAWER QUICK PREVIEW PANEL */}
            {previewEntity ? (
              <div className="bg-[var(--surface)] border-2 border-[var(--accent)] rounded-2xl p-6 shadow-lg flex flex-col justify-between animate-fadeIn relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        {previewEntity.type?.name || "Entity"}
                      </span>
                      <h3 className="font-serif text-xl font-semibold text-[var(--text)] mt-1">
                        {previewEntity.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                      onClick={() => setPreviewEntityId(null)}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Status & Tags */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {previewEntity.status && (
                      <span className="font-semibold text-[var(--sage)] bg-[var(--sage-soft)] px-2.5 py-0.5 rounded-md border border-[var(--sage)]">
                        Status: {previewEntity.status}
                      </span>
                    )}
                    {previewEntity.tags?.map((t) => (
                      <span key={t} className="text-[10px] text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-serif">
                      Deskripsi Profil
                    </h4>
                    <p className="text-xs text-[var(--text)] leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] whitespace-pre-line">
                      {previewEntity.description || "Belum ada deskripsi profil."}
                    </p>
                  </div>
                </div>

                {/* Side Drawer Actions */}
                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    onClick={() => setEditingEntityModal(previewEntity)}
                  >
                    <Edit size={13} />
                    <span>Edit Profil Entity</span>
                  </button>

                  <Link
                    href={`/project/${projectId}/entities/${previewEntity.id}`}
                    target="_blank"
                    className="text-xs text-[var(--accent)] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Penuh</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ) : (
              /* UNDATED EVENTS DRAWER PANEL (§5) */
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[var(--text)] flex items-center gap-2">
                      <HelpCircle size={18} className="text-[var(--accent)]" />
                      <span>Event Tanpa Tanggal ({undatedEvents.length})</span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Klik [+ Atur Tanggal] untuk memasukkan ke timeline
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {undatedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col gap-2 hover:border-[var(--accent)] transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif font-bold text-xs text-[var(--text)] truncate">
                          ⚡ {evt.name}
                        </span>

                        <button
                          type="button"
                          className="btn btn-primary text-[10.5px] py-1 px-2.5 shrink-0 flex items-center gap-1 font-semibold"
                          onClick={() => openEditDateModal(evt)}
                        >
                          <Plus size={12} />
                          <span>+ Atur Tanggal</span>
                        </button>
                      </div>

                      {evt.description && (
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  ))}

                  {undatedEvents.length === 0 && (
                    <p className="text-xs text-[var(--text-secondary)] italic text-center py-4">
                      Seluruh event telah memiliki tanggal dunia! 🎉
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL SET WORLD DATE & ERA DYNAMICALLY ADAPTIVE (§5) */}
      {editingDateEvent && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingDateEvent(null);
          }}
          style={{ zIndex: 110 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-2">
              <h2 className="font-serif font-semibold text-lg text-[var(--text)] flex items-center gap-2">
                <Calendar size={18} className="text-[var(--accent)]" />
                <span>Atur Tanggal Dunia Event</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingDateEvent(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 py-3 text-xs">
              <p className="text-xs text-[var(--text-secondary)]">
                Event: <strong className="text-[var(--text)]">{editingDateEvent.name}</strong>
              </p>

              {/* DYNAMIC FORM ADAPTS TO PROJECT CALENDAR SYSTEM */}
              {calendarSystem === "fantasy" ? (
                /* FANTASY CALENDAR FORM: ERA & YEAR INPUT WITH CUSTOM ERA CREATOR */
                <div className="flex flex-col gap-3.5">
                  <div className="form-group">
                    <label className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1">
                      <Shield size={13} /> Pilih Era Dunia *
                    </label>
                    <select
                      className="form-input text-xs"
                      value={selectedEra}
                      onChange={(e) => setSelectedEra(e.target.value)}
                    >
                      {knownEras.map((era) => (
                        <option key={era} value={era}>
                          {era}
                        </option>
                      ))}
                      <option value="NEW_CUSTOM">+ Buat Era Baru Kustom...</option>
                    </select>
                  </div>

                  {/* Custom Era Name Input */}
                  {selectedEra === "NEW_CUSTOM" && (
                    <div className="form-group animate-fadeIn bg-[var(--accent-soft)] p-3 rounded-xl border border-[var(--accent)]">
                      <label className="text-xs font-bold text-[var(--accent)]">Nama Era Kustom Baru *</label>
                      <input
                        type="text"
                        className="form-input text-xs mt-1"
                        placeholder='Misal: "Era Kegelapan", "Zaman Solaria"...'
                        value={customEraInput}
                        onChange={(e) => setCustomEraInput(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="text-xs font-semibold">Tahun (Angka) *</label>
                    <input
                      type="number"
                      className="form-input text-xs"
                      placeholder="Misal: 1420"
                      value={inputYearNumber}
                      onChange={(e) => setInputYearNumber(e.target.value)}
                    />
                  </div>

                  {/* Format Output Preview */}
                  {(inputYearNumber.trim() || selectedEra) && (
                    <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--border)] font-serif">
                      <span>⚡ Hasil Format: </span>
                      <strong className="text-[var(--accent)]">
                        {inputYearNumber.trim() ? `Tahun ${inputYearNumber.trim()}, ` : ""}
                        {selectedEra === "NEW_CUSTOM" ? customEraInput || "(Era Baru)" : selectedEra}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                /* REAL OR CUSTOM CALENDAR FORM */
                <div className="form-group">
                  <label className="text-xs font-semibold">Tanggal Dunia / Era *</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder={
                      calendarSystem === "real"
                        ? 'Misal: "15 Agustus 1945", "2024-05-10"...'
                        : 'Misal: "Musim Gugur Sebelum Pembantaian"...'
                    }
                    value={inputWorldDate}
                    onChange={(e) => setInputWorldDate(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)] mt-2">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setEditingDateEvent(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary text-xs px-5 font-semibold"
                  onClick={handleSaveDate}
                  disabled={savingDate}
                >
                  {savingDate ? "Menyimpan..." : "Simpan Tanggal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ENTITY INLINE MODAL */}
      {editingEntityModal && (
        <EditEntityModal
          projectId={projectId}
          isOpen={true}
          entity={editingEntityModal as any}
          onClose={() => setEditingEntityModal(null)}
          onSuccess={() => {
            fetchMasterData();
            setEditingEntityModal(null);
          }}
          entityTypes={entityTypes}
        />
      )}
    </div>
  );
}
