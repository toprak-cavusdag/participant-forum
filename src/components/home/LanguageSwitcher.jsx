import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2 justify-center mb-5">
      <button
        onClick={() => changeLanguage("tr")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition
          ${i18n.language === "tr" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
      >
        🇹🇷 Türkçe
      </button>

      <button
        onClick={() => changeLanguage("en")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition
          ${i18n.language === "en" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
      >
        🇬🇧 English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
