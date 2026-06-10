# Testing self-hosted install

Deploy bundle lives in the public repo: **[divescale/caremind-deploy-bundle](https://github.com/divescale/caremind-deploy-bundle)** (branch: `master`)

Image builds stay in this private repo.

## Option A — Local test (no Docker Hub push)

```bash
# 1. Build images (this repo)
./deploy/build-images.sh test

# 2. Run installer from caremind-deploy-bundle checkout
cd ../caremind-deploy-bundle
CAREMIND_IMAGE_TAG=test CAREMIND_SKIP_PULL=1 sudo -E bash deploy/install.sh
```

## Option B — Test curl one-liner

Push `caremind-deploy-bundle` to GitHub first, then:

```bash
CAREMIND_IMAGE_TAG=test CAREMIND_SKIP_PULL=1 \
curl -fsSL https://raw.githubusercontent.com/divescale/caremind-deploy-bundle/master/deploy/install.sh | sudo -E bash
```

## Option C — Production test (after Docker Hub push)

```bash
docker login
./deploy/build-images.sh 1.0.0 --push

curl -fsSL https://raw.githubusercontent.com/divescale/caremind-deploy-bundle/master/deploy/install.sh | sudo bash
```

## Verify / teardown

```bash
cd /opt/caremind-ai
docker compose -f docker-compose.customer.yml ps
curl -H "Host: your-domain" http://127.0.0.1/health

docker compose -f docker-compose.customer.yml down -v
```
