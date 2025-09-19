import Overlay from "../common/Overlay";
import { useTranslation } from "react-i18next";


const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="w-full overflow-hidden relative h-[50vh] flex justify-center items-center">
      <Overlay />
      <img
        src="/header.jpg"
        className="absolute-center z-0 w-full h-full object-cover"
        alt="Header Background"
      />
      <div className="absolute-center w-full z-20">
        <div className="flex justify-center gap-3 flex-col items-center">
          <img
            src="/zwfforum_logo.svg"
            className="w-64 mb-5 h-auto object-contain"
            alt="Logo"
          />

        </div>


        <h2 className="text-lg text-center font-light text-white/85 mb-8">
          {t("header.title")}
        </h2>
      </div>
    </header>
  );
};

export default Header;
