<div align="center">
  <h1>Indie</h1>
  <p>A visual discovery and creative inspiration platform — your personal canvas for pins and boards.</p>

  <img src="https://img.shields.io/badge/Expo-56.x-black?style=flat-square&logo=expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.85-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Supabase-backend-3ECF8E?style=flat-square&logo=supabase" />
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square" />
</div>

---

## Overview

**Indie** is a full-stack mobile (and web) application built with **Expo Router**, **React Native**, and **Supabase**. It lets users discover, save, and share visual content — similar to Pinterest — with a focus on a clean, modern UI and personalised content recommendation.

Users can create boards to organise their pins, follow other creators, choose from a rich list of interests to tune their home feed, and publish their own photos and artwork.

---

## Features

- **Home Feed** — Personalised masonry grid of pins based on selected interests
- **Pin Creation** — Upload images with a built-in photo editor, crop tool, and board picker
- **Boards** — Create public or private collections to organise your pins
- **User Profiles** — Follow other creators, view their public boards and pins
- **Interests** — Select topics (Photography, UI Design, Travel, etc.) to tune feed recommendations
- **Search** — Discover users and content across the platform
- **Notifications** — Real-time activity notifications
- **Settings** — Edit profile, manage appearance (light/dark/system), notifications, privacy, and language
- **Authentication** — Email/password sign-up and login via Supabase Auth
- **Responsive Layout** — Adaptive desktop sidebar layout and mobile stack navigation
- **Legal Pages** — Terms of Service, Privacy Policy, Child Safety Standards Policy
- **Child Safety** — In-app reporting mechanism and published zero-tolerance child safety standards

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 56) + [Expo Router](https://expo.github.io/router) |
| UI | React Native, Lucide Icons, Expo Linear Gradient, Expo Blur |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Backend | [Supabase](https://supabase.com) (Postgres, Auth, Storage, Realtime) |
| Forms | React Hook Form + Zod validation |
| Image | Expo Image Picker, Expo Image Manipulator, Shopify React Native Skia |
| Lists | Shopify FlashList |
| Fonts | DM Sans, Poppins (via Expo Google Fonts) |
| Language | TypeScript |
| Build | EAS Build + EAS Update |

---

## Project Structure

```
indie/
├── app/                    # Expo Router file-based routes
│   ├── (auth)/             # Login & sign-up screens
│   ├── (onboarding)/       # Interest selection onboarding
│   ├── (tabs)/             # Main tab navigator (Home, Search, Create, Notifications, Profile)
│   ├── board/              # Board detail screen
│   ├── create/             # Pin & board creation flows
│   ├── help/               # FAQ, Getting Started, Contact Support, Submit Feedback
│   ├── legal/              # Terms of Service, Privacy Policy, Child Safety Standards
│   ├── pin/                # Pin detail screen
│   ├── search/             # User search
│   ├── settings/           # Settings screens (profile, appearance, notifications, privacy, etc.)
│   └── user/               # Public user profile screen
├── src/
│   ├── components/         # Reusable UI components (Button, Input, Avatar, Modal, etc.)
│   ├── hooks/              # Custom hooks (useTheme, etc.)
│   ├── lib/                # Supabase client setup
│   ├── stores/             # Zustand stores (authStore, themeStore)
│   ├── theme/              # Design tokens and theme definitions
│   ├── types/              # TypeScript database types
│   └── utils/              # Validators, image upload utilities
├── assets/                 # App icons, splash screen images
├── supabase/               # Supabase local config & migrations
├── app.json                # Expo app config
├── eas.json                # EAS Build config
└── SETUP.md                # Full backend setup guide
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/) (recommended) or npm
- [Expo Go](https://expo.dev/go) app on your device, or a simulator
- A [Supabase](https://supabase.com) project

### 1. Clone the repository

```bash
git clone https://github.com/Mister-Ritom/indie.git
cd indie
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the Supabase database

Refer to the full SQL schema, RLS policies, and storage bucket setup in [SETUP.md](./SETUP.md).

### 5. Start the development server

```bash
bun run start
```

Scan the QR code with **Expo Go** or press `w` to open in the browser, `a` for Android emulator, or `i` for iOS simulator.

---

## Building for Production

Indie uses [EAS Build](https://docs.expo.dev/build/introduction/) for native builds.

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Publish an OTA update
eas update --branch production
```

---

## Child Safety

Indie is committed to providing a safe environment for all users. We have a published **zero-tolerance policy** against child sexual abuse and exploitation (CSAE/CSAM). You can read the full policy inside the app under **Settings → Child safety standards**.

For urgent child safety concerns, contact: **ritomghosh856@gmail.com**

---

## License

This project is licensed under the terms of the [MIT License](./LICENSE).

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Mister-Ritom">Ritom Ghosh</a></p>
</div>
