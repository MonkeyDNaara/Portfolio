# Portfolio

[![CI](https://github.com/MonkeyDNaara/Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/MonkeyDNaara/Portfolio/actions/workflows/ci.yml)

My portfolio site, built as a small but complete full-stack project. My projects live in a PostgreSQL database (Neon), and when I'm logged in I can add, edit, hide, feature and reorder them with buttons right on the projects page, no code changes needed. I came from industrial automation, so I wanted a project that shows the whole path: database, API, auth, frontend, tests, CI and deployment.

![Home page in dark mode](docs/screenshots/home.png)

| Light mode | About page in German |
| --- | --- |
| ![Home page in light mode](docs/screenshots/home-light.png) | ![About page in German](docs/screenshots/about.png) |

| Projects as visitors see them | Same page when I'm logged in |
| --- | --- |
| ![Projects](docs/screenshots/projects.png) | ![Owner view](docs/screenshots/owner.png) |

| Edit dialog with the German tab | Phone |
| --- | --- |
| ![Edit form](docs/screenshots/form.png) | <img src="docs/screenshots/mobile.png" alt="Home page on a phone" width="260"> |

## What it does

- Public pages: home, about, skills, projects list, project detail and contact
- Visitors only see published projects. Featured ones show up on the home page.
- Owner login (JWT). When I'm logged in, the projects page shows an **+ Add project** button and controls on each card: edit, delete, hide/publish, feature and reorder (arrow buttons or drag and drop)
- **Import from GitHub**: paste a repo URL and the title, description, live link and technologies are filled in from the GitHub API
- Optional AI helper: drafts a project description from a repo's README using the Claude API, I always edit it before saving
- Preview image per project. The browser scales it down, the API checks the file type by its bytes and stores it in Postgres.
- **German / English** toggle for all texts. Projects can have an optional German title and description, otherwise the English one is shown.
- **Light and dark mode**, follows the system setting and remembers my choice
- Responsive layout, works on a phone too

## Design

My first version looked like a code editor, with a file tree, a fake terminal and fake commit hashes. Lots of developer portfolios look like that, and it didn't say anything about me. The new one is calmer: dark first, one emerald accent, and the only other colors are the brand dots on the tech badges, so you can see at a glance what each project was built with.

On the home page the three layers of this project (PostgreSQL, FastAPI, React) are drawn as a small 3D stack that spreads apart when you hover over it. The about page tells my path from BMW apprentice to developer as a timeline. Cards tilt a little on hover; that's turned off on touch screens and when "reduce motion" is set. No UI library: plain CSS with custom properties, about 15 kB.

## Tech stack

| Part | What I used |
| --- | --- |
| Backend | Python, FastAPI, SQLAlchemy 2, Alembic, PyJWT |
| Database | PostgreSQL (Neon), SQLite for quick local dev and tests |
| Frontend | React, Vite, React Router, plain CSS, small self-made i18n (no library) |
| Quality | pytest (51 tests, run on SQLite and on Postgres), ruff, GitHub Actions |
| Deployment | Docker / docker-compose, Render (see `render.yaml`) |

## How it fits together

```mermaid
flowchart LR
    Browser["React app (Vite)"] -- "JSON over HTTPS" --> API["FastAPI"]
    API -- "SQLAlchemy" --> DB[("PostgreSQL")]
    API -. "README + prompt" .-> AI["GitHub API + Claude API"]
    Browser -- "Bearer JWT" --> API
```

Reading published projects is public. Everything that changes data (`POST`, `PUT`, `DELETE`, reordering, image upload, GitHub import and the AI endpoint) needs a valid token.

## Run it locally

You need Python 3.10+ and Node 20+.

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # then set JWT_SECRET and ADMIN_PASSWORD
alembic upgrade head        # creates the tables
python -m app.seed          # optional: adds my projects
uvicorn app.main:app --reload
```

The API docs are at <http://localhost:8000/docs>. The owner account is created on startup from `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Log in at `/login`, then the buttons appear on the projects page. If no account exists (for example because `ADMIN_PASSWORD` was empty on the first start), run `python -m app.create_admin` to create it or to reset the password.

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

**Or with Docker** (API + Postgres):

```bash
cp .env.example .env        # set JWT_SECRET and ADMIN_PASSWORD
docker compose up --build
```

## Tests

```bash
cd backend
pytest -q
ruff check .
```

The tests cover login, token handling, protected routes, validation, CRUD, hiding, ordering, image upload, the seed script, the GitHub import and the AI endpoint (with GitHub and Claude mocked). To run them against Postgres too:

```bash
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/portfolio_test pytest -q
```

CI runs ruff and the tests on SQLite and on a Postgres service, plus the frontend build, on every pull request.

## Deployment

`render.yaml` describes two Render services (API and static site). The database is a Neon Postgres. Steps:

1. Create a Neon project and copy the connection string.
2. On Render, create a Blueprint from this repo and fill in `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CORS_ORIGINS` (the frontend URL) and `VITE_API_URL` (the API URL).
3. Seed the projects once from my machine: `DATABASE_URL=<neon url> python -m app.seed`.

The free Render tier goes to sleep, so the first request after a while can take around 30 seconds.

## Decisions and trade-offs

- **FastAPI** because I like Python and I get validation and OpenAPI docs almost for free.
- **Passwords** are stored as salted PBKDF2-HMAC-SHA256 hashes (200k iterations) and compared in constant time. There is no public registration route, the only user is created from environment variables.
- **JWT in `localStorage`** is simple but readable by injected scripts. For a single-admin portfolio I accepted that. For something bigger I would use an httpOnly cookie.
- **Secrets** only come from environment variables, `.env` is git-ignored.
- **The AI endpoint** only returns a draft and never saves anything. The README is treated as untrusted input in the prompt.
- **Images are stored in Postgres** (a separate table, so listing projects never loads them). That keeps the setup to one database with nothing extra to configure. It is fine for a handful of screenshots, for lots of images I would switch to object storage.
- **Uploads** are limited to 1 MB and checked by their magic bytes (PNG, JPEG, WebP), not by file name.
- **Drag and drop has arrow buttons as an alternative**, so reordering also works with a keyboard.

## What I would do next

- Rate limiting on the login route
- Frontend tests (Vitest and React Testing Library)
- Refresh tokens or cookie-based sessions

## Project layout

```
backend/    FastAPI app, Alembic migrations, tests
frontend/   React + Vite app
legacy/     my first static version of this site
.github/    CI workflow
```
