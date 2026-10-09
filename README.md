# Academic Insight — Academic Performance & Early Warning System

**Academic Insight** is a role-based academic monitoring and early warning web application built for faculty advisors and students. It identifies declining academic performance and attendance shortages early, explains the exact contributing factors, and tracks faculty support interventions.

---

## 1. Authentication & Role-Based Access Control (RBAC)

Academic Insight enforces strict separation between **Faculty** and **Student** roles at both the server/database level and the route level:

- **Unauthenticated Visitors:** Redirected to `/login`; all `/api/data/*` endpoints and database queries reject unauthenticated requests (`401 Unauthorized`).
- **Student Role (`STUDENT`):**
  - Can access only `/student/portal` and retrieve **only their own student record**, marks, attendance, risk indicators, and recommendations.
  - Cannot browse the cohort directory, access `/faculty/*` routes, or query another student's ID (`403 Forbidden`).
  - Cannot modify marks, attendance, interventions, risk rules, or reset demo data (`403 Forbidden`).
- **Faculty Role (`FACULTY`):**
  - Can access `/faculty/overview`, `/faculty/students`, `/faculty/students/:id`, `/faculty/records`, and `/faculty/interventions`.
  - Authorized to view cohort analytics, edit marks/attendance, import validated CSV records, log/update interventions, configure risk rules, and reset the demo cohort.

---

## 2. Provisioned Test Accounts (For Hackathon Evaluation)

Public self-registration is intentionally disabled so arbitrary visitors cannot self-register as faculty or claim another student's identity.

The following **synthetic evaluation accounts** are pre-provisioned in the server's `scrypt`-hashed account store ([`server/provisionedAccounts.json`](file:///c:/Users/IIC%20LAB/Downloads/team%20sudo/server/provisionedAccounts.json)) and in the Supabase provisioning script ([`supabase/seed_auth_users.sql`](file:///c:/Users/IIC%20LAB/Downloads/team%20sudo/supabase/seed_auth_users.sql)):

| Role | Name | Institutional Email | Password | Bound Student Record | Standing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faculty** | Dr. Aris Thorne | `aris.thorne@demo.university.edu` | `Faculty#2026!` | Cohort-wide (`NULL`) | Faculty Advisor |
| **Student** | Aarav Mehta | `aarav.mehta@demo.university.edu` | `Student#001!` | `stu-001` (`CS2024-001`) | High Risk |
| **Student** | Rohan Deshmukh | `rohan.deshmukh@demo.university.edu` | `Student#007!` | `stu-007` (`CS2024-007`) | Medium Risk |
| **Student** | Priya Sundaram | `priya.sundaram@demo.university.edu` | `Student#015!` | `stu-015` (`CS2024-015`) | Low Risk (On Track) |

> **Security Note:** Passwords are never stored in plain text or included in frontend code. In local server mode, passwords are verified on the Node backend against `scrypt` hashes using constant-time `crypto.timingSafeEqual`, and sessions are signed with `HMAC-SHA256`.

---

## 3. Running Locally

```bash
npm install
npm run dev
```

Open **`http://localhost:5173`** and sign in with any of the provisioned accounts above.

### Verification Commands

```bash
npm run test    # Runs 12 Vitest unit + RBAC security tests
npm run lint    # Runs TypeScript strict type checking (tsc --noEmit)
npm run build   # Builds production bundle
```

---

## 4. Configuring External Supabase Auth & PostgreSQL RLS (Optional / Production)

By default, when `.env.local` is not configured, Vite mounts the built-in Node RBAC middleware ([`server/authAndDataServer.mjs`](file:///c:/Users/IIC%20LAB/Downloads/team%20sudo/server/authAndDataServer.mjs)) which enforces authentication and server-side row filtering at `/api/auth/*` and `/api/data/*`.

To connect to a live **Supabase** project:

1. Create a new Supabase project and open the **SQL Editor**.
2. Execute [`supabase/schema.sql`](file:///c:/Users/IIC%20LAB/Downloads/team%20sudo/supabase/schema.sql) to create tables, security-definer role lookup functions (`public.current_user_role()`, `public.current_student_id()`), and strict Row Level Security (RLS) policies.
3. Execute [`supabase/seed_auth_users.sql`](file:///c:/Users/IIC%20LAB/Downloads/team%20sudo/supabase/seed_auth_users.sql) in the SQL Editor to provision the authorized evaluation accounts in `auth.users` and `public.user_profiles`.
4. Copy `.env.example` to `.env.local` and set:
   ```env
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-public-anon-key>
   ```
   *(Never place a Supabase `service_role` key in `.env.local` or any `VITE_*` variable.)*
