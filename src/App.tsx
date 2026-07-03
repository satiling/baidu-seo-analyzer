import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Report from "@/pages/Report";
import Algorithms from "@/pages/Algorithms";
import AiDetect from "@/pages/AiDetect";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/ai-detect" element={<AiDetect />} />
            <Route path="/algorithms" element={<Algorithms />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
