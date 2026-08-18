---
title: Revgentic Production API — Penetration Test Status Summary
prepared_by: Auditify Security
report_date: 2026-08-18
audience: Management / Technical Lead
status: IN PROGRESS — blocked on test credentials
---

# Revgentic Penetration Test — Management Summary

**What was tested:** The publicly-reachable attack surface of Revgentic's production API (`server.app.revgentic.com`, 232 documented routes) and its public frontend. This included every endpoint reachable without a login: health/status endpoints, the two public credential-issuing endpoints, all 6 webhook receivers (signature verification), all 6 OAuth provider callback endpoints (error handling), the two demo/shared-key endpoints, CORS policy, and a set of common HTTP-level attack classes (path-normalization auth-guard bypass attempts, HTTP verb tampering, exposed configuration/debug/documentation path checks). The public frontend's shipped JavaScript was also downloaded and scanned for hardcoded secrets.

**What was validated:** All tested endpoints behaved correctly and securely within the scope reachable pre-authentication — access controls were consistently enforced, webhook signature verification held up under direct testing (including one lead that initially looked like a possible signature bypass on the Unipile webhook and was disproven through follow-up testing), CORS is correctly origin-scoped rather than permissive, and no secrets, debug interfaces, or documentation endpoints were found exposed.

**What was observed:** Six non-security-critical observations were logged for follow-up — two endpoints with inconsistent (but safely fail-closed) error handling, an inconsistency in how OAuth callbacks reference the `state` parameter across providers, an undocumented staging host referenced in the frontend's security policy, a client-side allowlist for direct calls to Google's AI API with no exposed key found in the reachable bundle, and an inconclusive result on brute-force resistance for one credential endpoint (sample intentionally kept small to avoid live brute-forcing production). None of these are confirmed vulnerabilities.

**Current status:** No confirmed findings were identified within the tested scope and available evidence. This reflects thorough coverage of the ~11% of the route inventory reachable without authentication — it is not a statement about the application as a whole.

**The critical gap:** Approximately 89% of the documented API (the authenticated surface, where this engagement's primary objectives — cross-tenant data isolation, authorization, business logic — actually live) has not yet been tested. Testing is fully prepared to proceed (test plan and request templates are built) but requires two test credentials that have not yet been supplied: a standard test-user login in one company/tenant, and a second in a different tenant. This is an access/provisioning dependency, not a testing delay.

**What remains to be validated:** Cross-tenant and single-tenant authorization testing, admin-function access control, mass-assignment/write-authorization testing, business-logic and workflow testing, full OAuth account-linking flows, and AI-boundary testing — collectively the majority of this engagement's intended scope.

**Recommended immediate action:** Issue the two outstanding test credentials so authenticated testing can begin without further delay.
