import dns from 'node:dns';

export const RESOLVERS = [
  { name: 'Cloudflare', servers: ['1.1.1.1'] },
  { name: 'Google', servers: ['8.8.8.8'] },
  { name: 'Quad9', servers: ['9.9.9.9'] },
  { name: 'OpenDNS', servers: ['208.67.222.222'] },
];

export const SUPPORTED_TYPES = ['A', 'AAAA', 'TXT', 'NS'];

function queryOne(servers, domain, type, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const resolver = new dns.Resolver({ timeout: timeoutMs, tries: 2 });
    resolver.setServers(servers);
    const map = {
      A: 'resolve4',
      AAAA: 'resolve6',
      TXT: 'resolveTxt',
      NS: 'resolveNs',
    };
    resolver.resolve(domain, type, (err, records) => {
      if (err) {
        resolve({ ok: false, code: err.code || 'ERROR' });
      } else {
        const normalized = (type === 'TXT' ? records.map((chunks) => chunks.join('')) : records).map(String);
        resolve({ ok: true, records: normalized.sort() });
      }
    });
  });
}

export async function checkPropagation(domain, type, timeoutMs) {
  if (!SUPPORTED_TYPES.includes(type)) {
    return { error: `Supported types: ${SUPPORTED_TYPES.join(', ')}` };
  }
  const results = await Promise.all(
    RESOLVERS.map(async (resolver) => {
      const r = await queryOne(resolver.servers, domain, type, timeoutMs);
      return {
        resolver: resolver.name,
        servers: resolver.servers,
        ok: r.ok,
        records: r.records || null,
        code: r.code || null,
      };
    })
  );

  const successful = results.filter((r) => r.ok);
  const answerSets = new Set(successful.map((r) => JSON.stringify(r.records)));
  const consistent = successful.length > 0 && answerSets.size === 1;

  return {
    domain,
    type,
    consistent,
    resolversAgree: consistent ? 'all' : `${new Set(successful.map((r) => JSON.stringify(r.records))).size} different answers`,
    results,
  };
}
