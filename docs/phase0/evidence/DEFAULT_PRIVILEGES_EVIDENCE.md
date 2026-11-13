# Default Privileges (ACL) Evidence — Elmasry Academy LMS

> **Target Supabase Project:** `urmkcixqpoqkiosihhal` (TrainerPro)  

## 1. Executive Summary
- In schema `public`, objects created by `postgres` or `supabase_admin` currently grant:
  * **TABLES (`r`):** `ALL` (`arwdDxtm`) to `anon`, `authenticated`, `postgres`, `service_role`.
  * **SEQUENCES (`S`):** `SELECT, UPDATE, USAGE` (`rwU`) to `anon`, `authenticated`, `postgres`, `service_role`.
  * **FUNCTIONS (`f`):** `EXECUTE` (`X`) to `anon`, `authenticated`, `postgres`, `service_role`.
- While existing tables had permissions explicitly revoked via `REVOKE ALL`, future objects created by `postgres` will automatically inherit full read/write privileges unless `ALTER DEFAULT PRIVILEGES` is executed.
- In schema `private`, there are NO entries in `pg_default_acl`. Standard Postgres defaults apply.
- `supabase_admin` default ACLs cannot be modified by `postgres`; remediation must target `FOR ROLE postgres IN SCHEMA public`.

## 2. Grouped Default ACL Table for public/private

| Creator Role | Schema | Object Type | Grantee | Default Privileges |
| --- | --- | --- | --- | --- |
| postgres | public | FUNCTION | anon | EXECUTE |
| postgres | public | FUNCTION | authenticated | EXECUTE |
| postgres | public | FUNCTION | postgres | EXECUTE |
| postgres | public | FUNCTION | service_role | EXECUTE |
| postgres | public | SEQUENCE | anon | SELECT, UPDATE, USAGE |
| postgres | public | SEQUENCE | authenticated | SELECT, UPDATE, USAGE |
| postgres | public | SEQUENCE | postgres | SELECT, UPDATE, USAGE |
| postgres | public | SEQUENCE | service_role | SELECT, UPDATE, USAGE |
| postgres | public | TABLE | anon | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| postgres | public | TABLE | authenticated | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| postgres | public | TABLE | postgres | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| postgres | public | TABLE | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| supabase_admin | public | FUNCTION | anon | EXECUTE |
| supabase_admin | public | FUNCTION | authenticated | EXECUTE |
| supabase_admin | public | FUNCTION | postgres | EXECUTE |
| supabase_admin | public | FUNCTION | service_role | EXECUTE |
| supabase_admin | public | SEQUENCE | anon | SELECT, UPDATE, USAGE |
| supabase_admin | public | SEQUENCE | authenticated | SELECT, UPDATE, USAGE |
| supabase_admin | public | SEQUENCE | postgres | SELECT, UPDATE, USAGE |
| supabase_admin | public | SEQUENCE | service_role | SELECT, UPDATE, USAGE |
| supabase_admin | public | TABLE | anon | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| supabase_admin | public | TABLE | authenticated | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| supabase_admin | public | TABLE | postgres | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| supabase_admin | public | TABLE | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

## 3. Raw pg_default_acl Database Rows

| OID | Creator | Namespace | Object Type | Raw defaclacl |
| --- | --- | --- | --- | --- |
| 16492 | postgres | public | r | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} |
| 16493 | postgres | public | f | {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} |
| 16494 | postgres | public | S | {postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres} |
| 16495 | supabase_admin | public | S | {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin} |
| 16496 | supabase_admin | public | r | {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin} |
| 16497 | supabase_admin | public | f | {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin} |
| 16548 | postgres | storage | r | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} |
| 16549 | postgres | storage | f | {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} |
| 16550 | postgres | storage | S | {postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres} |
| 16556 | supabase_auth_admin | auth | r | {postgres=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} |
| 16557 | supabase_auth_admin | auth | S | {postgres=rwU/supabase_auth_admin,dashboard_user=rwU/supabase_auth_admin} |
| 16558 | supabase_auth_admin | auth | f | {postgres=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin} |
| 16571 | supabase_admin | graphql_public | S | {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin} |
| 16569 | supabase_admin | graphql_public | r | {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin} |
| 16570 | supabase_admin | graphql_public | f | {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin} |
| 16634 | supabase_admin | extensions | r | {postgres=a*r*w*d*D*x*t*m*/supabase_admin} |
| 16635 | supabase_admin | extensions | f | {postgres=X*/supabase_admin} |
| 16636 | supabase_admin | extensions | S | {postgres=r*w*U*/supabase_admin} |
| 16589 | supabase_admin | graphql | r | {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin} |
| 16590 | supabase_admin | graphql | f | {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin} |
| 16591 | supabase_admin | graphql | S | {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin} |
| 16561 | supabase_admin | realtime | S | {postgres=rwU/supabase_admin,dashboard_user=rwU/supabase_admin} |
| 16562 | supabase_admin | realtime | f | {postgres=X/supabase_admin,dashboard_user=X/supabase_admin} |
| 16560 | supabase_admin | realtime | r | {postgres=a*r*wdDxtm/supabase_admin,dashboard_user=arwdDxtm/supabase_admin} |
| 18243 | supabase_admin | cron | S | {postgres=r*w*U*/supabase_admin} |
| 18241 | supabase_admin | cron | r | {postgres=a*r*w*d*D*x*t*m*/supabase_admin} |
| 18242 | supabase_admin | cron | f | {postgres=X*/supabase_admin} |