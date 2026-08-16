# GREEN POS Backend

Go backend for the GreenPos mobile app (`../GreenPos`) and the `../backoffice`
web app. Data is stored as local JSON files under `data/` — no external
database. Card payments follow an official EDC integration protocol spec;
QRIS goes through Midtrans's Core API (sandbox).

## Run

```sh
cd backend
cp .env.example .env   # optional — fill in Midtrans/EDC credentials later
go run ./cmd/server
```

Starts on `:8080` (override with `PORT`), seeding `data/*.json` with demo
accounts, stores, products, and promos on first run — same data the old
mobile mock (`GreenPos/src/api.ts`) used to hardcode.

**Demo accounts** (all password `demo123`): `admin01`, `kasir01`, `ppic01`,
`finance01`.

From the Android emulator, the mobile app reaches this server at
`http://10.0.2.2:8080` (the emulator's alias for the host machine).

## Payment gateways

Both card (EDC) and QRIS payments run through a gateway interface with two
implementations each — a **simulator** (default, no external dependency,
deterministic mock responses) and a **real client** (spec-accurate, wired
up and inert until configured):

| | Simulator (default) | Real |
|---|---|---|
| EDC | instant approval, plausible bank/card data | `EDC_MODE=live` + Prima Vista onboarding (cert/key/CA + ES256 signing key) — see `.env.example` |
| QRIS | fake `qr_string`, auto-settles ~3s after charge | set `MIDTRANS_SERVER_KEY` — real Midtrans sandbox `POST /v2/charge` + `GET /v2/{order_id}/status` |

No code changes needed to switch — just `.env`.

## API surface

All routes under `/api/v1`, JSON in/out, `Authorization: Bearer <token>`
required except `/auth/login` and `/health`.

- **Auth**: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **Stores**: `GET /stores`, `POST/PUT/DELETE /stores(/:id)` (admin)
- **Products**: `GET /products`, `POST/PUT/DELETE /products(/:id)` (admin/store_manager)
- **Promos**: `GET /promos/active`, `GET /promos` (admin), `POST/PUT/DELETE /promos(/:id)` (admin)
- **Users**: `GET/POST /users`, `PUT /users/:id` (admin)
- **Transactions**: `POST /transactions`, `GET /transactions/pending`,
  `GET /transactions/history`, `GET /transactions/:id`,
  `POST /transactions/:id/void`
- **Payments**: `POST /transactions/:id/pay/cash`,
  `POST /transactions/:id/pay/edc`,
  `POST /transactions/:id/pay/qris/charge`,
  `GET /transactions/:id/pay/qris/status`

Order pricing, promo matching, and stock decrement are always computed
server-side from the current catalog — the client only ever sends
`{productId, qty}`.

## Layout

```
cmd/server/main.go        wiring: config -> repos -> services -> gateways -> http
internal/config           env/.env loader
internal/domain           plain structs mirroring GreenPos/src/types.ts
internal/storage          JSON file repos (one per entity) + demo seed data
internal/promoengine      Go port of src/promo.ts's computeBestPromo
internal/payment          EDCGateway/QRISGateway interfaces
internal/payment/edc      TSD-spec message types, ES256 signing, simulator, live ws client
internal/payment/qris     Midtrans Core API client + simulator
internal/service          business logic, one file per concern
internal/httpapi          net/http.ServeMux routes/handlers/middleware
internal/apperror         status-coded error type shared by service <-> httpapi
data/                     JSON "database" files (auto-created, seeded on first run)
```
