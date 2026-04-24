#!/usr/bin/env node
/**
 * build-docs.mjs
 * ---------------------------------------------------------------
 * Render docs/index.template.html into localized static pages:
 *   - docs/index.html        (zh, default canonical)
 *   - docs/en/index.html     (en)
 *
 * Translation source of truth: docs/i18n/{zh,en}.json
 *
 * Placeholders supported in the template:
 *   {{htmlLang}}                   html lang attribute (zh-CN / en)
 *   {{locale}}                     short code (zh / en) — used for
 *                                  locale-specific screenshots
 *   {{assetPrefix}}                ./ for root page, ../ for /en/
 *   {{siteUrl}}                    absolute site root URL (for hreflang)
 *   {{canonicalUrl}}               absolute URL of the current page
 *   {{altUrl}}                     URL of the sibling-language page
 *                                  (relative, so it works on file:// too)
 *   {{altHreflang}}                hreflang for the sibling page
 *   {{hero.rotatingTextsPipe}}     rotatingTexts joined with "|"
 *   {{path.to.nested.string}}      dot-path lookup into the locale JSON
 *   {{path.to.array.0.field}}      numeric segments index into arrays
 *
 * Usage:
 *   node scripts/build-docs.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const docsDir = path.join(repoRoot, "docs");
const i18nDir = path.join(docsDir, "i18n");
const templatePath = path.join(docsDir, "index.template.html");

/**
 * Canonical site root. GitHub Pages serves /docs at this URL for the
 * cchao123/skills-managers repo. If the site gets a custom domain later,
 * override here or via env SITE_URL.
 */
const SITE_URL = (process.env.SITE_URL || "https://cchao123.github.io/skills-managers/").replace(
  /\/*$/,
  "/",
);

/** Locale output targets. */
const TARGETS = [
  {
    locale: "zh",
    htmlLang: "zh-CN",
    outFile: path.join(docsDir, "index.html"),
    assetPrefix: "./",
    canonicalUrl: SITE_URL,
    altUrl: "./en/",
    altHreflang: "en",
  },
  {
    locale: "en",
    htmlLang: "en",
    outFile: path.join(docsDir, "en", "index.html"),
    assetPrefix: "../",
    canonicalUrl: SITE_URL + "en/",
    altUrl: "../",
    altHreflang: "zh-CN",
  },
];

/** Flatten a nested JSON into { "a.b.c": value, "a.list.0.x": value, ... }. */
function flatten(obj, prefix = "", out = {}) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  out[prefix] = obj;
  return out;
}

/**
 * Replace {{token}} placeholders in `template` with values from `vars`.
 * If a token resolves to undefined, throw — it almost always means a typo or
 * a missing translation key, both of which we'd rather catch at build time.
 */
function render(template, vars) {
  const seen = new Set();
  const out = template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    seen.add(key);
    const v = vars[key];
    if (v === undefined) {
      throw new Error(
        `Missing template variable: "${key}". ` +
          `Check docs/i18n/*.json or the TARGET definition in build-docs.mjs.`,
      );
    }
    return String(v);
  });
  return { out, seen };
}

async function loadLocale(locale) {
  const file = path.join(i18nDir, `${locale}.json`);
  const raw = await readFile(file, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse ${file}: ${e.message}`);
  }
}

async function buildOne(target, template) {
  const dict = await loadLocale(target.locale);

  const flat = flatten(dict);

  // Derived helpers (things the JSON shouldn't have to hardcode).
  if (Array.isArray(dict?.hero?.rotatingTexts)) {
    flat["hero.rotatingTextsPipe"] = dict.hero.rotatingTexts.join("|");
  }

  const vars = {
    ...flat,
    htmlLang: target.htmlLang,
    locale: target.locale,
    assetPrefix: target.assetPrefix,
    siteUrl: SITE_URL,
    canonicalUrl: target.canonicalUrl,
    altUrl: target.altUrl,
    altHreflang: target.altHreflang,
  };

  const { out } = render(template, vars);

  await mkdir(path.dirname(target.outFile), { recursive: true });
  await writeFile(target.outFile, out, "utf8");

  const rel = path.relative(repoRoot, target.outFile).replaceAll("\\", "/");
  console.log(`  ✓ ${target.locale.padEnd(3)} → ${rel}  (${out.length.toLocaleString()} bytes)`);
}

async function main() {
  const template = await readFile(templatePath, "utf8");
  console.log(`Rendering ${path.relative(repoRoot, templatePath)}:`);
  for (const target of TARGETS) {
    await buildOne(target, template);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("[build-docs] Failed:", err.message);
  process.exitCode = 1;
});
