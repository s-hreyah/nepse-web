import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:8000";
const fmt = (n, d = 2) =>
  n == null ? "-" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n) => (n == null ? "-" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`);
const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "");

export default function Watchlist() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    fetch(`${API}/watchlist`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Could not load the watchlist."));

  useEffect(() => { load(); }, []);

  const remove = (s) =>
    fetch(`${API}/watchlist/${s}`, { method: "DELETE" }).then(load);

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!data) return <div className="page"><p className="sub">Loading...</p></div>;

  return (
    <div className="page">
      <Link to="/" className="back">← Market</Link>
      <h1>Watchlist</h1>
      <p className="sub">Close of {data.date}</p>

      {data.items.length === 0 ? (
        <div className="card">
          Nothing here yet. Open a stock and press "Watch".
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th><th>Sector</th><th>Close</th><th>Change</th><th>Turnover (Rs M)</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.symbol}>
                  <td title={s.name}><Link to={`/stock/${s.symbol}`}>{s.symbol}</Link></td>
                  <td>{s.sector || "-"}</td>
                  <td>{fmt(s.close)}</td>
                  <td className={cls(s.pct_change)}>{pct(s.pct_change)}</td>
                  <td>{fmt(s.turnover / 1e6, 1)}</td>
                  <td><button className="btn" onClick={() => remove(s.symbol)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="note">Education only, not financial advice.</p>
    </div>
  );
}