import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const ConfettiCelebration = () => {
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const createConfetti = () => {
      const particles = 45;
      const colors = ["#ff4757", "#1e90ff", "#2ed573", "#ffa502", "#ff6b81"];
      const duration = 4;
      const container = containerRef.current;

      for (let i = 0; i < particles; i++) {
        const confetti = document.createElement("div");
        const size = Math.random() * 6 + 4;

        confetti.className = "absolute rounded-md";
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size * (Math.random() > 0.5 ? 0.4 : 1)}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = "-1%";

        container.appendChild(confetti);

        gsap.to(confetti, {
          y: "100vh",
          x: (Math.random() - 0.5) * 200,
          rotation: Math.random() * 360,
          duration: duration + Math.random(),
          ease: "power1.inOut",
          onComplete: () => confetti.remove(),
        });
      }
    };

    intervalRef.current = setInterval(createConfetti, 500);

    const stopAfter = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(stopAfter);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-50"
    />
  );
};

export default ConfettiCelebration;
