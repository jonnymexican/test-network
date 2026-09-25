import * as React from 'react';
import { apiGet } from '../api.js';

const TYPES = ['ALL', 'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV'];

export default function DnsLookup() {
  const [domain, setDomain] = React.useState('');
  const [type, setType] = React.useState('ALL');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const lookup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await apiGet('/api/dns', { domain, type }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="DNS lookup">
      <h2>DNS Lookup</h2>
      <form onSubmit={lookup} className="tool-form">
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
          {loading ? 'Looking up…' : 'Look up'}
        </button>
      </form>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <div className="results">
          {Object.keys(result.records).length === 0 ? (
            <p className="tool-empty">No records found for {result.domain}.</p>
          ) : (
            Object.entries(result.records).map(([type, values]) => (
              <div key={type} className="record-group">
                <h3>{type}</h3>
                <ul>
                  {values.map((v, i) => (
                    <li key={i} className="record">{v}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
