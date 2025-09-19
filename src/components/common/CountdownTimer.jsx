import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Overlay from "./Overlay";
import { useTranslation } from "react-i18next";

const CountdownTimer = () => {
  const { t } = useTranslation();
  const calculateTimeLeft = () => {
    const targetDate = new Date("2025-10-17T10:00:00+03:00");
    const now = new Date();
    const difference = targetDate - now;

    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const isOver =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-11/12 md:w-8/12 mx-auto -top-30 z-30 h-[300px] rounded-xl overflow-hidden shadow-xl mt-10"
    >

      <img
        src="/countdown.jpg"
        alt="Countdown Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <Overlay />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center">
        {isOver ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-green-300"
          >
            {t("countdown.start")}
          </motion.div>
        ) : (
          <>
            <h2 className="text-3xl md:text-5xl font-bold mb-10 text-white drop-shadow">
              {t("countdown.title")}
            </h2>
            <div className="flex flex-wrap justify-center gap-6 text-4xl md:text-5xl font-mono font-semibold">
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring" }}
              >
                {String(timeLeft.days).padStart(2, "0")}
                <div className="text-sm">{t("countdown.days")}</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring" }}
              >
                {String(timeLeft.hours).padStart(2, "0")}
                <div className="text-sm">{t("countdown.hours")}</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring" }}
              >
                {String(timeLeft.minutes).padStart(2, "0")}
                <div className="text-sm">{t("countdown.minutes")}</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring" }}
              >
                {String(timeLeft.seconds).padStart(2, "0")}
                <div className="text-sm">{t("countdown.seconds")}</div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CountdownTimer;
