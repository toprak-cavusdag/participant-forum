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
import { FaUser, FaSearch, FaFileExcel } from "react-icons/fa";
import { deleteObject, ref } from "firebase/storage";
import { Image, message, Button } from "antd";
import PopConfirmDelete from "../../components/common/PopConfirmDelete";
import { useSelector } from "react-redux";
import TableLoading from "../../components/admin/table/TableLoading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DescriptionCell from "../../components/common/DescriptionCell";

const Participants = () => {
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

  /* ---------------- Helpers: Day Normalizers ---------------- */
  const normalizeDay = (v) => {
    if (v == null) return null;

    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);

    if (typeof v === "object" && typeof v.toDate === "function") {
      try {
        return v.toDate().toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {}
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
      if (v.label) return String(v.label);
      if (v.name) return String(v.name);
      if (v.day) return String(v.day);

      const vals = Object.values(v);
      if (vals.length === 1) return normalizeDay(vals[0]);
    }

    try {
      return String(v);
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

    if (Array.isArray(cand)) {
      return cand.map(normalizeDay).filter(Boolean);
    }

    if (typeof cand === "object") {
      return Object.values(cand).map(normalizeDay).filter(Boolean);
    }

    if (typeof cand === "string") {
      return cand
        .split(",")
        .map((s) => normalizeDay(s.trim()))
        .filter(Boolean);
    }

    return [];
  };

  /* ---------------- Fetch ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const collections = ["participant", "partnership"];
        let allData = [];

        for (const coll of collections) {
          const q = query(collection(db, coll), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((docx) => ({
            id: docx.id,
            collection: coll,
            ...docx.data(),
          }));
          allData = [...allData, ...data];
        }

        setParticipants(allData);
        setTypes([
          ...new Set(allData.map((d) => d.organizationType).filter(Boolean)),
        ]);
        setCountries([
          ...new Set(allData.map((d) => d.organizationCountry).filter(Boolean)),
        ]);
        setParticipantTypes([
          ...new Set(allData.map((d) => d.participantType).filter(Boolean)),
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
    if (searchInput.trim() === "") {
      setSearchQuery("");
    }
  }, [searchInput]);

  /* ---------------- Handlers ---------------- */
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleDelete = async (id, collectionName, photoUrl, passportPhotoUrl) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (photoUrl) {
        const fileRef = ref(storage, photoUrl);
        await deleteObject(fileRef);
      }
      if (passportPhotoUrl) {
        const passportFileRef = ref(storage, passportPhotoUrl);
        await deleteObject(passportFileRef);
      }
      setParticipants((prev) =>
        prev.filter((p) => !(p.id === id && p.collection === collectionName))
      );
      message.success("Başvuru başarıyla silindi.");
    } catch (error) {
      console.error("Silme hatası:", error);
      message.error("Başvuru silinirken bir hata oluştu.");
    }
  };

  const handleNoteUpdate = async (id, collectionName, note) => {
    try {
      const refDoc = doc(db, collectionName, id);
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

  /* ---------------- Filter + Search ---------------- */
  const filtered = participants.filter((p) => {
    const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
    const daysText = getDays(p).join(" ").toLowerCase();
    const searchTarget = `${fullName} ${daysText} ${p.tcNo ?? ""} ${p.passportId ?? ""}`.trim();
    const searchMatch = searchTarget.includes(searchQuery.toLowerCase());

    return (
      searchMatch &&
      (filters.organizationType === "Tümü" ||
        p.organizationType === filters.organizationType) &&
      (filters.organizationCountry === "Tümü" ||
        p.organizationCountry === filters.organizationCountry) &&
      (filters.participantType === "Tümü" ||
        p.participantType === filters.participantType)
    );
  });

  const indexOfLast = currentPage * participantsPerPage;
  const indexOfFirst = indexOfLast - participantsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / participantsPerPage);

  /* ---------------- Export ---------------- */
  const exportToExcel = () => {
    if (filtered.length === 0) {
      message.warning("Dışa aktarılacak veri bulunamadı.");
      return;
    }

    const exportData = filtered.map((p) => {
      const days = getDays(p);
      return {
        "Ad": p.firstName ?? "",
        "Soyad": p.lastName ?? "",
        "E-posta": p.email ?? "",
        "Telefon": p.phone ?? "",
        "Yaş": p.age ?? "",
        "Görev/Unvan": p.jobTitle ?? "",
        "Kurum/Kuruluş": p.organization ?? "",
        "Kurum Türü": p.organizationType ?? "",
        "Ülke": p.organizationCountry ?? "",
        "Katılım Amacı": p.description ?? "",
        "Katılımcı Tipi": p.participantType ?? "",
        "T.C. Kimlik No": p.tcNo ?? "",
        "Doğum Tarihi": p.birthDate ? normalizeDay(p.birthDate) : "",
        "Pasaport No": p.passportId ?? "",
        "Pasaport Veriliş Tarihi": p.passportIssueDate ? normalizeDay(p.passportIssueDate) : "",
        "Pasaport Bitiş Tarihi": p.passportExpiry ? normalizeDay(p.passportExpiry) : "",
        "Katılım Günleri": days.length > 0 ? days.join(", ") : "—",
        "Gönderim Tarihi": p.createdAt
          ? new Date(p.createdAt.toDate()).toLocaleString("tr-TR", {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Katılımcılar");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Katilimcilar_FULL.xlsx");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
          <FaUser /> Katılımcılar
        </h2>
        <Button
          type="primary"
          icon={<FaFileExcel />}
          className="!bg-green-600"
          onClick={exportToExcel}
        >
          Tümünü Excel’e Aktar
        </Button>
      </div>

      <p className="text-gray-600 mb-4">
        Gösterilen: <strong>{filtered.length}</strong> / Toplam:{" "}
        <strong>{participants.length}</strong> katılımcı
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <select
          name="participantType"
          value={filters.participantType}
          onChange={handleFilterChange}
          className="border border-slate-100 shadow p-2 rounded"
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
          className="border border-slate-100 shadow p-2 rounded"
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
          className="border border-slate-100 shadow p-2 rounded"
        >
          <option value="Tümü">Tüm Ülkeler</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <div className="flex items-center border border-slate-100 shadow rounded overflow-hidden">
          <input
            type="text"
            placeholder="İsim, gün, T.C. No veya Pasaport No ile ara…"
            className="p-2 outline-none"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="p-2 border rounded-full text-white hover:bg-emerald-700 bg-emerald-500 transition"
          >
            <FaSearch />
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : currentItems.length === 0 ? (
        <div className="text-gray-500">Katılımcı bulunamadı.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[2500px] w-full border border-gray-200 text-sm">
              <thead className="bg-emerald-100 text-emerald-800">
                <tr>
                  <th className="px-4 py-2 text-left">Fotoğraf</th>
                  <th className="px-4 py-2 text-left">Ad</th>
                  <th className="px-4 py-2 text-left">Soyad</th>
                  <th className="px-4 py-2 text-left">E-posta</th>
                  <th className="px-4 py-2 text-left">Telefon</th>
                  <th className="px-4 py-2 text-left">Yaş</th>
                  <th className="px-4 py-2 text-left">Görev/Unvan</th>
                  <th className="px-4 py-2 text-left">Kurum/Kuruluş</th>
                  <th className="px-4 py-2 text-left">Kurum Türü</th>
                  <th className="px-4 py-2 text-left">Ülke</th>
                  <th className="px-4 py-2 text-left">Katılım Amacı</th>
                  <th className="px-4 py-2 text-left">Katılımcı Tipi</th>
                  <th className="px-4 py-2 text-left">T.C. Kimlik No</th>
                  <th className="px-4 py-2 text-left">Doğum Tarihi</th>
                  <th className="px-4 py-2 text-left">Pasaport No</th>
                  <th className="px-4 py-2 text-left">Pasaport Veriliş Tarihi</th>
                  <th className="px-4 py-2 text-left">Pasaport Bitiş Tarihi</th>
                  <th className="px-4 py-2 text-left">Pasaport Fotoğrafı</th>
                  <th className="px-4 py-2 text-left">Katılım Günleri</th>
                  <th className="px-4 py-2 text-left">Gönderim Tarihi</th>
                  <th className="px-4 py-2 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p) => {
                  const days = getDays(p);
                  return (
                    <tr
                      key={`${p.collection}-${p.id}`}
                      className="hover:bg-emerald-50 border-b border-slate-200"
                    >
                      <td className="px-4 py-2">
                        {p.photoUrl ? (
                          <Image
                            src={p.photoUrl}
                            width={50}
                            height={50}
                            className="h-10 w-10 object-cover rounded-full"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2">{p.firstName ?? "—"}</td>
                      <td className="px-4 py-2">{p.lastName ?? "—"}</td>
                      <td className="px-4 py-2">{p.email ?? "—"}</td>
                      <td className="px-4 py-2 w-fit whitespace-nowrap">{p.phone ?? "—"}</td>
                      <td className="px-4 py-2">{p.age ?? "—"}</td>
                      <td className="px-4 py-2">{p.jobTitle ?? "—"}</td>
                      <td className="px-4 py-2">{p.organization ?? "—"}</td>
                      <td className="px-4 py-2">{p.organizationType ?? "—"}</td>
                      <td className="px-4 py-2">{p.organizationCountry ?? "—"}</td>
                      <DescriptionCell text={p.description} />
                      <td className="px-4 py-2">{p.participantType ?? "—"}</td>
                      <td className="px-4 py-2">{p.tcNo ?? "—"}</td>
                      <td className="px-4 py-2">{p.birthDate ? normalizeDay(p.birthDate) : "—"}</td>
                      <td className="px-4 py-2">{p.passportId ?? "—"}</td>
                      <td className="px-4 py-2">{p.passportIssueDate ? normalizeDay(p.passportIssueDate) : "—"}</td>
                      <td className="px-4 py-2">{p.passportExpiry ? normalizeDay(p.passportExpiry) : "—"}</td>
                      <td className="px-4 py-2">
                        {p.passportPhotoUrl ? (
                          <Image
                            src={p.passportPhotoUrl}
                            width={50}
                            height={50}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {days.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {days.map((day, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 font-semibold text-gray-600">
                        {p.createdAt
                          ? new Date(p.createdAt.toDate()).toLocaleString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-2">
                          <PopConfirmDelete
                            onConfirm={() =>
                              handleDelete(p.id, p.collection, p.photoUrl, p.passportPhotoUrl)
                            }
                          />
                          <textarea
                            className="w-44 border text-xs p-2 rounded shadow-sm"
                            placeholder="Not yaz..."
                            defaultValue={p.adminNote || ""}
                            onBlur={(e) => handleNoteUpdate(p.id, p.collection, e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-4 gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Participants;
