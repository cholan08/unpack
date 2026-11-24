import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'auth',
  title: 'Auth',
  name: 'Authentication & Authorization',
  tagline: 'Who are you, and what may you do? Passwords, sessions, JWT, OAuth, MFA, roles, and the attacks to defend against.',
  color: 'pink',
  pillar: 'backend',
  order: 40,
  cover: {
    big: 'AUTH',
    full: 'Authentication & Authorization',
    cloud: ['Who are', 'you, and', 'what may', 'you do?'],
    art: {
      topLeft: iconArt('user', 'Auth', 'pink'),
      topRight: flowArt(['Log in', 'Verify', 'Issue token', 'Access'], 'pink'),
      left: codeArt(['Authorization:', '  Bearer eyJhbGciOi…'], 'Header'),
      centre: hubArt('Identity', ['AuthN:\nwho?', 'AuthZ:\nallowed?', 'Session', 'Token'], 'user', 'pink'),
    },
    side: { title: 'Methods', items: ['Passwords', 'Sessions', 'JWT', 'OAuth 2.0'] },
    why: { title: 'Why Auth ?', items: ['Protects user data', 'Every app has logins', 'Top security interview topic', 'Breaches are costly'] },
    footer: 'Trust nothing, verify everything!',
  },
  pages: [
    pg('introduction', 'AuthN vs AuthZ', 'Authentication vs authorization', 'Identity, credentials and factors', 'Where auth fits in a request', 'Common attacks at a glance'),
    pg('passwords', 'Passwords & Hashing', 'Never store plain text', 'Hashing vs encryption', 'Salts, bcrypt, argon2', 'Password policies and reset flows'),
    pg('sessions-cookies', 'Sessions & Cookies', 'Server-side sessions', 'Cookie flags: HttpOnly, Secure, SameSite', 'Session stores (Redis)', 'Logout and expiry'),
    pg('jwt', 'JSON Web Tokens (JWT)', 'Header, payload, signature', 'Access vs refresh tokens', 'Where to store tokens', 'Revoking JWTs'),
    pg('oauth', 'OAuth 2.0 & OpenID Connect', 'Roles: client, auth server, resource server', 'Authorization code flow + PKCE', 'Scopes', 'OIDC and ID tokens'),
    pg('sso-social', 'SSO & Social Login', 'Log in with Google / GitHub', 'SAML vs OIDC', 'Single sign-on', 'Identity providers (Auth0, Clerk)'),
    pg('mfa', 'MFA & Passwordless', 'TOTP authenticator apps', 'SMS and email codes', 'Passkeys / WebAuthn', 'Magic links'),
    pg('authorization', 'Authorization Models', 'RBAC: role-based', 'ABAC: attribute-based', 'ACLs and ownership checks', 'Least privilege'),
    pg('mern-auth', 'Auth in a MERN App', 'Sign-up and log-in routes', 'Auth middleware in Express', 'Protected React routes', 'Role checks'),
    pg('attacks', 'Auth Attacks & Defences', 'Brute force and credential stuffing', 'Session hijacking and fixation', 'CSRF and XSS token theft', 'Rate limits and lockouts'),
    revision('AuthN vs AuthZ', 'Session vs JWT', 'Hashing vs encryption', 'OAuth vs OIDC'),
  ],
});
