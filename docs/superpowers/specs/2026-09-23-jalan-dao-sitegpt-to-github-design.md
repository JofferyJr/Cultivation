# Jalan Dao SiteGPT → GitHub Standalone Migration Design

Date: 2026-09-23  
Status: Design approved in chat; awaiting written-spec review  
Target repository: `JofferyJr/Cultivation`  
Deployment target: GitHub Pages, Static HTML  
Target game identity: Jalan Dao · Dunia Xianxia

## 1. Goal

Move Jalan Dao from its SiteGPT-hosted form into GitHub as a real, self-contained web game.

The GitHub build must run from files stored in `JofferyJr/Cultivation`. It must not embed, redirect to, proxy, synchronize with, or fetch the old SiteGPT game at runtime.

Success means a player can open the GitHub Pages deployment and use the game without the old SiteGPT page being available.

## 2. Non-goals

This migration will not:

- keep SiteGPT and GitHub automatically synchronized;
- use an iframe or wrapper page around the old site;
- label an older build as v8.1.3 when its actual content does not match;
- replace working game systems with a simplified landing page;
- intentionally discard save compatibility, images, or implemented systems merely to reduce repository size.

## 3. Verified migration inputs

The following local/project inputs are currently available:

1. `Jalan_Dao_v8.1_Offline.html`
   - approximately 71.8 MB;
   - self-contained offline HTML;
   - title identifies it as Jalan Dao v8.1;
   - contains embedded scripts, styles, and hundreds of embedded image data references.

2. `PGN.zip`
   - approximately 91.6 MB;
   - 44 PNG runtime/source visual assets plus its directory entry;
   - includes herbs, ores, weapons, artifacts, Bestiary art, Portal Laut fragments, and related game visuals.

3. `Jalan_Dao_v8.0_Draft_Package.zip`
   - contains the v8.0 offline HTML, README, and an asset-audit JSON;
   - useful as a migration/audit reference, not as the final target build.

4. Existing project records and Site projection
   - preserve text and requirements from later Jalan Dao revisions;
   - can be used to identify later behavior and UI changes;
   - are not treated as an exportable production source bundle.

## 4. Version integrity

The migration has two separate concepts:

- **Recovered base:** the latest complete executable artifact that can actually be extracted and tested.
- **GitHub release version:** the version label shown to players after later changes have been re-applied and verified.

No release may be called v8.1.3 merely because v8.1.3 existed previously. The v8.1.3 label is permitted only after the GitHub build has passed the migration acceptance checklist for the recorded v8.1.1–v8.1.3 changes.

If exact parity with a missing historical production archive cannot be proven, documentation must describe the result as a reconstructed standalone GitHub build rather than a byte-identical archive.

## 5. Architecture

### 5.1 Static-first runtime

The GitHub edition remains a browser-only static game suitable for GitHub Pages.

No server is required for ordinary gameplay. Persistent player progress remains local to the browser unless a future, separately approved feature changes that.

### 5.2 Repository layout

Target structure:

```text
/
├── index.html
├── 404.html
├── .nojekyll
├── css/
│   ├── app.css
│   ├── responsive.css
│   └── accessibility.css
├── js/
│   ├── main.js
│   ├── game/
│   ├── systems/
│   ├── ui/
│   └── data/
├── assets/
│   ├── characters/
│   ├── beasts/
│   ├── items/
│   ├── world/
│   ├── sects/
│   └── ui/
├── data/
│   └── manifests/
├── docs/
│   └── migration/
└── .github/workflows/pages.yml
```

Exact file boundaries may be adjusted during extraction if the bundled v8.1 code cannot safely be split without changing behavior. Behavioral preservation is more important than cosmetic modularity.

### 5.3 Extraction strategy

The v8.1 offline HTML is the executable recovery base.

Migration will:

1. preserve an untouched recovery copy outside the runtime path;
2. extract reusable CSS, JavaScript, data, and image assets where technically safe;
3. convert embedded image data into stable repository asset files where doing so does not break runtime references;
4. keep code bundled when splitting it would create unnecessary behavioral risk;
5. update asset paths to relative GitHub Pages-safe URLs;
6. remove all SiteGPT-specific runtime dependencies.

The first objective is functional parity. Refactoring for elegance is secondary.

## 6. Asset strategy

### 6.1 PGN assets

The 44 PNG assets in `PGN.zip` will be normalized into `assets/items/` or another appropriate runtime category.

Filenames may be made URL-safe, but the manifest must preserve human-readable Malay names and map every renamed file to its game item ID.

### 6.2 Existing embedded visuals

Images already embedded in the v8.1 offline build must be inventoried before replacement.

Rules:

- do not drop an image merely because a newer PGN version exists;
- replace an embedded image only when its target game entity is known;
- keep portraits, maps, Bestiary visuals, sect visuals, backgrounds, item art, and UI art referenced by active game systems;
- reject cropped or broken runtime assets during visual audit.

### 6.3 Asset loading

All runtime URLs must be relative paths so the game works under:

`https://jofferyjr.github.io/Cultivation/`

No root-absolute `/assets/...` paths may be used unless the Pages base path is deliberately handled.

## 7. Required game-system preservation

The migrated build must preserve, where present in the latest reconstructed feature set:

- character creation;
- age, gender, portrait selection, and portrait aging;
- Spiritual Root grade and slot rules;
- grade reroll rules;
- talents, including multi-talent behavior and the configured maximum;
- True Love behavior for eligible adult characters;
- backgrounds and Anak Pemimpin Sekte handling;
- cultivation paths and compatibility;
- attributes and derived combat/cultivation statistics;
- main world map and sub-map/location access;
- fog/exploration progression;
- sect joining, founding, rank, contribution, missions, and internal hierarchy;
- founder/Sect Leader structure editing rules;
- family tree, siblings, cousins, uncles/aunts, spouse, children, and inheritance-related state;
- NPC contacts and same-location interaction rules;
- inventory;
- herbs, ores, weapons, artifacts, talismans, keys, fragments, books, and related item visuals;
- Bestiary progression;
- spirit-beast encounter logic;
- merchants and buy/sell flow;
- cross-sect organization features;
- world news;
- Portal Laut, seven key fragments, complete key, portal consumption, and Sea World access;
- annual/random event timing associated with the Sea World system;
- settings, Help & Tips, and Dev Mode protection;
- browser save/load and migration of supported older saves.

This list is an acceptance checklist, not permission to invent missing systems. Each item must be traced either to executable behavior or to a later approved project record before implementation.

## 8. Later-version reconstruction

Changes after the recovered v8.1 artifact will be reapplied from approved project records and available assets.

Known later requirements include, at minimum:

- corrected sect-room visuals;
- dedicated sect-structure editing from the appropriate sect hall;
- founder able to edit all structural levels, Sect Leader limited below their own level;
- True Love portrait selection during character creation;
- character-creation portrait gallery UI with close control;
- multiple selectable talents, capped at four;
- missing herb, ore, key-fragment, complete-key, and related item images integrated into runtime;
- UI-width overflow regression corrected;
- contact/family relationship corrections recorded for the later build;
- retained Portal Laut and Bestiary changes from the 8.1.x line.

During implementation, every later change must receive a traceable entry in `docs/migration/feature-parity.md`.

## 9. Save compatibility

The migration must preserve existing browser save semantics where possible.

Requirements:

- keep current known localStorage keys unless changing them is necessary;
- if a key or schema changes, provide a deterministic migration step;
- never silently wipe an existing compatible save;
- malformed saves must fail safely rather than breaking initial page load;
- GitHub Pages origin is different from the old SiteGPT origin, so browser storage from the old site will not automatically appear on GitHub.

If save import/export is available in the recovered build, retain it. If it is not available, adding a new transfer mechanism is outside this migration unless separately approved.

## 10. GitHub Pages deployment

Deployment remains Static HTML through GitHub Actions.

Requirements:

- deploy repository runtime files only;
- no Jekyll processing;
- no build step that depends on private SiteGPT infrastructure;
- workflow failure must be visible in GitHub Actions;
- `404.html` must not redirect to the old site;
- GitHub deployment must be independently testable with the old site unavailable.

## 11. UI and readability

The migrated game must preserve the game's intended Xianxia presentation while fixing obvious migration regressions.

Minimum readability requirements:

- normal body text has sufficient foreground/background contrast;
- small labels remain legible on desktop and phone layouts;
- panels do not create accidental horizontal page expansion;
- portrait/item selectors do not overflow the viewport;
- controls remain usable at narrow mobile widths;
- important game text is not rendered with low-opacity blur-like styling.

Readability fixes must not replace the actual game UI with a generic landing page.

## 12. Validation

### 12.1 Static checks

Audit for:

- old SiteGPT domain references;
- iframe tags;
- redirect meta tags;
- runtime fetches to the SiteGPT origin;
- broken relative assets;
- missing manifest entries;
- duplicate IDs/paths caused by extraction.

Acceptance: zero runtime dependencies on the old site.

### 12.2 Functional smoke test

At minimum:

1. open the GitHub Pages URL from a clean browser profile;
2. create a character;
3. select portrait, roots, talents, background, and cultivation path;
4. enter the world;
5. save and reload;
6. move/explore the map;
7. open inventory;
8. enter or interact with a sect when requirements are met;
9. open genealogy;
10. open Bestiary;
11. verify settings;
12. verify representative PGN item images;
13. exercise Portal Laut/key state using a controlled test save or Dev Mode where appropriate.

### 12.3 Responsive test

Check representative desktop and mobile viewport widths for:

- no unintended horizontal scrolling;
- readable text;
- accessible close buttons;
- usable portrait and item grids;
- stable sect-structure layout.

### 12.4 Offline/static independence test

Block access to the old SiteGPT domain and reload the GitHub build.

Acceptance: gameplay still loads from GitHub-hosted files.

## 13. Migration documentation

Create and maintain:

- `docs/migration/source-inventory.md`
- `docs/migration/asset-manifest.md`
- `docs/migration/feature-parity.md`
- `docs/migration/save-compatibility.md`
- `docs/migration/release-audit.md`

The final release audit must state which behavior was recovered from the executable v8.1 artifact, which later changes were reconstructed, and which items—if any—could not be proven identical to the historical SiteGPT production archive.

## 14. Release criteria

The GitHub edition is ready to replace the current placeholder page only when:

- the real game loads from repository files;
- there is no iframe, redirect, bridge, or runtime SiteGPT dependency;
- required images load from the repository;
- character creation and world entry work;
- save/reload works on the GitHub origin;
- core UI is readable and responsive;
- the feature-parity checklist has no unexplained critical gaps;
- GitHub Pages deployment succeeds;
- the old SiteGPT domain can be blocked without breaking the GitHub game.

Only after these checks pass may the repository describe the game as the standalone migrated Jalan Dao build.
