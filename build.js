#!/usr/bin/env node
/**
 * Deals on Draft — static site builder.
 * Reads config.json, injects values into template.html, writes index.html.
 * No dependencies. Run: `node build.js`
 */
const fs = require("fs");
const path = require("path");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
let tpl = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");

// Build the partner cards from config
const partners = cfg.partners
  .map((p) => {
    const founding = /found/i.test(p.tier || "") ? " founding" : "";
    const media = p.logo
      ? `<span class="card"><img src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy"></span>`
      : `<span class="card txt">${esc(p.name)}</span>`;
    const tier = `<span class="ptier">${esc(p.tier || "Partner")}<span class="arrow">↗</span></span>`;
    return p.url
      ? `        <a class="partner${founding}" href="${esc(p.url)}" target="_blank" rel="noopener">${media}${tier}</a>`
      : `        <div class="partner">${media}<span class="ptier">${esc(p.tier || "Partner")}</span></div>`;
  })
  .join("\n");

// --- Calendar: write a real .ics file + build Google/Outlook links ---
const icsStart = `${cfg.ics.date}T${cfg.ics.start}`;
const icsEnd = `${cfg.ics.date}T${cfg.ics.end}`;
const calLoc = `${cfg.venue.name}, ${cfg.venue.address}`;
const calDesc =
  "Pittsburgh's REI Happy Hour. No presentations. No gurus. No pitches. Free to attend.";
const icsContent = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Deals on Draft//Pittsburgh//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "BEGIN:VEVENT",
  `UID:${cfg.ics.uid}@dealsondraft`,
  `DTSTAMP:${cfg.ics.date}T000000Z`,
  `DTSTART:${icsStart}`,
  `DTEND:${icsEnd}`,
  `SUMMARY:${cfg.eventTitle}`,
  `LOCATION:${calLoc.replace(/,/g, "\\,")}`,
  `DESCRIPTION:${calDesc}`,
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
fs.writeFileSync(path.join(__dirname, "deals-on-draft.ics"), icsContent + "\r\n");

const isoDate = `${cfg.ics.date.slice(0, 4)}-${cfg.ics.date.slice(4, 6)}-${cfg.ics.date.slice(6, 8)}`;
const isoT = (t) => `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
const amp = (u) => u.replace(/&/g, "&amp;");
const gcalUrl = amp(
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cfg.eventTitle)}&dates=${icsStart}/${icsEnd}&ctz=America/New_York&location=${encodeURIComponent(calLoc)}&details=${encodeURIComponent(calDesc)}`
);
const outlookUrl = amp(
  `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(cfg.eventTitle)}&startdt=${isoDate}T${isoT(cfg.ics.start)}&enddt=${isoDate}T${isoT(cfg.ics.end)}&location=${encodeURIComponent(calLoc)}&body=${encodeURIComponent(calDesc)}`
);

const map = {
  "EVENT_TITLE": cfg.eventTitle,
  "GCAL_URL": gcalUrl,
  "OUTLOOK_URL": outlookUrl,
  "SITE_URL": cfg.siteUrl,
  "RSVP_URL": cfg.rsvpUrl,
  "DATE_FULL": cfg.date.full,
  "DATE_WEEKDAY": cfg.date.weekday,
  "DATE_REST": cfg.date.rest,
  "TIME": cfg.time,
  "VENUE_NAME": cfg.venue.name,
  "VENUE_ADDR": cfg.venue.address,
  "ICS_START": `${cfg.ics.date}T${cfg.ics.start}`,
  "ICS_END": `${cfg.ics.date}T${cfg.ics.end}`,
  "ICS_UID": cfg.ics.uid,
  "PARTNERS": partners,
  "PARTNER_STRIP": cfg.partners
    .filter((p) => p.logo)
    .map(
      (p) =>
        `        <a class="pstrip-item" href="${esc(p.url || "#")}" target="_blank" rel="noopener"><img src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy"></a>`
    )
    .join("\n"),
};

// Replace every {{TOKEN}}
for (const [k, v] of Object.entries(map)) {
  tpl = tpl.split(`{{${k}}}`).join(v);
}

// Safety: warn on any leftover tokens
const leftover = tpl.match(/\{\{[A-Z_]+\}\}/g);
if (leftover) {
  console.warn("⚠ Unreplaced tokens:", [...new Set(leftover)].join(", "));
}

fs.writeFileSync(path.join(__dirname, "index.html"), tpl);
console.log(`✓ Built index.html for ${cfg.date.full} — ${cfg.partners.length} partners.`);

// Minimal HTML-escape for values injected into attributes/markup
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
