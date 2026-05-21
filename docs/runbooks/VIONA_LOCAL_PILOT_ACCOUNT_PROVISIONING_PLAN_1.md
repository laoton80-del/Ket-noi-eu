# VIONA Local pilot account provisioning (staging)

**Pack:** `VIONA.LOCAL.STAGING_PILOT_ACCOUNT_PROVISIONING.1`  
**Script:** `scripts/provision-local-pilot-accounts-staging.ts`  
**Staging project ref:** `euqbfanilcssjiwwtcby` (`viona-staging-eu`)

## Preconditions

- `DATABASE_URL` and `DIRECT_URL` contain staging ref `euqbfanilcssjiwwtcby`
- `JWT_SECRET` set (API login)
- `EXPO_PUBLIC_REST_API_BASE` set (e.g. `http://127.0.0.1:8787`)
- Operator PIN in `.env.local` (never commit): `VIONA_PILOT_PIN` (min 6) or per-user `VIONA_PILOT_*_PIN`

## Run

```bash
npx tsx scripts/provision-local-pilot-accounts-staging.ts
```

## Pilot labels

| Label | Role | Default phone |
|-------|------|---------------|
| `viona-local-user-a` | B2C | `+420910000001` |
| `viona-local-user-b` | B2C | `+420910000002` |
| `viona-local-merchant-m` | B2B_EU | `+420920000001` |
| `viona-local-merchant-n` | B2B_EU | `+420920000002` |

Businesses: **VIONA Local Pilot Business M** (owner M), **VIONA Local Pilot Business N** (owner N).

## Out of scope for script

- LocalServiceRequest rows
- Wallet / Transaction mutations
- Production hosts, `+84` merchant phones

## After provisioning

1. `POST /api/auth/login` per persona (phone + PIN from operator note)
2. Create Local requests in a separate pack (`POST /api/local/requests`)
3. Manual walkthrough: `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md`
