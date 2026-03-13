# 🏋️ FitTrack — Expo React Native App

A mobile fitness tracker built with **Expo SDK 52**, **expo-router**, and **expo-sqlite**. Fully offline — all data is stored locally on-device. No backend, no auth, no cloud.

---

## ✨ Features

- 📱 **Native iOS & Android** via Expo
- 🗄️ **On-device SQLite** — data persists locally with `expo-sqlite`
- 📊 **3 screens**: Dashboard · Log · Charts
- 🌓 **Dark / Light mode** — toggled from the header, persisted via `AsyncStorage`
- 🎨 **Neo-Brutalist design** — hard shadows, Bebas Neue display font, Space Mono labels
- ✏️ **Full CRUD** — add, edit, delete entries via a slide-up modal
- 📈 **SVG charts** — bar charts (calories, steps) + line chart (weight trend)
- ⚡ **Fully offline** — works with no internet connection

---

## 🚀 Quick Start

### 1. Install dependencies

```powershell
npm install
```

### 2. Download fonts (Windows PowerShell)

Run this from the project root:

```powershell
New-Item -ItemType Directory -Force -Path "assets\fonts"

Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.ttf" -OutFile "assets\fonts\BebasNeue-Regular.ttf"
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.ttf" -OutFile "assets\fonts\SpaceMono-Regular.ttf"
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/spacemono/v13/i7dMIFZifjKcF5UAWdDRYER8QHi-EwWMbg.ttf" -OutFile "assets\fonts\SpaceMono-Bold.ttf"
```

> **macOS/Linux:** Replace `Invoke-WebRequest -Uri ... -OutFile` with `curl -L ... -o`

### 3. Start the dev server

```powershell
npx expo start
```

Then:
- Press **`i`** — iOS Simulator (macOS only)
- Press **`a`** — Android Emulator
- Scan the QR code with **Expo Go** on your phone (iOS or Android)

---

## 📁 Project Structure

```
fittrack/
├── app/
│   ├── _layout.tsx              # Root: fonts, ThemeProvider, GestureHandler
│   ├── index.tsx                # Redirect → /(tabs)
│   └── (tabs)/
│       ├── _layout.tsx          # Tab bar (Dashboard / Log / Charts)
│       ├── index.tsx            # 📊 Dashboard screen
│       ├── log.tsx              # 📋 Log screen (CRUD list)
│       └── charts.tsx           # 📈 Charts screen
├── components/
│   ├── StatCard.tsx             # Neo-brutalist stat tile
│   ├── RecordRow.tsx            # Log list row with edit/delete
│   ├── LogEntryModal.tsx        # Add/edit slide-up modal
│   └── MiniChart.tsx            # Reusable SVG bar chart
├── hooks/
│   ├── useTheme.tsx             # Dark/light context + AsyncStorage
│   └── useRecords.ts            # All CRUD + state management
├── lib/
│   ├── db.ts                    # expo-sqlite database layer
│   ├── types.ts                 # TypeScript interfaces
│   ├── stats.ts                 # Avg, trend %, formatting
│   └── theme.ts                 # Color tokens + shadow styles
├── assets/
│   └── fonts/                   # BebasNeue + SpaceMono (download above)
├── app.json                     # Expo SDK 52 config
├── babel.config.js
├── metro.config.js
├── package.json
└── tsconfig.json
```

---

## 🗄️ Data Storage

SQLite on-device via `expo-sqlite` v15:

```sql
CREATE TABLE records (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL UNIQUE,
  calories   INTEGER,
  steps      INTEGER,
  weight     REAL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

Logging the same date twice **upserts** — it updates the existing record.

---

## 🏗️ Build for Production

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # or ios
```
