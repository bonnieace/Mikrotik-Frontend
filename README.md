# Uzanet operator portal

Nuxt 4 operator console for the hardened FastAPI backend at `https://api.uzanet.co.ke/api/v1`.

This repository includes an **operator/admin portal** and public **customer checkout at `/portal/:portalSlug`**. Operators manage routers, hotspot/PPPoE accounts, service plans, payment attempts and audit logs. Customers purchase hotspot access or renew an existing PPPoE account without an operator login.

## Architecture and authentication

The browser calls same-origin `/api/auth/*` and `/api/backend/*` routes. The Nuxt server forwards only allowlisted operator endpoints to FastAPI. The JWT is stored in a Secure, HttpOnly, SameSite=Strict cookie; no bearer token or client secret is returned to browser JavaScript. FastAPI remains the authority for account status, role, router ownership and token revocation.

Mutations require the exact configured browser Origin and a custom request header. The server does not forward browser-supplied Authorization, cookies, admin secrets or arbitrary query strings. No automatic write retries are performed; after a timeout, refresh and check the result before trying again.

**This application requires a running Nuxt/Nitro server. Do not use `nuxt generate` or deploy only `.output/public`.** Client-side rendering (`ssr: false`) does not remove the server API requirement.

## Local development

Use Node 24 and npm. Copy `.env.example` to a local `.env`, then:

```bash
npm ci
npm run dev
```

The default local origin is `http://localhost:3000`. If using another port or hostname, change `NUXT_SITE_ORIGIN` to exactly match the browser address. Use a staging backend and test operator for development; do not test mutations against production customers.

## Production configuration

Set these as **runtime environment variables** in the portal application:

| Variable | Value |
| --- | --- |
| `NUXT_API_BASE` | `https://api.uzanet.co.ke/api/v1` |
| `NUXT_SITE_ORIGIN` | Your exact HTTPS portal origin, for example `https://portal.example.com`, without a trailing slash |
| `PORT` | `3000` (default in the Docker image) |

The production server refuses to start with a missing/malformed origin or insecure remote backend URL. HTTP loopback is allowed only for local development/testing.

Remove obsolete `NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_API_CLIENT_ID` and especially `NUXT_PUBLIC_API_CLIENT_SECRET`. If a real secret was ever included in a public runtime configuration or shipped JavaScript bundle, rotate it at its issuer.

Do **not** put MySQL passwords, payment provider keys, superadmin bootstrap credentials, JWT signing keys or VPN-agent secrets in this repository or portal container. Do not mount the VPS VPN-agent socket here. Router provisioning goes through the authenticated backend; only that backend communicates with the host VPN agent.

### Coolify: Docker Compose

1. Create/use a **separate portal application** connected to this repository. Do not replace the existing backend application.
2. Select Docker Compose and `docker-compose.yaml`.
3. Set the two required runtime variables above.
4. Assign your chosen HTTPS portal domain to the `portal` service on internal port `3000`.
5. Deploy the reviewed commit. There are no database or persistent-storage mounts.
6. Confirm `https://YOUR-PORTAL-DOMAIN/api/health` returns `{"status":"ok"}`.
7. Sign in with an active backend operator account. Check router selection and one read-only page before using write actions.

`/api/health` is portal **liveness**, not proof that FastAPI, payment providers or routers are healthy. Monitor backend `/health/ready` separately.

The supplied image runs as a non-root user. Compose drops capabilities and uses a read-only filesystem with temporary storage at `/tmp`. Docker image execution must still be checked in your deployment environment.

### Other Node hosts

```bash
npm ci
npm run build
npm start
```

Set production variables in the process environment; the built Node server does not automatically load your local `.env`. Put it behind HTTPS. Netlify/Vercel require their Nuxt server-function adapter, not static-only publishing; the supplied and tested build preset is Node server.

### Edge safeguards

Configure the trusted reverse proxy to enforce HTTPS, request/body time limits, a small body-size limit (16 KiB is sufficient for these forms), and per-IP login rate limiting. FastAPI also enforces account lockouts. Avoid request-body, Authorization, Cookie and onboarding-response logging. Do not enable CDN caching for authenticated pages or `/api/*`.

This same-origin arrangement does not require adding the portal domain to FastAPI CORS: browser JavaScript no longer contacts FastAPI directly. Do not weaken the backend's CORS or account-disabled checks.

## Operator workflows

| Portal route | Supported work |
| --- | --- |
| `/login` | Username/password authentication; clear disabled/locked-account messages |
| `/dashboard` | Selected router's live sessions, bridge traffic and recent ledger entries |
| `/routers` | Guided L2TP onboarding, JSON-based manual registration, editing, deletion and connection checks |
| `/hotspot-users` | List/create customers, show generated credentials once, enable/disable/delete, inspect live sessions |
| `/network-users` | List/create PPPoE subscribers, enable/disable/delete, inspect live sessions |
| `/service-plans` | Create/edit/retire hotspot and PPPoE plans |
| `/billing` | Ledger, payment attempts, eligible provisioning retries and audit events |
| `/settings` | Change password and invalidate all backend sessions for the account |
| `/portal/:portalSlug` | Public hotspot checkout, existing PPPoE renewals, payment recovery/status and hotspot voucher login |

Operator creation of customer access provisions immediately without collecting payment. Use it deliberately. “Enabled” is stored account status, not “currently connected.” Times are rendered in East Africa Time.

A plan references a RouterOS profile that must already exist. The portal does not create profiles or apply the rate-limit metadata to router interfaces.

### Router onboarding

Generate a bundle under Infrastructure. The response states whether the VPS agent actually provisioned the L2TP peer. If not, the peer still needs host-side provisioning; do not assume a working VPN account.

Download the credential-bearing `.rsc` privately, review it, back up the intended router, then run it in that router's RouterOS terminal before the claim token expires. Select the router and check its connection afterwards. The script is not executed by the browser. Scripts and one-time credentials are held only in component memory and disappear when navigating away, switching routers or reloading. Save them first; there is no “retrieve existing password” endpoint.

Payment-provider selection does not configure provider credentials/callbacks. Those are backend deployment responsibilities.

## Verification

For public checkout setup, captive-router login URLs, recovery behavior and trusted customer-IP forwarding, see [Customer portal setup](docs/CUSTOMER_PORTAL.md).

```bash
npm run check
npm audit --audit-level=high
```

Checks include lint, TypeScript, unit/security-policy tests, a production build and HTTP integration tests against an isolated fake backend. Integration tests never call the live ISP API. GitHub Actions repeats these checks on PRs and changes to `master`.

See [production readiness and release checklist](docs/PRODUCTION_READINESS.md) for what has and has not been verified.

The router setup drawer supports the backend's single-use **Copy setup command**,
with inline/manual RSC fallback for interrupted downloads and rolling deployments.
Deploy the backend migration first. The router fetches directly from the configured
HTTPS API using a scoped header token; this is not a new public Nuxt proxy route.
Managed-tunnel replacement is an explicit opt-in because it disconnects the old
UzaNet record. Existing hotspot HTML redirects are not changed by this command.
