# FindIt: Smart Lost & Found Platform

FindIt helps people get lost belongings back. Users report **lost** or **found** items with photos and a map pin; the app **automatically suggests matches**, lets owners **prove ownership** with a secret question, and provides **real-time chat** and **notifications** to arrange the handover. Admins get a dashboard to moderate users and items.

## Features

| Area | What it does |
|---|---|
| **Accounts** | JWT auth, user/admin roles, protected routes, account blocking |
| **Items** | Create, edit and delete lost/found reports with up to 4 photos (Cloudinary), category, date and a map location |
| **Browse & map** | Filters (type, category, status, date, keyword), "near me" radius search, sort by distance, clustered colour-coded map pins |
| **Smart matching** | Scores lost↔found pairs by keyword similarity (50%), distance (30%) and date gap (20%), re-runs on create/edit, lets you hide suggestions |
| **Claims** | Claim with a message and an answer to the finder's verification question; the poster approves or rejects; contact details are shared only after approval; the finder earns reputation points |
| **Chat** | Socket.io messaging per item: typing indicator, online status, seen receipts, unread badges |
| **Notifications** | In-app, real time: new match, new claim, claim approved/rejected/withdrawn, messages while offline |
| **Admin panel** | Stats overview with a 14-day chart and categories; manage users (block, change role, delete everything they own); moderate items |

## Tech stack

- **Client:** React 19, Vite, React Router, Tailwind CSS v4, Leaflet + react-leaflet (marker clustering), Axios, socket.io-client, react-hot-toast
- **Server:** Node.js, Express 5, MongoDB + Mongoose, JWT, bcrypt, Multer + Cloudinary, Socket.io, Helmet

## Project structure

```
FindIT/
├── client/                 React app (Vite)
│   └── src/
│       ├── components/     admin, chat, common, items, map
│       ├── context/        AuthContext, SocketContext
│       ├── pages/          public pages, dashboard/, admin/, auth/
│       ├── services/       one Axios wrapper per API area
│       └── utils/          helpers, map icons, notification meta
└── server/                 Express API
    ├── config/             MongoDB + Cloudinary
    ├── controllers/        auth, items, claims, matches, chats, notifications, admin
    ├── middleware/         auth (protect/optionalAuth), roles, uploads, errors
    ├── models/             User, Item, Claim, Match, Conversation, Message, Notification
    ├── routes/
    ├── sockets/            Socket.io auth, rooms, typing, online tracking
    └── utils/              matching algorithm, notify helper, seed scripts
```

## Getting started

### Prerequisites
- Node.js 20+
- A MongoDB database (e.g. a free MongoDB Atlas cluster)
- A Cloudinary account (free tier is fine) for image uploads

### 1. Install
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

**`server/.env`** (copy from `server/.env.example`):
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/findit
JWT_SECRET=<a long random string>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=http://localhost:5173
```

**`client/.env`**:
```env
VITE_API_URL=http://localhost:5000/api
```

> Both `.env` files are git-ignored. Never commit real secrets.

### 3. (Optional) seed data
```bash
cd server
npm run seed:admin   # creates an admin account (see utils/seedAdmin.js for credentials)
npm run seed:items   # adds sample lost/found items
```

### 4. Run
```bash
# terminal 1
cd server && npm run dev      # http://localhost:5000

# terminal 2
cd client && npm run dev      # http://localhost:5173
```

> **Windows PowerShell:** if `npx`/`npm` scripts are blocked by the execution policy, use `npm.cmd` / `npx.cmd`, or run the commands from Command Prompt.

## API overview

All routes are prefixed with `/api`. 🔒 = login required, 🛡️ = admin only.

| Prefix | Endpoints |
|---|---|
| `/auth` | `POST /register`, `POST /login`, `GET /me` 🔒 |
| `/items` | `GET /`, `GET /map`, `GET /mine` 🔒, `GET /:id`, `POST /` 🔒, `PUT /:id` 🔒, `PATCH /:id/status` 🔒, `DELETE /:id` 🔒 |
| `/claims` 🔒 | `GET /mine`, `GET /received`, `GET /pending-count`, `POST /item/:itemId`, `PATCH /:id/status` |
| `/matches` 🔒 | `GET /mine`, `GET /item/:itemId`, `POST /item/:itemId/refresh`, `PATCH /:id/dismiss` |
| `/chats` 🔒 | `GET /`, `GET /unread-count`, `POST /item/:itemId`, `GET /:id/messages`, `POST /:id/messages`, `PATCH /:id/read` |
| `/notifications` 🔒 | `GET /`, `GET /unread-count`, `PATCH /read-all`, `PATCH /:id/read`, `DELETE /:id`, `DELETE /` |
| `/admin` 🛡️ | `GET /stats`, `GET /users`, `PATCH /users/:id/block`, `PATCH /users/:id/role`, `DELETE /users/:id`, `GET /items` |

**Socket.io events** (same host as the API, authenticated with the JWT):
`chat:message`, `chat:typing`, `chat:read`, `notification:new`.

## How matching works

When an item is created, edited or reopened, the server looks at **open** items of the opposite type that are in the **same category**, within **10 km**, and found at most 1 day before / 60 days after the loss. Each pair is scored:

```
score = 50% × keyword cosine similarity (title words weighted ×2)
      + 30% × (1 − distance / 10 km)
      + 20% × (1 − days apart / 60)
```

Pairs scoring **35 or more** are saved and both posters are notified. Tune these values at the top of `server/utils/matchingAlgorithm.js`.

## Roadmap
- Email notifications (nodemailer is already installed)
- QR code labels for valuables
