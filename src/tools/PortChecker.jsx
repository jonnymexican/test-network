import * as React from 'react';
import { apiGet } from '../api.js';

export default function PortChecker() {
  const [host, setHost] = React.useState('');
  const [ports, setPorts] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const scan = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await apiGet('/api/port-check', { host, ports }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="TCP port checker">
      <h2>TCP Port Checker</h2>
      <form onSubmit={scan} className="tool-form">
        <input
          className="tool-input"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="hostname or IP — e.g. github.com"
          aria-label="Host"
          autoFocus
        />
        <input
          className="tool-input"
          style={{ maxWidth: '14rem' }}
          value={ports}
          onChange={(e) => setPorts(e.target.value)}
          placeholder="Ports (blank = common 16)"
          aria-label="Ports"
        />
        <button className="tool-button" disabled={loading || !host.trim()}>
          {loading ? 'Scanning…' : 'Scan'}
        </button>
      </form>
      <p className="hint">
        Comma-separated ports or ranges, e.g. <code>80, 443, 8000-8010</code>. Scans are capped at 256 ports.
      </p>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <div className="results">
          <p className="status-line">
            {result.host} ({result.resolvedIp}) —{' '}
            <strong className={result.openCount > 0 ? 'status-code ok' : ''}>{result.openCount}</strong> of{' '}
            {result.totalScanned} ports open
          </p>
          <table className="results-table">
            <thead>
              <tr>
                <th scope="col">Port</th>
                <th scope="col">Service</th>
                <th scope="col">State</th>
                <th scope="col">Connect time</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r) => (
                <tr key={r.port}>
                  <td className="mono">{r.port}</td>
                  <td>{r.service || '—'}</td>
                  <td className={r.open ? 'state-open' : 'state-closed'}>
                    {r.state === 'open' ? '● open' : '○ closed/filtered'}
                  </td>
                  <td className="mono">{r.responseMs != null ? `${r.responseMs} ms` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
