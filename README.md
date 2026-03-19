## StemNorge

StemNorge er en Next.js 15-app for ukessaker, SMS-verifisert innlogging og en enkel adminflate for planlegging av saker.

## Lokal kjøring

1. Installer avhengigheter med `npm install`
2. Lag en lokal `.env` med minst `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` og `ADMIN_PASSWORD`
3. Kjør `npm run db:migrate:deploy`
4. Start utviklingsserver med `npm run dev`
5. Kjør tester med `npm test`

## Viktige miljøvariabler

### Påkrevd i production

- `DATABASE_URL`
  - pooled Postgres-tilkobling, f.eks. fra Neon
  - brukes av Prisma i både build og runtime
- `DIRECT_URL`
  - direkte Postgres-tilkobling fra Neon
  - brukes av Prisma CLI til migrasjoner
- `JWT_SECRET`
  - brukes til bruker-session
  - må være satt til en ekte hemmelig verdi i production
- `ADMIN_PASSWORD`
  - aktiverer admin-innlogging

### Valgfrie secrets

- `ADMIN_USERNAME`
  - default er `admin`
- `ADMIN_SESSION_SECRET`
  - arver `JWT_SECRET` hvis den ikke er satt
- `SMS_CODE_SECRET`
  - arver `JWT_SECRET` hvis den ikke er satt

### SMS

- `SMS_PROVIDER`
  - default er `mock` i utvikling
  - `mock` er blokkert i production

## Produksjonsnotater

- appen er klargjort for **Vercel + Neon Postgres**
- `npm run build` kjører `prisma generate`, `prisma migrate deploy` og deretter `next build`
- sett `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ADMIN_PASSWORD` og relevante SMS-variabler i Vercel før deploy
- appen failer tidlig i production hvis secrets mangler eller bruker standardverdien `supersecret`
- SMS-kodebestilling er rate-limitet per telefonnummer og formål
- bruker-session ligger fortsatt i `localStorage`, så videre hardening kan ta cookie-basert bruker-session i en senere oppgave
