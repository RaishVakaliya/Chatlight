import { create } from "zustand";
import { persist } from "zustand/middleware";

const useBackgroundStore = create(
  persist(
    (set) => ({
      selectedBackground: null, // null means no background (default)
      
      setBackground: (background) => set({ selectedBackground: background }),
      
      clearBackground: () => set({ selectedBackground: null }),
    }),
    {
      name: "background-storage",
    }
  )
);

export default useBackgroundStore;
