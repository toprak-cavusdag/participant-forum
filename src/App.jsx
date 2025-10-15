import { Route, Routes } from "react-router-dom";
import Home from "./page/user/Home";
import Dashboard from "./page/admin/Dashboard";
import Participants from "./page/admin/Participants";
import { Toaster } from "react-hot-toast";
import Login from "./page/user/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import Partnerships from "./page/admin/Partnerships";
import KVKKTR from "./components/home/KVKKTR";
import GDPR from "./components/home/GDPR";
import SpecialPartners from "./page/admin/SpecialInvite";
import WebParticipant from "./page/admin/WebParticipant";
import PrivateSessions from "./page/admin/PrivateSessions";
import Academia from "./page/admin/Academia";
import Staff from "./page/admin/Staff";
import CSB from "./page/admin/CSB";
import Artists from "./page/admin/Artists";

const App = () => {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        <Route index element={<Home />} />
        <Route path="/zero-waste-kvkk" element={<KVKKTR />} />
        <Route path="/zero-waste-gdpr" element={<GDPR />} />
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
          <Route path="academics" element={<Academia />} />
          <Route path="partnership" element={<Partnerships />} />
          <Route path="web-registered" element={<WebParticipant />} />
          <Route path="special-partnership" element={<SpecialPartners />} />
          <Route path="private-sessions" element={<PrivateSessions />} />
          <Route path="mihmandarlar" element={<Staff />} />
          <Route path="artists" element={<Artists />} />
          <Route path="cevre" element={<CSB />} />
          <Route path="*" element={<Partnerships />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;