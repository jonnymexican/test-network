import { describe, it, expect } from 'vitest';
import netcalc from './netcalc.js';

describe('netcalc', () => {
  it('computes a /24 network', () => {
    const r = netcalc('192.168.1.130/24');
    expect(r.network).toBe('192.168.1.0');
    expect(r.broadcast).toBe('192.168.1.255');
    expect(r.netmask).toBe('255.255.255.0');
    expect(r.wildcardMask).toBe('0.0.0.255');
    expect(r.firstHost).toBe('192.168.1.1');
    expect(r.lastHost).toBe('192.168.1.254');
    expect(r.usableHosts).toBe(254);
    expect(r.type).toBe('Private (RFC 1918)');
  });

  it('computes a /26 with a host address (not the network address)', () => {
    const r = netcalc('10.0.0.77/26');
    expect(r.network).toBe('10.0.0.64');
    expect(r.broadcast).toBe('10.0.0.127');
    expect(r.usableHosts).toBe(62);
    expect(r.isNetworkAddress).toBe(false);
  });

  it('handles a /8', () => {
    const r = netcalc('10.1.2.3/8');
    expect(r.network).toBe('10.0.0.0');
    expect(r.netmask).toBe('255.0.0.0');
    expect(r.usableHosts).toBe(16777214);
  });

  it('treats /32 as a single host route', () => {
    const r = netcalc('1.2.3.4/32');
    expect(r.network).toBe('1.2.3.4');
    expect(r.broadcast).toBe('1.2.3.4');
    expect(r.totalAddresses).toBe(1);
    expect(r.usableHosts).toBe(1);
    expect(r.type).toBe('Public');
  });

  it('classifies loopback, link-local and CGNAT ranges', () => {
    expect(netcalc('127.0.0.1/8').type).toBe('Loopback');
    expect(netcalc('169.254.10.5/24').type).toBe('Link-local');
    expect(netcalc('100.100.1.1/24').type).toBe('CGNAT (RFC 6598)');
    expect(netcalc('172.20.1.1/24').type).toBe('Private (RFC 1918)');
  });

  it('defaults the prefix to /24 when omitted', () => {
    expect(netcalc('8.8.8.8').prefix).toBe(24);
  });

  it('produces binary representations', () => {
    const r = netcalc('192.168.1.0/24');
    expect(r.binary.ip).toBe('11000000.10101000.00000001.00000000');
    expect(r.binary.netmask).toBe('11111111.11111111.11111111.00000000');
  });

  it('rejects invalid input', () => {
    expect(netcalc('nonsense').error).toBeTruthy();
    expect(netcalc('300.1.1.1/24').error).toBeTruthy();
    expect(netcalc('1.2.3.4/33').error).toBeTruthy();
    expect(netcalc('1.2.3/24').error).toBeTruthy();
  });
});
