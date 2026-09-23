import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_SAVE_SLOTS,
  LEGACY_SAVE_KEY,
  slotKey,
  makeSlotRecord,
  summarizeSave,
  createSingleExport,
  createBundleExport,
  parseImportPayload
} from "../site/assets/v815-save-manager-core.mjs";

test("defines five manual save slots without replacing the legacy active-save key", () => {
  assert.equal(MAX_SAVE_SLOTS, 5);
  assert.equal(LEGACY_SAVE_KEY, "jalan-dao-save");
  assert.equal(slotKey(1), "boundless-cultivation-save-slot-1");
  assert.equal(slotKey(5), "boundless-cultivation-save-slot-5");
  assert.throws(() => slotKey(0));
  assert.throws(() => slotKey(6));
});

test("creates a slot record and readable summary from an active save", () => {
  const savedAt = "2026-09-23T06:00:00.000Z";
  const save = {
    saveVersion: 29,
    gameVersion: "8.1.4",
    name: "Li Yun",
    day: 42,
    realm: 2,
    realmPhase: "Tahap Menengah",
    location: "lembah_bunga_bulan"
  };
  const record = makeSlotRecord(save, 2, savedAt, "Kultivator Utama");
  assert.equal(record.format, "boundless-cultivation-slot-v1");
  assert.equal(record.slot, 2);
  assert.equal(record.label, "Kultivator Utama");
  assert.deepEqual(record.save, save);

  const summary = summarizeSave(record);
  assert.equal(summary.name, "Li Yun");
  assert.equal(summary.version, "8.1.4");
  assert.equal(summary.day, 42);
  assert.match(summary.realm, /2/);
});

test("exports and imports one slot without mutating the game save", () => {
  const save = { saveVersion: 29, gameVersion: "8.1.4", name: "Bing Xue", day: 9 };
  const record = makeSlotRecord(save, 1, "2026-09-23T06:00:00.000Z");
  const exported = createSingleExport(record, "2026-09-23T06:05:00.000Z");
  const parsed = parseImportPayload(JSON.stringify(exported));
  assert.equal(parsed.kind, "single");
  assert.deepEqual(parsed.records[0].save, save);
  assert.notEqual(parsed.records[0].save, save);
});

test("exports and imports all occupied slots as one bundle", () => {
  const first = makeSlotRecord({ saveVersion: 29, name: "A" }, 1, "2026-09-23T06:00:00.000Z");
  const third = makeSlotRecord({ saveVersion: 29, name: "C" }, 3, "2026-09-23T06:01:00.000Z");
  const bundle = createBundleExport([first, null, third, null, null], "2026-09-23T06:10:00.000Z");
  const parsed = parseImportPayload(JSON.stringify(bundle));
  assert.equal(parsed.kind, "bundle");
  assert.deepEqual(parsed.records.map(r => r.slot), [1, 3]);
});

test("accepts a legacy raw save export and rejects malformed input", () => {
  const raw = { saveVersion: 29, gameVersion: "8.1.4", name: "Raw Save" };
  const parsed = parseImportPayload(JSON.stringify(raw), 4);
  assert.equal(parsed.kind, "single");
  assert.equal(parsed.records[0].slot, 4);
  assert.equal(parsed.records[0].save.name, "Raw Save");

  assert.throws(() => parseImportPayload("not-json", 1));
  assert.throws(() => parseImportPayload(JSON.stringify({ hello: "world" }), 1));
});
