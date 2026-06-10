# CareMind AI

Multi-tenant healthcare platform: React frontend, TypeScript/Node API, per-organization PostgreSQL (with **pgvector**), Redis job queues, MinIO storage, and LiveKit Cloud for video visits.

---

## Architecture at a glance

| Layer | Role |
|--------|------|
| **Central DB** | Organizations, users, refresh tokens (control plane) |
| **Tenant DB** | One PostgreSQL database per org (PHI, appointments, vectors, audit logs) |
| **Redis** | BullMQ background jobs (documents, embeddings, transcription, notifications) |
| **MinIO** | Documents and recordings (S3-compatible, local dev) |
| **LiveKit Cloud** | Video consultations (`LIVEKIT_*` in `backend/.env`) |
| **Embeddings** | Voyage AI → vectors in tenant DB (`vector_chunks`, pgvector) |
| **OCR** | Tesseract + poppler (in Docker backend image; no OCR API key) |

### Tenant database naming

When an org registers, the server assigns a **UUID** (`orgId`). The tenant database name is:

```text
{TENANT_DB_NAME_PREFIX}{orgId with hyphens replaced by underscores}
```

Example: `caremind_tenant_f47ac10b_58cc_4372_a567_0e02b2c3d479`. The slug is not used for DB naming.

---

## Repository layout

```text
caremind-ai/
├── README.md
├── caremind-ai.postman_collection.json
├── frontend/                 # Vite + React
└── backend/
    ├── docker-compose.yml    # Local infra (Postgres, Redis, MinIO, Mailhog)
    ├── .env.example
    ├── src/
    └── prisma/{central,tenant}/
```

---

## Prerequisites

- **Node.js** 20+
- **Docker** and **Docker Compose**
- **psql** (required for `register-org` and `npm run seed` — creates tenant databases)
- API keys in `backend/.env`: OpenRouter, Voyage, Deepgram, LiveKit (see `backend/.env.example`)

---

## Local development

### 1. Backend environment

```bash
cd backend
cp .env.example .env
```

Set at minimum:

- `JWT_SECRET` and `REFRESH_TOKEN_SECRET` (32+ characters each, different values)
- `OPENROUTER_API_KEY`, `VOYAGE_API_KEY`, `DEEPGRAM_API_KEY`
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Email for dev: `EMAIL_PROVIDER=smtp`, `SMTP_HOST=localhost`, `SMTP_PORT=1025`

Defaults in `.env.example` match the Docker ports below (`CENTRAL_DB_*`, `TENANT_DB_*`, `MINIO_*`, `REDIS_URL`).

### 2. Start infrastructure

```bash
cd backend
docker compose up -d postgres-central postgres-tenant-template redis minio mailhog
docker compose ps   # wait until healthy
```

| Service | Host port | Notes |
|---------|-----------|--------|
| Central Postgres | 5432 | DB `caremind_central` |
| Tenant Postgres | 5433 | Host for per-org DBs |
| Redis | 6379 | BullMQ |
| MinIO API / Console | 9000 / 9001 | `minioadmin` / `minioadmin` |
| Mailhog SMTP / UI | 1025 / 8025 | Dev email inbox |

### 3. Database migrations

**Docker stack** (`docker compose up` in `backend/` or root prod compose): the backend container entrypoint runs Prisma generate + central `migrate deploy` before the API starts (each backend start/rebuild).

**API on the host** (`npm run dev`):

```bash
cd backend
npm install
npm run prisma:central:generate
npm run prisma:tenant:generate
npm run prisma:central:migrate
```

### 4. Run API

```bash
cd backend
npm run dev
```

Health check: [http://localhost:3000/health](http://localhost:3000/health)

Tenant DBs are created when you call `POST /api/auth/register-org` or when you run `npm run seed`.

### 5. Run frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000
# VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173) — Vite proxies `/api` to the backend.

### 6. Demo users (optional)

```bash
cd backend
npm run seed
```

Creates org `demo-clinic` and:

| Role | Email | Default password |
|------|--------|------------------|
| Admin | `admin@demo.clinic` | `Demo123!` |
| Doctor | `doctor@demo.clinic` | `Demo123!` |
| Patient | `patient@demo.clinic` | `Demo123!` |

Override with `SEED_DEMO_PASSWORD` in `backend/.env`. Demo accounts cannot enable MFA.

### Optional: API in Docker (same infra)

```bash
cd backend
docker compose up -d --build   # backend runs migrations on start
```

Use `SMTP_HOST=mailhog` in `.env` when the API runs inside Docker (see `backend/docker-compose.yml`).

---

## Postman

Import `caremind-ai.postman_collection.json` from the repo root.

1. Set `baseUrl` to `http://localhost:3000`.
2. **After seed:** set passwords to `Demo123!`, run **Login (Admin/Doctor/Patient)**.
3. **Full flow:** Register Organization → Invite Doctor → Login (Doctor) → Invite Patient (include `gender`) → Login (Patient) → rest of folders.

Document upload uses form field **`files`** (not `file`).

---

## Environment reference (local)

See `backend/.env.example` for the full list. Highlights:

| Group | Purpose |
|--------|---------|
| `CENTRAL_DB_*` | Control-plane Postgres (port 5432) |
| `TENANT_DB_*` | Tenant Postgres host (port 5433) |
| `REDIS_URL` | `redis://localhost:6379` on host; `redis://redis:6379` in backend container |
| `MINIO_*` | Local MinIO on port 9000 |
| `JWT_*` / `REFRESH_TOKEN_*` | Access and refresh tokens (separate secrets) |
| `LLM_PROVIDER` / `LLM_API_KEY` / `LLM_MODEL` | AI chat (openrouter, openai, anthropic, google) |
| `VOYAGE_*` / `DEEPGRAM_*` | Embeddings and speech-to-text |
| `LIVEKIT_*` | Hosted video |

---

## API overview

| Prefix | Auth | Description |
|--------|------|-------------|
| `/api/auth` | Mixed | Register org, login, refresh, MFA, profile, trusted devices |
| `/api/users` | Admin / doctor | Invite users, list, delete |
| `/api/patients` | Admin / doctor | Patients and sessions |
| `/api/dashboard` | JWT + tenant | Role dashboards |
| `/api/appointments` | JWT + tenant | Scheduling, consent |
| `/api/consultations` | JWT + tenant | LiveKit, recording, transcript |
| `/api/documents` | JWT + tenant | Upload, list, preview, reprocess |
| `/api/ai` | JWT + tenant | Chat, stream, copilot |
| `/api/ai-outputs` | JWT + tenant | Review and approve AI notes |
| `/api/pdf-export` | JWT + tenant | Visit summary PDF |
| `/api/admin` | Admin | Dashboard, audit logs |

Responses: `{ "data": ..., "meta": { "requestId", "timestamp" } }`.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Invalid env on startup | Compare `backend/.env` to `backend/.env.example`; JWT secrets ≥ 32 chars |
| Tenant DB fails on register/seed | `psql` installed; `caremind-postgres-tenant` healthy |
| Prisma migrate fails | `CENTRAL_DB_*` matches Docker (5432) |
| Workers / uploads stuck | Redis container up; `REDIS_URL` correct for host vs Docker API |
| LiveKit errors | `LIVEKIT_URL` uses `wss://`; keys match your cloud project |
| CORS in browser | `FRONTEND_URL=http://localhost:5173` in `backend/.env` |
| Invite patient 400 | Body must include `gender` and (for admin) `doctorId` |

---

## Self-hosted deployment (your VPC)

Run CareMind on your own EC2 or Linux server with Docker, bundled MinIO, Caddy (HTTPS), and multi-tenant isolation.

### Before you start

Gather API keys and credentials — see the interactive guide at **`/self-host`** in the frontend, or read `caremind-deploy-bundle/deploy/env.template` in the public install repo.

You will need: domain + DNS A record, LLM provider key, Voyage, Deepgram, LiveKit, and email (Resend or SMTP).

### Install

```bash
# On your server (Ubuntu 22.04+ or Amazon Linux 2023, 8 GB RAM recommended)
curl -fsSL https://raw.githubusercontent.com/divescale/caremind-deploy-bundle/master/deploy/install.sh | sudo bash
```

The installer will:

1. Download deploy config to `/opt/caremind-ai` (compose, Caddyfile — no app source)
2. Pull `divescale/caremind-backend` and `divescale/caremind-frontend` from Docker Hub
3. Install Docker if missing
4. Prompt for domain, keys, DB passwords, LLM provider, email, etc.
5. Write `.env` and start the stack

**Test before publishing images:** see `deploy/TESTING.md`

**Publish images:** `docker login && ./deploy/build-images.sh 1.0.0 --push`

After install, open `https://your-domain/register` to create the first organization.

### Manage

```bash
cd /opt/caremind-ai
docker compose -f docker-compose.customer.yml logs -f
docker compose -f docker-compose.customer.yml up -d   # after .env changes
```

---

## License

Proprietary — CareMind AI MVP.
