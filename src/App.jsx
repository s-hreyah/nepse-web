import { Routes, Route } from "react-router-dom";
import Market from "./pages/Market";
import Stock from "./pages/Stock";
import Sectors from "./pages/Sectors";
import Watchlist from "./pages/Watchlist";
import Learn from "./pages/Learn";
import Evidence from "./pages/Evidence";
import Events from "./pages/Events";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Market />} />
      <Route path="/stock/:symbol" element={<Stock />} />
      <Route path="/sectors" element={<Sectors />} />
      <Route path="/watchlist" element={<Watchlist />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/evidence" element={<Evidence />} />
      <Route path="/events" element={<Events />} />
    </Routes>
  );
}