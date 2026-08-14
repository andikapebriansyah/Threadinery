"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles, Heart, ShieldAlert, KeyRound, Network } from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface SimpleEntity {
  id: string;
  name: string;
  typeId: string;
}

interface CreateEntityModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdEntity: any) => void;
  entityTypes: EntityTypeItem[];
}

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
];

const DEFAULT_STATUS_OPTIONS = [
  "Aktif / Hidup",
  "Meninggal / Almarhum",
  "Hilang / Tidak Diketahui",
  "Rusak / Hancur",
];

export function CreateEntityModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  entityTypes,
}: CreateEntityModalProps) {
  // Required Base Fields (§7.3)
  const [name, setName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Progressive Disclosure Toggles (§7.3)
  const [showSuggestedDetails, setShowSuggestedDetails] = useState(false);
  const [showCustomProps, setShowCustomProps] = useState(false);
  const [showInitialRel, setShowInitialRel] = useState(false);

  // Type-specific Design Fields (§7.4)
  const [details, setDetails] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");

  // Custom Atribut & Catatan Khusus
  const [customProps, setCustomProps] = useState<Array<{ id: string; key: string; value: string }>>([]);

  // Initial Relationship Selection
  const [existingEntities, setExistingEntities] = useState<SimpleEntity[]>([]);
  const [relTargetEntityId, setRelTargetEntityId] = useState("");
  const [relLabel, setRelLabel] = useState("");

  // New Custom Type Creation
  const [isCreatingCustomType, setIsCreatingCustomType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(entityTypes[0].id);
    }
  }, [entityTypes, selectedTypeId]);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/projects/${projectId}/entities`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setExistingEntities(data);
        })
        .catch((err) => console.warn("Fetch existing entities error:", err));
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const currentTypeObj = entityTypes.find((t) => t.id === selectedTypeId);
  const typeNameLower = currentTypeObj?.name.toLowerCase() || "";

  // Tag Handlers (§7.2)
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, "");
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Custom Attribute Handlers
  const handleAddCustomProp = () => {
    setCustomProps([
      ...customProps,
      { id: `prop-${Date.now()}-${Math.random()}`, key: "", value: "" },
    ]);
    setShowCustomProps(true);
  };

  const handleUpdateCustomProp = (id: string, field: "key" | "value", val: string) => {
    setCustomProps(
      customProps.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleRemoveCustomProp = (id: string) => {
    setCustomProps(customProps.filter((p) => p.id !== id));
  };

  // Create Custom Type Inline
  const handleCreateCustomType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/entity-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTypeName.trim() }),
      });
      if (res.ok) {
        const createdType = await res.json();
        entityTypes.push(createdType);
        setSelectedTypeId(createdType.id);
        setIsCreatingCustomType(false);
        setNewTypeName("");
      }
    } catch (err) {
      console.error("Create custom type error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedTypeId || !description.trim()) {
      setError("Nama, Tipe, dan Deskripsi wajib diisi");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const combinedMetadata: Record<string, any> = {};

      Object.entries(details).forEach(([k, v]) => {
        if (v.trim()) combinedMetadata[k] = v.trim();
      });

      customProps.forEach((p) => {
        if (p.key.trim() && p.value.trim()) {
          combinedMetadata[p.key.trim()] = p.value.trim();
        }
      });

      const initialRel =
        relTargetEntityId && relLabel.trim()
          ? { targetEntityId: relTargetEntityId, label: relLabel.trim() }
          : null;

      const res = await fetch(`/api/projects/${projectId}/entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          typeId: selectedTypeId,
          description: description.trim(),
          tags,
          metadata: combinedMetadata,
          imageUrl: imageUrl.trim() || null,
          status: status.trim() || null,
          initialRelationship: initialRel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat entity");
      }

      const createdEntity = await res.json();
      onSuccess(createdEntity);
      onClose();
    } catch (err: any) {
      console.error("Submit entity error:", err);
      setError(err.message || "Terjadi kesalahan server saat menyimpan entitas");
    } finally {
      setLoading(false);
    }
  };

  const updateDetail = (key: string, val: string) => {
    setDetails((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ zIndex: 100 }}
    >
      <div
        className="modal-content overflow-y-auto max-h-[90vh]"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px", width: "100%" }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>Buat Entity Baru</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Tipe: <strong className="text-[var(--accent)]">{currentTypeObj?.name || "Generic"}</strong>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2.5 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. REQUIRED BASE FIELDS (§7.3) */}
          <div className="form-group">
            <label>Nama Entity *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Misal: Elira, Menara Hawa, Ordo Mawar..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="flex items-center justify-between">
                <span>Tipe Entity *</span>
                <button
                  type="button"
                  className="text-xs text-[var(--accent)] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => setIsCreatingCustomType(!isCreatingCustomType)}
                >
                  + Tipe kustom
                </button>
              </label>

              {isCreatingCustomType ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder="Nama tipe kustom baru..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary text-xs"
                    onClick={handleCreateCustomType}
                  >
                    Tambah
                  </button>
                </div>
              ) : (
                <select
                  className="form-input text-xs"
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  required
                >
                  {entityTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.isDefault ? "" : "(Custom)"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* STATUS FIELD */}
            <div className="form-group">
              <label>Status (Opsional)</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="Misal: Aktif / Hidup, Meninggal, Hilang..."
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                list="status-options"
              />
              <datalist id="status-options">
                {DEFAULT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="form-group">
            <label>Deskripsi *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Penjelasan singkat mengenai entitas ini dalam duniamu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Tags Input (Free text chips §7.2) */}
          <div className="form-group">
            <label>Tags (Kategori Bebas §7.2)</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="form-input flex-1 text-xs"
                placeholder="Ketik tag lalu tekan Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={handleAddTag}
              >
                + Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-xs bg-[var(--accent-soft)] text-[var(--accent)] font-medium px-2.5 py-1 rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[var(--text)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. PROGRESSIVE DISCLOSURE COLLAPSIBLE SECTIONS (§7.3 & §7.4) */}
          <div className="border-t border-[var(--border)] pt-4 mt-2 flex flex-col gap-3">
            {/* Section A: Type-Specific Design Sheet */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                onClick={() => setShowSuggestedDetails(!showSuggestedDetails)}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  <span>Tambah detail desain ({currentTypeObj?.name || "Entity"})</span>
                </span>
                {showSuggestedDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showSuggestedDetails && (
                <div className="p-4 mt-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-3.5 text-xs">
                  {/* RICH CHARACTER SHEET FIELDS */}
                  {typeNameLower.includes("character") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Usia</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: 24 tahun / 300 era"
                            value={details["Usia"] || ""}
                            onChange={(e) => updateDetail("Usia", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Pekerjaan / Peran</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Detektif Noir, Penyihir..."
                            value={details["Pekerjaan"] || ""}
                            onChange={(e) => updateDetail("Pekerjaan", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Perawakan &amp; Fisik</label>
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Misal: Tinggi 180cm, mata perak, jubah kelabu..."
                          value={details["Penampilan Fisik"] || ""}
                          onChange={(e) => updateDetail("Penampilan Fisik", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label className="flex items-center gap-1 text-[var(--accent)]">
                            <Heart size={12} /> Kesukaan / Kegemaran
                          </label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Kucing Hitam, Teh Chamomile..."
                            value={details["Kesukaan"] || ""}
                            onChange={(e) => updateDetail("Kesukaan", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="flex items-center gap-1 text-[var(--rose)]">
                            <ShieldAlert size={12} /> Ketakutan Terbesar
                          </label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Kegelapan, Pengkhianatan..."
                            value={details["Ketakutan"] || ""}
                            onChange={(e) => updateDetail("Ketakutan", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="flex items-center gap-1 text-[var(--sage)]">
                          <KeyRound size={12} /> Rahasia Kelam / Kunci Plot
                        </label>
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Misal: Anak kandung yang hilang dari Raja Ashmoor..."
                          value={details["Rahasia Kelam"] || ""}
                          onChange={(e) => updateDetail("Rahasia Kelam", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Kepribadian</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Pendiam, sinis, sangat setia..."
                            value={details["Kepribadian"] || ""}
                            onChange={(e) => updateDetail("Kepribadian", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Motivasi / Goal</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Balas dendam kematian kakaknya..."
                            value={details["Motivasi"] || ""}
                            onChange={(e) => updateDetail("Motivasi", e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* LOCATION DESIGN FIELDS */}
                  {typeNameLower.includes("location") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Lokasi Induk (Parent Location)</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Wilayah Ashmoor..."
                            value={details["Lokasi Induk"] || ""}
                            onChange={(e) => updateDetail("Lokasi Induk", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Iklim / Geografi</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Salju abadi, pegunungan..."
                            value={details["Iklim"] || ""}
                            onChange={(e) => updateDetail("Iklim", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Penguasa / Faksi Pemilik</label>
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Misal: Dikuasai Ordo Mawar Hitam..."
                          value={details["Penguasa"] || ""}
                          onChange={(e) => updateDetail("Penguasa", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* ORGANIZATION DESIGN FIELDS */}
                  {typeNameLower.includes("organization") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Pemimpin / Tokoh Utama</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Master Thorne"
                            value={details["Pemimpin"] || ""}
                            onChange={(e) => updateDetail("Pemimpin", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Didirikan (Tahun/Era)</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Tahun 1420 Era Kedua"
                            value={details["Didirikan"] || ""}
                            onChange={(e) => updateDetail("Didirikan", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Tujuan / Ideologi Utama</label>
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Misal: Menjaga rahasia sihir kuno..."
                          value={details["Ideologi"] || ""}
                          onChange={(e) => updateDetail("Ideologi", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* OBJECT DESIGN FIELDS */}
                  {typeNameLower.includes("object") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Pemilik Saat Ini</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Raja Thorne..."
                            value={details["Pemilik Saat Ini"] || ""}
                            onChange={(e) => updateDetail("Pemilik Saat Ini", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Asal-Usul / Pencipta</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            placeholder="Misal: Ditempa di Eldoria"
                            value={details["Pencipta"] || ""}
                            onChange={(e) => updateDetail("Pencipta", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Efek / Kekuatan / Fungsi</label>
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Misal: Membawa penggunanya menembus bayangan..."
                          value={details["Kekuatan"] || ""}
                          onChange={(e) => updateDetail("Kekuatan", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* CONCEPT DESIGN FIELDS */}
                  {typeNameLower.includes("concept") && (
                    <>
                      <div className="form-group">
                        <label>Aturan Utama / Mekanisme</label>
                        <textarea
                          className="form-input text-xs"
                          rows={2}
                          placeholder="Misal: Sihir membutuhkan pertukaran elemen setara..."
                          value={details["Aturan Utama"] || ""}
                          onChange={(e) => updateDetail("Aturan Utama", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Pengguna / Penerap</label>
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Misal: Keturunan Darah Murni..."
                          value={details["Pengguna"] || ""}
                          onChange={(e) => updateDetail("Pengguna", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Image URL Option */}
                  <div className="form-group pt-2 border-t border-[var(--border)]">
                    <label className="flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-[var(--accent)]" />
                      <span>URL Gambar / Ilustrasi (Opsional)</span>
                    </label>
                    <input
                      type="url"
                      className="form-input text-xs"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section B: INITIAL RELATIONSHIP (§7.5) */}
            {existingEntities.length > 0 && (
              <div>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                  onClick={() => setShowInitialRel(!showInitialRel)}
                >
                  <span className="flex items-center gap-2">
                    <Network size={14} className="text-[var(--accent)]" />
                    <span>Hubungkan relationship awal (Opsional §7.5)</span>
                  </span>
                  {showInitialRel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showInitialRel && (
                  <div className="p-4 mt-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-3 text-xs">
                    <div className="form-group">
                      <label>Target Entity yang Sudah Ada</label>
                      <select
                        className="form-input text-xs"
                        value={relTargetEntityId}
                        onChange={(e) => setRelTargetEntityId(e.target.value)}
                      >
                        <option value="">-- Pilih Target Entity --</option>
                        {existingEntities.map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Label Relasi (Pilih Cepat atau Ketik Custom)</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {QUICK_CHIP_LABELS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              relLabel === chip
                                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                                : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)]"
                            }`}
                            onClick={() => setRelLabel(chip)}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        className="form-input text-xs"
                        placeholder="Misal: Ibu, Teman, Musuh..."
                        value={relLabel}
                        onChange={(e) => setRelLabel(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section C: Writer-friendly Atribut & Catatan Khusus (§7.3) */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                onClick={handleAddCustomProp}
              >
                <span className="flex items-center gap-2">
                  <Plus size={14} className="text-[var(--accent)]" />
                  <span>Tambah Atribut &amp; Catatan Khusus</span>
                </span>
                {showCustomProps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 px-1 leading-relaxed">
                Tambahkan detail unik yang khas untuk entitas ini — seperti Hobi, Kesukaan, Ketakutan Terbesar, atau Rahasia.
              </p>

              {showCustomProps && customProps.length > 0 && (
                <div className="p-4 mt-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-3">
                  {customProps.map((prop) => (
                    <div key={prop.id} className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <input
                          type="text"
                          className="form-input text-xs w-full"
                          placeholder="Nama Atribut (misal: Hobi)"
                          value={prop.key}
                          onChange={(e) => handleUpdateCustomProp(prop.id, "key", e.target.value)}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] font-bold">:</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          className="form-input text-xs w-full"
                          placeholder="Detail (misal: Kucing Hitam)"
                          value={prop.value}
                          onChange={(e) => handleUpdateCustomProp(prop.id, "value", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1 shrink-0"
                        onClick={() => handleRemoveCustomProp(prop.id)}
                        title="Hapus atribut"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs px-6"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Entity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
