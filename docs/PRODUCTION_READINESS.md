# Production preparedness sweep

## Scope

Baseline: `bonnieace/Mikrotik-Frontend` master at `1ced00ecd1f93294f506b357e44cfb33603aba40`. This is the Nuxt operator portal. Existing routes and the Inter/slate/blue application shell are retained; placeholder sections are replaced with supported backend workflows.

Backend contract checked against the hardened `bonnieace/Mikrotik` main source. No live customer, router, payment, database or deployment changes are part of this PR.

## Findings addressed

| Finding | Change |
| --- | --- |
| Legacy paths, numeric router IDs and incompatible request shapes | Explicit `/api/v1` endpoint mapping, UUIDs and current JSON payloads |
| Browser-readable JWT and public client-secret configuration | Server-only upstream config; Secure HttpOnly session cookie; legacy cookie removal |
| No server-side proxy authorization boundary | Cookie authentication and strict endpoint/method allowlist; FastAPI enforces identity and ownership |
| CORS-dependent direct browser requests | Same-origin Nuxt server proxy; exact-origin CSRF checks for writes |
| Router passwords transmitted in query strings | JSON-only create/update; blank edit password omitted |
| Login/logout did not track hardened backend account/token state | `auth/token`, `me`, `auth/logout`; explicit disabled/locked errors; password-change invalidation |
| Old data and overlapping status requests could cross router/session switches | Request generations, cancellation, safe session resets and visibility-aware polling lifecycle |
| Request errors were treated as empty data/offline | Separate loading, empty, error, unknown and explicit router-offline states |
| Unsupported/mock UI actions | Removed fake search, notifications, profile photo, support links/security claims and fabricated dashboard values; implemented settings |
| Incomplete customer/plan actions | Hotspot and PPPoE creation and access lifecycle; real plan create/edit/retire |
| Incomplete onboarding | One-time script download, peer-provisioning indication, expiry and secret-handling warnings |
| Payment failures lacked operational visibility | Payment attempts separated from ledger; retry provisioning only when backend permits it; audit log |
| No repeatable release checks | Unit and isolated built-server tests, type/lint/build checks, GitHub Actions |
| Static deployment inappropriate for secure sessions | Non-root Node image, Compose service, explicit configuration validation and liveness probe |
| Vulnerable dependency lockfile | Compatible Nuxt/toolchain updates and repeatable npm audit |

## Security choices and limits

- No frontend admin secret, provider secret, VPN-agent socket or database credentials.
- Upstream URL is server-controlled; arbitrary destinations, redirects, query strings, unsupported API routes and caller-supplied auth headers are blocked.
- API responses and HTML use no-store headers; protected data is only fetched after server-authenticated requests.
- Failed writes are never automatically retried. A timeout can occur after a backend mutation committed; operators must refresh/reconcile before retrying.
- Cookie lifetime is capped at eight hours and the backend token's reported lifetime. Backend identity checks still decide whether a token is valid.
- A background 401 clears the current client session state but does not emit a cookie-deletion header: a late old request must not erase a newer login cookie. Rejected tokens cannot access FastAPI; login, logout and password changes replace/remove the cookie explicitly.
- Backend logout invalidates all sessions for the account. If revocation fails, the portal attempts to clear the local cookie and warns rather than claiming confirmed global logout.
- Security headers include frame denial, MIME sniffing prevention, a restricted connection policy, HSTS in production and a restrictive referrer policy.
- CSP currently permits inline script/style required by the Nuxt shell. It is defense in depth, not an XSS-proof boundary. No HTML injection rendering is used for backend content.
- Add edge per-IP login throttling, body limits and request timeouts before public exposure. Backend account lockouts are not a substitute for edge abuse controls.
- List search/pagination operates on the records returned by the current backend. It is not server-side historical search. Large-dataset pagination needs a backend contract extension.
- No refund, payment approval, provider settlement reconciliation, administrator-management or profile-creation endpoint has been invented.
- Public customer checkout is available at `/portal/:portalSlug`, with a separate allowlisted `/api/customer/*` proxy. Operator `/login` and authorization remain separate. See `docs/CUSTOMER_PORTAL.md` for setup and payment-specific release checks.
- Upstream constraint: the audited backend's router deletion guard checks all package records, including retired plans. Retiring plans alone does not allow deletion. The portal explains this conflict; a backend lifecycle/retention decision is needed before deleting routers with package history. Do not work around it with direct database deletion.

## Automated verification

Run `npm run check` and `npm audit --audit-level=high` from Node 24.

Unit checks cover endpoint allowlists, exact-origin validation, upstream configuration, safe error messages, UTC/EAT formatting, router-switch races, duplicate-submit prevention and session-reset races. Built-server HTTP tests cover anonymous access, cookie flags, login errors, identity routing, JSON payloads, allowlist rejection, CSRF, body validation, no write retries, redirect rejection, expired-session rejection, password changes and logout failure handling.

These tests validate the portal and its request contract using a fake backend. They do not prove real router connectivity or payment settlement.

## Required release acceptance

Do not label the whole ISP system production-ready until these checks pass on an isolated staging router and test accounts:

- [ ] Deploy the portal server on the chosen HTTPS domain with its exact `NUXT_SITE_ORIGIN`.
- [ ] Verify Docker/Coolify health, proxy headers, TLS, no-store behavior, edge rate limiting and body limits.
- [ ] Verify login, disabled/locked account messages, reload, expiry, password change and logout in an actual browser.
- [ ] Test two ISP operators; confirm each sees only their own routers and cannot access the other's UUIDs.
- [ ] Check keyboard navigation, mobile sidebar, table overflow, validation and error announcements on desktop/mobile browsers.
- [ ] Generate an onboarding script; confirm the VPS agent creates the peer, run it on a test router, complete the claim and verify RouterOS API access through the tunnel.
- [ ] Exercise hotspot and PPPoE plan creation and customer create/disable/enable/delete on the test router.
- [ ] Verify access expiry jobs and renewal behavior in the existing customer portal.
- [ ] Complete M-Pesa and Kopo Kopo sandbox payments through customer checkout; verify callbacks, duplicate callbacks, ledger entries and provisioning retry with no double charge.
- [ ] Exercise router/API outage handling and confirm errors do not masquerade as zero revenue or offline customer counts.
- [ ] Back up backend database/router configuration and retain the previous deployment image/commit for rollback.

Browser/device acceptance, Docker execution and real provider/router end-to-end checks are release gates, not claimed completed by the automated local tests. No live deployment is performed by this change.
