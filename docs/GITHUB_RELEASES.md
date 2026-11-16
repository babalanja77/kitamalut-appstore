# KITAMALUT APP STORE — GitHub Releases (Rancangan + Integrasi DEMO)

**Status 16 November 2026:** kode untuk memverifikasi unduhan telah dibuat dan diuji memakai data mock. Belum ada upload APK, pemindaian malware, login Owner, publikasi release, penyimpanan file staging, atau deployment. Jangan menerbitkan APK berdasarkan prototipe ini.

## Tujuan

- APK publik disimpan di **GitHub Releases** pada repository `babalanja77/kitamalut-appstore`.
- Website dan API akan dihosting Netlify ketika Owner memberikan persetujuan deploy.
- Metadata, keputusan Owner/Admin, identitas aset, dan audit ada di PostgreSQL Neon.
- Hindari Cloudflare R2 dan jangan menaruh token GitHub di frontend atau repository.

## Mengapa upload belum diaktifkan

GitHub Releases publik bukan tempat karantina. File berbahaya yang terlanjur menjadi release publik bisa diunduh langsung melewati website, bahkan setelah katalog menariknya. APK juga dapat melampaui batas request Netlify Functions. Karena itu belum dibuat endpoint upload APK atau klaim "upload sukses".

Alur produksi yang disarankan:
1. Owner masuk dengan login server yang diautentikasi dan MFA.
2. Owner mengisi metadata; APK masuk ke penyimpanan **staging privat yang benar-benar terisolasi**. Pilihan ekonomis: repository GitHub kedua yang **private**, dengan proses upload oleh Owner langsung melalui GitHub UI atau mekanisme autentikasi terdelegasi yang aman; jangan gunakan token personal di browser.
3. Pemeriksaan APK berjalan melalui sistem terisolasi: magic bytes/ZIP, struktur manifest, nama package, versionCode, fingerprint penandatangan, SHA-256, dan pemindaian malware; audit semua langkah dan persetujuan.
4. Owner menyetujui publikasi; proses server membuat GitHub Release dan menambahkan APK yang lolos pemeriksaan. Sebelum rilis asli, uji akses, ukuran file, timeout, dan batas API GitHub.
5. Simpan `github_release_id`, `github_asset_id`, `github_release_tag`, `github_asset_name`, ukuran, SHA-256, dan status di database Neon.
6. Katalog menampilkan hanya release `published` yang lolos scan. `GET /api/download/:slug` memeriksa DB, kemudian GET GitHub Release, mencocokkan ID release, tag, ID aset, nama, ukuran, `digest`, dan URL GitHub resmi. Hanya bila cocok mengembalikan HTTP 302.
7. Jika ada APK yang ditarik, sembunyikan dari katalog **dan** hapus/arsipkan aset di GitHub melalui proses moderasi. Menarik listing saja tidak mencabut link GitHub langsung.

## Prinsip keamanan

- Endpoint `/api/download/:slug` hanya GET dan **tidak menerima URL sumber** dari query/klien.
- Tidak ada kredensial GitHub di frontend. Bacaan GitHub Release publik tidak membutuhkan token.
- GitHub REST API dijalankan hanya di server; verifikasi `digest` SHA-256 wajib ada, jika tidak maka **gagal tertutup**.
- Proses `published` di Neon membutuhkan `scan_status='passed'`, persetujuan admin/owner, dan data verifikasi APK melalui constraint database DEMO.
- Test suite mencakup file ditukar, digest berbeda, URL tidak sah, draft, prerelease, dan rilis hilang.
- Perlu kebijakan hak cipta, privasi, data pengguna, penanganan laporan malware, rate limit, retensi, dan audit sebelum situs menerima pengguna.

## Deployment sengaja ditahan

Netlify DEMO **belum di-deploy** dan belum ditautkan ke GitHub secara otomatis. `DATABASE_URL` belum dikonfigurasi; semua tombol Owner pada prototipe masih berupa simulasi lokal. Tidak ada GitHub Release yang diciptakan atau dipublikasikan dalam pekerjaan ini.

## Uji lokal

```bash
npm run check
npm test
npm run build
```

Test menggunakan mock GitHub API, bukan koneksi aktual ke APK/Rilis produksi.

Dokumentasi resmi:
- https://docs.github.com/en/rest/releases/assets
- https://docs.github.com/en/rest/releases/releases
- https://docs.netlify.com/build/functions/configuration/