"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 1. Import HANYA SATU file json yang baru dibuat
import translationsData from "@/public/locales/lang.json";

// 2. Siapkan wadah kosong untuk menampung pemisahan bahasa
const resources = {
  en: { common: {} as Record<string, string> },
  id: { common: {} as Record<string, string> }
};

// 3. FUNGSI AJAIB: Mengubah JSON gabungan menjadi dictionary terpisah (Flat Keys)
const processTranslations = (obj: any, prefix = "") => {
  for (const key in obj) {
    const value = obj[key];
    
    // Jika menemukan node yang memiliki terjemahan id & en
    if (value && typeof value === "object" && "id" in value && "en" in value) {
      resources.id.common[prefix + key] = value.id;
      resources.en.common[prefix + key] = value.en;
    } 
    // Jika masih berupa grup (seperti "navbar"), telusuri lebih dalam (rekursif)
    else if (value && typeof value === "object") {
      processTranslations(value, prefix + key + ".");
    }
  }
};

// Eksekusi fungsinya sebelum inisialisasi i18n
processTranslations(translationsData);

// 4. Inisialisasi i18next seperti biasa
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "id", // Bahasa default
    fallbackLng: "id",
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;