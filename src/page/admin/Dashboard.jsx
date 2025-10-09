import { Outlet, NavLink } from "react-router-dom";
import { FaStar, FaUsers } from "react-icons/fa";
import LogoutButton from "../../components/admin/LogoutButton";
import { FaHandshake } from "react-icons/fa";
import NavbarWelcomer from "../../components/admin/NavbarWelcomer";

const DashboardLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="h-14 bg-white flex items-center py-8 justify-between px-6 border-b border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          <h1 className="text-xl font-semibold text-gray-900">
            Global Zero Waste Forum | Panel
          </h1>
        </div>
        <NavbarWelcomer />
      </header>

      <div className="flex flex-1">
        <nav className="w-56 bg-white border-r border-gray-100 p-4 shadow-sm">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/dashboard/participants"
                className={({ isActive }) =>
                  `flex items-center space-x-3 text-base font-medium rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-500"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <FaUsers className="text-xl" />
                <span>Participants</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/partnership"
                className={({ isActive }) =>
                  `flex items-center space-x-3 text-base font-medium rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-500"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <FaHandshake className="text-xl" />
                <span>Partnerships</span>
              </NavLink>
            </li>
                        <li>
              <NavLink
                to="/dashboard/special-partnership"
                className={({ isActive }) =>
                  `flex items-center space-x-3 text-base font-medium rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-500"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <FaStar className="text-xl" />
                <span>Special Invitee</span>
              </NavLink>
            </li>
          </ul>
          <LogoutButton />
        </nav>

        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
