"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { ProjectNavbar } from "./ProjectNavbar";
import { SmartEntityPickerWithFilters } from "./SmartEntityPickerWithFilters";
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  ArrowRight,
  Sparkles,
  User,
  MapPin,
  Building,
  Package,
  Trash2,
  Network,
  RotateCcw,
  ChevronRight,
  Link2,
  Lightbulb,
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Calendar,
  BookOpen,
} from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface EntityData {
  id: string;
  name: string;
  description: string | null;
  typeId: string;
  type?: EntityTypeItem;
  tags?: string[];
  metadata?: Record<string, any> | null;
  imageUrl?: string | null;
  status?: string | null;
}

interface RelationshipData {
  id: string;
  label: string;
  description?: string | null;
  sourceEntityId: string;
  targetEntityId: string;
  source?: EntityData;
  target?: EntityData;
}

// ── Phase 7: Implicit Connections ──────────────────────────────────
interface ImplicitConnection {
  entityA: EntityData;
  entityB: EntityData;
  sharedEntity: EntityData;
  labelA: string;
  labelB: string;
}

// ── Phase 7: Metadata Reference Discovery ────────────────────────
interface MetadataRecommendation {
  id: string;            // unique key for dismissal tracking
  sourceEntity: EntityData;
  targetEntity: EntityData;
  fieldKey: string;      // metadata key or "description"
  fieldValue: string;    // the raw text that matched
  suggestedLabel: string;// pre-filled label for the new relationship
  hasExplicitLink: boolean; // true = already connected, show as context only
}

interface RelationshipGraphClientProps {
  projectId: string;
  projectName: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  initialFocus?: string;
}

// ── Phase 7: Fuzzy Entity Name Resolver ────────────────────────────
function normalizeEntityName(name: string): string {
  return name.toLowerCase().replace(/^(the|a|an)\s+/i, "").trim();
}

function findEntityByFuzzyName(text: string, entities: EntityData[]): EntityData | null {
  if (!text || text.trim().length < 3) return null;
  const norm = normalizeEntityName(text.trim());
  // Exact match after normalization
  const exact = entities.find((e) => normalizeEntityName(e.name) === norm);
  if (exact) return exact;
  // Entity name is fully contained within the value (e.g. value = "Witch of Eterna")
  return entities.find((e) => {
    const en = normalizeEntityName(e.name);
    return en.length >= 3 && norm.includes(en);
  }) || null;
}

// Quick Chip Labels (§7.5)
const QUICK_CHIP_LABELS = [
  "Ibu",
  "Ayah",
  "Anak",
  "Saudara",
  "Teman",
  "Musuh",
  "Member of",
  "Studies at",
  "Mentor",
  "Partner",
];

// Helper: HIGH CONTRAST & DISTINCT TYPE COLOR THEMES
function getTypeTheme(typeName?: string) {
  const name = typeName?.toLowerCase() || "";
  if (name.includes("character")) {
    return {
      icon: User,
      badgeBg: "#F0DDCB",
      badgeColor: "#9A4B1C",
      borderColor: "#C97B4A",
      topBarColor: "#C97B4A",
      cardBg: "var(--surface)",
      label: "Character",
    };
  }
  if (name.includes("location")) {
    return {
      icon: MapPin,
      badgeBg: "#E3E9DD",
      badgeColor: "#3B522F",
      borderColor: "#5B734B",
      topBarColor: "#5B734B",
      cardBg: "var(--surface)",
      label: "Location",
    };
  }
  if (name.includes("organization")) {
    return {
      icon: Building,
      badgeBg: "#FEF3C7",
      badgeColor: "#92400E",
      borderColor: "#D97706",
      topBarColor: "#D97706",
      cardBg: "var(--surface)",
      label: "Organization",
    };
  }
  if (name.includes("object")) {
    return {
      icon: Package,
      badgeBg: "#FEE2E2",
      badgeColor: "#991B1B",
      borderColor: "#DC2626",
      topBarColor: "#DC2626",
      cardBg: "var(--surface)",
      label: "Object",
    };
  }
  // Concept / Generic
  return {
    icon: Sparkles,
    badgeBg: "#EDE9FE",
    badgeColor: "#5B21B6",
    borderColor: "#7C3AED",
    topBarColor: "#7C3AED",
    cardBg: "var(--surface)",
    label: typeName || "Concept",
  };
}

// Custom Compact Node Component with HIGH-CONTRAST DISTINCT STYLING
function MindMapEntityNode({ data }: { data: any }) {
  const typeName = data.entity?.type?.name || "Generic";
  const theme = getTypeTheme(typeName);
  const TypeIcon = theme.icon;
  const isCenterFocus = data.isCenterFocus;
  const isExpanded = data.isExpanded;
  const hasSubConnections = data.hasSubConnections;
  const isSelected = data.isSelected;

  return (
    <div
      className={`relative px-4 py-3 rounded-2xl bg-[var(--surface)] transition-all duration-200 cursor-pointer shadow-md select-none overflow-hidden ${
        isSelected
          ? "ring-4 shadow-xl scale-105"
          : isCenterFocus
          ? "ring-3 shadow-md"
          : "hover:shadow-lg"
      }`}
      style={{
        minWidth: "180px",
        maxWidth: "230px",
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: isSelected || isCenterFocus ? theme.borderColor : theme.borderColor,
        boxShadow: isSelected
          ? `0 0 0 4px ${theme.badgeBg}`
          : isCenterFocus
          ? `0 0 0 3px ${theme.badgeBg}`
          : undefined,
      }}
    >
      {/* Thick Left Accent Bar by Entity Type */}
      <div
        className="absolute top-0 bottom-0 left-0 w-2"
        style={{ backgroundColor: theme.topBarColor }}
      />

      {/* 4 Handles for Nearest Smart Side Edge Connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-2.5 h-2.5 !border-2 !border-[var(--surface)]"
        style={{ backgroundColor: theme.borderColor }}
      />

      {/* Floating Center Focus Badge */}
      {isCenterFocus && (
        <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-white shadow-sm border border-white">
          PUSAT
        </span>
      )}

      {/* Type Badge Row with Distinct High-Contrast Theme Colors & Dynamic Status */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 pl-1 overflow-hidden">
        <div className="flex items-center gap-1.5 truncate">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 font-bold"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeColor }}
          >
            <TypeIcon size={12} />
          </div>
          <span
            className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeColor }}
          >
            {typeName}
          </span>
        </div>

        {/* Dynamic Status Badge (Meninggal / Unknown / Hidup / Rusak) */}
        {data.entity?.status && (
          <span
            className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
              data.entity.status.toLowerCase().includes("deceased") ||
              data.entity.status.toLowerCase().includes("mati") ||
              data.entity.status.toLowerCase().includes("meninggal")
                ? "bg-red-100 text-red-700 border border-red-300 dark:bg-red-950 dark:text-red-300"
                : data.entity.status.toLowerCase().includes("unknown") ||
                  data.entity.status.toLowerCase().includes("hilang")
                ? "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-950 dark:text-purple-300"
                : "bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]"
            }`}
          >
            {data.entity.status}
          </span>
        )}
      </div>

      <h4 className="font-serif font-semibold text-xs text-[var(--text)] truncate mb-0.5 pl-1">
        {data.entity.name}
      </h4>

      {data.entity.description && (
        <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 leading-snug pl-1">
          {data.entity.description}
        </p>
      )}

      {!isCenterFocus && hasSubConnections && (
        <div
          className="mt-1.5 pt-1 border-t border-[var(--border)] flex items-center justify-between text-[9.5px] font-bold pl-1"
          style={{ color: theme.badgeColor }}
        >
          <span>{isExpanded ? "Cabang Terbuka" : "Klik untuk ekspand"}</span>
          <ChevronRight
            size={11}
            className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  mindMapNode: MindMapEntityNode,
};

function GraphFlowCanvas({
  projectId,
  projectName,
  user,
  initialFocus,
}: {
  projectId: string;
  projectName?: string;
  user: { id: string; name?: string | null; email?: string | null };
  initialFocus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusQuery = searchParams.get("focus") || initialFocus;
  const { setCenter } = useReactFlow();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [relationships, setRelationships] = useState<RelationshipData[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Central Focus Node ID
  const [centerFocusId, setCenterFocusId] = useState<string | null>(focusQuery || null);

  // Active Highlighted Node ID
  const [activeHighlightNodeId, setActiveHighlightNodeId] = useState<string | null>(focusQuery || null);

  // Expanded Node IDs
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  // Search Input State & Auto-Suggest Popup
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // User Dragged Positions Map (Only stores user manual drag overrides!)
  const userDraggedPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Add Relationship Modal State
  const [isAddRelModalOpen, setIsAddRelModalOpen] = useState(false);
  const [relLabel, setRelLabel] = useState("");
  const [relSourceId, setRelSourceId] = useState("");
  const [relTargetId, setRelTargetId] = useState("");
  const [relSubmitting, setRelSubmitting] = useState(false);
  const [relError, setRelError] = useState<string | null>(null);

  // ── Phase 7: Implicit Edge Toggle ──
  const [showImplicitEdges, setShowImplicitEdges] = useState(true);
  const [selectedImplicit, setSelectedImplicit] = useState<ImplicitConnection | null>(null);

  // ── Phase 7: Metadata Discovery ──
  const [showRecsPanel, setShowRecsPanel] = useState(false);
  const [dismissedRecIds, setDismissedRecIds] = useState<Set<string>>(new Set());
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null); // clicked explicit edge

  // ── Book Scoping & Sync State ──
  const [selectedBookId, setSelectedBookId] = useState<string>("ALL");
  const [books, setBooks] = useState<any[]>([]);
  const [scopeToActiveBook, setScopeToActiveBook] = useState<boolean>(true);

  // ── Phase 8.1: Temporal Dynamics (Time-Travel Timeline Simulation) ──
  const [events, setEvents] = useState<any[]>([]);
  const [isTimelineMode, setIsTimelineMode] = useState(false);
  const [timelineStepIndex, setTimelineStepIndex] = useState<number>(0);

  // ReactFlow Nodes & Edges State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    const savedBook = localStorage.getItem(`threadinery_active_book_${projectId}`);
    if (savedBook) {
      setSelectedBookId(savedBook);
      if (savedBook === "ALL") setScopeToActiveBook(false);
    }

    fetchGraphData();

    const handleBookChange = (e: any) => {
      if (e.detail?.bookId !== undefined) {
        setSelectedBookId(e.detail.bookId);
        if (e.detail.bookId === "ALL") {
          setScopeToActiveBook(false);
        } else {
          setScopeToActiveBook(true);
        }
      }
    };
    window.addEventListener("threadinery:book_change", handleBookChange);

    const handleOutsideSearchClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as any)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideSearchClick);
    return () => {
      window.removeEventListener("threadinery:book_change", handleBookChange);
      document.removeEventListener("mousedown", handleOutsideSearchClick);
    };
  }, [projectId]);

  // Sync focus query explicitly whenever URL changes or entities load!
  useEffect(() => {
    const targetFocus = focusQuery || initialFocus;
    if (targetFocus && entities.length > 0) {
      const targetEnt = entities.find((e) => e.id === targetFocus);
      if (targetEnt) {
        setCenterFocusId(targetFocus);
        setActiveHighlightNodeId(targetFocus);
        setExpandedNodeIds(new Set());
        userDraggedPositionsRef.current = new Map();
      }
    }
  }, [focusQuery, initialFocus, entities]);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const [entitiesRes, relsRes, typesRes, eventsRes, booksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/relationships`),
        fetch(`/api/projects/${projectId}/entity-types`),
        fetch(`/api/projects/${projectId}/events`),
        fetch(`/api/projects/${projectId}/books`),
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        if (Array.isArray(booksData)) setBooks(booksData);
      }

      if (entitiesRes.ok) {
        const entData: EntityData[] = await entitiesRes.json();
        if (Array.isArray(entData) && entData.length > 0) {
          setEntities(entData);

          const targetFocus = focusQuery || initialFocus;
          let defaultFocus = entData[0].id;

          if (targetFocus && entData.some((e) => e.id === targetFocus)) {
            defaultFocus = targetFocus;
            setActiveHighlightNodeId(targetFocus);
          } else {
            const taggedChar = entData.find(
              (e) =>
                e.type?.name?.toLowerCase() === "character" &&
                Array.isArray(e.tags) &&
                e.tags.length > 0
            );
            if (taggedChar) {
              defaultFocus = taggedChar.id;
            } else {
              const charEnt = entData.find((e) => e.type?.name?.toLowerCase() === "character");
              if (charEnt) defaultFocus = charEnt.id;
            }
          }
          setCenterFocusId(defaultFocus);
        }
      }

      if (relsRes.ok) {
        const relData = await relsRes.json();
        if (Array.isArray(relData)) setRelationships(relData);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (Array.isArray(typesData)) setEntityTypes(typesData);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) {
          setEvents(eventsData);
          setTimelineStepIndex(0);
        }
      }
    } catch (err) {
      console.warn("Fetch graph data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // ── Book Scoping: Filter entities and events by active book if enabled ──
  const currentActiveBookObj = books.find((b) => b.id === selectedBookId);

  const scopedEntities = useMemo(() => {
    if (!scopeToActiveBook || !selectedBookId || selectedBookId === "ALL") {
      return entities;
    }
    const isPrimary = books.length > 0 && selectedBookId === books[0].id;
    return entities.filter((ent) => {
      const bookIds = ent.metadata?.bookIds;
      if (Array.isArray(bookIds) && bookIds.length > 0) {
        return bookIds.includes(selectedBookId);
      }
      return isPrimary;
    });
  }, [entities, scopeToActiveBook, selectedBookId, books]);

  // ── Phase 8.1: Compute Dynamic State based on Timeline Events ──
  const sortedEvents = useMemo(() => {
    let evts = events;
    if (scopeToActiveBook && selectedBookId && selectedBookId !== "ALL") {
      const isPrimary = books.length > 0 && selectedBookId === books[0].id;
      evts = evts.filter((e) => e.bookId === selectedBookId || (!e.bookId && isPrimary));
    }
    return [...evts].sort((a, b) => {
      const orderA = a.orderInChapter ?? a.orderIndex ?? 0;
      const orderB = b.orderInChapter ?? b.orderIndex ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [events, scopeToActiveBook, selectedBookId, books]);

  const occurredEvents = useMemo(() => {
    if (!isTimelineMode) return sortedEvents;
    return sortedEvents.slice(0, timelineStepIndex);
  }, [sortedEvents, isTimelineMode, timelineStepIndex]);

  const occurredEventIds = useMemo(() => {
    return new Set(occurredEvents.map((e) => e.id));
  }, [occurredEvents]);

  // Current checkpoint event (if step > 0)
  const currentTimelineEvent = useMemo(() => {
    if (timelineStepIndex > 0 && timelineStepIndex <= sortedEvents.length) {
      return sortedEvents[timelineStepIndex - 1];
    }
    return null;
  }, [sortedEvents, timelineStepIndex]);

  // Entities with dynamic status computed from occurred events
  const dynamicEntities = useMemo(() => {
    const baseList = scopedEntities;
    if (!isTimelineMode) return baseList;

    return baseList.map((ent) => {
      let activeStatus = ent.status;
      let foundChange = false;

      // 1. Scan occurred events in reverse chronological order for latest status change
      for (let i = occurredEvents.length - 1; i >= 0; i--) {
        const ev = occurredEvents[i];
        if (Array.isArray(ev.statusChanges)) {
          const sc = ev.statusChanges.find(
            (s: any) => s.entityId === ent.id || s.entity?.id === ent.id
          );
          if (sc && sc.newStatus) {
            activeStatus = sc.newStatus;
            foundChange = true;
            break;
          }
        }
      }

      // 2. If no status change has occurred yet, check future events for initial oldStatus
      if (!foundChange) {
        const futureEvents = sortedEvents.slice(timelineStepIndex);
        for (let i = 0; i < futureEvents.length; i++) {
          const ev = futureEvents[i];
          if (Array.isArray(ev.statusChanges)) {
            const sc = ev.statusChanges.find(
              (s: any) => s.entityId === ent.id || s.entity?.id === ent.id
            );
            if (sc && sc.oldStatus) {
              activeStatus = sc.oldStatus;
              break;
            }
          }
        }
      }

      return {
        ...ent,
        status: activeStatus,
      };
    });
  }, [scopedEntities, sortedEvents, occurredEvents, isTimelineMode, timelineStepIndex]);

  // Relationships with dynamic existence and labels computed from timeline events
  const dynamicRelationships = useMemo(() => {
    const scopedIdSet = new Set(scopedEntities.map((e) => e.id));

    let filteredRels = relationships;
    if (scopeToActiveBook && selectedBookId && selectedBookId !== "ALL") {
      filteredRels = filteredRels.filter(
        (rel: any) => scopedIdSet.has(rel.sourceEntityId) || scopedIdSet.has(rel.targetEntityId)
      );
    }

    if (!isTimelineMode) return filteredRels;

    return filteredRels
      .filter((rel: any) => {
        // Only relationships that were born/created from a specific event are guarded by timeline creation
        const isEventCreated = Boolean(
          rel.description && rel.description.startsWith("Relasi baru dari event:")
        );

        if (isEventCreated) {
          // Find the creation event
          let creationEventId = rel.eventChanges?.[0]?.eventId;
          if (!creationEventId && rel.description) {
            const evName = rel.description.replace("Relasi baru dari event:", "").trim();
            const matchedEv = sortedEvents.find((e) => e.name.trim() === evName);
            if (matchedEv) creationEventId = matchedEv.id;
          }

          // If the event that created this relationship has not occurred yet, hide it!
          if (creationEventId && !occurredEventIds.has(creationEventId)) {
            return false;
          }
        }

        // Base relationships (created during character setup or profile) always exist from Step 0
        return true;
      })
      .map((rel: any) => {
        let activeLabel = rel.label;
        let foundChange = false;

        // Helper to check if event relationship change matches this relationship
        const matchesChange = (r: any) =>
          r.relationshipId === rel.id ||
          r.relationship?.id === rel.id ||
          (r.sourceEntityId === rel.sourceEntityId && r.targetEntityId === rel.targetEntityId) ||
          (r.sourceEntityId === rel.targetEntityId && r.targetEntityId === rel.sourceEntityId);

        // 1. Scan occurred events in reverse chronological order for latest relationship label change
        for (let i = occurredEvents.length - 1; i >= 0; i--) {
          const ev = occurredEvents[i];
          if (Array.isArray(ev.relationshipChanges)) {
            const rc = ev.relationshipChanges.find(matchesChange);
            if (rc && rc.afterLabel) {
              activeLabel = rc.afterLabel;
              foundChange = true;
              break;
            }
          }
        }

        // 2. If no change has occurred yet in timeline mode, inspect future events for initial beforeLabel!
        if (!foundChange) {
          const futureEvents = sortedEvents.slice(timelineStepIndex);
          for (let i = 0; i < futureEvents.length; i++) {
            const ev = futureEvents[i];
            if (Array.isArray(ev.relationshipChanges)) {
              const rc = ev.relationshipChanges.find(matchesChange);
              if (rc && rc.beforeLabel) {
                activeLabel = rc.beforeLabel;
                break;
              }
            }
          }
        }

        return {
          ...rel,
          label: activeLabel,
        };
      });
  }, [relationships, scopedEntities, scopeToActiveBook, selectedBookId, sortedEvents, occurredEvents, occurredEventIds, isTimelineMode, timelineStepIndex]);

  // STRICT Filtered Key Entities for Dropdown "Pusat Utama"
  const dropdownKeyEntities = useMemo(() => {
    return dynamicEntities.filter((e) => {
      const isChar = e.type?.name?.toLowerCase() === "character";
      const hasTags = Array.isArray(e.tags) && e.tags.length > 0;
      const isCurrentCenter = e.id === centerFocusId;

      return (isChar && hasTags) || isCurrentCenter;
    });
  }, [dynamicEntities, centerFocusId]);

  // Live Auto-Suggest Search Results for ALL Entities
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return dynamicEntities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [dynamicEntities, searchQuery]);

  // Entities visible in graph — EXCLUDE Location type entities (they appear in Map page only)
  const graphEntities = useMemo(() => {
    return dynamicEntities.filter((e) => e.type?.name?.toLowerCase() !== "location");
  }, [dynamicEntities]);

  // Map of connected entity IDs for every entity (EXCLUDES Location type entities)
  const entityConnectionsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    graphEntities.forEach((e) => map.set(e.id, new Set()));

    dynamicRelationships.forEach((rel) => {
      if (map.has(rel.sourceEntityId) && map.has(rel.targetEntityId)) {
        map.get(rel.sourceEntityId)!.add(rel.targetEntityId);
        map.get(rel.targetEntityId)!.add(rel.sourceEntityId);
      }
    });

    return map;
  }, [graphEntities, dynamicRelationships]);

  // Map of relationship labels between any pair of entities
  const entityPairRelMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const validIds = new Set(graphEntities.map((e) => e.id));
    dynamicRelationships.forEach((r) => {
      if (validIds.has(r.sourceEntityId) && validIds.has(r.targetEntityId)) {
        const key1 = `${r.sourceEntityId}__${r.targetEntityId}`;
        const key2 = `${r.targetEntityId}__${r.sourceEntityId}`;
        if (!map.has(key1)) map.set(key1, []);
        if (!map.has(key2)) map.set(key2, []);
        map.get(key1)!.push(r.label);
        map.get(key2)!.push(r.label);
      }
    });
    return map;
  }, [graphEntities, dynamicRelationships]);

  // ── Phase 7: Compute Implicit Connections (Shared-Entity Discovery) ──
  // Only runs for nodes visible around center — prevents graph explosion
  const implicitConnections = useMemo((): ImplicitConnection[] => {
    if (!centerFocusId || !showImplicitEdges) return [];

    // We check all entities in relationships (both sides)
    // Build a map: sharedEntityId -> list of { entityId, label }
    const targetMap = new Map<string, { entityId: string; label: string }[]>();

    dynamicRelationships.forEach((rel) => {
      // rel: sourceEntity --[label]--> targetEntity
      // The "target" is the shared entity hub
      if (!targetMap.has(rel.targetEntityId)) {
        targetMap.set(rel.targetEntityId, []);
      }
      targetMap.get(rel.targetEntityId)!.push({ entityId: rel.sourceEntityId, label: rel.label });
    });

    const result: ImplicitConnection[] = [];
    const seen = new Set<string>();

    // Only look at the "visible" neighborhood (center + level-1) to avoid chaos
    const focusNeighbours = entityConnectionsMap.get(centerFocusId) || new Set<string>();
    const visibleIds = new Set([centerFocusId, ...Array.from(focusNeighbours)]);

    targetMap.forEach((connectors, sharedId) => {
      // Only care about hubs that have >=2 visible entities pointing to them
      const visibleConnectors = connectors.filter((c) => visibleIds.has(c.entityId));
      if (visibleConnectors.length < 2) return;

      // Generate all unique pairs
      for (let i = 0; i < visibleConnectors.length; i++) {
        for (let j = i + 1; j < visibleConnectors.length; j++) {
          const a = visibleConnectors[i];
          const b = visibleConnectors[j];
          if (a.entityId === b.entityId) continue;

          // Skip pairs that already have a direct explicit relationship
          const hasDirectLink =
            entityPairRelMap.has(`${a.entityId}__${b.entityId}`) ||
            entityPairRelMap.has(`${b.entityId}__${a.entityId}`);

          // BUG FIX: actually use the flag to skip implicit edges for explicitly connected pairs
          if (hasDirectLink) continue;

          const pairKey = [a.entityId, b.entityId].sort().join("__");
          if (seen.has(pairKey + sharedId)) continue;
          seen.add(pairKey + sharedId);

          const entityA = entities.find((e) => e.id === a.entityId);
          const entityB = entities.find((e) => e.id === b.entityId);
          const sharedEntity = entities.find((e) => e.id === sharedId);
          if (!entityA || !entityB || !sharedEntity) continue;

          // Skip if shared entity is Location to avoid excessive implicit edge clutter
          if (sharedEntity.type?.name?.toLowerCase() === "location") continue;

          result.push({
            entityA,
            entityB,
            sharedEntity,
            labelA: a.label,
            labelB: b.label,
          });
        }
      }
    });

    return result;
  }, [centerFocusId, dynamicRelationships, entities, entityConnectionsMap, entityPairRelMap, showImplicitEdges]);

  // ── Phase 7: Metadata Reference Discovery Algorithm ──────────────────
  // Scans every entity's metadata key-value pairs and description for entity name mentions.
  // Zero effort for the writer — purely automatic.
  const metadataRecommendations = useMemo((): MetadataRecommendation[] => {
    if (graphEntities.length === 0) return [];

    const result: MetadataRecommendation[] = [];
    const seen = new Set<string>();

    graphEntities.forEach((srcEntity) => {
      const candidates: { key: string; value: string }[] = [];

      // 1. Scan metadata JSON object
      if (srcEntity.metadata && typeof srcEntity.metadata === "object") {
        Object.entries(srcEntity.metadata as Record<string, unknown>).forEach(([key, val]) => {
          if (typeof val === "string" && val.trim().length >= 3) {
            candidates.push({ key, value: val });
          }
        });
      }

      // 2. Scan description text for entity name mentions
      if (srcEntity.description && srcEntity.description.trim().length >= 3) {
        candidates.push({ key: "description", value: srcEntity.description });
      }

      candidates.forEach(({ key, value }) => {
        // Try matching the raw value first
        const directMatch = findEntityByFuzzyName(value, graphEntities.filter((e) => e.id !== srcEntity.id));
        if (directMatch) {
          const pairKey = [srcEntity.id, directMatch.id].sort().join("__") + "__" + key;
          if (seen.has(pairKey)) return;
          seen.add(pairKey);

          const hasExplicitLink =
            entityPairRelMap.has(`${srcEntity.id}__${directMatch.id}`) ||
            entityPairRelMap.has(`${directMatch.id}__${srcEntity.id}`);

          result.push({
            id: pairKey,
            sourceEntity: srcEntity,
            targetEntity: directMatch,
            fieldKey: key,
            fieldValue: value,
            suggestedLabel: key === "description" ? "Disebutkan dalam deskripsi" : key,
            hasExplicitLink,
          });
        } else {
          // For description: scan each entity name as substring within the text
          if (key === "description") {
            graphEntities
              .filter((e) => e.id !== srcEntity.id)
              .forEach((candidate) => {
                const normCand = normalizeEntityName(candidate.name);
                if (normCand.length < 3) return;
                const normVal = normalizeEntityName(value);
                if (!normVal.includes(normCand)) return;

                const pairKey = [srcEntity.id, candidate.id].sort().join("__") + "__desc";
                if (seen.has(pairKey)) return;
                seen.add(pairKey);

                const hasExplicitLink =
                  entityPairRelMap.has(`${srcEntity.id}__${candidate.id}`) ||
                  entityPairRelMap.has(`${candidate.id}__${srcEntity.id}`);

                result.push({
                  id: pairKey,
                  sourceEntity: srcEntity,
                  targetEntity: candidate,
                  fieldKey: "description",
                  fieldValue: value,
                  suggestedLabel: "Disebutkan dalam deskripsi",
                  hasExplicitLink,
                });
              });
          }
        }
      });
    });

    return result;
  }, [graphEntities, entityPairRelMap]);

  // Separate new recs (no explicit link yet) from context enrichments (already linked)
  const newMetadataRecs = useMemo(
    () => metadataRecommendations.filter((r) => !r.hasExplicitLink && !dismissedRecIds.has(r.id)),
    [metadataRecommendations, dismissedRecIds]
  );
  const contextEnrichments = useMemo(
    () => metadataRecommendations.filter((r) => r.hasExplicitLink),
    [metadataRecommendations]
  );

  // Compute visible node IDs
  const { visibleNodeIds, level1NodeIds, level2NodeIds } = useMemo(() => {
    if (!centerFocusId) {
      return {
        visibleNodeIds: new Set<string>(),
        level1NodeIds: new Set<string>(),
        level2NodeIds: new Set<string>(),
      };
    }

    const level1 = entityConnectionsMap.get(centerFocusId) || new Set<string>();
    const level2 = new Set<string>();
    const allVisible = new Set<string>([centerFocusId, ...Array.from(level1)]);

    expandedNodeIds.forEach((expandedId) => {
      const subConns = entityConnectionsMap.get(expandedId);
      if (subConns) {
        subConns.forEach((subId) => {
          if (subId !== centerFocusId && !level1.has(subId)) {
            level2.add(subId);
            allVisible.add(subId);
          }
        });
      }
    });

    return { visibleNodeIds: allVisible, level1NodeIds: level1, level2NodeIds: level2 };
  }, [centerFocusId, expandedNodeIds, entityConnectionsMap]);

  // DYNAMIC RADIAL LAYOUT COMPUTATION WITH GENEROUS SPACING (PREVENTS OVERLAPS)
  useEffect(() => {
    if (!centerFocusId || graphEntities.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const centerX = 400;
    const centerY = 300;
    const computedPositions = new Map<string, { x: number; y: number }>();
    const userDragged = userDraggedPositionsRef.current;

    computedPositions.set(centerFocusId, userDragged.get(centerFocusId) || { x: centerX, y: centerY });

    const level1List = Array.from(level1NodeIds);
    const l1Count = level1List.length;

    // Measure maximum relationship label length to ensure plenty of clearance between cards!
    let maxL1LabelLen = 8;
    level1List.forEach((id) => {
      const labels = entityPairRelMap.get(`${centerFocusId}__${id}`) || [];
      labels.forEach((lbl) => {
        if (lbl.length > maxL1LabelLen) maxL1LabelLen = lbl.length;
      });
    });

    // Generous radial distance (minimum 420px up to 580px for long labels!)
    const radiusL1 = Math.max(420, 320 + maxL1LabelLen * 6.5);

    level1List.forEach((id, idx) => {
      if (userDragged.has(id)) {
        computedPositions.set(id, userDragged.get(id)!);
      } else {
        const angle = (idx / Math.max(1, l1Count)) * 2 * Math.PI - Math.PI / 2;
        const spreadX = centerX + radiusL1 * Math.cos(angle);
        const spreadY = centerY + radiusL1 * Math.sin(angle);
        computedPositions.set(id, { x: spreadX, y: spreadY });
      }
    });

    const level2List = Array.from(level2NodeIds);
    level2List.forEach((id, idx) => {
      if (userDragged.has(id)) {
        computedPositions.set(id, userDragged.get(id)!);
      } else {
        let parentId = Array.from(expandedNodeIds).find((expId) =>
          entityConnectionsMap.get(expId)?.has(id)
        );
        const parentPos = (parentId && computedPositions.get(parentId)) || { x: centerX, y: centerY - radiusL1 };

        const dx = parentPos.x - centerX;
        const dy = parentPos.y - centerY;
        const baseAngle = Math.atan2(dy, dx);

        const spreadOffset = (idx % 2 === 0 ? 0.45 : -0.45) * (Math.floor(idx / 2) + 1);
        const fanAngle = baseAngle + spreadOffset;

        let maxL2LabelLen = 8;
        if (parentId) {
          const labels = entityPairRelMap.get(`${parentId}__${id}`) || [];
          labels.forEach((lbl) => {
            if (lbl.length > maxL2LabelLen) maxL2LabelLen = lbl.length;
          });
        }
        const distance = Math.max(380, 290 + maxL2LabelLen * 6);

        const subX = parentPos.x + distance * Math.cos(fanAngle);
        const subY = parentPos.y + distance * Math.sin(fanAngle);
        computedPositions.set(id, { x: subX, y: subY });
      }
    });

    // Build ReactFlow Nodes (only graphEntities — Location excluded)
    const flowNodes: Node[] = (Array.from(visibleNodeIds)
      .map((id) => {
        const ent = graphEntities.find((e) => e.id === id);
        if (!ent) return null;
        const pos = computedPositions.get(id) || { x: centerX, y: centerY };

        const isCenter = id === centerFocusId;
        const isSelected = activeHighlightNodeId === id;
        const hasOtherConns = Array.from(entityConnectionsMap.get(id) || []).some(
          (subId) => subId !== centerFocusId
        );

        return {
          id,
          type: "mindMapNode",
          position: pos,
          data: {
            entity: ent,
            isCenterFocus: isCenter,
            isSelected,
            isExpanded: expandedNodeIds.has(id),
            hasSubConnections: hasOtherConns,
          },
        };
      })
      .filter(Boolean) as unknown) as Node[];

    // Build Straight Edges with SMART NEAREST SIDES & UNCLIPPED COMPACT LABELS
    const flowEdges: Edge[] = [];

    // Track 2D midpoint positions of all edge labels to prevent overlaps with 100% precision
    const placedLabelPositions: { x: number; y: number }[] = [];

    dynamicRelationships.forEach((rel) => {
      if (visibleNodeIds.has(rel.sourceEntityId) && visibleNodeIds.has(rel.targetEntityId)) {
        const sourcePos = computedPositions.get(rel.sourceEntityId) || { x: 0, y: 0 };
        const targetPos = computedPositions.get(rel.targetEntityId) || { x: 0, y: 0 };

        // Midpoint of explicit edge
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        placedLabelPositions.push({ x: midX, y: midY });

        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;

        let sourceHandle = "bottom-source";
        let targetHandle = "top-target";

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            sourceHandle = "right-source";
            targetHandle = "left-target";
          } else {
            sourceHandle = "left-source";
            targetHandle = "right-target";
          }
        } else {
          if (dy > 0) {
            sourceHandle = "bottom-source";
            targetHandle = "top-target";
          } else {
            sourceHandle = "top-source";
            targetHandle = "bottom-target";
          }
        }

        const isActiveEdge =
          activeHighlightNodeId !== null &&
          (rel.sourceEntityId === activeHighlightNodeId || rel.targetEntityId === activeHighlightNodeId);

        // Truncate label cleanly if excessively long to guarantee no clipping!
        const displayLabel =
          rel.label.length > 32 ? `${rel.label.substring(0, 30)}...` : rel.label;

        flowEdges.push({
          id: rel.id,
          source: rel.sourceEntityId,
          target: rel.targetEntityId,
          sourceHandle,
          targetHandle,
          label: displayLabel,
          type: "straight",
          animated: isActiveEdge,
          style: {
            stroke: isActiveEdge ? "var(--accent)" : "var(--border)",
            strokeWidth: isActiveEdge ? 2.5 : 1.5,
            strokeDasharray: isActiveEdge ? "6 6" : undefined,
            opacity: activeHighlightNodeId === null ? 0.85 : isActiveEdge ? 1 : 0.25,
          },
          labelStyle: {
            fill: isActiveEdge ? "var(--accent)" : "var(--text)",
            fontWeight: isActiveEdge ? 700 : 600,
            fontSize: 10,
            fontFamily: "var(--font-inter, sans-serif)",
          },
          labelBgStyle: {
            fill: "var(--surface)",
            fillOpacity: 0.98,
            rx: 8,
            ry: 8,
            stroke: isActiveEdge ? "var(--accent)" : "var(--border)",
            strokeWidth: 1.2,
          },
          labelBgPadding: [8, 5],
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 13,
            height: 13,
            color: isActiveEdge ? "var(--accent)" : "var(--border)",
          },
        });
      }
    });

    // ── Phase 7: Implicit Edges (dashed, sage, never directional arrow) ──
    if (showImplicitEdges) {
      const seenImplicit = new Set<string>();
      implicitConnections.forEach((imp, idx) => {
        const pairKey = [imp.entityA.id, imp.entityB.id].sort().join("--");
        if (seenImplicit.has(pairKey)) return;
        seenImplicit.add(pairKey);

        if (!visibleNodeIds.has(imp.entityA.id) || !visibleNodeIds.has(imp.entityB.id)) return;
        if (imp.entityA.id === imp.entityB.id) return;

        const isSelected =
          selectedImplicit !== null &&
          selectedImplicit.entityA.id === imp.entityA.id &&
          selectedImplicit.entityB.id === imp.entityB.id &&
          selectedImplicit.sharedEntity.id === imp.sharedEntity.id;

        // Calculate smart nearest side handles for implicit edges so lines don't cut across nodes
        const sourcePos = computedPositions.get(imp.entityA.id) || { x: 0, y: 0 };
        const targetPos = computedPositions.get(imp.entityB.id) || { x: 0, y: 0 };

        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;

        let sourceHandle = "bottom-source";
        let targetHandle = "top-target";

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            sourceHandle = "right-source";
            targetHandle = "left-target";
          } else {
            sourceHandle = "left-source";
            targetHandle = "right-target";
          }
        } else {
          if (dy > 0) {
            sourceHandle = "bottom-source";
            targetHandle = "top-target";
          } else {
            sourceHandle = "top-source";
            targetHandle = "bottom-target";
          }
        }

        // Exact 2D Label Collision Avoidance Algorithm
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        const collisionRadius = 55; // 55px distance threshold

        let shiftY = 0;
        let attempts = 0;
        while (
          attempts < 6 &&
          placedLabelPositions.some(
            (p) => Math.hypot(p.x - midX, p.y - (midY + shiftY)) < collisionRadius
          )
        ) {
          attempts++;
          shiftY = attempts % 2 === 1 ? -26 * Math.ceil(attempts / 2) : 26 * (attempts / 2);
        }

        placedLabelPositions.push({ x: midX, y: midY + shiftY });

        flowEdges.push({
          id: `implicit-${idx}-${imp.entityA.id}-${imp.entityB.id}-${imp.sharedEntity.id}`,
          source: imp.entityA.id,
          target: imp.entityB.id,
          sourceHandle,
          targetHandle,
          type: "straight",
          animated: false,
          label: `🔗 via ${imp.sharedEntity.name}`,
          style: {
            stroke: isSelected ? "#3B522F" : "#8A9A7B",
            strokeWidth: isSelected ? 2.5 : 1.5,
            strokeDasharray: "6 4",
            opacity: isSelected ? 1 : 0.75,
          },
          labelStyle: {
            fill: "#3B522F",
            fontWeight: 700,
            fontSize: 9,
            fontFamily: "var(--font-inter, sans-serif)",
            transform: shiftY !== 0 ? `translateY(${shiftY}px)` : undefined,
          },
          labelBgStyle: {
            fill: "var(--sage-soft)",
            fillOpacity: 0.95,
            rx: 8,
            ry: 8,
            stroke: "#8A9A7B",
            strokeWidth: 1,
            transform: shiftY !== 0 ? `translateY(${shiftY}px)` : undefined,
          },
          labelBgPadding: [6, 3],
          data: { implicit: true, connection: imp },
        });
      });
    }

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [centerFocusId, visibleNodeIds, level1NodeIds, level2NodeIds, expandedNodeIds, activeHighlightNodeId, graphEntities, dynamicRelationships, entityConnectionsMap, entityPairRelMap, implicitConnections, showImplicitEdges, selectedImplicit, timelineStepIndex, isTimelineMode]);

  // Handle Focus Change
  const changeCenterFocus = (newFocusId: string) => {
    setCenterFocusId(newFocusId);
    setActiveHighlightNodeId(newFocusId);
    setExpandedNodeIds(new Set());
    userDraggedPositionsRef.current = new Map();

    const pos = { x: 400, y: 300 };
    setCenter(pos.x + 80, pos.y + 40, { duration: 600, zoom: 1 });
  };

  // Handle Node Position Dragging (Persists dragged coordinates)
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    userDraggedPositionsRef.current.set(node.id, { x: node.position.x, y: node.position.y });
  }, []);

  // Node Click Interaction with SMOOTH AUTO-PAN CENTERING CAMERA (§8)
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setActiveHighlightNodeId(node.id);

      const pos = userDraggedPositionsRef.current.get(node.id) || node.position;
      setCenter(pos.x + 80, pos.y + 40, { duration: 600, zoom: 1 });

      if (node.id !== centerFocusId) {
        const hasSub = Array.from(entityConnectionsMap.get(node.id) || []).some(
          (subId) => subId !== centerFocusId
        );

        if (hasSub) {
          setExpandedNodeIds((prev) => {
            const next = new Set(prev);
            if (!next.has(node.id)) {
              next.add(node.id);
            }
            return next;
          });
        }
      }
    },
    [centerFocusId, entityConnectionsMap, setCenter]
  );

  // Pane Click (Reset highlight lines to OFF/MATI)
  const onPaneClick = useCallback(() => {
    setActiveHighlightNodeId(null);
    setSelectedImplicit(null);
    setSelectedRelId(null);
  }, []);

  // ── Phase 7: Edge Click ──
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: any) => {
    if (edge.data?.implicit && edge.data?.connection) {
      setSelectedImplicit(edge.data.connection as ImplicitConnection);
      setSelectedRelId(null);
      setActiveHighlightNodeId(null);
    } else if (!edge.data?.implicit) {
      // Clicked an explicit relationship edge
      setSelectedRelId(edge.id);
      setSelectedImplicit(null);
      setActiveHighlightNodeId(null);
    }
  }, []);

  // Create Relationship Submit
  const handleSaveRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relSourceId || !relTargetId || !relLabel.trim()) {
      setRelError("Pilih source entity, target entity, dan label relasi");
      return;
    }

    if (relSourceId === relTargetId) {
      setRelError("Entity tidak dapat memiliki relasi dengan dirinya sendiri");
      return;
    }

    setRelError(null);
    setRelSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceEntityId: relSourceId,
          targetEntityId: relTargetId,
          label: relLabel.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat relasi");
      }

      await fetchGraphData();
      setIsAddRelModalOpen(false);
      setRelLabel("");
    } catch (err: any) {
      console.error("Save relationship error:", err);
      setRelError(err.message || "Gagal menyimpan relasi");
    } finally {
      setRelSubmitting(false);
    }
  };

  // Delete Relationship
  const handleDeleteRelationship = async (relId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/relationships/${relId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchGraphData();
      }
    } catch (err) {
      console.error("Delete relationship error:", err);
    }
  };

  const selectedEntity = entities.find((e) => e.id === activeHighlightNodeId);

  // Relationships connected to selected entity
  const outgoingRel = relationships.filter((r) => r.sourceEntityId === activeHighlightNodeId);
  const incomingRel = relationships.filter((r) => r.targetEntityId === activeHighlightNodeId);

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

      {/* Standard Threadinary Centered Wrap Container */}
      <main className="wrap py-8">
        {/* Header Controls Bar */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[var(--text)] flex items-center gap-2 mb-1">
              <Network size={24} className="text-[var(--accent)]" />
              <span>Relationship Mind-Map</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Klik pada entitas untuk menghidupkan animasi koneksi relasinya ({entities.length} entitas · {relationships.length} relasi)
            </p>
          </div>

          {/* Central Focus Entity Selector & Auto-Suggest Search Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Search Auto-Suggest for ALL Entities */}
            <div className="relative" ref={searchContainerRef}>
              <div className="search max-w-xs py-1.5 px-3">
                <Search size={14} className="text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Cari & fokus entitas..."
                  className="text-xs"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                />
              </div>

              {/* Auto-Suggest Popup Results */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute left-0 top-10 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 max-h-56 overflow-y-auto text-xs">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-[var(--text-secondary)] border-b border-[var(--border)]">
                    Hasil Pencarian Entitas ({searchResults.length})
                  </div>
                  {searchResults.map((ent) => (
                    <div
                      key={ent.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] cursor-pointer transition-colors"
                      onClick={() => {
                        changeCenterFocus(ent.id);
                        setSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                    >
                      <span className="font-semibold text-xs truncate">{ent.name}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                        {ent.type?.name || "Entity"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STRICTLY Filtered Dropdown "Pusat Utama" (Characters WITH Tags ONLY) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] shrink-0">
                Pusat Utama:
              </label>
              <select
                className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer outline-none hover:border-[var(--accent)] transition-colors max-w-[190px] truncate"
                value={centerFocusId || ""}
                onChange={(e) => changeCenterFocus(e.target.value)}
              >
                {dropdownKeyEntities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.type?.name || "Entity"})
                  </option>
                ))}
              </select>
            </div>

            {expandedNodeIds.size > 0 && (
              <button
                type="button"
                className="btn btn-ghost text-xs py-2 px-3 flex items-center gap-1 text-[var(--accent)] border-[var(--accent-soft)]"
                onClick={() => {
                  setExpandedNodeIds(new Set());
                  setActiveHighlightNodeId(null);
                  userDraggedPositionsRef.current = new Map();
                }}
              >
                <RotateCcw size={13} />
                <span>Reset Cabang</span>
              </button>
            )}

            {/* Book Scope Switcher */}
            {books.length > 1 && (
              <button
                type="button"
                title="Ganti cakupan mind-map (Buku Aktif vs Seluruh Dunia)"
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                  scopeToActiveBook && selectedBookId !== "ALL"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)] shadow-xs"
                    : "bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]"
                }`}
                onClick={() => setScopeToActiveBook(!scopeToActiveBook)}
              >
                <BookOpen size={13} className="text-[var(--accent)]" />
                <span>
                  {scopeToActiveBook && selectedBookId !== "ALL"
                    ? `${currentActiveBookObj?.title || "Buku Aktif"}`
                    : "Seluruh Dunia"}
                </span>
              </button>
            )}

            {/* ── Phase 8.1: Time-Travel Timeline Toggle ── */}
            {events.length > 0 && (
              <button
                type="button"
                title={isTimelineMode ? "Kembali ke mode Kanon / Terkini" : "Buka simulasi garis waktu"}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                  isTimelineMode
                    ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                    : "bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
                onClick={() => {
                  const nextMode = !isTimelineMode;
                  setIsTimelineMode(nextMode);
                  if (nextMode) setTimelineStepIndex(0);
                }}
              >
                <History size={13} />
                <span>{isTimelineMode ? `Garis Waktu (Aktif)` : `Garis Waktu (${events.length})`}</span>
              </button>
            )}

            {/* ── Phase 7: Implicit Edges Toggle ── */}
            <button
              type="button"
              title={showImplicitEdges ? "Sembunyikan koneksi tersirat" : "Tampilkan koneksi tersirat"}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                showImplicitEdges
                  ? "bg-[var(--sage-soft)] text-[#3B522F] border-[#8A9A7B] shadow-xs"
                  : "bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[#8A9A7B] hover:text-[#3B522F]"
              }`}
              onClick={() => {
                setShowImplicitEdges((v) => !v);
                setSelectedImplicit(null);
              }}
            >
              <Link2 size={13} />
              <span>{showImplicitEdges ? `Koneksi Tersirat (${implicitConnections.length})` : "Koneksi Tersirat"}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
              onClick={() => {
                if (activeHighlightNodeId) {
                  setRelSourceId(activeHighlightNodeId);
                } else if (entities.length > 0) {
                  setRelSourceId(entities[0].id);
                }
                if (entities.length > 1) {
                  const other = entities.find((e) => e.id !== (activeHighlightNodeId || entities[0].id));
                  if (other) setRelTargetId(other.id);
                }
                setIsAddRelModalOpen(true);
              }}
            >
              <Plus size={14} />
              <span>Tambah Relationship</span>
            </button>

            {/* ── Phase 7: Discovery Recommendations Badge ── */}
            {newMetadataRecs.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-semibold transition-all bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse"
                onClick={() => setShowRecsPanel(true)}
              >
                <Lightbulb size={13} className="text-amber-600" />
                <span>{newMetadataRecs.length} Rekomendasi Koneksi</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Phase 8.1: Timeline Mode Active Banner ── */}
        {isTimelineMode && (
          <div className="bg-[var(--accent-soft)] border border-[var(--accent)]/30 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <History size={16} className="text-[var(--accent)] shrink-0" />
              <div>
                <div className="font-semibold text-[var(--text)]">
                  Mode Simulasi Garis Waktu Aktif ({timelineStepIndex} / {events.length} Event)
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {timelineStepIndex === 0
                    ? "Menampilkan kondisi awal mula karakter sebelum peristiwa apapun terjadi."
                    : `Menampilkan status & relasi karakter saat: "${currentTimelineEvent?.name || ""}"`}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary text-xs py-1.5 px-3"
              onClick={() => setIsTimelineMode(false)}
            >
              Kembali ke Kanon
            </button>
          </div>
        )}

        {/* Canvas & Detail Drawer Wrap */}
        <div className="relative flex items-stretch gap-6">
          {/* ReactFlow Canvas Container with Straight Lines & Smart Connectors */}
          <div
            className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden relative"
            style={{ width: "100%", height: "640px", minHeight: "640px" }}
          >
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
                Memuat Relationship Mind-Map...
              </div>
            ) : entities.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6">
                <Network size={36} className="text-[var(--accent)] opacity-60" />
                <h3 className="font-serif text-lg font-semibold text-[var(--text)]">
                  Belum ada entitas di dunia ini
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                  Tambahkan entitas dan buat relasi antar karakter untuk melihat visualisasi mind-map koneksi interaktif di sini.
                </p>
                <Link
                  href={`/project/${projectId}/entities`}
                  className="btn btn-primary text-xs px-5 mt-2"
                >
                  + Tambah Entitas Pertama
                </Link>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeDragStop={onNodeDragStop}
                onEdgeClick={onEdgeClick}
                fitView
                attributionPosition="bottom-left"
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1.5}
                  color={theme === "dark" ? "#4A4038" : "#E8DCC8"}
                />
                <Controls className="!bg-[var(--surface)] !border-[var(--border)] !shadow-md !rounded-xl overflow-hidden text-[var(--text)]" />

                {/* ── Phase 8.1: Floating Interactive Timeline Scrubber via ReactFlow Panel ── */}
                {isTimelineMode && events.length > 0 && (
                  <Panel position="bottom-center" className="!m-0 !mb-4 z-50 pointer-events-auto">
                    <div className="bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-2xl p-4 w-[92vw] max-w-lg flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping shrink-0" />
                          <span className="font-serif font-semibold text-[var(--text)] truncate">
                            {timelineStepIndex === 0
                              ? "Awal Mula (Sebelum Semua Event)"
                              : `Event ${timelineStepIndex}/${events.length}: ${currentTimelineEvent?.name || ""}`}
                          </span>
                        </div>
                        {currentTimelineEvent?.worldDate && (
                          <span className="text-[10.5px] font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded-md border border-[var(--border)] shrink-0">
                            {currentTimelineEvent.worldDate}
                          </span>
                        )}
                      </div>

                      {/* Slider Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors disabled:opacity-30 cursor-pointer"
                          disabled={timelineStepIndex <= 0}
                          onClick={() => setTimelineStepIndex(0)}
                          title="Kembali ke Awal Mula"
                        >
                          <SkipBack size={12} />
                        </button>

                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors disabled:opacity-30 cursor-pointer"
                          disabled={timelineStepIndex <= 0}
                          onClick={() => setTimelineStepIndex((i) => Math.max(0, i - 1))}
                          title="Mundur 1 Event"
                        >
                          <Rewind size={12} />
                        </button>

                        <input
                          type="range"
                          min={0}
                          max={events.length}
                          value={timelineStepIndex}
                          onChange={(e) => setTimelineStepIndex(Number(e.target.value))}
                          className="flex-1 accent-[var(--accent)] cursor-pointer h-2 bg-[var(--bg)] rounded-lg"
                        />

                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors disabled:opacity-30 cursor-pointer"
                          disabled={timelineStepIndex >= events.length}
                          onClick={() => setTimelineStepIndex((i) => Math.min(events.length, i + 1))}
                          title="Maju 1 Event"
                        >
                          <FastForward size={12} />
                        </button>

                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors disabled:opacity-30 cursor-pointer"
                          disabled={timelineStepIndex >= events.length}
                          onClick={() => setTimelineStepIndex(events.length)}
                          title="Lompat ke Kondisi Terkini"
                        >
                          <SkipForward size={12} />
                        </button>
                      </div>
                    </div>
                  </Panel>
                )}
              </ReactFlow>
            )}

            {/* ── Phase 7: Implicit Edge Legend (appears when toggle is ON) ── */}
            {showImplicitEdges && implicitConnections.length > 0 && !isTimelineMode && (
              <div className="absolute bottom-3 right-3 bg-[var(--surface)]/95 backdrop-blur-sm border border-[#8A9A7B]/40 rounded-xl px-3 py-2 text-[10px] flex items-center gap-2 shadow-sm pointer-events-none">
                <svg width="24" height="10">
                  <line x1="0" y1="5" x2="24" y2="5" stroke="#8A9A7B" strokeWidth="1.5" strokeDasharray="5 3" />
                </svg>
                <span className="text-[#3B522F] font-semibold">Koneksi Tersirat — Klik garis untuk detail</span>
              </div>
            )}
          </div>

          {/* SIDE DETAIL PANEL (SLIDE-OVER DRAWER §8) */}
          {(selectedEntity || selectedImplicit || selectedRelId) && (
            <aside
              className="w-80 md:w-96 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn shrink-0"
              style={{ height: "640px" }}
            >
              {/* ── ENTITY DETAIL PANEL ── */}
              {selectedEntity && !selectedImplicit && !selectedRelId && (
                <div className="flex flex-col gap-5 h-full">
                  {/* Panel Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        {selectedEntity.type?.name || "Generic"}
                      </span>
                      <h2 className="font-serif text-2xl font-semibold text-[var(--text)] mt-1.5">
                        {selectedEntity.name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                      onClick={() => setActiveHighlightNodeId(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Make Center Focus Button */}
                  {selectedEntity.id !== centerFocusId && (
                    <button
                      type="button"
                      className="btn btn-ghost text-xs w-full py-2 flex items-center justify-center gap-1.5 text-[var(--accent)] border-[var(--accent)]"
                      onClick={() => changeCenterFocus(selectedEntity.id)}
                    >
                      <span>Jadikan Pusat Mind-Map</span>
                    </button>
                  )}

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-serif">
                      Deskripsi
                    </h4>
                    <p className="text-xs text-[var(--text)] leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] whitespace-pre-line">
                      {selectedEntity.description || "Belum ada deskripsi."}
                    </p>
                  </div>

                  {/* Connected Relationships List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2 font-serif">
                      Koneksi Langsung ({outgoingRel.length + incomingRel.length})
                    </h4>
                    <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                      {outgoingRel.map((rel) => (
                        <div key={rel.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-[var(--accent)]">{rel.label}</span>
                            <span className="text-[var(--text-secondary)]">→</span>
                            <span className="font-semibold text-[var(--text)] hover:underline cursor-pointer truncate"
                              onClick={() => {
                                setActiveHighlightNodeId(rel.targetEntityId);
                                const pos = userDraggedPositionsRef.current.get(rel.targetEntityId);
                                if (pos) setCenter(pos.x + 80, pos.y + 40, { duration: 600, zoom: 1 });
                              }}
                            >{rel.target?.name || "Target"}</span>
                          </div>
                          <button type="button" className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1" onClick={() => handleDeleteRelationship(rel.id)} title="Hapus relasi">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      {incomingRel.map((rel) => (
                        <div key={rel.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold text-[var(--text)] hover:underline cursor-pointer truncate"
                              onClick={() => {
                                setActiveHighlightNodeId(rel.sourceEntityId);
                                const pos = userDraggedPositionsRef.current.get(rel.sourceEntityId);
                                if (pos) setCenter(pos.x + 80, pos.y + 40, { duration: 600, zoom: 1 });
                              }}
                            >{rel.source?.name || "Source"}</span>
                            <span className="text-[var(--text-secondary)]">→</span>
                            <span className="font-bold text-[var(--sage)]">{rel.label}</span>
                          </div>
                          <button type="button" className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1" onClick={() => handleDeleteRelationship(rel.id)} title="Hapus relasi">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      {outgoingRel.length === 0 && incomingRel.length === 0 && (
                        <p className="text-xs text-[var(--text-secondary)] italic">Belum ada koneksi relasi untuk entitas ini.</p>
                      )}
                    </div>
                  </div>

                  {/* Panel Footer Actions */}
                  <div className="pt-4 border-t border-[var(--border)] flex flex-col gap-2 mt-auto">
                    <Link
                      href={`/project/${projectId}/entities/${selectedEntity.id}`}
                      className="btn btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <span>Buka Profil Penuh</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── Phase 7: IMPLICIT CONNECTION DETAIL PANEL ── */}
              {selectedImplicit && (
                <div className="flex flex-col gap-4 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--sage-soft)] text-[#3B522F]">
                        🔗 Koneksi Tersirat
                      </span>
                      <h2 className="font-serif text-lg font-semibold text-[var(--text)] mt-1.5 leading-snug">
                        {selectedImplicit.entityA.name} &amp; {selectedImplicit.entityB.name}
                      </h2>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        Tidak ada relasi langsung — tetapi keduanya terhubung ke entitas yang sama.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)] shrink-0"
                      onClick={() => setSelectedImplicit(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Shared Entity Hub */}
                  <div className="bg-[var(--sage-soft)]/40 border border-[#8A9A7B]/30 rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#3B522F]">Terhubung Melalui</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--sage-soft)] text-[#3B522F] flex items-center justify-center font-bold text-sm shrink-0 border border-[#8A9A7B]/40">
                        {selectedImplicit.sharedEntity.name[0]}
                      </div>
                      <div>
                        <p className="font-serif font-bold text-sm text-[var(--text)]">{selectedImplicit.sharedEntity.name}</p>
                        <p className="text-[9px] text-[var(--text-secondary)] font-medium">{selectedImplicit.sharedEntity.type?.name || "Entitas"}</p>
                      </div>
                    </div>

                    {/* Two paths shown clearly */}
                    <div className="flex flex-col gap-1.5 mt-1 text-xs">
                      <div className="flex items-center gap-1.5 bg-[var(--surface)] rounded-xl px-3 py-2 border border-[var(--border)]">
                        <span className="font-semibold text-[var(--text)] truncate">{selectedImplicit.entityA.name}</span>
                        <span className="text-[#8A9A7B] font-bold shrink-0">─ {selectedImplicit.labelA} →</span>
                        <span className="font-bold text-[#3B522F] truncate">{selectedImplicit.sharedEntity.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[var(--surface)] rounded-xl px-3 py-2 border border-[var(--border)]">
                        <span className="font-semibold text-[var(--text)] truncate">{selectedImplicit.entityB.name}</span>
                        <span className="text-[#8A9A7B] font-bold shrink-0">─ {selectedImplicit.labelB} →</span>
                        <span className="font-bold text-[#3B522F] truncate">{selectedImplicit.sharedEntity.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Insight hint */}
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed px-1">
                    Apakah koneksi tersirat ini bermakna dalam cerita kamu? Kalau iya, jadikan relasi langsung untuk mencatat hubungan itu secara resmi.
                  </p>

                  {/* Actions */}
                  <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-[var(--border)]">
                    <button
                      type="button"
                      className="btn btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setRelSourceId(selectedImplicit.entityA.id);
                        setRelTargetId(selectedImplicit.entityB.id);
                        setRelLabel("");
                        setSelectedImplicit(null);
                        setIsAddRelModalOpen(true);
                      }}
                    >
                      <Plus size={13} />
                      <span>Resmikan Relasi Langsung</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost text-xs w-full py-2 text-[var(--text-secondary)]"
                      onClick={() => setSelectedImplicit(null)}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}

              {/* ── EXPLICIT EDGE DETAIL PANEL ── */}
              {selectedRelId && !selectedImplicit && (() => {
                const rel = relationships.find((r) => r.id === selectedRelId);
                if (!rel) return null;
                const srcEnt = entities.find((e) => e.id === rel.sourceEntityId);
                const tgtEnt = entities.find((e) => e.id === rel.targetEntityId);
                const pairContext = contextEnrichments.filter(
                  (r) =>
                    (r.sourceEntity.id === rel.sourceEntityId && r.targetEntity.id === rel.targetEntityId) ||
                    (r.sourceEntity.id === rel.targetEntityId && r.targetEntity.id === rel.sourceEntityId)
                );
                return (
                  <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">Relasi</span>
                        <h2 className="font-serif text-base font-semibold text-[var(--text)] mt-1.5 leading-snug">
                          {srcEnt?.name} → {tgtEnt?.name}
                        </h2>
                      </div>
                      <button type="button" className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg)]" onClick={() => setSelectedRelId(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div className="bg-[var(--bg)] rounded-2xl p-4 flex flex-col gap-1 border border-[var(--border)]">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Label Relasi</p>
                      <p className="font-serif font-bold text-xl text-[var(--accent)]">{rel.label}</p>
                      {rel.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{rel.description}</p>
                      )}
                    </div>

                    {pairContext.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">💡 Konteks dari Detail Entitas</p>
                        <div className="flex flex-col gap-2">
                          {pairContext.map((ctx) => (
                            <div key={ctx.id} className="bg-white rounded-xl px-3 py-2 border border-amber-100 text-xs">
                              <p className="font-semibold text-amber-700 mb-0.5">{ctx.sourceEntity.name} • {ctx.fieldKey}</p>
                              <p className="text-[var(--text)] line-clamp-3 leading-relaxed">{ctx.fieldValue}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-amber-600">Ditemukan otomatis dari metadata &amp; deskripsi yang kamu tulis.</p>
                      </div>
                    )}

                    <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-[var(--border)]">
                      {srcEnt && (
                        <button type="button" className="btn btn-ghost text-xs w-full py-2" onClick={() => { setActiveHighlightNodeId(srcEnt.id); setSelectedRelId(null); }}>
                          Lihat profil {srcEnt.name}
                        </button>
                      )}
                      <button type="button" className="text-xs text-[var(--text-secondary)] hover:text-[var(--rose)] flex items-center justify-center gap-1 py-1" onClick={() => { handleDeleteRelationship(rel.id); setSelectedRelId(null); }}>
                        <Trash2 size={12} /> Hapus Relasi Ini
                      </button>
                    </div>
                  </div>
                );
              })()}
            </aside>
          )}
        </div>
      </main>

      {/* ── Phase 7: RECOMMENDATIONS PANEL (Overlay Modal) ── */}
      {showRecsPanel && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowRecsPanel(false); }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", width: "100%", maxHeight: "80vh" }}
          >
            <div className="modal-header">
              <h2 className="flex items-center gap-2">
                <span>💡</span>
                <span>Rekomendasi Koneksi ({newMetadataRecs.length})</span>
              </h2>
              <button type="button" className="modal-close" onClick={() => setShowRecsPanel(false)}>✕</button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Sistem mendeteksi koneksi potensial berdasarkan detail yang kamu tulis di profil entitas.
              Kamu bebas memilih: hubungkan sekarang dengan 1 klik, atau abaikan saja.
            </p>

            {newMetadataRecs.length === 0 && (
              <p className="text-xs text-[var(--text-secondary)] italic text-center py-6">Semua rekomendasi sudah ditangani.</p>
            )}

            <div className="flex flex-col gap-3">
              {newMetadataRecs.map((rec) => (
                <div key={rec.id} className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap text-xs mb-1">
                        <span className="font-bold text-[var(--text)]">{rec.sourceEntity.name}</span>
                        <span className="text-[var(--text-secondary)]">menyebutkan</span>
                        <span className="font-bold text-[var(--accent)]">{rec.targetEntity.name}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Atribut: <span className="font-semibold">{rec.fieldKey}</span>
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 italic">
                        “{rec.fieldValue.length > 80 ? rec.fieldValue.slice(0, 80) + "..." : rec.fieldValue}”
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-primary text-xs flex-1 py-2 flex items-center justify-center gap-1"
                      onClick={() => {
                        setRelSourceId(rec.sourceEntity.id);
                        setRelTargetId(rec.targetEntity.id);
                        setRelLabel(rec.suggestedLabel);
                        setShowRecsPanel(false);
                        setIsAddRelModalOpen(true);
                      }}
                    >
                      <Plus size={12} />
                      Hubungkan Sekarang
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost text-xs px-3 py-2 text-[var(--text-secondary)]"
                      onClick={() => setDismissedRecIds((prev) => new Set([...Array.from(prev), rec.id]))}
                    >
                      Abaikan
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-[var(--border)]">
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setShowRecsPanel(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH RELATIONSHIP DARI GRAPH */}
      {isAddRelModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddRelModalOpen(false);
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", width: "100%" }}
          >
            <div className="modal-header">
              <h2>Tambah Relationship Baru</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsAddRelModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {relError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2.5 rounded-xl text-xs font-medium mb-3">
                {relError}
              </div>
            )}

            <form onSubmit={handleSaveRelationship} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label>Source Entity *</label>
                  <SmartEntityPickerWithFilters
                    entities={entities}
                    entityTypes={entityTypes}
                    selectedEntityId={relSourceId}
                    onSelectEntity={(id) => setRelSourceId(id)}
                    placeholder="Cari Source Entity..."
                  />
                </div>

                <div className="form-group">
                  <label>Target Entity *</label>
                  <SmartEntityPickerWithFilters
                    entities={entities}
                    entityTypes={entityTypes}
                    selectedEntityId={relTargetId}
                    onSelectEntity={(id) => setRelTargetId(id)}
                    placeholder="Cari Target Entity..."
                    excludeEntityId={relSourceId}
                  />
                </div>
              </div>

              {/* Quick Chip Labels */}
              <div className="form-group">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Pilih Cepat Label Relasi
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {QUICK_CHIP_LABELS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                        relLabel === chip
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)]"
                      }`}
                      onClick={() => setRelLabel(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Atau Ketik Label Custom Bebas *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder='Misal: "Adik Perempuan", "Mentor", "Musuh"...'
                  value={relLabel}
                  onChange={(e) => setRelLabel(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsAddRelModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={relSubmitting}
                >
                  {relSubmitting ? "Menyimpan..." : "Simpan Relationship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function RelationshipGraphClient(props: RelationshipGraphClientProps) {
  return (
    <ReactFlowProvider>
      <GraphFlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
