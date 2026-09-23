export const MAX_SAVE_SLOTS = 5;
export const LEGACY_SAVE_KEY = "jalan-dao-save";
export const SLOT_PREFIX = "boundless-cultivation-save-slot-";
export const SLOT_FORMAT = "boundless-cultivation-slot-v1";
export const SINGLE_EXPORT_FORMAT = "boundless-cultivation-save-export-v1";
export const BUNDLE_EXPORT_FORMAT = "boundless-cultivation-save-bundle-v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function slotKey(slot) {
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1 || n > MAX_SAVE_SLOTS) {
    throw new RangeError(`slot must be an integer from 1 to ${MAX_SAVE_SLOTS}`);
  }
  return `${SLOT_PREFIX}${n}`;
}

export function isGameSave(value) {
  if (!isObject(value)) return false;
  const version = Number(value.saveVersion);
  return Number.isFinite(version) && version >= 1;
}

export function makeSlotRecord(save, slot, savedAt = new Date().toISOString(), label = "") {
  if (!isGameSave(save)) throw new TypeError("Invalid Boundless Cultivation save");
  const n = Number(slot);
  slotKey(n);
  return {
    format: SLOT_FORMAT,
    slot: n,
    label: String(label || "").trim(),
    savedAt: String(savedAt),
    save: clone(save)
  };
}

export function normalizeSlotRecord(value, fallbackSlot) {
  if (!isObject(value)) throw new TypeError("Invalid slot record");
  if (value.format === SLOT_FORMAT && isGameSave(value.save)) {
    const slot = Number(value.slot ?? fallbackSlot);
    return makeSlotRecord(value.save, slot, value.savedAt || new Date().toISOString(), value.label || "");
  }
  if (isGameSave(value)) {
    return makeSlotRecord(value, fallbackSlot ?? 1);
  }
  throw new TypeError("Unsupported save payload");
}

export function summarizeSave(record) {
  const normalized = normalizeSlotRecord(record, record?.slot ?? 1);
  const save = normalized.save;
  const realmParts = [
    save.realm !== undefined ? String(save.realm) : "",
    save.realmPhase ? String(save.realmPhase) : ""
  ].filter(Boolean);
  return {
    slot: normalized.slot,
    label: normalized.label,
    savedAt: normalized.savedAt,
    name: String(save.name || "Tanpa Nama"),
    version: String(save.gameVersion || save.saveVersion || "Tidak diketahui"),
    saveVersion: Number(save.saveVersion || 0),
    day: Number(save.day || 0),
    realm: realmParts.join(" · ") || "Belum diketahui",
    location: String(save.location || "Belum diketahui")
  };
}

export function createSingleExport(record, exportedAt = new Date().toISOString()) {
  const normalized = normalizeSlotRecord(record, record?.slot ?? 1);
  return {
    format: SINGLE_EXPORT_FORMAT,
    exportedAt: String(exportedAt),
    game: "Boundless Cultivation",
    record: clone(normalized)
  };
}

export function createBundleExport(records, exportedAt = new Date().toISOString()) {
  const normalized = [];
  for (let index = 0; index < MAX_SAVE_SLOTS; index += 1) {
    const value = records?.[index];
    if (!value) continue;
    const record = normalizeSlotRecord(value, index + 1);
    normalized.push(record);
  }
  return {
    format: BUNDLE_EXPORT_FORMAT,
    exportedAt: String(exportedAt),
    game: "Boundless Cultivation",
    slots: clone(normalized)
  };
}

export function parseImportPayload(text, fallbackSlot = 1) {
  let parsed;
  try {
    parsed = typeof text === "string" ? JSON.parse(text) : clone(text);
  } catch {
    throw new TypeError("Fail save bukan JSON yang sah");
  }

  if (isObject(parsed) && parsed.format === BUNDLE_EXPORT_FORMAT && Array.isArray(parsed.slots)) {
    const records = parsed.slots.map((entry, index) => normalizeSlotRecord(entry, entry?.slot ?? index + 1));
    if (!records.length) throw new TypeError("Bundle save kosong");
    return { kind: "bundle", records };
  }

  if (isObject(parsed) && parsed.format === SINGLE_EXPORT_FORMAT && parsed.record) {
    return { kind: "single", records: [normalizeSlotRecord(parsed.record, fallbackSlot)] };
  }

  if (isObject(parsed) && parsed.format === SLOT_FORMAT && parsed.save) {
    return { kind: "single", records: [normalizeSlotRecord(parsed, fallbackSlot)] };
  }

  if (isGameSave(parsed)) {
    return { kind: "single", records: [makeSlotRecord(parsed, fallbackSlot)] };
  }

  throw new TypeError("Fail ini bukan save Boundless Cultivation yang disokong");
}
