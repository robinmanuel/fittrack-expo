import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile } from "../lib/bmr";
import { loadProfile, saveProfile, clearProfile } from "../lib/profile";

interface ProfileCtx {
  profile: UserProfile | null;
  loading: boolean;
  save: (p: UserProfile) => Promise<void>;
  clear: () => Promise<void>;
}

const Ctx = createContext<ProfileCtx>({
  profile: null,
  loading: true,
  save: async () => {},
  clear: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile().then(p => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  const save = async (p: UserProfile) => {
    await saveProfile(p);
    setProfile(p);
  };

  const clear = async () => {
    await clearProfile();
    setProfile(null);
  };

  return (
    <Ctx.Provider value={{ profile, loading, save, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export const useProfile = () => useContext(Ctx);
