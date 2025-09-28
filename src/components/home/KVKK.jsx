import React, { useState } from "react";
import KVKKTR from "./KVKKTR";
import GDPR from "./GDPR";

const KVKK = () => {
  const [lang, setLang] = useState("tr"); // "tr" | "en"

  return (
    <div className="max-w-4xl mx-auto">
      {/* Dil seçimi */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setLang("tr")}
          className={`px-3 py-1 rounded ${lang === "tr" ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
        >
          Türkçe (KVKK)
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-3 py-1 rounded ${lang === "en" ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
        >
          English (GDPR)
        </button>
      </div>

      {lang === "tr" ? <KVKKTR /> : <GDPR />}
    </div>
  );
};

export default KVKK;
