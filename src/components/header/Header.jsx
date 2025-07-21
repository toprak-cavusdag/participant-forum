import Overlay from "../common/Overlay";

const Header = () => {
  return (
    <header className="w-full overflow-hidden relative h-[50vh] flex justify-center items-center">
      <Overlay />
      <img
        src="/header.jpg"
        className="absolute-center z-0 w-full h-full object-cover"
        alt=""
      />
      <div className="absolute-center w-full z-20">
        <div className="flex justify-center gap-3 flex-col items-center">
        <img src="/zwfforum_logo.svg" className="w-64 mb-5 h-auto object-contain" alt="" />
        </div>
        <h2 className="text-lg text-center font-light text-white/85 mb-8">Organized by the Zero Waste Foundation</h2>
      </div>
    </header>
  );
};

export default Header;
