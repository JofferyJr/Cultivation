# Boundless Cultivation migration record

## Result

The game, formerly published as Jalan Dao and now named Boundless Cultivation, was copied from the published SiteGPT build into `JofferyJr/Cultivation` as a static, standalone GitHub Pages runtime.

The actual production snapshot identifies the live game runtime as **8.1.4** with **saveVersion 29**. Earlier planning referenced 8.1.3 because that was the latest documented target before the production bundle itself became recoverable. The production bundle is authoritative for this migration because the user's requirement is to copy the published site itself.

## Snapshot evidence

- Runtime files copied: **72**
- Snapshot fetch failures: **0**
- External runtime references discovered by the snapshot crawler: **0**
- Cloudflare/SiteGPT challenge injection: removed as hosting-only code
- Game runtime directory: `site/`
- GitHub Pages project base: `/Cultivation`

## Independence

The one-time snapshot workflow has been removed. The GitHub project no longer re-fetches or synchronizes with the former site.

Runtime auditing rejects:
- the former SiteGPT host;
- iframe embedding;
- refresh redirects;
- direct fetch/navigation back to SiteGPT.

## Deployment

`.github/workflows/pages.yml` deploys only `site/`.

`.github/workflows/verify-migration.yml` runs unit tests, release auditing, and an interactive Playwright smoke test before the migration is considered verified.
