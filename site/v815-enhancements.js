(() => {
  const OVERLAY_ID = "bc815-portrait-paper";
  let relay = false;
  let activeGrid = null;
  let activeLabel = "";
  let lastTrigger = null;
  let scheduled = false;

  function sourceLabel(button) {
    if (button.querySelector(".family-portrait-art")) return "Keluarga";
    if (button.querySelector(".sect-portrait-art")) return "Sekte";
    return "Orang Awam";
  }

  function choices(grid) {
    return Array.from(grid.querySelectorAll(":scope > button"));
  }

  function selectedButton(grid) {
    return choices(grid).find((button) =>
      button.getAttribute("aria-checked") === "true" || button.classList.contains("selected")
    ) || choices(grid)[0] || null;
  }

  function compactGrid(grid, label) {
    if (!grid) return;
    if (grid.dataset.bc815Compact !== "1") grid.dataset.bc815Compact = "1";
    const current = selectedButton(grid);
    choices(grid).forEach((button) => {
      if (button === current) {
        if (button.dataset.bc815PortraitTrigger !== "1") button.dataset.bc815PortraitTrigger = "1";
        if (button.getAttribute("aria-label") !== label) button.setAttribute("aria-label", label);
      } else {
        delete button.dataset.bc815PortraitTrigger;
      }
    });
  }

  function decorateTalentGroup() {
    const heading = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.trim() === "Bakat");
    const header = heading?.parentElement;
    const section = header?.parentElement;
    const grid = section?.querySelector(":scope > div.grid");
    if (!header || !grid) return;
    grid.classList.add("multi-talent-grid");
    const buttons = Array.from(grid.querySelectorAll(":scope > button.choice-card"));
    const selected = buttons.filter((button) => button.classList.contains("selected"));
    buttons.forEach((button) => button.setAttribute("aria-pressed", button.classList.contains("selected") ? "true" : "false"));
    let badge = header.querySelector(".multi-talent-count");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "multi-talent-count";
      header.appendChild(badge);
    }
    badge.textContent = `${selected.length}/4 dipilih`;
  }

  function compactAll() {
    decorateTalentGroup();
    document.querySelectorAll(".player-portrait-options").forEach((grid) => compactGrid(grid, "Pilih Muka Pemain"));
    document.querySelectorAll(".true-love-face-grid").forEach((grid) => compactGrid(grid, "Pilih Muka Pasangan"));
  }

  function closePaper() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.remove();
    activeGrid = null;
    const trigger = lastTrigger;
    lastTrigger = null;
    if (trigger && trigger.isConnected) trigger.focus();
  }

  function renderPaperChoices() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay || !activeGrid || !activeGrid.isConnected) return;
    const scroll = overlay.querySelector(".bc815-paper-scroll");
    if (!scroll) return;
    scroll.replaceChildren();

    const groups = new Map();
    choices(activeGrid).forEach((button, index) => {
      const label = sourceLabel(button);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push({ button, index });
    });

    ["Keluarga", "Orang Awam", "Sekte"].forEach((label) => {
      const members = groups.get(label);
      if (!members?.length) return;
      const section = document.createElement("section");
      section.className = "bc815-paper-group";
      const heading = document.createElement("h3");
      heading.textContent = label;
      const grid = document.createElement("div");
      grid.className = "bc815-paper-grid";
      grid.setAttribute("role", "radiogroup");
      grid.setAttribute("aria-label", label);

      members.forEach(({ button }) => {
        const clone = button.cloneNode(true);
        clone.classList.add("bc815-paper-choice");
        clone.removeAttribute("data-bc815-portrait-trigger");
        clone.disabled = false;
        clone.addEventListener("click", (event) => {
          event.preventDefault();
          relay = true;
          try { button.click(); } finally { relay = false; }
          window.setTimeout(() => {
            compactAll();
            renderPaperChoices();
          }, 0);
        });
        grid.appendChild(clone);
      });

      section.append(heading, grid);
      scroll.appendChild(section);
    });
  }

  function openPaper(grid, label, trigger) {
    closePaper();
    activeGrid = grid;
    activeLabel = label;
    lastTrigger = trigger;

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "bc815-paper-overlay";
    overlay.setAttribute("role", "presentation");

    const dialog = document.createElement("section");
    dialog.className = "bc815-paper-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", label);

    const header = document.createElement("header");
    header.className = "bc815-paper-header";
    const copy = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = label;
    const note = document.createElement("p");
    note.textContent = "Pilih satu muka. Kertas kekal terbuka sehingga ditutup.";
    copy.append(title, note);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "bc815-paper-close";
    close.setAttribute("aria-label", "Tutup kertas pemilihan");
    close.textContent = "×";
    close.addEventListener("click", closePaper);

    const scroll = document.createElement("div");
    scroll.className = "bc815-paper-scroll";

    header.append(copy, close);
    dialog.append(header, scroll);
    overlay.append(dialog);
    document.body.appendChild(overlay);
    renderPaperChoices();
    close.focus();
  }

  document.addEventListener("click", (event) => {
    if (relay) return;
    const trigger = event.target.closest("[data-bc815-portrait-trigger='1']");
    if (!trigger) return;
    const grid = trigger.closest(".player-portrait-options, .true-love-face-grid");
    if (!grid) return;
    event.preventDefault();
    event.stopPropagation();
    const label = grid.classList.contains("player-portrait-options") ? "Pilih Muka Pemain" : "Pilih Muka Pasangan";
    openPaper(grid, label, trigger);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.getElementById(OVERLAY_ID)) {
      event.preventDefault();
      closePaper();
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      compactAll();
      if (document.getElementById(OVERLAY_ID) && activeGrid?.isConnected) renderPaperChoices();
    });
  });

  function start() {
    compactAll();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-checked", "class"] });
  }

  const startAfterHydration = () => window.setTimeout(start, 900);
  if (document.readyState === "complete") {
    startAfterHydration();
  } else {
    window.addEventListener("load", startAfterHydration, { once: true });
  }
})();
