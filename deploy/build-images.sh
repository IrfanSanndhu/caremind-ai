#!/usr/bin/env bash
# Build and optionally push CareMind images to Docker Hub (divescale)
#
# Local test (no push):
#   ./deploy/build-images.sh test
#
# Publish to Docker Hub:
#   docker login
#   ./deploy/build-images.sh 1.0.0 --push

set -euo pipefail

DOCKER_USER="${DOCKER_USER:-divescale}"
TAG="${1:-latest}"
PUSH=false
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${2:-}" == "--push" || "${TAG}" == "--push" ]]; then
  PUSH=true
  [[ "${TAG}" == "--push" ]] && TAG="latest"
fi

BACKEND_IMAGE="${DOCKER_USER}/caremind-backend:${TAG}"
FRONTEND_IMAGE="${DOCKER_USER}/caremind-frontend:${TAG}"

# LiveKit URL in frontend is a build-time fallback; runtime URL comes from the API (.env LIVEKIT_URL)
LIVEKIT_BUILD_URL="${VITE_LIVEKIT_URL:-wss://placeholder.livekit.cloud}"

echo "── Building ${BACKEND_IMAGE}"
docker build -t "${BACKEND_IMAGE}" "${ROOT}/backend"
if [[ "${TAG}" != "latest" ]]; then
  docker tag "${BACKEND_IMAGE}" "${DOCKER_USER}/caremind-backend:latest"
fi

echo "── Building ${FRONTEND_IMAGE}"
docker build \
  --build-arg VITE_API_BASE_URL= \
  --build-arg VITE_LIVEKIT_URL="${LIVEKIT_BUILD_URL}" \
  -t "${FRONTEND_IMAGE}" \
  "${ROOT}/frontend"
if [[ "${TAG}" != "latest" ]]; then
  docker tag "${FRONTEND_IMAGE}" "${DOCKER_USER}/caremind-frontend:latest"
fi

echo "✔ Built ${BACKEND_IMAGE} and ${FRONTEND_IMAGE}"

if [[ "$PUSH" == true ]]; then
  docker push "${BACKEND_IMAGE}"
  docker push "${FRONTEND_IMAGE}"
  if [[ "${TAG}" != "latest" ]]; then
    docker push "${DOCKER_USER}/caremind-backend:latest"
    docker push "${DOCKER_USER}/caremind-frontend:latest"
  fi
  echo "✔ Pushed to Docker Hub"
else
  echo ""
  echo "Local test install:"
  echo "  cd ../caremind-deploy-bundle"
  echo "  CAREMIND_IMAGE_TAG=${TAG} CAREMIND_SKIP_PULL=1 sudo -E bash deploy/install.sh"
fi
