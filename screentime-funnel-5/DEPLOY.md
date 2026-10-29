# Screentime To Cash — Funnel (deploy guide)

Next.js 16 + TypeScript + Tailwind 4. No database, no server logic — the whole
funnel is client-side, so it deploys anywhere in minutes.

---

## Option A — Vercel (recommended, ~3 minutes, free)

1. Push this folder to a GitHub repo (or use `npx vercel` directly — no repo needed).
2. On vercel.com → "Add New Project" → import the repo.
3. Framework preset: **Next.js** (auto-detected). Leave everything default → Deploy.
   (The repo now builds to a fully static site — Vercel handles that fine.)
4. Add your custom domain: Project → Settings → Domains
   (TikTok ad review is much happier with a branded domain than `*.vercel.app`).

## Option B — Cloudflare Pages (recommended for a custom domain)

The repo is set up for static export (`output: "export"` in `next.config.ts`),
so `next build` produces a plain `out/` folder — no server functions, no
wrangler config, nothing to break.

1. Cloudflare dashboard → Workers & Pages → Create → **Pages** → Connect to Git.
2. Select the repo, then set:
   - Framework preset: **None**  (do NOT pick "Next.js" — that pulls in the
     SSR/OpenNext adapter, which fails with service-binding errors)
   - Build command: `bun run build`
   - Build output directory: `out`
3. Save and Deploy. Every push to the repo redeploys automatically.
4. Custom domain: Pages project → Custom domains → add your domain.
   (TikTok domain verification needs a domain you own — a `*.pages.dev`
   URL alone can't be verified, same as `*.vercel.app`.)

⚠️ Don't deploy this as a **Worker** with `npx wrangler deploy` — wrangler
auto-generates an OpenNext SSR config on Cloudflare's build machine and the
deploy dies with `WORKER_SELF_REFERENCE ... not found [code: 10143]`.
A Pages project with static output avoids all of that.

## Option C — Netlify

Import the repo: Build command `bun run build`, Publish directory `out`.

## Option D — Any VPS / any other host

```bash
bun install          # or: npm install
bun run build        # produces out/
```

Upload the `out/` folder to any static host (Hostinger, S3, GitHub Pages,
Nginx, ...). If you ever want Node SSR hosting again, change
`output: "export"` back to `output: "standalone"` in `next.config.ts` and
restore the `cp` part of the build script in `package.json`.

## Funnel entry modes

- **Default (no params)** — splash (white screen, two dots) → the
  "Turn Your Screentime Into Cash" popup immediately. This is the real-user
  flow: the "This page has been deleted." act happens on TikTok's side
  (For You feed + ad creative), so the site does not replay it.
- `?fast=1` — identical to the default (kept so existing Instant Page
  buttons keep working; safe to remove from the URL).
- `?fast=2` — splash → straight to the "Congratulations" checklist screen.
- `?intro=1` — demo mode: replays the old full act (fake For You feed with
  a 10-second "page deleted" toast) before the popup. Preview/testing only.

## TikTok Instant Page handoff

Instant Pages are hosted by TikTok and don't run custom scripts, so they
cannot auto-redirect — one button tap is unavoidable on TikTok's side.
Wire the Instant Page's outbound button (Instant Page editor → Button →
Open URL) to the plain funnel URL:

- `https://YOUR-DOMAIN/` — the site opens onto the mascot popup on its own.

(`?fast=1` in the button URL also works — it is now the same as the default.)
If you'd rather skip the Instant Page entirely, set the ad's destination
to "Website" and use the plain funnel URL — zero extra taps.

---

## Before running paid TikTok traffic — checklist

- [ ] Custom domain + HTTPS (all options above give you this automatically).
- [ ] Add the **TikTok Pixel** to `src/app/layout.tsx` (head) so the in-app
      browser fires ViewContent / ClickButton events back to Ads Manager.
- [x] Point the final "Download on the App Store" badge at your real offer —
      DONE. The badge in `src/components/funnel.tsx` (`Handoff`) is a real
      `<a>` linking to `https://www.fkn8s74mztrk.com/F3LJ3N8X/GS3NQC1D/`
      (same-window navigation, `rel="nofollow sponsored noopener"`). If the
      offer link ever changes, edit the `OFFER_URL` constant at the top of
      the `Handoff` component.
- [ ] Geo-check the offer: the original funnel geo-blocked non-supported
      regions; decide whether to gate or redirect those visitors.
- [ ] Funnel claims/rules: reward-funnel claims ("you have been selected",
      cash rewards) are heavily scrutinized by TikTok ad review — keep
      disclaimers (e.g. "Rewards require completing partner offers. Not
      affiliated with TikTok.") in the footer to reduce rejection risk.
