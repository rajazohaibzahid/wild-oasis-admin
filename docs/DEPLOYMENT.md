# Deployment preparation

No production deployment has been made. Obtain approval after hosted authorization and customer compatibility checks pass.

## GitHub

Public repository: `rajazohaibzahid/wild-oasis-admin`. Original and customer repositories must remain unchanged.

The project uses a separate `main` repository. Publish only this dashboard; `.env`, local provisioning records and generated artifacts are excluded by `.gitignore`.

For a fresh GitHub setup, authenticate and publish using:

```bash
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
git config user.name "YOUR_COMMIT_NAME"
git config user.email "YOUR_VERIFIED_OR_GITHUB_NOREPLY_EMAIL"
git add .
git diff --cached --stat
# Verify .env, tokens, and runtime artifacts are excluded before committing.
git commit -m "Build Wild Oasis staff dashboard"
gh repo create rajazohaibzahid/wild-oasis-admin --public --source=. --remote=origin --push
```

The owner requested a public repository. Do not use either reference repository as the remote. Account creation is unnecessary if your existing account is used.

## Vercel

After explicit deployment approval, import the new repository as a Vite project:

- Build command: `npm run build`
- Install command: `npm ci`
- Output directory: `dist`
- Node: a current compatible 24.x release
- Environment: `VITE_SUPABASE_URL=https://flvzioghreivoxdyekya.supabase.co` and the project's publishable `VITE_SUPABASE_PUBLISHABLE_KEY`

Publishable keys are intended for frontend use. Never configure service-role/secret keys as Vite variables. `.env` is ignored; set Vercel environment variables in its project settings. `vercel.json` handles SPA deep links and basic security headers. Review a site-specific Content Security Policy before real-business release, accounting for Supabase and approved cabin image hosts.

Use a preview/staging release first. Any hosted Auth site URL/redirect changes must preserve customer application URLs and require approval. The current password flow needs no signup redirect. Verify password reauthentication, email policies, MFA, mobile navigation and deep links using the final host.

## Release gate

- Approved admin migration applied only to the NEW project.
- Exact verified staff account provisioned with owner approval.
- Live staff/customer separation, catalog uploads, RPC transitions and customer availability verified using approved staging fixtures.
- Authenticated requests use ordinary staff sessions; no privileged browser credential.
- All local checks pass; review docs/TESTING.md for mocked vs real coverage.
- Payment/refund/cancellation and retention policies accepted for the intended real or demo use.
- Explicit owner approval to deploy production.
