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
- Upload APK dan media ke Cloudflare R2; penyimpanan Neon.
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
- Cloudflare R2: **belum tersedia**; Cloudflare mengembalikan pesan harus mengaktifkan R2 lewat dashboard. Pengaktifan memerlukan pemilik akun.
- Kredensial koneksi Neon → Netlify tidak berhasil disetel otomatis karena pembatasan keamanan. Tidak ada password yang ditampilkan atau disimpan dalam repo.
- `netlify/functions/apps.mjs` hanya akan menyajikan aplikasi yang benar-benar terbit dan telah lolos scan. Tidak ada data demo terbit dalam database.
- Formulir dashboard Owner saat ini masih simulasi berbasis `localStorage`, **bukan** CRUD Neon; login, upload, scan dan download APK sungguhan belum tersedia.
- Build dengan `npm run build`; direktori `dist/` hanya berisi HTML/CSS/JS agar dokumentasi dan schema tidak dipublikasikan sebagai aset.
- **Jangan deploy ke publik atau mengisi DATABASE_URL produksi sebelum autentikasi admin, mekanisme scan, R2 privat, dan QA diterapkan.**