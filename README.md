# CommandDesk

Task and people manager for engineering managers.

## Setup

### Prerequisites
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

### Quick Start

1. **Copy environment file**
   ```
   copy .env.example .env
   ```

2. **Start the application**
   ```
   docker compose up -d
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

### Stopping
```
docker compose down
```

### Data Persistence
PostgreSQL data is stored in a named Docker volume (`pgdata`) and persists across restarts.
To reset all data: `docker compose down -v`

### Updating
```
docker compose down
docker compose build --no-cache
docker compose up -d
```
