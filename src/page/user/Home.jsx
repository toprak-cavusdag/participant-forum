import { useState, useRef, useEffect } from 'react';
import Header from '../../components/header/Header';
import PartnershipForum from '../../components/home/PartnershipForum';
import ParticipantForum from '../../components/home/ParticipantForum';
import CountdownTimer from '../../components/common/CountdownTimer';
import Footer from '../../components/common/Footer';
import SuccessMessage from '../../components/home/SuccessMessage';
import LanguageSwitcher from '../../components/home/LanguageSwitcher';
import { useTranslation } from 'react-i18next';


const Home = () => {
  const [formType, setFormType] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef(null);
  const { t } = useTranslation();
  

  const handleSelectChange = (e) => {
    setFormType(e.target.value);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  useEffect(() => {
    if (formType && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [formType]);

  return (
    <main>
      <Header />
      <CountdownTimer />

      
      {!isSubmitted && (
        <div className="max-w-md mx-auto lg:px-0 px-4 mb-16 -mt-20">
          <LanguageSwitcher />
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("home.sublabel")} <span className="text-red-500">*</span>
          </label>
          <select
            value={formType}
            onChange={handleSelectChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="" disabled hidden>
              {t("home.placeholder")}
            </option>
            <option value="participant">{t("home.participant")}</option>
            <option value="partnership">{t("home.partnership")}</option>
          </select>
        </div>
      )}

      {isSubmitted && <SuccessMessage />}

      <div ref={formRef}>
        {formType === 'participant' && (
          <ParticipantForum isSubmitted={isSubmitted} setIsSubmitted={handleSubmit} />
        )}
        {formType === 'partnership' && (
          <PartnershipForum isSubmitted={isSubmitted} setIsSubmitted={handleSubmit} />
        )}
      </div>
      <Footer />
    </main>
  );
};

export default Home;