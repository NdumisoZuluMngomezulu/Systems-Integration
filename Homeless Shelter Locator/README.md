# Find a Shelter — Gauteng

A simple full-stack app that helps people find homeless shelters near them
in Gauteng, South Africa. Users either share their browser location or pick
a town/suburb, and the app returns nearby shelters sorted by distance, shown
on a map and as a list with contact/directions links.

⚠️ **This ships with sample/placeholder shelter data only.** See
`backend/seed/seedData.js` for notes on where to source real, verified
shelter listings before using this for anything real.

## Stack

- **Frontend:** plain HTML/CSS/JS + [Leaflet](https://leafletjs.com/) for the
  map (OpenStreetMap tiles, no API key required)
- **Backend:** Node.js + Express
- **Database:** MongoDB (geospatial `2dsphere` index, queried with `$geoNear`)
- **Containerisation:** Docker + docker-compose
- **CI/CD:** GitHub Actions (test → build → push images to GHCR)

## File structure

```
shelter-finder/
├── backend/
│   ├── src/
│   │   ├── config/db.js              # MongoDB connection helper
│   │   ├── models/Shelter.js         # Mongoose schema + 2dsphere index
│   │   ├── controllers/shelterController.js
│   │   ├── routes/shelterRoutes.js
│   │   ├── middleware/apiKeyAuth.js  # protects the POST endpoint
│   │   ├── app.js                    # Express app (no listener - for tests)
│   │   └── server.js                 # connects to Mongo, starts listening
│   ├── seed/
│   │   ├── seedData.js               # sample shelters (PLACEHOLDER DATA)
│   │   └── seed.js                   # run with `npm run seed`
│   ├── tests/
│   │   └── shelters.test.js          # Jest + Supertest + in-memory Mongo
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── config.js             # API_BASE URL - change for deployment
│   │       └── app.js                # geolocation, fetch, map + list render
│   ├── nginx.conf
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml                # mongo + backend + frontend
├── .github/workflows/ci-cd.yml       # test, build, push pipeline
├── .gitignore
└── README.md
```

## Running it locally (Docker — recommended)

```bash
docker compose up --build
```

This starts three containers:
- `mongo` on port 27017
- `backend` (Express API) on port 5000
- `frontend` (nginx serving static files) on port 8080

Then seed the database with sample shelters (run once, from your host machine
with Node installed, or `docker compose exec backend npm run seed`):

```bash
docker compose exec backend npm run seed
```

Open **http://localhost:8080** in your browser.

## Running it locally (without Docker)

You'll need Node.js 18+ and a local or remote MongoDB instance.

```bash
cd backend
cp .env.example .env      # edit MONGO_URI if needed
npm install
npm run seed               # loads sample data
npm run dev                 # starts the API on :5000
```

In a second terminal, just open `frontend/public/index.html` directly in a
browser, or serve it with any static server, e.g. `npx serve frontend/public`.

## API reference

| Method | Endpoint                     | Description                                   |
|--------|-------------------------------|------------------------------------------------|
| GET    | `/api/health`                 | Health check                                  |
| GET    | `/api/shelters/nearby`        | `?lat=&lng=&maxDistance=&gender=&service=`     |
| GET    | `/api/shelters`               | List all shelters, optional `?municipality=`  |
| GET    | `/api/shelters/:id`           | Get one shelter                               |
| POST   | `/api/shelters`               | Create a shelter (requires `x-api-key` header)|

## Running tests

```bash
cd backend
npm install
npm test
```

Tests spin up an in-memory MongoDB instance (via `mongodb-memory-server`), so
no real database is needed to run them.

## CI/CD

`.github/workflows/ci-cd.yml` runs on every push/PR to `main`:
1. Installs backend dependencies and runs the Jest test suite.
2. If tests pass and the change is a push to `main`, builds the backend and
   frontend Docker images and pushes them to GitHub Container Registry
   (`ghcr.io`) — no extra secrets needed beyond the default `GITHUB_TOKEN`.

## Known limitations / next steps

- Seed data is placeholder only — replace with verified listings from the
  National Homeless Network, provincial NPO registers, or organisations like
  MES and Haven Night Shelter.
- No authentication for reading data; only a basic API key for writes.
- Shelter capacity/funding status fields are static — there's no live
  "beds available" tracking, so the UI explicitly tells users to call ahead.
- For production, put the API behind HTTPS and a reverse proxy, and update
  `frontend/public/js/config.js` to point at the real API domain.
