# Customer checkout and renewals

Share `https://YOUR-PORTAL-DOMAIN/portal/YOUR-ISP-IDENTIFIER/YOUR-PORTAL-SLUG`. The ISP identifier is the operator username and the portal slug is the router's existing backend `portal_slug`. Infrastructure links to this canonical tenant-qualified URL for each enabled customer portal. Customer routes are public; `/login` remains the operator sign-in page.

The historical `/portal/YOUR-PORTAL-SLUG` route remains available during migration. It resolves the portal through the public API and replaces the browser URL with the canonical ISP-qualified route while preserving MikroTik captive-portal query parameters.

## Supported customer journeys

- Load active plans and the configured provider from the backend's public portal endpoint.
- Purchase hotspot access with a Kenyan mobile number, or renew an existing PPPoE username.
- Send a payment prompt through the router's configured M-Pesa/Kopo Kopo integration. The backend determines price, provider and plan ownership; the browser never submits a price.
- Check payment and access-provisioning status. `paid`/`provisioning` are not displayed as successful access. `provisioning_failed` and `manual_review` direct the customer to the ISP without another payment.
- Recover a timed-out request using its original idempotency key and payload, including after a same-tab reload. Starting a fresh payment requires explicitly leaving the saved request.
- Read issued hotspot credentials, connect using the configured RouterOS login target, or use existing hotspot credentials. PPPoE completion displays the renewed account.

No operator login, provider secret or admin token is required by customers. No refund, public provisioning-retry or provider-approval endpoint is exposed.

## Payment recovery and privacy

The browser persists only the original request key, plan UUID, mobile/account reference, creation timestamp and eventual payment ID in per-portal `sessionStorage`. This is tab-scoped recovery, not a durable cross-device history. Request details are needed to replay the exact request after an ambiguous first POST. Closing the tab or clearing browser storage can lose that recovery handle.

The backend's payment status token is held in an HttpOnly, Secure, SameSite=Strict cookie scoped to `/api/customer/payments/{payment_id}`. It is not returned to browser JavaScript or placed in a URL. Operator credentials/cookies and caller-supplied authorization headers are not forwarded by customer requests. The backend independently enforces token validity/expiry. The capability cookie lasts at most one hour; the backend can expire it earlier (currently 30 minutes by default).

Hotspot passwords are displayed only from a `provisioned` response and remain in component memory. They are never persisted to browser storage. Backend credential-display expiry still applies. A missing/expired credential or status token is not treated as permission to charge again.

Polling is bounded, pauses when the tab is hidden and stops on page teardown. Customers can manually check or recover when an outage interrupts polling. Recovery uses the original key, so it requests the existing backend payment session rather than another provider charge. No automatic POST retry is enabled.

## Captive-router login setup

Set this optional public runtime variable to a JSON mapping of **portal slug to exact RouterOS login URL**:

```dotenv
NUXT_PUBLIC_HOTSPOT_LOGIN_URLS={"westlands":"https://wifi.example.com/login","eastlands":"https://east-wifi.example.com/login"}
```

These are public login URLs, not credentials. Each entry must use HTTP(S), path `/login`, and no query, fragment or URL user/password. Prefer HTTPS with a certificate trusted by customer devices. Missing configuration leaves checkout and renewal available, while direct router sign-in is disabled and credentials can be used on the native network login page.

The `link-login-only` / `link-login` query parameter is accepted only if it matches the configured URL for that slug exactly. Private IPs and `.lan`/`.local` hosts are not automatically trusted. `link-orig` is not used as a redirect destination; successful sign-in requests the trusted router's `/status` page.

The customer document CSP permits form submission only to itself and that slug's configured router origin. Operator documents retain `form-action 'self'`. Crossing between operator and customer routes uses a full document navigation so the appropriate CSP is applied.

RouterOS must support the form's login method: HTTPS login is preferred; an explicitly configured HTTP-PAP endpoint also works where browsers permit insecure form submission, with a customer warning. HTTP-CHAP challenge calculation is not implemented; links containing `chap-id`/`chap-challenge` direct the customer to the router's native login page. Do not disable router security just to hide an integration error. MikroTik documents the distinctions and CHAP's hashing requirement in [HotSpot authentication](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot%2B-%2BCaptive%2Bportal) and [Hotspot customisation](https://help.mikrotik.com/docs/spaces/ROS/pages/87162881/Hotspot%2Bcustomisation).

### Guided onboarding redirect

For newly guided L2TP-onboarded routers, the generated RSC now attempts to install the canonical redirect automatically when at least one enabled HotSpot server exists. It does not overwrite the ISP's source HotSpot directory. Instead it:

1. reads the HotSpot server profile and current HTML directory;
2. copies that directory to a router-specific Uzanet-managed sibling directory;
3. downloads only the managed copy's `login.html` from `/hotspot-login/{ispIdentifier}/{portalSlug}`;
4. points `html-directory-override` to the managed copy only after the download succeeds.

The managed `login.html` forwards `link-login-only`, `link-orig`, MAC and IP using RouterOS's URL-escaped template variables. If the copy, fetch or profile switch cannot complete, the existing HotSpot HTML remains active and L2TP/API onboarding continues. This keeps portal customization failure from bricking router onboarding.

Set backend `PORTAL_PUBLIC_URL` to the same exact HTTPS origin as `NUXT_SITE_ORIGIN` in production. If it is omitted, the backend falls back to the first valid HTTPS `CORS_ORIGINS` entry for compatibility; explicit configuration is recommended whenever there is more than one allowed origin.

The portal hostname still needs pre-login walled-garden access. The portal JavaScript uses same-origin APIs. Google font hosts are optional for typography; system fonts remain available.

## Trusted proxy IP and abuse controls

The backend currently rate-limits payment initiation using both phone number and `request.client.host`. Because this portal adds a server proxy, **incorrect forwarding can make all customers share the portal/edge IP and exhaust the same limit**.

- By default the Nuxt server forwards only its direct peer IP, ignoring caller-supplied forwarding headers.
- If a trusted edge overwrites `X-Real-IP` (or Cloudflare's `CF-Connecting-IP`) and direct access to the portal container is blocked, set `NUXT_CUSTOMER_IP_HEADER=x-real-ip` (or `cf-connecting-ip`). Do not set this on a publicly reachable container that accepts untrusted copies of that header.
- The portal sends the validated single IP as `X-Forwarded-For` on payment initiation. Configure the API reverse proxy/Uvicorn to trust only the actual controlled proxy chain and preserve this value. Do not use unrestricted forwarded-header trust on an exposed API listener.
- In staging, verify the backend observes two test customers as two distinct client IPs, that forged browser forwarding headers cannot override the edge identity, and that per-phone and per-IP throttling both work. This is a deployment acceptance gate, not a claim that this PR changes the API server's proxy configuration.
- Apply edge per-IP rate limits to `/api/customer/*`, especially payment initiation, as well as body-size and request-time limits. Backend phone/account controls remain necessary.

## Release checks

Run `npm run check`. Tests use an isolated fake backend and headless Vue lifecycles; no live charges occur. They verify public/operator separation, cookie scoping, payload restrictions, stable idempotency keys across reload, duplicate-submit protection, late-response cleanup, phone/account validation, status transitions and captive URL/CSP restrictions.

Before launch, test real browser reload/visibility behavior and captive-browser cookie/form handling; confirm gateway HTTPS/login settings and walled-garden access; verify trusted IP forwarding; and run M-Pesa and Kopo Kopo sandbox hotspot purchases and PPPoE renewals, including duplicate callbacks and a router outage after payment. Provider credentials/callbacks, package profiles and existing PPPoE accounts must be configured in the backend/router. The work has not been deployed or tested with live customer funds.
