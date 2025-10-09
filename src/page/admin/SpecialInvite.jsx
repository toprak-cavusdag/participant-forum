// src/pages/admin/partners/SpecialPartners.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { Image, message, Button } from "antd";
import { FaSearch, FaFileExcel, FaUsers } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ---------- Sabit Firma Listesi ---------- */
const SPECIAL_FIRMS = [
  "Turkcell",
  "Ziraat Bankası",
  "VakıfBank",
  "Halkbank",
  "Türk Telekom",
  "Türkiye Sigorta",
];

/* ---------- Yardımcılar (senin koddakiyle uyumlu) ---------- */
const normalizeDay = (v) => {
  if (v == null) return null;
  if (typeof v === "boolean") return null;
  if (typeof v === "number") {
    const s = String(v).trim();
    return s.length > 1 ? s : null;
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    if (s === "true" || s === "false" || s === "0" || s === "1") return null;
    return s;
  }
  if (typeof v === "object" && typeof v.toDate === "function") {
    try {
      return v.toDate().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch { return null; }
  }
  if (
    typeof v === "object" &&
    "seconds" in v &&
    "nanoseconds" in v &&
    typeof v.seconds === "number"
  ) {
    const ms = v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
    return new Date(ms).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (typeof v === "object") {
    if (v.label) return normalizeDay(String(v.label));
    if (v.name) return normalizeDay(String(v.name));
    if (v.day) return normalizeDay(String(v.day));
    const vals = Object.values(v);
    if (vals.length === 1) return normalizeDay(vals[0]);
  }
  try {
    const s = String(v).trim();
    if (!s || s === "true" || s === "false" || s === "0" || s === "1") return null;
    return s;
  } catch { return null; }
};

const getDays = (obj) => {
  const cand =
    obj?.participationDay ??
    obj?.participationDays ??
    obj?.selectedDays ??
    obj?.days ??
    obj?.day ??
    obj;
  if (cand == null) return [];
  let raw = [];
  if (Array.isArray(cand)) raw = cand;
  else if (typeof cand === "object") {
    const entries = Object.entries(cand);
    const boolCount = entries.reduce((acc, [, val]) => acc + (typeof val === "boolean" ? 1 : 0), 0);
    if (entries.length > 0 && boolCount / entries.length >= 0.6) {
      raw = entries.filter(([, val]) => val).map(([key]) => key);
    } else {
      raw = entries.map(([, val]) => val);
    }
  } else if (typeof cand === "string") {
    raw = cand.split(",").map((s) => s.trim());
  } else raw = [cand];
  const cleaned = raw.map(normalizeDay).filter(Boolean);
  return Array.from(new Set(cleaned));
};

/* ---------- Component ---------- */
export default function SpecialPartners() {
  const [rows, setRows] = useState([]);            // tüm özel firmalar
  const [loading, setLoading] = useState(true);
  const [firmFilter, setFirmFilter] = useState("Tümü");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // where-in ile tek seferde özel firmaları çek
        const q = query(
          collection(db, "partnership"),
          where("organization", "in", SPECIAL_FIRMS)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // createdAt yoksa en sona düşecek şekilde client-side sort
        const sorted = data.sort((a, b) => {
          const ta = a?.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
          const tb = b?.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
          return tb - ta;
        });

        setRows(sorted);
      } catch (e) {
        console.error(e);
        message.error("Özel firma verileri çekilirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (searchInput.trim() === "") setSearchQuery("");
  }, [searchInput]);

  const countsByFirm = useMemo(() => {
    const map = Object.fromEntries(SPECIAL_FIRMS.map((f) => [f, 0]));
    rows.forEach((r) => {
      if (SPECIAL_FIRMS.includes(r.organization)) map[r.organization] += 1;
    });
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((p) => {
      const matchFirm = firmFilter === "Tümü" ? true : p.organization === firmFilter;
      if (!matchFirm) return false;

      if (!q) return true;
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
      const daysText = getDays(p).join(" ").toLowerCase();
      const target = `${name} ${daysText} ${p.tcNo ?? ""} ${p.passportId ?? ""} ${p.email ?? ""} ${p.organization ?? ""}`.toLowerCase();
      return target.includes(q);
    });
  }, [rows, firmFilter, searchQuery]);

  const exportToExcel = () => {
    if (filtered.length === 0) {
      message.warning("Dışa aktarılacak veri bulunamadı.");
      return;
    }
    const exportData = filtered.map((p) => {
      const days = getDays(p);
      return {
        Firma: p.organization ?? "",
        Ad: p.firstName ?? "",
        Soyad: p.lastName ?? "",
        "E-posta": p.email ?? "",
        Telefon: p.phone ?? "",
        Yaş: p.age ?? "",
        "Görev/Unvan": p.jobTitle ?? "",
        "Kurum Türü": p.organizationType ?? "",
        Ülke: p.organizationCountry ?? "",
        "Katılım Amacı": p.description ?? "",
        "Katılımcı Tipi": p.participantType ?? "",
        "T.C. Kimlik No": p.tcNo ?? "",
        "Doğum Tarihi": p.birthDate ? normalizeDay(p.birthDate) : "",
        "Pasaport No": p.passportId ?? "",
        "Pasaport Veriliş": p.passportIssueDate ? normalizeDay(p.passportIssueDate) : "",
        "Pasaport Bitiş": p.passportExpiry ? normalizeDay(p.passportExpiry) : "",
        "Katılım Günleri": days.length > 0 ? days.join(", ") : "—",
        "Gönderim Tarihi": p.createdAt?.toDate?.()
          ? p.createdAt.toDate().toLocaleString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Özel Firmalar");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], { type: "application/octet-stream" });
    saveAs(blob, "Ozel_Firmalar.xlsx");
  };

  return (
    <div className="rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      {/* Header */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 opacity-90" />
        <div className="relative px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 text-white">
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <FaUsers className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">Özel Firma Başvuruları</h2>
              <p className="text-white/80 text-sm">
                Gösterilen <b>{filtered.length}</b> / Toplam <b>{rows.length}</b>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<FaFileExcel />}
              className="!bg-white !text-emerald-700 !border-none !px-4 !h-10 hover:!bg-emerald-50"
              onClick={exportToExcel}
            >
              Excel’e Aktar
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 md:px-8 py-5 space-y-4">
        {/* Firma filtre chip'leri */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFirmFilter("Tümü")}
            className={`px-3.5 h-9 rounded-full border ${
              firmFilter === "Tümü"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tümü ({rows.length})
          </button>
          {SPECIAL_FIRMS.map((f) => (
            <button
              key={f}
              onClick={() => setFirmFilter(f)}
              className={`px-3.5 h-9 rounded-full border whitespace-nowrap ${
                firmFilter === f
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title={f}
            >
              {f} ({countsByFirm[f] || 0})
            </button>
          ))}
        </div>

        {/* Arama */}
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="İsim, gün, T.C. No, pasaport, e-posta veya firma adı…"
              className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchInput)}
            />
          </div>
          <button
            onClick={() => setSearchQuery(searchInput)}
            className="h-10 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            Ara
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="px-3 md:px-6 pb-6">
        {loading ? (
          <div className="p-8 text-slate-500">Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-slate-500">Kayıt bulunamadı.</div>
        ) : (
          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[1500px] w-full text-sm">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
                <tr className="text-slate-700">
                  {[
                    "Firma",
                    "Fotoğraf",
                    "Ad",
                    "Soyad",
                    "E-posta",
                    "Telefon",
                    "Görev/Unvan",
                    "Ülke",
                    "Katılımcı Tipi",
                    "Katılım Günleri",
                    "Gönderim Tarihi",
                  ].map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const days = getDays(p);
                  return (
                    <tr key={p.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/60 transition">
                      <td className="px-3 py-3 font-medium text-emerald-700">{p.organization ?? "—"}</td>
                      <td className="px-3 py-3">
                        {p.photoUrl ? (
                          <Image
                            src={p.photoUrl}
                            alt={`${p.firstName ?? ""} ${p.lastName ?? ""}`}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover rounded-full ring-2 ring-white shadow"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">{p.firstName ?? "—"}</td>
                      <td className="px-3 py-3">{p.lastName ?? "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{p.email ?? "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{p.phone ?? "—"}</td>
                      <td className="px-3 py-3">{p.jobTitle ?? "—"}</td>
                      <td className="px-3 py-3">{p.organizationCountry ?? "—"}</td>
                      <td className="px-3 py-3">{p.participantType ?? "—"}</td>
                      <td className="px-3 py-3">
                        {days.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {days.map((d, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {p.createdAt?.toDate?.()
                          ? p.createdAt.toDate().toLocaleString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
