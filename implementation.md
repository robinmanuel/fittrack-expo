# Implementation Notes — FitTrack Expo

---

## Architecture

FitTrack is a fully client-side Expo app. There is no backend, no API, and no authentication. All data lives in a SQLite database on the user's device via `expo-sqlite`.

```
User interaction
     ↓
React screen (app/(tabs)/*.tsx)
     ↓
Custom hook (hooks/useRecords.ts)
     ↓
DB layer (lib/db.ts)
     ↓
expo-sqlite → fittrack.db (on device)
```

---

## Navigation

`expo-router` uses file-based routing (same pattern as Next.js App Router):

```
app/
  index.tsx          →  /         (redirects to tabs)
  (tabs)/
    index.tsx        →  /(tabs)   (Dashboard)
    log.tsx          →  /(tabs)/log
    charts.tsx       →  /(tabs)/charts
```

The `(tabs)` group renders a shared `<Tabs>` navigator defined in `(tabs)/_layout.tsx`. The root `_layout.tsx` wraps everything in `ThemeProvider` and `GestureHandlerRootView`.

---

## Database Layer (`lib/db.ts`)

Uses `expo-sqlite` v14's async API (`openDatabaseAsync`, `getAllAsync`, `runAsync`). The database is opened lazily on first access and cached in a module-level variable:

```ts
let _db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("fittrack.db");
  await _db.execAsync(`PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS ...`);
  return _db;
}
```

`WAL` (Write-Ahead Logging) mode is enabled for better concurrent read performance.

### Upsert pattern

Instead of separate INSERT/UPDATE flows, a single SQL `ON CONFLICT` handles both:

```sql
INSERT INTO records (date, calories, steps, weight)
VALUES (?, ?, ?, ?)
ON CONFLICT(date) DO UPDATE SET
  calories = excluded.calories,
  steps    = excluded.steps,
  weight   = excluded.weight
```

This means logging the same date again will silently update — no duplicate error.

---

## State Management (`hooks/useRecords.ts`)

A single custom hook owns all record state. It:
1. Fetches all records on mount
2. Exposes `add`, `update`, `remove` mutations
3. After `add`, re-fetches from DB (to get server-assigned `id` and `created_at`)
4. After `update` and `remove`, does optimistic local state updates (no re-fetch needed)

```ts
const update = async (id, data) => {
  await db.updateRecord(id, data);
  setRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r)); // optimistic
};
```

---

## Theme System (`lib/theme.ts`, `hooks/useTheme.tsx`)

Two complete color palettes (`DARK`, `LIGHT`) are defined as plain TypeScript objects. The `ThemeProvider` stores the active scheme in React state and persists it to `AsyncStorage` with key `ft_theme`.

Components access colors via `const { colors } = useTheme()` and apply them as inline styles or `StyleSheet` values. All style objects that depend on theme are computed inside the component body (not at module level) so they re-render when the theme changes.

### Neo-Brutalist shadows

Hard, offset shadows with zero blur radius are the signature brutalist effect:

```ts
export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,   // ← no blur
  elevation: 6,      // Android
};
```

On iOS, `shadowRadius: 0` produces a crisp hard shadow. On Android, `elevation` is used instead (which has some inherent softness, but remains visually consistent).

---

## SVG Charts (`app/(tabs)/charts.tsx`)

Charts are built directly with `react-native-svg` primitives (`Rect`, `Polyline`, `Circle`, `Line`, `Text`). No charting library is used — this keeps the bundle lean and gives complete styling control.

### Bar chart layout math

```
chartW = SCREEN_W - padLeft - padRight
gap    = chartW / numBars          // space per bar slot
barW   = gap - 2                   // bar fills most of slot
x      = padLeft + i * gap + (gap - barW) / 2   // centered in slot
barH   = (value / maxVal) * chartH
y      = padTop + chartH - barH    // grow upward from baseline
```

### Line chart

Uses `<Polyline>` for connected segments, skipping null values by splitting into multiple segment arrays. `<Circle>` dots are drawn at each defined data point on top of the lines.

---

## Font Loading

Fonts are loaded in the root `_layout.tsx` using `useFonts` from `expo-font`. `SplashScreen.preventAutoHideAsync()` ensures the splash stays visible until fonts are ready. The layout renders `null` while loading:

```ts
const [loaded] = useFonts({ BebasNeue: require("..."), SpaceMono: require("...") });
useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
if (!loaded) return null;
```

---

## Adding a Backend (Future)

To sync data across devices, the local-first pattern can be extended:
1. Add a REST or GraphQL API (e.g. on Railway, Render, or Supabase)
2. Keep the SQLite layer as a local cache
3. Add a sync function that POST/PUT local records to the API on app foreground
4. On first install, pull existing records from the API into SQLite

This "local-first, sync when online" pattern gives the best offline UX.
