import express from 'express';
import dns from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import netcalc from './netcalc.js';

const app = express();
app.use(express.json());

const envPort = Number(process.env.PORT);
const PORT = Number.isInteger(envPort) && envPort > 0 ? envPort : 4000;

function isIp(value) {
  return net.isIP(value) !== 0;
}

// ---------- 1. DNS lookup ----------

const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV'];

app.get('/api/dns', async (req, res) => {
  const domain = String(req.query.domain || '').trim().replace(/\.$/, '');
  if (!domain) {
    return res.status(400).json({ error: 'Provide a ?domain= to look up.' });
  }
  if (net.isIP(domain)) {
    return res.status(400).json({ error: 'That is an IP address, not a domain name.' });
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain) || domain.length > 253) {
    return res.status(400).json({ error: 'That does not look like a valid domain name.' });
  }

  const requested = String(req.query.type || 'ALL').toUpperCase();
  const types = requested === 'ALL' ? DNS_TYPES : [requested];
  if (!types.every((t) => DNS_TYPES.includes(t))) {
    return res.status(400).json({ error: `Unsupported record type. Use one of: ${DNS_TYPES.join(', ')}, or ALL.` });
  }

  const records = {};
  await Promise.all(
    types.map(async (type) => {
      try {
        let data;
        switch (type) {
          case 'A': data = await dns.resolve4(domain); break;
          case 'AAAA': data = await dns.resolve6(domain); break;
          case 'CNAME': data = await dns.resolveCname(domain); break;
          case 'MX': data = (await dns.resolveMx(domain)).map((r) => `${r.priority} ${r.exchange}`); break;
          case 'NS': data = await dns.resolveNs(domain); break;
          case 'TXT': data = (await dns.resolveTxt(domain)).map((chunks) => chunks.join('')); break;
          case 'SOA': {
            const s = await dns.resolveSoa(domain);
            data = [`ns ${s.nsname}`, `hostmaster ${s.hostmaster}`, `serial ${s.serial}`];
            break;
          }
          case 'SRV': data = (await dns.resolveSrv(domain)).map((r) => `${r.priority} ${r.weight} ${r.port} ${r.name}`); break;
        }
        if (data && data.length > 0) records[type] = data;
      } catch (err) {
        if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') records[type] = [`error: ${err.code || err.message}`];
      }
    })
  );

  res.json({ domain, records });
});

// ---------- 2. IP info ----------

async function fetchJson(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'network-tools/0.1' } });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/ip-info', async (req, res) => {
  const ip = String(req.query.ip || '').trim();
  if (ip && !isIp(ip)) {
    return res.status(400).json({ error: 'Invalid IP address.' });
  }

  try {
    const target = ip || '';
    const data = await fetchJson(
      target
        ? `https://ipapi.co/${encodeURIComponent(target)}/json/`
        : 'https://ipapi.co/json/'
    );
    if (data.error) {
      return res.status(502).json({ error: data.reason || 'Lookup failed upstream.' });
    }
    res.json({
      ip: data.ip,
      version: data.version,
      city: data.city,
      region: data.region,
      country: data.country_name,
      countryCode: data.country_code,
      postal: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      org: data.org,
      asn: data.asn,
    });
  } catch (err) {
    res.status(502).json({ error: `Lookup service unavailable (${err.message}).` });
  }
});

// ---------- 3. HTTP header inspector ----------

app.get('/api/headers', async (req, res) => {
  const raw = String(req.query.url || '').trim();
  if (!raw) {
    return res.status(400).json({ error: 'Provide a ?url= to inspect.' });
  }

  let target;
  try {
    target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return res.status(400).json({ error: 'That is not a valid URL.' });
  }
  if (!/^https?:$/.test(target.protocol)) {
    return res.status(400).json({ error: 'Only http and https URLs are supported.' });
  }

  const client = target.protocol === 'https:' ? https : http;
  const started = Date.now();

  const result = await new Promise((resolve) => {
    const request = client.get(
      target,
      {
        headers: { 'User-Agent': 'network-tools/0.1' },
        timeout: 8000,
        rejectUnauthorized: false, // inspection tool: we want headers even with TLS problems
      },
      (response) => {
        const chunks = [];
        response.on('data', (c) => {
          chunks.push(c);
          if (chunks.length > 64) response.destroy(); // enough to detect content type; no need for the whole body
        });
        response.on('end', () => {
          resolve({
            ok: true,
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
            bodyPreview: Buffer.concat(chunks).subarray(0, 512).toString('utf8'),
          });
        });
        response.on('error', (err) => resolve({ ok: false, error: err.message }));
      }
    );
    request.on('timeout', () => {
      request.destroy();
      resolve({ ok: false, error: 'Request timed out after 8 seconds.' });
    });
    request.on('error', (err) => resolve({ ok: false, error: err.message }));
  });

  if (!result.ok) {
    return res.status(502).json({ error: result.error });
  }

  res.json({
    url: target.href,
    finalUrl: result.headers.location ? result.headers.location : target.href,
    status: result.status,
    statusText: result.statusText,
    responseTimeMs: Date.now() - started,
    headers: result.headers,
    bodyPreview: result.bodyPreview,
  });
});

// ---------- 4. Subnet calculator (pure logic, see server/netcalc.js) ----------

app.get('/api/netcalc', (req, res) => {
  const input = String(req.query.cidr || '').trim();
  const result = netcalc(input);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`network-tools API listening on http://localhost:${PORT}`);
});
