// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: "tr",
    supportedLngs: ["tr", "en"],
    ns: ["translation", "kvkk"],     // <-- kvkk namespace’i ekle
    defaultNS: "translation",
    load: "languageOnly",
    interpolation: { escapeValue: false },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",  // <-- public altından çeker
    },
    // Geliştirirken cache’lenmiş jsonları anında yenilemek için faydalı:
    // reloadOnPrerender: true, // (vite-plugin-ssr vb. kullanıyorsan)
  });

export default i18n;
