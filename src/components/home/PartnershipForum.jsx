import { useMemo, useState } from "react";
import { countries } from "./data";
import { db, storage } from "../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Field from "../common/Field";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { useTranslation } from "react-i18next";

const PartnershipForum = ({ isSubmitted, setIsSubmitted }) => {
const { t, i18n } = useTranslation();
  const countriesDict = t("countries", { returnObjects: true }) || {};

  const countryOptions = useMemo(() => {
  return Object.entries(countriesDict)
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, i18n.language));
}, [countriesDict, i18n.language]);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

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
  });

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === "photo") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreview(URL.createObjectURL(file));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.photo) return toast.error(t("form.error.photo"));
    if (!formData.countryCode) return toast.error(t("form.error.code"));
    if (!formData.participantType)
      return toast.error(t("form.error.participantType"));
    if (!formData.termsAccepted) return toast.error(t("form.error.terms"));

    setLoading(true);
    const toastId = toast.loading(t("form.loading"));

    try {
      // Upload logo
      const imageRef = ref(
        storage,
        `photos/${Date.now()}-${formData.photo.name}`
      );
      await uploadBytes(imageRef, formData.photo);
      const photoUrl = await getDownloadURL(imageRef);

      // Save to Firestore
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

      await addDoc(collection(db, "partnership"), userData);

      // Send confirmation email
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
      {isSubmitted ? null : (
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
    setFormData((p) => ({ ...p, organizationCountry: e.target.value }))
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
              {t("form.logo")} <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              disabled={loading}
            />
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

export default PartnershipForum;
