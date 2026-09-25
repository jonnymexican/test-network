import net from 'node:net';

function ipToInt(ip) {
  return Buffer.from(ip.split('.').map(Number)).readUInt32BE(0);
}

function intToIp(int) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(int >>> 0, 0);
  return Array.from(buf).join('.');
}

function maskFromPrefix(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export default function netcalc(input) {
  const cleaned = input.replace(/\s/g, '');
  const match = cleaned.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/);
  if (!match) {
    return { error: 'Enter an IPv4 address, optionally with a prefix length (e.g. 192.168.1.0/24).' };
  }

  const ip = match[1];
  if (!net.isIPv4(ip)) {
    return { error: 'Invalid IPv4 address.' };
  }
  const octets = ip.split('.').map(Number);
  if (octets.some((o) => o > 255)) {
    return { error: 'Invalid IPv4 address: octets must be 0–255.' };
  }

  const prefix = match[2] === undefined ? 24 : Number(match[2]);
  if (prefix > 32) {
    return { error: 'Prefix length must be between 0 and 32.' };
  }

  const ipInt = ipToInt(ip);
  const maskInt = maskFromPrefix(prefix);
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);

  // For /31 and /32 the traditional "usable host" rules do not apply (RFC 3021 / host routes).
  const usableHosts = prefix >= 31 ? totalAddresses : totalAddresses - 2;
  const firstHostInt = prefix >= 31 ? networkInt : networkInt + 1;
  const lastHostInt = prefix >= 31 ? broadcastInt : broadcastInt - 1;

  const wildcardInt = (~maskInt) >>> 0;

  // Private / special ranges (RFC 1918, loopback, link-local, CGNAT, etc.)
  const ranges = [
    ['10.0.0.0', '10.255.255.255', 'Private (RFC 1918)'],
    ['172.16.0.0', '172.31.255.255', 'Private (RFC 1918)'],
    ['192.168.0.0', '192.168.255.255', 'Private (RFC 1918)'],
    ['127.0.0.0', '127.255.255.255', 'Loopback'],
    ['169.254.0.0', '169.254.255.255', 'Link-local'],
    ['100.64.0.0', '100.127.255.255', 'CGNAT (RFC 6598)'],
  ];
  const range = ranges.find(
    ([start, end]) => ipInt >= ipToInt(start) && ipInt <= ipToInt(end)
  );

  // Suggest the "canonical" network address for this IP when the user typed a host address
  const isNetworkAddress = ipInt === networkInt;

  return {
    input: cleaned,
    ip,
    prefix,
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    netmask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    totalAddresses,
    usableHosts,
    ipRange: `${intToIp(firstHostInt)} – ${intToIp(lastHostInt)}`,
    type: range ? range[2] : 'Public',
    isNetworkAddress,
    binary: {
      ip: octets.map((o) => o.toString(2).padStart(8, '0')).join('.'),
      netmask: intToIp(maskInt)
        .split('.')
        .map((o) => Number(o).toString(2).padStart(8, '0'))
        .join('.'),
    },
  };
}
