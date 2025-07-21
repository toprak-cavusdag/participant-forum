import { useState } from "react";
import { countries, organizationTypes } from "./data";
import { db, storage } from "../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Field from "../common/Field";
import { motion } from "framer-motion";

const ParticipantForum = ({ isSubmitted, setIsSubmitted }) => {
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
    participationDay: "",
    participantType: "Participant",
    photo: null,
    termsAccepted: false,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.photo) {
      toast.error("Please upload a profile photo.");
      return;
    }

    if (!formData.countryCode) {
      toast.error("Please select a country code.");
      return;
    }

    if (!formData.participantType) {
      toast.error("Please select participant type.");
      return;
    }

    if (!formData.termsAccepted) {
      toast.error("You must accept the terms and conditions.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Submitting your application...");

    try {
      const imageRef = ref(storage, `photos/${Date.now()}-${formData.photo.name}`);
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
      toast.success("Application submitted successfully!", { id: toastId });
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
        participationDay: "",
        participantType: "Participant",
        photo: null,
        termsAccepted: false,
      });
      setPreview(null);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.", { id: toastId });
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
      className={`max-w-4xl mx-auto px-4 py-10 bg-white rounded-xl shadow-md ${isSubmitted ? "hidden" :"block"}`}
    >
      {isSubmitted ? (
        null
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${loading ? 'blur-sm' : ''}`}
        >
          <Field label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required disabled={loading} />
          <Field label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required disabled={loading} />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="border border-gray-300 p-2 rounded w-40" disabled={loading}>
                <option value="">Select Code</option>
                {countries.map((c, index) => (
                  <option key={index} value={c.code}>{c.flag} ({c.phoneCode})</option>
                ))}
              </select>
              <input
                type="tel"
                name="phone"
                placeholder="555 123 4567"
                className="flex-1 border border-gray-300 p-2 rounded"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
          <Field label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required min={16} disabled={loading} />
          <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={loading} />
          <Field label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required disabled={loading} />
          <Field label="Organization" name="organization" value={formData.organization} onChange={handleChange} required disabled={loading} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
            <select name="organizationCountry" value={formData.organizationCountry} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required disabled={loading}>
              <option value="" disabled hidden>Select a Country</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type <span className="text-red-500">*</span></label>
            <select name="organizationType" value={formData.organizationType} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required disabled={loading}>
              <option value="" disabled hidden>Select Type</option>
              {organizationTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Which day will you attend? <span className="text-red-500">*</span></label>
            <select name="participationDay" value={formData.participationDay} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required disabled={loading}>
              <option value="" disabled hidden>Select a day</option>
              <option value="October 17">October 17</option>
              <option value="October 18">October 18</option>
              <option value="October 19">October 19</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={3} placeholder="Could you please write down your purpose for attending our event?" className="w-full border border-gray-300 p-2 rounded" value={formData.description} onChange={handleChange} disabled={loading} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo - Logo <span className="text-red-500">*</span></label>
            <input type="file" name="photo" accept="image/*" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" disabled={loading} />
            {preview && <img src={preview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded border" />}
          </div>
          <div className="md:col-span-2 flex items-start gap-2">
            <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1" disabled={loading} />
            <label className="text-sm text-gray-700">
              <strong>Data Protection Notice:</strong> I consent to the processing of my personal data in accordance with the applicable data protection laws.{" "}
              <Link to="/zero-waste-kvkk" target="_blank" className="text-blue-600 underline text-sm">Read full KVKK</Link>
            </label>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className={`w-full py-2 rounded transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default ParticipantForum;