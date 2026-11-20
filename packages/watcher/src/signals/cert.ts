// TLS certificate signal (optional). Certificates renew every few months and can differ per CDN edge, so a new
// fingerprint from the same issuer is only info. A new issuer, or a certificate that does not validate, is worth a look.
import tls from "node:tls";
import type { Severity } from "./dns.ts";

export interface CertInfo {
  fingerprint256: string;
  /** issuer organisation, else common name */
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  /** chain and hostname validated against the system CAs */
  authorized: boolean;
  authError?: string;
}

export type TlsProbe = (host: string, port: number, timeoutMs: number) => Promise<CertInfo>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export const tlsProbe: TlsProbe = (host, port, timeoutMs) =>
  new Promise((resolve, reject) => {
    // rejectUnauthorized: false so an invalid certificate is captured and reported instead of becoming a bare error
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false, timeout: timeoutMs });
    const fail = (err: Error) => {
      socket.destroy();
      reject(err);
    };
    socket.once("timeout", () => fail(new Error(`TLS handshake with ${host}:${port} timed out`)));
    socket.once("error", fail);
    socket.once("secureConnect", () => {
      const c = socket.getPeerCertificate();
      if (!c || !c.fingerprint256) return fail(new Error(`${host}:${port} sent no certificate`));
      const authError = socket.authorizationError;
      resolve({
        fingerprint256: c.fingerprint256,
        issuer: first(c.issuer?.O) || first(c.issuer?.CN),
        subject: first(c.subject?.CN),
        validFrom: new Date(c.valid_from).toISOString(),
        validTo: new Date(c.valid_to).toISOString(),
        authorized: socket.authorized,
        ...(authError ? { authError: String(authError) } : {}),
      });
      socket.end();
    });
  });

export interface CertBaseline {
  fingerprint256: string;
  issuer: string;
}

export interface CertFinding {
  severity: Severity;
  message: string;
}

export function judgeCert(now: CertInfo, baseline?: CertBaseline): CertFinding[] {
  const out: CertFinding[] = [];
  if (!now.authorized) out.push({ severity: "warn", message: `certificate does not validate: ${now.authError ?? "unknown reason"}` });
  if (baseline) {
    if (now.issuer !== baseline.issuer) out.push({ severity: "warn", message: `issuer changed: ${baseline.issuer} -> ${now.issuer}` });
    else if (now.fingerprint256 !== baseline.fingerprint256) out.push({ severity: "info", message: `new certificate from the same issuer (${now.issuer})` });
  }
  return out;
}
