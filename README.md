# KITAMALUT APP STORE — Prototipe Lokal (Tanpa Deploy)

Prototipe interaktif untuk **toko aplikasi Android** dengan dashboard Owner/Admin.

## Mulai Cepat

1. Ekstrak file ZIP.
2. Klik dua kali file `index.html` untuk membukanya di Chrome/Edge pada Windows 10, atau buka melalui browser lokal.
3. Navigasi: **Beranda**, **Semua Aplikasi**, **Detail**, **Dashboard Owner**, **Tambah/Edit**, **Keamanan**, **Riwayat**, **Pengaturan**.
4. Dashboard Owner demo dapat dibuka tanpa login, **bukan autentikasi produksi**.

Bila browser Anda tidak mengizinkan localStorage untuk `file://`, gunakan server lokal:

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Apa yang Berfungsi dalam Demo?

- Tampilan responsif mobile, tablet dan desktop, dark mode.
- Katalog, kategori, pencarian, sort, detail dan mock screenshot.
- Dashboard Owner dengan data fiktif.
- Tambah / edit metadata, status Draft → Review → Siap Terbit → Terbit, tarik aplikasi.
- File picker `.apk`, ikon dan screenshot (preview; file APK **tidak** disimpan).
- Simpan metadata dan pengaturan di localStorage browser. Tidak ada server/API.

## Apa yang Belum Berfungsi?

- Login admin, autentikasi dan otorisasi server.
- Upload APK dan media ke GitHub Releases / staging privat; dashboard belum terhubung ke Neon.
- Malware scan, apksigner, pemeriksaan signature, checksum SHA256 otomatis dan keamanan sesungguhnya.
- Download APK, rating nyata, statistik unduhan nyata, publish internet.
- Kontrol keamanan produksi, logging server, backup, deployment.

**Jangan gunakan prototipe ini sebagai situs publik yang menerima APK.** Lanjutkan implementasi dengan mengikuti `docs/RANCANGAN.md` dan `schema.sql`, lakukan audit keamanan dan uji DEMO sebelum minta persetujuan Owner untuk deployment.

## Struktur

```
index.html          halaman website
styles.css          responsif + tema terang/gelap
app.js              fungsi interaksi lokal dan data demo
schema.sql          rancangan skema Neon PostgreSQL, belum dijalankan
docs/RANCANGAN.md   arsitektur, hak akses, alur APK, keamanan, API, uji rilis
```

**Status:** tidak ada aksi deploy; tidak ada database atau layanan luar yang diubah.

## Penyiapan Integrasi (16 November 2026)

- Repository GitHub: `babalanja77/kitamalut-appstore` (prototipe disimpan, **bukan deploy**).
- Cabang pengembangan GitHub: `demo` (untuk perubahan berikutnya; cek sinkronisasi sebelum penggunaan).
- Neon project: `kitamalut-appstore`; branch DEMO `kitamalut-demo` berisi tabel dasar skema. Cabang produksi tidak diubah.
- Netlify: proyek kosong `kitamalut-appstore-demo` sudah dibuat **tanpa deploy**. Pengaturan build dan **endpoint katalog READ-ONLY** tersedia di kode, tetapi GitHub belum ditautkan sebagai sumber deployment dan `DATABASE_URL` belum dikonfigurasi.
- Cloudflare R2 tidak dipakai. Penyimpanan distribusi APK dialihkan ke GitHub Releases. File staging privat, scanning, dan penerbitan otomatis belum tersedia.
- Kredensial koneksi Neon → Netlify tidak berhasil disetel otomatis karena pembatasan keamanan. Tidak ada password yang ditampilkan atau disimpan dalam repo.
- `netlify/functions/apps.mjs` hanya akan menyajikan aplikasi yang benar-benar terbit dan telah lolos scan. Tidak ada data demo terbit dalam database.
- Formulir dashboard Owner saat ini masih simulasi berbasis `localStorage`, **bukan** CRUD Neon; login, upload, scan dan download APK sungguhan belum tersedia.
- Build dengan `npm run build`; direktori `dist/` hanya berisi HTML/CSS/JS agar dokumentasi dan schema tidak dipublikasikan sebagai aset.
- **Jangan deploy ke publik atau mengisi DATABASE_URL produksi sebelum autentikasi admin, mekanisme scan, staging privat, pemindaian, dan QA diterapkan.**

## Pengembangan DEMO: GitHub Releases

- Pengembangan dilakukan pada GitHub branch `demo`; `main` dan Netlify live tidak disentuh.
- Cabang Neon `kitamalut-demo` mendapatkan metadata GitHub release dan constraint publikasi. Tidak ada perubahan pada Neon production.
- `lib/github-releases.mjs`: pemeriksaan ketat release/asset GitHub sebelum redirect.
- `netlify/functions/download.mjs`: endpoint unduhan baca-saja berdasarkan metadata yang diverifikasi dalam Neon. **Belum dapat dipakai online tanpa deployment dan koneksi DATABASE_URL**.
- `migrations/2026-11-16_github_releases.sql`: perubahan skema untuk Neon DEMO.
- `docs/GITHUB_RELEASES.md`: alur integrasi lengkap, keamanan, batasan, dan pekerjaan lanjutan.
- `npm test`: pengujian mock untuk penolakan unduhan yang tidak cocok.

**Penting:** GitHub Releases publik tidak dapat menjadi karantina malware dan bukan sistem pencabutan akses; menarik aplikasi dari katalog saja tidak menghapus file publik GitHub. Dashboard upload/publish masih prototipe, bukan integrasi server.

## Persiapan tampilan pelanggan (audit 16 November 2026)

**Jangan deploy untuk pelanggan dulu.** Build publik kini terpisah dari dashboard prototype.
- `public/index.html`, `public/store.css`, `public/store.js`, `public/favicon.svg` adalah antarmuka toko yang akan diterima pelanggan.
- `npm run build` menyalin hanya empat file publik tersebut ke `dist/` — prototipe admin, data fiktif, dan tanda DEMO tidak diikutsertakan.
- `public/store.js` membaca hanya endpoint `/api/apps` yang mengembalikan aplikasi telah diverifikasi; saat belum ada aplikasi, tidak ada konten palsu.
- Owner/admin masih memerlukan sistem login dan backend yang benar; dashboard prototype **bukan panel produksi**.
- GitHub Releases tetap hanya penyimpanan **distribusi publik** untuk APK sesudah verifikasi, bukan tempat mengunggah APK karantina.
- Audit readiness lengkap ada di `docs/RELEASE_GATE.md`. Status masih NO-GO; belum ada deploy ataupun publikasi APK.