import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import ConfettiCelebration from "../common/ConfettiCelebration";
import { Link } from "react-router-dom";


const SuccessMessage = () => {
  const boxRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      boxRef.current,
      { opacity: 0, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
      }
    );
  }, []);

  return (
    <div className="relative -top-20 w-11/12 md:w-8/12 mx-auto">
      <ConfettiCelebration />
      <div
        ref={boxRef}
        className="flex flex-col items-center justify-center text-center py-20 px-4 bg-green-50 border border-green-200 rounded-xl shadow-lg"
      >
        <div className="text-green-600 text-5xl mb-4">🎉</div>
        <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
          Application Submitted Successfully!
        </h2>
        <p className="text-green-700 text-base md:text-lg max-w-md">
          Thank you for your submission. We’ll get back to you shortly.
        </p>
        <Link to="https://globalzerowasteforum.org/" className="bg-green-200 mt-8 font-semibold   text-green-700 rounded-lg px-5 py-2">
          Go back to forum page
        </Link>
      </div>
    </div>
  );
};

export default SuccessMessage;