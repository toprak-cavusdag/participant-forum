import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";
import { FaSignOutAlt } from "react-icons/fa";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully.", { duration: 2000 });
      navigate("/zero-waste/panel/login");
    } catch (error) {
      toast.error("Sign out failed.", { duration: 2000 });
    }
  };
  return (
    <button
      onClick={handleLogout}
      className="w-full mt-6 flex items-center space-x-3 text-base font-medium text-rose-600 hover:bg-rose-100 rounded-lg px-3 py-2 transition-colors"
    >
      <FaSignOutAlt className="text-xl" />
      <span>Sign Out</span>
    </button>
  );
};

export default LogoutButton;
