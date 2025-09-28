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
    organizationType: "All",
    organizationCountry: "All",
  });
  const [types, setTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const participantsPerPage = 15;

  const adminInfo = useSelector((state) => state.user.adminInfo);

  /* ---------------- Helpers: Day Normalizers ---------------- */

  // Tek bir öğeyi stringe çevir: string | number | Timestamp | {label|name|day} | nested object
  const normalizeDay = (v) => {
    if (v == null) return null;

    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);

    // Firestore Timestamp (methodlu) => v.toDate()
    if (typeof v === "object" && typeof v.toDate === "function") {
      try {
        return v
          .toDate()
          .toLocaleDateString("en-US", { month: "long", day: "numeric" });
      } catch {}
    }

    // Firestore Timestamp (plain) => {seconds, nanoseconds}
    if (
      typeof v === "object" &&
      "seconds" in v &&
      "nanoseconds" in v &&
      typeof v.seconds === "number"
    ) {
      const ms = v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
      return new Date(ms).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });
    }

    // Ortak field isimleri
    if (typeof v === "object") {
      if (v.label) return String(v.label);
      if (v.name) return String(v.name);
      if (v.day) return String(v.day);

      // Tek değerli nested objeler (ör. {value:"October 17"})
      const vals = Object.values(v);
      if (vals.length === 1) return normalizeDay(vals[0]);
    }

    try {
      return String(v);
    } catch {
      return null;
    }
  };

  // participation day alanını tek biçime getir: Array<string>
  const getDays = (obj) => {
    const cand =
      obj?.participationDay ??
      obj?.participationDays ??
      obj?.days ??
      obj?.day ??
      obj;

    if (cand == null) return [];

    if (Array.isArray(cand)) {
      return cand.map(normalizeDay).filter(Boolean);
    }

    if (typeof cand === "object") {
      // {0:"..",1:".."} veya {0:{seconds,..},1:{...}}
      return Object.values(cand).map(normalizeDay).filter(Boolean);
    }

    if (typeof cand === "string") {
      // "Oct 17, Oct 18"
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
        const q = query(
          collection(db, "participant"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setParticipants(data);
        setTypes([
          ...new Set(data.map((d) => d.organizationType).filter(Boolean)),
        ]);
        setCountries([
          ...new Set(data.map((d) => d.organizationCountry).filter(Boolean)),
        ]);
      } catch (err) {
        console.error("Data fetch failed", err);
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

  const handleDelete = async (id, photoUrl) => {
    try {
      await deleteDoc(doc(db, "participant", id));
      if (photoUrl) {
        const fileRef = ref(storage, photoUrl);
        await deleteObject(fileRef);
      }
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      message.success("Participant and photo deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      message.error("An error occurred while deleting the participant.");
    }
  };

  const handleNoteUpdate = async (id, note) => {
    try {
      const refDoc = doc(db, "participant", id);
      await updateDoc(refDoc, {
        adminNote: note,
        noteBy: adminInfo?.firstname || "Admin",
        noteDate: new Date(),
      });
      message.success("Note updated");
    } catch (error) {
      console.error("Error updating note:", error);
      message.error("Failed to update note");
    }
  };

  /* ---------------- Filter + Search (days dahil) ---------------- */
  const filtered = participants.filter((p) => {
    const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
    const daysText = getDays(p).join(" ").toLowerCase();
    const searchTarget = `${fullName} ${daysText}`.trim();
    const searchMatch = searchTarget.includes(searchQuery.toLowerCase());

    return (
      searchMatch &&
      (filters.organizationType === "All" ||
        p.organizationType === filters.organizationType) &&
      (filters.organizationCountry === "All" ||
        p.organizationCountry === filters.organizationCountry)
    );
  });

  const indexOfLast = currentPage * participantsPerPage;
  const indexOfFirst = indexOfLast - participantsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / participantsPerPage);

  /* ---------------- Export ---------------- */
  const exportToExcel = () => {
    if (filtered.length === 0) {
      message.warning("No data to export");
      return;
    }

    const exportData = filtered.map((p) => {
      const days = getDays(p);
      return {
        Name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
        Email: p.email ?? "",
        Phone: p.phone ?? "",
        Age: p.age ?? "",
        JobTitle: p.jobTitle ?? "",
        Organization: p.organization ?? "",
        OrganizationType: p.organizationType ?? "",
        Country: p.organizationCountry ?? "",
        Description: p.description ?? "",
        ParticipantDay: Array.isArray(p.selectedDays) && p.selectedDays.length > 0
  ? p.selectedDays.join(", ")
  : "—",

        SubmittedAt: p.createdAt?.toDate?.().toLocaleString("tr-TR") ?? "—",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Participants_FULL.xlsx");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
          <FaUser /> Participants
        </h2>

        <Button
          type="primary"
          icon={<FaFileExcel />}
          className="!bg-green-600"
          onClick={exportToExcel}
        >
          Export All to Excel
        </Button>
      </div>

      <p className="text-gray-600 mb-4">
        Showing <strong>{filtered.length}</strong> out of{" "}
        <strong>{participants.length}</strong> participants
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <select
          name="organizationType"
          value={filters.organizationType}
          onChange={handleFilterChange}
          className="border border-slate-100 shadow p-2 rounded"
        >
          <option value="All">All Organization Types</option>
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
          <option value="All">All Countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <div className="flex items-center border border-slate-100 shadow rounded overflow-hidden">
          <input
            type="text"
            placeholder="Search by name or day..."
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
        <div className="text-gray-500">No participants found.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[2000px] w-full border border-gray-200 text-sm">
              <thead className="bg-emerald-100 text-emerald-800">
                <tr>
                  <th className="px-4 py-2 text-left">Photo</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Age</th>
                  <th className="px-4 py-2 text-left">Job Title</th>
                  <th className="px-4 py-2 text-left">Organization</th>
                  <th className="px-4 py-2 text-left">Organization Type</th>
                  <th className="px-4 py-2 text-left">Country</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Submitted At</th>
                  <th className="px-4 py-2 text-left">Participation Day</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p) => {
                  const days = getDays(p);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-emerald-50  border-b border-slate-200"
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
                      <td className="px-4 py-2">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="px-4 py-2">{p.email}</td>
                      <td className="px-4 py-2 w-fit whitespace-nowrap">
                        {p.phone}
                      </td>
                      <td className="px-4 py-2">{p.age}</td>
                      <td className="px-4 py-2">{p.jobTitle}</td>
                      <td className="px-4 py-2">{p.organization}</td>
                      <td className="px-4 py-2">{p.organizationType}</td>
                      <td className="px-4 py-2">{p.organizationCountry}</td>
                      <DescriptionCell text={p.description} />
                      <td className="px-4 py-2 font-semibold text-gray-600">
                        {p.createdAt?.toDate?.().toLocaleString("tr-TR") || "—"}
                      </td>

              <td className="px-4 py-2">
  {Array.isArray(p.selectedDays) && p.selectedDays.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {p.selectedDays.map((day, i) => (
        <span
          key={i}
          className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700"
        >
          {day}
        </span>
      ))}
    </div>
  ) : "—"}
</td>


                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-2">
                          <PopConfirmDelete
                            onConfirm={() => handleDelete(p.id, p.photoUrl)}
                          />
                          <textarea
                            className="w-44 border text-xs p-2 rounded shadow-sm"
                            placeholder="Write a note..."
                            defaultValue={p.adminNote || ""}
                            onBlur={(e) =>
                              handleNoteUpdate(p.id, e.target.value)
                            }
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
