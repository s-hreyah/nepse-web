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

const Candle = ({ x, y, width, height, payload }) => {
  const { adj_open: o, adj_close: c, adj_high: h, adj_low: l } = payload;
  if ([o, c, h, l].some((v) => v == null)) return null;
  const color = c >= o ? "#10b981" : "#ef4444";
  const range = h - l;
  const px = (v) => (range === 0 ? y : y + ((h - v) / range) * height);
  const top = px(Math.max(o, c));
  const bottom = px(Math.min(o, c));
  const cx = x + width / 2;
  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} />
      <rect x={x + width * 0.15} y={top} width={width * 0.7}
            height={Math.max(bottom - top, 1)} fill={color} />
      {payload.mark && <circle cx={cx} cy={y - 7} r={4} fill="var(--accent)" />}
    </g>
  );
};

const CandleTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ ...tip, padding: 8, fontSize: 13 }}>
      <div>{p.trade_date}</div>
      <div>Open {fmt(p.adj_open)} · High {fmt(p.adj_high)}</div>
      <div>Low {fmt(p.adj_low)} · Close {fmt(p.adj_close)}</div>
      {p.mark && <div>Pattern: {p.mark.join(", ").replaceAll("_", " ")}</div>}
    </div>
  );
};

export default function Stock() {
  const { symbol } = useParams();
  const [data, setData] = useState(null);
  const [range, setRange] = useState("6M");
  const [view, setView] = useState("line");
  const [error, setError] = useState("");
  const [watched, setWatched] = useState(false);
  const [found, setFound] = useState([]);
  const [fc, setFc] = useState(null);

  useEffect(() => {
    setData(null);
    setError("");
    fetch(`${API}/stocks/${symbol}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Could not load this stock."));
  }, [symbol]);

  useEffect(() => {
    fetch(`${API}/watchlist`)
      .then((r) => r.json())
      .then((d) => setWatched(d.items.some((i) => i.symbol === symbol.toUpperCase())))
      .catch(() => {});
  }, [symbol]);

  useEffect(() => {
    fetch(`${API}/stocks/${symbol}/patterns`)
      .then((r) => r.json())
      .then((d) => setFound(d.found || []))
      .catch(() => {});
  }, [symbol]);

  useEffect(() => {
    setFc(null);
    fetch(`${API}/stocks/${symbol}/forecast`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setFc)
      .catch(() => setFc(null));
  }, [symbol]);

    const [range2, setRange2] = useState(null);

  useEffect(() => {
    fetch(`${API}/stocks/${symbol}/range`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setRange2)
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

  const marks = Object.fromEntries(found.map((f) => [f.trade_date, f.patterns]));
  const pts = data.points.slice(-RANGES[range]).map((p) => ({ ...p, mark: marks[p.trade_date] }));
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
            {fc && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Expected move tomorrow</h2>
          {fc.available ? (
            <>
              <p style={{ fontSize: 22, margin: "4px 0" }}>
                ±{fmt(fc.band_pct)}% · Rs {fmt(fc.low)} to Rs {fmt(fc.high)}
              </p>
              <p className="sub">
                Based on the {fc.avg_abs_move_20d_pct}% average daily move over the last 20
                trades. In testing, about {fc.tested_coverage_pct}% of real moves fell inside
                a band built this way.
              </p>
              {fc.thin && (
                <p className="sub">
                  This stock trades rarely, so the last 20 trades cover many weeks. Treat the
                  range as a rough guide.
                </p>
              )}
                            <p className="sub">
                This is the likely size of the move, not its direction. Direction was not
                predictable in our tests.
              </p>
              <p className="sub">
                <Link to="/evidence" style={{ textDecoration: "underline" }}>
                  Why this forecast? See the tests
                </Link>
              </p>
            </>
          ) : (
            <p className="sub">{fc.reason}</p>
            
          )}
        </div>
      )}

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

      <div className="btns">
        <button className={view === "line" ? "btn on" : "btn"} onClick={() => setView("line")}>Line</button>
        <button className={view === "candle" ? "btn on" : "btn"} onClick={() => setView("candle")}>Candles</button>
      </div>

      <div className="card">
        <h2>{view === "line" ? "Adjusted price and moving averages" : "Candlesticks (adjusted)"}</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            {view === "line" ? (
              <LineChart data={pts}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                <XAxis dataKey="trade_date" tickFormatter={(d) => d.slice(5)} minTickGap={30} stroke="var(--muted)" />
                <YAxis domain={["auto", "auto"]} stroke="var(--muted)" width={55} />
                <Tooltip contentStyle={tip} />
                <Legend />
                <Line type="monotone" dataKey="adj_close" name="Price" stroke="var(--accent)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="ma20" name="20-day avg" stroke="#f59e0b" dot={false} />
                <Line type="monotone" dataKey="ma50" name="50-day avg" stroke="#10b981" dot={false} />
              </LineChart>
            ) : (
              <BarChart data={pts}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                <XAxis dataKey="trade_date" tickFormatter={(d) => d.slice(5)} minTickGap={30} stroke="var(--muted)" />
                <YAxis domain={["auto", "auto"]} stroke="var(--muted)" width={55} />
                <Tooltip content={<CandleTip />} />
                <Bar dataKey={(p) => [p.adj_low, p.adj_high]} shape={<Candle />} isAnimationActive={false} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

            {found.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Patterns spotted</h2>
          {found.slice(-8).reverse().map((f) => (
            <div key={f.trade_date}>
              {f.trade_date}:{" "}
              {f.patterns.map((k) => (
                <Link key={k} to={`/learn#${k}`} style={{ marginRight: 8, textDecoration: "underline" }}>
                  {k.replaceAll("_", " ")}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
                {range2.event && (
            <p className="note" style={{ marginTop: 8 }}>
              Book close on {range2.event.book_close}: expect the price to drop by about{" "}
              {fmt(Math.abs(range2.event.expected_drop_pct), 1)}% that day from the bonus and
              cash dividend. That is a mechanical adjustment, not a market move, so the range
              above may look too high.
            </p>
          )}

      {range2?.available && (
        <div className="card table-wrap" style={{ marginTop: 16 }}>
          <h2>Likely range ahead</h2>
          <p className="sub">
            About 4 times in 5, the close landed inside these ranges in our tests. Average daily
            move lately: {fmt(range2.avg_daily_move_pct)}%.
          </p>
          <table>
            <thead>
              <tr>
                <th>In</th>
                <th>Low</th>
                <th>High</th>
                <th>±</th>
              </tr>
            </thead>
            <tbody>
              {range2.ranges.map((r) => (
                <tr key={r.days}>
                  <td>{r.days} trading days</td>
                  <td>{fmt(r.low)}</td>
                  <td>{fmt(r.high)}</td>
                  <td>{fmt(r.plus_minus_pct, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {range2.event && (
            <p className="note" style={{ marginTop: 8 }}>
              Book close on {range2.event.book_close}: expect the price to drop by about{" "}
              {fmt(Math.abs(range2.event.expected_drop_pct), 1)}% that day from the bonus and
              cash dividend. That is a mechanical adjustment, not a market move, so the range
              above may look too high.
            </p>
          )}
          <p className="note">
            This is a range, not a forecast of direction: we found no evidence that direction can
            be predicted. Education only, not financial advice.
          </p>
        </div>
      )}
     

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