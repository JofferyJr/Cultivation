# Boundless Cultivation v8.1.5 · Dunia Xianxia

Repository rasmi **GitHub standalone** untuk Boundless Cultivation.

- Current game version: **8.1.5**
- Current save format: **saveVersion 30**
- Previous v8.1.4 saves: **migrated automatically**
- Deployment: **GitHub Pages / Static HTML**
- Runtime source: `site/`
- Auto-sync with the former SiteGPT site: **disabled**

## Sorotan 8.1.5

- **Kertas Pemilihan Muka** untuk muka pemain dan pasangan True Love, dengan grid responsif 6/4/2.
- Pemain boleh memilih **1–4 bakat** dan kesannya digunakan secara additive.
- **True Love** kekal untuk usia 18+; menurunkan usia hanya membuang bakat itu.
- Save baharu menggunakan **saveVersion 30** sambil mengekalkan migrasi v8.1.4.
- Inventory lama di-hydrate semula daripada katalog canonical supaya art dan data item boleh dipulihkan.
- Pembaikan layout dibuat tanpa menyembunyikan horizontal overflow pada `body`.

## Play

https://jofferyjr.github.io/Cultivation/

## Standalone status

GitHub Edition tidak iframe, redirect, proxy, fetch, atau auto-sync daripada SiteGPT. Semua runtime release mesti datang daripada fail repository ini.

## Verification

CI memeriksa unit regression, release audit, static independence dan browser smoke test Playwright dengan domain SiteGPT disekat.

GitHub Pages deploys hanya direktori `site/`.
