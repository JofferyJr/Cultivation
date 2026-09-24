# Boundless Cultivation v8.1.5 · Dunia Xianxia

Repository rasmi **GitHub standalone** untuk Boundless Cultivation.

- Game version: **8.1.5**
- Save format: **saveVersion 30**
- Deployment: **GitHub Pages / Static HTML**
- Runtime source: `site/`
- Auto-sync with the former site: **disabled**

## Sorotan 8.1.5

- **Kertas Pemilihan Muka** untuk pemain dan pasangan True Love menggunakan satu helaian responsif yang kekal terbuka selepas pemilihan.
- Pemain boleh memilih **1–4 bakat** dan semua kesan digunakan secara additive.
- **True Love** hanya tersedia apabila usia permulaan sekurang-kurangnya 18 tahun.
- Gambar **9 herba, 10 logam, 7 serpihan Kunci Portal Laut dan 1 kunci lengkap** dipulihkan daripada aset canonical apabila save lama tidak menyimpan art.
- Save v8.1.4 dimigrasi kepada **saveVersion 30** tanpa memadam kemajuan.
- Layout penciptaan watak dibataskan kepada viewport tanpa global `body { overflow-x: hidden; }`.

## Play

https://jofferyjr.github.io/Cultivation/

## Save manager

Tetapan → Permainan mengandungi lima slot manual dengan Simpan, Muat, Padam, Import, Export dan Export Semua. Tiada butang save terapung atau quick-save pada UI utama.

## Verification

Repository menjalankan static-runtime audit, release audit 8.1.5/saveVersion 30, unit tests dan Playwright browser tests untuk hydration, save manager, multi-talent, True Love, Kertas Pemilihan Muka dan kawalan overflow.
