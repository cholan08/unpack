import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'web-security',
  title: 'Security',
  name: 'Web Security',
  tagline: 'The OWASP Top 10 in plain words: HTTPS, injection, XSS, CSRF, access control, secrets and hardening.',
  color: 'yellow',
  pillar: 'backend',
  order: 50,
  cover: {
    big: 'SECURITY',
    full: 'Web Security',
    cloud: ['Treat', 'every input', 'as an', 'attack'],
    art: {
      topLeft: iconArt('server', 'Shield', 'yellow'),
      topRight: flowArt(['Input', 'Validate', 'Sanitize', 'Store'], 'yellow'),
      left: codeArt(["' OR 1=1 --", '<script>alert(1)</script>', '../../etc/passwd'], 'Attacks'),
      centre: hubArt('Your app', ['Injection', 'XSS', 'CSRF', 'Broken\naccess'], 'server', 'yellow'),
    },
    side: { title: 'Defences', items: ['HTTPS', 'CSP', 'Validation', 'Least privilege'] },
    why: { title: 'Why Security ?', items: ['Protect your users', 'Avoid data breaches', 'Privacy laws require it', 'An interview favourite'] },
    footer: 'Security is a habit, not a feature!',
  },
  pages: [
    pg('introduction', 'Introduction to Web Security', 'The CIA triad', 'Threats, vulnerabilities, risks', 'Defence in depth', 'OWASP Top 10 overview'),
    pg('https', 'HTTPS & TLS', 'Encryption in transit', 'Certificates and CAs', 'The TLS handshake', 'HSTS'),
    pg('injection', 'Injection Attacks', 'SQL injection', 'NoSQL injection', 'Command injection', 'Parameterised queries'),
    pg('xss', 'Cross-Site Scripting (XSS)', 'Stored, reflected and DOM XSS', 'Output encoding', 'Content Security Policy', 'Why React escapes by default'),
    pg('csrf-cors', 'CSRF, CORS & Same-Origin', 'The same-origin policy', 'CORS headers', 'CSRF attacks', 'SameSite cookies and CSRF tokens'),
    pg('access-control', 'Broken Access Control', 'IDOR', 'Privilege escalation', 'Always check on the server', 'Mass assignment'),
    pg('data-secrets', 'Data Protection & Secrets', 'Hashing and encryption at rest', 'Managing secrets', 'Sensitive data exposure', 'Logging safely'),
    pg('hardening', 'Security Headers & Hardening', 'helmet', 'CSP, X-Frame-Options', 'Rate limiting', 'Dependency audits (npm audit)'),
    revision('XSS vs CSRF', 'CORS vs CSRF', 'Encoding vs encryption vs hashing'),
  ],
});
