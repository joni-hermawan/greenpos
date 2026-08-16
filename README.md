# GreenPos — Sistem Kasir Mobile Multi-Role

Sistem Point of Sale (POS) berbasis aplikasi mobile dengan integrasi pembayaran EDC & QRIS, ditambah backoffice web untuk manajemen toko dan produk — dengan akses berbeda untuk Kasir, PPIC, Finance, dan Administrator. Rebrand & pengembangan lanjutan dari project sebelumnya, Nota POS.

## Tentang Project

GreenPos menggabungkan pengalaman langsung di infrastruktur pembayaran (EDC, HSM) dengan pengembangan aplikasi mobile & web modern. Kasir memakai aplikasi mobile React Native, sementara Administrator/Finance mengelola toko, produk, dan laporan lewat backoffice berbasis web — keduanya berbicara ke satu backend Go yang mengimplementasikan protokol EDC dari spesifikasi teknis resmi dan payment gateway QRIS (Midtrans Core API).

## Fitur Utama

- **Multi-role** — akses berbeda untuk Kasir, PPIC, Finance, dan Administrator
- **Aplikasi kasir mobile** (React Native, Android & iOS)
- **Backoffice web** untuk manajemen toko, produk, promo, pengguna, dan laporan (Next.js)
- **Pembayaran EDC & QRIS** — dua gateway (kartu via EDC, QRIS via Midtrans), masing-masing punya mode simulator (default, tanpa dependency eksternal) dan mode real (spec-accurate, tinggal dikonfigurasi lewat `.env`)
- **Perhitungan harga, promo, dan stok di server** — client hanya mengirim `{productId, qty}`
- **Manajemen produk, stok, promo, dan multi-toko**

## Arsitektur & Tech Stack

| Komponen | Teknologi |
|---|---|
| Aplikasi Kasir | React Native (Android & iOS) |
| Backoffice | Next.js (App Router), Tailwind CSS |
| Backend | Golang (Clean Architecture), `net/http` |
| Penyimpanan | JSON file lokal (tanpa database eksternal) |
| Payment Gateway | EDC (protokol serial TSD/Prima Vista) & QRIS (Midtrans Core API) |

```
GreenPos root/
├── GreenPos/     # Aplikasi kasir mobile (React Native)
├── backend/      # API utama (Go) — auth, transaksi, EDC & QRIS gateway
├── backoffice/   # Web admin/manajemen (Next.js)
└── prototype/    # Demo statis (mock, tanpa backend) untuk preview di browser
```

## Highlight Teknis

- **Implementasi protokol EDC dari spesifikasi teknis resmi**, mencakup penyusunan frame data, signing ES256, dan pemetaan kode transaksi.
- **Gateway pembayaran dengan dua implementasi** — simulator deterministik untuk pengembangan, dan client real yang spec-accurate serta inert sampai dikonfigurasi.
- **Role-based access control** granular per modul dan aksi.
- **Prototype interaktif tanpa backend** — mock aplikasi mobile & backoffice yang meniru persis tampilan dan alur aslinya, dipakai sebagai live demo publik.

## Cara Menjalankan

### 1. Backend
```bash
cd backend
cp .env.example .env   # opsional — isi kredensial Midtrans/EDC nanti
go run ./cmd/server
```
Berjalan di `:8080`, otomatis mengisi `data/*.json` dengan akun, toko, produk, dan promo demo saat pertama kali dijalankan.

### 2. Backoffice
```bash
cd backoffice
npm install
npm run dev
```

### 3. Aplikasi Mobile
```bash
cd GreenPos
npm install
npm run android   # atau: npm run ios
```
Dari Android emulator, aplikasi mengakses backend di `http://10.0.2.2:8080`.

## Login Demo

Semua akun memakai password `demo123`: `admin01`, `kasir01`, `ppic01`, `finance01`.

*Kredensial demo — wajib diganti sebelum digunakan di lingkungan produksi.*

## Status & Roadmap

Project ini aktif dikembangkan sebagai kelanjutan/rebrand dari Nota POS, dengan fokus baru: aplikasi kasir sebagai native mobile app (bukan lagi web), didampingi backoffice web terpisah untuk manajemen.
