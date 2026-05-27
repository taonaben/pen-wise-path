import { createContext, useContext } from "react";
import type { CurrentFarmContextValue } from "../types/farm.types";

export const CurrentFarmContext = createContext<CurrentFarmContextValue | null>(null);

export function useCurrentFarm() {
  const context = useContext(CurrentFarmContext);
  if (!context) throw new Error("useCurrentFarm must be used inside CurrentFarmProvider");
  return context;
}
