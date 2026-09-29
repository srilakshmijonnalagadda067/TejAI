# React + Supabase user management

A no-CSS React app with Home, Register, Login, Dashboard, and Logout flows. The dashboard performs CRUD on a private directory of user records. These are directory entries, not Supabase Auth accounts.

## Run the app

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project API settings.
3. Apply the database migration in `supabase/migrations/202609290001_create_managed_users.sql` using the Supabase SQL Editor or Supabase CLI.
4. Deploy the account deletion function with `supabase functions deploy delete-account`.
5. Run `npm run dev` and open the local URL printed by Vite.

The Supabase CLI must be installed and linked to your project before using the deploy command. To require email confirmation at registration, enable it in Supabase Authentication settings.

## Security

- The browser uses only the project URL and anon key. Never put a service-role key in a `VITE_*` variable.
- Row Level Security is enabled and forced on `managed_users`. Every read/write policy compares `owner_id` with `auth.uid()`, and the `owner_id` foreign key cascades on account deletion.
- The `delete-account` Edge Function verifies the bearer token with Supabase Auth, then uses the server-side service-role key to delete only that verified caller. Supabase provides the function's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` secrets at runtime.
- The function accepts POST only (plus CORS preflight) and returns generic errors for failed privileged operations.

## Checks

```sh
npm run lint
npm run build
```
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
