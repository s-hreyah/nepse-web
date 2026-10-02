import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const API = "http://localhost:8000";
const RANGES = { "3M": 63, "6M": 126, "1Y": 400 };

const fmt = (n, d = 2) =>
  n == null
    ? "-"
    : Number(n).toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });

const tip = {
  background: "var(--card)",
  border: "1px solid var(--line)",
  color: "var(--text)",
};

export default function Stock() {
  const { symbol } = useParams();
  const [data, setData] = useState(null);
  const [range, setRange] = useState("6M");
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    fetch(`${API}/stocks/${symbol}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Could not load this stock."));
  }, [symbol]);

    const [watched, setWatched] = useState(false);

  useEffect(() => {
    fetch(`${API}/watchlist`)
      .then((r) => r.json())
      .then((d) => setWatched(d.items.some((i) => i.symbol === symbol.toUpperCase())))
      .catch(() => {});
  }, [symbol]);

  const toggleWatch = () => {
    fetch(`${API}/watchlist/${symbol}`, { method: watched ? "DELETE" : "POST" })
      .then((r) => { if (r.ok) setWatched(!watched); });
  };
  if (error) {
    return (
      <div className="page">
        <Link to="/" className="back">
          ← Market
        </Link>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <p className="sub">Loading...</p>
      </div>
    );
  }

  const pts = data.points.slice(-RANGES[range]);
  const last = data.points[data.points.length - 1];
  const prices = pts.map((p) => p.adj_close).filter((v) => v != null);
  const change = last.return_pct;

  return (
    <div className="page">
      <Link to="/" className="back">
        ← Market
      </Link>
      <h1>{data.symbol}</h1>
      <button className={watched ? "btn on" : "btn"} onClick={toggleWatch}>
        {watched ? "★ Watching" : "☆ Watch"}
      </button>
      <p className="sub">
        {data.company?.name} · {data.company?.sector} · last trade {last.trade_date}
      </p>

      <div className="stat-grid">
        <div className="card">
          <div className="sub">Last close</div>
          <h2>{fmt(last.close)}</h2>
        </div>
        <div className="card">
          <div className="sub">Daily change</div>
          <h2 className={change > 0 ? "up" : change < 0 ? "down" : ""}>
            {change == null ? "-" : `${change > 0 ? "+" : ""}${fmt(change)}%`}
          </h2>
        </div>
        <div className="card">
          <div className="sub">High ({range})</div>
          <h2>{fmt(Math.max(...prices))}</h2>
        </div>
        <div className="card">
          <div className="sub">Low ({range})</div>
          <h2>{fmt(Math.min(...prices))}</h2>
        </div>
      </div>

      <div className="btns">
        {Object.keys(RANGES).map((r) => (
          <button
            key={r}
            className={r === range ? "btn on" : "btn"}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="card">
        <h2>Adjusted price and moving averages</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={pts}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis
                dataKey="trade_date"
                tickFormatter={(d) => d.slice(5)}
                minTickGap={30}
                stroke="var(--muted)"
              />
              <YAxis domain={["auto", "auto"]} stroke="var(--muted)" width={55} />
              <Tooltip contentStyle={tip} />
              <Legend />
              <Line
                type="monotone"
                dataKey="adj_close"
                name="Price"
                stroke="var(--accent)"
                dot={false}
                strokeWidth={2}
              />
              <Line type="monotone" dataKey="ma20" name="20-day avg" stroke="#f59e0b" dot={false} />
              <Line type="monotone" dataKey="ma50" name="50-day avg" stroke="#10b981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Volume</h2>
        <div style={{ height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={pts}>
              <XAxis
                dataKey="trade_date"
                tickFormatter={(d) => d.slice(5)}
                minTickGap={30}
                stroke="var(--muted)"
              />
              <YAxis
                stroke="var(--muted)"
                width={55}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="volume" name="Volume" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="note">
        Prices are adjusted for bonus shares. Averages count this stock's trading days.
        Education only, not financial advice.
      </p>
    </div>
  );
}