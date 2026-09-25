import * as React from 'react';
import { apiGet } from '../api.js';

export default function TlsInspector() {
  const [host, setHost] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const inspect = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await apiGet('/api/tls-info', { host }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rows = result
    ? [
        ['Common name', result.subject?.commonName],
        ['Organization', result.subject?.organization],
        ['Issuer', `${result.issuer?.commonName ?? '?'} (${result.issuer?.organization ?? '?'})`],
        ['Valid from', new Date(result.validFrom).toLocaleString()],
        ['Valid until', new Date(result.validTo).toLocaleString()],
        ['Days remaining', result.daysRemaining],
        ['Protocol', result.protocol],
        ['Cipher', result.cipher],
        ['Trusted chain', result.authorized ? 'yes' : `no — ${result.authorizationError}`],
        ['Serial', result.serialNumber],
        ['SHA-256', result.fingerprint256],
      ].filter(([, v]) => v != null)
    : [];

  return (
    <section aria-label="TLS certificate inspector">
      <h2>TLS Certificate Inspector</h2>
      <form onSubmit={inspect} className="tool-form">
        <input
          className="tool-input"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="example.com"
          aria-label="Host"
          autoFocus
        />
        <button className="tool-button" disabled={loading || !host.trim()}>
          {loading ? 'Inspecting…' : 'Inspect'}
        </button>
      </form>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <div className="results">
          {result.expired ? (
            <p className="status-line"><span className="status-code bad">EXPIRED</span></p>
          ) : result.daysRemaining <= 14 ? (
            <p className="status-line"><span className="status-code bad">Expires in {result.daysRemaining} days!</span></p>
          ) : (
            <p className="status-line"><span className="status-code ok">Valid</span> — {result.daysRemaining} days remaining</p>
          )}
          <table className="results-table">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td className={label === 'SHA-256' || label === 'Serial' ? 'mono' : ''}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.subjectAltNames.length > 0 && (
            <div className="record-group">
              <h3>Subject alternative names ({result.subjectAltNames.length})</h3>
              <ul>
                {result.subjectAltNames.map((san) => (
                  <li key={san} className="record">{san}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
