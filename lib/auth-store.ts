import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserRole = "volunteer" | "organizer" | null;

interface AuthState {
  role: UserRole;
  volunteerId: string | null;
  loginAsOrganizer: () => void;
  loginAsVolunteer: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      volunteerId: null,
      loginAsOrganizer: () =>
        set({ role: "organizer", volunteerId: null }),
      loginAsVolunteer: (id: string) =>
        set({ role: "volunteer", volunteerId: id }),
      logout: () => set({ role: null, volunteerId: null }),
    }),
    { name: "aidlink-auth" }
  )
);
