import { Route, Routes } from "react-router-dom";
import Home from "./page/user/Home";
import Dashboard from "./page/admin/Dashboard";
import Participants from "./page/admin/Participants";
import { Toaster } from "react-hot-toast";
import KVKK from "./page/user/KVKK";
import Login from "./page/user/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import Partnerships from "./page/admin/Partnerships";

const App = () => {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        <Route index element={<Home />} />
        <Route path="/zero-waste-kvkk" element={<KVKK />} />
        <Route path="*" element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/zero-waste/panel/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route path="participants" element={<Participants />} />
          <Route path="partnership" element={<Partnerships />} />
          <Route path="*" element={<Partnerships />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;