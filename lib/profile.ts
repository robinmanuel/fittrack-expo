import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile } from "./bmr";

const KEY = "ft_user_profile";

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
