/* ═══════════════════════════════════════════════════════════════
   format.js — pure text helpers. No DOM, no state.
   ═══════════════════════════════════════════════════════════════ */

const DEV = '०१२३४५६७८९';

export function toDev(s) {
  return String(s).replace(/[0-9]/g, d => DEV[+d]);
}
export function toLatin(s) {
  return String(s).replace(/[०-९]/g, d => String(DEV.indexOf(d)));
}
/** Apply the user's digit preference. */
export function digits(s, useDev) {
  return useDev ? toDev(s) : toLatin(s);
}

/** 12/8/26 — the same short form used on the paper pad. */
export function shortDate(d = new Date()) {
  return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
}

/** Next क्रमांक for this month: 01/8/26 → 02/8/26. */
export function nextKramank(existing, d = new Date()) {
  const m = d.getMonth() + 1, y = String(d.getFullYear()).slice(-2);
  let max = 0;
  for (const k of existing) {
    const p = toLatin(String(k || '')).match(/^\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
    if (p && +p[2] === m && p[3] === y) max = Math.max(max, +p[1]);
  }
  return `${String(max + 1).padStart(2, '0')}/${m}/${y}`;
}

/* ── Hindi text cleanup ─────────────────────────────────────── */

/**
 * Tidy a chunk of dictated or typed Hindi. Conservative on purpose —
 * it must never mangle what the user actually meant.
 */
export function tidy(s) {
  return String(s)
    .replace(/[ \t]+/g, ' ')                 // collapse runs of spaces
    .replace(/ +([।,;:?!.])/g, '$1')         // no space *before* punctuation
    .replace(/([।,;:?!])(?=\S)/g, '$1 ')     // one space *after* it
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Close a sentence with a danda if the writer forgot. */
export function endDanda(s) {
  const t = String(s).trimEnd();
  return !t || /[।?!:\-–—]$/.test(t) ? t : t + ' ।';
}

/**
 * Speech-to-text mangles proper nouns constantly. The dictionary is a
 * plain `wrong = right` list the user can edit in Settings.
 */
export function parseDict(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const i = line.indexOf('=');
    if (i < 1) continue;
    const from = line.slice(0, i).trim(), to = line.slice(i + 1).trim();
    if (from) out.push([from, to]);
  }
  return out;
}
export function applyDict(s, pairs) {
  let out = String(s);
  for (const [from, to] of pairs) {
    // whole-word-ish: Devanagari has no \b, so guard on non-letter edges
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(^|[^\\p{L}\\p{M}])${esc}(?=$|[^\\p{L}\\p{M}])`, 'giu'), (_, p) => p + to);
  }
  return out;
}

/* ── body text ⇄ blocks ─────────────────────────────────────── */

export const BULLET = '• ';

/**
 * The editor is a plain textarea. A line starting with "• " becomes a
 * circled-number item; everything else is a paragraph. Blank lines split
 * paragraphs. Numbering restarts after each paragraph.
 */
export function parseBlocks(text) {
  const blocks = [];
  let para = [];
  const flush = () => {
    const t = para.join(' ').trim();
    if (t) blocks.push({ type: 'p', text: t });
    para = [];
  };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (/^[•\-*]\s*/.test(line)) {
      flush();
      const t = line.replace(/^[•\-*]\s*/, '').trim();
      if (t) blocks.push({ type: 'li', text: t });
    } else if (!line) {
      flush();
    } else {
      para.push(line);
    }
  }
  flush();
  // number the list items, restarting after any paragraph
  let n = 0;
  for (const b of blocks) {
    if (b.type === 'li') b.n = ++n; else n = 0;
  }
  return blocks;
}

export function splitLines(text) {
  return String(text || '').split('\n').map(s => s.trim()).filter(Boolean);
}

/** Break a long paragraph at sentence ends so it can span two pages. */
export function sentences(text) {
  const parts = String(text).split(/(?<=[।?!])\s+/).filter(Boolean);
  return parts.length ? parts : [String(text)];
}

/* ── misc ───────────────────────────────────────────────────── */

/** Android download managers choke on non-ASCII filenames. */
export function latinSlug(s, fallback = 'Patra') {
  const map = {
    'पी.सी.सी.': 'PCC', 'पीसीसी': 'PCC', 'जयपुर': 'Jaipur', 'आमेट': 'Amet',
    'राजसमन्द': 'Rajsamand', 'राजसमंद': 'Rajsamand', 'जिला': 'Zila',
    'कांग्रेस': 'Congress', 'कमेटी': 'Committee', 'ब्लॉक': 'Block',
    'नगरपालिका': 'Nagarpalika', 'अध्यक्ष': 'Adhyaksh',
  };
  let t = String(s || '');
  for (const [k, v] of Object.entries(map)) t = t.split(k).join(' ' + v + ' ');
  t = toLatin(t).replace(/[^\x20-\x7E]/g, ' ').replace(/[^A-Za-z0-9]+/g, '-')
       .replace(/^-+|-+$/g, '').slice(0, 40);
  return t || fallback;
}

export function preview(text, n = 90) {
  const t = String(text || '').replace(/[•\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}
