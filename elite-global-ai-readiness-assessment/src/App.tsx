import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { AdminDashboard } from "./pages/AdminDashboard";
import { AssessmentFlow } from "./pages/AssessmentFlow";
import { CompletionScreen } from "./pages/CompletionScreen";
import { EntryScreen } from "./pages/EntryScreen";
import { LandingPage } from "./pages/LandingPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/start" element={<EntryScreen />} />
        <Route path="/assessment/:step" element={<AssessmentFlow />} />
        <Route path="/complete" element={<CompletionScreen />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
