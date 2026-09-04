#!/usr/bin/env node
/**
 * PM2 cron helper: hits the incomplete-assessments endpoint on localhost.
 * Loads CRON_SECRET from .env / .env.local in the app directory.
 */
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, "..", ".env"));
loadEnvFile(path.join(__dirname, "..", ".env.local"));

const secret = process.env.CRON_SECRET;
const base = (process.env.CRON_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

if (!secret) {
  console.error("CRON_SECRET is not set; aborting incomplete-assessment cron.");
  process.exit(1);
}

const url = `${base}/api/cron/incomplete-assessments`;

fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
  },
})
  .then(async (res) => {
    const text = await res.text();
    if (!res.ok) {
      console.error("Cron request failed:", res.status, text);
      process.exit(1);
    }
    console.log("Incomplete assessment cron OK:", text);
  })
  .catch((err) => {
    console.error("Cron request error:", err);
    process.exit(1);
  });
