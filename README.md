# 💊 PillReminder

> Never miss a dose again — a full-stack multi-user medication reminder app with email notifications, streak tracking, and analytics.

**🌐 Live App → [pill-reminder-full-app.vercel.app](https://pill-reminder-full-app.vercel.app)**

---

![App Demo](app-demo.gif)

---

## Features

- **Google Sign-In** — one-click authentication, no passwords
- **Pill Management** — add pills with custom reminder hours, colors, and email frequency
- **Email Reminders** — automated reminders sent via your personal Resend API key
- **Mark as Taken** — log each dose with a single click
- **History & Analytics** — view adherence charts and a GitHub-style streak calendar
- **Dark / Light Mode** — full theme support
- **Mobile Friendly** — responsive design across all screen sizes

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Analytics charts |
| react-calendar-heatmap | Streak calendar |
| react-hot-toast | Notifications |
| @react-oauth/google | Google Sign-In |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| JSON Web Tokens | Authentication |
| google-auth-library | Google token verification |
| Resend | Email delivery |
| node-cron | Scheduled reminders |
| Joi | Request validation |
| Helmet + CORS | Security headers |
| express-rate-limit | Rate limiting |

---

## Architecture

```
pill-reminder-full-app/
├── frontend/          # React + Vite app (deployed on Vercel)
│   └── src/
│       ├── features/  # auth, dashboard, pills, settings, help
│       ├── context/   # AuthContext, ThemeContext
│       ├── services/  # API layer (axios)
│       └── components # Layout, ProtectedRoute, UI
│
└── backend/           # Express API (deployed on Render)
    └── src/
        ├── controllers/
        ├── models/    # User, Pill, PillLog
        ├── routes/
        ├── services/  # email, scheduler
        └── middleware/ # auth, validation, error handling
```

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | [pill-reminder-full-app.vercel.app](https://pill-reminder-full-app.vercel.app) |
| Backend | [Render](https://render.com) | Free tier + UptimeRobot keep-alive |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) | Free M0 cluster |

**Auth architecture:** Vercel proxies all `/api/*` requests to Render server-side. The browser only ever talks to `vercel.app`, so JWT tokens are stored in secure `httpOnly; SameSite=Strict` cookies — never exposed to JavaScript.

The backend is kept alive 24/7 using [UptimeRobot](https://uptimerobot.com) pinging the `/health` endpoint every 5 minutes, ensuring scheduled email reminders never miss a beat.

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google OAuth Client ID
- Resend account (for email)

### Setup

```bash
# Clone the repo
git clone https://github.com/GalShnitzer/pill-reminder-full-app.git
cd pill-reminder-full-app
```

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # runs on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
# create .env with:
# VITE_API_URL=http://localhost:5000/api
# VITE_GOOGLE_CLIENT_ID=your_google_client_id
npm install
npm run dev            # runs on http://localhost:5173
```

### Environment Variables

**backend/.env**
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_64_char_hex_secret
ENCRYPTION_KEY=your_32_char_hex_key
GOOGLE_CLIENT_ID=your_google_client_id
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**frontend/.env** (local development only)
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

> **Production (Vercel):** Set `VITE_API_URL=/api` — requests are proxied to Render via `vercel.json`.

---

## How It Works

1. **Sign in** with your Google account
2. **Add a pill** — set name, reminder times, color, and email frequency
3. **Get email reminders** — set up your free [Resend](https://resend.com) API key in Settings
4. **Mark doses taken** — click the checkmark on each pill card
5. **Track your streak** — view history, charts, and adherence calendar in the pill detail modal

---

## License

MIT
