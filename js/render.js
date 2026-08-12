/* ═══════════════════════════════════════════════════════════════
   render.js — model → A4 page DOM, with auto-fit and pagination.

   Everything is built and measured inside a host element that is always
   laid out (#capture, parked offscreen). Measuring inside a hidden tab
   would return zero heights, so the preview never builds its own DOM —
   it receives finished clones.
   ═══════════════════════════════════════════════════════════════ */

import { parseBlocks, splitLines, sentences, digits } from './format.js';

/** The one place the letterhead identity is spelled out.
 *  The printed pad is Hindi, so the masthead stays Hindi in both languages —
 *  only the letter's own furniture (labels, sign-off, CC) switches. */
export const OWNER = {
  name: 'ज्ञानेन्द्रसिंह चुण्डावत',
  role: 'अध्यक्ष ब्लॉक कांग्रेस कमेटी आमेट',
  place: 'जिला राजसमन्द (राज.) 313332',
  phone: 'मो. 8107933963',
  email: 'e-mail : gyansingh441@gmail.com',
};

/** Letter furniture, per letter language. */
export const LBL = {
  hi: {
    ref: 'क्रमांक :-', date: 'दिनांक :-',
    toLead: 'सेवा में,', toPrefix: 'श्रीमान',
    subject: 'विषय :-', cc: 'सूचनार्थ प्रेषित', page: 'पृष्ठ',
    signRole: 'अध्यक्ष',
    signOrg: 'ब्लॉक कांग्रेस कमेटी आमेट',
    signPlace: 'जिला राजसमन्द (313332)',
  },
  en: {
    ref: 'Ref. No. :', date: 'Date :',
    toLead: 'To,', toPrefix: '',
    subject: 'Subject :', cc: 'Copy to', page: 'Page',
    signRole: 'President',
    signOrg: 'Block Congress Committee, Amet',
    signPlace: 'District Rajsamand (313332)',
  },
};

const lbl = o => LBL[o.lang === 'en' ? 'en' : 'hi'];

/* Auto-fit picks the LARGEST size that still fits one sheet, so a short
   letter grows to fill the page the way the handwritten original does,
   and a long one shrinks before it is allowed to spill onto page two. */
const FIT_SIZES = [19, 18.5, 18, 17.5, 17, 16.5, 16, 15.5, 15, 14.5, 14, 13.5, 13];
const BASE_SIZE = 16;

const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};

/* ── letterhead ─────────────────────────────────────────────── */

function letterhead(o) {
  if (o.headerSrc) {
    const lh = el('div', 'lh');
    lh.style.height = o.headerH + 'mm';
    lh.style.backgroundImage = `url("${o.headerSrc.replace(/"/g, '\\"')}")`;
    return [lh];                     // the scan already carries the rules
  }

  // CSS stand-in, used until a real letterpad scan is supplied
  const lhx = el('div', 'lhx');
  const grid = el('div', 'lhx__grid');

  const left = el('div');
  left.append(
    el('div', 'lhx__name', OWNER.name),
    el('div', 'lhx__ln', OWNER.role),
    el('div', 'lhx__ln', OWNER.place),
    el('div', 'lhx__ln lhx__ln--sm', OWNER.phone),
    el('div', 'lhx__ln lhx__ln--sm', OWNER.email),
  );

  const photo = el('div', 'lhx__photo');
  if (o.photoSrc) photo.style.backgroundImage = `url("${o.photoSrc}")`;
  else photo.append(el('div', 'slot', 'फ़ोटो'));

  const logo = el('div', 'lhx__logo');
  if (o.logoSrc) logo.style.backgroundImage = `url("${o.logoSrc}")`;
  else logo.append(el('div', 'slot', 'लोगो'));

  grid.append(left, photo, logo);
  lhx.append(grid);

  const rules = el('div', 'rules');
  for (const c of ['r1', 'r2', 'r3', 'r4', 'r5']) rules.append(el('i', c));

  return [lhx, rules];
}

/* ── page scaffolds ─────────────────────────────────────────── */

function firstPage(L, o) {
  const T = lbl(o);
  const page = el('div', 'page' + (o.lang === 'en' ? ' page--en' : ''));
  page.append(...letterhead(o));

  const meta = el('div', 'meta');
  const k = el('div');
  k.append(el('span', null, T.ref + ' '), el('span', 'val', digits(L.kramank || ' ', o.devDigits)));
  const d = el('div');
  d.append(el('span', null, T.date + ' '), el('span', 'val', digits(L.dinank || ' ', o.devDigits)));
  meta.append(k, d);
  page.append(meta);

  const to = el('div', 'to');
  to.append(el('div', 'to__lead', T.toLead));
  const row = el('div', 'to__row');
  if (T.toPrefix) row.append(el('span', 'to__lbl', T.toPrefix));
  row.append(el('span', 'to__val', L.to || ' '));
  to.append(row);
  page.append(to);

  if (L.showSubject && L.subject.trim()) {
    const s = el('div', 'subj');
    s.append(el('span', 'k', T.subject + ' '), el('span', null, L.subject.trim()));
    page.append(s);
  }

  const body = el('div', 'body');
  body.append(el('div', 'bodyin'));      // inner box keeps the *natural*
  page.append(body);                     // content height measurable
  return page;
}

function contPage(n, o) {
  const T = lbl(o);
  const page = el('div', 'page page--cont' + (o.lang === 'en' ? ' page--en' : ''));
  const h = el('div', 'conthead');
  const who = el('div');
  who.append(el('b', null, OWNER.name), document.createTextNode(' — ' + T.signRole));
  h.append(who, el('div', null, T.page + ' ' + digits(String(n), o.devDigits)));
  const body = el('div', 'body');
  body.append(el('div', 'bodyin'));
  page.append(h, body);
  return page;
}

const bodyOf = page => page.querySelector('.bodyin');

function blockNode(b, o) {
  if (b.type === 'li') {
    const n = el('div', 'blk blk--li');
    n.append(el('span', 'num', digits(String(b.n), o.devDigits)), el('span', 'txt', b.text));
    return n;
  }
  return el('p', 'blk blk--p', b.text);
}

function footNode(L, o) {
  const T = lbl(o);
  const foot = el('div', 'foot');

  const sign = el('div', 'sign');
  sign.append(
    el('div', 'sign__space'),
    el('div', 'sign__t1', T.signRole),
    el('div', 'sign__t2', T.signOrg),
    el('div', 'sign__t3', T.signPlace),
  );
  foot.append(sign);

  const lines = L.showCc ? splitLines(L.cc) : [];
  if (lines.length) {
    const cc = el('div', 'cc');
    cc.append(el('div', 'cc__hd', T.cc));
    for (const t of lines) cc.append(el('div', 'cc__li', t));
    foot.append(cc);
  }
  return foot;
}

/* ── measuring ──────────────────────────────────────────────── */

/* Every child of .page is flex-shrink:0, so an over-long letter really
   does overflow the fixed 297mm box instead of being squashed into it. */
const overflows = page => page.scrollHeight > page.clientHeight + 1;

/* ── the two layout strategies ──────────────────────────────── */

/** Everything on one sheet. Returns the page, or null if it won't fit. */
function tryOnePage(host, L, o, size) {
  host.style.setProperty('--body-size', size + 'px');
  host.style.setProperty('--blk-gap', '0px');
  const page = firstPage(L, o);
  const body = bodyOf(page);
  for (const b of o.blocks) body.append(blockNode(b, o));
  page.append(footNode(L, o));
  host.replaceChildren(page);
  if (overflows(page)) return null;
  relax(host, page, o.blocks.length);
  return page;
}

/**
 * Feed part of the leftover height back as inter-block spacing. Capped
 * hard — a letter that is genuinely short should read as short, not as
 * five lines stretched down a page.
 */
function relax(host, page, count) {
  const gaps = count - 1;
  if (gaps < 1) return;
  const box = page.querySelector('.body');
  const slack = box.clientHeight - bodyOf(page).offsetHeight;
  if (slack <= 0) return;
  host.style.setProperty('--blk-gap', Math.min(slack * 0.55 / gaps, 14) + 'px');
}

/** Flow across as many sheets as it takes. */
function paginate(host, L, o) {
  host.style.setProperty('--body-size', BASE_SIZE + 'px');
  host.style.setProperty('--blk-gap', '0px');   // no stretching when it already spills
  host.replaceChildren();

  const pages = [];
  let page = firstPage(L, o), body = bodyOf(page);
  pages.push(page); host.append(page);

  const nextPage = () => {
    page = contPage(pages.length + 1, o);
    body = bodyOf(page);
    pages.push(page); host.append(page);
  };

  const place = node => {
    body.append(node);
    if (overflows(page)) { node.remove(); nextPage(); body.append(node); }
  };

  for (const b of o.blocks) {
    const node = blockNode(b, o);
    body.append(node);
    if (!overflows(page)) continue;
    node.remove();

    // a paragraph too tall for a whole sheet has to break mid-way
    if (b.type === 'p') {
      const parts = sentences(b.text);
      if (parts.length > 1) {
        let buf = [];
        const flush = () => {
          if (!buf.length) return;
          place(blockNode({ type: 'p', text: buf.join(' ') }, o));
          buf = [];
        };
        for (const s of parts) {
          buf.push(s);
          const probe = blockNode({ type: 'p', text: buf.join(' ') }, o);
          body.append(probe);
          const bad = overflows(page);
          probe.remove();
          if (bad) { buf.pop(); flush(); nextPage(); buf = [s]; }
        }
        flush();
        continue;
      }
    }
    nextPage();
    body.append(node);
  }

  const foot = footNode(L, o);
  page.append(foot);
  if (overflows(page)) { foot.remove(); nextPage(); page.append(foot); }

  return pages;
}

/* ── public API ─────────────────────────────────────────────── */

/**
 * Build the finished pages inside `host` and leave them there.
 * Returns { pages, size } — `pages` are live nodes owned by the host.
 */
export function layout(host, letter, opts) {
  const o = { ...opts, blocks: parseBlocks(letter.body) };
  if (o.devDigits) for (const b of o.blocks) b.text = digits(b.text, true);

  host.style.setProperty('--head-h', (o.headerH || 42) + 'mm');

  if (letter.fit) {
    for (const size of FIT_SIZES) {
      const page = tryOnePage(host, letter, o, size);
      if (page) return { pages: [page], size };
    }
  } else {
    const page = tryOnePage(host, letter, o, BASE_SIZE);
    if (page) return { pages: [page], size: BASE_SIZE };
  }
  return { pages: paginate(host, letter, o), size: BASE_SIZE };
}

/** Mirror the freshly-laid-out pages into the visible preview. */
export function mirror(host, sheet) {
  for (const v of ['--body-size', '--head-h', '--blk-gap']) {
    sheet.style.setProperty(v, host.style.getPropertyValue(v));
  }
  sheet.replaceChildren(...[...host.children].map(p => p.cloneNode(true)));
}
