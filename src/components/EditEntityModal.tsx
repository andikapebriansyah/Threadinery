"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles, Heart, ShieldAlert, KeyRound, Edit3 } from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface EntityProfileData {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  typeId: string;
  type: EntityTypeItem;
  tags: string[];
  metadata?: Record<string, any> | null;
  imageUrl?: string | null;
  status?: string | null;
}

interface EditEntityModalProps {
  projectId: string;
  entity: EntityProfileData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEntity: any) => void;
  entityTypes: EntityTypeItem[];
}

const DEFAULT_STATUS_OPTIONS = [
  "Aktif / Hidup",
  "Meninggal / Almarhum",
  "Hilang / Tidak Diketahui",
  "Rusak / Hancur",
];

export function EditEntityModal({
  projectId,
  entity,
  isOpen,
  onClose,
  onSuccess,
  entityTypes,
}: EditEntityModalProps) {
  // Base Fields
  const [name, setName] = useState(entity.name || "");
  const [selectedTypeId, setSelectedTypeId] = useState(entity.typeId || "");
  const [description, setDescription] = useState(entity.description || "");
  const [status, setStatus] = useState(entity.status || "");
  const [imageUrl, setImageUrl] = useState(entity.imageUrl || "");

  // Tags
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(entity.tags || []);

  // Progressive Disclosure Toggles
  const [showSuggestedDetails, setShowSuggestedDetails] = useState(true);
  const [showCustomProps, setShowCustomProps] = useState(true);

  // Type-specific & Custom Metadata
  const [details, setDetails] = useState<Record<string, string>>({});
  const [customProps, setCustomProps] = useState<Array<{ id: string; key: string; value: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entity) {
      setName(entity.name || "");
      setSelectedTypeId(entity.typeId || "");
      setDescription(entity.description || "");
      setStatus(entity.status || "");
      setImageUrl(entity.imageUrl || "");
      setTags(entity.tags || []);

      const meta = entity.metadata || {};
      const newDetails: Record<string, string> = {};
      const newCustomProps: Array<{ id: string; key: string; value: string }> = [];

      const KNOWN_KEYS = [
        "Usia",
        "Pekerjaan",
        "Penampilan Fisik",
        "Kesukaan",
        "Ketakutan",
        "Rahasia Kelam",
        "Kepribadian",
        "Motivasi",
        "Kelemahan",
        "Lokasi Induk",
        "Iklim",
        "Penguasa",
        "Pemimpin",
        "Didirikan",
        "Ideologi",
        "Pemilik Saat Ini",
        "Pencipta",
        "Kekuatan",
        "Aturan Utama",
        "Pengguna",
      ];

      Object.entries(meta).forEach(([k, v]) => {
        if (KNOWN_KEYS.includes(k)) {
          newDetails[k] = String(v);
        } else {
          newCustomProps.push({
            id: `prop-${Math.random()}`,
            key: k,
            value: String(v),
          });
        }
      });

      setDetails(newDetails);
      setCustomProps(newCustomProps);
    }
  }, [entity]);

  if (!isOpen) return null;

  const currentTypeObj = entityTypes.find((t) => t.id === selectedTypeId) || entity.type;
  const typeNameLower = currentTypeObj?.name?.toLowerCase() || "";

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

  // Custom Atribut Handlers
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

  const updateDetail = (key: string, val: string) => {
    setDetails((prev) => ({ ...prev, [key]: val }));
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

      const res = await fetch(`/api/projects/${projectId}/entities/${entity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          typeId: selectedTypeId,
          description: description.trim(),
          tags,
          metadata: combinedMetadata,
          imageUrl: imageUrl.trim() || null,
          status: status.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui entitas");
      }

      const updatedEntity = await res.json();
      onSuccess(updatedEntity);
      onClose();
    } catch (err: any) {
      console.error("Update entity error:", err);
      setError(err.message || "Terjadi kesalahan saat memperbarui entitas");
    } finally {
      setLoading(false);
    }
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
            <h2 className="flex items-center gap-2">
              <Edit3 size={18} className="text-[var(--accent)]" />
              <span>Edit Entitas: {entity.name}</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Lengkapi atau ubah detail entitas ini kapan saja
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
          {/* 1. BASE FIELDS */}
          <div className="form-group">
            <label>Nama Entity *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label>Tipe Entity *</label>
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
            </div>

            <div className="form-group">
              <label>Status (Opsional)</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="Aktif, Meninggal, Hilang..."
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                list="edit-status-options"
              />
              <datalist id="edit-status-options">
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags (Kategori Bebas)</label>
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
                Tag
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

          {/* 2. COLLAPSIBLE DETAIL SECTIONS */}
          <div className="border-t border-[var(--border)] pt-4 mt-2 flex flex-col gap-3">
            {/* Section A: Type-Specific Details */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                onClick={() => setShowSuggestedDetails(!showSuggestedDetails)}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  <span>Detail Desain ({currentTypeObj?.name || "Entity"})</span>
                </span>
                {showSuggestedDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showSuggestedDetails && (
                <div className="p-4 mt-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-3.5 text-xs">
                  {typeNameLower.includes("character") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Usia</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            value={details["Usia"] || ""}
                            onChange={(e) => updateDetail("Usia", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Pekerjaan / Peran</label>
                          <input
                            type="text"
                            className="form-input text-xs"
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
                            value={details["Kepribadian"] || ""}
                            onChange={(e) => updateDetail("Kepribadian", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Motivasi / Goal</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            value={details["Motivasi"] || ""}
                            onChange={(e) => updateDetail("Motivasi", e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {typeNameLower.includes("location") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Lokasi Induk</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            value={details["Lokasi Induk"] || ""}
                            onChange={(e) => updateDetail("Lokasi Induk", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Iklim / Geografi</label>
                          <input
                            type="text"
                            className="form-input text-xs"
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
                          value={details["Penguasa"] || ""}
                          onChange={(e) => updateDetail("Penguasa", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {typeNameLower.includes("organization") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Pemimpin / Tokoh Utama</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            value={details["Pemimpin"] || ""}
                            onChange={(e) => updateDetail("Pemimpin", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Didirikan (Tahun/Era)</label>
                          <input
                            type="text"
                            className="form-input text-xs"
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
                          value={details["Ideologi"] || ""}
                          onChange={(e) => updateDetail("Ideologi", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {typeNameLower.includes("object") && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Pemilik Saat Ini</label>
                          <input
                            type="text"
                            className="form-input text-xs"
                            value={details["Pemilik Saat Ini"] || ""}
                            onChange={(e) => updateDetail("Pemilik Saat Ini", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Asal-Usul / Pencipta</label>
                          <input
                            type="text"
                            className="form-input text-xs"
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
                          value={details["Kekuatan"] || ""}
                          onChange={(e) => updateDetail("Kekuatan", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {typeNameLower.includes("concept") && (
                    <>
                      <div className="form-group">
                        <label>Aturan Utama / Mekanisme</label>
                        <textarea
                          className="form-input text-xs"
                          rows={2}
                          value={details["Aturan Utama"] || ""}
                          onChange={(e) => updateDetail("Aturan Utama", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Pengguna / Penerap</label>
                        <input
                          type="text"
                          className="form-input text-xs"
                          value={details["Pengguna"] || ""}
                          onChange={(e) => updateDetail("Pengguna", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group pt-2 border-t border-[var(--border)]">
                    <label className="flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-[var(--accent)]" />
                      <span>URL Gambar / Ilustrasi</span>
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

            {/* Section B: Custom Atribut */}
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

              {showCustomProps && customProps.length > 0 && (
                <div className="p-4 mt-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-3">
                  {customProps.map((prop) => (
                    <div key={prop.id} className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <input
                          type="text"
                          className="form-input text-xs w-full"
                          placeholder="Nama Atribut"
                          value={prop.key}
                          onChange={(e) => handleUpdateCustomProp(prop.id, "key", e.target.value)}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)]">:</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          className="form-input text-xs w-full"
                          placeholder="Detail"
                          value={prop.value}
                          onChange={(e) => handleUpdateCustomProp(prop.id, "value", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1 shrink-0"
                        onClick={() => handleRemoveCustomProp(prop.id)}
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
          <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-[var(--border)]">
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
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
