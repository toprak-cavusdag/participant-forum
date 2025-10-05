// src/pages/Home.jsx
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiInfo } from "react-icons/fi";
import Header from "../../components/header/Header";
import CountdownTimer from "../../components/common/CountdownTimer";
import LanguageSwitcher from "../../components/home/LanguageSwitcher";
import SuccessMessage from "../../components/home/SuccessMessage";
import ParticipantForum from "../../components/home/ParticipantForum";
import PartnershipForum from "../../components/home/PartnershipForum";
import Footer from "../../components/common/Footer";

// const IS_CLOSED = import.meta.env.VITE_FORUM_CLOSED === "true";
const IS_CLOSED = false;

// Animasyonlar
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const springUp = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 16 } },
};

function ClosedTicket() {
  const { t } = useTranslation();

  return (
    <motion.section
      className="relative mx-auto max-w-3xl px-4 mt-4 mb-16" // ⬅️ -mt-16 yerine mt-4
      initial="hidden"
      animate="show"
      variants={fadeIn}
    >
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white/90 backdrop-blur shadow-lg">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
          <motion.div className="px-6 py-5 flex items-center gap-3" variants={springUp}>
            <FiAlertTriangle className="text-2xl" />
            <div>
              <h2 className="text-xl font-semibold">{t("closed.title", "Kayıtlar kapandı")}</h2>
              <p className="text-emerald-50/90 text-sm">
                {t("closed.subtitle", "Katılımcı kotasına ulaşıldı. İlginiz için teşekkür ederiz.")}
              </p>
            </div>
          </motion.div>
        </div>

        <div className="p-6 md:p-8">
          <motion.p className="text-gray-700 leading-6" variants={fadeIn}>
            {t(
              "closed.body",
              "Form gönderimleri şimdilik devre dışı. Etkinlik detaylarını inceleyebilir ve duyurularımızı takip edebilirsiniz."
            )}
          </motion.p>

          <motion.div
            className="mt-6 rounded-lg bg-emerald-50 text-emerald-900 text-sm p-4 border border-emerald-200 flex items-center gap-2"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
          >
            <FiInfo className="text-emerald-700 shrink-0" />
            {t("closed.note", "Kayıtlar yeniden açılırsa form bu alanda otomatik görünecek.")}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

const Home = () => {
  const [formType, setFormType] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef(null);
  const { t } = useTranslation();

  const handleSelectChange = (e) => setFormType(e.target.value);
  const handleSubmit = () => setIsSubmitted(true);

  useEffect(() => {
    if (!IS_CLOSED && formType && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [formType]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <CountdownTimer />

      <div className="max-w-5xl mx-auto w-full px-4 lg:px-0">
        <div className="relative z-10 max-w-md mx-auto mb-4 mt-4">
          <LanguageSwitcher />
        </div>

        <div className="relative z-0">
          <AnimatePresence mode="wait">
            {IS_CLOSED ? (
              <motion.div
                key="closed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <ClosedTicket />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="mt-4"
              >
                {!isSubmitted && (
                  <div className="max-w-md mx-auto lg:px-0 px-4 mb-16">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("home.sublabel")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formType}
                      onChange={handleSelectChange}
                      className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="" disabled hidden>
                        {t("home.placeholder")}
                      </option>
                      <option value="participant">{t("home.participant")}</option>
                      <option value="partnership">{t("home.partnership")}</option>
                    </select>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {isSubmitted && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                    >
                      <SuccessMessage />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={formRef}>
                  {formType === "participant" && (
                    <ParticipantForum isSubmitted={isSubmitted} setIsSubmitted={handleSubmit} />
                  )}
                  {formType === "partnership" && (
                    <PartnershipForum isSubmitted={isSubmitted} setIsSubmitted={handleSubmit} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Home;
