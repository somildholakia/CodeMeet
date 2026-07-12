# CodeMeet

A collaborative coding & video conferencing platform — real-time video, a synced Monaco editor, live code execution, and chat, in one room.

## Stack

- **Client:** React 18, Vite, Tailwind CSS v4, TanStack Query, Socket.io client, Monaco Editor, Framer Motion
- **Server:** Node 22, Express 5, MongoDB Atlas + Mongoose 8, Socket.io, JWT (HTTP-only cookies)
- **Execution:** Judge0 API

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, JUDGE0_API_KEY
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The client runs on `http://localhost:5173`, the API on `http://localhost:5000`.

## What's implemented

- Auth (register/login/logout/session-restore) with JWT in HTTP-only cookies + bcrypt
- Dashboard: create/join/list/delete meetings
- Meeting room: WebRTC video grid (mesh, STUN-only), mic/camera/screen-share toggles
- Real-time collaborative Monaco editor (debounced broadcast + late-joiner sync)
- Code execution via Judge0 (8 languages) with stdout/stderr/time/memory
- Real-time chat with typing indicators
- Profile page (edit name, change password, stats)
- Landing page (hero, features, how it works, stats, CTA)

## Known gaps to harden before production

- WebRTC uses STUN only — add a TURN server (e.g. Twilio, coturn) for reliable NAT traversal in production.
- Editor sync is last-write-wins broadcast, not operational transform/CRDT — fine for 2-6 people, will conflict under heavy concurrent typing at scale.
- No automated tests yet (unit/integration/e2e).
- No rate limiting on the socket layer (only REST is rate-limited).
- Judge0 free tier has strict rate limits — swap for a paid tier or self-hosted instance for real traffic.
- No avatar upload — profile editing is name-only.
- No pagination on meeting/message lists.

## Fixed since initial scaffold

- **Socket auth**: joining a room now requires a valid JWT cookie, verified server-side via a Socket.io auth middleware — previously anyone with a roomId could connect and claim any name/identity. Chat sender name/id, cursor labels, and room membership are now derived from the verified session, not client-supplied data.
- **Mobile meeting room**: the code editor and chat panel were `hidden md:flex` — completely unreachable on phones. They now render as a full-screen overlay on mobile and a side panel on desktop. The toolbar also scrolls horizontally instead of overflowing on narrow screens.
- **Screen share**: previously only requested the display stream and flipped UI state without touching the call. It now actually replaces the outgoing video track on every peer connection (`RTCRtpSender.replaceTrack`), shows the shared screen in your own preview tile, and reverts to the camera automatically — both on toolbar click and when the user hits the browser's native "Stop sharing" control.
- **Remote cursors**: the `cursor-change` socket event existed but nothing rendered it. Cursor position is now broadcast (throttled to ~80ms) and rendered in Monaco as a colored line + name label per collaborator, cleaned up when they leave.
