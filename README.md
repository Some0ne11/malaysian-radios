# 📻 Malaysian Radios

[![Netlify Status](https://api.netlify.com/api/v1/badges/afba96cd-a4e0-459e-ae0d-c57596791d37/deploy-status)](https://app.netlify.com/projects/malaysian-radios/deploys)

A modern, high-performance web application that lets users stream Malaysian radio stations. 

The project features a **Go** backend API backed by a **Turso (LibSQL)** database, and an **Astro** frontend built with Vanilla JS and Tailwind CSS for blazing-fast performance. Security is a first-class citizen, featuring an AES-GCM encrypted token-based authentication system.

---

## 🛠 Tech Stack

### Frontend
- ![Astro](https://img.shields.io/badge/Astro-0C1127?style=flat&logo=astro&logoColor=white) **Framework:** Astro (Server-Side Rendering + Static HTML)
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) **Styling:** Tailwind CSS (Vanilla CSS utilities)
- ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) **Interactivity:** Vanilla TypeScript (No React/Vue overhead)
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
│   ├── public/                 # Static assets (favicon)
│   ├── src/
│   │   ├── components/         # Astro UI Components (Sidebar, RadioGrid, RadioCard)
│   │   ├── hooks/              # Data fetching utilities (useStations.ts)
│   │   ├── layouts/            # Global layouts
│   │   ├── pages/              # Astro pages (index.astro)
│   │   ├── scripts/            # Client-side JavaScript/TypeScript logic
│   │   └── styles/             # Global CSS (global.css)
│   ├── .env                    # Client environment variables
│   └── package.json            # Frontend dependencies
│
├── server/                     # Go Backend
│   ├── api/                    # Vercel serverless function entrypoint (index.go)
│   ├── cmd/
│   │   ├── server/             # Local application entrypoint (main.go)
│   │   └── token/              # CLI Utility for manual token generation/verification (main.go)
│   ├── internal/               # Private application and business logic
│   │   ├── api/
│   │   │   ├── handler/        # HTTP route handlers (station.go)
│   │   │   └── router/         # API routing configuration (routes.go)
│   │   ├── config/             # Environment variables parser (config.go)
│   │   ├── crypto/             # AES-GCM token generation and validation (crypto.go)
│   │   ├── database/           # Turso DB connection and queries (db.go)
│   │   └── middleware/         # HTTP interceptors (auth.go)
│   ├── .env                    # Server environment variables
│   ├── go.mod                  # Go dependencies
│   ├── go.sum
│   └── database.sql            # Initial database schema and mock data
└── README.md
```

---

## 🔐 Architecture & Security

### How the Server Handles Requests
The Go backend is designed to protect radio stream URLs and station data from unauthorized scraping. It uses a **Token-based Authentication** system built entirely from scratch using Go's native `crypto` libraries.

1. **Token Generation (`/api/token`)**:
   - The server expects a `X-Client-Secret` header that matches its internal `.env` configuration.
   - **Key Derivation:** It dynamically derives a perfectly sized, mathematically secure 32-byte key using `SHA-256(CLIENT_SECRET + SERVER_SECRET)`.
   - **Payload:** It creates a lightweight JSON payload containing only an expiration timestamp (`{"exp": 1718000000}`), set to exactly 1 hour from generation.
   - **Encryption (AES-GCM):** It generates a random nonce (number used once) and uses AES in Galois/Counter Mode (GCM) to encrypt the JSON payload. The random nonce ensures that even if two tokens are generated at the exact same second with the identical payload, their final encrypted strings will look completely different. GCM also attaches an unforgeable "authentication tag" to the data.
   - **Encoding:** The random nonce and encrypted data are stitched together and encoded into a URL-safe Base64 string, which becomes the final token.

2. **Route Protection (`TokenAuthMiddleware`)**:
   - All data endpoints (`/api/stations` and `/api/stations/{id}`) are protected by the `TokenAuthMiddleware`.
   - The middleware intercepts incoming requests and extracts the `Bearer <token>`.
   - **Decryption:** It Base64 decodes the string, slices off the nonce, and attempts to decrypt the remaining data using the server's internal SHA-256 key.
   - **Validation:** If a malicious user alters even a single character of the token, the GCM authentication tag validation will instantly fail. If decrypted successfully, it parses the JSON and ensures the current time has not surpassed the `exp` timestamp.
   - If the token is missing, tampered with, or expired, the request is instantly rejected with a `401 Unauthorized` status.

3. **Anti-Spam Rate Limiting (The Ban Hammer)**:
   - To prevent malicious users or automated scripts from spamming the stream endpoints, the backend employs a strict, memory-efficient rate limiter in the `TokenAuthMiddleware`.
   - The server maintains a highly concurrent, in-memory map tracking the exact millisecond timestamps of every API hit per token.
   - **Threshold:** If a single token makes more than 6 requests within a 1-second window, it is instantly flagged for abuse.
   - **Permanent Ban:** Flagged tokens are permanently written to a `blocked_tokens` table in the SQLite database and pushed into a globally synchronized `blockedTokensCache`.
   - All subsequent requests using the banned token are instantly rejected with a `403 Forbidden` status using the in-memory cache, requiring zero database queries and protecting server bandwidth.

### Developer CLI Tool
To aid in debugging and education, a dedicated CLI utility is provided to manually generate and inspect AES-GCM tokens directly from the terminal. 

```bash
cd server

# Generate a new token and see the step-by-step encryption breakdown
go run cmd/token/main.go generate

# Decrypt an existing token to view its sliced bytes and JSON payload
go run cmd/token/main.go verify <your_token>
```

### How the Client Operates
The Astro frontend is built for maximum speed and SEO, relying heavily on Server-Side Rendering (SSR) for the initial payload and Vanilla JS for client-side interactivity.

1. **Optimized SSR & Token Persistence**:
   - The frontend uses cookie-based persistence (`mr_session`) to store the active token across page reloads.
   - When a user visits the site, `index.astro` intercepts the request. If a valid cookie exists, Astro skips generating a new token and immediately fetches the first 15 stations using the cached token.
   - If no valid token exists, Astro fetches a fresh token and the first 15 stations, injecting a `Set-Cookie` header into the HTTP response.
   - This ensures page reloads do not hammer the Go server with redundant token generation requests.

2. **Client-Side Obfuscation**:
   - The AES-GCM token from the Go server is securely obfuscated before being stored in the browser cookie to prevent casual snooping in DevTools.
   - **XOR Cipher pipeline:** The raw token is Base64 encoded, reversed entirely, mathematically scrambled using an XOR cipher against the `PUBLIC_CLIENT_SECRET`, and then securely URI/Base64 encoded again to safely fit inside the cookie.

3. **Lazy Loading (Infinite Scroll)**:
   - The `RadioGrid.astro` component uses a Vanilla JS `IntersectionObserver`. 
   - As the user scrolls to the bottom of the grid, it dynamically fetches the next 15 stations (`?limit=15&offset=15`) using the cookie-cached AES-GCM token and injects them into the DOM.

4. **Background Token Refresh**:
   - To ensure the 1-hour token never expires while the user is actively listening, a background `setInterval` silently requests a fresh token every **55 minutes**. When successful, it automatically overwrites the `mr_session` cookie.

5. **Secure Playback**:
   - Stream URLs are **not** hardcoded into the HTML buttons.
   - When a user clicks "Play", the client fires a `play-station` event. 
   - The Javascript player intercepts this, securely fetches the exact stream URL from `/api/stations/{id}` using the active token, and directly loads it into the HTML5 `<audio>` tag.

6. **Graceful Ban Handling**:
   - If the client-side fetchers intercept a `403 BANNED` response from the backend rate limiter, they throw a custom internal error which triggers an instant page reload.
   - The SSR process natively reads the banned cookie, catches the 403 error on the server side, and conditionally strips out the Radio Grid.
   - It seamlessly renders an "Access Restricted" overlay directly inside the app layout, instructing the user to wait up to 1 hour (when the background refresher automatically fetches an unbanned token and rescues them).

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
PORT=8080
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

---

## ⚖️ Legal & DMCA Notice

This repository contains **no copyrighted audio, streams, or media files**. It is solely an open-source software project consisting of a database schema, API routing logic, and a frontend interface designed to play external, user-provided URLs.

- **No Streams Hosted:** All radio streams played through this application are publicly available on the internet and are strictly fetched directly from the respective broadcasters' public servers via the client's browser.
- **No Links Provided:** This repository does not contain any hardcoded streaming links, M3U playlists, or proprietary broadcast URLs. Users must supply their own database entries and URLs.
- **Fair Use:** This application functions purely as a web-based audio player and directory interface, acting essentially as a specialized web browser. 

If you are a copyright owner and believe that a live deployment of this software is infringing on your rights, please note that the developers of this open-source repository have no control over third-party deployments or the data users choose to insert into their own independent databases.
