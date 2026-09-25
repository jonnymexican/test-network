import tls from 'node:tls';

export async function getTlsInfo(host, port = 443, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false, timeout: timeoutMs },
      () => {}
    );

    socket.once('secureConnect', () => {
      try {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.round((validTo - Date.now()) / 86400000);

        resolve({
          host,
          authorized: socket.authorized,
          authorizationError: socket.authorized ? null : socket.authorizationError,
          protocol,
          cipher: cipher ? `${cipher.name} (${cipher.version})` : null,
          subject: {
            commonName: cert.subject?.CN,
            organization: cert.subject?.O,
          },
          issuer: {
            commonName: cert.issuer?.CN,
            organization: cert.issuer?.O,
          },
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysRemaining,
          expired: daysRemaining <= 0,
          subjectAltNames: cert.subjectaltname
            ? cert.subjectaltname.split(', ').map((s) => s.replace(/^DNS:/, ''))
            : [],
          serialNumber: cert.serialNumber,
          fingerprint256: cert.fingerprint256,
        });
        socket.end();
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    });

    socket.once('error', (err) => reject(err));
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error(`TLS handshake timed out after ${timeoutMs / 1000}s.`));
    });
  });
}
