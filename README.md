# 📻 Malaysian Radios

A modern, high-performance web application that lets users stream Malaysian radio stations. 

The project features a **Go** backend API backed by a **Turso (LibSQL)** database, and an **Astro** frontend built with Vanilla JS and Tailwind CSS for blazing-fast performance. Security is a first-class citizen, featuring an AES-GCM encrypted token-based authentication system.

---

## 🛠 Tech Stack

### Frontend
- ![Astro](https://img.shields.io/badge/Astro-0C1127?style=flat&logo=astro&logoColor=white) **Framework:** Astro (Server-Side Rendering + Static HTML)
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) **Styling:** Tailwind CSS (Vanilla CSS utilities)
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) **Interactivity:** Vanilla JavaScript (No React/Vue overhead)
- ![Lucide](https://img.shields.io/badge/Lucide-F97316?style=flat&logo=lucide&logoColor=white) **Icons:** Lucide Astro

### Backend
- ![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white) **Language:** Go
- ![Go-Chi](https://img.shields.io/badge/go--chi-00ADD8?style=flat&logo=go&logoColor=white) **Router:** `go-chi/chi/v5`
- ![Turso](https://img.shields.io/badge/Turso_LibSQL-49F3D5?style=flat&logo=sqlite&logoColor=black) **Database:** Turso (LibSQL Driver)
- ![Security](https://img.shields.io/badge/AES--GCM-Encryption-success?style=flat) **Security:** AES-GCM Encryption, SHA-256 Key Derivation

---

## 📁 Project Structure

```text
malaysian-radios/
├── client/                     # Astro Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Astro UI Components (Sidebar, RadioGrid, RadioCard)
│   │   ├── hooks/              # Data fetching utilities (useStations.ts)
│   │   ├── layouts/            # Global layouts
│   │   └── pages/              # Astro pages (index.astro)
│   ├── .env                    # Client environment variables (PUBLIC_API_BASE_URL, PUBLIC_CLIENT_SECRET)
│   └── package.json            # Frontend dependencies
│
├── server/                     # Go Backend
│   ├── cmd/
│   │   └── server/             # Application entrypoint (main.go)
│   ├── internal/               # Private application and business logic
│   │   ├── api/
│   │   │   ├── handler/        # HTTP route handlers (station.go)
│   │   │   └── router/         # API routing configuration (routes.go)
│   │   ├── crypto/             # AES-GCM token generation and validation (crypto.go)
│   │   ├── database/           # Turso DB connection and queries (db.go)
│   │   └── middleware/         # HTTP interceptors (auth.go)
│   ├── .env                    # Server environment variables (CLIENT_SECRET, SERVER_SECRET)
│   ├── go.mod                  # Go dependencies
│   └── seed.sql                # Initial database schema and mock data
└── README.md
```

---

## 🔐 Architecture & Security

### How the Server Handles Requests
The Go backend is designed to protect radio stream URLs and station data from unauthorized scraping. It uses a **Token-based Authentication** system built entirely from scratch using Go's native `crypto` libraries.

1. **Token Generation (`/api/token`)**:
   - The server expects a `X-Client-Secret` header that matches its internal `.env` configuration.
   - If valid, the server derives a highly secure 32-byte key using `SHA-256(CLIENT_SECRET + SERVER_SECRET)`.
   - It then generates a JSON payload with a 1-hour expiration timestamp and encrypts it using **AES-GCM**.
   - This encrypted token is returned to the client.

2. **Route Protection (`TokenAuthMiddleware`)**:
   - All data endpoints (`/api/stations` and `/api/stations/{id}`) are protected by the `TokenAuthMiddleware`.
   - The middleware intercepts incoming requests, extracts the `Bearer <token>` from the `Authorization` header, and securely decrypts it.
   - If the token is missing, tampered with, or expired, the request is instantly rejected with a `401 Unauthorized` status.

### How the Client Operates
The Astro frontend is built for maximum speed and SEO, relying heavily on Server-Side Rendering (SSR) for the initial payload and Vanilla JS for client-side interactivity.

1. **Initial SSR Load**:
   - When a user visits the site, the Astro Node.js server securely fetches the initial token and the first 20 stations *before* rendering the HTML. 
   - The initial network requests are completely hidden from the browser.

2. **Lazy Loading (Infinite Scroll)**:
   - The `RadioGrid.astro` component uses a Vanilla JS `IntersectionObserver`. 
   - As the user scrolls to the bottom of the grid, it dynamically fetches the next 20 stations (`?limit=20&offset=20`) using the active AES-GCM token and injects them into the DOM.

3. **Background Token Refresh**:
   - To ensure the 1-hour token never expires while the user is actively listening, a background `setInterval` silently requests a fresh token every **55 minutes** (via a lightweight `?limit=0` query).

4. **Secure Playback**:
   - Stream URLs are **not** hardcoded into the HTML buttons.
   - When a user clicks "Play", the client fires a `play-station` event. 
   - The Javascript player intercepts this, securely fetches the exact stream URL from `/api/stations/{id}` using the active token, and directly loads it into the HTML5 `<audio>` tag.

---

## 🚀 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/token` | Validates client secret and returns 1-hour AES-GCM token. | `X-Client-Secret` |
| `GET` | `/api/stations` | Returns a paginated list of radio stations (`limit`, `offset`). | `Bearer Token` |
| `GET` | `/api/stations/{id}` | Returns data for a specific station, including the stream URL. | `Bearer Token` |

---

## 💻 Local Development

### 1. Environment Variables
You need two `.env` files.

**`server/.env`**
```env
TURSO_DATABASE_URL=libsql://your-db-url.turso.io
TURSO_AUTH_TOKEN=your-turso-token
CLIENT_SECRET=your-client-secret-key-123
SERVER_SECRET=your-super-secure-server-secret-456
```

**`client/.env`**
```env
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_CLIENT_SECRET=your-client-secret-key-123
```

### 2. Running the Backend
```bash
cd server
go mod tidy
go run cmd/server/main.go
# Server runs on http://localhost:8080
```

### 3. Running the Frontend
```bash
cd client
pnpm install
pnpm dev
# Client runs on http://localhost:4321
```
