import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import toast from "react-hot-toast";

const TOKEN_DURATION = 12 * 60 * 60 * 1000; // 12 saat

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const lastLogin = localStorage.getItem("lastLogin");

      if (firebaseUser && lastLogin) {
        const now = Date.now();
        const diff = now - parseInt(lastLogin, 10);

        if (diff < TOKEN_DURATION) {
          setUser(firebaseUser);
        } else {
          signOut(auth);
          localStorage.removeItem("lastLogin");
          toast.error("Session expired. Please login again.");
        }
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  if (checking) return null;

  return user ? children : <Navigate to="/zero-waste/panel/login" />;
};

export default ProtectedRoute;