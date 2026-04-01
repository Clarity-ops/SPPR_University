# SPPR App

Decision Support System (DSS) web application for evaluating alternatives by multiple criteria and weighted scoring.

This repository contains:

- `sppr-backend`: Express + MySQL REST API
- `sppr-frontend`: React + Vite user interface
- `docker-compose.yml` + `init.sql`: local MySQL startup and schema/data bootstrap

## Why this project

SPPR App helps compare alternatives (for example, laptop options) with:

- configurable criteria (`maximize` or `minimize`)
- per-criterion weights
- matrix-based evaluation values
- ranked analytics results

## Architecture

- Frontend calls API at `http://localhost:5000/api`
- Backend serves REST endpoints and connects to MySQL
- MySQL is started via Docker Compose and initialized from `init.sql`

## Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | React 19, Vite 8, Axios, TailwindCSS 4           |
| Backend  | Node.js, Express 5, mysql2, dotenv, helmet, cors |
| Database | MySQL 8                                          |
| Tooling  | ESLint, Prettier, Nodemon                        |

## Project Structure

```text
sppr_app/
  docker-compose.yml
  init.sql
  sppr-backend/
    src/
      config/
      controllers/
      repositories/
      routes/
      services/
      server.js
  sppr-frontend/
    src/
      api/
      components/
      hooks/
      App.jsx
```

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- Docker Desktop (or Docker Engine + Compose plugin)

## Quick Start

### 1. Start MySQL in Docker

From repository root:

```bash
docker compose up -d
```

This will:

- start MySQL on `localhost:3306`
- create database `sppr_db`
- execute `init.sql` once on first container initialization

### 2. Configure backend environment

Create `sppr-backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=sppr_user
DB_PASSWORD=sppr_password
DB_NAME=sppr_db
```

### 3. Install dependencies

```bash
cd sppr-backend
npm install

cd ../sppr-frontend
npm install
```

### 4. Run backend

```bash
cd sppr-backend
npm run dev
```

Backend health check:

- `GET http://localhost:5000/api/health`

### 5. Run frontend

```bash
cd sppr-frontend
npm run dev
```

Open the app in browser (usually):

- `http://localhost:5173`

## Available Scripts

### Backend (`sppr-backend`)

- `npm run dev`: start with nodemon
- `npm start`: start in normal mode
- `npm run lint`: lint source files
- `npm run lint:fix`: auto-fix lint issues

### Frontend (`sppr-frontend`)

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview build locally
- `npm run lint`: lint project
- `npm run format`: format with Prettier
- `npm run format:check`: validate formatting

## REST API Overview

Base URL: `http://localhost:5000/api`

### Health

- `GET /health`

### Projects

- `GET /projects`
- `POST /projects`
- `PUT /projects/:id`
- `DELETE /projects/:id`

### Alternatives

- `GET /alternatives/project/:projectId`
- `POST /alternatives`
- `PUT /alternatives/:id`
- `DELETE /alternatives/:id`

### Criteria

- `GET /criteria/project/:projectId`
- `POST /criteria`
- `PUT /criteria/:id`
- `DELETE /criteria/:id`

### Evaluations

- `GET /evaluations/project/:projectId`
- `POST /evaluations`

### Analytics

- `GET /analytics/:projectId/ranking`

## Data Model (Core)

- `projects`
- `alternatives` (belongs to project)
- `criteria` (belongs to project, includes `type` and `weight`)
- `evaluations` (matrix value by `alternative_id` + `criterion_id`)

## Typical Workflow

1. Create/select a project.
2. Add criteria with type (`maximize`/`minimize`) and weights.
3. Add alternatives.
4. Fill matrix values.
5. Open results/ranking to compare options.

## Troubleshooting

- Backend fails on startup with missing env:
  - ensure all required variables exist in `sppr-backend/.env`
- Cannot connect to DB:
  - verify `docker compose ps` shows MySQL running
  - verify backend DB credentials match `docker-compose.yml`
- Empty or stale DB data:
  - first-run SQL import happens only when MySQL volume is new
  - reinitialize with `docker compose down -v && docker compose up -d` (this removes DB data)

## License

This project currently has no explicit repository-wide license. Add a `LICENSE` file if needed.
