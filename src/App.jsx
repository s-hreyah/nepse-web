import { Routes, Route } from "react-router-dom";
import Market from "./pages/Market";
import Stock from "./pages/Stock";
import Sectors from "./pages/Sectors";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Market />} />
      <Route path="/stock/:symbol" element={<Stock />} />
      <Route path="/sectors" element={<Sectors />} />
    </Routes>
  );
}