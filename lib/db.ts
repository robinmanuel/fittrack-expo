import * as SQLite from "expo-sqlite";
import {
  FitnessRecord, NewRecord,
  FoodEntry, NewFoodEntry, FreqFood,
  ExerciseEntry, NewExerciseEntry, FreqExercise,
} from "./types";

const DB_NAME = "fittrack.db";
let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS records (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        date       TEXT NOT NULL UNIQUE,
        calories   INTEGER,
        steps      INTEGER,
        weight     REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS food_entries (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        date          TEXT NOT NULL,
        name          TEXT NOT NULL,
        cals_per_unit REAL NOT NULL,
        quantity      REAL NOT NULL,
        total_cals    REAL NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS freq_foods (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL UNIQUE COLLATE NOCASE,
        cals_per_unit REAL NOT NULL,
        use_count     INTEGER NOT NULL DEFAULT 1,
        last_used     TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS exercise_entries (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        date        TEXT NOT NULL,
        name        TEXT NOT NULL,
        cals_burned REAL NOT NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS freq_exercises (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
        cals_burned REAL NOT NULL,
        use_count   INTEGER NOT NULL DEFAULT 1,
        last_used   TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    _db = db;
    return _db;
  })();
  return _initPromise;
}

// ── Daily records ──────────────────────────────────────────
export async function getAllRecords(): Promise<FitnessRecord[]> {
  const db = await getDb();
  return db.getAllAsync<FitnessRecord>(
    "SELECT * FROM records ORDER BY date DESC LIMIT 90"
  );
}

export async function getRecordByDate(date: string): Promise<FitnessRecord | null> {
  const db = await getDb();
  return (await db.getFirstAsync<FitnessRecord>(
    "SELECT * FROM records WHERE date = ?", [date]
  )) ?? null;
}

export async function upsertRecord(record: NewRecord): Promise<FitnessRecord> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO records (date, calories, steps, weight)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       calories = excluded.calories,
       steps    = excluded.steps,
       weight   = excluded.weight`,
    [record.date, record.calories ?? null, record.steps ?? null, record.weight ?? null]
  );
  return (await db.getFirstAsync<FitnessRecord>(
    "SELECT * FROM records WHERE date = ?", [record.date]
  ))!;
}

export async function updateRecord(
  id: number,
  data: Partial<Pick<FitnessRecord, "calories" | "steps" | "weight">>
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE records SET calories = ?, steps = ?, weight = ? WHERE id = ?",
    [data.calories ?? null, data.steps ?? null, data.weight ?? null, id]
  );
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM records WHERE id = ?", [id]);
}

export async function getRecentRecords(days: number): Promise<FitnessRecord[]> {
  const db = await getDb();
  return db.getAllAsync<FitnessRecord>(
    `SELECT * FROM records WHERE date >= date('now', ?) ORDER BY date DESC`,
    [`-${days} days`]
  );
}

// ── Food entries ───────────────────────────────────────────
export async function getFoodEntriesByDate(date: string): Promise<FoodEntry[]> {
  const db = await getDb();
  return db.getAllAsync<FoodEntry>(
    "SELECT * FROM food_entries WHERE date = ? ORDER BY created_at ASC", [date]
  );
}

export async function addFoodEntry(entry: NewFoodEntry): Promise<FoodEntry> {
  const db = await getDb();
  const total_cals = entry.cals_per_unit * entry.quantity;
  await db.runAsync(
    `INSERT INTO food_entries (date, name, cals_per_unit, quantity, total_cals)
     VALUES (?, ?, ?, ?, ?)`,
    [entry.date, entry.name, entry.cals_per_unit, entry.quantity, total_cals]
  );
  // Upsert into freq_foods
  await db.runAsync(
    `INSERT INTO freq_foods (name, cals_per_unit, use_count, last_used)
     VALUES (?, ?, 1, datetime('now'))
     ON CONFLICT(name) DO UPDATE SET
       cals_per_unit = excluded.cals_per_unit,
       use_count = use_count + 1,
       last_used = datetime('now')`,
    [entry.name, entry.cals_per_unit]
  );
  const id = await db.getFirstAsync<{ id: number }>(
    "SELECT last_insert_rowid() as id"
  );
  return (await db.getFirstAsync<FoodEntry>(
    "SELECT * FROM food_entries WHERE id = ?", [id?.id]
  ))!;
}

export async function deleteFoodEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM food_entries WHERE id = ?", [id]);
}

export async function getFreqFoods(): Promise<FreqFood[]> {
  const db = await getDb();
  return db.getAllAsync<FreqFood>(
    "SELECT * FROM freq_foods ORDER BY use_count DESC, last_used DESC LIMIT 20"
  );
}

// ── Exercise entries ───────────────────────────────────────
export async function getExerciseEntriesByDate(date: string): Promise<ExerciseEntry[]> {
  const db = await getDb();
  return db.getAllAsync<ExerciseEntry>(
    "SELECT * FROM exercise_entries WHERE date = ? ORDER BY created_at ASC", [date]
  );
}

export async function addExerciseEntry(entry: NewExerciseEntry): Promise<ExerciseEntry> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO exercise_entries (date, name, cals_burned) VALUES (?, ?, ?)`,
    [entry.date, entry.name, entry.cals_burned]
  );
  await db.runAsync(
    `INSERT INTO freq_exercises (name, cals_burned, use_count, last_used)
     VALUES (?, ?, 1, datetime('now'))
     ON CONFLICT(name) DO UPDATE SET
       cals_burned = excluded.cals_burned,
       use_count = use_count + 1,
       last_used = datetime('now')`,
    [entry.name, entry.cals_burned]
  );
  const id = await db.getFirstAsync<{ id: number }>(
    "SELECT last_insert_rowid() as id"
  );
  return (await db.getFirstAsync<ExerciseEntry>(
    "SELECT * FROM exercise_entries WHERE id = ?", [id?.id]
  ))!;
}

export async function deleteExerciseEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM exercise_entries WHERE id = ?", [id]);
}

export async function getFreqExercises(): Promise<FreqExercise[]> {
  const db = await getDb();
  return db.getAllAsync<FreqExercise>(
    "SELECT * FROM freq_exercises ORDER BY use_count DESC, last_used DESC LIMIT 20"
  );
}