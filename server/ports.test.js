import { describe, it, expect } from 'vitest';
import { validateHost, parsePorts } from './ports.js';

describe('validateHost', () => {
  it('accepts hostnames and IPs', () => {
    expect(validateHost('github.com')).toEqual({ host: 'github.com' });
    expect(validateHost('8.8.8.8')).toEqual({ host: '8.8.8.8' });
  });

  it('rejects garbage', () => {
    expect(validateHost('').error).toBeTruthy();
    expect(validateHost('not a host!').error).toBeTruthy();
    expect(validateHost('http://example.com').error).toBeTruthy();
  });
});

describe('parsePorts', () => {
  it('returns the common-ports preset when empty', () => {
    const r = parsePorts('');
    expect(r.usedPreset).toBe(true);
    expect(r.ports).toContain(22);
    expect(r.ports).toContain(443);
  });

  it('parses single ports and sorts them', () => {
    expect(parsePorts('443, 80, 22').ports).toEqual([22, 80, 443]);
  });

  it('expands ranges and dedupes', () => {
    const r = parsePorts('8000-8003,8002');
    expect(r.ports).toEqual([8000, 8001, 8002, 8003]);
  });

  it('rejects invalid ports and oversized ranges', () => {
    expect(parsePorts('0').error).toBeTruthy();
    expect(parsePorts('99999').error).toBeTruthy();
    expect(parsePorts('1-65535').error).toBeTruthy();
    expect(parsePorts('abc').error).toBeTruthy();
  });
});
