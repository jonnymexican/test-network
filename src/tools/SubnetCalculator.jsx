import * as React from 'react';
import { apiGet } from '../api.js';

export default function SubnetCalculator() {
  const [cidr, setCidr] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const calculate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      setResult(await apiGet('/api/netcalc', { cidr }));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  };

  const rows = result
    ? [
        ['Network address', result.network],
        ['Prefix', `/${result.prefix}`],
        ['Netmask', result.netmask],
        ['Wildcard mask', result.wildcardMask],
        ['Broadcast', result.broadcast],
        ['Host range', result.ipRange],
        ['Total addresses', result.totalAddresses.toLocaleString()],
        ['Usable hosts', result.usableHosts.toLocaleString()],
        ['Type', result.type + (result.isNetworkAddress ? '' : ' (host address)')],
        ['IP binary', result.binary.ip],
        ['Mask binary', result.binary.netmask],
      ]
    : [];

  return (
    <section aria-label="Subnet calculator">
      <h2>Subnet Calculator</h2>
      <form onSubmit={calculate} className="tool-form">
        <input
          className="tool-input"
          value={cidr}
          onChange={(e) => setCidr(e.target.value)}
          placeholder="192.168.1.0/24"
          aria-label="CIDR"
          autoFocus
        />
        <button className="tool-button" disabled={!cidr.trim()}>
          Calculate
        </button>
      </form>
      {error && <p className="tool-error" role="alert">{error}</p>}
      {result && (
        <table className="results-table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td className={label.includes('binary') ? 'mono' : ''}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
