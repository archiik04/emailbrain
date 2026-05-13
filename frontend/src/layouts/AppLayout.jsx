import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex h-screen max-w-[1700px] gap-6 p-5 lg:gap-7 lg:p-7">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-hidden rounded-[36px] border border-[#2B2B2B]/10 bg-app-grid shadow-[0_28px_80px_rgba(92,73,50,0.1),inset_0_1px_0_rgba(255,255,255,0.75)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
