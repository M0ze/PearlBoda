# 🏍️ PearlBoda — Open-Source Boda Network for Uganda

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Status-Beta-orange)](/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

**Decentralizing transport in Uganda. Empowering riders. Connecting communities.**

PearlBoda is a free, open-source ride-coordination platform for boda boda (motorcycle taxi) networks across Uganda. It gives passengers and independent riders a transparent way to coordinate rides without commission-taking middlemen.

## 🎯 Mission

Enable safe, affordable, and dignified transportation for millions of Ugandans by creating technology that puts riders and passengers in direct control of their mobility.

## ✨ What You Get

### 🚀 For Passengers

- ⚡ One-tap ride request with city and destination selection
- 📍 Safe ride status and assigned-driver updates
- 💰 Fare estimates in UGX with no hidden surge logic
- 🏆 Driver assignment and ride status events
- 📦 Delivery-ready pickup and drop-off fields
- 🔒 Shareable ride coordination through WhatsApp support

### 🏍️ For Riders (Drivers)

- 📲 Live pending-request queue over Socket.IO
- 💵 Ride status and earnings-ready ride records
- 📊 Driver-only ride acceptance and status transitions
- 🗺️ Authenticated location broadcast for active rides
- 🤝 Multi-city support for Kampala, Hioma, and Fort Portal

### 🌐 For the Community

- 💻 Open-source code that communities can audit and deploy
- 🛡️ Minimal public ride data and protected rider location endpoints
- 🔗 SQLite development storage with a clear production migration path
- 📚 API documentation and setup instructions
- 🤝 Contributions through GitHub issues and pull requests

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript + Vite | Mobile-first passenger experience |
| **Backend** | Node.js + Express | Ride, auth, fare, and health APIs |
| **Real-time** | Socket.IO | Driver queue, status, and location events |
| **Database** | SQLite (development) | Local ride and user persistence |
| **Maps** | Map adapter ready | City service-area visualization |
| **Auth** | JWT + bcrypt | Role-aware passenger and driver access |
| **Deploy** | Static frontend + Node API | Independent deploy targets |

### Key Features

- ✅ Multi-city ride requests
- ✅ JWT authentication with passenger/driver roles
- ✅ Driver-only ride acceptance and location updates
- ✅ WebSocket ride status events
- ✅ Responsive mobile-first UI
- ✅ Dark mode with persisted preference
- ✅ Reduced-motion support and keyboard navigation
- ✅ Contact handoff through WhatsApp and email

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Installation

```bash
git clone https://github.com/M0ze/PearlBoda.git
cd PearlBoda
npm install
cp .env.example .env
```

The frontend runs independently:

```bash
npm run dev
```

The API has its own dependency manifest:

```bash
cd server
npm install
cp .env.example .env
npm start
```

### Environment

Never commit `.env` files. For the API, set:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=http://localhost:5173
```

In production, `JWT_SECRET` must be at least 32 characters and `CORS_ORIGIN` must contain only the deployed frontend origin(s).

## 🔌 API Surface

| Method | Endpoint | Access |
|--------|----------|--------|
| `GET` | `/api/health` | Public |
| `GET` | `/api/cities` | Public |
| `GET` | `/api/contact` | Public |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/rides` | Public request creation |
| `GET` | `/api/rides` | Authenticated |
| `POST` | `/api/rides/:id/accept` | Driver |
| `PATCH` | `/api/rides/:id/status` | Assigned driver |
| `POST` | `/api/rides/:id/location` | Assigned driver |
| `POST` | `/api/fare-estimate` | Public |

Socket.IO clients can join `ride_{id}` for ride events and `role_driver` for new pending requests.

## 🛡️ Security and Privacy

- Passwords are bcrypt-hashed; plaintext passwords are never stored.
- Public ride responses omit passenger phone numbers.
- Driver location can only be broadcast by the assigned driver during an active ride.
- Production startup rejects missing or weak JWT secrets.
- CORS is allowlisted instead of wildcarded.
- Local databases and environment files are ignored by Git.

This project is open source by design. A public GitHub repository can be forked; use a private repository and GitHub organization restrictions when fork prevention is required.

## 🧭 Roadmap

- [ ] PostgreSQL adapter and migration runner
- [ ] Mapbox/Leaflet map provider integration
- [ ] Passenger account ride history UI
- [ ] Driver earnings dashboard
- [ ] Admin moderation and dispute tools
- [ ] Push notifications and offline queue
- [ ] Automated API and end-to-end test coverage

## 📞 Contact

- WhatsApp / mobile: [+256 764 625700](https://wa.me/256764625700)
- Email: [mugaggamozes@gmail.com](mailto:mugaggamozes@gmail.com)

## 🤝 Contributing

Open an issue with reproduction steps for bugs or a short proposal for new features. Keep changes focused, document API changes, and run `npm run build` and `npm run lint` before opening a pull request.

## 📄 License

MIT. See `LICENSE` when included in a deployment or distribution.
