import * as React from 'react';
import DnsLookup from './tools/DnsLookup.jsx';
import IpInfo from './tools/IpInfo.jsx';
import SubnetCalculator from './tools/SubnetCalculator.jsx';
import HeaderInspector from './tools/HeaderInspector.jsx';
import PortChecker from './tools/PortChecker.jsx';

const TABS = [
  { id: 'dns', label: 'DNS Lookup', component: DnsLookup },
  { id: 'ip', label: 'IP Info', component: IpInfo },
  { id: 'subnet', label: 'Subnet Calculator', component: SubnetCalculator },
  { id: 'headers', label: 'HTTP Headers', component: HeaderInspector },
  { id: 'ports', label: 'Port Checker', component: PortChecker },
];

export default function App() {
  const [tab, setTab] = React.useState('dns');
  const Active = TABS.find((t) => t.id === tab).component;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Network Tools</h1>
        <p className="tagline">DNS · IP info · subnets · HTTP headers</p>
      </header>
      <nav className="tabs" role="tablist" aria-label="Tools">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="panel">
        <Active />
      </main>
      <footer className="app-footer">
        Runs locally — your queries go from your machine to the target only.
      </footer>
    </div>
  );
}
