# Jalan Dao · Dunia Xianxia

Repository rasmi **GitHub standalone** untuk Jalan Dao.

- Game version migrated from the published build: **8.1.4**
- Save format marker: **saveVersion 29**
- Deployment: **GitHub Pages / Static HTML**
- Runtime source: `site/`
- Auto-sync with the former site: **disabled**

## Play

https://jofferyjr.github.io/Cultivation/

## Standalone status

The game files in `site/` are a one-time production snapshot of the published Jalan Dao build. The GitHub runtime does **not** iframe, redirect to, proxy, or fetch the former SiteGPT deployment.

After the one-time copy completed, the snapshot workflow was removed. Future GitHub changes are independent and do not automatically modify or re-copy the old site.

## Verification

The repository includes:

- static-runtime audit for old-host dependencies;
- release audit for version 8.1.4 and saveVersion 29;
- unit tests for migration tooling;
- a Playwright browser smoke test that blocks the former SiteGPT host, loads `/Cultivation/`, hydrates the game, and opens **Tetapan**.

GitHub Pages deploys only the `site/` directory.
