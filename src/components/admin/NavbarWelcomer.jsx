import { useSelector } from "react-redux";

const NavbarWelcomer = () => {
  const adminInfo = useSelector((state) => state.user.adminInfo);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (!adminInfo) return null;

  const { firstname, lastname } = adminInfo;
  const initials = firstname?.[0]?.toUpperCase() || "?";

    
  return (
    <div className="flex items-center gap-4">
      <div className="text-sm md:text-base font-medium text-gray-700">
        {getGreeting()}, <span className="font-semibold capitalize">{firstname}</span> 👋
      </div>

      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold shadow-sm text-sm md:text-base">
        {initials}
      </div>
    </div>
  );
};

export default NavbarWelcomer;