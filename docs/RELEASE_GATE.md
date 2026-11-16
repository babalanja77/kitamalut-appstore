# KITAMALUT APP STORE — AUDIT KESIAPAN PUBLIKASI (16 November 2026)

## Keputusan
**NO-GO untuk penerbitan toko APK lengkap.** Publikasi belum diizinkan karena jalur admin dan APK belum operasional; tidak ada APK resmi yang dapat diunduh. Menerbitkan build sekarang hanya akan menampilkan katalog kosong/error dan tidak memenuhi kebutuhan pengguna.

## Selesai — diverifikasi secara lokal
- Build kini mengambil hanya file dari `public/` ke `dist/`: `index.html`, `store.css`, `store.js`, `favicon.svg`; tidak menyertakan dashboard prototype lokal atau konten demo.
- Halaman katalog tidak menyajikan konten fiktif; data berasal hanya dari `/api/apps`.
- Pemisahan kategori, pencarian, detail, tombol unduh APK dari metadata terbit tersedia dalam kode front-end.
- Kontrol admin/owner/developer tidak ditampilkan pada build publik.
- Tes `npm run check && npm run build && npm test`: 18 pengujian lulus pada revisi ini, termasuk validasi metadata GitHub Releases dan pemisahan build publik.
- Database Neon cabang `kitamalut-demo` sudah berisi tabel dasar dan kolom GitHub Release. Tidak ada aplikasi, admin, atau release yang diterbitkan pada pemeriksaan ini.
- Cabang `main` tidak berubah. Tidak ada deploy maupun penerbitan GitHub Release.

## Blokir wajib sebelum GO-LIVE
1. **Login Owner/Admin**: implementasikan autentikasi sesungguhnya, RBAC sisi server, MFA, pemulihan akun, audit trail. Jangan gunakan dashboard prototype lokal sebagai admin publik.
2. **Koneksi database**: pengaturan `DATABASE_URL` **rahasia** khusus Neon cabang target pada Netlify Functions belum diisi. Akun DB harus least privilege. Jangan pernah memasukkan connection string ke GitHub/frontend.
3. **Pengelolaan APK**: unggah file Android dan gambar, validasi berkas, pemeriksaan struktur APK, package ID, versionCode, sertifikat signing, checksum SHA-256 dan malware scan di tempat karantina **privat**, lalu persetujuan owner. GitHub Releases bersifat publik dan digunakan *hanya sesudah* lolos proses ini.
4. **Distribusi nyata**: buat release dan satu APK yang memang berhak didistribusikan, cocokkan metadata Neon ↔ GitHub Release ↔ binary, lalu uji unduhan dan pemasangan APK di Android nyata. Tidak ada APK/release saat audit.
5. **Pengujian online**: uji endpoint, navigasi Chrome Windows/Android, UI mobile, error/timeout, beban, unduh file, rate limiting, logging, konfigurasi domain HTTPS, dan rollback.
6. **Privasi & kepatuhan**: siapkan identitas pengelola, kontak pelaporan, kebijakan privasi dan ketentuan distribusi serta tinjau kewajiban PSE. Hindari klaim bebas malware absolut.
7. **Pemisahan internal**: demo/admin hanya untuk pengguna berwenang. Netlify site `kitamalut-appstore-demo` belum deployed dan opsi team SSO belum berhasil diaktifkan (422). Jangan memberikan tautan DEMO ke pelanggan sampai kontrol akses berfungsi.

## Catatan penting
- Repo `babalanja77/kitamalut-appstore` saat ini **public**: kode sumber dapat dibaca siapa pun yang mendapat akses ke repo, meskipun build situs hanya memuat file publik. Jika kode dashboard internal harus tidak dapat dibaca, gunakan repo private untuk source internal, terpisah dari repo public untuk file release APK.
- Build situs publik tidak menampakkan demo, tetapi itu bukan pengganti autentikasi server untuk admin.
- Menautkan Netlify ke GitHub tanpa mengecek branch/build berisiko menyajikan revisi lama. Publikasi baru boleh dari commit yang sudah ditinjau dan telah melewati gate ini.

## Langkah implementasi prioritas
1. Konfigurasi autentikasi Owner dan database secret; hanya kepada tim internal.
2. Bangun jalur unggah privat, pemindaian dan moderasi.
3. Tambah satu aplikasi APK resmi yang aman melalui pipeline, lakukan QA ujung ke ujung.
4. Lakukan security review dan pengujian mobile/desktop dengan bukti, lalu minta persetujuan Owner untuk deployment.