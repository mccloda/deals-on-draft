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

const map = {
  "EVENT_TITLE": cfg.eventTitle,
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
