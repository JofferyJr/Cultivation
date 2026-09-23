import {
  MAX_SAVE_SLOTS,
  LEGACY_SAVE_KEY,
  slotKey,
  isGameSave,
  makeSlotRecord,
  normalizeSlotRecord,
  summarizeSave,
  createSingleExport,
  createBundleExport,
  parseImportPayload
} from "./v815-save-manager-core.mjs";

const $ = (selector, root = document) => root.querySelector(selector);

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function readActiveSave() {
  const value = readJson(LEGACY_SAVE_KEY);
  return isGameSave(value) ? value : null;
}

function readSlot(slot) {
  const value = readJson(slotKey(slot));
  if (!value) return null;
  try { return normalizeSlotRecord(value, slot); } catch { return null; }
}

function writeSlot(record) {
  localStorage.setItem(slotKey(record.slot), JSON.stringify(record));
}

function occupiedSlots() {
  return Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => readSlot(i + 1));
}

function safeFilenamePart(value) {
  return String(value || "save")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "save";
}

function stampForFilename(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function downloadJson(value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).format(date);
}

function buildUi() {
  if (document.getElementById("bc-save-manager-root")) return;

  const root = document.createElement("div");
  root.id = "bc-save-manager-root";
  root.innerHTML = `
    <button type="button" class="bc-save-fab" aria-haspopup="dialog" aria-controls="bc-save-dialog">
      <span aria-hidden="true">💾</span><span>Simpan & Export</span>
    </button>
    <div class="bc-save-overlay" hidden>
      <section id="bc-save-dialog" class="bc-save-dialog" role="dialog" aria-modal="true" aria-labelledby="bc-save-title">
        <header class="bc-save-head">
          <div>
            <p class="bc-save-kicker">Boundless Cultivation</p>
            <h2 id="bc-save-title">Pengurus Simpanan</h2>
            <p>5 slot manual · Import / Export JSON · save lama kekal serasi</p>
          </div>
          <button type="button" class="bc-save-close" aria-label="Tutup pengurus simpanan">×</button>
        </header>

        <div class="bc-active-save" data-role="active-summary"></div>
        <div class="bc-save-status" role="status" aria-live="polite"></div>
        <div class="bc-save-slots" data-role="slots"></div>

        <footer class="bc-save-tools">
          <label>
            <span>Import ke slot</span>
            <select id="bc-save-import-slot">
              ${Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => `<option value="${i + 1}">Slot ${i + 1}</option>`).join("")}
            </select>
          </label>
          <input id="bc-save-file" type="file" accept=".json,application/json" hidden>
          <button type="button" data-action="import">Import Save</button>
          <button type="button" data-action="export-all">Export Semua</button>
        </footer>
      </section>
    </div>
  `;
  document.body.appendChild(root);

  const overlay = $(".bc-save-overlay", root);
  const dialog = $(".bc-save-dialog", root);
  const fab = $(".bc-save-fab", root);
  const close = $(".bc-save-close", root);

  const open = () => {
    render(root);
    overlay.hidden = false;
    document.documentElement.classList.add("bc-save-modal-open");
    close.focus();
  };
  const hide = () => {
    overlay.hidden = true;
    document.documentElement.classList.remove("bc-save-modal-open");
    fab.focus();
  };

  fab.addEventListener("click", open);
  close.addEventListener("click", hide);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) hide();
  });

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const slot = Number(button.dataset.slot || 0);

    if (action === "save") {
      const active = readActiveSave();
      if (!active) return setStatus(root, "Belum ada save aktif. Gunakan butang Simpan dalam game dahulu.", "error");
      const labelInput = root.querySelector(`input[data-label-slot="${slot}"]`);
      const existing = readSlot(slot);
      const label = labelInput?.value?.trim() || existing?.label || `Slot ${slot}`;
      writeSlot(makeSlotRecord(active, slot, new Date().toISOString(), label));
      setStatus(root, `Slot ${slot} disimpan.`, "ok");
      render(root);
      return;
    }

    if (action === "load") {
      const record = readSlot(slot);
      if (!record) return;
      if (!confirm(`Muat Slot ${slot}? Kemajuan aktif yang belum disimpan boleh hilang.`)) return;
      localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(record.save));
      location.reload();
      return;
    }

    if (action === "export") {
      const record = readSlot(slot);
      if (!record) return;
      const summary = summarizeSave(record);
      downloadJson(
        createSingleExport(record),
        `boundless-cultivation-slot-${slot}-${safeFilenamePart(summary.name)}-${stampForFilename()}.json`
      );
      setStatus(root, `Slot ${slot} diexport.`, "ok");
      return;
    }

    if (action === "delete") {
      const record = readSlot(slot);
      if (!record) return;
      if (!confirm(`Padam Slot ${slot}? Tindakan ini tidak memadam save aktif.`)) return;
      localStorage.removeItem(slotKey(slot));
      setStatus(root, `Slot ${slot} dipadam.`, "ok");
      render(root);
      return;
    }

    if (action === "import") {
      $("#bc-save-file", root).click();
      return;
    }

    if (action === "export-all") {
      const records = occupiedSlots();
      if (!records.some(Boolean)) return setStatus(root, "Tiada slot untuk diexport.", "error");
      downloadJson(createBundleExport(records), `boundless-cultivation-all-saves-${stampForFilename()}.json`);
      setStatus(root, "Semua slot berisi diexport.", "ok");
    }
  });

  const fileInput = $("#bc-save-file", root);
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const targetSlot = Number($("#bc-save-import-slot", root).value || 1);
    try {
      const parsed = parseImportPayload(await file.text(), targetSlot);
      if (parsed.kind === "bundle") {
        if (!confirm("Import bundle akan menggantikan slot yang sepadan. Teruskan?")) {
          fileInput.value = "";
          return;
        }
        for (const record of parsed.records) writeSlot(record);
        setStatus(root, `${parsed.records.length} slot diimport.`, "ok");
      } else {
        const incoming = parsed.records[0];
        const record = makeSlotRecord(
          incoming.save,
          targetSlot,
          new Date().toISOString(),
          incoming.label || `Import Slot ${targetSlot}`
        );
        if (readSlot(targetSlot) && !confirm(`Slot ${targetSlot} sudah berisi. Gantikan?`)) {
          fileInput.value = "";
          return;
        }
        writeSlot(record);
        setStatus(root, `Save diimport ke Slot ${targetSlot}.`, "ok");
      }
      render(root);
    } catch (error) {
      setStatus(root, error?.message || "Import gagal.", "error");
    } finally {
      fileInput.value = "";
    }
  });

  render(root);
}

function setStatus(root, message, kind = "") {
  const status = $(".bc-save-status", root);
  status.textContent = message;
  status.dataset.kind = kind;
}

function render(root) {
  const active = readActiveSave();
  const activeBox = $('[data-role="active-summary"]', root);
  if (active) {
    const summary = summarizeSave(makeSlotRecord(active, 1));
    activeBox.innerHTML = `
      <strong>Save aktif</strong>
      <span>${escapeHtml(summary.name)}</span>
      <span>v${escapeHtml(summary.version)} · Hari ${summary.day}</span>
      <span>${escapeHtml(summary.realm)}</span>
    `;
  } else {
    activeBox.innerHTML = "<strong>Save aktif</strong><span>Belum ada save aktif.</span>";
  }

  const slots = $('[data-role="slots"]', root);
  slots.innerHTML = Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
    const slot = index + 1;
    const record = readSlot(slot);
    if (!record) {
      return `
        <article class="bc-slot bc-slot-empty" data-slot="${slot}">
          <div class="bc-slot-title"><strong>Slot ${slot}</strong><span>Kosong</span></div>
          <input data-label-slot="${slot}" maxlength="40" placeholder="Nama slot (pilihan)" aria-label="Nama Slot ${slot}">
          <div class="bc-slot-actions">
            <button type="button" data-action="save" data-slot="${slot}">Simpan ke Slot ${slot}</button>
          </div>
        </article>
      `;
    }

    const s = summarizeSave(record);
    return `
      <article class="bc-slot" data-slot="${slot}">
        <div class="bc-slot-title"><strong>Slot ${slot}</strong><span>${escapeHtml(formatTime(s.savedAt))}</span></div>
        <input data-label-slot="${slot}" maxlength="40" value="${escapeHtml(s.label)}" placeholder="Nama slot" aria-label="Nama Slot ${slot}">
        <div class="bc-slot-meta">
          <b>${escapeHtml(s.name)}</b>
          <span>v${escapeHtml(s.version)} · save ${s.saveVersion}</span>
          <span>Hari ${s.day} · ${escapeHtml(s.realm)}</span>
          <span>${escapeHtml(s.location)}</span>
        </div>
        <div class="bc-slot-actions">
          <button type="button" data-action="save" data-slot="${slot}">Simpan</button>
          <button type="button" data-action="load" data-slot="${slot}">Muat</button>
          <button type="button" data-action="export" data-slot="${slot}">Export</button>
          <button type="button" data-action="delete" data-slot="${slot}" class="danger">Padam</button>
        </div>
      </article>
    `;
  }).join("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildUi, { once: true });
} else {
  buildUi();
}

export { buildUi, readActiveSave, readSlot };
