import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";



const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full h-fit mt-10 bg-[#103129] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <img
            src="./zwfforum_logo.svg"
            alt="Zero Waste Forum"
            className="h-16 w-auto object-contain"
          />
        </div>

        <div className="text-gray-400 text-center md:text-right">
          © {new Date().getFullYear()}. {t("footer.first")} <Link to="https://sifiratikvakfi.org/" target="_blank" className="font-bold">{t("footer.last")}</Link> 
        </div>
      </div>
    </footer>
  );
};

export default Footer;
