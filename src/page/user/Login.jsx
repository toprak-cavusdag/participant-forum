import { useState } from "react";
import { auth, db } from "../../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { setAdminInfo } from "../../store/userSlice";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);

      // Firebase login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // Firestore'dan admin eşleşmesi
      const adminQuery = query(
        collection(db, "admin"),
        where("mail", "==", user.email)
      );
      const snapshot = await getDocs(adminQuery);

      if (!snapshot.empty) {
        const adminData = snapshot.docs[0].data();

        // Redux + localStorage
        dispatch(setAdminInfo(adminData));
        localStorage.setItem("adminInfo", JSON.stringify(adminData));
        localStorage.setItem("lastLogin", Date.now().toString());

        toast.success(`Welcome back, ${adminData.firstname}!`);
        navigate("/dashboard/participants");
      } else {
        toast.error("You are not authorized to access the panel.");
      }
    } catch (err) {
      console.error("Login Error:", err.code, err.message);
      const errorMessages = {
        "auth/invalid-email": "Invalid email address.",
        "auth/wrong-password": "Wrong password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/too-many-requests": "Too many failed attempts. Try later.",
        "auth/network-request-failed": "Network error. Check your connection.",
      };
      const friendlyMessage =
        errorMessages[err.code] || "Login failed. Please try again.";
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('/login_bg.jpg')` }}
    >
      <div className="bg-white backdrop-blur-md rounded-lg shadow-xl p-8 w-full max-w-md space-y-5">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Global Zero Waste Forum
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={handleChange}
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="w-full border border-gray-300 p-2 rounded pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-500"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;