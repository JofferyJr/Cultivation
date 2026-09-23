# Jalan Dao Standalone GitHub Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current placeholder GitHub page with a fully standalone Jalan Dao game recovered from the v8.1 offline build, integrate the retained PGN assets, reconstruct approved 8.1.x changes, and publish the result through GitHub Pages with no SiteGPT runtime dependency.

**Architecture:** Treat the 71.8 MB `Jalan_Dao_v8.1_Offline.html` as the executable recovery base. First split its six inline scripts and two style blocks into external static files without changing execution order, then layer deterministic 8.1.x reconstruction patches and local asset manifests on top. Preserve browser-only storage and static hosting; use tooling and tests to verify extraction fidelity, runtime independence, asset completeness, save compatibility, and release parity.

**Tech Stack:** Static HTML/CSS/JavaScript, React bundle recovered from the offline build, Python 3 standard library for extraction/audit tooling, Node.js + Playwright for browser smoke tests, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-23-jalan-dao-sitegpt-to-github-design.md`

## Global Constraints

- Target repository: `JofferyJr/Cultivation`.
- Deployment target: GitHub Pages using Static HTML.
- The GitHub runtime must contain no iframe, redirect, proxy, runtime fetch, or automatic synchronization to the old SiteGPT deployment.
- The recovered base is the latest complete executable artifact that can actually be extracted and tested.
- Do not label the release v8.1.3 until the recorded 8.1.x parity checklist passes.
- Preserve current browser save semantics and known `localStorage` keys where possible.
- Runtime asset URLs must be relative and work under `https://jofferyjr.github.io/Cultivation/`.
- Functional preservation has priority over cosmetic refactoring.
- The GitHub build must still load when the old SiteGPT domain is blocked.

## Review Focus

- **Script-order regression:** extracted scripts must execute in the exact original order or the recovered React bundle can fail before rendering. Task 2 tests original tag order against generated references.
- **Asset-path regression under project subpath:** every runtime asset must resolve under `/Cultivation/`, not domain root. Tasks 3 and 4 test for root-absolute paths and missing files.
- **Save-schema regression:** old compatible saves must still load and malformed saves must not prevent first render. Task 7 adds save fixtures and migration assertions.
- **Patch-anchor drift:** reconstruction patches must fail loudly if the recovered bundle no longer contains the exact anchor they target. Task 5 tests every bundle transform with one-match assertions.
- **False v8.1.3 labeling:** the release label must remain reconstructed/pre-release until every critical parity item passes. Task 9 gates version promotion on the audit manifest.

---

### Task 1: Add Recovery Tooling and Source Inventory

**Files:**
- Create: `tools/extract_offline_build.py`
- Create: `tools/hash_sources.py`
- Create: `tests/test_extract_offline_build.py`
- Create: `docs/migration/source-inventory.md`
- Create: `docs/migration/recovery-manifest.json`

**Interfaces:**
- Consumes: local recovery input `Jalan_Dao_v8.1_Offline.html`.
- Produces: `extract_offline(source: Path, output_root: Path) -> dict` and a JSON recovery manifest containing byte counts, SHA-256 hashes, script/style order, and extracted filenames.

- [ ] **Step 1: Write the extraction-unit test**

```python
# tests/test_extract_offline_build.py
from pathlib import Path
from tools.extract_offline_build import extract_offline

FIXTURE = """<!doctype html><html><head>
<style>.a{color:red}</style>
</head><body><div id="root"></div>
<script>window.A=1;</script>
<script>window.B=window.A+1;</script>
<style>.b{color:blue}</style>
</body></html>"""

def test_extract_offline_preserves_order_and_content(tmp_path):
    source = tmp_path / "offline.html"
    source.write_text(FIXTURE, encoding="utf-8")
    out = tmp_path / "site"
    result = extract_offline(source, out)

    assert result["scripts"] == [
        "js/recovered/script-00.js",
        "js/recovered/script-01.js",
    ]
    assert result["styles"] == [
        "css/recovered/style-00.css",
        "css/recovered/style-01.css",
    ]
    assert (out / "js/recovered/script-00.js").read_text() == "window.A=1;"
    assert (out / "js/recovered/script-01.js").read_text() == "window.B=window.A+1;"

    html = (out / "index.html").read_text()
    assert html.index("script-00.js") < html.index("script-01.js")
    assert "window.A=1" not in html
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
python -m unittest tests/test_extract_offline_build.py
```

Expected: FAIL because `tools.extract_offline_build` does not exist.

- [ ] **Step 3: Implement dependency-free extraction**

Implement `tools/extract_offline_build.py` with `html.parser.HTMLParser`, not BeautifulSoup, so migration tooling does not introduce runtime or build dependencies.

Core rules:

```python
SCRIPT_NAMES = {
    0: "js/recovered/app.bundle.js",
    1: "js/recovered/assets-core.js",
    2: "js/recovered/error-fallback.js",
    3: "js/recovered/assets-v8.js",
    4: "js/recovered/v8-draft.js",
    5: "js/recovered/v8.1.js",
}
STYLE_NAMES = {
    0: "css/recovered/app.css",
    1: "css/recovered/v8.css",
}
```

The parser must:
- capture every inline script/style block in source order;
- write exact text bytes to the paths above;
- replace each inline block with a relative `src`/`href` reference at the same DOM position;
- leave the original `#root` and body structure intact;
- compute SHA-256 for the source and each extracted block;
- write `docs/migration/recovery-manifest.json`.

- [ ] **Step 4: Add source inventory documentation**

`docs/migration/source-inventory.md` must record these verified facts:

```text
Jalan_Dao_v8.1_Offline.html
- size: 71,769,604 bytes
- inline scripts: 6
- inline styles: 2
- embedded data:image references: 356
- script lengths: 649419, 28468572, 605, 38104896, 28065, 7321
- style lengths: 4503528, 5961

PGN.zip
- size: 91,629,825 bytes
- ZIP entries: 45
- PNG assets: 44
```

- [ ] **Step 5: Run tests**

Run:

```bash
python -m unittest tests/test_extract_offline_build.py
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools tests docs/migration/source-inventory.md docs/migration/recovery-manifest.json
git commit -m "build: add Jalan Dao recovery tooling"
```

---

### Task 2: Replace the Placeholder with the Recovered v8.1 Runtime

**Files:**
- Replace: `index.html`
- Create: `css/recovered/app.css`
- Create: `css/recovered/v8.css`
- Create: `js/recovered/app.bundle.js`
- Create: `js/recovered/assets-core.js`
- Create: `js/recovered/error-fallback.js`
- Create: `js/recovered/assets-v8.js`
- Create: `js/recovered/v8-draft.js`
- Create: `js/recovered/v8.1.js`
- Create: `tests/test_recovered_runtime.py`

**Interfaces:**
- Consumes: `extract_offline(...)` from Task 1.
- Produces: a directly playable static recovery build at repository root.

- [ ] **Step 1: Add runtime-contract tests**

```python
# tests/test_recovered_runtime.py
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_index_loads_recovered_runtime_in_order():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    order = [
        "js/recovered/app.bundle.js",
        "js/recovered/assets-core.js",
        "js/recovered/error-fallback.js",
        "js/recovered/assets-v8.js",
        "js/recovered/v8-draft.js",
        "js/recovered/v8.1.js",
    ]
    positions = [html.index(path) for path in order]
    assert positions == sorted(positions)
    assert '<div id="root">' in html

def test_recovered_contracts_exist():
    app = (ROOT / "js/recovered/app.bundle.js").read_text(encoding="utf-8")
    v81 = (ROOT / "js/recovered/v8.1.js").read_text(encoding="utf-8")
    assert "jalan-dao-save" in app
    assert "Anak Pemimpin Sekte" in app
    assert "Bestiari" in app
    assert "window.JalanDaoV81" in v81
    assert "discoverBeast" in v81
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
python -m unittest tests/test_recovered_runtime.py
```

Expected: FAIL because the recovered runtime files are not present.

- [ ] **Step 3: Execute extraction against the real v8.1 source**

Run:

```bash
python tools/extract_offline_build.py   --source /path/to/Jalan_Dao_v8.1_Offline.html   --output .
```

The generated `index.html` replaces the temporary GitHub Edition landing page.

- [ ] **Step 4: Verify extraction sizes before committing**

Run:

```bash
python tools/hash_sources.py --manifest docs/migration/recovery-manifest.json
```

Expected checks:
- 6 scripts found;
- 2 styles found;
- all generated SHA-256 values match the extraction manifest;
- no extracted file is empty;
- `app.bundle.js` contains `saveVersion:19`;
- `v8.1.js` exposes `window.JalanDaoV81`.

- [ ] **Step 5: Run tests**

```bash
python -m unittest tests/test_extract_offline_build.py tests/test_recovered_runtime.py
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html css/recovered js/recovered docs/migration/recovery-manifest.json tests
git commit -m "feat: recover Jalan Dao v8.1 runtime"
```

---

### Task 3: Enforce Static Independence from SiteGPT

**Files:**
- Create: `tools/audit_static_runtime.py`
- Create: `tests/test_static_independence.py`
- Modify: `404.html`
- Modify: `README.md`
- Modify: `MIGRATION.md`

**Interfaces:**
- Consumes: repository runtime files.
- Produces: `audit_runtime(root: Path) -> list[str]` where an empty list means no forbidden SiteGPT dependency.

- [ ] **Step 1: Write independence tests**

```python
# tests/test_static_independence.py
from pathlib import Path
from tools.audit_static_runtime import audit_runtime

ROOT = Path(__file__).resolve().parents[1]

def test_no_sitegpt_runtime_dependency():
    assert audit_runtime(ROOT) == []

def test_404_is_local():
    html = (ROOT / "404.html").read_text(encoding="utf-8").lower()
    assert "chatgpt.site" not in html
    assert "http-equiv=\"refresh\"" not in html
```

- [ ] **Step 2: Run and verify failure**

```bash
python -m unittest tests/test_static_independence.py
```

Expected: FAIL until the audit tool and local 404 behavior exist.

- [ ] **Step 3: Implement the audit**

The audit must scan runtime `.html`, `.css`, and `.js` files and reject:

```python
FORBIDDEN = [
    "jalan-dao-xianxia.jofferyjr.chatgpt.site",
    "<iframe",
    "http-equiv=\"refresh\"",
]
```

Also reject JavaScript forms matching:
- `fetch("https://...chatgpt.site`
- `location.href = "https://...chatgpt.site`
- `window.open("https://...chatgpt.site`

Documentation files under `docs/` are exempt because they may mention the historical URL.

- [ ] **Step 4: Make `404.html` local-only**

Use:

```html
<!doctype html>
<meta charset="utf-8">
<title>Jalan Dao</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<main>
  <h1>Halaman tidak ditemui</h1>
  <p><a href="./">Kembali ke Jalan Dao</a></p>
</main>
```

- [ ] **Step 5: Run tests**

```bash
python -m unittest tests/test_static_independence.py
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/audit_static_runtime.py tests/test_static_independence.py 404.html README.md MIGRATION.md
git commit -m "test: enforce standalone GitHub runtime"
```

---

### Task 4: Import and Manifest the PGN Visual Assets

**Files:**
- Create: `tools/import_pgn_assets.py`
- Create: `assets/items/` with 44 PNG files
- Create: `data/manifests/pgn-assets.json`
- Create: `tests/test_pgn_assets.py`
- Create: `docs/migration/asset-manifest.md`

**Interfaces:**
- Consumes: `PGN.zip`.
- Produces: `import_pgn(zip_path: Path, output_root: Path) -> list[dict]` with one manifest entry per PNG.

- [ ] **Step 1: Write the asset-import test**

```python
# tests/test_pgn_assets.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_pgn_manifest_has_all_44_assets():
    data = json.loads((ROOT / "data/manifests/pgn-assets.json").read_text())
    assert len(data["assets"]) == 44
    assert len({a["id"] for a in data["assets"]}) == 44
    for asset in data["assets"]:
        path = ROOT / asset["path"]
        assert path.is_file()
        assert path.stat().st_size > 1000
        assert asset["path"].startswith("assets/items/")
```

- [ ] **Step 2: Run and verify failure**

```bash
python -m unittest tests/test_pgn_assets.py
```

Expected: FAIL because the manifest and assets are not present.

- [ ] **Step 3: Implement deterministic import**

`import_pgn_assets.py` must:
- ignore the `PGN/` directory entry;
- import exactly 44 PNGs;
- slug filenames with lowercase ASCII and hyphens;
- preserve the original Malay display name in `name`;
- create entries of this form:

```json
{
  "id": "orkid-kulit-besi-emas",
  "name": "Orkid kulit besi emas",
  "category": "item-art",
  "path": "assets/items/orkid-kulit-besi-emas.png",
  "source": "PGN.zip"
}
```

- [ ] **Step 4: Run the importer**

```bash
python tools/import_pgn_assets.py   --source /path/to/PGN.zip   --output .
```

- [ ] **Step 5: Generate human-readable asset manifest**

`docs/migration/asset-manifest.md` must group the 44 assets into:
- herbs/materials;
- ores/ingots;
- weapons/artifacts;
- Bestiary;
- Portal Laut fragments and complete-key art.

- [ ] **Step 6: Run tests**

```bash
python -m unittest tests/test_pgn_assets.py
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tools/import_pgn_assets.py assets/items data/manifests/pgn-assets.json tests/test_pgn_assets.py docs/migration/asset-manifest.md
git commit -m "feat: import Jalan Dao PGN assets"
```

---

### Task 5: Add Deterministic 8.1.x Reconstruction Patching

**Files:**
- Create: `tools/patch_recovered_bundle.py`
- Create: `patches/v8.1.3.json`
- Create: `js/reconstructed/v8.1.3-runtime.js`
- Create: `css/reconstructed/v8.1.3.css`
- Create: `tests/test_v813_patch.py`
- Modify: `index.html`

**Interfaces:**
- Consumes: recovered `js/recovered/app.bundle.js` plus exact patch anchors.
- Produces: transformed `js/reconstructed/app.bundle.v813.js` and non-invasive runtime extension `window.JalanDaoGitHub813`.

- [ ] **Step 1: Add one-match patch tests**

```python
# tests/test_v813_patch.py
from pathlib import Path
from tools.patch_recovered_bundle import apply_patches

ROOT = Path(__file__).resolve().parents[1]

def test_every_patch_anchor_matches_once(tmp_path):
    source = (ROOT / "js/recovered/app.bundle.js").read_text(encoding="utf-8")
    result, report = apply_patches(
        source,
        ROOT / "patches/v8.1.3.json",
    )
    assert all(item["matches"] == 1 for item in report)
    assert "JALAN_DAO_GITHUB_8_1_3" in result
```

- [ ] **Step 2: Create patch metadata with exact source anchors**

`patches/v8.1.3.json` must contain exact `before` and `after` strings, never regex-only fuzzy replacement.

Required anchors include:
- talent data array beginning with `l_=[{id:\`Tekun\``;
- character-state initialization containing `(0,C.useState)(\`Tekun\`)`;
- save payload field `talent:g`;
- load normalization `l_.some(e=>e.id===n.talent)?n.talent:\`Tekun\``;
- version marker insert near the recovered game bootstrap.

The transformed model must represent talents as an array with maximum four entries while migrating legacy scalar `talent` saves into a one-entry array.

- [ ] **Step 3: Implement `apply_patches`**

Use:

```python
def replace_once(text: str, before: str, after: str) -> tuple[str, int]:
    matches = text.count(before)
    if matches != 1:
        raise RuntimeError(f"anchor expected once, found {matches}: {before[:80]}")
    return text.replace(before, after, 1), matches
```

The patch tool must output:
- `js/reconstructed/app.bundle.v813.js`;
- `docs/migration/patch-report.json`.

- [ ] **Step 4: Add runtime extensions**

`js/reconstructed/v8.1.3-runtime.js` must expose:

```js
window.JalanDaoGitHub813 = {
  version: "8.1.3-reconstructed",
  maxTalents: 4,
  assetManifest: "./data/manifests/pgn-assets.json",
};
```

It must also:
- attach PGN item-art paths after the base asset globals exist;
- provide the portrait-gallery close-button behavior;
- apply the approved sect-structure edit permission checks;
- keep the existing `window.JalanDaoV81` API intact.

- [ ] **Step 5: Add reconstruction CSS**

`css/reconstructed/v8.1.3.css` must include:
- `max-width:100%` safeguards on game panels;
- `min-width:0` on grid/flex children;
- portrait/item gallery overflow containment;
- minimum readable text contrast for small labels;
- mobile selectors that avoid horizontal viewport expansion.

- [ ] **Step 6: Update index load order**

Load in this order:

```html
<link rel="stylesheet" href="./css/recovered/app.css">
<link rel="stylesheet" href="./css/recovered/v8.css">
<link rel="stylesheet" href="./css/reconstructed/v8.1.3.css">

<script src="./js/reconstructed/app.bundle.v813.js"></script>
<script src="./js/recovered/assets-core.js"></script>
<script src="./js/recovered/error-fallback.js"></script>
<script src="./js/recovered/assets-v8.js"></script>
<script src="./js/recovered/v8-draft.js"></script>
<script src="./js/recovered/v8.1.js"></script>
<script src="./js/reconstructed/v8.1.3-runtime.js"></script>
```

If the recovered original requires asset globals before the app bundle, preserve the original source ordering instead and place the reconstructed bundle at the original app-bundle position. The order test from Task 2 is the authority.

- [ ] **Step 7: Run patch tests**

```bash
python -m unittest tests/test_v813_patch.py tests/test_recovered_runtime.py
```

Expected: PASS with every patch anchor reporting exactly one match.

- [ ] **Step 8: Commit**

```bash
git add tools/patch_recovered_bundle.py patches js/reconstructed css/reconstructed index.html docs/migration/patch-report.json tests/test_v813_patch.py
git commit -m "feat: reconstruct approved Jalan Dao 8.1.x changes"
```

---

### Task 6: Reconstruct Character, Sect, Family, and Item UI Parity

**Files:**
- Modify: `patches/v8.1.3.json`
- Modify: `js/reconstructed/v8.1.3-runtime.js`
- Modify: `css/reconstructed/v8.1.3.css`
- Create: `data/manifests/feature-parity.json`
- Create: `tests/test_feature_parity.py`
- Create: `docs/migration/feature-parity.md`

**Interfaces:**
- Consumes: approved later-version requirements from the spec and recovered bundle anchors.
- Produces: machine-readable parity states `verified`, `reconstructed`, or `unproven`.

- [ ] **Step 1: Create the parity-manifest test**

```python
# tests/test_feature_parity.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CRITICAL = {
    "talents-max-4",
    "true-love-portrait-picker",
    "character-portrait-gallery",
    "sect-structure-editing",
    "sect-leader-permission-boundary",
    "founder-full-edit-rights",
    "ui-width-regression",
    "pgn-herb-ore-key-art",
    "family-contact-corrections",
}

def test_critical_parity_items_are_not_unproven():
    data = json.loads((ROOT / "data/manifests/feature-parity.json").read_text())
    by_id = {item["id"]: item for item in data["items"]}
    assert CRITICAL <= set(by_id)
    assert all(by_id[item]["status"] in {"verified", "reconstructed"} for item in CRITICAL)
```

- [ ] **Step 2: Implement multi-talent behavior**

Patch the recovered state model so:
- `talents` is an array;
- legacy `talent` scalar is migrated;
- selection disables unselected talent cards at four;
- cost calculation sums selected talent costs;
- game effects that previously checked `g === "Rajin"` use membership checks;
- save data writes both `talents` and a compatibility `talent` field containing the first selected talent.

- [ ] **Step 3: Add True Love and portrait picker behavior**

Add `True Love` to the talent table with the approved adult-only rule. The character-creation portrait grid must:
- show age/gender-compatible portraits;
- allow explicit selection;
- expose an X close button;
- persist selected portrait index/source into save state;
- reject True Love-specific partner creation when starting age is below 18.

- [ ] **Step 4: Apply sect editing permissions**

The reconstructed sect editor must implement:

```js
function canEditSectLevel({ isFounder, editorLevel, targetLevel }) {
  if (isFounder) return true;
  return targetLevel < editorLevel;
}
```

The active Sect Leader cannot edit a level at or above their own level. Founder can edit every level except protected non-removable core constraints recorded by the game.

- [ ] **Step 5: Reapply family/contact corrections**

Ensure:
- sibling/cousin relation lines remain consistent;
- uncles/aunts share the correct grandparent line;
- contacts only appear after interaction where the later requirement says so;
- family portrait and gender data remain consistent after save/reload.

- [ ] **Step 6: Bind PGN art to item IDs**

Populate `data/manifests/feature-parity.json` with evidence for herb, ore, key fragment, complete key, Bestiary book, and weapon/artifact image mappings.

- [ ] **Step 7: Fix the width/readability regression**

Apply only layout changes required to stop the previously reported “UI menjadi lebar” regression:
- `overflow-x:hidden` only at the outer app shell;
- scrollable galleries use local `overflow:auto`;
- flex/grid children use `min-width:0`;
- long item and sect names wrap instead of expanding the viewport;
- small text uses opaque foreground colors rather than opacity-based fading.

- [ ] **Step 8: Run parity tests**

```bash
python -m unittest tests/test_feature_parity.py tests/test_v813_patch.py
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add patches js/reconstructed css/reconstructed data/manifests/feature-parity.json docs/migration/feature-parity.md tests/test_feature_parity.py
git commit -m "feat: restore Jalan Dao 8.1.3 feature parity"
```

---

### Task 7: Preserve Save Compatibility and Add Controlled Migration

**Files:**
- Create: `js/reconstructed/save-compat.js`
- Create: `tests/fixtures/save-v81.json`
- Create: `tests/fixtures/save-malformed.json`
- Create: `tests/test_save_contract.py`
- Create: `docs/migration/save-compatibility.md`
- Modify: `index.html`

**Interfaces:**
- Consumes: `jalan-dao-save`, `jalan-dao-life-points`, `jalan-dao-settings`, and later v8.1 state keys.
- Produces: `window.JalanDaoSaveCompat.normalize(save)`.

- [ ] **Step 1: Add save-contract tests**

```python
# tests/test_save_contract.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_recovered_bundle_keeps_primary_save_key():
    app = (ROOT / "js/reconstructed/app.bundle.v813.js").read_text()
    assert "jalan-dao-save" in app
    assert "jalan-dao-life-points" in app
    assert "jalan-dao-settings" in app

def test_v81_fixture_exists_and_is_valid_json():
    save = json.loads((ROOT / "tests/fixtures/save-v81.json").read_text())
    assert "name" in save
    assert "rootGrade" in save
```

- [ ] **Step 2: Add compatibility normalizer**

`save-compat.js` must:
- copy scalar `talent` to `talents:[talent]` when `talents` is missing;
- cap loaded talent arrays at four;
- preserve unknown fields instead of dropping them;
- default missing portrait state without deleting the rest of the save;
- catch malformed JSON at the read boundary and allow a fresh game to render.

- [ ] **Step 3: Load compatibility code before reconstructed UI patches**

Add:

```html
<script src="./js/reconstructed/save-compat.js"></script>
```

before `v8.1.3-runtime.js`.

- [ ] **Step 4: Document origin limitation**

`docs/migration/save-compatibility.md` must explicitly state that browser `localStorage` is origin-scoped, so existing SiteGPT saves do not automatically appear on the GitHub Pages origin.

- [ ] **Step 5: Run tests**

```bash
python -m unittest tests/test_save_contract.py tests/test_recovered_runtime.py
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/reconstructed/save-compat.js index.html tests/fixtures tests/test_save_contract.py docs/migration/save-compatibility.md
git commit -m "feat: preserve Jalan Dao save compatibility"
```

---

### Task 8: Add Browser Smoke Tests for the Real Game

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `tests/e2e/jalan-dao.spec.js`
- Create: `tests/e2e/no-sitegpt.spec.js`

**Interfaces:**
- Consumes: static repository root.
- Produces: automated Chromium checks against `python -m http.server 4173`.

- [ ] **Step 1: Add test-only package configuration**

```json
{
  "name": "jalan-dao-github-tests",
  "private": true,
  "scripts": {
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  }
}
```

- [ ] **Step 2: Add Playwright configuration**

```js
// playwright.config.js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "python -m http.server 4173",
    port: 4173,
    reuseExistingServer: true
  }
});
```

- [ ] **Step 3: Add real-render smoke test**

```js
import { test, expect } from "@playwright/test";

test("Jalan Dao character creation renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText("Jalan Dao");
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.locator("body")).toContainText("Spiritual Root");
  await expect(page.locator("body")).toContainText("Masuki Dunia Kultivasi");
});
```

- [ ] **Step 4: Add SiteGPT-block test**

```js
import { test, expect } from "@playwright/test";

test("game loads with SiteGPT blocked", async ({ page }) => {
  await page.route("**/*.chatgpt.site/**", route => route.abort());
  await page.route("https://jalan-dao-xianxia.jofferyjr.chatgpt.site/**", route => route.abort());
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.locator("body")).toContainText("Jalan Dao");
});
```

- [ ] **Step 5: Add responsive regression test**

At widths `390x844` and `1366x768`:
- assert `document.documentElement.scrollWidth <= window.innerWidth + 1`;
- open portrait selector when available and verify its close button is inside viewport;
- verify small status text has computed opacity `1`.

- [ ] **Step 6: Run browser tests**

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.js tests/e2e
git commit -m "test: add standalone Jalan Dao browser smoke tests"
```

---

### Task 9: Consolidate GitHub Pages Deployment and Gate Release Status

**Files:**
- Modify: `.github/workflows/pages.yml`
- Delete: `.github/workflows/static.yml`
- Create: `.github/workflows/verify.yml`
- Create: `tools/release_audit.py`
- Create: `docs/migration/release-audit.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: static/unit/e2e test suites and parity manifest.
- Produces: CI verification plus a single Pages deployment workflow.

- [ ] **Step 1: Add verification workflow**

`.github/workflows/verify.yml` must run on pushes and pull requests:

```yaml
name: Verify Jalan Dao
on:
  push:
    branches: ["main"]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: python -m unittest discover -s tests -p "test_*.py"
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 2: Remove duplicate deployment workflow**

Delete `.github/workflows/static.yml`.

Keep `.github/workflows/pages.yml` as the only Pages deployment workflow.

- [ ] **Step 3: Add release audit script**

`tools/release_audit.py` must fail when:
- static audit reports SiteGPT dependency;
- any critical parity item is `unproven`;
- required runtime files are missing;
- any manifest-referenced asset is missing;
- `index.html` still contains the old placeholder copy.

- [ ] **Step 4: Generate release audit**

Run:

```bash
python tools/release_audit.py --write docs/migration/release-audit.md
```

The document must separate:
- recovered v8.1 behavior;
- reconstructed 8.1.x behavior;
- any non-critical unproven differences.

- [ ] **Step 5: Gate the visible version label**

Only if `release_audit.py` exits 0 and every critical parity item passes, update the visible game/version copy to:

```text
Jalan Dao · Dunia Xianxia
Versi 8.1.3 · GitHub Standalone Reconstruction
```

If the audit does not pass, use:

```text
Jalan Dao · Dunia Xianxia
GitHub Reconstruction Preview
```

- [ ] **Step 6: Run the full verification suite**

```bash
python -m unittest discover -s tests -p "test_*.py"
npm run test:e2e
python tools/release_audit.py
```

Expected: PASS before version promotion.

- [ ] **Step 7: Commit**

```bash
git add .github tools/release_audit.py docs/migration/release-audit.md README.md index.html
git rm .github/workflows/static.yml
git commit -m "ci: gate standalone Jalan Dao Pages release"
```

---

### Task 10: Final Production Verification on GitHub Pages

**Files:**
- Modify only if verification exposes a real defect.
- Finalize: `docs/migration/release-audit.md`

**Interfaces:**
- Consumes: deployed GitHub Pages build.
- Produces: verified standalone release.

- [ ] **Step 1: Verify repository runtime audit**

Run:

```bash
python tools/audit_static_runtime.py .
python tools/release_audit.py
```

Expected: zero forbidden SiteGPT runtime references and release audit PASS.

- [ ] **Step 2: Verify GitHub Actions**

Confirm both workflows:
- `Verify Jalan Dao` passes;
- `Deploy Jalan Dao to GitHub Pages` passes.

- [ ] **Step 3: Verify live static URL**

Open:

```text
https://jofferyjr.github.io/Cultivation/
```

Verify:
- character creation renders;
- root/talent/background selections operate;
- world entry works;
- save then reload works;
- inventory opens;
- genealogy opens;
- Bestiary opens;
- representative PGN herb, ore, weapon, key-fragment, and complete-key images render;
- no unintended horizontal overflow at desktop or phone viewport.

- [ ] **Step 4: Verify blocked-old-site independence**

Block:

```text
jalan-dao-xianxia.jofferyjr.chatgpt.site
```

Reload the GitHub Pages URL.

Expected: game still loads and is playable from GitHub-hosted files.

- [ ] **Step 5: Finalize release audit**

Add the final deployment commit SHA and the date of verification to `docs/migration/release-audit.md`.

- [ ] **Step 6: Final commit**

```bash
git add docs/migration/release-audit.md
git commit -m "docs: certify standalone Jalan Dao migration"
```

## Self-Review Result

- **Spec coverage:** character creation, roots, talents, True Love, sect editing, family/contact corrections, PGN art, save compatibility, static independence, readability, Pages deployment, and release auditing are all mapped to tasks.
- **Placeholder scan:** no TBD/TODO/fill-later steps are used.
- **Type/interface consistency:** extraction → recovery runtime → reconstruction patch → save compatibility → parity audit → browser verification is sequential and explicit.
- **Review-focus coverage:** script order, project-subpath asset resolution, save migration, patch-anchor drift, and version-label integrity each have an owning test or release gate.
