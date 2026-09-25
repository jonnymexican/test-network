import * as React from 'react';
import { apiGet } from '../api.js';

export default function IpInfo() {
  const [ip, setIp] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const lookup = async (event, value = ip) => {
    if (event) event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await apiGet('/api/ip-info', { ip: value }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    lookup(null, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = result
    ? [
        ['IP', result.ip],
        ['Version', result.version],
        ['City', result.city],
        ['Region', result.region],
        ['Country', result.country],
        ['Postal', result.postal],
        ['Coordinates', result.latitude != null ? `${result.latitude}, ${result.longitude}` : null],
        ['Timezone', result.timezone],
        ['Organization', result.org],
        ['ASN', result.asn],
      ].filter(([, v]) => v)
    : [];

  return (
    <section aria-label="IP info">
      <h2>IP Info</h2>
      <form onSubmit={lookup} className="tool-form">
        <input
          className="tool-input"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="Leave empty for your own IP — or enter e.g. 8.8.8.8"
          aria-label="IP address"
        />
        <button className="tool-button" disabled={loading}>
          {loading ? 'Looking up…' : 'Look up'}
        </button>
      </form>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <table className="results-table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
