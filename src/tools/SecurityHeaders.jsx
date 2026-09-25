import * as React from 'react';
import { apiGet } from '../api.js';

export default function SecurityHeaders() {
  const [url, setUrl] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const grade = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await apiGet('/api/security-headers', { url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="Security header grader">
      <h2>Security Header Grader</h2>
      <form onSubmit={grade} className="tool-form">
        <input
          className="tool-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          aria-label="URL"
          autoFocus
        />
        <button className="tool-button" disabled={loading || !url.trim()}>
          {loading ? 'Grading…' : 'Grade'}
        </button>
      </form>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <div className="results">
          <p className="grade-line">
            <span className={`grade-badge grade-${result.grade}`}>{result.grade}</span>
            <span>{result.score}/100 — {result.url}</span>
          </p>
          <table className="results-table">
            <thead>
              <tr>
                <th scope="col">Header</th>
                <th scope="col">Status</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {result.findings.map((f) => (
                <tr key={f.header}>
                  <th scope="row">{f.header}</th>
                  <td className={f.state === 'pass' ? 'state-open' : f.state === 'warn' ? 'warn' : 'state-closed'}>
                    {f.state === 'pass' ? '✓ good' : f.state === 'warn' ? '△ weak' : '✗ missing'} ({f.points}/{f.maxPoints})
                  </td>
                  <td>
                    {f.present ? f.value : f.fix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
