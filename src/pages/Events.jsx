import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:8000";
const fmt = (n, d = 2) =>
  n == null ? "-" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function Events() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    fetch(`${API}/events/upcoming?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Could not load events."));
  }, [days]);

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!data) return <div className="page"><p className="sub">Loading...</p></div>;

  return (
    <div className="page">
      <Link to="/" className="back">← Market</Link>
      <h1>Upcoming dividends and book closures</h1>
      <p className="sub">
        From {data.from}. On the book close date the price drops mechanically: the bonus divides
        the price, and the cash dividend comes off it. That is not a market move.
      </p>
      <div className="btns">
        {[14, 30, 60].map((d) => (
          <button key={d} className={d === days ? "btn on" : "btn"} onClick={() => setDays(d)}>
            {d} days
          </button>
        ))}
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book close</th><th>Symbol</th><th>Sector</th>
              <th>Cash %</th><th>Bonus %</th><th>Bonus effect</th><th>AGM</th>
            </tr>
          </thead>
          <tbody>
            {data.events.map((e, i) => (
              <tr key={`${e.symbol}-${e.book_close}-${i}`}>
                <td>{e.book_close}</td>
                <td title={e.name}><Link to={`/stock/${e.symbol}`}>{e.symbol}</Link></td>
                <td>{e.sector || "-"}</td>
                <td>{fmt(e.cash_pct)}</td>
                <td>{fmt(e.bonus_pct)}</td>
                <td className={e.bonus_price_effect_pct < 0 ? "down" : ""}>
                  {e.bonus_price_effect_pct ? `${fmt(e.bonus_price_effect_pct)}%` : "-"}
                </td>
                <td>{e.agm_date || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.events.length === 0 && <p className="sub">Nothing announced in this window.</p>}
      </div>
      <p className="note">
        Announcements come from NEPSE company notices. Education only, not financial advice.
      </p>
    </div>
  );
}