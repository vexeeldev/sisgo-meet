"use client";
import { ReactNode, createContext, useEffect, useState } from "react";
import i18n from "@/lib/i18n";

interface HeaderLayout {
  title: string;
  subtitle?: string;
  breadcrumb?: {
    label: string;
    href: string;
  }[];
}

export type Settings = {
  lang: "id" | "en";
  pageTitle?: string;
  header?: HeaderLayout;
};

export type PageSpecificSettings = {
  lang?: "id" | "en";
  header?: HeaderLayout;
};

export type SettingsContextValue = {
  settings: Settings;
  saveSettings: (updateSettings: Settings) => void;
};

interface SettingsProviderProps {
  children: ReactNode;
  pageSettings?: PageSpecificSettings | void;
}

const initialSettings: Settings = {
  lang: "id",
  pageTitle: "",
  header: {
    title: "",
    subtitle: "",
    breadcrumb: [
      {
        label: "Home",
        href: "/",
      },
    ],
  },
};

const restoreSettings = (): Settings | null => {
  let settings = initialSettings;

  try {
    const storedData = window.localStorage.getItem("settings");

    if (storedData) {
      settings = { ...JSON.parse(storedData) };
    } else {
      const browserLang: "id" | "en" = navigator.language.startsWith("id")
        ? "id"
        : "en";

      settings = {
        ...initialSettings,
        lang: browserLang,
      };
    }
  } catch (err) {
    console.error(err);
  }

  return settings;
};

const storeSettings = (settings: Settings) => {
  const initSettings = Object.assign({}, settings);

  delete initSettings.pageTitle;
  delete initSettings.header;

  window.localStorage.setItem("settings", JSON.stringify(initSettings));
};

export const SettingsContext = createContext<SettingsContextValue>({
  saveSettings: () => null,
  settings: initialSettings,
});

export const SettingsProvider = ({
  children,
  pageSettings,
}: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings>({ ...initialSettings });

  useEffect(() => {
    const restoredSettings = restoreSettings();

    if (restoredSettings) {
      setSettings({ ...restoredSettings, ...(pageSettings || {}) });
    }
  }, [pageSettings]);

  useEffect(() => {
    if (i18n.language !== settings.lang) {
      i18n.changeLanguage(settings.lang);
    }
  }, [settings.lang]);

  function saveSettings(updatedSettings: Settings) {
    storeSettings(updatedSettings);
    setSettings(updatedSettings);
  }

  return (
    <SettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const SettingsConsumer = SettingsContext.Consumer;
