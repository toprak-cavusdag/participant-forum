import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { FaSearch, FaHandshake, FaFileExcel } from "react-icons/fa";
import { Image, message, Button } from "antd";
import TableLoading from "../../components/admin/table/TableLoading";
import TableNull from "../../components/admin/table/TableNull";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DescriptionCell from "../../components/common/DescriptionCell";
import { useSelector } from "react-redux";

/* ---------- Yardımcılar ---------- */
const fmtDate = (v) => {
  if (!v) return "—";
  try {
    const d =
      typeof v?.toDate === "function"
        ? v.toDate()
        : typeof v === "string"
        ? new Date(v)
        : v instanceof Date
        ? v
        : new Date(
            (v.seconds || 0) * 1000 + Math.floor(((v.nanoseconds || 0) / 1e6) || 0)
          );
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const fmtTime = (v) => {
  if (!v) return "—";
  try {
    const d =
      typeof v?.toDate === "function"
        ? v.toDate()
        : typeof v === "string"
        ? new Date(v)
        : v instanceof Date
        ? v
        : new Date(
            (v.seconds || 0) * 1000 + Math.floor(((v.nanoseconds || 0) / 1e6) || 0)
          );
    if (isNaN(d)) return "—";
    return d
      .toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      .replace(".", ":");
  } catch {
    return "—";
  }
};

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
    if (["true", "false", "0", "1"].includes(s)) return null;
    return s;
  }

  if (typeof v === "object" && typeof v.toDate === "function") {
    return fmtDate(v);
  }

  if (
    typeof v === "object" &&
    "seconds" in v &&
    "nanoseconds" in v &&
    typeof v.seconds === "number"
  ) {
    return fmtDate(v);
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
    if (!s || ["true", "false", "0", "1"].includes(s)) return null;
    return s;
  } catch {
    return null;
  }
};

const getDays = (obj) => {
  const cand =
    obj?.selectedDays ??
    obj?.participationDay ??
    obj?.participationDays ??
    obj?.days ??
    obj?.day ??
    obj;

  if (cand == null) return [];

  let raw = [];

  if (Array.isArray(cand)) {
    raw = cand;
  } else if (typeof cand === "object") {
    const entries = Object.entries(cand);
    const boolCount = entries.reduce(
      (acc, [, val]) => acc + (typeof val === "boolean" ? 1 : 0),
      0
    );
    if (entries.length > 0 && boolCount / entries.length >= 0.6) {
      raw = entries.filter(([, val]) => val).map(([key]) => key);
    } else {
      raw = entries.map(([, val]) => val);
    }
  } else if (typeof cand === "string") {
    raw = cand.split(",").map((s) => s.trim());
  } else {
    raw = [cand];
  }

  const cleaned = raw.map(normalizeDay).filter(Boolean);
  return Array.from(new Set(cleaned));
};

/* ======================================================================= */
const Staff = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    organizationType: "Tümü",
    organizationCountry: "Tümü",
    participantType: "Tümü",
  });

  const [types, setTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [participantTypes, setParticipantTypes] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  const adminInfo = useSelector((state) => state.user.adminInfo);

  /* ---------- Veriyi Çek ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ yeni koleksiyon: "mihmandarlar"
        const q = query(collection(db, "mihmandarlar"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          collection: "mihmandarlar",
          ...d.data(),
        }));

        setRows(data);

        setTypes([...new Set(data.map((d) => d.organizationType).filter(Boolean))]);
        setCountries([...new Set(data.map((d) => d.organizationCountry).filter(Boolean))]);
        setParticipantTypes([
          ...new Set(data.map((d) => d.participantType).filter(Boolean)),
        ]);
      } catch (err) {
        console.error("Veri çekme hatası", err);
        message.error("Bir sorun oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchInput.trim() === "") setSearchQuery("");
  }, [searchInput]);

  /* ---------- Handler'lar ---------- */
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "mihmandarlar", id));
      setRows((prev) => prev.filter((p) => p.id !== id));
      message.success("Kayıt silindi.");
    } catch (error) {
      console.error("Silme hatası:", error);
      message.error("Silinirken bir hata oluştu.");
    }
  };

  const handleNoteUpdate = async (id, note) => {
    try {
      const refDoc = doc(db, "mihmandarlar", id);
      await updateDoc(refDoc, {
        adminNote: note,
        noteBy: adminInfo?.firstname || "Admin",
        noteDate: new Date(),
      });
      message.success("Not güncellendi.");
    } catch (error) {
      console.error("Not güncelleme hatası:", error);
      message.error("Not güncellenirken hata oluştu.");
    }
  };

  /* ---------- Filtre + Arama ---------- */
  const filtered = rows.filter((p) => {
    const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
    const daysText = getDays(p).join(" ").toLowerCase();
    const hotelIn =
      `${fmtDate(p.hotelCheckInAt)} ${fmtTime(p.hotelCheckInAt)}`.toLowerCase();
    const hotelOut =
      `${fmtDate(p.hotelCheckOutAt)} ${fmtTime(p.hotelCheckOutAt)}`.toLowerCase();

    const searchTarget = `${fullName} ${daysText} ${p.tcNo ?? ""} ${p.email ?? ""} ${
      p.organization ?? ""
    } ${hotelIn} ${hotelOut}`.toLowerCase();

    const searchMatch = searchTarget.includes(searchQuery.toLowerCase());

    return (
      searchMatch &&
      (filters.organizationType === "Tümü" || p.organizationType === filters.organizationType) &&
      (filters.organizationCountry === "Tümü" ||
        p.organizationCountry === filters.organizationCountry) &&
      (filters.participantType === "Tümü" || p.participantType === filters.participantType)
    );
  });

  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / perPage);

  /* ---------- Excel Dışa Aktar ---------- */
  const exportToExcel = () => {
    if (filtered.length === 0) {
      message.warning("Dışa aktarılacak veri bulunamadı.");
      return;
    }

    const exportData = filtered.map((p) => {
      const days = getDays(p);
      return {
        Ad: p.firstName ?? "",
        Soyad: p.lastName ?? "",
        "E-posta": p.email ?? "",
        Telefon: p.phone ?? "",
        "Görev/Unvan": p.jobTitle ?? "",
        "Kurum/Kuruluş": p.organization ?? "",
        "Kurum Türü": p.organizationType ?? "",
        Ülke: p.organizationCountry ?? "",
        "Katılım Amacı": p.description ?? "",
        "Katılımcı Tipi": p.participantType ?? "",
        "T.C. Kimlik No": p.tcNo ?? "",
        "Doğum Tarihi": fmtDate(p.birthDate),
        "Katılım Günleri": days.length > 0 ? days.join(", ") : "—",
        "Otel Giriş Tarihi": fmtDate(p.hotelCheckInAt),
        "Otel Giriş Saati": fmtTime(p.hotelCheckInAt),
        "Otel Çıkış Tarihi": fmtDate(p.hotelCheckOutAt),
        "Otel Çıkış Saati": fmtTime(p.hotelCheckOutAt),
        "Gönderim Tarihi":
          p.createdAt?.toDate?.()
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "mihmandarlar");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Mihmandarlar.xlsx");
  };

  return (
    <div className="rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      {/* Header */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 opacity-90" />
        <div className="relative px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 text-white">
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <FaHandshake className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">Mihmandar Başvuruları</h2>
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
      <div className="px-6 md:px-8 py-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Arama */}
          <div className="md:col-span-5">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, gün, T.C. No, e-posta veya otel giriş/çıkış ile ara…"
                  className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                className="h-10 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
              >
                Ara
              </button>
            </div>
          </div>

          {/* Filtreler */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              name="participantType"
              value={filters.participantType}
              onChange={handleFilterChange}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="Tümü">Tüm Katılımcı Tipleri</option>
              {participantTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              name="organizationType"
              value={filters.organizationType}
              onChange={handleFilterChange}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="Tümü">Tüm Kurum Türleri</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              name="organizationCountry"
              value={filters.organizationCountry}
              onChange={handleFilterChange}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="Tümü">Tüm Ülkeler</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="px-3 md:px-6 pb-6">
        {loading ? (
          <TableLoading />
        ) : currentItems.length === 0 ? (
          <TableNull text="Kayıt bulunamadı." />
        ) : (
          <>
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-[1400px] w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
                  <tr className="text-slate-700">
                    {[
                      "Ad",
                      "Soyad",
                      "E-posta",
                      "Telefon",
                      "Görev/Unvan",
                      "Kurum/Kuruluş",
                      "Kurum Türü",
                      "Ülke",
                      "Katılım Amacı",
                      "Katılımcı Tipi",
                      "T.C. Kimlik No",
                      "Doğum Tarihi",
                      "Katılım Günleri",
                      "Otel Giriş Tarihi",
                      "Otel Giriş Saati",
                      "Otel Çıkış Tarihi",
                      "Otel Çıkış Saati",
                      "Gönderim Tarihi",
                      "İşlemler",
                    ].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((p) => {
                    const days = getDays(p);
                    return (
                      <tr
                        key={p.id}
                        className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/60 transition"
                      >
                        <td className="px-3 py-3 font-medium text-slate-800">
                          {p.firstName ?? "—"}
                        </td>
                        <td className="px-3 py-3">{p.lastName ?? "—"}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{p.email ?? "—"}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{p.phone ?? "—"}</td>
                        <td className="px-3 py-3">{p.jobTitle ?? "—"}</td>
                        <td className="px-3 py-3">{p.organization ?? "—"}</td>
                        <td className="px-3 py-3">{p.organizationType ?? "—"}</td>
                        <td className="px-3 py-3">{p.organizationCountry ?? "—"}</td>

                        <DescriptionCell text={p.description} />

                        <td className="px-3 py-3">{p.participantType ?? "—"}</td>
                        <td className="px-3 py-3">{p.tcNo ?? "—"}</td>
                        <td className="px-3 py-3">{fmtDate(p.birthDate)}</td>

                        <td className="px-3 py-3">
                          {days.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {days.map((day, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3">{fmtDate(p.hotelCheckInAt)}</td>
                        <td className="px-3 py-3">{fmtTime(p.hotelCheckInAt)}</td>
                        <td className="px-3 py-3">{fmtDate(p.hotelCheckOutAt)}</td>
                        <td className="px-3 py-3">{fmtTime(p.hotelCheckOutAt)}</td>

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

                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            <div className="flex justify-center mt-5">
              <nav className="inline-flex rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                {[...Array(totalPages)].map((_, i) => {
                  const active = currentPage === i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3.5 py-2 text-sm ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50"
                      } ${i !== totalPages - 1 ? "border-r border-slate-200" : ""}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Staff;
