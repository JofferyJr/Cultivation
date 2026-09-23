# Jalan Dao migration status

## Target

Move the current Jalan Dao web build into `JofferyJr/Cultivation` and make it deployable with GitHub Pages.

## Verified sources currently available

- Live project URL: https://jalan-dao-xianxia.jofferyjr.chatgpt.site
- Offline build available in Library: Jalan Dao v8.1
- PGN visual pack available in Library
- The ChatGPT Site projection is readable as rendered text, but its production source bundle is not exportable through the available connector.

## Important

The repository must **not** label the older v8.1 offline HTML as v8.1.3.

Until the actual v8.1.3 production source/package is available, `index.html` acts as a bridge to the live project. When the correct package is recovered, replace the bridge with the self-contained GitHub build and retain this file as migration history.

## GitHub Pages

A Pages workflow is included under `.github/workflows/pages.yml`. It deploys the repository root as a static site.
