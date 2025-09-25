// 🔧 Gün alanını normalize et: selectedDays | participationDay | selectedDay
const getParticipationDays = (p) => {
  const cand =
    p?.selectedDays ??        // yeni alan
    p?.participationDay ??    // eski alan
    p?.selectedDay ??         // olası tekil alan
    null;

  if (!cand) return [];
  if (Array.isArray(cand)) return cand.filter(Boolean);

  if (typeof cand === "object") {
    // Firestore bazen {0:"Oct 17", 1:"Oct 18"} şeklinde saklayabilir
    return Object.values(cand).filter(Boolean);
  }

  if (typeof cand === "string") {
    return cand.split(",").map(s => s.trim()).filter(Boolean);
  }

  return [];
};
