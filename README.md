# Daily Diary — Firestore + Vercel (Teks-only, tanpa gambar)

Versi ini **tidak punya fitur gambar sama sekali** — murni teks (bold, italic,
strikethrough, warna, link). Tidak ada Firebase Storage, tidak ada upload
file, tidak ada base64. Setiap entry disimpan sebagai satu dokumen kecil di
Firestore, jauh di bawah limit 1 MiB per dokumen.

Akses aplikasi dilindungi **PIN sederhana**: PIN dicek oleh serverless function
di server (bukan di browser), lalu server memberi token Firebase khusus supaya
Firestore tahu ini benar-benar kamu.

---

## 1. Buat project Firebase (baru)

1. Buka https://console.firebase.google.com → **Add project** → ikuti wizard-nya.
2. Di sidebar, buka **Build > Firestore Database** → **Create database** → pilih
   region terdekat → mode **Production**.
3. Di sidebar, buka **Build > Authentication** → klik **Get started** (cukup
   sekali klik ini, tidak perlu mengaktifkan provider apa pun — kita hanya
   pakai custom token dari server).

   > Catatan: **Firebase Storage tidak perlu diaktifkan** di versi ini karena
   > tidak ada fitur gambar.

## 2. Ambil config Web App (untuk client / index.html)

1. Di halaman utama project → klik ikon **`</>`** (Add app > Web).
2. Kasih nama bebas, **jangan** centang Firebase Hosting (kita pakai Vercel).
3. Salin object `firebaseConfig` yang muncul.
4. Buka `index.html`, cari bagian ini di bagian `<head>` dan ganti dengan
   milikmu:

   ```js
   const firebaseConfig = {
     apiKey: "GANTI_DENGAN_API_KEY",
     authDomain: "GANTI.firebaseapp.com",
     projectId: "GANTI_PROJECT_ID",
     appId: "GANTI_APP_ID"
   };
   ```

   Nilai-nilai ini **aman untuk publik** (memang didesain begitu oleh Firebase) —
   yang melindungi data kamu adalah `firestore.rules`, bukan config ini.

## 3. Ambil Service Account key (untuk server / api/verify-pin.js)

1. **Project Settings** (ikon gear) → **Service accounts**.
2. Klik **Generate new private key** → sebuah file JSON akan terunduh.
3. Dari file JSON itu kamu butuh 3 nilai: `project_id`, `client_email`,
   `private_key`. Ini dipakai untuk mengisi environment variables (langkah 5).

   ⚠️ **Jangan pernah commit file JSON ini ke Git / upload ke publik** — ini
   kunci penuh ke project Firebase-mu.

## 4. Deploy security rules

Paling gampang lewat Firebase Console (tanpa install CLI apa pun):

- **Firestore Database > Rules** → tempel isi `firestore.rules` → **Publish**.

## 5. Deploy ke Vercel

1. Push folder ini ke sebuah repo GitHub.
2. Di https://vercel.com → **Add New > Project** → import repo tersebut.
   Vercel otomatis mengenali `index.html` sebagai static file dan folder
   `/api` sebagai serverless functions — tidak perlu build command khusus.
3. Di **Settings > Environment Variables**, tambahkan 4 variabel ini (isi
   sesuai `.env.example`):

   | Key | Value |
   |---|---|
   | `DIARY_PIN` | PIN pilihanmu, misal `483920` |
   | `FIREBASE_PROJECT_ID` | dari file service account |
   | `FIREBASE_CLIENT_EMAIL` | dari file service account |
   | `FIREBASE_PRIVATE_KEY` | dari file service account (tempel apa adanya, termasuk `-----BEGIN...-----`) |

4. Redeploy project (Vercel akan otomatis redeploy tiap kamu ubah env var,
   atau klik **Redeploy** manual).

## 6. Pakai aplikasinya

- Buka URL Vercel-mu → masukkan PIN → mulai nulis diary.
- Tombol **Lock** di header untuk keluar/mengunci lagi (butuh PIN untuk masuk lagi).

## 7. Import backup lama

Tombol **Import** menerima file backup JSON lama. Kalau ada entry yang masih
mengandung gambar (dari versi aplikasi sebelumnya yang punya fitur foto),
**gambarnya otomatis dibuang**, hanya teksnya yang tetap masuk ke Firestore —
sesuai keputusan yang kamu pilih. Setelah selesai import, akan muncul
pemberitahuan berapa entry yang isi gambarnya sempat dibuang, supaya kamu tahu
entry mana yang mungkin kehilangan foto.

## Catatan keamanan

- Semua orang yang tahu URL Vercel-mu bisa **melihat layar PIN**, tapi tidak
  bisa baca/tulis data tanpa PIN yang benar (dicek di server, bukan di
  JavaScript client yang bisa dibaca orang lain).
- PIN dan credential Firebase Admin **tidak pernah** ada di kode `index.html`
  yang dikirim ke browser — hanya ada di environment variables server.
- Kalau nanti berubah pikiran dan mau fitur gambar lagi, arsitektur
  Firestore + PIN-nya tetap sama; tinggal tambah lagi lapisan Firebase Storage
  terpisah seperti versi sebelumnya.
