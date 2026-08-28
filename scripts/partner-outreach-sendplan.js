#!/usr/bin/env node
/**
 * Sendeplan für Partner-Outreach – nur Vorschau, kein automatischer Versand.
 * Nutzung: node scripts/partner-outreach-sendplan.js
 */
const fs = require("fs");
const path = require("path");

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../content/marketing/partner-outreach.json"), "utf8"),
);

const delayMin = data.sendRules.delayMinutesBetween;
let t = new Date();

console.log("=== MeisterFlow Partner-Outreach – Sendeplan ===\n");
console.log(`Absender: ${data.from}`);
console.log(`Pause zwischen Mails: ${delayMin} Minuten\n`);

data.emails.forEach((mail, i) => {
  if (i > 0) t = new Date(t.getTime() + delayMin * 60 * 1000);
  const time = t.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  console.log(`${mail.id}. [${time}] → ${mail.to}`);
  console.log(`   ${mail.firma} (${mail.stadt})`);
  console.log(`   Betreff: ${mail.subject}`);
  console.log("");
});

console.log(`Follow-up nach ${data.sendRules.followUpAfterDays} Tagen bei Nicht-Antwort.`);
