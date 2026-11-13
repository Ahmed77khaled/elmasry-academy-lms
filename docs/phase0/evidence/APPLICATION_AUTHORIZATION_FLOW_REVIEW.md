# Application Authentication and Authorization Flow Review

**Scope:** Source review of `src/context/AuthContext.tsx`, `src/App.tsx`, `src/components/AppShell.tsx`, application RPC call sites, and local migration source. No authentication session was created and no Supabase project was accessed.

## Flow map

| Flow | Current behavior | Client enforcement | Server / project boundary | Review result |
|---|---|---|---|---|
| Initial load, no session | `getSession()` resolves empty; provider clears user/admin/role/permissions; `AuthenticatedApp` renders login | Login screen only | Supabase session persistence is authoritative | Expected behavior by inspection |
| Initial load, active admin | Provider sets session/user, calls `is_admin()`, then `get_my_authorization()`; app shell waits until authorization is ready | `isAdmin` opens app; permissions control nav and page content | RPCs must enforce permission using current `auth.uid()` | Intended path; authorization fetch runs even if `is_admin()` returns false, unlike auth-event path; no privilege leak established, but unnecessary request and inconsistent state handling |
| Initial load, inactive admin / ordinary user | `is_admin()` false; app renders the “not authorized” screen with sign-out action | Main application blocked by `AuthenticatedApp` | Active-admin predicate in `is_admin()` is expected to reject these identities | Fail-closed at top-level UI if response is accurate |
| Password sign-in | `signInWithPassword`; on success a fire-and-forget admin check optionally invokes `login-alert`; auth-state callback populates session and permissions | Login form displays errors from returned SDK error; successful transition depends on auth-state event | Session/JWT and active-admin RPC are authority | No auth regression test. A rejected SDK promise is not handled by `LoginPage`/`signIn`, so the form can remain loading after network rejection |
| Token refresh / auth-state update | `onAuthStateChange` clears permissions, sets loading, defers work with `setTimeout(0)`, then calls `is_admin()` and `get_my_authorization()` | Nav and main content are withheld until ready | RPC checks current JWT; definer bodies must use fixed paths and enforce active status/permissions | Fail-closed during normal refresh; overlapping callbacks are not ordered or cancelled |
| Logout / null session event | Null event clears all authorization state and stops loading | App returns to login | SDK must invalidate or remove the session | State clearing is present. No test covers sign-out error/rejection or a pending authorization callback completing after logout |
| Explicit `refreshAuthorization()` | Sets `authorizationReady=false`, rechecks `is_admin`, then reloads permissions | AppShell shows loader/error while unavailable | Server checks remain required | Denial clears admin and permissions. Authorization fetch error clears permissions but leaves `isAdmin=true`; content remains blocked by `authorizationReady=false`, but top-level app still considers the user an admin |
| Permission / route gate | `AuthenticatedApp` requires `isAdmin`; `AppShell` filters navigation and active route by permission; forms hide controls | UI gate | Every RPC must independently verify its permission / identity | Defense in depth. UI gates are not an API security boundary |

## Page authorization map

`AppShell.canAccessPage()` is evaluated both for navigation and for the active route. `settings` intentionally returns `true` for any active admin; other pages map as follows:

| Page | Required client permission |
|---|---|
| Dashboard | `dashboard.operational.read` OR `dashboard.finance.read` |
| Students / student details | `students.read` |
| Courses / course details | `courses.read` |
| Enrollments | `enrollments.read` |
| Payments | `finance.payments.read` |
| Expenses | `finance.expenses.read` |
| Cash boxes | `finance.cash_boxes.read` |
| Settings | Any active admin (`isAdmin`) |

Within Settings, finance summary is conditional on `finance.cash_boxes.read`; owner-only branding/language controls are conditional on `isOwner`; `AdminInviteForm` independently loads `get_my_authorization()` and only renders for an owner; `AdminAccessManagement` likewise verifies owner state before loading management RPCs. Profile and password changes are self-account operations.

## RPC authorization evidence

The local `20261021224440_rbac_role_aware_data_endpoints.sql` source checks `private.has_permission(...)` in role-aware read endpoints and masks fields such as student phone/email and course pricing according to permissions. The `20261021224905_rbac_permission_checked_write_endpoints.sql` source checks permissions at write boundaries (examples: `students.create`, `students.update`, `finance.payments.record`, `finance.cash_boxes.archive`, and `admins.read`). This is source evidence for the intended server boundary, not proof of every currently deployed function body or ACL. Use the [RPC routine evidence crosswalk](RPC_ROUTINE_EVIDENCE_CROSSWALK.md) for the catalog limitations.

## Findings

### P1 — Auth state requests have no latest-session guard

Initial `getSession()` and auth-state callbacks can overlap. Each event schedules an untracked timeout and async `is_admin()` / authorization requests. There is no generation counter or captured-session check before those results update React state. A delayed result from an earlier transition can overwrite newer `isAdmin`, role, or permission state. The unused `userId` argument in `verifyAdmin(userId)` does not bind its RPC to that user: `is_admin()` derives identity from the current JWT. This is a defense-in-depth and state correctness risk; server-side RPC enforcement remains the data protection boundary.

**Suggested fix:** serialize state transitions or assign each session transition a monotonically increasing generation; before every state write, confirm it is still current and the mounted provider remains active. Treat the session subject as a request label only; the server must continue to derive identity from `auth.uid()`.

### P2 — Initial and event-driven non-admin paths differ

`initAuth()` loads `get_my_authorization()` after `is_admin()` regardless of the boolean result. The auth-event path only loads authorization when `adminStatus` is true. The app still blocks the non-admin user, and the self-scoped query is expected to return no row, but unify the paths to avoid inconsistent `authorizationReady` state and unnecessary requests.

### P2 — Sign-in rejection path is not caught

`LoginPage.handleSubmit()` only handles a returned `{ error }`; a rejected promise bypasses `setLoading(false)`. Handle both returned errors and thrown/rejected calls so the user can retry. This is availability/usability, not an authorization bypass.

### P2 — Refresh failure retains `isAdmin=true`

When `is_admin()` succeeds but `get_my_authorization()` returns an error or throws, `refreshAuthorization()` clears permissions but does not clear `isAdmin`. AppShell blocks content because `authorizationReady=false`, so this is currently fail-closed for route content. Align state semantics and make the recovery action explicit.

## Focused regression cases to add

No AuthContext tests were added or run in this review. The repository has no `npm test` script or React component-test framework. Before changing this behavior, choose either an existing project-approved test setup or extract a pure session-transition coordinator that can be tested with Node's built-in test runner without adding a dependency.

| Case | Expected assertion |
|---|---|
| No stored session | Login path, no role/owner/permission state |
| Active admin sign-in | Admin shell only after admin check and authorization fetch succeed |
| Inactive admin / normal user | No application shell and no protected page content |
| Sign-in returned error and rejected promise | Error is surfaced and form returns to retryable state |
| Token refresh with changed role/permissions | Old permissions hidden during fetch; new permissions used after success |
| Account switch while prior RPC is pending | Late response from earlier transition cannot overwrite current identity state |
| Logout while authorization RPC is pending | Late result cannot restore admin/permission state; login screen remains |
| `is_admin()` error / authorization error | Sensitive routes remain blocked and user sees recoverable failure state |
| Settings as non-owner active admin | Self-account settings visible; owner controls and owner RPC data absent |
| RPC invoked after bypassing client UI | Server returns authorization error for a role without the required permission |
