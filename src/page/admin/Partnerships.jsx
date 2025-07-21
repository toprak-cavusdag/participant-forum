import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, storage } from "../../config/firebase";
import { FaSearch, FaHandshake, FaFileExcel } from "react-icons/fa";
import { deleteObject, ref } from "firebase/storage";
import { Image, message, Button } from "antd";
import PopConfirmDelete from "../../components/common/PopConfirmDelete";
import TableLoading from "../../components/admin/table/TableLoading";
import TableNull from "../../components/admin/table/TableNull";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Partnerships = () => {
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
  const participantsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(
          collection(db, "partnership"),
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
      await deleteDoc(doc(db, "partnership", id));
      if (photoUrl) {
        const fileRef = ref(storage, photoUrl);
        await deleteObject(fileRef);
      }
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      message.success("Partnership and photo deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      message.error("An error occurred while deleting the partnership.");
    }
  };

  const filtered = participants.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const searchMatch = fullName.includes(searchQuery.toLowerCase());
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

  const exportToExcel = () => {
    if (filtered.length === 0) {
      message.warning("No data to export");
      return;
    }

    const exportData = filtered.map((p) => ({
      PhotoURL: p.photoUrl || "—",
      Name: `${p.firstName} ${p.lastName}`,
      Email: p.email,
      Phone: p.phone,
      Age: p.age,
      JobTitle: p.jobTitle,
      Organization: p.organization,
      OrganizationType: p.organizationType,
      Country: p.organizationCountry,
      Description: p.description,
      SubmittedAt: p.createdAt?.toDate().toLocaleString("tr-TR") || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partnerships");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Partnerships_FULL.xlsx");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
          <FaHandshake /> Partnerships
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
        <strong>{participants.length}</strong> partnerships
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
            placeholder="Search by name..."
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
        <TableNull />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[2000px] border border-gray-200 text-sm">
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
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50 border-b border-slate-200">
                    <td className="px-4 py-2">
                      {p.photoUrl ? (
                        <Image
                          src={p.photoUrl}
                          alt={`${p.firstName} ${p.lastName}`}
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
                    <td className="px-4 py-2 whitespace-nowrap">{p.phone}</td>
                    <td className="px-4 py-2">{p.age}</td>
                    <td className="px-4 py-2">{p.jobTitle}</td>
                    <td className="px-4 py-2">{p.organization}</td>
                    <td className="px-4 py-2">{p.organizationType}</td>
                    <td className="px-4 py-2">{p.organizationCountry}</td>
                    <td className="px-4 py-2">{p.description || "—"}</td>
                    <td className="px-4 py-2 text-gray-600  font-semibold">
                      {p.createdAt?.toDate().toLocaleString("tr-TR") || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <PopConfirmDelete
                        onConfirm={() => handleDelete(p.id, p.photoUrl)}
                      />
                    </td>
                  </tr>
                ))}
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

export default Partnerships;