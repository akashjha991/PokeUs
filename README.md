# 💜 PokeUs — Your Private Space for Two

> A production-ready, full-stack couple-connect platform inspired by Between and Closerly. Built with Next.js 15, TypeScript, Prisma, PostgreSQL, Socket.IO, and a premium glassmorphism UI.

---

## ✨ Features

- 🔐 **Auth System** — Email/password signup, OTP verification, forgot password, JWT sessions
- 💑 **Couple Pairing** — Invite partner via email, private shared space
- 💬 **Real-Time Chat** — Typing indicators, emoji reactions, reply-to messages
- 📸 **Shared Memories** — Animated timeline, photo uploads via Cloudinary
- 😊 **Mood Tracker** — Daily emoji check-ins, weekly analytics chart
- 📝 **Notes & Todos** — Color-coded notes, collaborative todo lists
- 💰 **Expense Tracker** — Split bills, category charts, monthly analytics
- 📅 **Calendar** — Anniversary & event reminders with countdown
- 🏆 **Gamification** — XP system, streaks, couple badges
- 📲 **PWA** — Installable on Android, offline support

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd "PokeUs Dev"
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your values:

```env
# PostgreSQL — Get free DB from https://neon.tech
DATABASE_URL="postgresql://user:password@host:5432/pokeus?sslmode=require"

# JWT secrets (any random 32+ char strings)
JWT_SECRET="your-super-secret-jwt-key-here-min-32-chars"
JWT_REFRESH_SECRET="another-secret-for-refresh-tokens-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Resend — https://resend.com (free tier: 100 emails/day)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Cloudinary — https://cloudinary.com (free tier)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="pokeus_uploads"
```

### 3. Set Up Database

```bash
# Push schema to your DB (no migrations needed for dev)
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Run the App

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🗄️ Database Setup (Neon — Free Tier)

1. Go to [neon.tech](https://neon.tech) → Sign up → Create project
2. Copy the **Connection String** from the dashboard
3. Paste it as `DATABASE_URL` in `.env.local`
4. Run `npm run db:push`

---

## 📧 Email Setup (Resend)

1. Go to [resend.com](https://resend.com) → Sign up (free: 100 emails/day)
2. Create an API key → paste as `RESEND_API_KEY`
3. Add and verify your domain (or use the sandbox for testing)
4. Set `RESEND_FROM_EMAIL` to `noreply@yourdomain.com`

---

## 🖼️ Image Upload Setup (Cloudinary)

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up (free tier)
2. Go to **Settings → Upload → Upload Presets**
3. Create a preset named `pokeus_uploads` (set to unsigned)
4. Copy your Cloud Name, API Key, and API Secret to `.env.local`

---

## 🚀 Deployment (Vercel + Neon)

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com).

### Environment Variables on Vercel

In Vercel dashboard → Project Settings → Environment Variables → add all keys from `.env.local`.

---

## 📁 Project Structure

```
PokeUs Dev/
├── app/
│   ├── (landing)         # Landing page
│   ├── login/            # Auth pages
│   ├── signup/
│   ├── verify-otp/
│   ├── forgot-password/
│   ├── dashboard/        # App pages
│   ├── chat/
│   ├── memories/
│   ├── mood/
│   ├── notes/
│   ├── expenses/
│   ├── calendar/
│   ├── profile/
│   ├── settings/
│   └── api/              # API routes
│       ├── auth/
│       └── couple/
├── components/
│   ├── layouts/          # AppShell, AuthLayout
│   └── providers.tsx
├── lib/
│   ├── auth.ts           # JWT helpers
│   ├── db.ts             # Prisma client
│   ├── email.ts          # Resend OTP
│   ├── cloudinary.ts     # Image upload
│   ├── utils.ts          # Helpers
│   └── validations/      # Zod schemas
├── store/                # Zustand stores
├── types/                # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
├── public/
│   └── manifest.json     # PWA config
├── middleware.ts          # Route protection
└── .env.example          # Environment template
```

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

---

## 🔒 Security Features

- ✅ JWT access tokens (15min) + refresh tokens (30 days)
- ✅ HTTP-only secure cookies
- ✅ bcrypt password hashing (12 rounds)
- ✅ Zod input validation on all API routes
- ✅ OTP expiry (10 minutes)
- ✅ Email enumeration protection on forgot password
- ✅ Protected routes via Next.js middleware

---

## 📲 PWA Installation (Android)

1. Open `https://your-deployment.vercel.app` in Chrome on Android
2. Tap the **"Add to Home Screen"** banner or menu option
3. PokeUs will install like a native app 🎉

---

## 🗺️ Roadmap

- [ ] Socket.IO real-time chat integration
- [ ] Cloudinary upload in memories page
- [ ] Push notifications
- [ ] Couple themes (locked behind XP)
- [ ] Video call feature
- [ ] Play Store PWA wrapper

---

Made with 💜 by PokeUs Team
