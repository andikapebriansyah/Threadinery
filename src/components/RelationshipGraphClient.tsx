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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ThreadinaryLogo } from "./ThreadinaryLogo";
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

      {/* Type Badge Row with Distinct High-Contrast Theme Colors */}
      <div className="flex items-center gap-1.5 mb-1.5 pl-1 overflow-hidden">
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
  user,
  initialFocus,
}: {
  projectId: string;
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

  // ReactFlow Nodes & Edges State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchGraphData();

    const handleOutsideSearchClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideSearchClick);
    return () => document.removeEventListener("mousedown", handleOutsideSearchClick);
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
      const [entitiesRes, relsRes, typesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/relationships`),
        fetch(`/api/projects/${projectId}/entity-types`),
      ]);

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

  // STRICT Filtered Key Entities for Dropdown "Pusat Utama"
  const dropdownKeyEntities = useMemo(() => {
    return entities.filter((e) => {
      const isChar = e.type?.name?.toLowerCase() === "character";
      const hasTags = Array.isArray(e.tags) && e.tags.length > 0;
      const isCurrentCenter = e.id === centerFocusId;

      return (isChar && hasTags) || isCurrentCenter;
    });
  }, [entities, centerFocusId]);

  // Live Auto-Suggest Search Results for ALL Entities
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [entities, searchQuery]);

  // Map of connected entity IDs for every entity
  const entityConnectionsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    entities.forEach((e) => map.set(e.id, new Set()));

    relationships.forEach((rel) => {
      if (map.has(rel.sourceEntityId)) {
        map.get(rel.sourceEntityId)!.add(rel.targetEntityId);
      }
      if (map.has(rel.targetEntityId)) {
        map.get(rel.targetEntityId)!.add(rel.sourceEntityId);
      }
    });

    return map;
  }, [entities, relationships]);

  // Map of relationship labels between any pair of entities
  const entityPairRelMap = useMemo(() => {
    const map = new Map<string, string[]>();
    relationships.forEach((r) => {
      const key1 = `${r.sourceEntityId}__${r.targetEntityId}`;
      const key2 = `${r.targetEntityId}__${r.sourceEntityId}`;
      if (!map.has(key1)) map.set(key1, []);
      if (!map.has(key2)) map.set(key2, []);
      map.get(key1)!.push(r.label);
      map.get(key2)!.push(r.label);
    });
    return map;
  }, [relationships]);

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
    if (!centerFocusId || entities.length === 0) {
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

    // Build ReactFlow Nodes
    const flowNodes: Node[] = Array.from(visibleNodeIds).map((id) => {
      const ent = entities.find((e) => e.id === id);
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
          entity: ent || { id, name: "Entitas", typeId: "" },
          isCenterFocus: isCenter,
          isSelected,
          isExpanded: expandedNodeIds.has(id),
          hasSubConnections: hasOtherConns,
        },
      };
    });

    // Build Straight Edges with SMART NEAREST SIDES & UNCLIPPED COMPACT LABELS
    const flowEdges: Edge[] = [];

    relationships.forEach((rel) => {
      if (visibleNodeIds.has(rel.sourceEntityId) && visibleNodeIds.has(rel.targetEntityId)) {
        const sourcePos = computedPositions.get(rel.sourceEntityId) || { x: 0, y: 0 };
        const targetPos = computedPositions.get(rel.targetEntityId) || { x: 0, y: 0 };

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

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [centerFocusId, visibleNodeIds, level1NodeIds, level2NodeIds, expandedNodeIds, activeHighlightNodeId, entities, relationships, entityConnectionsMap, entityPairRelMap]);

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
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
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
              <Plus size={15} />
              <span>Tambah Relationship</span>
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
          </div>
        </div>

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
              </ReactFlow>
            )}
          </div>

          {/* SIDE DETAIL PANEL (SLIDE-OVER DRAWER §8) */}
          {selectedEntity && (
            <aside
              className="w-80 md:w-96 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn shrink-0"
              style={{ height: "640px" }}
            >
              <div className="flex flex-col gap-5">
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2 font-serif flex items-center justify-between">
                    <span>Koneksi Langsung ({outgoingRel.length + incomingRel.length})</span>
                  </h4>

                  <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                    {outgoingRel.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-[var(--accent)]">{rel.label}</span>
                          <span className="text-[var(--text-secondary)]">→</span>
                          <span
                            className="font-semibold text-[var(--text)] hover:underline cursor-pointer truncate"
                            onClick={() => {
                              setActiveHighlightNodeId(rel.targetEntityId);
                              const pos = userDraggedPositionsRef.current.get(rel.targetEntityId);
                              if (pos) setCenter(pos.x + 80, pos.y + 40, { duration: 600, zoom: 1 });
                            }}
                          >
                            {rel.target?.name || "Target"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1"
                          onClick={() => handleDeleteRelationship(rel.id)}
                          title="Hapus relasi"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {incomingRel.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="font-semibold text-[var(--text)] hover:underline cursor-pointer truncate"
                            onClick={() => {
                              setActiveHighlightNodeId(rel.sourceEntityId);
                              const pos = userDraggedPositionsRef.current.get(rel.sourceEntityId);
                              if (pos) setCenter(pos.x + 80, pos.y + 40, { duration: 600, zoom: 1 });
                            }}
                          >
                            {rel.source?.name || "Source"}
                          </span>
                          <span className="text-[var(--text-secondary)]">→</span>
                          <span className="font-bold text-[var(--sage)]">{rel.label}</span>
                        </div>
                        <button
                          type="button"
                          className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1"
                          onClick={() => handleDeleteRelationship(rel.id)}
                          title="Hapus relasi"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {outgoingRel.length === 0 && incomingRel.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] italic">
                        Belum ada koneksi relasi untuk entitas ini.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel Footer Actions */}
              <div className="pt-4 border-t border-[var(--border)] flex flex-col gap-2 mt-4">
                <Link
                  href={`/project/${projectId}/entities/${selectedEntity.id}`}
                  className="btn btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5"
                >
                  <span>Buka Profil Penuh</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </aside>
          )}
        </div>
      </main>

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
