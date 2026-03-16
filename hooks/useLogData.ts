import { useState, useCallback } from "react";
import {
  FoodEntry, NewFoodEntry, FreqFood,
  ExerciseEntry, NewExerciseEntry, FreqExercise,
} from "../lib/types";
import * as db from "../lib/db";

export function useLogData(date: string) {
  const [foodEntries, setFoodEntries]       = useState<FoodEntry[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [freqFoods, setFreqFoods]           = useState<FreqFood[]>([]);
  const [freqExercises, setFreqExercises]   = useState<FreqExercise[]>([]);
  const [loading, setLoading]               = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [fe, ee, ff, fx] = await Promise.all([
      db.getFoodEntriesByDate(date),
      db.getExerciseEntriesByDate(date),
      db.getFreqFoods(),
      db.getFreqExercises(),
    ]);
    setFoodEntries(fe);
    setExerciseEntries(ee);
    setFreqFoods(ff);
    setFreqExercises(fx);
    setLoading(false);
  }, [date]);

  const addFood = async (entry: NewFoodEntry) => {
    await db.addFoodEntry(entry);
    const [fe, ff] = await Promise.all([
      db.getFoodEntriesByDate(date),
      db.getFreqFoods(),
    ]);
    setFoodEntries(fe);
    setFreqFoods(ff);
  };

  const removeFood = async (id: number) => {
    await db.deleteFoodEntry(id);
    setFoodEntries(prev => prev.filter(f => f.id !== id));
  };

  const addExercise = async (entry: NewExerciseEntry) => {
    await db.addExerciseEntry(entry);
    const [ee, fx] = await Promise.all([
      db.getExerciseEntriesByDate(date),
      db.getFreqExercises(),
    ]);
    setExerciseEntries(ee);
    setFreqExercises(fx);
  };

  const removeExercise = async (id: number) => {
    await db.deleteExerciseEntry(id);
    setExerciseEntries(prev => prev.filter(e => e.id !== id));
  };

  // Derived totals
  const totalFoodCals     = foodEntries.reduce((s, f) => s + f.total_cals, 0);
  const totalExerciseCals = exerciseEntries.reduce((s, e) => s + e.cals_burned, 0);

  return {
    foodEntries, exerciseEntries,
    freqFoods, freqExercises,
    loading, refresh,
    addFood, removeFood,
    addExercise, removeExercise,
    totalFoodCals, totalExerciseCals,
  };
}
