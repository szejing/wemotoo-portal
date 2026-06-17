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