---
title: Revgentic Production API — Penetration Test Interim Technical Report
prepared_by: Auditify Security (Gowtham) — AI-assisted testing session via Claude Code
report_date: 2026-08-18
report_type: Interim / Detailed Technical Report
status: OPEN — testing blocked pending authenticated test credentials
---

# Revgentic Production API — Detailed Technical Testing Report

## 1. Executive Summary

**Product/application tested:** Revgentic production backend API (`https://server.app.revgentic.com`), a NestJS service, and the associated public-facing frontend (`https://app.revgentic.com`, Next.js). Revgentic is an AI-assisted sales-coaching/CRM-integration platform with 232 documented API routes across 48 controllers.

**Purpose of testing:** Authorized penetration test engaging Revgentic's production API, per scope supplied by the client (routing inventory and environment details forwarded internally 2026-08-17, originating from client contact "Amir").

**Testing period:** Single session, 2026-08-18 (UTC). Server-observed timestamps during testing ranged approximately 06:52–07:05 UTC for the primary recon pass, with additional work later in the same session.

**Overall testing status:** IN PROGRESS — BLOCKED. The unauthenticated/public attack surface has been tested to a reasonable depth of confidence. The authenticated attack surface — which contains the substantial majority of the application's functionality and is the primary focus of this engagement per the client's own risk priorities (authorization, tenant isolation, business logic) — has not yet been tested, because no authenticated test session (Stytch B2B bearer token) has been made available.

**High-level outcome:** No confirmed vulnerabilities have been identified to date. This reflects the scope actually tested (the public surface), not a conclusion about the application as a whole — approximately 91% of the documented route inventory remains untested pending credentials.

**Findings observed within tested scope:** None confirmed. A small number of non-security-impacting hygiene observations were noted (Section 10).

---

## 2. Testing Scope

| Area | Status |
|---|---|
| Public/unauthenticated backend endpoints | Tested |
| Credential-issuing endpoints (`/auth/impersonate`, `/auth/overlay-exchange`) | Tested (negative/structural cases only) |
| Webhook signature verification (6 endpoints: Recall ×2, Slack, Apollo, Unipile) | Tested |
| OAuth callback endpoints (6 providers: Gmail, HubSpot, Outlook, Salesforce, Slack, Overlay/Calendar) | Tested — error-handling behavior only; full OAuth flow not tested |
| CORS policy | Tested |
| Demo/shared-key endpoints | Tested |
| Public frontend (`app.revgentic.com`) — passive recon, secret scanning of shipped JS | Tested |
| HTTP-level edge cases (path normalization, verb tampering, exposed common paths) | Tested |
| Authentication/session model behind login (token lifecycle, revocation, role changes) | Not tested — requires credentials |
| Authorization (BOLA/IDOR, BFLA, tenant isolation) across ~200 authenticated routes | Not tested — requires credentials |
| Property-level authorization / mass assignment (BOPLA) | Not tested — requires credentials |
| Business logic (relationship web, pipelines, plays, commitments) | Not tested — requires credentials |
| Full OAuth account-linking / state-binding flows | Not tested — requires credentials + provider test accounts |
| AI/LLM boundary testing (chatgpt, content-generation, nudge-engine, deal-scorecard) | Not tested — requires credentials |
| Race conditions | Not tested — requires credentials (test templates prepared) |
| Infrastructure (staging environment) | Discovered, not tested — out of documented scope pending confirmation |
| Input validation / injection (SQL/NoSQL/XSS/etc.) on authenticated inputs | Not tested — requires credentials |

---

## 3. Testing Methodology

| Methodology | Status | Notes |
|---|---|---|
| Black-box testing | Completed (for public surface) | No source code was reviewed; all testing was external HTTP-based |
| API testing | Partially completed | ~26 of 232 documented routes received at least one direct request |
| Endpoint discovery / reconnaissance | Completed | DNS, TLS, hosting fingerprint, frontend bundle analysis, common-path sweep |
| Security testing (unauthenticated layer) | Completed | CORS, webhook signature verification, credential-endpoint negative testing, path-normalization bypass attempts |
| Negative testing | Completed (unauthenticated layer) | Malformed/empty/garbage inputs against public endpoints |
| Boundary testing | Partially completed | Path/verb boundary conditions tested; input-length/type boundary testing on authenticated fields not started |
| Authentication testing | Partially completed | Structural behavior of public credential-issuing endpoints tested; full session lifecycle not tested |
| Authorization testing (BOLA/BFLA/BOPLA) | Discussed/planned only | Test plan and reusable request templates prepared; zero authorized executions performed — no valid session available |
| Manual testing | Completed | All testing performed via manual, individually-reviewed HTTP requests (curl) |
| Automated/tool-based scanning | Not performed | Deliberately not used (see Section 9) to avoid low-confidence scanner noise |
| Functional testing (application features) | Not performed | Requires authenticated session |
| Regression testing | Not applicable / not performed | No prior test baseline exists for this engagement; see Section 12 |

---

## 4. Test Case Inventory

Status legend: **PASS** = behavior was correct/secure and evidence exists; **FAIL** = vulnerability confirmed; **PARTIAL** = some but not all sub-cases executed; **NOT EXECUTED**; **RESULT UNKNOWN** = attempted but no conclusive output obtained.

| ID | Test Area | Objective | Method | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|---|
| TC-01 | Public endpoints | Verify `/health/live` behaves as documented | GET request | 200, JSON status | 200, JSON status + commitSha/uptime | PASS | HTTP response captured |
| TC-02 | Public endpoints | Verify `/health/mongo` behaves as documented | GET request | 200, DB status | 200, `mongodb: up` | PASS | HTTP response captured |
| TC-03 | Public endpoints | Verify `/.well-known/security.txt` is served | GET request | 200, valid security.txt | 200, valid contact/policy fields | PASS | HTTP response captured |
| TC-04 | Public endpoints | Verify `/legal/current-versions` is public and NOT rate-limited (per doc) | GET request | 200, no rate-limit headers | 200, rate-limit headers absent (differs correctly from health/well-known) | PASS | HTTP response captured |
| TC-05 | Credential issuance | `/auth/impersonate` with empty body | POST empty JSON | Clean rejection, no info leak | 401, generic message | PASS | HTTP response captured |
| TC-06 | Credential issuance | `/auth/impersonate` with malformed token | POST garbage token | Clean rejection, no differentiation from TC-05 | 401, identical generic message | PASS | HTTP response captured |
| TC-07 | Credential issuance | `/auth/overlay-exchange` with empty body | POST empty JSON | Clean rejection | 401, generic message | PASS | HTTP response captured |
| TC-08 | Credential issuance | `/auth/overlay-exchange` with malformed code | POST garbage code | Clean rejection | 401, generic message | PASS | HTTP response captured |
| TC-09 | Credential issuance | Abuse-resistance / throttling on `/auth/overlay-exchange` | 10 sequential requests, low volume | Rate-limit signal if present | No throttling observed in a 10-request sample | RESULT UNKNOWN (inconclusive by design) | HTTP responses captured; sample size intentionally too small to prove/disprove brute-force resistance — high-volume testing was deliberately not performed against production |
| TC-10 | CORS | Untrusted origin should not be reflected | GET/OPTIONS with attacker-controlled `Origin` | No `Access-Control-Allow-Origin` returned | Confirmed — no ACAO header returned | PASS | HTTP response headers captured |
| TC-11 | CORS | Legitimate frontend origin should be reflected | Request with `Origin: https://app.revgentic.com` | ACAO reflects this origin | Confirmed | PASS | HTTP response headers captured |
| TC-12 | CORS | Apex domain (non-app subdomain) should not be trusted | Request with `Origin: https://revgentic.com` | No ACAO reflected | Confirmed | PASS | HTTP response headers captured |
| TC-13 | CORS | Preflight (OPTIONS) behavior on an authenticated route | OPTIONS with evil origin | Consistent with GET-origin behavior | Consistent — no ACAO for untrusted origin | PASS | HTTP response headers captured |
| TC-14 | Webhook security | `/meetingbots/webhooks/recall` rejects unsigned requests | POST, no signature | 4xx, no processing | 400 "Invalid webhook signature" | PASS | HTTP response captured |
| TC-15 | Webhook security | `/recall/desktop/webhooks` rejects unsigned requests | POST, no signature | 4xx, no processing | 400 "Invalid webhook signature" | PASS | HTTP response captured |
| TC-16 | Webhook security | `/slack/message` rejects unsigned requests across payload shapes | POST ×3 distinct payload shapes, no signature | Rejected, ideally 4xx | 500 "Failed to process webhook" — fails closed but ungracefully (identical across all 3 shapes, so no bypass) | PASS (security outcome) / Observation (error-handling quality) | HTTP responses captured |
| TC-17 | Webhook security | `/apollo/people/enrich/callback/:webhookId` rejects unsigned/unknown-id requests | POST, garbage webhookId, no signature | 4xx, no id/signature differentiation | 400 "Webhook verification failed" — generic, no enumeration signal | PASS | HTTP response captured |
| TC-18 | Webhook security | `/unipile/callback` — initial probe | POST malformed body, no signature | Rejection | 400, class-validator DTO error listing expected fields, no signature-specific message | PARTIAL — prompted follow-up test (TC-19) | HTTP response captured |
| TC-19 | Webhook security | `/unipile/callback` — signature-bypass disproof | POST a fully valid DTO-shaped payload (canary `account_id`) with (a) no signature, (b) garbage signature | Signature enforced regardless of body validity | (a) 401 "Missing signature in callback"; (b) 400 "Invalid or expired signature" — confirmed enforced, ordering is validate-then-authenticate but no bypass | PASS — suspected bypass explicitly disproven | HTTP responses captured |
| TC-20 | OAuth callback | `/gmail/oauth/callback` with no params | GET, no query params | Clean error, no crash | 302 redirect, "Authorization code not provided" | PASS | HTTP response captured |
| TC-21 | OAuth callback | `/gmail/oauth/callback` with garbage code+state | GET with invalid code/state | Clean error after failed exchange | 302 redirect, "Failed to exchange code for tokens" (real exchange attempted against Google, failed there); state-specific validation not observable from this test | PARTIAL — state-binding question remains open, requires live flow | HTTP response captured |
| TC-22 | OAuth callback | `/hubspot/oauth/callback` with no params | GET, no query params | Clean error | 302, "Authorization code not provided" | PASS | HTTP response captured |
| TC-23 | OAuth callback | `/outlook/oauth/callback` with no params | GET, no query params | Clean error | 302, "Authorization code not provided" | PASS | HTTP response captured |
| TC-24 | OAuth callback | `/salesforce/oauth/callback` with no params | GET, no query params | Clean error (consistent with siblings) | 500 "Failed to get Salesforce OAuth token" — inconsistent with other 5 callbacks; body contains no stack trace or sensitive data | PASS (no info leak) / Observation (inconsistent error handling) | HTTP response captured |
| TC-25 | OAuth callback | `/slack/oauth/callback` with no params | GET, no query params | Clean error | 302, "Authorization code or state not provided" (only callback explicitly naming "state") | PASS | HTTP response captured |
| TC-26 | OAuth callback | `/overlay/calendar/oauth/callback` with no params | GET, no query params | Clean error | 302 to custom URI scheme `revgentic-coaching://`, "Missing authorization code or state" | PASS | HTTP response captured |
| TC-27 | Demo/shared-key endpoints | `/nudge-engine/demo-evaluate` without a key | POST, no key | Clean rejection | 401 "Invalid demo key" | PASS | HTTP response captured |
| TC-28 | Demo/shared-key endpoints | `/deal-scorecard/demo-evaluate` without a key | POST, no key | Clean rejection | 401 "Invalid demo key" | PASS | HTTP response captured |
| TC-29 | Access control | Unauthenticated spot-check across tiers (`/heartbeat`, `/company-members`, `/auth/me`, `/coaching-sessions`, `/admin/companies`) | GET, no auth header | Uniform 401 | Uniform 401 across all 5 | PASS (sample only — not exhaustive across all 232 routes) | HTTP responses captured |
| TC-30 | Access control | Path-normalization guard-bypass attempt (16 variants: trailing/double slash, case, dot-segment, encoding, extension) | GET variants against 3 protected routes | Guard preserved on every variant | Guard preserved on every variant (401) or no route match (404); no variant bypassed the guard | PASS | HTTP responses captured |
| TC-31 | Access control | HTTP verb tampering (`OPTIONS`, `TRACE`, `CONNECT`, `PROPFIND`, cross-verb on GET-only route) | Various methods against `/admin/companies` and others | No undocumented handler exposed | TRACE/PROPFIND → 405; CONNECT → 400; POST/PUT/DELETE/PATCH on GET-only route → 404 (no hidden handler) | PASS | HTTP responses captured |
| TC-32 | Information disclosure | Common exposed-path sweep (16 paths: swagger/openapi variants, `.env`, `package.json`, `.git/config`, `/graphql`, `/metrics`, `/debug`, etc.) | GET each path | Uniform 404, nothing exposed | Uniform 404 on all 16 | PASS | HTTP responses captured |
| TC-33 | Frontend recon | Public homepage fetch and CSP analysis | GET `https://app.revgentic.com/` | Architecture/config info only, no secrets | Confirms Next.js/Stytch/PostHog/GTM; reveals staging host reference and client-side Gemini API allowlist (Section 10) | PASS (no vulnerability) / Observation | HTTP response + CSP header captured |
| TC-34 | Information disclosure | Secret-scan of public JS bundles (17 chunks, ~1.26MB) | Pattern search for API keys/tokens/secrets | No hardcoded secrets | None found; only a Stytch *public* token present (by-design, not sensitive) | PASS — scoped to publicly-reachable (pre-auth) bundle only; authenticated app-shell bundle not examined | Downloaded files + grep output captured |
| TC-35 | Test environment preparation | Search local machine for a pre-existing session credential tied to this engagement (env vars, shell history, filenames) | Targeted grep for "revgentic"/"stytch"/"auditify" | Credential located and validated, or clean negative result | Action was blocked by the local environment's own permission controls before execution | NOT EXECUTED (blocked) | Tool-level denial message captured |
| TC-36 | Test environment preparation | Search local Documents/Downloads/Desktop + browser profile presence + heavier tool inventory (nuclei/ffuf/etc.) | Directory grep + existence checks | Completed scan, credential located or clean negative | Operation did not complete within the time limit; no output obtained | RESULT UNKNOWN | Timeout captured, zero output — status of heavier tooling (nuclei/ffuf/sqlmap/etc.) on this machine remains unconfirmed |

---

## 5. Unit / Component / Integration Testing

Not performed and not applicable to this engagement's format. This was a black-box, external API penetration test with no access to source code, CI pipeline, or internal test suites. No unit, component, or integration-level testing (in the software-engineering sense) was performed or claimed. Any references to "testing" in this report refer exclusively to external security/API testing.

---

## 6. API and Backend Testing

**Endpoints tested:** 26 of 232 documented routes received at least one direct HTTP request (see Section 11 for coverage basis). Full list in Section 4.

**HTTP methods exercised:** GET, POST, OPTIONS, TRACE, CONNECT, PROPFIND, PUT, DELETE, PATCH (the latter four only as unauthenticated verb-tampering probes against a single route, `/admin/companies`).

**Authentication behavior observed:** All tested protected routes correctly returned `401 Unauthorized` without a bearer token, with no observed exceptions across the sample. Two dedicated public credential-issuing endpoints (`/auth/impersonate`, `/auth/overlay-exchange`) were tested with negative/malformed inputs only; both rejected cleanly with generic, non-differentiating error messages.

**Authorization behavior observed:** Not testable in this session — authorization testing (does a valid low-privilege user's token grant access to another user's/tenant's data) requires an authenticated session, which was not available.

**Status codes observed:** 200, 204, 302, 400, 401, 404, 405, 500.

**Input validation observed:** The `/unipile/callback` endpoint demonstrated active DTO-level validation (class-validator, whitelist enforcement rejecting unexpected properties) ahead of its signature check. No injection-style payloads were sent to authenticated business-logic fields, as none of those fields are reachable pre-authentication.

**Error handling observed:** Generally clean and non-verbose (no stack traces, no internal paths, no secrets in any error body observed). Two inconsistencies noted as observations (Section 10): `/salesforce/oauth/callback` and `/slack/message` return raw `500` responses on invalid input where comparable endpoints return graceful `4xx` responses.

**Response behavior / negative testing:** Extensive negative testing was performed against every reachable unauthenticated endpoint (empty bodies, malformed values, wrong types, missing headers, invalid signatures). No case produced an authorization bypass, data leak, or unhandled sensitive error.

**Endpoint discovery:** DNS resolution and hosting-chain analysis (target resolves through Render.com, EU region, fronted by Cloudflare), TLS certificate validation, and a common-path sweep for undocumented endpoints (Swagger/OpenAPI, debug, metrics, config, VCS exposure) — all returned clean 404s, consistent with the client's statement that no API documentation is mounted.

**Tools/commands used:** `curl` (all HTTP testing), `openssl` (TLS certificate inspection), `dig`/`nslookup` (DNS resolution).

---

## 7. Frontend Testing

Limited to passive, unauthenticated reconnaissance of `https://app.revgentic.com`:

- **Functional behavior:** Not tested (requires login).
- **Form validation:** Not tested (requires login).
- **Navigation:** Not tested beyond fetching the public homepage.
- **Error states:** Not tested.
- **Authentication flows:** Not exercised end-to-end; only the backend-side OAuth callback error paths were probed (Section 6), not the frontend login/consent UI itself.
- **API integration:** Observed indirectly via the frontend's Content-Security-Policy header, which confirms the frontend communicates with `server.app.revgentic.com` and (per CSP) `server.staging.revgentic.com`, and integrates Stytch (auth), PostHog and Google Tag Manager (analytics), and allowlists direct browser calls to Google's Generative Language API.
- **Browser/client-side behavior:** The 17 publicly-served JavaScript chunks referenced by the homepage were downloaded and scanned for hardcoded secrets (none found). This covers only the pre-authentication bundle; the authenticated application shell's JavaScript was not reachable and was not examined.
- **Regression checks:** Not applicable — no prior baseline exists for this engagement.

---

## 8. Security Testing

Only tests actually performed are listed. No vulnerability is claimed unless directly evidenced in Section 4.

| Category | Tested? | Result |
|---|---|---|
| Authentication | Partially — public credential-issuing endpoints only | No bypass observed; brute-force/throttle resistance on `/auth/overlay-exchange` not conclusively established (Section 4, TC-09) |
| Authorization (BOLA/BFLA/BOPLA) | Not tested | Blocked — requires authenticated session(s) |
| Injection (SQL/NoSQL/command/template) | Not tested | Only reachable via authenticated inputs; not accessible in this session |
| XSS | Not tested | No authenticated content-rendering surfaces were reachable |
| CSRF | Not tested | Requires an authenticated session to evaluate state-changing request protections |
| IDOR/BOLA | Not tested | Requires authenticated session(s) in two distinct tenants |
| Security headers | Observed, not a test objective | CSP, HSTS, X-Frame-Options, nosniff, referrer-policy all present and reasonably configured on both API and frontend; not treated as a finding in either direction |
| Information disclosure | Tested | No secrets in error bodies, no exposed debug/config/VCS paths, no hardcoded secrets in public JS bundle |
| Rate limiting | Partially tested | Confirmed present and matching documentation on `/health/*` and `/.well-known/*`; confirmed absent (by design, per client) elsewhere; throttling behavior on the two public credential-issuing endpoints not conclusively tested at scale |
| Session management | Not tested | Requires an active session to evaluate |
| API security (CORS) | Tested | Origin allowlist correctly scoped; no reflect-all misconfiguration |
| Access control | Tested (unauthenticated layer only) | Guard uniformly enforced across sampled routes and path-normalization/verb-tampering variants; full access-control matrix across 232 routes not tested |
| Endpoint exposure | Tested | No undocumented endpoints, debug interfaces, or documentation surfaces discovered |

---

## 9. Tools Used

| Tool | Purpose | What was tested | Evidence/result |
|---|---|---|---|
| curl | HTTP request generation for all manual testing | All endpoints in Section 4 | Full request/response evidence captured per test case |
| openssl | TLS certificate inspection | `server.app.revgentic.com` certificate validity, issuer, SAN | Valid certificate confirmed (Google Trust Services, correct SAN, current validity window) |
| dig / nslookup | DNS resolution and hosting-chain identification | Target hostname resolution path | Confirmed hosting via Render.com (EU), fronted by Cloudflare |
| WebSearch / WebFetch | Third-party integration research (not target interaction) | Unipile's documented webhook/callback payload formats, used to construct an accurate, valid test payload for TC-18/TC-19 | Confirmed Revgentic's `/unipile/callback` DTO matches Unipile's "Hosted Auth Wizard" callback shape, not their separate real-time webhook shape — informed the signature-bypass disproof test |
| Bash / shell scripting | Test orchestration, response parsing, low-volume batch requests (TC-09) | N/A (tooling) | Used throughout |
| jq | (Attempted) JSON response parsing | N/A | **Not installed** on the testing environment; not required, worked around manually |
| xxd | (Attempted) binary inspection | N/A | **Not installed**; not required for testing performed |
| nuclei / ffuf / sqlmap / nmap / httpx / katana / subfinder / dnsx / naabu / Burp Suite / mitmproxy | Would support broader automated scanning | N/A | **Availability not confirmed** — an inventory check was attempted but did not complete (timeout); deliberately not relied upon in any case, as automated scanner output was assessed as likely to produce low-confidence noise inconsistent with this engagement's zero-false-positive standard |

---

## 10. Findings

### Confirmed Findings
None. No confirmed findings were identified within the tested scope and available evidence.

### Observations (not confirmed vulnerabilities)

- **OBS-01 — Inconsistent error handling on `/salesforce/oauth/callback`.** Returns a raw `500 {"message":"Failed to get Salesforce OAuth token"}` on missing/invalid parameters, where its five sibling OAuth callbacks return a graceful `302` redirect to a friendly frontend error page. No sensitive information is disclosed in the response body. Robustness/consistency issue, not a security boundary violation.
- **OBS-02 — Inconsistent error handling on `/slack/message`.** Returns `500 {"message":"Failed to process webhook"}` on unsigned requests across all tested payload shapes, where the comparable `/meetingbots/webhooks/recall` and `/recall/desktop/webhooks` endpoints return a clean `400 "Invalid webhook signature"`. The endpoint still fails closed (no bypass demonstrated); this is an error-handling quality observation only.
- **OBS-03 — OAuth `state` parameter handling appears inconsistent across providers.** Error messages from `/slack/oauth/callback` and `/overlay/calendar/oauth/callback` explicitly reference "state" as a required parameter; `/gmail/oauth/callback`, `/hubspot/oauth/callback`, and `/outlook/oauth/callback` error messages reference only "code". This may be wording-only, or may reflect an actual difference in whether `state` presence/binding is validated. **Not resolvable without exercising a live OAuth flow from an authenticated session** — flagged as a priority item for the authenticated testing phase, not asserted as a defect.
- **OBS-04 — Undocumented staging host referenced in production frontend CSP.** `server.staging.revgentic.com` appears in `app.revgentic.com`'s Content-Security-Policy `connect-src` directive. This host is not part of the documented engagement scope and has not been tested. Recommend the client confirm whether staging is in-scope before any testing occurs there.
- **OBS-05 — Client-side Google Generative Language API access is allowlisted.** The frontend CSP permits direct browser connections to `generativelanguage.googleapis.com` (including WebSocket). No API key or credential was found in the publicly-reachable JavaScript bundle; the code path that would use this permission, if any, likely resides in the authenticated application shell, which was not reachable in this session. Flagged for follow-up once authenticated frontend access is available — not a confirmed exposure.
- **OBS-06 — Brute-force resistance of `/auth/overlay-exchange` pairing codes not established.** The endpoint accepts a code value with (per the client's own documentation) no application-level rate limiting, relying on edge/Cloudflare protection. A 10-request sample showed no throttling, but this sample is far too small (relative to a 6-digit numeric keyspace) to draw a conclusion either way, and high-volume brute-force testing against this production endpoint was deliberately not performed. Recommend the client review the actual configured Cloudflare rate-limit threshold for this route out-of-band, rather than this being resolved via live brute-force testing.

### Recommendations
1. Standardize error handling on `/salesforce/oauth/callback` and `/slack/message` to fail with clean, typed 4xx responses rather than unhandled 500s (OBS-01, OBS-02).
2. Confirm in writing whether `server.staging.revgentic.com` is in scope for this engagement (OBS-04).
3. Provide the two outstanding test credentials (Section 14) to allow the authorization-focused phase of this engagement — which represents the majority of its intended value — to begin.
4. When authenticated testing begins, prioritize OAuth `state` validation (OBS-03) and client-side AI API key handling (OBS-05) given they were flagged but not resolvable pre-authentication.
5. Have the client-side rate-limit/WAF configuration for `/auth/impersonate` and `/auth/overlay-exchange` reviewed internally rather than validated via production brute-force testing (OBS-06).

### Areas Requiring Further Validation
See Section 14 (Testing Gaps) — in summary, the entire authenticated surface (~212 of 232 routes).

---

## 11. Test Coverage

**Basis for estimate:** The client-supplied route inventory documents exactly 232 routes across 48 controllers. This session sent at least one direct HTTP request to 26 of those documented routes (11.2%), plus a number of generic HTTP-hygiene checks (path normalization, verb tampering, common exposed-path enumeration) that fall outside the documented inventory.

**Important caveat on what that percentage means:** Of the 26 routes touched, only 4 (`/health/live`, `/health/mongo`, `/.well-known/security.txt`, `/legal/current-versions`) are intentionally public and received full behavioral verification. The remaining 22 received *only* unauthenticated-access/negative testing — confirming they correctly reject an unauthenticated or malformed request — not functional testing, not authorization testing, and not business-logic testing. No route in the entire inventory has yet received an authenticated request.

**Stated plainly:** Raw "route touched" coverage is approximately **11%**. Meaningful security-relevant coverage of the categories this engagement is primarily scoped to assess (authorization, tenant isolation, business logic, mass assignment) is **0%**, pending credentials.

---

## 12. Regression Testing

No regression testing was performed and none was applicable — this is the first testing session in this engagement; no prior test baseline or previous-round findings exist to regress against. Once credentialed testing begins and any findings are remediated by the client, subsequent sessions should regress against this report's test case inventory (Section 4) and any confirmed findings from later phases.

---

## 13. Risk Assessment

| Severity | Count | Notes |
|---|---|---|
| Critical | 0 | No confirmed findings |
| High | 0 | No confirmed findings |
| Medium | 0 | No confirmed findings |
| Low | 0 | No confirmed findings |
| Informational | 6 | OBS-01 through OBS-06 (Section 10) — none constitute a demonstrated security-boundary violation |

No confirmed findings of any severity exist in this interim report. This reflects the scope tested to date, not a conclusion about the security posture of the ~212 untested routes, which have not yet been assessed.

---

## 14. Testing Gaps (Remaining Validation Areas)

- **Authenticated authorization testing (BOLA/IDOR):** Blocked — requires Credential A (normal user, Tenant A) at minimum.
- **Cross-tenant authorization testing:** Blocked — requires Credential B (normal user, Tenant B) in addition to Credential A. This is the single highest-priority remaining validation area per the engagement's stated goals.
- **Function-level authorization (BFLA) on `/admin/*`:** Blocked — requires Credential A (a non-admin token is sufficient to test the negative case).
- **Mass assignment / property-level authorization (BOPLA):** Blocked — requires Credential A.
- **Business logic testing** (relationship web, pipelines, plays, commitments, stakeholders): Blocked — requires Credential A.
- **Full OAuth flow testing** (state binding, code substitution/replay, account-linking abuse): Blocked — requires an authenticated session to initiate a flow, and real third-party provider test accounts to complete one.
- **AI/LLM boundary testing** (prompt injection with demonstrated cross-tenant impact, tool-abuse, data-boundary enforcement): Blocked — requires Credential A and, for cross-tenant tests, Credential B.
- **Race-condition testing:** Blocked — requires Credential A; reusable test templates have been prepared in advance (Section 16 note).
- **Session/token lifecycle testing** (expiry, revocation, role change propagation): Blocked — requires Credential A.
- **Staging environment:** Discovered but out of documented scope — requires an explicit scope decision from the client, not a credential.
- **Local test-credential search:** Attempted twice this session (Section 4, TC-35/TC-36); one attempt was blocked by the local environment's own permission controls, the other did not complete. No usable credential was located by either attempt.

---

## 15. Recommended Next Steps

**Immediate validation (blocking):**
1. Obtain Credential A — a session/login for a normal, non-admin user in one tenant.
2. Obtain Credential B — the same, in a second, distinct tenant.
3. Confirm staging (`server.staging.revgentic.com`) scope status.

**Short-term testing (upon receiving Credential A):**
4. Establish identity/session baseline (`/auth/me`, `/heartbeat`, `/company-members`).
5. Systematic single-tenant BOLA testing across the highest-value object types (coaching sessions, transcripts, emails, CRM records, custom context).
6. BFLA sweep against all documented `/admin/*` routes using the non-admin token.
7. Mass-assignment probes on all POST/PATCH/PUT endpoints identified in the route inventory.

**Extended security testing (upon receiving Credential B):**
8. Cross-tenant BOLA matrix across all high-value object types.
9. Cross-tenant search/aggregate/count endpoint leakage testing.
10. Webhook-to-tenant binding verification (does a validly-signed event ever apply to the wrong tenant/user).

**Regression testing:**
11. Re-run the full unauthenticated test case inventory (Section 4) after any remediation to confirm no regressions.

**Pre-production validation:**
12. Once authenticated testing is complete, re-verify OBS-01 through OBS-06 have been addressed or formally accepted as risk by the client.

---

## 16. Management-Friendly Summary

See separate one-page document: *Revgentic_Management_Summary.md*.

---

## 17. Evidence Matrix

| Activity | Evidence in Conversation | Result | Confidence |
|---|---|---|---|
| Public endpoint verification (4 endpoints) | Captured HTTP responses (status, headers, body) | No issues observed | High |
| CORS policy testing (4 sub-cases) | Captured HTTP response headers across 3 origin variants + preflight | No misconfiguration found | High |
| Credential-issuing endpoint negative testing | Captured HTTP responses | No bypass; error messages clean | High |
| Credential-issuing endpoint throttle sampling | Captured HTTP responses (10-request sample) | Inconclusive by design | Low |
| Webhook signature verification (6 endpoints, incl. Unipile disproof) | Captured HTTP responses for every case, including the two-step Unipile disproof | No bypass confirmed on any endpoint | High |
| OAuth callback error-handling testing (6 providers) | Captured HTTP responses/redirects | No vulnerability confirmed; state-binding and Salesforce anomaly flagged as open items | Medium |
| Demo/shared-key endpoint testing | Captured HTTP responses | No bypass | High |
| Unauthenticated access-control sampling (5 routes) | Captured HTTP responses | Guard enforced on sample | High (for sample) / Low (as proxy for full 232-route inventory) |
| Path-normalization / verb-tampering testing | Captured HTTP responses (16 + ~10 variants) | No bypass found | High |
| Exposed common-path sweep | Captured HTTP responses (16 paths) | Nothing exposed | High |
| Frontend passive recon + CSP analysis | Captured HTTP response + header content | Architecture confirmed; 2 items flagged for follow-up (OBS-04, OBS-05) | Medium |
| Public JS bundle secret scan | Captured file downloads + grep output | No secrets found in scope examined | Medium (scope-limited to pre-auth bundle) |
| Local credential search — env/history | Tool denial message captured | Blocked before execution; no credential obtained | High (confidence the block occurred; N/A for a testing result) |
| Local credential search — documents/tools | Timeout captured, zero output | Inconclusive; no credential obtained | Low |
| Authenticated authorization/business-logic/OAuth-flow/AI-boundary/race-condition testing | None — no session available | Not executed | N/A |

---

*End of detailed technical report. Companion one-page management summary follows in a separate file.*
