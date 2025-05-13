"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // 🔥 Force Arabic everywhere
    lng: "ar",
    fallbackLng: "ar",

    supportedLngs: ["ar", "en"],

    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },

    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  // ⚡ immediately after init, re-assert Arabic
  .then(() => {
    i18n.changeLanguage("ar");
  })
  .catch((err) => console.error("i18next init failed:", err));

export default i18n;
