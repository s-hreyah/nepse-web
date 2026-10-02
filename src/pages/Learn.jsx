import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:8000";

const verdict = (s) => {
  if (!s || !s.times) return "Not seen in our data.";
  if (s.times < 100) return "Too few cases to say anything.";
  return "No reliable effect on our data. Many stocks move on the same days, so treat any difference as a lead, not a signal.";
};

export default function Learn() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API}/patterns/lessons`).then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (data && window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, [data]);

  if (!data) return <div className="page"><p className="sub">Loading...</p></div>;
  const b = data.base;

  return (
    <div className="page">
      <Link to="/" className="back">← Market</Link>
      <h1>Candlestick lessons</h1>
      <p className="sub">
        Each card gives the theory, then tests it on NEPSE data (30 liquid stocks, one year).
        {b && ` On an average day the next day was up ${b.up}%, flat ${b.flat}%, down ${b.down}%.`}
      </p>
      {data.lessons.map((l) => (
        <div className="card" id={l.key} key={l.key} style={{ marginBottom: 16 }}>
          <h2>{l.title}</h2>
          <p><b>Rule we used:</b> {l.rule}</p>
          <p><b>Theory:</b> {l.theory}</p>
          <p><b>When it counts:</b> {l.conditions}</p>
          <p>
            <b>Our data:</b>{" "}
            {l.stats && l.stats.times
              ? `seen ${l.stats.times} times. Next day: up ${l.stats.up}%, flat ${l.stats.flat}%, down ${l.stats.down}%.`
              : "no cases."}
          </p>
          <p className="sub">Verdict: {verdict(l.stats)}</p>
        </div>
      ))}
      <p className="note">Education only, not financial advice.</p>
    </div>
  );
}