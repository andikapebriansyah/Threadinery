"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { ProjectNavbar } from "./ProjectNavbar";
import { SmartEntityPickerWithFilters } from "./SmartEntityPickerWithFilters";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  Clock,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  GitCompare,
  Activity,
  AlertCircle,
  Sparkles,
  UserPlus,
  Link2,
  Shield,
  FileText,
} from "lucide-react";

interface BookSimple {
  id: string;
  title: string;
}

interface EntitySimple {
  id: string;
  name: string;
  status?: string | null;
  type?: { id: string; name: string };
}

interface EntityTypeItem {
  id: string;
  name: string;
}

interface RelationshipSimple {
  id: string;
  label: string;
  sourceEntityId: string;
  targetEntityId: string;
  source?: { id: string; name: string };
  target?: { id: string; name: string };
}

interface EventEntityInvolved {
  entityId: string;
  role?: string | null;
  entity?: EntitySimple;
}

interface EventRelationshipChangeItem {
  id?: string;
  relationshipId?: string;
  sourceEntityId?: string;
  targetEntityId?: string;
  sourceName?: string;
  targetName?: string;
  beforeLabel?: string | null;
  afterLabel: string;
  relationship?: RelationshipSimple;
}

interface EntityStatusLogItem {
  id?: string;
  entityId: string;
  oldStatus?: string | null;
  newStatus: string;
  entity?: { id: string; name: string };
}

interface EventItem {
  id: string;
  projectId: string;
  bookId?: string | null;
  chapterId?: string | null;
  chapter?: { id: string; title: string; orderIndex?: number } | null;
  name: string;
  description?: string | null;
  worldDate?: string | null;
  writingStatus?: string | null;
  orderInChapter?: number | null;
  book?: BookSimple | null;
  entitiesInvolved?: EventEntityInvolved[];
  relationshipChanges?: EventRelationshipChangeItem[];
  statusChanges?: EntityStatusLogItem[];
  createdAt: string;
}

interface EventsClientProps {
  projectId: string;
  projectName: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

// Reusable Searchable Entity Auto-Suggest Picker Component
function SearchableEntityPicker({
  entities,
  selectedEntityId,
  onSelectEntity,
  placeholder = "Cari nama entitas...",
  excludeEntityId,
  onOpenQuickCreate,
}: {
  entities: EntitySimple[];
  selectedEntityId: string;
  onSelectEntity: (entityId: string) => void;
  placeholder?: string;
  excludeEntityId?: string;
  onOpenQuickCreate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId),
    [entities, selectedEntityId]
  );

  useEffect(() => {
    if (selectedEntity) {
      setQuery(selectedEntity.name);
    } else if (!selectedEntityId) {
      setQuery("");
    }
  }, [selectedEntityId, selectedEntity]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const list = excludeEntityId
      ? entities.filter((e) => e.id !== excludeEntityId)
      : entities;

    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.type?.name && e.type.name.toLowerCase().includes(q))
    );
  }, [entities, query, excludeEntityId]);

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          className="form-input text-xs w-full pr-7"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onSelectEntity("");
          }}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2 top-2 text-[var(--text-secondary)] hover:text-[var(--text)]"
            onClick={() => {
              setQuery("");
              onSelectEntity("");
            }}
          >
            <X size={13} />
          </button>
        ) : (
          <Search size={13} className="absolute right-2.5 top-2.5 text-[var(--text-secondary)] pointer-events-none" />
        )}
      </div>

      {/* Auto-Suggest Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-10 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl p-1.5 z-50 max-h-48 overflow-y-auto flex flex-col gap-1 text-xs">
          {filtered.length > 0 ? (
            filtered.map((ent) => (
              <div
                key={ent.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  ent.id === selectedEntityId
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                    : "hover:bg-[var(--bg)] text-[var(--text)]"
                }`}
                onClick={() => {
                  onSelectEntity(ent.id);
                  setQuery(ent.name);
                  setIsOpen(false);
                }}
              >
                <span className="truncate">{ent.name}</span>
                <span className="text-[9.5px] uppercase font-bold text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.2 rounded border border-[var(--border)]">
                  {ent.type?.name || "Entity"}
                </span>
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-[11px] text-[var(--text-secondary)]">
              <span>Tidak ditemukan "{query}"</span>
              {onOpenQuickCreate && (
                <button
                  type="button"
                  className="mt-1 block mx-auto text-[var(--accent)] font-semibold hover:underline"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenQuickCreate();
                  }}
                >
                  + Buat Entitas Baru Baru
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdaptiveWorldDateInput({
  calendarType,
  worldDate,
  onChange,
  knownEras,
}: {
  calendarType: "fantasy" | "real" | "custom";
  worldDate: string;
  onChange: (val: string) => void;
  knownEras: string[];
}) {
  const [overrideFreeText, setOverrideFreeText] = useState(false);

  // Parse existing year
  const parsedYear = useMemo(() => {
    const m = worldDate.match(/Tahun\s+(\d+)/i);
    return m ? m[1] : "";
  }, [worldDate]);

  // Parse existing era
  const parsedEra = useMemo(() => {
    const m = worldDate.match(/(?:Era|Zaman)\s+[^,\)\)]+/i);
    if (m) return m[0].trim();
    const parts = worldDate.split(",");
    return parts.length > 1 ? parts[1].trim() : "";
  }, [worldDate]);

  const [inputYear, setInputYear] = useState(parsedYear);
  const [selectedEra, setSelectedEra] = useState(parsedEra || knownEras[0] || "Era Pertama");
  const [customEra, setCustomEra] = useState("");

  useEffect(() => {
    const y = worldDate.match(/Tahun\s+(\d+)/i)?.[1] || "";
    setInputYear(y);

    const eraM = worldDate.match(/(?:Era|Zaman)\s+[^,\)\)]+/i)?.[0]?.trim();
    if (eraM) {
      setSelectedEra(eraM);
      setCustomEra("");
    } else if (knownEras.length > 0 && !selectedEra) {
      setSelectedEra(knownEras[0]);
    }
  }, [worldDate, knownEras]);

  const updateFantasyDate = (yStr: string, eraStr: string, customEraStr: string) => {
    const activeEra = eraStr === "NEW_CUSTOM" ? customEraStr.trim() : eraStr;
    let finalVal = "";
    if (yStr.trim()) {
      finalVal = activeEra ? `Tahun ${yStr.trim()}, ${activeEra}` : `Tahun ${yStr.trim()}`;
    } else {
      finalVal = activeEra || "";
    }
    onChange(finalVal);
  };

  if (calendarType === "fantasy" && !overrideFreeText) {
    return (
      <div className="flex flex-col gap-2.5 bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] col-span-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--accent)] flex items-center gap-1">
            <Shield size={12} /> Format Penanggalan Dunia (Era Fantasi)
          </span>
          <button
            type="button"
            className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent)] underline cursor-pointer"
            onClick={() => setOverrideFreeText(true)}
          >
            Teks Bebas Custom
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5 block">
              Pilih Era Dunia *
            </label>
            <select
              className="form-input text-xs"
              value={selectedEra}
              onChange={(e) => {
                const newEra = e.target.value;
                setSelectedEra(newEra);
                updateFantasyDate(inputYear, newEra, customEra);
              }}
            >
              {knownEras.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
              <option value="NEW_CUSTOM">+ Buat Era Kustom Baru...</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5 block">
              Angka Tahun *
            </label>
            <input
              type="number"
              className="form-input text-xs"
              placeholder="Misal: 1420"
              value={inputYear}
              onChange={(e) => {
                const newY = e.target.value;
                setInputYear(newY);
                updateFantasyDate(newY, selectedEra, customEra);
              }}
            />
          </div>
        </div>

        {selectedEra === "NEW_CUSTOM" && (
          <div className="mt-1">
            <label className="text-[10px] text-[var(--accent)] font-semibold mb-0.5 block">
              Nama Era Kustom Baru *
            </label>
            <input
              type="text"
              className="form-input text-xs"
              placeholder='Misal: "Era Kegelapan", "Zaman Solaria"...'
              value={customEra}
              onChange={(e) => {
                const newC = e.target.value;
                setCustomEra(newC);
                updateFantasyDate(inputYear, selectedEra, newC);
              }}
              autoFocus
            />
          </div>
        )}

        <div className="text-[10.5px] text-[var(--text-secondary)] font-serif bg-[var(--bg)] px-2.5 py-1.5 rounded-lg border border-[var(--border)]">
          ⚡ Hasil Penanggalan: <strong className="text-[var(--accent)]">{worldDate || "(Belum diisi)"}</strong>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs">Tanggal / Era Dunia (Opsional)</label>
        {calendarType === "fantasy" && (
          <button
            type="button"
            className="text-[10px] text-[var(--accent)] font-semibold hover:underline cursor-pointer"
            onClick={() => setOverrideFreeText(false)}
          >
            ← Kembali ke Form Era Fantasi
          </button>
        )}
      </div>
      <input
        type="text"
        className="form-input text-xs"
        placeholder={
          calendarType === "real"
            ? 'Misal: "15 Agustus 1945", "2024-05-10"...'
            : 'Misal: "Musim Gugur Era 3", "Tahun 1420"...'
        }
        value={worldDate}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function EventsClient({ projectId, projectName, user }: EventsClientProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [books, setBooks] = useState<BookSimple[]>([]);
  const [allEntities, setAllEntities] = useState<EntitySimple[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);
  const [allRelationships, setAllRelationships] = useState<RelationshipSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarType, setCalendarType] = useState<"fantasy" | "real" | "custom">("fantasy");

  // Derived known eras from events
  const knownEras = useMemo(() => {
    const eraSet = new Set<string>();
    events.forEach((evt) => {
      if (evt.worldDate) {
        const eraMatch = evt.worldDate.match(/(?:Era|Zaman)\s+[^,\)\)]+/i);
        if (eraMatch) {
          eraSet.add(eraMatch[0].trim());
        } else {
          const parts = evt.worldDate.split(",");
          if (parts.length > 1) eraSet.add(parts[1].trim());
        }
      }
    });

    if (eraSet.size === 0) {
      eraSet.add("Era Pertama");
      eraSet.add("Era Kedua");
      eraSet.add("Era Ketiga");
    }

    return Array.from(eraSet);
  }, [events]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>("ALL");

  // Event Detail Modal State
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<EventItem | null>(null);

  // Drag and Drop Reorder State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Modal Create / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form Basic State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formWorldDate, setFormWorldDate] = useState("");
  const [formBookId, setFormBookId] = useState("");
  const [formWritingStatus, setFormWritingStatus] = useState("planned");

  // Form Involved Entities State
  const [formInvolvedEntities, setFormInvolvedEntities] = useState<
    { entityId: string; role: string }[]
  >([]);
  const [selectedEntityToAdd, setSelectedEntityToAdd] = useState("");
  const [roleInputToAdd, setRoleInputToAdd] = useState("");

  // Inline Quick-Create Entity Submodal State
  const [isQuickCreateEntityOpen, setIsQuickCreateEntityOpen] = useState(false);
  const [quickEntityName, setQuickEntityName] = useState("");
  const [quickEntityTypeId, setQuickEntityTypeId] = useState("");
  const [quickEntitySubmitting, setQuickEntitySubmitting] = useState(false);

  // Form Relationship Changes State
  const [relMode, setRelMode] = useState<"new" | "existing">("new");
  const [formRelChanges, setFormRelChanges] = useState<
    {
      relationshipId?: string;
      sourceEntityId?: string;
      targetEntityId?: string;
      sourceName?: string;
      targetName?: string;
      beforeLabel?: string;
      afterLabel: string;
    }[]
  >([]);

  // Mode A: New Rel Form State
  const [newRelSourceId, setNewRelSourceId] = useState("");
  const [newRelTargetId, setNewRelTargetId] = useState("");
  const [newRelLabelInput, setNewRelLabelInput] = useState("");

  // Mode B: Existing Rel Form State
  const [selectedExistingRelId, setSelectedExistingRelId] = useState("");
  const [relBeforeInput, setRelBeforeInput] = useState("");
  const [relAfterInput, setRelAfterInput] = useState("");

  // Form Entity Status Changes State
  const [formStatusChanges, setFormStatusChanges] = useState<
    { entityId: string; oldStatus: string; newStatus: string }[]
  >([]);
  const [selectedStatusEntityId, setSelectedStatusEntityId] = useState("");
  const [statusOldInput, setStatusOldInput] = useState("");
  const [statusNewInput, setStatusNewInput] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchInitialData();

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

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [eventsRes, booksRes, entitiesRes, typesRes, relsRes, projRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/events`),
        fetch(`/api/projects/${projectId}/books`),
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/entity-types`),
        fetch(`/api/projects/${projectId}/relationships`),
        fetch(`/api/projects/${projectId}`),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData.calendarType) setCalendarType(pData.calendarType);
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

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) setEvents(eventsData);
      }

      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        if (Array.isArray(entitiesData)) setAllEntities(entitiesData);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (Array.isArray(typesData)) {
          setEntityTypes(typesData);
          if (typesData.length > 0) setQuickEntityTypeId(typesData[0].id);
        }
      }

      if (relsRes.ok) {
        const relsData = await relsRes.json();
        if (Array.isArray(relsData)) setAllRelationships(relsData);
      }
    } catch (err) {
      console.warn("Fetch events initial data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormName("");
    setFormDescription("");
    setFormWorldDate("");
    setFormBookId(
      selectedBookFilter && selectedBookFilter !== "ALL"
        ? selectedBookFilter
        : books.length > 0
        ? books[0].id
        : ""
    );
    setFormWritingStatus("planned");

    setFormInvolvedEntities([]);
    setSelectedEntityToAdd("");
    setRoleInputToAdd("");

    setRelMode("new");
    setFormRelChanges([]);
    setNewRelSourceId("");
    setNewRelTargetId("");
    setNewRelLabelInput("");
    setSelectedExistingRelId("");
    setRelBeforeInput("");
    setRelAfterInput("");

    setFormStatusChanges([]);
    setSelectedStatusEntityId("");
    setStatusOldInput("");
    setStatusNewInput("");

    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (evt: EventItem) => {
    setEditingEvent(evt);
    setFormName(evt.name || "");
    setFormDescription(evt.description || "");
    setFormWorldDate(evt.worldDate || "");
    setFormBookId(evt.bookId || "");
    setFormWritingStatus(evt.writingStatus || "planned");

    // Pre-populate entities involved
    if (Array.isArray(evt.entitiesInvolved)) {
      setFormInvolvedEntities(
        evt.entitiesInvolved.map((item) => ({
          entityId: item.entityId,
          role: item.role || "",
        }))
      );
    } else {
      setFormInvolvedEntities([]);
    }

    // Pre-populate relationship changes
    if (Array.isArray(evt.relationshipChanges)) {
      setFormRelChanges(
        evt.relationshipChanges.map((rc) => ({
          relationshipId: rc.relationshipId,
          sourceEntityId: rc.relationship?.sourceEntityId,
          targetEntityId: rc.relationship?.targetEntityId,
          sourceName: rc.relationship?.source?.name,
          targetName: rc.relationship?.target?.name,
          beforeLabel: rc.beforeLabel || "",
          afterLabel: rc.afterLabel || "",
        }))
      );
    } else {
      setFormRelChanges([]);
    }

    // Pre-populate status changes
    if (Array.isArray(evt.statusChanges)) {
      setFormStatusChanges(
        evt.statusChanges.map((sc) => ({
          entityId: sc.entityId,
          oldStatus: sc.oldStatus || "",
          newStatus: sc.newStatus || "",
        }))
      );
    } else {
      setFormStatusChanges([]);
    }

    setSelectedEntityToAdd("");
    setRoleInputToAdd("");
    setRelMode("new");
    setNewRelSourceId("");
    setNewRelTargetId("");
    setNewRelLabelInput("");
    setSelectedExistingRelId("");
    setRelBeforeInput("");
    setRelAfterInput("");
    setSelectedStatusEntityId("");
    setStatusOldInput("");
    setStatusNewInput("");

    setFormError(null);
    setIsModalOpen(true);
  };

  // Add Involved Entity to List
  const handleAddInvolvedEntity = () => {
    if (!selectedEntityToAdd) return;
    if (formInvolvedEntities.some((e) => e.entityId === selectedEntityToAdd)) {
      setFormError("Entitas tersebut sudah ada dalam daftar entitas terlibat");
      return;
    }
    setFormError(null);
    setFormInvolvedEntities((prev) => [
      ...prev,
      { entityId: selectedEntityToAdd, role: roleInputToAdd.trim() },
    ]);
    setSelectedEntityToAdd("");
    setRoleInputToAdd("");
  };

  // Inline Quick Create Entity Submit
  const handleQuickCreateEntitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEntityName.trim() || !quickEntityTypeId) return;

    try {
      setQuickEntitySubmitting(true);
      const res = await fetch(`/api/projects/${projectId}/entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickEntityName.trim(),
          typeId: quickEntityTypeId,
          description: "Entitas baru (dibuat via event)",
        }),
      });

      if (res.ok) {
        const createdEntity: EntitySimple = await res.json();
        setAllEntities((prev) => [...prev, createdEntity]);

        // Auto-add to involved entities
        setFormInvolvedEntities((prev) => [
          ...prev,
          { entityId: createdEntity.id, role: roleInputToAdd.trim() || "Terlibat" },
        ]);

        setIsQuickCreateEntityOpen(false);
        setQuickEntityName("");
      }
    } catch (err) {
      console.error("Quick create entity error:", err);
    } finally {
      setQuickEntitySubmitting(false);
    }
  };

  // Add NEW Relationship Change (Source ↔ Target)
  const handleAddNewRelChange = () => {
    if (!newRelSourceId || !newRelTargetId || !newRelLabelInput.trim()) {
      setFormError("Pilih Entitas A, Entitas B, dan label relasi baru (misal: Dendam)");
      return;
    }

    if (newRelSourceId === newRelTargetId) {
      setFormError("Pilih dua entitas yang berbeda untuk membuat relasi");
      return;
    }

    const srcObj = allEntities.find((e) => e.id === newRelSourceId);
    const tgtObj = allEntities.find((e) => e.id === newRelTargetId);

    setFormError(null);
    setFormRelChanges((prev) => [
      ...prev,
      {
        sourceEntityId: newRelSourceId,
        targetEntityId: newRelTargetId,
        sourceName: srcObj?.name || "Entitas A",
        targetName: tgtObj?.name || "Entitas B",
        beforeLabel: undefined,
        afterLabel: newRelLabelInput.trim(),
      },
    ]);

    setNewRelSourceId("");
    setNewRelTargetId("");
    setNewRelLabelInput("");
  };

  // Add EXISTING Relationship Change (Edit Label Before → After)
  const handleAddExistingRelChange = () => {
    if (!selectedExistingRelId || !relAfterInput.trim()) {
      setFormError("Pilih relasi yang ada dan isi label relasi baru (After)");
      return;
    }

    const relObj = allRelationships.find((r) => r.id === selectedExistingRelId);

    setFormError(null);
    setFormRelChanges((prev) => [
      ...prev,
      {
        relationshipId: selectedExistingRelId,
        sourceName: relObj?.source?.name || "Source",
        targetName: relObj?.target?.name || "Target",
        beforeLabel: relBeforeInput.trim() || relObj?.label || undefined,
        afterLabel: relAfterInput.trim(),
      },
    ]);

    setSelectedExistingRelId("");
    setRelBeforeInput("");
    setRelAfterInput("");
  };

  // Add Status Change to Form
  const handleAddStatusChange = () => {
    if (!selectedStatusEntityId || !statusNewInput.trim()) {
      setFormError("Pilih entitas dan isi status baru (misal: Deceased / Injured)");
      return;
    }
    setFormError(null);
    setFormStatusChanges((prev) => [
      ...prev,
      {
        entityId: selectedStatusEntityId,
        oldStatus: statusOldInput.trim(),
        newStatus: statusNewInput.trim(),
      },
    ]);
    setSelectedStatusEntityId("");
    setStatusOldInput("");
    setStatusNewInput("");
  };

  // Submit Event Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Nama event wajib diisi");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        worldDate: formWorldDate.trim() || null,
        bookId: formBookId || null,
        writingStatus: formWritingStatus,
        entitiesInvolved: formInvolvedEntities,
        relationshipChanges: formRelChanges,
        statusChanges: formStatusChanges,
      };

      const url = editingEvent
        ? `/api/projects/${projectId}/events/${editingEvent.id}`
        : `/api/projects/${projectId}/events`;

      const method = editingEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan event");
      }

      await fetchInitialData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save event error:", err);
      setFormError(err.message || "Gagal menyimpan event");
    } finally {
      setSubmitting(false);
    }
  };

  // Reorder Event Up/Down
  const handleReorderEvent = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredEvents.length) return;

    const currentItem = filteredEvents[index];
    const targetItem = filteredEvents[targetIndex];
    if (!currentItem || !targetItem) return;

    const realFromIdx = events.findIndex((e) => e.id === currentItem.id);
    const realToIdx = events.findIndex((e) => e.id === targetItem.id);
    if (realFromIdx < 0 || realToIdx < 0) return;

    const newEvents = [...events];
    const temp = newEvents[realFromIdx];
    newEvents[realFromIdx] = newEvents[realToIdx];
    newEvents[realToIdx] = temp;

    const updatedEvents = newEvents.map((evt, idx) => ({
      ...evt,
      orderInChapter: idx + 1,
    }));

    setEvents(updatedEvents);

    try {
      const orderedIds = updatedEvents.map((e) => e.id);
      const res = await fetch(`/api/projects/${projectId}/events/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedEventIds: orderedIds }),
      });
      if (!res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error("Reorder events error:", err);
      fetchInitialData();
    }
  };

  // Drag and Drop Handler
  const handleDrop = async (fromIdx: number | null, toIdx: number) => {
    if (
      fromIdx === null ||
      fromIdx === toIdx ||
      fromIdx < 0 ||
      fromIdx >= filteredEvents.length ||
      toIdx < 0 ||
      toIdx >= filteredEvents.length
    ) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const draggedItem = filteredEvents[fromIdx];
    const targetItem = filteredEvents[toIdx];
    if (!draggedItem || !targetItem) return;

    const realFromIdx = events.findIndex((e) => e.id === draggedItem.id);
    const realToIdx = events.findIndex((e) => e.id === targetItem.id);
    if (realFromIdx < 0 || realToIdx < 0) return;

    const newEvents = [...events];
    const [removed] = newEvents.splice(realFromIdx, 1);
    newEvents.splice(realToIdx, 0, removed);

    const updatedEvents = newEvents.map((evt, idx) => ({
      ...evt,
      orderInChapter: idx + 1,
    }));

    setEvents(updatedEvents);
    setDraggedIdx(null);
    setDragOverIdx(null);

    try {
      const orderedIds = updatedEvents.map((e) => e.id);
      const res = await fetch(`/api/projects/${projectId}/events/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedEventIds: orderedIds }),
      });
      if (!res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error("Reorder events drag error:", err);
      fetchInitialData();
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedDetailEvent?.id === eventId) setSelectedDetailEvent(null);
        fetchInitialData();
      }
    } catch (err) {
      console.error("Delete event error:", err);
    } finally {
      setDeletingEventId(null);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        !searchQuery.trim() ||
        evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.description &&
          evt.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const isPrimary = books.length > 0 && selectedBookFilter === books[0].id;
      const matchesBook =
        selectedBookFilter === "ALL" ||
        evt.bookId === selectedBookFilter ||
        (!evt.bookId && isPrimary);

      return matchesSearch && matchesBook;
    });
  }, [events, searchQuery, selectedBookFilter, books]);

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

      <main className="wrap pb-16" style={{ paddingTop: "24px" }}>
        {/* Top Control Bar with Full Flex Wrap Alignment */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={20} className="text-[var(--accent)]" />
              <h1 className="font-serif text-2xl font-semibold text-[var(--text)]">
                Peristiwa & Alur Cerita
              </h1>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Urutan kronologi kejadian dunia atau bab cerita. Geser kartu untuk mengatur urutan kejadian.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input with Clear Icon */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="text"
                placeholder="Cari event..."
                className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs rounded-xl pl-8 pr-3 py-2 outline-none focus:border-[var(--accent)] transition-colors w-44 md:w-56"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {books.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer outline-none hover:border-[var(--accent)] transition-colors"
                  value={selectedBookFilter}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setSelectedBookFilter(bId);
                    localStorage.setItem(`threadinery_active_book_${projectId}`, bId);
                    window.dispatchEvent(
                      new CustomEvent("threadinery:book_change", { detail: { bookId: bId } })
                    );
                  }}
                >
                  <option value="ALL">Semua Buku ({events.length})</option>
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

        {/* FULL-WIDTH Sequential Stream List */}
        <div className="w-full">
          {loading ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--text-secondary)]">
              Memuat alur urutan event...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <Calendar size={40} className="text-[var(--accent)] opacity-50" />
              <h3 className="font-serif text-lg font-semibold text-[var(--text)]">
                {events.length === 0
                  ? "Belum ada Event yang dicatat"
                  : "Tidak ada event yang sesuai pencarian"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                Catat peristiwa besar dalam cerita Anda. Anda dapat mengatur urutan kronologi kejadian dan mengaitkan karakter yang terlibat.
              </p>
              {events.length === 0 && (
                <button
                  type="button"
                  className="btn btn-primary text-xs px-5 mt-2"
                  onClick={handleOpenCreateModal}
                >
                  + Tambah Event Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 space-y-4">
              {/* Vertical Connector Line */}
              <div className="absolute left-2.5 top-4 bottom-4 w-0.5 bg-[var(--border)] z-0" />

              {filteredEvents.map((evt, idx) => (
                <div
                  key={evt.id}
                  className={`relative z-10 bg-[var(--surface)] border rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-3 md:gap-4 ${
                    draggedIdx === idx
                      ? "opacity-40 border-dashed border-[var(--accent)] scale-95"
                      : dragOverIdx === idx
                      ? "border-2 border-[var(--accent)] bg-[var(--accent-soft)] shadow-md"
                      : "border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverIdx !== idx) setDragOverIdx(idx);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDrop(draggedIdx, idx);
                  }}
                  onClick={() => setSelectedDetailEvent(evt)}
                >
                  {/* Left Grip Handle 6-Dots & Sequential Step Marker */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="flex flex-col gap-1 items-center justify-center p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] cursor-grab active:cursor-grabbing select-none rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
                      title="Tarik handle 6-titik ini untuk menggeser urutan event"
                      draggable={true}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDraggedIdx(idx);
                        e.dataTransfer.setData("text/plain", String(idx));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical size={18} />
                    </div>

                    <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-30"
                        onClick={() => handleReorderEvent(idx, "up")}
                        title="Naikkan urutan"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === filteredEvents.length - 1}
                        className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-30"
                        onClick={() => handleReorderEvent(idx, "down")}
                        title="Turunkan urutan"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-xs flex items-center justify-center shrink-0 font-serif">
                      {idx + 1}
                    </div>
                  </div>

                  {/* Main Event Content Row */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-base md:text-lg font-semibold text-[var(--text)] truncate">
                          {evt.name}
                        </h3>

                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                          {evt.writingStatus === "final"
                            ? "Final"
                            : evt.writingStatus === "draft"
                            ? "Draft"
                            : "Planned"}
                        </span>

                        {evt.worldDate && (
                          <span className="text-[9.5px] font-medium px-2 py-0.5 rounded-full bg-[var(--sage-soft)] text-[var(--sage)] flex items-center gap-1">
                            <Clock size={10} />
                            <span>{evt.worldDate}</span>
                          </span>
                        )}
                      </div>

                      {/* Top Right Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] rounded-lg hover:bg-[var(--bg)]"
                          onClick={() => handleOpenEditModal(evt)}
                          title="Edit event"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--rose)] rounded-lg hover:bg-[var(--bg)]"
                          onClick={() => setDeletingEventId(evt.id)}
                          title="Hapus event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Description Snippet */}
                    {evt.description ? (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1 leading-relaxed mb-2">
                        {evt.description}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] italic mb-2">
                        Belum ada rincian deskripsi. Klik untuk membuka detail.
                      </p>
                    )}

                    {/* Footer Badges & Metadata */}
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)] flex-wrap">
                      {evt.book && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} className="text-[var(--accent)]" />
                          <span>{evt.book.title}</span>
                        </span>
                      )}

                      {evt.chapter && (
                        <Link
                          href={`/project/${projectId}/outline/${evt.chapter.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[var(--accent)] hover:underline font-semibold"
                          title={`Buka Bab "${evt.chapter.title}" di Outline`}
                        >
                          <FileText size={12} />
                          <span>Bab: {evt.chapter.title}</span>
                        </Link>
                      )}

                      {Array.isArray(evt.entitiesInvolved) && evt.entitiesInvolved.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-[var(--accent)]" />
                          <span>{evt.entitiesInvolved.length} Entitas Terlibat</span>
                        </span>
                      )}

                      {Array.isArray(evt.relationshipChanges) && evt.relationshipChanges.length > 0 && (
                        <span className="flex items-center gap-1 text-[var(--accent)] font-semibold">
                          <GitCompare size={12} />
                          <span>{evt.relationshipChanges.length} Relasi Dicatat</span>
                        </span>
                      )}

                      {Array.isArray(evt.statusChanges) && evt.statusChanges.length > 0 && (
                        <span className="flex items-center gap-1 text-[var(--rose)] font-semibold">
                          <Activity size={12} />
                          <span>{evt.statusChanges.length} Perubahan Status</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FULL DETAIL MODAL OVERLAY (INSTANT POPUP WITHOUT PAGE RELOAD) */}
      {selectedDetailEvent && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedDetailEvent(null);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "620px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    {selectedDetailEvent.writingStatus || "Planned"}
                  </span>
                  {selectedDetailEvent.worldDate && (
                    <span className="text-[10px] font-medium text-[var(--sage)] bg-[var(--sage-soft)] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={11} />
                      <span>{selectedDetailEvent.worldDate}</span>
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[var(--text)]">
                  {selectedDetailEvent.name}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedDetailEvent(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-5 py-2">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-serif">
                  Deskripsi Kejadian
                </h4>
                <p className="text-xs text-[var(--text)] leading-relaxed bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--border)] whitespace-pre-line">
                  {selectedDetailEvent.description || "Belum ada rincian deskripsi."}
                </p>
              </div>

              {/* Involved Entities Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2 font-serif flex items-center gap-1">
                  <Users size={14} />
                  <span>Entitas & Karakter Terlibat ({selectedDetailEvent.entitiesInvolved?.length || 0})</span>
                </h4>
                {Array.isArray(selectedDetailEvent.entitiesInvolved) &&
                selectedDetailEvent.entitiesInvolved.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedDetailEvent.entitiesInvolved.map((item) => (
                      <Link
                        key={item.entityId}
                        href={`/project/${projectId}/entities/${item.entityId}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs hover:border-[var(--accent)] hover:shadow-xs transition-all group cursor-pointer"
                        title={`Buka Profil ${item.entity?.name || "Entitas"}`}
                      >
                        <span className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                          {item.entity?.name || "Entitas"}
                        </span>
                        {item.role && (
                          <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md">
                            {item.role}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] italic">
                    Tidak ada entitas yang ditandai.
                  </p>
                )}
              </div>

              {/* Relationship Changes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2 font-serif flex items-center gap-1">
                  <GitCompare size={14} />
                  <span>Perubahan & Relasi Kejadian</span>
                </h4>
                {Array.isArray(selectedDetailEvent.relationshipChanges) &&
                selectedDetailEvent.relationshipChanges.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedDetailEvent.relationshipChanges.map((rc, idx) => (
                      <div
                        key={rc.id || idx}
                        className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs flex flex-col gap-1"
                      >
                        <span className="font-bold text-[var(--text)] flex items-center gap-1.5 flex-wrap">
                          <Link2 size={13} className="text-[var(--accent)]" />
                          {rc.relationship?.sourceEntityId ? (
                            <Link
                              href={`/project/${projectId}/entities/${rc.relationship.sourceEntityId}`}
                              className="hover:underline hover:text-[var(--accent)]"
                            >
                              {rc.sourceName || rc.relationship?.source?.name}
                            </Link>
                          ) : (
                            <span>{rc.sourceName || rc.relationship?.source?.name}</span>
                          )}
                          <span className="text-[var(--text-secondary)]">↔</span>
                          {rc.relationship?.targetEntityId ? (
                            <Link
                              href={`/project/${projectId}/entities/${rc.relationship.targetEntityId}`}
                              className="hover:underline hover:text-[var(--accent)]"
                            >
                              {rc.targetName || rc.relationship?.target?.name}
                            </Link>
                          ) : (
                            <span>{rc.targetName || rc.relationship?.target?.name}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs">
                          {rc.beforeLabel && (
                            <>
                              <span className="line-through text-[var(--text-secondary)]">
                                {rc.beforeLabel}
                              </span>
                              <span className="text-[var(--accent)] font-bold">→</span>
                            </>
                          )}
                          <span className="font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-md">
                            {rc.afterLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] italic">
                    Belum ada perubahan relasi yang dicatat dalam event ini.
                  </p>
                )}
              </div>

              {/* Status Changes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--rose)] mb-2 font-serif flex items-center gap-1">
                  <Activity size={14} />
                  <span>Perubahan Status Karakter</span>
                </h4>
                {Array.isArray(selectedDetailEvent.statusChanges) &&
                selectedDetailEvent.statusChanges.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedDetailEvent.statusChanges.map((sc, idx) => (
                      <div
                        key={sc.id || idx}
                        className="p-3 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose)] text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-[var(--text)]">
                          {sc.entity?.name}
                        </span>
                        <span className="font-bold text-[var(--rose)] uppercase tracking-wider text-[10px] bg-white px-2.5 py-0.5 rounded-md shadow-xs">
                          {sc.newStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] italic">
                    Belum ada perubahan status karakter yang dicatat.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => setSelectedDetailEvent(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs px-5 flex items-center gap-1.5"
                onClick={() => {
                  const target = selectedDetailEvent;
                  setSelectedDetailEvent(null);
                  handleOpenEditModal(target);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Event Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "620px", width: "100%" }}
          >
            <div className="modal-header">
              <h2>{editingEvent ? "Edit Event" : "Buat Event Baru"}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2.5 rounded-xl text-xs font-medium mb-3">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
              {/* Event Name */}
              <div className="form-group">
                <label>Nama Event *</label>
                <input
                  type="text"
                  className="form-input text-xs font-medium"
                  placeholder='Misal: "Pembantaian Desa Rannfell", "Penyusupan Istana"...'
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Deskripsi Kejadian (Opsional)</label>
                <textarea
                  className="form-input text-xs min-h-[80px]"
                  placeholder="Rincian kronologi atau ringkasan apa yang terjadi..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* World Date & Status Grid */}
              <div className="flex flex-col gap-3">
                <AdaptiveWorldDateInput
                  calendarType={calendarType}
                  worldDate={formWorldDate}
                  onChange={setFormWorldDate}
                  knownEras={knownEras}
                />

                <div className="form-group">
                  <label>Status Penulisan</label>
                  <select
                    className="form-input text-xs"
                    value={formWritingStatus}
                    onChange={(e) => setFormWritingStatus(e.target.value)}
                  >
                    <option value="planned">Planned (Rencana)</option>
                    <option value="draft">Draft (Draf)</option>
                    <option value="final">Final (Selesai)</option>
                  </select>
                </div>
              </div>

              {/* Book Link */}
              {books.length > 0 && (
                <div className="form-group">
                  <label>Terjadi di Buku Mana? (Opsional)</label>
                  <select
                    className="form-input text-xs"
                    value={formBookId}
                    onChange={(e) => setFormBookId(e.target.value)}
                  >
                    <option value="">-- Tanpa Buku Spesifik --</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. ENTITIES INVOLVED + SEARCHABLE PICKER + INLINE QUICK CREATE */}
              <div className="form-group pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    1. Entitas Terlibat
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] font-semibold flex items-center gap-1 hover:underline"
                    onClick={() => setIsQuickCreateEntityOpen(true)}
                  >
                    <UserPlus size={13} />
                    <span>+ Buat Entitas Baru Inline</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <SmartEntityPickerWithFilters
                    entities={allEntities}
                    entityTypes={entityTypes}
                    selectedEntityId={selectedEntityToAdd}
                    onSelectEntity={(id) => setSelectedEntityToAdd(id)}
                    placeholder="Cari entitas..."
                    onOpenQuickCreate={() => setIsQuickCreateEntityOpen(true)}
                  />
                  <input
                    type="text"
                    className="form-input text-xs sm:w-36"
                    placeholder="Peran (misal: Pelaku)..."
                    value={roleInputToAdd}
                    onChange={(e) => setRoleInputToAdd(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost text-xs border-[var(--border)] px-3 hover:border-[var(--accent)]"
                    onClick={handleAddInvolvedEntity}
                  >
                    + Tambah
                  </button>
                </div>

                {/* List of Involved Entities */}
                {formInvolvedEntities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                    {formInvolvedEntities.map((item) => {
                      const entObj = allEntities.find((e) => e.id === item.entityId);
                      return (
                        <span
                          key={item.entityId}
                          className="inline-flex items-center gap-1 text-xs bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-xl"
                        >
                          <span className="font-semibold text-[var(--text)]">
                            {entObj?.name || "Entitas"}
                          </span>
                          {item.role && (
                            <span className="text-[9.5px] text-[var(--accent)] font-bold bg-[var(--accent-soft)] px-1.5 py-0.2 rounded-md">
                              {item.role}
                            </span>
                          )}
                          <button
                            type="button"
                            className="text-[var(--text-secondary)] hover:text-[var(--rose)] ml-1"
                            onClick={() =>
                              setFormInvolvedEntities((prev) =>
                                prev.filter((e) => e.entityId !== item.entityId)
                              )
                            }
                          >
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. CATAT PERUBAHAN RELASI WITH SEARCHABLE PICKERS */}
              <div className="form-group pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    2. Catat Relasi Kejadian (Multi Relasi)
                  </label>

                  {/* Mode Switch Tabs */}
                  <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] p-1 rounded-xl text-[11px] font-semibold">
                    <button
                      type="button"
                      className={`px-2.5 py-0.5 rounded-lg transition-colors ${
                        relMode === "new"
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                      }`}
                      onClick={() => setRelMode("new")}
                    >
                      + Relasi Baru
                    </button>
                    <button
                      type="button"
                      className={`px-2.5 py-0.5 rounded-lg transition-colors ${
                        relMode === "existing"
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                      }`}
                      onClick={() => setRelMode("existing")}
                    >
                      Edit Relasi Ada
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                  {relMode === "new"
                    ? "Cari & pilih 2 karakter/entitas untuk memberi label hubungan baru (misal: Dendam, Musuh)."
                    : "Pilih relasi yang sudah ada untuk mencatat perubahan labelnya (Before → After)."}
                </p>

                {relMode === "new" ? (
                  /* MODE A: BUAT RELASI BARU WITH SEARCHABLE PICKERS */
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <SmartEntityPickerWithFilters
                        entities={allEntities}
                        entityTypes={entityTypes}
                        selectedEntityId={newRelSourceId}
                        onSelectEntity={(id) => setNewRelSourceId(id)}
                        placeholder="Cari Entitas A (Source)..."
                        onOpenQuickCreate={() => setIsQuickCreateEntityOpen(true)}
                      />
                      <SmartEntityPickerWithFilters
                        entities={allEntities}
                        entityTypes={entityTypes}
                        selectedEntityId={newRelTargetId}
                        onSelectEntity={(id) => setNewRelTargetId(id)}
                        placeholder="Cari Entitas B (Target)..."
                        excludeEntityId={newRelSourceId}
                        onOpenQuickCreate={() => setIsQuickCreateEntityOpen(true)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="form-input text-xs flex-1"
                        placeholder='Label Relasi Baru (misal: "Dendam", "Musuh Bebet")...'
                        value={newRelLabelInput}
                        onChange={(e) => setNewRelLabelInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost text-xs border-[var(--border)] px-4 hover:border-[var(--accent)] shrink-0"
                        onClick={handleAddNewRelChange}
                      >
                        + Tambah Relasi
                      </button>
                    </div>
                  </div>
                ) : (
                  /* MODE B: EDIT RELASI ADA */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <select
                      className="form-input text-xs"
                      value={selectedExistingRelId}
                      onChange={(e) => setSelectedExistingRelId(e.target.value)}
                    >
                      <option value="">-- Pilih Relasi Ada --</option>
                      {allRelationships.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.source?.name} ↔ {r.target?.name} ({r.label})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder='Before (misal: "Teman")'
                      value={relBeforeInput}
                      onChange={(e) => setRelBeforeInput(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        className="form-input text-xs flex-1"
                        placeholder='After (misal: "Musuh")'
                        value={relAfterInput}
                        onChange={(e) => setRelAfterInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost text-xs border-[var(--border)] px-3 hover:border-[var(--accent)]"
                        onClick={handleAddExistingRelChange}
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Formed Relationship Changes */}
                {formRelChanges.length > 0 && (
                  <div className="flex flex-col gap-1.5 p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                    {formRelChanges.map((rc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)]"
                      >
                        <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                          <Link2 size={13} className="text-[var(--accent)]" />
                          <span>{rc.sourceName} ↔ {rc.targetName}:</span>
                          {rc.beforeLabel && (
                            <span className="line-through text-[var(--text-secondary)]">
                              {rc.beforeLabel} →
                            </span>
                          )}
                          <span className="font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md">
                            {rc.afterLabel}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="text-[var(--text-secondary)] hover:text-[var(--rose)]"
                          onClick={() =>
                            setFormRelChanges((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. STATUS CHANGES WITH SEARCHABLE PICKER */}
              <div className="form-group pt-3 border-t border-[var(--border)]">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--rose)] mb-1">
                  3. Catat Perubahan Status Karakter
                </label>

                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <SmartEntityPickerWithFilters
                    entities={allEntities}
                    entityTypes={entityTypes}
                    selectedEntityId={selectedStatusEntityId}
                    onSelectEntity={(id) => {
                      setSelectedStatusEntityId(id);
                      const ent = allEntities.find((e) => e.id === id);
                      if (ent) setStatusOldInput(ent.status || "Alive");
                    }}
                    placeholder="Cari Karakter/Entitas..."
                    onOpenQuickCreate={() => setIsQuickCreateEntityOpen(true)}
                  />
                  <input
                    type="text"
                    className="form-input text-xs sm:w-28 text-[var(--text-secondary)]"
                    placeholder="Status Awal..."
                    value={statusOldInput}
                    onChange={(e) => setStatusOldInput(e.target.value)}
                    readOnly
                  />
                  <select
                    className="form-input text-xs sm:w-36 font-semibold text-[var(--rose)]"
                    value={statusNewInput || "Deceased"}
                    onChange={(e) => setStatusNewInput(e.target.value)}
                  >
                    <option value="Alive">💚 Alive (Hidup)</option>
                    <option value="Deceased">💀 Deceased (Meninggal)</option>
                    <option value="Unknown">❓ Unknown (Hilang)</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost text-xs border-[var(--border)] px-3 hover:border-[var(--rose)] shrink-0"
                    onClick={() => {
                      if (!selectedStatusEntityId) {
                        setFormError("Pilih entitas terlebih dahulu");
                        return;
                      }
                      const activeNewStatus = statusNewInput || "Deceased";
                      setFormError(null);
                      setFormStatusChanges((prev) => [
                        ...prev,
                        {
                          entityId: selectedStatusEntityId,
                          oldStatus: statusOldInput || "Alive",
                          newStatus: activeNewStatus,
                        },
                      ]);
                      setSelectedStatusEntityId("");
                      setStatusOldInput("");
                      setStatusNewInput("");
                    }}
                  >
                    + Tambah Perubahan Status
                  </button>
                </div>

                {/* List of Status Changes */}
                {formStatusChanges.length > 0 && (
                  <div className="flex flex-col gap-1.5 p-2 bg-[var(--rose-soft)] border border-[var(--rose)] rounded-xl">
                    {formStatusChanges.map((sc, idx) => {
                      const entObj = allEntities.find((e) => e.id === sc.entityId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-[var(--border)]"
                        >
                          <span className="font-semibold text-[var(--text)]">
                            {entObj?.name}: Status Baru →{" "}
                            <span className="font-bold text-[var(--rose)] uppercase">
                              {sc.newStatus}
                            </span>
                          </span>
                          <button
                            type="button"
                            className="text-[var(--text-secondary)] hover:text-[var(--rose)]"
                            onClick={() =>
                              setFormStatusChanges((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={submitting}
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingEvent
                    ? "Simpan Perubahan"
                    : "Buat Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: INLINE QUICK CREATE ENTITY */}
      {isQuickCreateEntityOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsQuickCreateEntityOpen(false);
          }}
          style={{ zIndex: 120 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px", width: "100%" }}
          >
            <div className="modal-header">
              <h2>Buat Entitas Baru Inline</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsQuickCreateEntityOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickCreateEntitySubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Nama Entitas *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="Misal: Kolonel Tarnessi, Pedang Naghari..."
                  value={quickEntityName}
                  onChange={(e) => setQuickEntityName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Tipe Entitas *</label>
                <select
                  className="form-input text-xs"
                  value={quickEntityTypeId}
                  onChange={(e) => setQuickEntityTypeId(e.target.value)}
                  required
                >
                  {entityTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsQuickCreateEntityOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5"
                  disabled={quickEntitySubmitting}
                >
                  {quickEntitySubmitting ? "Membuat..." : "Simpan & Hubungkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEventId && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingEventId(null);
          }}
          style={{ zIndex: 130 }}
        >
          <div
            className="modal-content text-center p-6"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <AlertCircle size={36} className="text-[var(--rose)] mx-auto mb-2" />
            <h3 className="font-serif text-lg font-semibold text-[var(--text)] mb-1">
              Hapus Event Ini?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5">
              Event ini akan dihapus permanen dari alur kejadian.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => setDeletingEventId(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs px-5 bg-[var(--rose)] border-[var(--rose)] hover:opacity-90"
                onClick={() => handleDeleteEvent(deletingEventId)}
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
