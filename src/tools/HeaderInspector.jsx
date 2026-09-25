import * as React from 'react';
import { apiGet } from '../api.js';

export default function HeaderInspector() {
  const [url, setUrl] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const inspect = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await apiGet('/api/headers', { url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="HTTP header inspector">
      <h2>HTTP Header Inspector</h2>
      <form onSubmit={inspect} className="tool-form">
        <input
          className="tool-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          aria-label="URL"
          autoFocus
        />
        <button className="tool-button" disabled={loading || !url.trim()}>
          {loading ? 'Fetching…' : 'Inspect'}
        </button>
      </form>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <div className="results">
          <p className="status-line">
            <span className={`status-code ${result.status < 400 ? 'ok' : 'bad'}`}>{result.status}</span>{' '}
            {result.statusText} — {result.responseTimeMs} ms
          </p>
          <table className="results-table">
            <tbody>
              {Object.entries(result.headers).map(([name, value]) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td className="mono">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
