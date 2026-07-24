import { useContext } from "react";
import {
  SettingsContext,
  SettingsContextValue,
} from "@/context/SettingsContext";

export const useSettings = (): SettingsContextValue =>
  useContext(SettingsContext);
