# PRD: Organization Signup (Register Page + `/auth/signup`)

Fills known gap #4 from `AGENTS.md` ("no `/auth/signup` endpoint; tenants inserted directly"). Establishes the public self-service entry point that creates a new tenant and its owner in one step. Complements the existing login flow and the owner-outside-RBAC model established in `prd-rbac-v2.md` / `prd-rbac-refinements.md`.

---

## Problem Statement

New restaurants and cafés have no way to start using ChefLab on their own. There is a login page but no registration: an organization (tenant) and its first user can only be inserted directly into the database by a developer. A prospective customer who lands on the app cannot create an account, cannot get a workspace, and cannot begin managing recipes without manual onboarding.

## Solution

From the user's perspective:

- A prospective customer opens a **Register** page, enters their **organization name**, their own **name**, **email**, **password** (with confirmation), and **preferred language** (English or Arabic), and submits.
- On success they are **immediately signed in** and dropped straight into the application — no separate "now go log in" step.
- The account they created is a brand-new **organization** in which they are the **owner**. As owner they hold no role and sit outside RBAC (full access). After entering, they create the organization's initial role(s) and then invite/create additional users.
- Email is **globally unique**. If the email is already registered anywhere in ChefLab, registration is refused with a clear message ("Email already registered") rather than a generic failure.
- Password must meet the existing strength rules already enforced for user creation (minimum 10 characters, upper + lower + number + special character). The confirmation field must match.

## User Stories

### Registering a new organization
1. As a prospective customer, I want a Register page reachable from the login screen, so that I can create an account without contacting anyone.
2. As a new customer, I want to name my organization during signup, so that my workspace is identified as my restaurant/café from the start.
3. As a new customer, I want to provide my own name, email, and password, so that I have a personal owner account to sign in with.
4. As a new customer, I want to confirm my password, so that I don't lock myself out with a typo.
5. As a new customer, I want to choose English or Arabic as my preferred language at signup, so that the app speaks my language immediately.
6. As a new customer, I want to be signed in automatically after registering, so that I can start using the app without a second login step.
7. As a new customer, I want to land inside the application after signup, so that I can immediately begin setting up roles, ingredients, and recipes.
8. As the person who registered, I want to be the owner of the organization I created, so that I have full access without needing a role assigned to me.

### Validation and error handling
9. As a new customer, I want to be told when my email is already registered, so that I know to log in or use a different address instead of retrying blindly.
10. As a new customer, I want a clear message when my password is too weak, so that I know exactly which rule (length, uppercase, lowercase, number, special character) I failed.
11. As a new customer, I want to be told when my password and confirmation don't match, so that I can correct it before submitting.
12. As a new customer, I want required fields (organization name, name, email, password) to be validated, so that I can't submit an incomplete registration.
13. As a new customer, I want a validation failure to leave my entered data intact, so that I don't retype everything after fixing one field.
14. As a new customer, I want the confirm-password field to never be stored, so that only my real credential is persisted.

### Integrity of the created tenant
15. As a developer, I want every committed organization to have an owner, so that no tenant exists in a half-created ownerless state.
16. As a developer, I want organization + owner user creation to be atomic, so that a failure partway through leaves no orphan organization or orphan user.
17. As a developer, I want the owner user to be created with no role (`roleId = null`), so that ownership — not a role — is the source of the owner's full access, consistent with the existing owner-outside-RBAC model.
18. As a developer, I want email uniqueness enforced at the database level, so that two organizations can never register the same email and break email-based login.

### Consistency with existing auth
19. As a signed-in owner, I want the signup response to match the login response (`{ token, user }`), so that the frontend reuses the exact same session-establishment path.
20. As an owner, I want my session to reflect `isOwner: true`, so that the UI grants me full access from the first screen.
21. As a returning owner, I want to log in normally afterward with the same email and password, so that signup and login are consistent.

## Implementation Decisions

**Scope split.** Backend adds the signup capability; frontend adds only the Register page and wires it to the new endpoint. The authentication shell (routing, axios client, token storage, login page) already exists and is reused unchanged.

**New endpoint.**
- `POST /auth/signup` — **public** (no auth middleware).
- Request body: `{ organizationName, name, email, password, confirmPassword, preferredLanguage }`.
- Success: **201** with `{ token, user }`, identical in shape to `POST /auth/login`.
- `preferredLanguage` is one of `"en"` / `"ar"`.

**Validation (Zod, in the auth module).** A new `signupSchema` validates the body. The existing `passwordRule` (min 10, upper/lower/number/special) defined in the users module is reused as the single source of password truth rather than redefined. `confirmPassword` is validated to equal `password` via a refinement and is **never** persisted. `ZodError` → **400** with `{ errors }`, matching existing controller convention.

**Service behavior — atomic tenant creation.** `authService.signup` runs a single `prisma.$transaction`:
1. Create the `Organization` with `ownerUserId = null`.
2. Create the first `User` in that organization with `roleId = null`, `preferredLanguage` as given, and a bcrypt password hash (cost 10, matching existing user creation).
3. Update the organization's `ownerUserId` to the new user's id.

`ownerUserId` remains nullable only to permit this two-phase insert; the service guarantees every committed organization ends with an owner. The transaction ensures no orphan org/user survives a mid-flight failure.

**Owner identity.** The owner holds no role. The existing `isOwner` logic (`utils/permission.js`, comparing `organization.ownerUserId` to the request user) and `toAuthUser` mapper already derive owner status and full permissions from ownership, not a JWT flag — so no JWT payload change is needed. The signup response is built through the same `toAuthUser` mapper, with the user loaded including `organization { ownerUserId }` and `role` so `isOwner` resolves to `true`.

**Duplicate email handling.** Email becomes globally unique (see schema change). A duplicate on signup surfaces as Prisma **P2002**, caught in the service and rethrown as a friendly error; the controller maps it to **409** with a clear "Email already registered" message rather than a generic 500.

**JWT.** Token issued via the existing `generateToken` with payload `{ userId, organizationId, roleId }` where `roleId` is `null` for the owner. No structural change to the payload.

**Schema change (migration required).**
- `User.email` becomes **globally unique** (`@unique`); the previous per-tenant composite `@@unique([organizationId, email])` is dropped as redundant/weaker.
- `@@unique([id, organizationId])` is retained.
- Requires a Prisma migration + `prisma generate`. Precondition: no cross-organization duplicate emails currently exist (confirmed by the developer), so the unique index applies cleanly.

**Frontend.** A Register page (organization name, name, email, password, confirm password, language selector) posts to `/auth/signup`, then reuses the existing login success path — store `token`, set `user`, redirect into the app. Client-side it mirrors the same required-field, password-match, and password-strength checks for fast feedback, but the backend remains authoritative.

## Testing Decisions

**What makes a good test here:** exercise the feature through its external seam — the HTTP endpoint — and assert on observable behavior (status code, response shape, resulting persisted state, ability to log in afterward), never on internal function calls or transaction mechanics.

**Primary seam (single, highest point): `POST /auth/signup`.** Prefer this one HTTP seam over unit-testing the service, controller, and validation separately. Cases to cover:
- Happy path → 201, response is `{ token, user }`, `user.isOwner === true`, `user.roleId === null`; the returned token authenticates against `GET /auth/me`.
- Created organization has `ownerUserId` equal to the new user's id (integrity story).
- Duplicate email (same address as an existing user in any org) → 409, "Email already registered", and no new organization/user is persisted.
- Password fails a strength rule → 400 with a field error naming the failed rule.
- `confirmPassword` ≠ `password` → 400.
- Missing required field → 400.
- Invalid `preferredLanguage` → 400.
- Post-signup: the new owner can `POST /auth/login` with the same credentials and receives an equivalent session.

**Prior art.** Model the tests on existing auth/login request-level tests and the users module's unique-email conflict test, reusing their request harness and database setup/teardown so signup tests match established patterns.

**Frontend.** The Register page follows the existing login page's testing approach (if any): render, fill, submit, assert redirect/session on success and inline errors on the documented failure cases.

## Out of Scope

- Email verification / confirmation links.
- Inviting or creating additional users during signup (owner does this after entering).
- Creating default roles automatically at signup — the owner defines role(s) afterward.
- Organization-level fields beyond `name` (billing, plan/subscription, logo, address).
- Password reset / forgot-password flows.
- CAPTCHA, rate limiting, or other anti-abuse measures on the public endpoint.
- Social / SSO signup.
- Transferring ownership or changing the owner after creation.
- RBAC enforcement changes (handled by the RBAC PRDs).

## Further Notes

- The globally-unique email decision is deliberate: email-based login (`login()` looks up by email alone) is only correct if email is unique across all tenants. This PRD makes that guarantee real at the database level rather than by convention.
- Because owner status is derived live from `organization.ownerUserId` (not cached in the JWT), an owner's full access is immediate and survives future ownership changes without reissuing tokens — no signup-specific token handling is needed.
- The two-phase org→user→org-update insert is the accepted consequence of the mutual reference between `Organization.ownerUserId` and `User.organizationId`; the transaction is what keeps it safe.
