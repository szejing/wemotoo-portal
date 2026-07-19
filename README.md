# Wemotoo CRM

# download yeppi-common

run npm link /Users/szejinggo/Documents/Projects/yeppi-common

docker build -t registry.digitalocean.com/wemotoo/crm-portal:latest .

docker pull registry.digitalocean.com/wemotoo/crm-portal:latest

docker compose down
docker compose up -d

docker rmi

docker-compose up --build wemotoo-portal

docker run -d -p 3000:3000 --name wemotoo-portal registry.digitalocean.com/wemotoo/wemotoo-portal:latest

docker-compose build --no-cache
docker push registry.digitalocean.com/wemotoo/wemotoo-portal:1.0.0 && docker push registry.digitalocean.com/wemotoo/wemotoo-ecommerce:1.0.0

docker pull registry.digitalocean.com/wemotoo/wemotoo-portal:1.0.0
docker pull registry.digitalocean.com/wemotoo/wemotoo-ecommerce:1.0.0

docker pull registry.digitalocean.com/wemotoo/wemotoo-portal:1.0.0 && docker pull registry.digitalocean.com/wemotoo/wemotoo-ecommerce:1.0.0

## Deployment (local push → cloud pull)

Scripts live in the parent ecommerce folder:

- `../release-wemotoo` — build, bump version, push to DigitalOcean registry
- `../deploy-wemotoo` — on cloud: set tags, pull images, restart containers
- `../docker-compose.cloud.yml` — pull-only compose for the droplet
- `../VERSION` — current semver (`X.Y.Z`), auto-bumped on each release

### 1. Local: build and push

From the ecommerce root (`Documents/Projects/ecommerce`):

```bash
# Login once (if needed)
docker login registry.digitalocean.com

# Default: bump patch (1.0.0 → 1.0.1) then build + push
./release-wemotoo

# Or bump minor / major
BUMP=minor ./release-wemotoo
BUMP=major ./release-wemotoo

# Or set an exact version
VERSION=1.2.0 ./release-wemotoo
```

This pushes:

- `registry.digitalocean.com/wemotoo/wemotoo-ecommerce:<tag>`
- `registry.digitalocean.com/wemotoo/wemotoo-portal:<tag>`
- both also tagged as `:prod`

After a successful push, `VERSION` and `.env.tags` are updated. Note the printed tag (e.g. `1.0.1`).

### 2. Cloud: pull and deploy

On the droplet (compose + env layout with `./backend/.env.prod` and `./frontend/.env.prod`):

**First-time setup**

```bash
# Use pull-only compose (no build: blocks)
cp docker-compose.cloud.yml docker-compose.yml
chmod +x deploy-wemotoo

# Ensure app env files exist
# ./backend/.env.prod
# ./frontend/.env.prod
```

**Deploy a release**

```bash
docker login registry.digitalocean.com

# Pull and restart at the tag from local release
./deploy-wemotoo 1.0.1
```

`deploy-wemotoo` writes `.env` with `BACKEND_TAG` / `FRONTEND_TAG`, then runs `docker compose pull` and `docker compose up -d`.

Reuse tags already in `.env`:

```bash
./deploy-wemotoo
```

### Quick checklist

1. Local: `./release-wemotoo` → note the new tag
2. Cloud: `./deploy-wemotoo <tag>`
3. Verify: `docker compose ps` and open portal / API health