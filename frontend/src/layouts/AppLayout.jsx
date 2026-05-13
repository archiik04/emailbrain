import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-white">
      <div className="mx-auto flex h-screen max-w-[1680px] gap-5 p-4 lg:gap-7 lg:p-6">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-hidden rounded-[32px] border border-white/[0.08] bg-app-grid shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(0,0,0,0.42)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
