# Deals on Draft — Event Site

The website for **Deals on Draft — Pittsburgh's REI Happy Hour**, a quarterly real
estate networking event. Static HTML, no framework, deploys to Cloudflare Pages.

Live site: https://dealsondraft.com

---

## How it works

Everything that changes each quarter lives in **`config.json`**. A tiny build script
(`build.js`) injects those values into `template.html` and writes the final
`index.html` that gets served.

```
config.json      ← edit this each quarter (date, venue, RSVP link, partners)
template.html    ← the page layout + styles (rarely touched)
build.js         ← reads config.json → writes index.html   (Node, no dependencies)
index.html       ← generated & committed; this is what Cloudflare serves
assets/
  logo.png       ← the badge logo (transparent)
  og-image.png   ← social-share preview card (LinkedIn / FB / iMessage)
```

## Updating for the next quarter

1. Open `config.json` and change the fields:
   - `date` → `weekday`, `rest`, `full`
   - `time`
   - `venue` → `name`, `address`
   - `ics` → `date` (YYYYMMDD), `start`/`end` (HHMMSS), `uid` (e.g. `deals-on-draft-2026-12-11`)
   - `rsvpUrl` → the new Luma event link
   - `partners` → add/remove/reorder `{ "name", "tier" }`
2. Rebuild:
   ```bash
   node build.js
   ```
3. Commit and push — Cloudflare Pages auto-deploys in ~30 seconds:
   ```bash
   git add -A && git commit -m "Q4 2026 event" && git push
   ```

That's it. (Or just tell Claude the new details and it will do steps 1–3.)

## First-time setup

**GitHub + Cloudflare Pages**
1. Create the repo and push (see the setup notes handed off with this project).
2. In Cloudflare Pages: *Create project → Connect to Git → select this repo.*
   - Build command: `node build.js`
   - Build output directory: `/`
3. Add custom domain `dealsondraft.com` in the Pages project settings.

**Domain (dealsondraft.com is registered at Hover)**
- Easiest: move the domain's nameservers to Cloudflare (free), then Pages wires the
  apex + `www` + SSL automatically.
- Or keep Hover DNS: `CNAME www → <project>.pages.dev`, and set an apex forward to `www`.

**RSVP (Luma)**
- Create the event at lu.ma, set it to Free, copy the event URL into `config.json` → `rsvpUrl`.
- Each quarter: duplicate the Luma event, update date/venue, paste the new URL into config.

## Local preview

```bash
node build.js && open index.html    # macOS
```
