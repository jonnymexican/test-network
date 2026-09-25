import net from 'node:net';

export const COMMON_PORTS = [
  { port: 21, label: 'FTP' },
  { port: 22, label: 'SSH' },
  { port: 23, label: 'Telnet' },
  { port: 25, label: 'SMTP' },
  { port: 53, label: 'DNS' },
  { port: 80, label: 'HTTP' },
  { port: 110, label: 'POP3' },
  { port: 143, label: 'IMAP' },
  { port: 443, label: 'HTTPS' },
  { port: 445, label: 'SMB' },
  { port: 3306, label: 'MySQL' },
  { port: 3389, label: 'RDP' },
  { port: 5432, label: 'PostgreSQL' },
  { port: 6379, label: 'Redis' },
  { port: 8080, label: 'HTTP alt' },
  { port: 8443, label: 'HTTPS alt' },
];

export function validateHost(host) {
  const cleaned = String(host || '').trim().toLowerCase();
  if (!cleaned) return { error: 'Enter a hostname or IP address.' };
  if (net.isIP(cleaned)) return { host: cleaned };
  if (
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned) &&
    cleaned.length <= 253
  ) {
    return { host: cleaned };
  }
  return { error: 'That does not look like a valid hostname or IP.' };
}

export function parsePorts(raw) {
  const input = String(raw || '').trim();
  if (!input) {
    return { ports: COMMON_PORTS.map((p) => p.port), usedPreset: true };
  }
  const ports = new Set();
  for (const part of input.split(',')) {
    const chunk = part.trim();
    if (!chunk) continue;
    const rangeMatch = chunk.match(/^(\d{1,5})-(\d{1,5})$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start < 1 || end > 65535 || start > end) {
        return { error: `Invalid port range: ${chunk}` };
      }
      if (end - start + 1 > 256) {
        return { error: 'Max 256 ports per scan (keep ranges small).' };
      }
      for (let p = start; p <= end; p++) ports.add(p);
    } else if (/^\d{1,5}$/.test(chunk)) {
      const p = Number(chunk);
      if (p < 1 || p > 65535) return { error: `Invalid port: ${chunk}` };
      ports.add(p);
    } else {
      return { error: `Could not parse "${chunk}" — use ports like 443 or ranges like 8000-8010.` };
    }
  }
  if (ports.size === 0) return { error: 'No ports to check.' };
  return { ports: [...ports].sort((a, b) => a - b), usedPreset: false };
}
