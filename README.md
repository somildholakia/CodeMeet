# CodeMeet

A collaborative coding and video-conferencing platform — real-time video, a synced Monaco editor, live code execution, and chat in one room.

## Stack

- **Client:** React 18, Vite, Tailwind CSS v4, TanStack Query, Socket.io client, Monaco Editor, Framer Motion
- **Server:** Node 22, Express 5, MongoDB Atlas + Mongoose 8, Socket.io, JWT in HTTP-only cookies
- **Authentication:** bcrypt password hashing, single-use email verification and password-reset tokens, Google Identity Services
- **Email:** Resend API
- **Execution:** Judge0 API

## Features

- Email/password registration with mandatory email verification
- Google sign-in with server-side ID-token validation and verified-email account linking
- Secure login/logout and session restoration with HTTP-only cookies
- Resend verification email, forgot password, and single-use password reset links
- Password changes invalidate previously issued sessions
- Dashboard: create, join, list, and delete meetings; custom meeting titles
- One-click copy of shareable meeting invite links
- Meeting room: WebRTC video grid (mesh, STUN-only), mic/camera/screen-share toggles
- Real-time collaborative Monaco editor (debounced broadcast + late-joiner sync)
- Code execution via Judge0 (8 languages) with stdout/stderr/time/memory
- Real-time chat with typing indicators
- Profile page: edit name, see email verification and sign-in methods, change or add a password

## Local setup

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Configure the following values in `server/.env`:

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long, random secret used to sign sessions |
| `CLIENT_URL` | Comma-separated allowed frontend origins |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID |
| `RESEND_API_KEY` | Resend API key for verification and reset emails |
| `EMAIL_FROM` | Sender address on a domain verified with Resend |
| `JUDGE0_API_KEY` | Judge0 execution API key |

The server runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_GOOGLE_CLIENT_ID` in `client/.env`. The client runs at `http://localhost:5173`.

## Google sign-in setup

1. Create a **Web application** OAuth client in Google Cloud Console and configure the OAuth consent screen.
2. Add `http://localhost:5173` and your production frontend origin (for example, `https://codemeet.dyvona.in`) under **Authorized JavaScript origins**.
3. Set the same Web Client ID as `GOOGLE_CLIENT_ID` in the server environment and `VITE_GOOGLE_CLIENT_ID` in the client environment.
4. Redeploy/restart both apps after saving the environment variables.

CodeMeet validates the Google ID token on the server, checks its audience/issuer/expiry and requires Google's verified-email claim. A Google login matching an existing CodeMeet email links Google to that account.

## Email delivery setup

1. Create a Resend account and verify a domain you control.
2. Create an API key and set `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to an address on that verified domain, such as `CodeMeet <no-reply@your-domain.com>`.
4. Set `CLIENT_URL` to the frontend origin so verification and reset links point to the correct app.

In development only, when Resend credentials are absent, the backend logs the email body and action link to the server console. Production sends fail closed when email delivery is not configured.

## Deployment notes

- **Frontend (Vercel):** set `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_GOOGLE_CLIENT_ID`.
- **Backend (Render):** set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `GOOGLE_CLIENT_ID`, `RESEND_API_KEY`, `EMAIL_FROM`, and `JUDGE0_API_KEY`.
- Add the production frontend origin to Google Authorized JavaScript origins and to `CLIENT_URL`.
- Older email/password accounts without an `emailVerified` value must verify their email before accessing protected routes; the login screen links to the resend flow.

## Known gaps to harden before production

- WebRTC currently uses STUN only — add a TURN server (for example, coturn or a managed provider) for reliable NAT traversal.
- Editor sync is last-write-wins broadcast, not operational transform/CRDT — suitable for small rooms, but it can conflict under concurrent typing at scale.
- Add automated unit, integration, and end-to-end tests for auth, meeting permissions, sockets, and WebRTC.
- Add distributed Socket.IO rate limiting and a shared adapter before horizontal scaling.
- Judge0 free-tier rate limits may require a paid tier or self-hosted execution service.
- Consider avatar uploads and paginated meeting/message history.

## Previously fixed

- **Socket auth:** room membership and sender identity derive from the verified session, not client-supplied values.
- **Mobile meeting room:** editor and chat are accessible in a full-screen mobile overlay.
- **Screen sharing:** outbound video tracks are replaced on every peer connection and restored when sharing stops.
- **Remote cursors:** collaborator cursor positions are broadcast and rendered in Monaco.
