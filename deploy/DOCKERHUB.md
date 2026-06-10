# Building and publishing images to Docker Hub

CareMind ships two application images for self-hosted installs. Customers pull them from Docker Hub during install; this private repo is where those images are built and pushed.

| Image | Dockerfile | Default repository |
|-------|------------|--------------------|
| Backend API | `backend/Dockerfile` | `divescale/caremind-backend` |
| Frontend (static SPA) | `frontend/Dockerfile` | `divescale/caremind-frontend` |

The customer installer lives in the public repo [divescale/caremind-deploy-bundle](https://github.com/divescale/caremind-deploy-bundle) and references these images by tag (default: `latest`).

## Prerequisites

1. **Docker** — Docker Engine or Docker Desktop installed and running.
2. **Docker Hub account** — Write access to the `divescale` org (or your own namespace if you override `DOCKER_USER`).
3. **Repo root** — Run commands from the `caremind-ai` directory (parent of `deploy/`).

## Quick start

```bash
# 1. Log in to Docker Hub (once per machine / session)
docker login

# 2. Build and push a versioned release
./deploy/build-images.sh 1.0.0 --push
```

This builds both images, tags them as `1.0.0`, also tags and pushes `latest`, and uploads all four tags to Docker Hub.

## Build script

`deploy/build-images.sh` is the supported way to build (and optionally push). Manual `docker build` commands are possible but duplicate what the script already does.

### Local build only (no push)

Use this when testing the installer without publishing:

```bash
./deploy/build-images.sh test
```

Images are tagged `divescale/caremind-backend:test` and `divescale/caremind-frontend:test`. Pair with the deploy bundle using `CAREMIND_SKIP_PULL=1` — see [TESTING.md](./TESTING.md).

### Publish to Docker Hub

```bash
docker login
./deploy/build-images.sh <tag> --push
```

Examples:

```bash
./deploy/build-images.sh latest --push          # only latest
./deploy/build-images.sh 1.2.3 --push           # 1.2.3 + latest
./deploy/build-images.sh 1.2.3-rc1 --push       # pre-release tag + latest
```

When the tag is **not** `latest`, the script also tags both images as `latest` and pushes that tag. Customers who install without `CAREMIND_IMAGE_TAG` therefore get the most recently pushed release.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOCKER_USER` | `divescale` | Docker Hub namespace for image names |
| `VITE_LIVEKIT_URL` | `wss://placeholder.livekit.cloud` | Build-time fallback for the frontend; runtime LiveKit URL comes from the API (`.env` / `LIVEKIT_URL`) |

Example with a custom namespace:

```bash
DOCKER_USER=myorg ./deploy/build-images.sh 2.0.0 --push
```

Customers must then set `CAREMIND_DOCKER_USER=myorg` (and matching `CAREMIND_IMAGE_TAG`) in the deploy bundle install.

## What gets built

### Backend (`divescale/caremind-backend`)

- Multi-stage Node 20 image
- Prisma client generation at build time (placeholder DB URLs; no live DB required)
- Production image includes Chromium, Tesseract, and Poppler for document/OCR features
- Listens on port **3000**

### Frontend (`divescale/caremind-frontend`)

- Multi-stage Node 20 Alpine image; served with `serve` on port **80**
- `VITE_API_BASE_URL` is set to empty at build time so the browser uses same-origin `/api` (host nginx proxies to the backend)
- `VITE_LIVEKIT_URL` is a build-time fallback only

Build contexts are `backend/` and `frontend/` respectively — run the script from the repo root so paths resolve correctly.

## Manual build (optional)

If you need to build outside the script:

```bash
# From caremind-ai repo root
docker build -t divescale/caremind-backend:1.0.0 ./backend

docker build \
  --build-arg VITE_API_BASE_URL= \
  --build-arg VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud \
  -t divescale/caremind-frontend:1.0.0 \
  ./frontend

docker push divescale/caremind-backend:1.0.0
docker push divescale/caremind-frontend:1.0.0
```

Prefer `build-images.sh` so tagging and `latest` handling stay consistent.

## After pushing

1. **Verify on Docker Hub** — Confirm `divescale/caremind-backend` and `divescale/caremind-frontend` show the new tag.
2. **Test install** — Run the customer installer without `CAREMIND_SKIP_PULL` so it pulls from Hub:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/divescale/caremind-deploy-bundle/master/deploy/install.sh | sudo bash
   ```

   For a specific tag:

   ```bash
   CAREMIND_IMAGE_TAG=1.0.0 \
   curl -fsSL https://raw.githubusercontent.com/divescale/caremind-deploy-bundle/master/deploy/install.sh | sudo bash
   ```

3. **Health check** — See [TESTING.md](./TESTING.md) for verify/teardown steps.

## Versioning notes

- Use **semver-style tags** for releases (`1.0.0`, `1.0.1`, `2.0.0`).
- Document the tag in release notes or the deploy bundle if customers should pin a version.
- Pushing a new `--push` run updates `latest` on Hub; pin with `CAREMIND_IMAGE_TAG` in production if you need immutability between releases.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `denied: requested access to the resource is denied` | Run `docker login` and confirm you have push access to `DOCKER_USER`. |
| Build fails on Prisma generate | Ensure you are building from an up-to-date `backend/` tree; the Dockerfile uses placeholder DB URLs at build time. |
| Frontend build fails on `VITE_LIVEKIT_URL` | Pass a valid WebSocket URL via `VITE_LIVEKIT_URL=...` or use the script default. |
| Installer pulls old images | Set `CAREMIND_IMAGE_TAG` to the tag you pushed, or run `docker compose pull` on the server. |
