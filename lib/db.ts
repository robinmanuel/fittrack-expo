import * as SQLite from "expo-sqlite";
import { FitnessRecord, NewRecord } from "./types";

const DB_NAME = "fittrack.db";

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS records (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL UNIQUE,
      calories   INTEGER,
      steps      INTEGER,
      weight     REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return _db;
}

export async function getAllRecords(): Promise<FitnessRecord[]> {
  const db = await getDb();
  return await db.getAllAsync<FitnessRecord>(
    "SELECT * FROM records ORDER BY date DESC LIMIT 90"
  );
}

export async function getRecordByDate(date: string): Promise<FitnessRecord | null> {
  const db = await getDb();
  return await db.getFirstAsync<FitnessRecord>(
    "SELECT * FROM records WHERE date = ?",
    [date]
  ) ?? null;
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
    "SELECT * FROM records WHERE date = ?",
    [record.date]
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
  return await db.getAllAsync<FitnessRecord>(
    `SELECT * FROM records
     WHERE date >= date('now', ?)
     ORDER BY date DESC`,
    [`-${days} days`]
  );
}
