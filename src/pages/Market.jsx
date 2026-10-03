import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:8000";

const fmt = (n, d = 2) =>
  n === null || n === undefined
    ? "-"
    : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const pct = (n) => (n === null || n === undefined ? "-" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`);
const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "");

function Panel({ title, items, mode }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {items.map((s) => (
        <div className="row" key={s.symbol}>
          <div>
            <div className="sym">
              <Link to={`/stock/${s.symbol}`}>{s.symbol}</Link>
            </div>
            <div className="name">{s.name}</div>
          </div>
          <div className="num">
            <div>{fmt(s.close)}</div>
            <div className={cls(s.pct_change)}>
              {mode === "turnover" ? `Rs ${fmt(s.turnover / 1e6, 1)}M` : pct(s.pct_change)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Market() {
  const [summary, setSummary] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/market/summary`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setError("Could not reach the API. Is uvicorn running on port 8000?"));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`${API}/stocks?q=${encodeURIComponent(q)}&limit=100`)
        .then((r) => r.json())
        .then((d) => setStocks(d.stocks))
        .catch(() => setError("Could not reach the API. Is uvicorn running on port 8000?"));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="page">
      <h1>NEPSE Monitor</h1>
      
      <p className="sub">
        {summary
          ? `Trading day ${summary.date} · ${summary.stocks_traded} company shares traded`
          : "Loading..."}
      </p>
      <Link to="/sectors" className="back">Indices and sectors →</Link>
      <Link to="/watchlist" className="back" style={{ marginLeft: 16 }}>Watchlist →</Link>
      <Link to="/learn" className="back" style={{ marginLeft: 16 }}>Learn candlesticks →</Link>
            <Link to="/events" className="back" style={{ marginLeft: 16 }}>Upcoming dividends →</Link>

      {error && <div className="error">{error}</div>}

      {summary && (
        <div className="grid">
          <Panel title="Top gainers" items={summary.gainers} mode="pct" />
          <Panel title="Top losers" items={summary.losers} mode="pct" />
          <Panel title="Most traded" items={summary.most_traded} mode="turnover" />
        </div>
      )}

      <input
        className="search"
        placeholder="Search by symbol or company name..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Close</th>
              <th>Change</th>
              <th>High</th>
              <th>Low</th>
              <th>Volume</th>
              <th>Turnover (Rs M)</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s.symbol}>
                <td title={s.name}>
                  <Link to={`/stock/${s.symbol}`}>{s.symbol}</Link>
                </td>
                <td>{fmt(s.close)}</td>
                <td className={cls(s.pct_change)}>{pct(s.pct_change)}</td>
                <td>{fmt(s.high)}</td>
                <td>{fmt(s.low)}</td>
                <td>{fmt(s.volume, 0)}</td>
                <td>{fmt(s.turnover / 1e6, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note">
        Data from NEPSE public endpoints via an unofficial library. For education only, not
        financial advice.
      </p>
    </div>
  );
}