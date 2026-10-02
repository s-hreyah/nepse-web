import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:8000";

export default function Evidence() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/forecast/evidence`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("API not reachable."));
  }, []);

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

  const groups = {};
  data.results.forEach((r) => {
    if (!groups[r.question]) groups[r.question] = [];
    groups[r.question].push(r);
  });

  return (
    <div className="page">
      <Link to="/" className="back">
        ← Market
      </Link>
      <h1>Why this forecast?</h1>
      <p className="sub">
        We tested whether NEPSE prices can be forecast. Here is what we tried and what we found.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>The short version</h2>
        <p>
          We could not predict whether a stock goes up or down tomorrow. Three different
          methods did no better than a constant guess.
        </p>
        <p>
          We could estimate how big tomorrow's move is likely to be. That is the range shown on
          each stock page. It is a rough guide, and real moves still fall outside it about one
          time in five.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>How we tested</h2>
        <p className="sub">{data.setup}</p>
      </div>

      {Object.keys(groups).map((q) => (
        <div className="card table-wrap ev" key={q} style={{ marginBottom: 16 }}>
          <h2>{q}</h2>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Result</th>
                <th>Compared with</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {groups[q].map((r) => (
                <tr key={r.method}>
                  <td>{r.method}</td>
                  <td>{r.result}</td>
                  <td>{r.benchmark}</td>
                  <td>{r.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <p className="note">
        One year of data is a short sample, and results could change with more history.
        Education only, not financial advice.
      </p>
    </div>
  );
}