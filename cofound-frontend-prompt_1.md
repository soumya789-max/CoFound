# Prompt: Rebuild the CoFound Frontend (Backend Untouched)

Paste this into your coding tool (Claude Code, Cursor, etc.) with the repo open.

---

## Context

This is **CoFound**, a MERN app that helps college students team up for hackathons, projects, startup ideas, and college events. The backend (Express + MongoDB, under `src/`) is complete and must **not be modified** — no changes to routes, controllers, models, middleware, or `src/index.js`. Only work inside `frontend/`.

### Backend API surface (for reference — build the UI around these, don't invent new endpoints)

**Auth** (`/api/auth`)
- `POST /register` — body: `name, email, password, college, branch, year`
- `POST /login` — body: `email, password`
- `GET /profile` / `PUT /profile` — get/update own profile (bearer token)
- `GET /users/:id` — public profile view of another user
- `POST /send-otp`, `POST /verify-otp` — college email verification flow

**User fields**: `name, email, college, branch, year, skills[], bio, isVerified`

**Listings** (`/api/listings`)
- `POST /`, `GET /` — create / browse listings
- `GET /my` — listings I posted
- `GET /recommendations` — recommended listings for me
- `GET/PUT/DELETE /:id`

**Listing fields**: `title, description, category (Hackathon | College Project | Startup Idea | College Event), skillsNeeded[], teamSize, deadline, postedBy, status (Open | Requested | Team Full | Closed), members[]`

**Requests** (`/api/requests`) — joining a listing's team
- `POST /` — send join request
- `GET /sent`, `GET /incoming`
- `DELETE /:id/cancel`, `PUT /:id/decide` (accept/reject)
- statuses: `Pending | Accepted | Rejected | Cancelled | Expired`

**Messages** (`/api/messages/:listingId`) — per-listing team chat, `GET` history / `POST` new message. Real-time via `socket.io-client` already wired in `App.jsx`.

**Notifications** (`/api/notifications`) — `GET /`, `PUT /read-all`, `PUT /:id/read`, `DELETE /:id`. Types: `NEW_REQUEST, REQUEST_ACCEPTED, REQUEST_REJECTED, TEAM_FULL`. Delivered live over the existing socket connection (`new_notification` event) — keep that logic intact, just restyle.

### Current frontend stack
- React 19 + Vite, plain CSS (`src/index.css`, no Tailwind currently installed)
- `lucide-react` for icons, `socket.io-client` for real-time
- Existing views to rework: `AuthView.jsx`, `FeedView.jsx`, `DashboardView.jsx`, `ProfileView.jsx`, plus `App.jsx` as the shell/router (simple `currentView` state, no react-router yet)

---

## Design system to apply

**Brand**: CoFound (trophy/hourglass icon + wordmark)
- Dark-mode lockup: trophy icon + "CoFound" wordmark on the darkest background color
- Light-mode lockup: same lockup on the lightest background color
- Use these exact two logo treatments for dark/light theme respectively (assets attached separately — save them into `frontend/src/assets/` as `logo-dark.svg`/`logo-light.svg` or equivalent and reference them, don't recreate the mark from scratch)

**Color palette** (warm espresso-to-blush gradient scale):
| Token | Hex |
|---|---|
| `--color-950` (darkest, dark-mode bg) | `#2A0800` |
| `--color-800` | `#775144` |
| `--color-600` | `#C09891` |
| `--color-400` | `#BEA8A7` |
| `--color-50` (lightest, light-mode bg) | `#F4D8D8` |

Build a full light/dark theme off this scale (derive surfaces, borders, muted text, etc. from these five stops rather than introducing unrelated colors) and implement it as CSS custom properties so a **theme toggle** can flip `data-theme="light"` / `"dark"` on the root element.

---

## What to build

1. **Landing page** (new — public, unauthenticated entry point)
   - Hero section: value prop headline, subhead, primary CTA ("Get Started" → register) and secondary CTA ("Log In")
   - Features section covering: discover listings by category, send/manage join requests, real-time team chat, notifications, verified-student profiles
   - Uses the correct logo for the active theme
   - Theme toggle visible in the header

2. **Theme toggle**: persistent icon (sun/moon from `lucide-react`) present in the header of **every** page — landing, auth, dashboard, explore, profile — switching the full palette above, not just a color or two.

3. **Auth page** (rework `AuthView.jsx`): combined login/register with tab or toggle switch between the two modes, matching the new theme, using the real fields from the User model (register needs `college, branch, year` in addition to name/email/password).

4. **Explore page** (rework `FeedView.jsx`): browse/search/filter listings by category, show status badges (Open/Requested/Team Full/Closed), send join request action, recommendations section using `/api/listings/recommendations`.

5. **Dashboard page** (rework `DashboardView.jsx`): "my listings" + incoming/sent join requests with accept/reject/cancel actions, notifications panel, and a way into the team chat for listings I'm part of.

6. **Profile page** (rework `ProfileView.jsx`): view mode for any user (`GET /users/:id`) and an editable mode for my own profile (`PUT /profile`) — skills as tags, bio, college/branch/year, verification badge state.

7. **Header profile menu**: top-right avatar/name, click opens a dropdown with "View Profile," "Edit Profile," and "Log Out" — reuse the same `ProfileView` in edit mode rather than building a separate page.

8. Keep the existing notification bell + OTP-verification banner behavior from `App.jsx`, just restyle them into the new design system.

---

## Constraints

- Do not touch anything under `src/` (backend) or change any API contract, request/response shape, or env var name.
- Keep using `fetch` against `API_URL` from `config.js` and the existing socket wiring — don't swap in a new HTTP client or add react-router unless it meaningfully simplifies the view-switching (optional, your call).
- Keep `lucide-react` for icons (already a dependency); don't add a new icon library.
- Fully responsive, accessible color contrast in both themes (check the `#2A0800` / `#F4D8D8` pairing against text especially).
