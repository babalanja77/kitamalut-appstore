# KITAMALUT APP STORE — Dokumen Rancangan Produk (v0.1)

> **Status:** RANCANGAN + PROTOTIPE FRONTEND LOKAL. **Belum deploy, belum ada backend/database, belum ada mekanisme pengamanan APK yang aktif.** Nama-nama aplikasi dan statistik pada prototipe adalah contoh fiktif/ilustratif dan bukan publikasi aplikasi riil.

## 1. Keputusan Produk

- Nama publik: **KITAMALUT APP STORE**.
- Domain usulan: **apps.kitamalut.com** (belum disetup).
- **Hanya Owner/Admin yang dapat mengunggah, merevisi, menyetujui, menerbitkan atau menarik aplikasi. Tidak ada pendaftaran developer mandiri.**
- Toko dibuka sebagai website responsif untuk Android dan desktop; versi APK aplikasi toko sendiri merupakan opsi tahap lanjut.
- Tahap pertama hanya mendukung Android APK. Aplikasi web/PWA dapat menjadi kategori/tipe terpisah setelah alur Android stabil.
- **DEMO dan ASLI (produksi) harus memakai database dan bucket terpisah.** Publikasi perubahan dari DEMO ke ASLI membutuhkan persetujuan Owner.
- Tema UI: putih-biru-toska, ringan dan responsif, tersedia dark mode.

## 2. Ruang Lingkup MVP (Tahap 1)

### Publik
1. Beranda: hero banner, featured, populer, terbaru, kategori.
2. Cari aplikasi; filter kategori; urut populer/terbaru/A-Z.
3. Detail: nama, developer, ikon, banner, screenshot, deskripsi, changelog, versi, ukuran file, minimum Android, tanggal update, SHA-256, tautan download.
4. Download APK hanya untuk release yang berstatus `published`, lolos pemeriksaan dan memiliki izin distribusi.
5. Kebijakan privasi, ketentuan layanan, lapor aplikasi, informasi kontak.

### Owner/Admin
1. Masuk dengan username dan password. Password dihash **Argon2id** di backend. MFA (TOTP/passkey) diwajibkan untuk Owner pada produksi.
2. Dashboard ringkasan aplikasi, versi, unggahan tertunda, download (event yang terukur), aktivitas admin.
3. CRUD metadata aplikasi dan pengelolaan kategori.
4. Upload ikon, screenshot, banner, dan APK, dengan preview.
5. Setiap versi mempunyai `version_code`, `version_name`, `min_sdk`, paket ID, file size, changelog, SHA-256, fingerprint signing certificate.
6. Status draft, karantina, review, siap terbit, terbit, ditarik, ditolak.
7. Konfigurasi beranda, aplikasi unggulan, urutan kategori.
8. Audit log append-only dan hak akses per role.

### Yang tidak dimasukkan MVP
- Akun pengunjung, ulasan, payment, iklan berbayar, developer self-service, sinkronisasi otomatis update ke Android, installer APK native.

## 3. Hak Akses

| Aksi | Pengunjung | Admin | Owner |
|---|---:|---:|---:|
| Cari, lihat, unduh yang diterbitkan | Ya | Ya | Ya |
| Tambah/edit aplikasi dan metadata | Tidak | Ya | Ya |
| Unggah APK ke karantina | Tidak | Ya | Ya |
| Lihat hasil review dan scan | Tidak | Ya | Ya |
| Tanda siap terbit | Tidak | Ya (setelah lolos scan) | Ya |
| Terbitkan atau tarik aplikasi | Tidak | Sesuai izin Owner | Ya |
| Kelola akun Admin / peran | Tidak | Tidak | Ya |
| Pengaturan sistem dan kunci | Tidak | Tidak | Ya |
| Hapus/ubah audit log | Tidak | Tidak | Tidak |

**Prinsip:** akses harus dicek pada setiap endpoint server; menyembunyikan tombol frontend tidak mengamankan API.

## 4. Arsitektur Produksi yang Direncanakan

```text
Browser Pengunjung/Owner
        |
  Netlify (frontend responsif)
        |
  Netlify Functions / API server
       /|\
      / | \
 Neon PostgreSQL  R2 Private  Scan worker terpisah
 (data, audit)   (APK/media)  (APK verification + AV)
      \ | /
   Owner approval server-side
           |
    Publikasi release aman
           |
  R2 protected download / CDN
```

- Frontend: React + TypeScript + Vite (bisa diputuskan saat implementasi); prototipe saat ini memakai HTML/CSS/JS murni agar mudah dibuka offline.
- API server: endpoint di Netlify Functions. **Jangan upload APK besar melalui request body Netlify Function.** Buat upload intent di server dan upload langsung dari browser ke R2 privat menggunakan *presigned PUT* terbatas.
- Database: Neon Postgres dengan user aplikasi least privilege dan koneksi terenkripsi; variabel rahasia hanya ada di sisi server.
- Object storage: Cloudflare R2 dua bucket terpisah: `quarantine` private dan `releases` publik-terkendali/privat; DEMO dan PRODUKSI tidak berbagi bucket.
- Background scan: worker/queue terpisah. Jangan mengeksekusi APK. Pemeriksaan file APK harus dijalankan dalam sandbox dengan pembatasan CPU/memori/IO.
- Deploy pipeline: GitHub → preview Netlify (DEMO) → pengujian → approval Owner → rilis ASLI. Tidak ada deploy yang dilakukan dalam tugas ini.

## 5. Alur Upload APK Produksi

1. Admin login; server memverifikasi session, role, CSRF protection dan rate limit.
2. Admin isi identitas aplikasi; package ID tidak boleh bentrok.
3. Admin membuat rilis baru (nomor versi dan `version_code`).
4. Server membuat `upload_intent` dan object key acak di bucket karantina, dengan limit ukuran dan masa berlaku pendek.
5. Browser upload langsung ke R2 lewat signed PUT dan CORS origins yang diizinkan.
6. Server melakukan HEAD object untuk verifikasi ukuran dan tipe, lalu mengantrikan scan.
7. Worker memeriksa: magic bytes ZIP/APK, struktur APK/manifest, package ID, versionCode, minSdk, `apksigner verify`, signing certificate, SHA-256, perlindungan zip bomb, dan malware scanning. `Content-Type` atau ekstensi saja tidak cukup.
8. Untuk versi pembaruan, **package ID dan signing certificate harus sesuai** dengan versi terpercaya sebelumnya; `version_code` harus lebih tinggi (jika tidak, tolak).
9. Status scan `passed` bukan berarti aplikasi pasti aman. Admin review izin distribusi, perubahan, izin Android yang sensitif, dan informasi produk.
10. Admin terotorisasi menekan Terbitkan. Transaksi DB harus mematikan rilis lama dan mengaktifkan rilis baru secara atomik; object rilis dikopi/ditandai dari karantina ke lokasi distribusi terkontrol.
11. Download diberikan hanya bila status terbaru masih `published`; verifikasi cek DB pada setiap permintaan (atau strategi revokasi token yang sesuai).
12. Bila terdeteksi masalah: **tarik** rilis, blokir download baru, simpan audit log dan informasikan pengguna sesuai insiden.

### Catatan URL unduhan
- Presigned URL atau signed CDN access sebaiknya berumur pendek. Jangan menaruh raw R2 credentials atau presigned write URL dalam database publik.
- Mengeluarkan link download **bukan** bukti file berhasil terunduh; statistik harus membedakan `link_issued`, `download_started`, dan `download_completed` bila pengukuran selesai tersedia.

## 6. Rancangan Endpoint API

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/api/apps` | Publik | Daftar app published, filter, pagination |
| GET | `/api/apps/:slug` | Publik | Detail + release published |
| POST | `/api/apps/:id/download` | Publik | Validasi status dan keluarkan URL unduh sementara |
| POST | `/api/auth/login` | Publik dengan rate limit | Login admin |
| POST | `/api/auth/logout` | Owner/Admin | Revoke session |
| GET | `/api/admin/overview` | Owner/Admin | KPI operasional |
| POST | `/api/admin/apps` | Owner/Admin | Tambah metadata |
| PATCH | `/api/admin/apps/:id` | Owner/Admin | Edit metadata |
| POST | `/api/admin/apps/:id/releases` | Owner/Admin | Buat draft versi |
| POST | `/api/admin/releases/:id/upload-intent` | Owner/Admin | Signed PUT upload ke karantina |
| POST | `/api/admin/releases/:id/upload-complete` | Owner/Admin | Verifikasi object & antre scan |
| POST | `/api/admin/releases/:id/approve` | Owner sesuai kebijakan | Verifikasi hasil scan+approval |
| POST | `/api/admin/releases/:id/publish` | Owner/admin berizin | Publikasi atomik |
| POST | `/api/admin/releases/:id/withdraw` | Owner/admin berizin | Tarik rilis |
| GET | `/api/admin/audit-events` | Owner | Audit log read-only |
| PATCH | `/api/admin/config` | Owner | Konfigurasi beranda |

Semua endpoint tulis harus validasi schema, session, role, object ownership, dan *idempotency*; setiap tindakan sensitif masuk audit log server.

## 7. Skema Data

Lihat `schema.sql`. Entitas utama:
- `admin_users` — akun Owner/Admin.
- `categories` — kategori katalog.
- `apps` — identitas aplikasi, teks, ikon dan developer.
- `releases` — versi APK, checksum, sertifikat, hasil scan dan workflow.
- `app_media` — screenshot/banner/icon (object key).
- `upload_intents` — izin upload sementara.
- `download_events` — event statistik dengan klasifikasi yang benar.
- `audit_events` — histori append-only.

**Catatan sebelum menjalankan SQL:** Review kebijakan migrasi, timezone, retention, keberhasilan upload atomik, pembatasan akun DB, dan backfill. Unique index `one_published_version_per_app` mengharuskan proses pergantian versi dilakukan melalui transaksi yang benar (status lama lebih dulu diubah di dalam transaksi yang sama sebelum rilis baru diaktifkan).

## 8. Kontrol Keamanan Minimum

- OWASP File Upload Cheat Sheet: allowlist extension, magic file signature, nama file acak, batas ukuran, otorisasi server, storage terpisah, antivirus dan pembatasan decompression.
- OWASP ASVS/Top 10: authorization pada tiap request, login rate limit, MFA Owner, rotasi secret, proteksi CSRF jika memakai cookie, CSP dan security headers.
- Password dengan Argon2id server-side, cookie HttpOnly + Secure + SameSite, session revoke, reset akses manual Owner.
- Transport HTTPS, izin CORS ketat, URL upload read/write berumur pendek, bucket private.
- Hindari kredensial atau detail kerentanan disimpan di metadata publik / GitHub.
- Kode aplikasi, dependencies, dan supply-chain CI diverifikasi, tidak hanya APK.
- Catat siapa mengunggah, meninjau, menerbitkan, atau menarik tiap versi. Log keamanan tidak dapat disunting admin.
- Policy: hanya APK yang dimiliki/hak distribusinya jelas. Tersedia laporan penyalahgunaan dan proses takedown.
- Ikuti kebijakan verifikasi developer Android, termasuk cakupan dan tanggal penerapannya di Indonesia.

## 9. Matriks Pengujian & Kriteria Rilis

| Uji | DEMO | Catatan |
|---|---|---|
| Beranda desktop dan HP | Frontend prototipe, perlu QA | Browser lokal |
| Pencarian dan filter kategori | Frontend prototipe | Data contoh |
| Detail aplikasi dan gambar | Frontend prototipe | Screenshot contoh |
| Dashboard Owner CRUD metadata | Frontend prototipe | localStorage saja |
| Input file APK | Hanya file picker | File tidak disimpan |
| Login aman / otorisasi | BELUM | Wajib server |
| Upload APK ke R2 | BELUM | Wajib diuji file besar / timeout |
| Antivirus dan signature | BELUM | Wajib worker |
| Publikasi versi atomik | BELUM | Wajib uji transaksi |
| Link unduhan terkontrol | BELUM | Wajib uji pengunduhan |
| Pemisahan DEMO/ASLI | Desain saja | Wajib uji kredensial dan bucket |
| Pengujian Windows Chrome/Edge | Perlu QA | Kompatibilitas |
| Pengujian Android Chrome | Perlu QA | Navigasi, file picker, download |
| Audit akses dan keamanan | BELUM | Wajib sebelum LIVE |

**Aturan rilis:** Semua kontrol keamanan yang berlabel BELUM harus dibuat dan diuji; Owner harus menyetujui hasilnya sebelum rilis produksi.

## 10. Sumber Rujukan Teknis

- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Cloudflare R2 presigned URL: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare R2 CORS: https://developers.cloudflare.com/r2/buckets/cors/
- Android developer verification: https://developer.android.com/developer-verification/guides