import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-white">
      <div className="mx-auto flex h-screen max-w-[1700px] gap-4 p-4 lg:gap-6 lg:p-6">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-hidden rounded-[30px] border border-white/8 bg-app-grid shadow-halo">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
