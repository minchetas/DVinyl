# 🐳 Docker Deployment

The recommended way to run DVinyl is using Docker. You have two options depending on your needs.

## Option 1: Using Pre-built Image (Recommended)

Best for: Most users who just want to run the app. No need to clone the full repository or install Node.js.

### 1. Setup

Create a new folder and a `docker-compose.yml` file with this content:

```yaml
version: '3.8'
services:
  dvinyl-app:
    image: ghcr.io/kyonew/dvinyl:latest
    container_name: dvinyl_app
    restart: unless-stopped
    ports:
      - "3099:3099"
    volumes:
      - ./public/uploads:/app/public/uploads
    env_file:
      - .env
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    container_name: dvinyl_db
    restart: unless-stopped
    volumes:
      - ./mongo_data:/data/db

volumes:
  mongo_data:
```

### 2. Prepare Environment

Ensure you have a `.env` file in the root directory. You can use the provided `.env.example` as a starting point.

[Get your API keys here.](./api-keys.md)

### 3. Launch

```bash
docker compose up -d
```

## Option 2: Build from Source

Best for: Developers or those who want to customize the code.

1. **Clone the repo**: `git clone https://github.com/Kyonew/DVinyl.git`
2. **Make your `.env` file** using `.env.example` and [api keys page](./api-keys.md).
3. **Build and start**:

```bash
docker compose up --build -d
```

## 🔄 Updating


### Updating (Pre-built Image)

If you are using the GHCR image (Option 1):

```bash
docker compose pull
docker compose up -d
```

### Updating (Manual Build)

If you cloned the repository (Option 2):

```bash
git pull
docker compose up --build -d
```

## 💾 Persistence

By default, the database data is stored in a Docker volume named mongo-data. This ensures your collection is not lost when you stop or update the containers.

## 🗑️ Full reset & Data loss

If you have made significant changes and need to rebuild the application from a clean slate, follow the steps below.

> [!IMPORTANT]
> This procedure will permanently delete all local data. If you have data you wish to keep, export your database before proceeding.

```bash
# Stop containers and remove volumes (-v)
sudo docker compose down -v

# Delete local database files
sudo rm -rf ./mongo_data

# Rebuild and restart the services
sudo docker compose up -d
```

[← Back to README](../README.md)  
[Get your API keys →](./api-keys.md)
