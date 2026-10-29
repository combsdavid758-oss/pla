# Screentime To Cash — Funnel (deploy guide)

Next.js 16 + TypeScript + Tailwind 4. No database, no server logic — the whole
funnel is client-side, so it deploys anywhere in minutes.

---

## Option A — Vercel (recommended, ~3 minutes, free)

1. Push this folder to a GitHub repo (or use `npx vercel` directly — no repo needed).
2. On vercel.com → "Add New Project" → import the repo.
3. Framework preset: **Next.js** (auto-detected). Leave everything default → Deploy.
   - If the build step complains about the `cp` commands in the build script,
     override Build Command to: `next build`
4. Add your custom domain: Project → Settings → Domains
   (TikTok ad review is much happier with a branded domain than `*.vercel.app`).

## Option B — Netlify / Cloudflare Pages

Both support Next.js. Import the repo, accept the auto-detected Next.js preset,
deploy. Cloudflare Pages is the cheapest at scale (free bandwidth).

## Option C — Any VPS (Hetzner / DigitalOcean / Racknerd)

```bash
bun install          # or: npm install
bun run build        # produces .next/standalone
bun run start        # serves on port 3000 (NODE_ENV=production)
```

Put Caddy or Nginx in front for HTTPS, or run inside Docker.
The `output: "standalone"` config is already set for this.

## Option D — Pure static hosting (Hostinger / S3 / GitHub Pages)

The funnel uses zero server features, so it can be exported to plain HTML:

1. In `next.config.ts` change `output: "standalone"` to `output: "export"`.
2. Delete the `build` and `start` scripts' extra parts or just run `npx next build`.
3. The `out/` folder is a fully static site — upload it to literally any host.

## TikTok Instant Page handoff (`?fast=` params)

Instant Pages are hosted by TikTok and don't run custom scripts, so they
cannot auto-redirect — one button tap is unavoidable on TikTok's side.
Wire the Instant Page's outbound button (Instant Page editor → Button →
Open URL) to this funnel with one of:

- `https://YOUR-DOMAIN/?fast=1` — skips the "page deleted" act; the mascot
  popup opens immediately.
- `https://YOUR-DOMAIN/?fast=2` — skips straight to the "Congratulations"
  checklist screen.

Direct/organic visitors without the param still get the full 10-second
intro. If you'd rather skip the Instant Page entirely, set the ad's
destination to "Website" and use the plain funnel URL — zero extra taps.

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
