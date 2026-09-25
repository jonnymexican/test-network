# Network Tools

A local-first network toolkit: **DNS lookup**, **IP info**, **subnet calculator**, and **HTTP header inspector**, backed by a small Node/Express API so it can do real network operations a pure browser app can't.

## Running it

```bash
npm install
npm run dev        # starts API on :4000 and the UI on :5173 (vite picks a free port)
```

Then open the printed Local URL (e.g. http://localhost:5173).

```bash
npm test           # unit tests (subnet calculator + API)
npm run build      # production frontend build to dist/
npm start          # API only
```

## Architecture

```
server/
  index.js         Express API (4 endpoints below)
  netcalc.js       Pure subnet-calculator logic (unit-tested)
src/               React frontend (Vite)
  tools/           One panel per tool
vite.config.mjs    Proxies /api/* to the backend in dev
```

The frontend never talks to third-party services directly — it calls the local API, which performs DNS resolution, IP lookups, and HTTP requests. This avoids CORS issues and keeps the browser sandboxed.

## API

| Endpoint | Params | Description |
|---|---|---|
| `GET /api/dns` | `domain`, `type` (default `ALL`) | Resolves A, AAAA, CNAME, MX, NS, TXT, SOA, SRV records |
| `GET /api/ip-info` | `ip` (optional — defaults to caller's public IP) | Geolocation, org, ASN via ipapi.co |
| `GET /api/headers` | `url` | Fetches the URL server-side, returns status, timing, and all response headers |
| `GET /api/netcalc` | `cidr` | Network/broadcast/mask, host range, RFC classification, binary view |

### Examples

```bash
curl "http://localhost:4000/api/dns?domain=github.com&type=A"
curl "http://localhost:4000/api/ip-info?ip=8.8.8.8"
curl "http://localhost:4000/api/headers?url=example.com"
curl "http://localhost:4000/api/netcalc?cidr=10.0.0.77/26"
```

## Notes

- IP geolocation uses the free ipapi.co tier (rate-limited); swap in a paid provider or self-hosted MaxMind if you need volume.
- The header inspector ignores TLS certificate errors by design (it's for inspection); don't expose it publicly as-is.
- `ping`/`traceroute` are not included: raw sockets need admin rights and don't translate to web hosting. Good future additions would be TCP port checks (backend) or an ASN/whois tool.
