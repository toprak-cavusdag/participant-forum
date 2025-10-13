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
import { db, storage } from "../../config/firebase";
import { FaSearch, FaHandshake, FaFileExcel } from "react-icons/fa";
import { deleteObject, ref } from "firebase/storage";
import { Image, message, Button } from "antd";
import TableLoading from "../../components/admin/table/TableLoading";
import TableNull from "../../components/admin/table/TableNull";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DescriptionCell from "../../components/common/DescriptionCell";
import { useSelector } from "react-redux";

/* ---------- Gün Normalizasyonu ---------- */
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
    } catch {
      return null;
    }
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
  } catch {
    return null;
  }
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

const Academia = () => {
  const [participants, setParticipants] = useState([]);
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
  const participantsPerPage = 15;

  const adminInfo = useSelector((state) => state.user.adminInfo);

  /* ---------- Fetch ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "academics"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          collection: "academics",
          ...d.data(),
        }));

        setParticipants(data);
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

  /* ---------- Handlers ---------- */
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleDelete = async (id, photoUrl, passportPhotoUrl) => {
    try {
      await deleteDoc(doc(db, "academics", id));
      if (photoUrl) await deleteObject(ref(storage, photoUrl));
      if (passportPhotoUrl) await deleteObject(ref(storage, passportPhotoUrl));
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      message.success("Başvuru başarıyla silindi.");
    } catch (error) {
      console.error("Silme hatası:", error);
      message.error("Başvuru silinirken bir hata oluştu.");
    }
  };

  const handleNoteUpdate = async (id, note) => {
    try {
      const refDoc = doc(db, "academics", id);
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

  /* ---------- Filter + Search ---------- */
  const filtered = participants.filter((p) => {
    const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
    const daysText = getDays(p).join(" ").toLowerCase();
    const searchTarget = `${fullName} ${daysText} ${p.tcNo ?? ""} ${p.passportId ?? ""} ${
      p.email ?? ""
    } ${p.organization ?? ""}`.toLowerCase();
    const searchMatch = searchTarget.includes(searchQuery.toLowerCase());

    return (
      searchMatch &&
      (filters.organizationType === "Tümü" || p.organizationType === filters.organizationType) &&
      (filters.organizationCountry === "Tümü" ||
        p.organizationCountry === filters.organizationCountry) &&
      (filters.participantType === "Tümü" || p.participantType === filters.participantType)
    );
  });

  const indexOfLast = currentPage * participantsPerPage;
  const indexOfFirst = indexOfLast - participantsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / participantsPerPage);

  /* ---------- Excel Export ---------- */
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
        Yaş: p.age ?? "",
        "Görev/Unvan": p.jobTitle ?? "",
        "Kurum/Kuruluş": p.organization ?? "",
        "Kurum Türü": p.organizationType ?? "",
        Ülke: p.organizationCountry ?? "",
        "Katılım Amacı": p.description ?? "",
        "Katılımcı Tipi": p.participantType ?? "",
        "T.C. Kimlik No": p.tcNo ?? "",
        "Doğum Tarihi": p.birthDate ? normalizeDay(p.birthDate) : "",
        "Pasaport No": p.passportId ?? "",
        "Pasaport Veriliş Tarihi": p.passportIssueDate ? normalizeDay(p.passportIssueDate) : "",
        "Pasaport Bitiş Tarihi": p.passportExpiry ? normalizeDay(p.passportExpiry) : "",
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Akademisyenlar");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Akademisyenler_FULL.xlsx");
  };

  /* ---------- UI (Redesign) ---------- */
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
              <h2 className="text-xl md:text-2xl font-semibold">Akademisyen Başvuruları</h2>
              <p className="text-white/80 text-sm">
                Gösterilen <b>{filtered.length}</b> / Toplam <b>{participants.length}</b>
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
          {/* Search */}
          <div className="md:col-span-5">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, gün, T.C. No veya Pasaport No ile ara…"
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

          {/* Filters */}
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

      {/* Table */}
      <div className="px-3 md:px-6 pb-6">
        {loading ? (
          <TableLoading />
        ) : currentItems.length === 0 ? (
          <TableNull text="Kayıt bulunamadı." />
        ) : (
          <>
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-[1900px] w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
                  <tr className="text-slate-700">
                    {[
                      "Fotoğraf",
                      "Ad",
                      "Soyad",
                      "E-posta",
                      "Telefon",
                      "Yaş",
                      "Görev/Unvan",
                      "Kurum/Kuruluş",
                      "Kurum Türü",
                      "Ülke",
                      "Katılım Amacı",
                      "Katılımcı Tipi",
                      "T.C. Kimlik No",
                      "Doğum Tarihi",
                      "Pasaport No",
                      "Pasaport Veriliş Tarihi",
                      "Pasaport Bitiş Tarihi",
                      "Pasaport Fotoğrafı",
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
                  {currentItems.map((p) => {
                    const days = getDays(p);
                    return (
                      <tr
                        key={p.id}
                        className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/60 transition"
                      >
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
                        <td className="px-3 py-3">{p.age ?? "—"}</td>
                        <td className="px-3 py-3">{p.jobTitle ?? "—"}</td>
                        <td className="px-3 py-3">{p.organization ?? "—"}</td>
                        <td className="px-3 py-3">{p.organizationType ?? "—"}</td>
                        <td className="px-3 py-3">{p.organizationCountry ?? "—"}</td>

                        <DescriptionCell text={p.description} />

                        <td className="px-3 py-3">{p.participantType ?? "—"}</td>
                        <td className="px-3 py-3">{p.tcNo ?? "—"}</td>
                        <td className="px-3 py-3">{p.birthDate ? normalizeDay(p.birthDate) : "—"}</td>
                        <td className="px-3 py-3">{p.passportId ?? "—"}</td>
                        <td className="px-3 py-3">
                          {p.passportIssueDate ? normalizeDay(p.passportIssueDate) : "—"}
                        </td>
                        <td className="px-3 py-3">
                          {p.passportExpiry ? normalizeDay(p.passportExpiry) : "—"}
                        </td>

                        <td className="px-3 py-3">
                          {p.passportPhotoUrl ? (
                            <Image
                              src={p.passportPhotoUrl}
                              width={44}
                              height={44}
                              className="h-11 w-11 object-cover rounded-lg ring-1 ring-slate-200"
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

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

            {/* Pagination */}
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

export default Academia;
