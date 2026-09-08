"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { ProjectNavbar } from "./ProjectNavbar";
import { CreateEntityModal } from "./CreateEntityModal";
import { EditEntityModal } from "./EditEntityModal";
import { SmartEntityPickerWithFilters } from "./SmartEntityPickerWithFilters";
import { compressImageToWebP } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Compass,
  X,
  RefreshCw,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ChevronRight,
  User,
  Building,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Users,
  Tag,
  Search,
} from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
}

interface EntitySimple {
  id: string;
  projectId: string;
  name: string;
  typeId: string;
  type?: EntityTypeItem;
  description?: string | null;
  status?: string | null;
  tags?: string[];
  metadata?: Record<string, any> | null;
  imageUrl?: string | null;
}

interface RelationshipSimple {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  label: string;
  description?: string | null;
  source: EntitySimple;
  target: EntitySimple;
}

interface EntityLocationData {
  entityId: string;
  mapId: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  entity?: EntitySimple;
}

interface MapData {
  id: string;
  projectId: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  locations: EntityLocationData[];
}

interface MapClientProps {
  projectId: string;
  projectName: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  initialFocus?: string;
}

const SAMPLE_MAP_TEMPLATES = [
  {
    name: "Peta Benua Fantasi Kuno",
    url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Peta Pesisir & Kepulauan",
    url: "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Peta Wilayah Kerajaan Parchment",
    url: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=1200&auto=format&fit=crop",
  },
];

const LOCATION_QUICK_CHIP_LABELS = [
  "Berada di sini",
  "Tinggal di sini",
  "Lahir di sini",
  "Markas",
  "Beroperasi di sini",
  "Ditemukan di sini",
  "Pernah ke sini",
];

export function MapClient({
  projectId,
  projectName,
  user,
  initialFocus,
}: MapClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entities, setEntities] = useState<EntitySimple[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);
  const [relationships, setRelationships] = useState<RelationshipSimple[]>([]);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);

  // Selected marker / entity for side drawer detail
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Pin placement state when clicking map image
  const [pinPlacementCoords, setPinPlacementCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedLocationEntityId, setSelectedLocationEntityId] = useState<string>("");

  // ── PAN & ZOOM CANVAS ENGINE STATES (Minimum Zoom locked at 1.0x / 100%) ──
  const [zoom, setZoom] = useState<number>(1.0); // Minimum 1.0x, Maximum 4.0x
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState<boolean>(false);
  const [isMapImageLoaded, setIsMapImageLoaded] = useState<boolean>(false);

  // ── LAYER VISIBILITY TOGGLES ──
  const [showLocationLabels, setShowLocationLabels] = useState<boolean>(true);
  const [showCharacters, setShowCharacters] = useState<boolean>(true);

  // Create Map Modal State
  const [isCreateMapModalOpen, setIsCreateMapModalOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [newMapUrl, setNewMapUrl] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [newMapDimensions, setNewMapDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [creatingMap, setCreatingMap] = useState(false);
  const [mapUploadError, setMapUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Map Modal State
  const [isDeleteMapModalOpen, setIsDeleteMapModalOpen] = useState(false);
  const [isDeletingMap, setIsDeletingMap] = useState(false);

  // Full Create Entity Modal (locked to Location type)
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [pendingPinCoordsOnCreate, setPendingPinCoordsOnCreate] = useState<{ x: number; y: number } | null>(null);

  // Edit Entity Modal
  const [isEditEntityModalOpen, setIsEditEntityModalOpen] = useState(false);

  // Drawer State & Roster Search
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");
  const [isAddRelModalOpen, setIsAddRelModalOpen] = useState(false);
  const [relLabel, setRelLabel] = useState("Berada di sini");
  const [selectedTargetEntityIds, setSelectedTargetEntityIds] = useState<string[]>([]);
  const [relSubmitting, setRelSubmitting] = useState(false);
  const [relError, setRelError] = useState<string | null>(null);

  // Active book state
  const [activeBookId, setActiveBookId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`threadinery_active_book_${projectId}`) || "ALL";
    }
    return "ALL";
  });

  const mapViewportRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");
    fetchData();

    const handleBookChange = (e: any) => {
      const bId = e.detail?.bookId || "ALL";
      setActiveBookId(bId);
    };
    window.addEventListener("threadinery:book_change", handleBookChange);
    return () => {
      window.removeEventListener("threadinery:book_change", handleBookChange);
    };
  }, [projectId]);

  // ── ATTACH NON-PASSIVE WHEEL LISTENER (STOPS ENTIRE PAGE ZOOMING ON TRACKPAD / WHEEL) ──
  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Prevent browser default window zoom!
      e.preventDefault();

      const zoomDelta = e.ctrlKey ? -e.deltaY * 0.015 : e.deltaY < 0 ? 0.18 : -0.18;
      setZoom((prev) => {
        const next = Math.min(Math.max(Number((prev + zoomDelta).toFixed(2)), 1.0), 4.0);
        if (next === 1.0) {
          setPan({ x: 0, y: 0 }); // Auto-center when zoom is 100%
        }
        return next;
      });
    };

    viewport.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleNativeWheel);
    };
  }, [activeMapId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [entRes, typeRes, relRes, mapsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/entity-types`),
        fetch(`/api/projects/${projectId}/relationships`),
        fetch(`/api/projects/${projectId}/maps`),
      ]);

      if (entRes.ok) setEntities(await entRes.json());
      if (typeRes.ok) setEntityTypes(await typeRes.json());
      if (relRes.ok) setRelationships(await relRes.json());

      if (mapsRes.ok) {
        const mapsData: MapData[] = await mapsRes.json();
        setMaps(mapsData);

        // If initialFocus is provided, find if any map contains this entity
        if (initialFocus) {
          setSelectedEntityId(initialFocus);
          const containingMap = mapsData.find((m) =>
            m.locations?.some((loc) => loc.entityId === initialFocus)
          );
          if (containingMap) {
            setActiveMapId(containingMap.id);
          } else if (mapsData.length > 0) {
            setActiveMapId(mapsData[0].id);
          }
        } else if (mapsData.length > 0) {
          setActiveMapId(mapsData[0].id);
        }
      }
    } catch (err: any) {
      console.error("Fetch map data error:", err);
      setError("Gagal memuat data peta & lokasi");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Location entity type object
  const locType = useMemo(() => {
    return entityTypes.find((t) => t.name.toLowerCase() === "location");
  }, [entityTypes]);

  // Location entities list
  const locationEntities = useMemo(() => {
    return locType
      ? entities.filter((e) => e.typeId === locType.id)
      : entities.filter((e) => e.tags?.some((t) => t.toLowerCase().includes("lokasi") || t.toLowerCase().includes("place")));
  }, [entities, locType]);

  // Active Map object
  const activeMap = useMemo(() => {
    return maps.find((m) => m.id === activeMapId) || null;
  }, [maps, activeMapId]);

  // Map of characters/entities connected per location ID (Memoized for high performance)
  const locationEntitiesMap = useMemo(() => {
    const map: Record<string, Array<{ entity: EntitySimple; label: string; relId: string }>> = {};
    locationEntities.forEach((loc) => {
      const incoming = relationships
        .filter((r) => r.targetEntityId === loc.id)
        .map((r) => ({ entity: r.source, label: r.label, relId: r.id }));
      const outgoing = relationships
        .filter((r) => r.sourceEntityId === loc.id)
        .map((r) => ({ entity: r.target, label: r.label, relId: r.id }));
      map[loc.id] = [...incoming, ...outgoing].filter((x) => x.entity);
    });
    return map;
  }, [locationEntities, relationships]);

  // Inter-location relationships for lines on pseudo-map
  const locationRelationships = useMemo(() => {
    const locIds = new Set(locationEntities.map((e) => e.id));
    return relationships.filter(
      (r) => locIds.has(r.sourceEntityId) && locIds.has(r.targetEntityId)
    );
  }, [locationEntities, relationships]);

  // Selected Entity full object
  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  // Entities located in the selected location
  const entitiesInSelectedLocation = useMemo(() => {
    if (!selectedEntityId) return [];
    return locationEntitiesMap[selectedEntityId] || [];
  }, [selectedEntityId, locationEntitiesMap]);

  // ── PAN CLAMPING HELPER (PREVENTS MAP FROM FLYING OUT OF FRAME) ──
  const getClampedPan = (targetPan: { x: number; y: number }, targetZoom: number) => {
    if (targetZoom <= 1.0 || !mapViewportRef.current || !mapContentRef.current) {
      return { x: 0, y: 0 };
    }

    const viewport = mapViewportRef.current.getBoundingClientRect();
    const content = mapContentRef.current.getBoundingClientRect();

    const baseWidth = content.width / zoom;
    const baseHeight = content.height / zoom;

    const scaledWidth = baseWidth * targetZoom;
    const scaledHeight = baseHeight * targetZoom;

    const maxPanX = Math.max(0, (scaledWidth - viewport.width) / 2 + 150);
    const maxPanY = Math.max(0, (scaledHeight - viewport.height) / 2 + 150);

    return {
      x: Math.min(Math.max(targetPan.x, -maxPanX), maxPanX),
      y: Math.min(Math.max(targetPan.y, -maxPanY), maxPanY),
    };
  };

  // ── PAN & DRAG HANDLERS ──────────────────────────────────────────
  const handleMouseDownPan = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left mouse only
    setIsPanning(true);
    setHasMovedDuringDrag(false);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMovePan = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = Math.abs(e.clientX - (panStart.x + pan.x));
    const dy = Math.abs(e.clientY - (panStart.y + pan.y));
    if (dx > 4 || dy > 4) {
      setHasMovedDuringDrag(true);
    }
    const rawPan = {
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    };
    setPan(getClampedPan(rawPan, zoom));
  };

  const handleMouseUpPan = () => {
    setIsPanning(false);
  };

  const resetPanZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const adjustZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.min(Math.max(Number((prev + delta).toFixed(2)), 1.0), 4.0);
      if (next === 1.0) {
        setPan({ x: 0, y: 0 });
      } else {
        setPan((currentPan) => getClampedPan(currentPan, next));
      }
      return next;
    });
  };

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle single click to drop a Pin Marker (debounced to avoid false trigger on double click)
  const handleMapCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMovedDuringDrag || !activeMap || !mapContentRef.current) return;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    const rect = mapContentRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    clickTimerRef.current = setTimeout(() => {
      if (percentX >= 0 && percentX <= 100 && percentY >= 0 && percentY <= 100) {
        setPinPlacementCoords({ x: Number(percentX.toFixed(2)), y: Number(percentY.toFixed(2)) });
      }
      clickTimerRef.current = null;
    }, 220);
  };

  // Handle DOUBLE-CLICK to Zoom into clicked point (100% exact mathematical center alignment + pan clamping)
  const handleMapCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Cancel single click pin placement immediately
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setPinPlacementCoords(null);

    if (!mapViewportRef.current || !activeMap) return;

    const viewportRect = mapViewportRef.current.getBoundingClientRect();
    const viewportCenterX = viewportRect.width / 2;
    const viewportCenterY = viewportRect.height / 2;

    const clickRelX = e.clientX - viewportRect.left;
    const clickRelY = e.clientY - viewportRect.top;

    // Target zoom: Jump to 2.5x from 1.0x, or step up by 1.0x
    const nextZoom = Math.min(Math.max(Number((zoom < 1.8 ? 2.5 : zoom + 1.0).toFixed(2)), 1.0), 4.0);

    // Distance from the current viewport center to the clicked point
    const dxFromCenter = clickRelX - viewportCenterX - pan.x;
    const dyFromCenter = clickRelY - viewportCenterY - pan.y;

    // Exact new pan to bring the clicked point 100% precisely to the center of the viewport
    const rawPanX = -((dxFromCenter / zoom) * nextZoom);
    const rawPanY = -((dyFromCenter / zoom) * nextZoom);

    setZoom(nextZoom);
    setPan(getClampedPan({ x: rawPanX, y: rawPanY }, nextZoom));
  };

  // Save new Pin Marker to Map
  const handleSavePinMarker = async (targetId?: string) => {
    const finalEntityId = targetId || selectedLocationEntityId;
    if (!activeMap || !pinPlacementCoords || !finalEntityId) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/maps/${activeMap.id}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: finalEntityId,
          x: pinPlacementCoords.x,
          y: pinPlacementCoords.y,
        }),
      });

      if (res.ok) {
        const savedLoc = await res.json();
        setMaps((prevMaps) =>
          prevMaps.map((m) => {
            if (m.id !== activeMap.id) return m;
            const existingIdx = m.locations.findIndex((l) => l.entityId === savedLoc.entityId);
            const newLocs = [...m.locations];
            if (existingIdx >= 0) {
              newLocs[existingIdx] = savedLoc;
            } else {
              newLocs.push(savedLoc);
            }
            return { ...m, locations: newLocs };
          })
        );
        setSelectedEntityId(finalEntityId);
        setPinPlacementCoords(null);
        setSelectedLocationEntityId("");
      }
    } catch (err) {
      console.error("Save pin error:", err);
    }
  };

  // Delete Pin Marker from active Map
  const handleDeletePinMarker = async (entityId: string) => {
    if (!activeMap) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/maps/${activeMap.id}/locations?entityId=${entityId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setMaps((prevMaps) =>
          prevMaps.map((m) => {
            if (m.id !== activeMap.id) return m;
            return {
              ...m,
              locations: m.locations.filter((l) => l.entityId !== entityId),
            };
          })
        );
      }
    } catch (err) {
      console.error("Delete pin error:", err);
    }
  };

  // Delete Relationship
  const handleDeleteRelationship = async (e: React.MouseEvent, relId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `/api/projects/${projectId}/relationships/${relId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setRelationships((prev) => prev.filter((r) => r.id !== relId));
      }
    } catch (err) {
      console.error("Delete relationship error:", err);
    }
  };

  // Save new Relationships to Location (Supports Batch Multi-Select Placement!)
  const handleSaveRelationshipToLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId || selectedTargetEntityIds.length === 0 || !relLabel.trim()) {
      setRelError("Pilih minimal 1 entitas dan tentukan status/label");
      return;
    }
    setRelSubmitting(true);
    setRelError(null);

    try {
      const createdRels = await Promise.all(
        selectedTargetEntityIds.map(async (targetId) => {
          const res = await fetch(`/api/projects/${projectId}/relationships`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceEntityId: targetId,
              targetEntityId: selectedEntityId,
              label: relLabel.trim(),
            }),
          });
          if (res.ok) return await res.json();
          return null;
        })
      );

      const validRels = createdRels.filter((r) => r && r.id);
      setRelationships((prev) => [...prev, ...validRels]);
      setIsAddRelModalOpen(false);
      setSelectedTargetEntityIds([]);
      setRelLabel("Berada di sini");
    } catch (err: any) {
      setRelError(err.message || "Gagal menghubungkan entitas");
    } finally {
      setRelSubmitting(false);
    }
  };

  // Handle Local Image File Upload with AUTOMATIC WEBP COMPRESSION
  const handleImageFileChange = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    setMapUploadError(null);
    setIsCompressingImage(true);

    if (!newMapName.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setNewMapName(cleanName);
    }

    try {
      const { file: optimizedFile, width, height } = await compressImageToWebP(file, 2560, 0.88);
      setSelectedImageFile(optimizedFile);
      setNewMapDimensions({ width, height });

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setNewMapUrl(event.target.result as string);
      };
      reader.readAsDataURL(optimizedFile);
    } catch (err) {
      console.warn("Compression fallback to original:", err);
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setNewMapUrl(event.target.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingImage(false);
    }
  };

  // Create new Map Record with Supabase Storage upload
  const handleCreateMap = async () => {
    if (!newMapName.trim() || !newMapUrl.trim()) return;
    setCreatingMap(true);
    setMapUploadError(null);

    try {
      let finalImageUrl = newMapUrl.trim();

      if (selectedImageFile) {
        const formData = new FormData();
        formData.append("file", selectedImageFile);
        formData.append("folder", "maps");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Gagal mengunggah file ke Supabase Storage Bucket");
        }

        finalImageUrl = uploadData.url;
      }

      const res = await fetch(`/api/projects/${projectId}/maps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMapName.trim(),
          imageUrl: finalImageUrl,
          width: newMapDimensions.width,
          height: newMapDimensions.height,
        }),
      });

      if (!res.ok) {
        const mapResData = await res.json();
        throw new Error(mapResData.error || "Gagal menyimpan peta ke database");
      }

      const createdMap: MapData = await res.json();
      setMaps((prev) => [...prev, createdMap]);
      setActiveMapId(createdMap.id);
      setIsCreateMapModalOpen(false);
      setNewMapName("");
      setNewMapUrl("");
      setSelectedImageFile(null);
      setNewMapDimensions({ width: 1200, height: 800 });
    } catch (err: any) {
      console.error("Create map error:", err);
      setMapUploadError(err.message || "Gagal menyimpan peta");
    } finally {
      setCreatingMap(false);
    }
  };

  // Delete Entire Map Record (with automatic Supabase Storage file cleanup)
  const handleDeleteMap = async () => {
    if (!activeMap) return;
    setIsDeletingMap(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/maps?mapId=${activeMap.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const remainingMaps = maps.filter((m) => m.id !== activeMap.id);
        setMaps(remainingMaps);
        setActiveMapId(remainingMaps.length > 0 ? remainingMaps[0].id : null);
        setIsDeleteMapModalOpen(false);
      }
    } catch (err) {
      console.error("Delete map error:", err);
    } finally {
      setIsDeletingMap(false);
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

  // Semantic Zoom LOD Levels
  const isLOD1 = zoom < 1.4; // Macro Overview
  const isLOD2 = zoom >= 1.4 && zoom < 2.3; // Regional
  const isLOD3 = zoom >= 2.3; // Deep Zoom (Orbiting Satellites)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Unified Project Navbar */}
      <ProjectNavbar projectId={projectId} projectName={projectName} user={user} />

      {/* Main Container */}
      <main className="wrap py-8">
        {/* Header Controls Bar */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[var(--text)] flex items-center gap-2.5 mb-1">
              <Compass size={26} className="text-[var(--accent)]" />
              <span>Peta & Geografi Dunia</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Visualisasikan letak spasial lokasi, benua, kota, & penanda wilayah cerita Anda dengan Semantic Zoom interaktif.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {maps.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer outline-none hover:border-[var(--accent)] transition-colors"
                  value={activeMapId || ""}
                  onChange={(e) => {
                    setActiveMapId(e.target.value || null);
                    setIsMapImageLoaded(false);
                    resetPanZoom();
                  }}
                >
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>
                      🗺️ {m.name} ({m.locations.length} Marker)
                    </option>
                  ))}
                </select>

                {activeMap && (
                  <button
                    type="button"
                    className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--rose)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors flex items-center gap-1 text-xs"
                    onClick={() => setIsDeleteMapModalOpen(true)}
                    title={`Hapus peta "${activeMap.name}" dan file gambarnya dari storage`}
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Hapus Peta</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
              onClick={() => {
                setPendingPinCoordsOnCreate(null);
                setIsCreateLocationModalOpen(true);
              }}
            >
              <Plus size={14} />
              <span>Buat Lokasi Baru</span>
            </button>

            <button
              type="button"
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              onClick={() => setIsCreateMapModalOpen(true)}
            >
              <Upload size={14} />
              <span>Upload Peta Gambar Baru</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-16 text-center text-xs text-[var(--text-secondary)] flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-[var(--accent)]" />
            <span>Memuat peta & lokasi wilayah...</span>
          </div>
        ) : error ? (
          <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] p-6 rounded-2xl text-xs font-medium">
            {error}
          </div>
        ) : activeMap ? (
          /* ── MODE A: CUSTOM UPLOADED MAP IMAGE (WITH NATURAL ASPECT RATIO & PAN-ZOOM) ────── */
          <div className="flex flex-col gap-4">
            {/* Top Interactive Banner with Live LOD Info & Layer Toggles */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-[var(--text)] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span>
                  {isLOD3 ? (
                    <span className="text-[var(--accent)] font-bold">
                      🔍 Level 3: Mode Satelit Karakter (Orbit Entitas Aktif)
                    </span>
                  ) : isLOD2 ? (
                    <span className="text-[var(--sage)] font-bold">
                      🗺️ Level 2: Mode Wilayah Regional (Pin & Nama Kota)
                    </span>
                  ) : (
                    <span>🔭 Level 1: Mode Makro Benua (Tampilan Geografi Keseluruhan)</span>
                  )}
                </span>
              </div>

              {/* View Toggles & Zoom Level Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Toggle: Show Location Labels */}
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${showLocationLabels
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]"
                    : "bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text)]"
                    }`}
                  onClick={() => setShowLocationLabels(!showLocationLabels)}
                  title="Tampilkan / sembunyikan teks label nama lokasi"
                >
                  <Tag size={13} />
                  <span>Nama Lokasi: {showLocationLabels ? "ON" : "OFF"}</span>
                </button>

                {/* Toggle: Show Orbiting Characters */}
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${showCharacters
                    ? "bg-[var(--sage-soft)] text-[var(--sage)] border-[var(--sage)]"
                    : "bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text)]"
                    }`}
                  onClick={() => setShowCharacters(!showCharacters)}
                  title="Tampilkan / sembunyikan karakter satelit yang mengorbit di lokasi"
                >
                  <Users size={13} />
                  <span>Karakter Satelit: {showCharacters ? "ON" : "OFF"}</span>
                </button>

                <div className="h-4 w-[1px] bg-[var(--border)] hidden sm:block" />

                {/* Zoom Level Indicator */}
                <span className="bg-[var(--bg)] px-2.5 py-1 rounded-xl border border-[var(--border)] font-mono font-bold text-[var(--accent)] text-xs">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>

            {/* ── PAN-ZOOM INTERACTIVE VIEWPORT (NATURAL BOUNDS, ZERO CROPPING) ── */}
            <div
              ref={mapViewportRef}
              className="relative bg-[var(--surface)] border-2 border-[var(--border)] rounded-3xl overflow-hidden shadow-lg select-none min-h-[500px] max-h-[82vh] cursor-grab active:cursor-grabbing flex items-center justify-center"
              onMouseDown={handleMouseDownPan}
              onMouseMove={handleMouseMovePan}
              onMouseUp={handleMouseUpPan}
              onMouseLeave={handleMouseUpPan}
            >
              {/* Floating Canvas Zoom Controls */}
              <div className="absolute right-4 bottom-4 z-30 flex flex-col gap-1.5 bg-[var(--surface)]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[var(--border)] shadow-xl">
                <button
                  type="button"
                  className="p-2 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] rounded-xl transition-colors text-[var(--text)]"
                  onClick={() => adjustZoom(0.25)}
                  title="Perbesar Peta (Zoom In)"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] rounded-xl transition-colors text-[var(--text)]"
                  onClick={() => adjustZoom(-0.25)}
                  title="Perkecil Peta (Zoom Out)"
                >
                  <ZoomOut size={18} />
                </button>
                <div className="h-[1px] bg-[var(--border)] my-0.5" />
                <button
                  type="button"
                  className="p-2 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] rounded-xl transition-colors text-[var(--text)]"
                  onClick={resetPanZoom}
                  title="Reset Tampilan (100% Fit)"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Map Canvas Content with Dynamic 2D Transform & Smooth Transition */}
              <div
                ref={mapContentRef}
                className="relative max-w-full max-h-full origin-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isPanning ? "none" : "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onClick={handleMapCanvasClick}
                onDoubleClick={handleMapCanvasDoubleClick}
              >
                {!isMapImageLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)] text-xs text-[var(--text-secondary)] gap-2 z-10">
                    <RefreshCw size={28} className="animate-spin text-[var(--accent)]" />
                    <span>Memuat grafis peta resolusi tinggi...</span>
                  </div>
                )}

                {/* 100% UNCROPPED IMAGE CONTAINER */}
                <img
                  src={activeMap.imageUrl}
                  alt={activeMap.name}
                  className={`w-auto h-auto max-w-full max-h-[80vh] object-contain block mx-auto pointer-events-none transition-opacity duration-300 ${isMapImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  onLoad={() => setIsMapImageLoaded(true)}
                />

                {/* ── SEMANTIC ZOOM LOCATION PIN MARKERS (CLEAN & SCALE-FREE) ── */}
                {activeMap.locations.map((loc) => {
                  const isSelected = selectedEntityId === loc.entityId;
                  const locCharacters = locationEntitiesMap[loc.entityId] || [];
                  const count = locCharacters.length;

                  // Edge-aware positioning for labels & hover cards
                  const isNearTop = loc.y < 22;
                  const isNearBottom = loc.y > 78;
                  const isNearRight = loc.x > 75;
                  const isNearLeft = loc.x < 25;

                  return (
                    <div
                      key={loc.entityId}
                      className="absolute -translate-x-1/2 -translate-y-full z-20 group pointer-events-auto cursor-pointer"
                      style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntityId((prev) => (prev === loc.entityId ? null : loc.entityId));
                      }}
                    >
                      {/* 📍 PIN MARKER (POINTY TIP ANCHORED EXACTLY ON COORDINATE) */}
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`p-1.5 rounded-full border-2 border-white shadow-xl transition-all flex items-center justify-center ${isSelected
                            ? "bg-[var(--accent)] text-white ring-4 ring-orange-400 scale-125"
                            : "bg-[var(--accent)] text-white group-hover:scale-115"
                            }`}
                        >
                          <MapPin size={13} strokeWidth={2.5} />
                        </div>

                        {/* 🏷️ LOCATION BADGE + COMPACT AVATAR STACK */}
                        {showLocationLabels && (
                          <div
                            className={`absolute ${isNearTop ? "top-full mt-1" : "bottom-full mb-1"
                              } bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] group-hover:border-[var(--accent)] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap transition-colors z-20`}
                          >
                            <span className="font-serif font-bold text-[10px] text-[var(--text)]">
                              {loc.entity?.name || "Lokasi"}
                            </span>

                            {/* Stacked Mini Avatar Cluster */}
                            {showCharacters && count > 0 && (
                              <div className="flex items-center -space-x-1 pl-0.5 border-l border-[var(--border)]">
                                {locCharacters.slice(0, 3).map(({ entity: charEnt }, idx) => (
                                  <div
                                    key={idx}
                                    className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[7.5px] border border-[var(--surface)] shadow-xs"
                                    title={charEnt.name}
                                  >
                                    {charEnt.name[0]}
                                  </div>
                                ))}
                                {count > 3 && (
                                  <span className="text-[7.5px] font-extrabold text-[var(--accent)] bg-[var(--accent-soft)] px-1 rounded-full border border-[var(--surface)]">
                                    +{count - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 🔍 HOVER QUICK-PREVIEW POPOVER (EDGE-CLAMPED, NEVER OVERFLOWS) */}
                        <div
                          className={`absolute ${isNearTop ? "top-full mt-7" : "bottom-full mb-7"
                            } ${isNearRight ? "right-0" : isNearLeft ? "left-0" : "left-1/2 -translate-x-1/2"
                            } opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 bg-[var(--surface)] border border-[var(--accent)] rounded-2xl shadow-2xl p-3 z-50 min-w-[200px] max-w-[250px] flex flex-col gap-2`}
                          style={{ backdropFilter: "blur(8px)", backgroundColor: "var(--surface)" }}
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
                            <span className="font-serif font-bold text-xs text-[var(--accent)] flex items-center gap-1">
                              <MapPin size={12} />
                              <span>{loc.entity?.name}</span>
                            </span>
                            <span className="text-[9px] font-bold text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.2 rounded-md">
                              {count} Entitas
                            </span>
                          </div>

                          {count > 0 ? (
                            <div className="flex flex-col gap-1">
                              {locCharacters.slice(0, 4).map(({ entity: charEnt, label }, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-[8px] flex items-center justify-center shrink-0">
                                      {charEnt.name[0]}
                                    </div>
                                    <span className="font-semibold text-[var(--text)] truncate">{charEnt.name}</span>
                                  </div>
                                  <span className="text-[8.5px] text-[var(--text-secondary)] italic shrink-0 ml-1">
                                    {label || "Berada di sini"}
                                  </span>
                                </div>
                              ))}
                              {count > 4 && (
                                <div className="text-[8.5px] text-[var(--accent)] font-bold text-center pt-0.5">
                                  + {count - 4} karakter lainnya (Klik pin untuk lihat semua)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-[var(--text-secondary)] italic">
                              Belum ada karakter yang bertempat di sini.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* TEMPORARY PIN PLACEMENT INDICATOR */}
                {pinPlacementCoords && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-full z-40 animate-bounce pointer-events-none"
                    style={{ left: `${pinPlacementCoords.x}%`, top: `${pinPlacementCoords.y}%` }}
                  >
                    <div className="p-1.5 rounded-full bg-[var(--accent)] text-white shadow-xl ring-2 ring-orange-400">
                      <MapPin size={16} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── PIN PLACEMENT MODAL OVERLAY (INSTANT POPUP, NO SCROLLING NEEDED) ── */}
            {pinPlacementCoords && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(3px)" }}
                onClick={() => setPinPlacementCoords(null)}
              >
                <div
                  className="bg-[var(--surface)] border-2 border-[var(--accent)] rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                    <span className="font-serif font-bold text-base text-[var(--accent)] flex items-center gap-2">
                      <MapPin size={18} />
                      <span>Pasang Pin Lokasi di Titik Ini</span>
                    </span>
                    <button
                      type="button"
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"
                      onClick={() => setPinPlacementCoords(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">
                    Koordinat yang dipilih: <strong className="text-[var(--text)] font-mono">X: {pinPlacementCoords.x}%, Y: {pinPlacementCoords.y}%</strong>
                  </p>

                  <div className="flex flex-col gap-3">
                    {/* Option A: Pick Existing Location */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-[var(--text)]">
                        1. Pilih dari Entitas Lokasi yang Sudah Ada:
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold rounded-xl px-3 py-2.5 outline-none hover:border-[var(--accent)] transition-colors"
                          value={selectedLocationEntityId}
                          onChange={(e) => setSelectedLocationEntityId(e.target.value)}
                        >
                          <option value="">-- Pilih Lokasi --</option>
                          {locationEntities.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              📍 {loc.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={!selectedLocationEntityId}
                          className="btn btn-primary text-xs px-5 py-2.5 disabled:opacity-40 whitespace-nowrap"
                          onClick={() => handleSavePinMarker()}
                        >
                          Simpan Pin
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-[1px] bg-[var(--border)]" />
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">ATAU</span>
                      <div className="flex-1 h-[1px] bg-[var(--border)]" />
                    </div>

                    {/* Option B: Create New Location Instantly on this Pin Coordinate */}
                    <button
                      type="button"
                      className="btn btn-secondary text-xs px-4 py-3 flex items-center justify-center gap-2 w-full border-dashed border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] font-bold transition-all"
                      onClick={() => {
                        setPendingPinCoordsOnCreate(pinPlacementCoords);
                        setIsCreateLocationModalOpen(true);
                      }}
                    >
                      <Plus size={15} />
                      <span>+ Buat Entitas Lokasi Baru di Titik Ini</span>
                    </button>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      className="btn btn-secondary text-xs px-4 py-1.5"
                      onClick={() => setPinPlacementCoords(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── MODE B: PSEUDO-MAP / WORLD REALM CANVAS (KETIKA BELUM ADA GAMBAR PETA) ── */
          <div className="flex flex-col gap-6">
            {/* Header Banner for Pseudo-Map */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-bold shrink-0 mt-0.5">
                <Compass size={18} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[var(--text)]">
                  Pseudo-Map: Kanvas Kartografi Konseptual
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Belum ada gambar peta yang diunggah. Entitas lokasi ditampilkan sebagai node konseptual.
                  Klik <strong className="text-[var(--accent)]">Upload Peta Gambar Baru</strong> di atas untuk beralih ke mode peta spasial interaktif.
                </p>
              </div>
            </div>

            {/* PSEUDO-MAP CARTOGRAPHY PARCHMENT CANVAS */}
            <div className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-inner relative min-h-[550px] overflow-hidden">
              {/* Parchment Compass Background Pattern */}
              <div className="absolute right-8 bottom-8 opacity-10 pointer-events-none text-[var(--accent)]">
                <Compass size={220} />
              </div>

              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border)] text-xs text-[var(--text-secondary)] relative z-10">
                <span className="font-serif font-bold text-[var(--accent)] text-sm flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>Jaringan Wilayah & Geografi Konseptual ({locationEntities.length} Lokasi)</span>
                </span>
                <button
                  type="button"
                  className="btn btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shrink-0"
                  onClick={() => setIsCreateLocationModalOpen(true)}
                >
                  <Plus size={13} />
                  <span>Lokasi Baru</span>
                </button>
              </div>

              {locationEntities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
                  {locationEntities.map((loc) => {
                    const isSelected = selectedEntityId === loc.id;
                    const connectedRels = locationRelationships.filter(
                      (r) => r.sourceEntityId === loc.id || r.targetEntityId === loc.id
                    );

                    return (
                      <div
                        key={loc.id}
                        role="button"
                        tabIndex={0}
                        className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 cursor-pointer flex flex-col gap-3 group relative ${isSelected
                          ? "border-2 border-[var(--accent)] bg-[var(--accent-soft)] shadow-lg scale-105"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-md"
                          }`}
                        onClick={() => setSelectedEntityId((prev) => (prev === loc.id ? null : loc.id))}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full border border-[var(--accent)] border-opacity-20 flex items-center gap-1">
                            <MapPin size={10} />
                            <span>Lokasi</span>
                          </span>
                          {loc.tags && loc.tags.length > 0 && (
                            <span className="text-[9.5px] font-semibold text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.5 rounded">
                              #{loc.tags[0]}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-serif font-bold text-base text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                            📍 {loc.name}
                          </h4>
                          {loc.description && (
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                              {loc.description}
                            </p>
                          )}
                        </div>

                        {connectedRels.length > 0 && (
                          <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--accent)] font-semibold flex items-center gap-1">
                            <Layers size={11} />
                            <span>{connectedRels.length} Koneksi Geografis</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 relative z-10">
                  <MapPin size={40} className="text-[var(--accent)] opacity-40" />
                  <h3 className="font-serif text-lg font-bold text-[var(--text)]">
                    Belum Ada Entitas Lokasi
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                    Buat lokasi pertama dengan form lengkap tanpa perlu pindah ke halaman Entities.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary text-xs px-5 mt-2 flex items-center gap-1.5"
                    onClick={() => setIsCreateLocationModalOpen(true)}
                  >
                    <Plus size={13} /> Buat Lokasi Baru
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL POPOVER FOR SELECTED LOCATION ENTITY DETAIL (RIGHT DRAWER) ── */}
      {selectedEntity && (
        <div
          className="fixed inset-0 z-50 flex justify-end animate-fadeIn"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setSelectedEntityId(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--surface)] h-full p-6 shadow-2xl overflow-y-auto flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="text-xs font-serif font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} /> Ringkasan Lokasi Spasial
              </span>
              <button
                type="button"
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"
                onClick={() => setSelectedEntityId(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Entity Name & Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[var(--text)]">
                  📍 {selectedEntity.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Tipe: {selectedEntity.type?.name || "Location"}
                  </span>
                  {selectedEntity.status && (
                    <span className="text-[10px] bg-[var(--accent-soft)] text-[var(--accent)] px-2 py-0.5 rounded-full font-semibold">
                      {selectedEntity.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Entity Quick Action Button */}
              <button
                type="button"
                className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 shrink-0"
                onClick={() => setIsEditEntityModalOpen(true)}
                title="Edit entitas lokasi ini secara langsung"
              >
                <Edit size={13} />
                <span>Edit</span>
              </button>
            </div>

            {/* Description */}
            {selectedEntity.description && (
              <div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-1">Deskripsi Wilayah:</h4>
                <p className="text-xs text-[var(--text)] leading-relaxed bg-[var(--bg)] p-4 rounded-2xl border border-[var(--border)] whitespace-pre-line">
                  {selectedEntity.description}
                </p>
              </div>
            )}

            {/* Metadata / Attributes Section */}
            {selectedEntity.metadata && Object.keys(selectedEntity.metadata).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                  <Building size={13} className="text-[var(--accent)]" />
                  <span>Detail Desain Lokasi:</span>
                </h4>
                <div className="bg-[var(--bg)] p-3.5 rounded-2xl border border-[var(--border)] flex flex-col gap-2">
                  {Object.entries(selectedEntity.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-xs pb-1.5 border-b border-[var(--border)] last:border-none last:pb-0">
                      <span className="font-semibold text-[var(--text-secondary)] font-serif">{k}:</span>
                      <span className="font-medium text-[var(--text)] text-right">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ENTITAS YANG BERADA DI SINI (SEARCHABLE ROSTER IN MAP DRAWER) ── */}
            <div className="bg-[var(--bg)] p-4 rounded-2xl border border-[var(--border)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--sage)] flex items-center gap-1.5 font-serif uppercase tracking-wider">
                  <User size={13} />
                  <span>Entitas di Lokasi Ini ({entitiesInSelectedLocation.length})</span>
                </h4>
                <button
                  type="button"
                  className="btn btn-primary text-[10.5px] px-2.5 py-1 flex items-center gap-1"
                  onClick={() => {
                    setRelLabel("Berada di sini");
                    setSelectedTargetEntityIds([]);
                    setRelError(null);
                    setIsAddRelModalOpen(true);
                  }}
                >
                  <Plus size={11} />
                  <span> Tempatkan Entitas</span>
                </button>
              </div>

              {/* Roster Search Bar if there are multiple entities */}
              {entitiesInSelectedLocation.length > 2 && (
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    className="form-input text-xs w-full pl-7 pr-3 py-1 bg-[var(--surface)] border-[var(--border)] rounded-xl"
                    placeholder={`   Cari dari ${entitiesInSelectedLocation.length} entitas...`}
                    value={rosterSearchQuery}
                    onChange={(e) => setRosterSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {entitiesInSelectedLocation.length === 0 ? (
                <p className="text-[11px] text-[var(--text-secondary)] italic py-2">
                  Belum ada karakter atau organisasi yang bertempat di lokasi ini. Klik <strong>+ Tempatkan Entitas</strong> untuk menautkan!
                </p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-0.5">
                  {entitiesInSelectedLocation
                    .filter(({ entity: ent }) =>
                      !rosterSearchQuery.trim() ||
                      (ent && ent.name.toLowerCase().includes(rosterSearchQuery.toLowerCase()))
                    )
                    .map(({ entity: ent, label, relId }) => {
                      if (!ent) return null;
                      return (
                        <div
                          key={relId}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs transition-all cursor-pointer group"
                          onClick={() => router.push(`/project/${projectId}/entities/${ent.id}`)}
                          title={`Klik untuk lihat profil penuh ${ent.name}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-serif font-bold text-[10px] shrink-0">
                              {ent.name[0]}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] block truncate transition-colors">
                                {ent.name}
                              </span>
                              {ent.type && (
                                <span className="text-[9px] text-[var(--text-secondary)] font-medium">
                                  {ent.type.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {label && (
                              <span className="text-[9px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md">
                                {label}
                              </span>
                            )}
                            <button
                              type="button"
                              className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRelationship(e, relId);
                              }}
                              title="Hapus dari lokasi ini"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Pin Marker Delete (if pinned to active image map) */}
            {activeMap && activeMap.locations.some((l) => l.entityId === selectedEntity.id) && (
              <div>
                <button
                  type="button"
                  className="btn btn-secondary text-xs w-full text-rose-600 border-rose-300 hover:bg-rose-50 flex items-center justify-center gap-1.5"
                  onClick={() => handleDeletePinMarker(selectedEntity.id)}
                >
                  <Trash2 size={13} />
                  <span>Hapus Pin Marker dari Peta Ini</span>
                </button>
              </div>
            )}

            {/* Full Profile Link */}
            <div className="mt-auto pt-4 border-t border-[var(--border)]">
              <Link
                href={`/project/${projectId}/entities/${selectedEntity.id}`}
                className="btn btn-primary text-xs w-full text-center flex items-center justify-center gap-1.5"
              >
                <span>Buka Profil Penuh Entitas</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LOCATION MODAL (EXACT SAME RICH FORM FROM ENTITIES, LOCKED TO LOCATION TYPE) */}
      {isCreateLocationModalOpen && (
        <CreateEntityModal
          projectId={projectId}
          isOpen={isCreateLocationModalOpen}
          onClose={() => {
            setIsCreateLocationModalOpen(false);
            setPendingPinCoordsOnCreate(null);
          }}
          onSuccess={async (created) => {
            setEntities((prev) => [...prev, created]);
            // If triggered from Pin Placement, automatically pin this newly created location!
            if (pendingPinCoordsOnCreate && activeMap) {
              try {
                const res = await fetch(`/api/projects/${projectId}/maps/${activeMap.id}/locations`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    entityId: created.id,
                    x: pendingPinCoordsOnCreate.x,
                    y: pendingPinCoordsOnCreate.y,
                  }),
                });
                if (res.ok) {
                  const savedLoc = await res.json();
                  setMaps((prevMaps) =>
                    prevMaps.map((m) => {
                      if (m.id !== activeMap.id) return m;
                      return { ...m, locations: [...m.locations, savedLoc] };
                    })
                  );
                  setSelectedEntityId(created.id);
                  setPinPlacementCoords(null);
                }
              } catch (err) {
                console.error("Auto-pin newly created location error:", err);
              }
            }
            setPendingPinCoordsOnCreate(null);
            fetchData();
          }}
          entityTypes={entityTypes}
          defaultTypeId={locType?.id}
          lockType={true}
        />
      )}

      {/* EDIT ENTITY MODAL (DIRECT FROM MAP) */}
      {isEditEntityModalOpen && selectedEntity && (
        <EditEntityModal
          projectId={projectId}
          entity={selectedEntity as any}
          isOpen={isEditEntityModalOpen}
          onClose={() => setIsEditEntityModalOpen(false)}
          onSuccess={(updated) => {
            setEntities((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
            fetchData();
          }}
          entityTypes={entityTypes}
        />
      )}

      {/* ADD RELATIONSHIP TO LOCATION MODAL DIRECT FROM MAP */}
      {isAddRelModalOpen && selectedEntity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(2px)" }}
          onClick={() => setIsAddRelModalOpen(false)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-serif font-bold text-base text-[var(--text)] flex items-center gap-2">
                <MapPin size={18} className="text-[var(--accent)]" />
                <span>Tempatkan Entitas di {selectedEntity.name}</span>
              </h3>
              <button
                type="button"
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"
                onClick={() => setIsAddRelModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {relError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2 rounded-xl text-xs font-medium">
                {relError}
              </div>
            )}

            <form onSubmit={handleSaveRelationshipToLocation} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                  <span>Pilih Entitas (Bisa Pilih Banyak Sekaligus) *</span>
                  {selectedTargetEntityIds.length > 0 && (
                    <span className="text-[11px] font-bold text-[var(--accent)]">
                      {selectedTargetEntityIds.length} Terpilih
                    </span>
                  )}
                </label>

                {/* Selected Entities Pill Tags */}
                {selectedTargetEntityIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl max-h-24 overflow-y-auto">
                    {selectedTargetEntityIds.map((id) => {
                      const ent = entities.find((e) => e.id === id);
                      if (!ent) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 bg-[var(--surface)] text-[var(--accent)] border border-[var(--accent)] px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        >
                          <span>{ent.name}</span>
                          <button
                            type="button"
                            className="hover:text-[var(--rose)]"
                            onClick={() =>
                              setSelectedTargetEntityIds((prev) => prev.filter((x) => x !== id))
                            }
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <SmartEntityPickerWithFilters
                  entities={entities}
                  entityTypes={entityTypes}
                  isMulti={true}
                  selectedEntityIds={selectedTargetEntityIds}
                  onToggleEntity={(id) =>
                    setSelectedTargetEntityIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    )
                  }
                  placeholder="Ketik nama untuk mencari & memilih banyak karakter..."
                  excludeEntityId={selectedEntity.id}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">
                  Pilih Cepat Status / Hubungan:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATION_QUICK_CHIP_LABELS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${relLabel === chip
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

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
                  Atau Ketik Label Custom:
                </label>
                <input
                  type="text"
                  className="form-input text-xs w-full"
                  placeholder='Misal: "Tinggal di sini", "Markas", "Tertahan"...'
                  value={relLabel}
                  onChange={(e) => setRelLabel(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-secondary text-xs px-4"
                  onClick={() => setIsAddRelModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedTargetEntityIds.length === 0 || !relLabel.trim() || relSubmitting}
                  className="btn btn-primary text-xs px-5 disabled:opacity-40"
                >
                  {relSubmitting
                    ? "Menempatkan..."
                    : selectedTargetEntityIds.length > 1
                      ? `Tempatkan (${selectedTargetEntityIds.length}) Entitas Sekaligus`
                      : "Tempatkan di Lokasi Ini"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW MAP MODAL WITH DIRECT FILE UPLOAD */}
      {isCreateMapModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(2px)" }}
          onClick={() => setIsCreateMapModalOpen(false)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-serif font-bold text-lg text-[var(--text)] flex items-center gap-2">
                <Upload size={20} className="text-[var(--accent)]" />
                <span>Upload Gambar Peta Baru</span>
              </h3>
              <button
                type="button"
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"
                onClick={() => setIsCreateMapModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {mapUploadError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2.5 rounded-xl text-xs font-medium">
                {mapUploadError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Direct File Dropzone */}
              <div>
                <label className="text-xs font-bold text-[var(--text)] mb-1.5 block">
                  1. Pilih File Gambar Peta dari Komputer *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileChange(file);
                  }}
                />

                <div
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${isDraggingFile
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : newMapUrl
                      ? "border-[var(--sage)] bg-[var(--sage-soft)]"
                      : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--surface)]"
                    }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFileChange(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isCompressingImage ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <RefreshCw size={24} className="animate-spin text-[var(--accent)]" />
                      <p className="text-xs font-semibold text-[var(--accent)]">
                        Mengompresi & mengoptimasi gambar ke WebP...
                      </p>
                    </div>
                  ) : newMapUrl ? (
                    <div className="w-full flex flex-col items-center gap-2.5">
                      <div className="relative w-full max-h-48 rounded-xl overflow-hidden border border-[var(--border)] shadow-sm bg-black/10">
                        <img
                          src={newMapUrl}
                          alt="Preview Peta"
                          className="w-full h-auto max-h-48 object-contain mx-auto"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[var(--text-secondary)] hover:underline">
                        Klik untuk mengganti file gambar
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                        <Upload size={22} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-[var(--text)]">
                          Klik untuk Memilih Gambar atau Tarik (Drag & Drop) File ke Sini
                        </p>
                        <p className="text-[10.5px] text-[var(--text-secondary)] mt-0.5">
                          Mendukung PNG, JPG, JPEG, WebP, SVG
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Nama Peta */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
                  2. Nama Peta / Wilayah *
                </label>
                <input
                  type="text"
                  className="form-input text-xs w-full"
                  placeholder="Misal: Peta Benua Elveria, Peta Kota Sefaria..."
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  required
                />
              </div>

              {/* URL Input (Optional alternative) */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">
                  Atau Masukkan URL Gambar Web:
                </label>
                <input
                  type="text"
                  className="form-input text-xs w-full"
                  placeholder="https://images.unsplash.com/..."
                  value={newMapUrl.startsWith("data:") ? "" : newMapUrl}
                  onChange={(e) => {
                    setNewMapUrl(e.target.value);
                  }}
                />
              </div>

              {/* Sample Preset Templates */}
              <div>
                <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 block">
                  Atau Pilih Template Gambar Fantasi Cepat:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_MAP_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="border border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-2 text-left bg-[var(--bg)] text-[10px] font-semibold text-[var(--text)] hover:scale-105 transition-all truncate"
                      onClick={() => {
                        if (!newMapName) setNewMapName(tmpl.name);
                        setNewMapUrl(tmpl.url);
                      }}
                    >
                      🗺️ {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                className="btn btn-secondary text-xs px-4"
                onClick={() => setIsCreateMapModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!newMapName.trim() || !newMapUrl.trim() || creatingMap}
                className="btn btn-primary text-xs px-6 disabled:opacity-40"
                onClick={handleCreateMap}
              >
                {creatingMap ? "Menyimpan Peta..." : "Simpan & Tampilkan Peta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MAP CONFIRMATION MODAL */}
      {isDeleteMapModalOpen && activeMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(2px)" }}
          onClick={() => setIsDeleteMapModalOpen(false)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-serif font-bold text-base text-[var(--rose)] flex items-center gap-2">
                <Trash2 size={18} />
                <span>Hapus Peta "{activeMap.name}"?</span>
              </h3>
              <button
                type="button"
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"
                onClick={() => setIsDeleteMapModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[var(--text-secondary)] leading-relaxed">
              <p className="text-sm text-[var(--text)] font-medium">
                Apakah Anda yakin ingin menghapus peta gambar <strong>"{activeMap.name}"</strong>?
              </p>
              <p className="bg-[var(--rose-soft)] p-3 rounded-xl border border-[var(--rose)] text-[var(--rose)] text-[11px]">
                ⚠️ Seluruh penempatan pin pada peta ini serta file gambar aslinya di Supabase Storage Bucket akan dibersihkan. Entitas lokasi Anda tetap aman dalam mode Pseudo-Map.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                className="btn btn-secondary text-xs px-4"
                onClick={() => setIsDeleteMapModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingMap}
                className="btn text-xs px-5 text-white bg-[var(--rose)] hover:bg-opacity-90 disabled:opacity-40"
                onClick={handleDeleteMap}
              >
                {isDeletingMap ? "Menghapus..." : "Ya, Hapus Peta & File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
