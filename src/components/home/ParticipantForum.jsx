import { useState, useRef, useMemo } from "react";
import { countries, organizationTypes } from "./data";
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

const ParticipantForum = ({ isSubmitted, setIsSubmitted }) => {
  const { t, i18n } = useTranslation();
  const countriesDict = t("countries", { returnObjects: true }) || {};

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
    selectedDays: [],
    participantType: "Participant",
    photo: null,
    termsAccepted: false,
  });

  const countryOptions = useMemo(() => {
    return Object.entries(countriesDict)
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, i18n.language));
  }, [countriesDict, i18n.language]);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const eventDays = t("form.eventDays", { returnObjects: true });

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === "photo") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreview(URL.createObjectURL(file));
    } else if (type === "checkbox" && name === "selectedDays") {
      setFormData((prev) => {
        if (checked) {
          return { ...prev, selectedDays: [...prev.selectedDays, value] };
        } else {
          return {
            ...prev,
            selectedDays: prev.selectedDays.filter((day) => day !== value),
          };
        }
      });
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const sendConfirmationEmail = async ({
    name,
    email,
    title,
    organization,
    participationDay,
  }) => {
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          name,
          email,
          title,
          organization,
          participationDay,
        },
        import.meta.env.VITE_EMAILJS_USER_ID
      );
      console.log("✅ Confirmation email sent");
    } catch (err) {
      console.error("❌ Failed to send confirmation email", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.photo) return toast.error(t("form.error.photo"));
    if (!formData.countryCode) return toast.error(t("form.error.code"));
    if (!formData.participantType)
      return toast.error(t("form.error.participantType"));
    if (!formData.termsAccepted) return toast.error(t("form.error.terms"));
    if (!formData.selectedDays.length) return toast.error(t("form.error.days"));

    setLoading(true);
    const toastId = toast.loading(t("form.loading"));

    try {
      const imageRef = ref(
        storage,
        `photos/${Date.now()}-${formData.photo.name}`
      );
      await uploadBytes(imageRef, formData.photo);
      const photoUrl = await getDownloadURL(imageRef);

      const fullPhone = `${formData.countryCode} ${formData.phone}`;
      const userData = {
        ...formData,
        phone: fullPhone,
        photoUrl,
        createdAt: serverTimestamp(),
      };

      delete userData.photo;
      delete userData.countryCode;
      delete userData.termsAccepted;

      await addDoc(collection(db, "participant"), userData);

      await sendConfirmationEmail({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        title: formData.jobTitle,
        organization: formData.organization,
        participationDay: formData.selectedDays.join(", "),
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
        selectedDays: [],
        participantType: "Participant",
        photo: null,
        termsAccepted: false,
      });
      setPreview(null);
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
            loading ? "blur-sm" : ""
          }`}
        >
          <Field
            label={t("form.firstName")}
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <Field
            label={t("form.lastName")}
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.phone")} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded w-40"
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
                className="flex-1 border border-gray-300 p-2 rounded"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
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
          <Field
            label={t("form.email")}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
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
              {t("form.organizationCountry")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              name="organizationCountry"
              value={formData.organizationCountry} // ör: "turkiye"
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  organizationCountry: e.target.value,
                }))
              }
              className="w-full border border-gray-300 p-2 rounded"
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
              {t("form.organizationType")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
              disabled={loading}
            >
              <option value="" disabled hidden>
                {t("form.selectType")}
              </option>
              {t("form.organizationTypesList", { returnObjects: true }).map(
                (type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Günler */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.daysLabel")} <span className="text-red-500">*</span>
            </label>
            <div className="flex mt-2 gap-2 flex-wrap">
              {eventDays.map((day, index) => (
                <label key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="selectedDays"
                    value={day}
                    className="checkbox-custom"
                    checked={formData.selectedDays.includes(day)}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.whyAttend")}
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder={t("form.whyAttendPlaceholder")}
              className="w-full border border-gray-300 p-2 rounded"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("form.profilePhoto")} <span className="text-red-500">*</span>
            </label>

            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                fileInputRef.current?.click()
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
                className={`mb-3 ${
                  dragActive ? "text-indigo-500" : "text-gray-400"
                }`}
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

            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 h-32 w-32 object-cover rounded border"
              />
            )}
          </div>

          <div className="md:col-span-2 flex items-start gap-4">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="checkbox-custom"
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

export default ParticipantForum;
