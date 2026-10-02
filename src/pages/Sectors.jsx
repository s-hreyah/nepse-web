import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from "recharts";

const API = "http://localhost:8000";
const fmt = (n, d = 2) =>
  n == null ? "-" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const tip = { background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" };

// green for gains, red for losses; a move of 2% or more is the strongest shade
const tint = (p) => {
  if (p == null) return "transparent";
  const a = Math.min(Math.abs(p) / 2, 1) * 0.55 + 0.08;
  return p >= 0 ? `rgba(16,185,129,${a})` : `rgba(239,68,68,${a})`;
};

const pct = (p) => (p == null ? "-" : `${p > 0 ? "+" : ""}${fmt(p)}%`);
const cls = (p) => (p > 0 ? "up" : p < 0 ? "down" : "");

export default function Sectors() {
  const [list, setList] = useState(null);
  const [hist, setHist] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/indices`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`${API}/indices/58/history?days=126`).then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([a, b]) => { setList(a); setHist(b); })
      .catch(() => setError("Could not load indices."));
  }, []);

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!list || !hist) return <div className="page"><p className="sub">Loading...</p></div>;

  const broad = list.indices.filter((i) => i.group === "broad");
  const sectors = list.indices
    .filter((i) => i.group === "sector")
    .sort((a, b) => b.pct_change - a.pct_change);

  return (
    <div className="page">
          <Link to="/" className="back">← Market</Link>
      <h1>Indices and sectors</h1>
      <p className="sub">Close of {list.date}</p>

      <div className="stat-grid">
        {broad.map((i) => (
          <div className="card" key={i.index_id}>
            <div className="sub">{i.name}</div>
            <h2>{fmt(i.close)}</h2>
            <div className={cls(i.pct_change)}>{pct(i.pct_change)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>NEPSE Index, last 6 months</h2>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={hist.points}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="trade_date" tickFormatter={(d) => d.slice(5)} minTickGap={30} stroke="var(--muted)" />
              <YAxis domain={["auto", "auto"]} stroke="var(--muted)" width={55} />
              <Tooltip contentStyle={tip} />
              <Legend />
              <Line type="monotone" dataKey="close" name="NEPSE" stroke="var(--accent)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="ma20" name="20-day avg" stroke="#f59e0b" dot={false} />
              <Line type="monotone" dataKey="ma50" name="50-day avg" stroke="#10b981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Sector heatmap</h2>
      <div className="heatmap">
        {sectors.map((s) => (
          <div className="tile" key={s.index_id} style={{ background: tint(s.pct_change) }}>
            <div className="tile-name">{s.name}</div>
            <div className="tile-pct">{pct(s.pct_change)}</div>
            <div className="sub">{fmt(s.close)}</div>
          </div>
        ))}
      </div>

      <p className="note">Daily change of each sector index. Education only, not financial advice.</p>
    </div>
  );
}