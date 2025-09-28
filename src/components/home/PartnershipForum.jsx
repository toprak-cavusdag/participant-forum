import { useState, useRef, useMemo, useEffect } from "react";
import { countries } from "./data";
import { db, storage } from "../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Field from "../common/Field";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { FiUploadCloud } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const normalize = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const isTurkeyLike = (value, label) => {
  const v = normalize(value);
  const l = normalize(label);
  return (
    v === "turkiye" ||
    v === "türkiye" ||
    v === "turkey" ||
    v === "tr" ||
    l === "turkiye" ||
    l === "türkiye" ||
    l === "turkey"
  );
};

const validateTCNo = (tcNo) => {
  tcNo = String(tcNo || "").trim();
  if (!/^\d{11}$/.test(tcNo)) return false;

  const digits = tcNo.split("").map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const checkDigit10 = (oddSum * 7 - evenSum) % 10;
  const checkDigit11 = (oddSum + evenSum + digits[9]) % 10;

  return digits[10] === checkDigit11 && digits[9] === checkDigit10;
};

const PartnershipForum = ({ isSubmitted, setIsSubmitted }) => {
  const { t, i18n } = useTranslation();
  const countriesDict = t("countries", { returnObjects: true }) || {};
  const organizationTypes = useMemo(() => t("form.organizationTypesList", { returnObjects: true }), [t]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: "",
    age: "",
    email: "",
    description: "",
    organization: "",
    organizationCountry: "",
    jobTitle: "",
    organizationType: "",
    participantType: "Partnership",
    photo: null,
    termsAccepted: false,
    tcNo: "",
    birthDate: "",
    passportId: "",
    passportIssueDate: "",
    passportExpiry: "",
    passportPhoto: null,
  });

  const countryOptions = useMemo(() => {
    return Object.entries(countriesDict)
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, i18n.language));
  }, [countriesDict, i18n.language]);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const passportFileInputRef = useRef(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedCountryLabel =
    formData.organizationCountry && countriesDict[formData.organizationCountry]
      ? countriesDict[formData.organizationCountry]
      : "";
  const inTR = isTurkeyLike(formData.organizationCountry, selectedCountryLabel);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tcNo: inTR ? prev.tcNo : "",
      birthDate: inTR ? prev.birthDate : "",
      passportId: !inTR ? prev.passportId : "",
      passportIssueDate: !inTR ? prev.passportIssueDate : "",
      passportExpiry: !inTR ? prev.passportExpiry : "",
      passportPhoto: !inTR ? prev.passportPhoto : null,
    }));
    if (!inTR) setPassportPreview(null);
  }, [inTR]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (name === "photo" || name === "passportPhoto") {
      const file = files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          toast.error(t("form.error.invalidImage") || "Lütfen geçerli bir görsel dosyası yükleyin (JPEG/PNG).");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t("form.error.fileTooLarge") || "Dosya boyutu 5MB'tan küçük olmalıdır.");
          return;
        }
      }
      setFormData((prev) => ({ ...prev, [name]: file || null }));
      if (name === "photo") {
        setPreview(file ? URL.createObjectURL(file) : null);
      } else {
        setPassportPreview(file ? URL.createObjectURL(file) : null);
      }
      return;
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sendConfirmationEmail = async ({
    name,
    email,
    title,
    organization,
  }) => {
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        { name, email, title, organization },
        import.meta.env.VITE_EMAILJS_USER_ID
      );
      console.log("✅ Confirmation email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send confirmation email", error);
    }
  };

  const validateTR = () => {
    if (!validateTCNo(formData.tcNo)) {
      toast.error(t("form.error.tcno") || "Lütfen geçerli bir T.C. Kimlik Numarası girin.");
      return false;
    }
    if (!formData.birthDate) {
      toast.error(t("form.error.birthDate") || "Lütfen bir doğum tarihi seçin.");
      return false;
    }
    const today = new Date();
    const birthDate = new Date(formData.birthDate);
    if (birthDate > today) {
      toast.error(t("form.error.birthDateFuture") || "Doğum tarihi gelecekte olamaz.");
      return false;
    }
    return true;
  };

  const validatePassport = () => {
    if (!/^[A-Za-z0-9]{6,20}$/.test(formData.passportId?.trim())) {
      toast.error(
        t("form.error.passportId") || "Lütfen geçerli bir Pasaport ID girin (6–20 alfasayısal karakter)."
      );
      return false;
    }
    if (!formData.passportIssueDate) {
      toast.error(t("form.error.passportIssueDate") || "Lütfen pasaport veriliş tarihini seçin.");
      return false;
    }
    if (!formData.passportExpiry) {
      toast.error(t("form.error.passportExpiry") || "Lütfen pasaport bitiş tarihini seçin.");
      return false;
    }
    const today = new Date();
    const issueDate = new Date(formData.passportIssueDate);
    const expiryDate = new Date(formData.passportExpiry);
    if (issueDate > today) {
      toast.error(t("form.error.passportIssueDateFuture") || "Pasaport veriliş tarihi gelecekte olamaz.");
      return false;
    }
    if (expiryDate < today) {
      toast.error(t("form.error.passportExpiryPast") || "Pasaport bitiş tarihi geçmişte olamaz.");
      return false;
    }
    if (issueDate > expiryDate) {
      toast.error(t("form.error.passportIssueAfterExpiry") || "Pasaport veriliş tarihi bitiş tarihinden sonra olamaz.");
      return false;
    }
    if (!formData.passportPhoto) {
      toast.error(t("form.error.passportPhoto") || "Lütfen bir pasaport fotoğrafı yükleyin.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.photo) return toast.error(t("form.error.photo"));
    if (!formData.countryCode) return toast.error(t("form.error.code"));
    if (!formData.participantType) return toast.error(t("form.error.participantType"));
    if (!formData.termsAccepted) return toast.error(t("form.error.terms"));
    if (!formData.organizationCountry) return toast.error(t("form.error.country") || "Lütfen bir ülke seçin.");

    if (inTR) {
      if (!validateTR()) return;
    } else {
      if (!validatePassport()) return;
    }

    setLoading(true);
    const toastId = toast.loading(t("form.loading"));

    try {
      const imageRef = ref(storage, `photos/${Date.now()}-${formData.photo.name}`);
      await uploadBytes(imageRef, formData.photo);
      const photoUrl = await getDownloadURL(imageRef);

      let passportPhotoUrl = null;
      if (!inTR && formData.passportPhoto) {
        const passRef = ref(
          storage,
          `passports/${Date.now()}-${formData.passportPhoto.name}`
        );
        await uploadBytes(passRef, formData.passportPhoto);
        passportPhotoUrl = await getDownloadURL(passRef);
      }

      const fullPhone = `${formData.countryCode} ${formData.phone}`.trim();

      const base = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: fullPhone,
        age: formData.age,
        email: formData.email,
        description: formData.description,
        organization: formData.organization,
        organizationCountry: formData.organizationCountry,
        jobTitle: formData.jobTitle,
        organizationType: formData.organizationType,
        participantType: formData.participantType,
        photoUrl,
        createdAt: serverTimestamp(),
      };

      let userData = { ...base };

      if (inTR) {
        userData.tcNo = formData.tcNo;
        userData.birthDate = formData.birthDate
          ? new Date(`${formData.birthDate}T12:00:00`)
          : null;
        userData.passportId = null;
        userData.passportIssueDate = null;
        userData.passportExpiry = null;
        userData.passportPhotoUrl = null;
      } else {
        userData.tcNo = null;
        userData.birthDate = null;
        userData.passportId = formData.passportId || null;
        userData.passportIssueDate = formData.passportIssueDate
          ? new Date(`${formData.passportIssueDate}T12:00:00`)
          : null;
        userData.passportExpiry = formData.passportExpiry
          ? new Date(`${formData.passportExpiry}T12:00:00`)
          : null;
        userData.passportPhotoUrl = passportPhotoUrl;
      }

      await addDoc(collection(db, "partnership"), userData);

      await sendConfirmationEmail({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        title: formData.jobTitle,
        organization: formData.organization,
      });

      toast.success(t("form.success"), { id: toastId });
      setIsSubmitted(true);

      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        countryCode: "",
        age: "",
        email: "",
        description: "",
        organization: "",
        organizationCountry: "",
        jobTitle: "",
        organizationType: "",
        participantType: "Partnership",
        photo: null,
        termsAccepted: false,
        tcNo: "",
        birthDate: "",
        passportId: "",
        passportIssueDate: "",
        passportExpiry: "",
        passportPhoto: null,
      });
      setPreview(null);
      setPassportPreview(null);
    } catch (err) {
      console.error(err);
      toast.error(t("form.error.general"), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        scale: { type: "spring", stiffness: 300, damping: 20 },
      }}
      className={`max-w-4xl mx-auto px-4 py-10 bg-white rounded-xl shadow-md ${
        isSubmitted ? "hidden" : "block"
      }`}
    >
      {!isSubmitted && (
        <form
          onSubmit={handleSubmit}
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${
            loading ? "blur-sm opacity-50" : ""
          }`}
        >
          <div>
            <Field
              label={t("form.firstName")}
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterAccurateName") || "Lütfen adınızı ve soyadınızı kimlik belgenizde yer aldığı şekilde girin."}</p>
          </div>
          <div>
            <Field
              label={t("form.lastName")}
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterAccurateName") || "Lütfen adınızı ve soyadınızı kimlik belgenizde yer aldığı şekilde girin."}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.phone")} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <option value="">{t("form.selectCode")}</option>
                {countries.map((c, index) => (
                  <option key={index} value={c.code}>
                    {c.flag} ({c.phoneCode})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="phone"
                placeholder={t("form.phonePlaceholder")}
                className="flex-1 border border-gray-300 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterPersonalPhone") || "Lütfen kişisel telefon numaranızı girin."}</p>
          </div>
          <Field
            label={t("form.age")}
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            required
            min={16}
            disabled={loading}
          />
          <div>
            <Field
              label={t("form.email")}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterValidEmail") || "Lütfen onay için geçerli bir e-posta adresi girin."}</p>
          </div>
          <Field
            label={t("form.jobTitle")}
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <Field
            label={t("form.organization")}
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.organizationCountry")} <span className="text-red-500">*</span>
            </label>
            <select
              name="organizationCountry"
              value={formData.organizationCountry}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  organizationCountry: e.target.value,
                }))
              }
              className="w-full border border-gray-300 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={loading}
            >
              <option value="" disabled hidden>
                {t("form.selectCountry")}
              </option>
              {countryOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.organizationType")} <span className="text-red-500">*</span>
            </label>
            <select
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={loading}
            >
              <option value="" disabled hidden>
                {t("form.selectType")}
              </option>
              {organizationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.whyAttend")}
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder={t("form.whyAttendPlaceholder")}
              className="w-full border border-gray-300 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.logo")} <span className="text-red-500">*</span>
            </label>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()
              }
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                const files = e.dataTransfer?.files;
                if (files && files.length) {
                  handleChange({ target: { name: "photo", files } });
                }
              }}
              className={[
                "relative w-full rounded-xl border transition-all cursor-pointer",
                "p-6 sm:p-8 flex flex-col items-center justify-center text-center",
                dragActive
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50",
                loading && "opacity-60 pointer-events-none",
              ].join(" ")}
            >
              <FiUploadCloud
                size={48}
                className={`mb-3 ${dragActive ? "text-indigo-500" : "text-gray-400"}`}
              />
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {loading ? t("form.uploading") : t("form.uploadHint")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t("form.uploadSubHint")}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                disabled={loading}
              />
              {dragActive && (
                <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-indigo-400/60"></div>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{t("form.warning.uploadClearPhoto") || "Lütfen net ve güncel bir profil fotoğrafı yükleyin."}</p>
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 h-32 w-32 object-cover rounded border"
              />
            )}
          </div>
          {inTR ? (
            <>
              <div>
                <Field
                  label={t("form.tcNo") || "T.C. Kimlik Numarası"}
                  name="tcNo"
                  value={formData.tcNo}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterValidTCNo") || "Lütfen geçerli bir 11 haneli T.C. Kimlik Numarası girin."}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("form.birthDate") || "Doğum Tarihi"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterValidBirthDate") || "Lütfen doğru doğum tarihinizi girin."}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <Field
                  label={t("form.passportId") || "Pasaport ID"}
                  name="passportId"
                  value={formData.passportId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterValidPassportId") || "Lütfen geçerli bir pasaport ID girin (6–20 alfasayısal karakter)."}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("form.passportIssueDate") || "Pasaport Veriliş Tarihi"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="passportIssueDate"
                  value={formData.passportIssueDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterValidIssueDate") || "Lütfen doğru pasaport veriliş tarihini girin."}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("form.passportExpiry") || "Pasaport Bitiş Tarihi"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="passportExpiry"
                  value={formData.passportExpiry}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-slate-600 mt-1">{t("form.warning.enterValidExpiryDate") || "Lütfen geçerli bir pasaport bitiş tarihi girin."}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("form.passportPhoto") || "Pasaport Fotoğrafı"} <span className="text-red-500">*</span>
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    passportFileInputRef.current?.click()
                  }
                  onClick={() => passportFileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                    const files = e.dataTransfer?.files;
                    if (files && files.length) {
                      handleChange({ target: { name: "passportPhoto", files } });
                    }
                  }}
                  className={[
                    "relative w-full rounded-xl border transition-all cursor-pointer",
                    "p-6 sm:p-8 flex flex-col items-center justify-center text-center",
                    dragActive
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50",
                    loading && "opacity-60 pointer-events-none",
                  ].join(" ")}
                >
                  <FiUploadCloud size={40} className="mb-2 text-gray-400" />
                  <p className="text-sm sm:text-base font-medium text-gray-800">
                    {t("form.uploadPassportHint") ||
                      "Pasaport görselini yüklemek için tıklayın (JPEG/PNG)."}
                  </p>
                  <input
                    ref={passportFileInputRef}
                    type="file"
                    name="passportPhoto"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                    disabled={loading}
                  />
                  {dragActive && (
                    <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-indigo-400/60"></div>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{t("form.warning.uploadClearPassportPhoto") || "Lütfen pasaportunuzun net bir görselini yükleyin."}</p>
                {passportPreview && (
                  <img
                    src={passportPreview}
                    alt="Passport Preview"
                    className="mt-2 h-36 w-48 object-cover rounded border"
                  />
                )}
              </div>
            </>
          )}
          <div className="md:col-span-2 flex items-start gap-4">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="checkbox-custom disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
            <label className="text-sm text-gray-700 leading-5">
              <strong>{t("form.terms.label")}</strong> {t("form.terms.text")}{" "}
              <Link
                to="/zero-waste-kvkk"
                target="_blank"
                className="text-emerald-600 underline text-sm"
              >
                {t("form.terms.link")}
              </Link>
            </label>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className={`w-full py-2 rounded transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } text-white`}
              disabled={loading}
            >
              {loading ? t("form.submitting") : t("form.submit")}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default PartnershipForum;