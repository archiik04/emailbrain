import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import DraftsPage from "./pages/Drafts";
import FollowupsPage from "./pages/Followups";
import InboxPage from "./pages/Inbox";
import SearchPage from "./pages/Search";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate replace to="/inbox" />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/followups" element={<FollowupsPage />} />
        <Route path="/drafts" element={<DraftsPage />} />
      </Route>
    </Routes>
  );
}
