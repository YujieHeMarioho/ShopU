# ShopU

ShopU is a multi-service web app with:

- a **React (Create React App)** frontend (`frontend/`)
- a **Node.js / Express** backend API (`backend/`)
- a **Python FastAPI** “ML service” used for recommendations (`mlservice/`)

## Repo structure

- `frontend/`: React UI (Auth0 auth, PayPal integration, talks to the backend via `REACT_APP_BACKEND_URL`)
- `backend/`: Express API (Postgres via `pg`, Auth0 JWT validation middleware, S3 image storage/signing, calls `mlservice/`)
- `mlservice/`: FastAPI app that reads from Postgres and returns recommendation scores
- `docker-compose.yml`: GitLab Runner container (for CI runners), not a full local dev stack
- `.gitlab-ci.yml`: CI pipeline (frontend + backend tests/build + deploy to AWS services)

## Prerequisites

- **Node.js 20+** (CI uses `node:20`)
- **npm**
- **Python 3.10+** (recommended) for `mlservice/`
- A **PostgreSQL** database reachable by the backend + mlservice
- (Optional) **AWS S3** buckets for image storage
- (Optional) **Auth0** tenant/app for authentication

## Environment variables

This repo currently contains `.env` files under service folders. Treat these as **secrets**:

- Do **not** commit real credentials
- Prefer creating your own local `.env` files
- Rotate any keys that were committed previously

### Backend (`backend/.env`)

The backend expects at minimum:

- `PORT` (example: `8080`)
- `CLIENT_ORIGIN_URL` (example: `http://localhost:3000`)
- `BACKEND_URL` (example: `http://localhost:8080`)

Database (Postgres):

- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_PORT`

Auth0 (used by controllers/middleware):

- `AUTH0_DOMAIN`
- `AUTH0_ISSUER_BASE_URL`
- `AUTH0_AUDIENCE`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`

AWS / S3 (used for uploads + signed URLs):

- `BUCKET_REGION`
- `BUCKET_ACCESS_KEY`
- `BUCKET_SECRET_KEY`
- `BUCKET_NAME_FEED`
- `BUCKET_NAME_LISTINGS`
- `BUCKET_NAME_COMMUNITIES`
- `BUCKET_NAME_PROFILE`

ML service base URL (optional, defaults to `http://localhost:8000`):

- `PYTHON_API_BASE_URL`

### Frontend (`frontend/.env`)

Common variables:

- `REACT_APP_BACKEND_URL` (example: `http://localhost:8080`)
- `REACT_APP_AUTH0_DOMAIN`
- `REACT_APP_AUTH0_CLIENT_ID`
- `REACT_APP_AUTH0_AUDIENCE`
- `REACT_APP_AUTH0_REDIRECT_URI` (example: `http://localhost:3000`)
- `REACT_APP_PAYPAL_CLIENT_ID`

### ML service (`mlservice/.env`)

The ML service connects directly to Postgres:

- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_PORT`

## Run locally (dev)

You’ll typically run **three processes**: backend, frontend, and mlservice.

### 1) Start the backend API

```bash
cd backend
npm ci
npm run server
```

By default the backend listens on `PORT` (commonly `8080`).

Notes:

- Many `/api/*` endpoints are protected by Auth0 JWT middleware.
- The root endpoint (`/`) is a simple health check returning `"Hello from backend! V1"`.

### 2) Start the ML service

The ML service is a FastAPI app that runs on port `8000` by default.

```bash
cd mlservice
python -m venv .venv
source .venv/bin/activate

# install dependencies (adjust as needed for your environment)
pip install fastapi uvicorn pandas numpy scipy scikit-learn psycopg2-binary python-dotenv

python ml_service.py
```

The backend calls it via:

- `PYTHON_API_BASE_URL` (defaults to `http://localhost:8000`)
- endpoint: `GET /recommend?user_id=...&current_page=feed|listings`

### 3) Start the frontend

```bash
cd frontend
npm ci
npm start
```

The app runs at `http://localhost:3000`.

## Tests

Frontend:

```bash
cd frontend
npm test
```

Backend:

```bash
cd backend
npm test
```

## CI / Deployment (GitLab)

The `.gitlab-ci.yml` pipeline includes:

- **Test**: runs frontend + backend tests in Node 20
- **Build**: builds the React app
- **Deploy** (main branch): syncs `frontend/build/` to an S3 bucket, triggers an Amplify deployment, and deploys backend to Elastic Beanstalk

Deployment relies on CI variables such as:

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`
- `FRONTEND_BUCKET_NAME`
- `AMPLFIY_APP_ID`

## Security notes

- Never commit real `.env` values (DB passwords, AWS keys, Auth0 secrets).
- If secrets were committed, rotate them immediately (AWS IAM keys, DB credentials, Auth0 client secret).

