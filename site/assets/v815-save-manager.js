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
const PENDING_LOAD_KEY = "boundless-cultivation-pending-load";

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

function setStatus(root, message, kind = "") {
  const status = $(".bc-save-status", root);
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function render(root) {
  const active = readActiveSave();
  const activeBox = $('[data-role="active-summary"]', root);
  if (activeBox) {
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
  }

  const slots = $('[data-role="slots"]', root);
  if (!slots) return;
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

function bindManager(root) {
  if (root.dataset.boundlessSaveBound === "true") return;
  root.dataset.boundlessSaveBound = "true";

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const slot = Number(button.dataset.slot || 0);

    if (action === "save") {
      if (typeof window.__boundlessSaveCurrent === "function") {
        window.__boundlessSaveCurrent();
      }
      const active = readActiveSave();
      if (!active) {
        setStatus(root, "Belum ada permainan aktif untuk disimpan.", "error");
        return;
      }
      const labelInput = root.querySelector(`input[data-label-slot="${slot}"]`);
      const existing = readSlot(slot);
      const label = labelInput?.value?.trim() || existing?.label || `Slot ${slot}`;
      writeSlot(makeSlotRecord(active, slot, new Date().toISOString(), label));
      render(root);
      setStatus(root, `Slot ${slot} disimpan.`, "ok");
      return;
    }

    if (action === "load") {
      const record = readSlot(slot);
      if (!record) return;
      if (!confirm(`Muat Slot ${slot}? Kemajuan aktif yang belum disimpan boleh hilang.`)) return;
      localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(record.save));
      if (typeof window.__boundlessLoadCurrent === "function") {
        window.__boundlessLoadCurrent();
        setStatus(root, `Slot ${slot} dimuat ke keadaan terakhir.`, "ok");
      } else {
        localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify({ slot, requestedAt: Date.now() }));
        location.reload();
      }
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
      render(root);
      setStatus(root, `Slot ${slot} dipadam.`, "ok");
      return;
    }

    if (action === "import") {
      $("#bc-save-file", root)?.click();
      return;
    }

    if (action === "export-all") {
      const records = occupiedSlots();
      if (!records.some(Boolean)) {
        setStatus(root, "Tiada slot untuk diexport.", "error");
        return;
      }
      downloadJson(createBundleExport(records), `boundless-cultivation-all-saves-${stampForFilename()}.json`);
      setStatus(root, "Semua slot berisi diexport.", "ok");
    }
  });

  const fileInput = $("#bc-save-file", root);
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const targetSlot = Number($("#bc-save-import-slot", root)?.value || 1);
    try {
      const parsed = parseImportPayload(await file.text(), targetSlot);
      if (parsed.kind === "bundle") {
        if (!confirm("Import bundle akan menggantikan slot yang sepadan. Teruskan?")) {
          fileInput.value = "";
          return;
        }
        for (const record of parsed.records) writeSlot(record);
        render(root);
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
        render(root);
        setStatus(root, `Save diimport ke Slot ${targetSlot}.`, "ok");
      }
    } catch (error) {
      setStatus(root, error?.message || "Import gagal.", "error");
    } finally {
      fileInput.value = "";
    }
  });
}

function mountIntoSettings(host) {
  if (!host || host.dataset.boundlessSaveMounted === "true") return;
  host.dataset.boundlessSaveMounted = "true";
  host.innerHTML = `
    <section id="bc-save-manager-panel" class="bc-save-panel" aria-labelledby="bc-save-title">
      <header class="bc-save-head">
        <div>
          <p class="bc-save-kicker">Data kemajuan</p>
          <h3 id="bc-save-title">Simpan & Export</h3>
          <p>5 slot manual · Import / Export JSON · save lama kekal serasi</p>
        </div>
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
  `;
  const root = $("#bc-save-manager-panel", host);
  bindManager(root);
  render(root);
}

function findAndMount() {
  const host = document.getElementById("bc-save-manager-mount");
  if (host) mountIntoSettings(host);
}


function restorePendingLoad() {
  if (!localStorage.getItem(PENDING_LOAD_KEY)) return;
  let attempts = 0;
  const tryLoad = () => {
    if (typeof window.__boundlessLoadCurrent === "function") {
      localStorage.removeItem(PENDING_LOAD_KEY);
      window.__boundlessLoadCurrent();
      return;
    }
    attempts += 1;
    if (attempts < 120) setTimeout(tryLoad, 50);
  };
  tryLoad();
}

function buildUi() {
  findAndMount();
  restorePendingLoad();
  const observer = new MutationObserver(() => findAndMount());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return observer;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildUi, { once: true });
} else {
  buildUi();
}

export { buildUi, mountIntoSettings, readActiveSave, readSlot };
