import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { FitnessRecord, NewRecord } from "../lib/types";
import * as db from "../lib/db";

interface RecordsCtx {
  records: FitnessRecord[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (r: NewRecord) => Promise<void>;
  update: (id: number, data: Partial<Pick<FitnessRecord, "calories" | "steps" | "weight">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const Ctx = createContext<RecordsCtx>({
  records: [],
  loading: true,
  refresh: async () => {},
  add: async () => {},
  update: async () => {},
  remove: async () => {},
});

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<FitnessRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await db.getAllRecords();
    setRecords(rows);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (record: NewRecord) => {
    await db.upsertRecord(record);
    await refresh();
  };

  const update = async (id: number, data: Partial<Pick<FitnessRecord, "calories" | "steps" | "weight">>) => {
    await db.updateRecord(id, data);
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const remove = async (id: number) => {
    await db.deleteRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  return (
    <Ctx.Provider value={{ records, loading, refresh, add, update, remove }}>
      {children}
    </Ctx.Provider>
  );
}

export const useRecords = () => useContext(Ctx);
