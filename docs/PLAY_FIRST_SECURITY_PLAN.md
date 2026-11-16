# KITAMALUT APP STORE — Google Play first / APK backup

## Tujuan
Pusat unduhan resmi untuk aplikasi milik pengelola, BUKAN pengganti Google Play.

## Perilaku toko
- Jika `play_store_status=available` dan package ID valid, tampilkan tautan Google Play sebagai CTA pertama.
- Jika ada APK cadangan yang sudah lulus pemindaian, disetujui admin, dan direkam sebagai release GitHub, tampilkan tombol kedua.
- Jika hanya ada APK terverifikasi dan tidak tersedia Play, tampilkan APK utama.
- Jangan pernah mengarang URL Play; gunakan tautan kanonis berbasis package ID dan status diverifikasi pengelola.
- Jangan tampilkan aplikasi tanpa jalur distribusi yang valid; atau aplikasi yang belum diizinkan `is_listed`.

## Struktur yang lebih aman (wajib sebelum pengembangan dashboard produksi)
1. Source code + API owner disimpan pada **private GitHub repository** terpisah.
2. GitHub Releases untuk distribusi APK yang telah lolos pemeriksaan disimpan pada **public releases-only repository** tanpa source code admin atau kredensial.
3. Dashboard Owner tidak disertakan dalam build publik. API admin harus mewajibkan session server-side, MFA, RBAC dan audit. UI yang disembunyikan saja bukan pengamanan.
4. Rahasia database dan token GitHub hanya boleh ada di secret store Netlify Function; jangan ada di HTML/JS, GitHub repo atau URL download.
5. APK: unggah lewat kanal privat, pemeriksaan package name, versionCode, SHA-256, sertifikat app signing, malware scan dan review manual sebelum mengirimkan ke Releases publik.
6. Pastikan APK ditandatangani dengan **app signing key** yang sesuai versi Play. Jangan menggunakan upload-key APK yang berbeda sebagai pembaruan lintas-sumber.
7. Jangan menganggap APK bisa memperbaiki ketidakcocokan device, batas wilayah, atau aplikasi yang dibatasi karena kebijakan Play.
8. Verifikasi status developer Android; pantau perubahan rollout 2027.

## Penting untuk akun saat ini
Repository `babalanja77/kitamalut-appstore` saat audit masih publik dan memiliki riwayat kode prototipe internal. Jangan menyimpan autentikasi atau secret baru di dalamnya.
Plugin GitHub yang terhubung pada percakapan ini dapat membaca / mengubah file dan branch, tetapi tidak menyediakan fungsi membuat repository baru atau mengubah repository menjadi private. Pemilik akun perlu menggunakan GitHub Settings untuk memprivatkan source repo dan membuat releases-only repo terpisah, sebelum rilis APK publik.
Mengubah visibilitas repository tidak dapat menarik kembali salinan atau fork yang sudah terunduh orang lain.

## Status pekerjaan
Perubahan di DEMO saja. Tidak ada deploy, APK release atau domain yang diterbitkan. Login Owner/Netlify DATABASE_URL/QA perangkat belum selesai.