import * as React from 'react';
import { apiGet } from '../api.js';

const TYPES = ['A', 'AAAA', 'TXT', 'NS'];

export default function DnsPropagation() {
  const [domain, setDomain] = React.useState('');
  const [type, setType] = React.useState('A');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const check = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await apiGet('/api/propagation', { domain, type }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="DNS propagation checker">
      <h2>DNS Propagation</h2>
      <form onSubmit={check} className="tool-form">
        <input
          className="tool-input"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          aria-label="Domain"
          autoFocus
        />
        <select className="tool-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Record type">
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="tool-button" disabled={loading || !domain.trim()}>
          {loading ? 'Querying…' : 'Check'}
        </button>
      </form>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <div className="results">
          <p className="status-line">
            {result.consistent ? (
              <span className="status-code ok">✓ All resolvers agree</span>
            ) : (
              <span className="status-code bad">✗ {result.resolversAgree}</span>
            )}
          </p>
          <table className="results-table">
            <thead>
              <tr>
                <th scope="col">Resolver</th>
                <th scope="col">Answer</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r) => (
                <tr key={r.resolver}>
                  <th scope="row">{r.resolver}</th>
                  <td className="mono">
                    {r.ok ? r.records.join(', ') : <span className="tool-error">no answer ({r.code})</span>}
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
