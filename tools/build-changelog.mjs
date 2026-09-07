#!/usr/bin/env node
/**
 * build-changelog.mjs — generates changelog.html from CHANGELOG.md.
 *
 * The published changelog must never drift from the source of truth, so this
 * script derives everything: the release history comes from CHANGELOG.md and
 * the current version comes from pbiviz.json. Nothing is typed twice.
 *
 * It exits non-zero if the version in pbiviz.json has no matching entry at the
 * top of CHANGELOG.md — that mismatch is exactly the failure this is here to
 * catch, so it must break the build rather than publish a stale page.
 *
 * Usage:  node tools/build-changelog.mjs [--check]
 *   --check   validate only, write nothing
 *
 * No dependencies. Node 18+.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = join(ROOT, 'CHANGELOG.md');
const PBIVIZ = join(ROOT, 'pbiviz.json');
const TEMPLATE = join(ROOT, 'tools', 'changelog.template.html');
const OUTPUT = join(ROOT, 'changelog.html');

const checkOnly = process.argv.includes('--check');

const die = (msg) => {
  console.error(`\n  build-changelog: ${msg}\n`);
  process.exit(1);
};

// ── Inline markdown → HTML ──────────────────────────────────────────────────
// Escape first, then apply inline formatting, so nothing in CHANGELOG.md can
// inject markup into the published page.
const escapeHtml = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inline = (t) =>
  escapeHtml(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+|mailto:[^)\s]+)\)/g,
             '<a href="$2" target="_blank" rel="noopener">$1</a>');

// ── Parse CHANGELOG.md ──────────────────────────────────────────────────────
// Recognised shape:
//   ## [1.0.2.0] - 2026-09-07        (date optional)
//   ### Added | Changed | Fixed | Removed | Deprecated | Security | Documentation
//   - bullet, possibly wrapped across lines
function parseChangelog(md) {
  const releases = [];
  let release = null;
  let section = null;
  let bullet = null;

  const flushBullet = () => {
    if (bullet !== null && section) section.items.push(bullet.trim());
    bullet = null;
  };

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();

    const rel = /^##\s+\[?v?([0-9]+(?:\.[0-9]+){1,3})\]?\s*(?:[-–—]\s*(.+))?$/.exec(line);
    if (rel) {
      flushBullet();
      release = { version: rel[1], date: (rel[2] || '').trim(), sections: [] };
      releases.push(release);
      section = null;
      continue;
    }

    const sec = /^###\s+(.+?)\s*$/.exec(line);
    if (sec && release) {
      flushBullet();
      section = { title: sec[1], items: [] };
      release.sections.push(section);
      continue;
    }

    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (item && section) {
      flushBullet();
      bullet = item[1];
      continue;
    }

    // Continuation of the previous bullet (indented wrap).
    if (bullet !== null && /^\s+\S/.test(raw)) {
      bullet += ' ' + line.trim();
      continue;
    }

    if (line === '') flushBullet();
  }
  flushBullet();
  return releases;
}

// ── Render ──────────────────────────────────────────────────────────────────
const TAG_CLASS = {
  added: 'tag-add',
  changed: 'tag-chg',
  fixed: 'tag-fix',
  removed: 'tag-chg',
  deprecated: 'tag-chg',
  security: 'tag-fix',
  documentation: 'tag-chg',
};

function renderRelease(rel, isCurrent) {
  const head = [
    `      <span class="rel-ver">${escapeHtml(rel.version)}</span>`,
    isCurrent ? '      <span class="tag tag-cur">Current</span>' : null,
    rel.date ? `      <span class="rel-date">${escapeHtml(rel.date)}</span>` : null,
  ].filter(Boolean).join('\n');

  const body = rel.sections.map((s) => {
    const cls = TAG_CLASS[s.title.toLowerCase()] || 'tag-plan';
    const items = s.items.map((i) => `      <li>${inline(i)}</li>`).join('\n');
    return `    <h4><span class="tag ${cls}">${escapeHtml(s.title)}</span></h4>\n` +
           `    <ul>\n${items}\n    </ul>`;
  }).join('\n\n');

  return `  <div class="rel">\n    <div class="rel-head">\n${head}\n    </div>\n\n${body}\n  </div>`;
}

// ── Main ────────────────────────────────────────────────────────────────────
let md, pbiviz, template;
try { md = readFileSync(CHANGELOG, 'utf8'); } catch { die(`cannot read ${CHANGELOG}`); }
try { pbiviz = JSON.parse(readFileSync(PBIVIZ, 'utf8')); } catch { die(`cannot read ${PBIVIZ}`); }
try { template = readFileSync(TEMPLATE, 'utf8'); } catch { die(`cannot read ${TEMPLATE}`); }

const version = pbiviz?.visual?.version;
if (!version) die('pbiviz.json has no visual.version');

const releases = parseChangelog(md);
if (!releases.length) die('no "## [version]" headings found in CHANGELOG.md');

// The guarantee: the published page cannot claim a version the manifest does
// not have, and the manifest cannot ship a version the changelog never mentions.
if (releases[0].version !== version) {
  die(
    `version mismatch.\n` +
    `    pbiviz.json  : ${version}\n` +
    `    CHANGELOG.md : ${releases[0].version} (most recent entry)\n\n` +
    `  Add a "## [${version}]" section to CHANGELOG.md before packaging.`
  );
}
if (!releases[0].date) {
  die(`the ${version} entry in CHANGELOG.md has no date. Use "## [${version}] - YYYY-MM-DD".`);
}

if (checkOnly) {
  console.log(`build-changelog: ok — ${version} documented, ${releases.length} release(s).`);
  process.exit(0);
}

if (!template.includes('<!--RELEASES-->')) die('template is missing the <!--RELEASES--> placeholder');

const html = template.replace(
  '<!--RELEASES-->',
  releases.map((r, i) => renderRelease(r, i === 0)).join('\n\n')
);

writeFileSync(OUTPUT, html, 'utf8');
console.log(`build-changelog: wrote changelog.html — ${version}, ${releases.length} release(s).`);
