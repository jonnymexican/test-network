import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const CHECKS = [
  {
    header: 'strict-transport-security',
    name: 'HSTS',
    weight: 20,
    why: 'Forces HTTPS for future visits, preventing downgrade attacks.',
    test: (v) => {
      const maxAge = Number((v.match(/max-age=(\d+)/i) || [])[1] || 0);
      return maxAge >= 15768000 ? 'pass' : 'warn';
    },
    fix: 'Add Strict-Transport-Security with max-age of at least 6 months (15768000).',
  },
  {
    header: 'content-security-policy',
    name: 'Content-Security-Policy',
    weight: 25,
    why: 'Mitigates cross-site scripting by whitelisting resource origins.',
    test: () => 'pass',
    fix: 'Add a Content-Security-Policy header, starting in report-only mode.',
  },
  {
    header: 'x-content-type-options',
    name: 'X-Content-Type-Options',
    weight: 10,
    why: 'Stops browsers from MIME-sniffing responses away from the declared type.',
    test: (v) => (v.toLowerCase() === 'nosniff' ? 'pass' : 'warn'),
    fix: 'Set X-Content-Type-Options: nosniff.',
  },
  {
    header: 'x-frame-options',
    name: 'X-Frame-Options',
    weight: 10,
    why: 'Prevents clickjacking by blocking hostile framing.',
    test: (v) => (['deny', 'sameorigin'].includes(v.toLowerCase()) ? 'pass' : 'warn'),
    fix: 'Set X-Frame-Options: DENY (or SAMEORIGIN), or use CSP frame-ancestors.',
  },
  {
    header: 'referrer-policy',
    name: 'Referrer-Policy',
    weight: 10,
    why: 'Limits how much referrer data leaks to other sites.',
    test: (v) => (['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'].includes(v.toLowerCase()) ? 'pass' : 'warn'),
    fix: 'Set Referrer-Policy: strict-origin-when-cross-origin.',
  },
  {
    header: 'permissions-policy',
    name: 'Permissions-Policy',
    weight: 10,
    why: 'Restricts browser features (camera, geolocation, ...) to chosen origins.',
    test: () => 'pass',
    fix: 'Add a Permissions-Policy header locking down unused features.',
  },
  {
    header: 'cross-origin-opener-policy',
    name: 'Cross-Origin-Opener-Policy',
    weight: 7,
    why: 'Isolates your browsing context from cross-origin popups.',
    test: (v) => (['same-origin'].includes(v.toLowerCase()) ? 'pass' : 'warn'),
    fix: 'Set Cross-Origin-Opener-Policy: same-origin.',
  },
];

function fetchHeaders(target, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const client = target.protocol === 'https:' ? https : http;
    const request = client.get(
      target,
      { headers: { 'User-Agent': 'network-tools/0.1' }, timeout: timeoutMs, rejectUnauthorized: false },
      (response) => {
        response.resume();
        response.on('end', () => resolve({ status: response.statusCode, headers: response.headers }));
        response.on('error', reject);
      }
    );
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timed out.'));
    });
    request.on('error', reject);
  });
}

export async function gradeSecurityHeaders(rawUrl, timeoutMs = 8000) {
  const cleaned = String(rawUrl || '').trim();
  if (!cleaned) return { error: 'Provide a URL to grade.' };
  let target;
  try {
    target = new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);
  } catch {
    return { error: 'That is not a valid URL.' };
  }

  const { status, headers } = await fetchHeaders(target, timeoutMs);

  const findings = CHECKS.map((check) => {
    const value = headers[check.header];
    const state = value ? check.test(value) : 'missing';
    return {
      header: check.name,
      present: Boolean(value),
      value: value ? String(value) : null,
      state,
      points: state === 'pass' ? check.weight : state === 'warn' ? Math.round(check.weight / 2) : 0,
      maxPoints: check.weight,
      why: check.why,
      fix: check.fix,
    };
  });

  const earned = findings.reduce((sum, f) => sum + f.points, 0);
  const possible = findings.reduce((sum, f) => sum + f.maxPoints, 0);
  const pct = earned / possible;
  const grade = pct >= 0.9 ? 'A' : pct >= 0.75 ? 'B' : pct >= 0.6 ? 'C' : pct >= 0.4 ? 'D' : 'F';

  return {
    url: target.href,
    status,
    grade,
    score: Math.round((earned / possible) * 100),
    findings,
  };
}
