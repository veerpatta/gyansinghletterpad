/* ═══════════════════════════════════════════════════════════════
   app.js — bootstrap and glue.
   ═══════════════════════════════════════════════════════════════ */

import { state, load, save, current, newLetter, openLetter, removeLetter,
         touch, isEmpty, exportJSON, importJSON, assets, VERSION } from './store.js';
import { layout, mirror } from './render.js';
import * as PDF from './pdf.js';
import { Voice, supported as voiceOK } from './voice.js';
import { parseDict, splitLines, preview, shortDate, BULLET } from './format.js';
import { SNIPPETS, TEMPLATES } from './templates.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const capture = $('#capture');
const sheet = $('#sheet');
const stage = $('#stage');
const stagewrap = $('#stagewrap');

const F = {
  kramank: $('#fKramank'), dinank: $('#fDinank'), to: $('#fTo'),
  subject: $('#fSubject'), body: $('#fBody'), cc: $('#fCc'),
  showCc: $('#fShowCc'), fit: $('#fFit'),
};
const TEXTAREAS = [F.to, F.subject, F.body, F.cc];

let headerSrc = null, photoSrc = null, logoSrc = null;
let target = F.body;

/* ── small helpers ──────────────────────────────────────────── */

let toastT = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
}
const busy = (on, txt = 'बन रहा है…') => { $('#busyTxt').textContent = txt; $('#busy').hidden = !on; };
const probe = src => new Promise(r => { const i = new Image(); i.onload = () => r(src); i.onerror = () => r(null); i.src = src; });

function grow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
function fire(t) { t.dispatchEvent(new Event('input', { bubbles: true })); }

/* ── options handed to the renderer ─────────────────────────── */

const opts = () => ({
  headerSrc, photoSrc, logoSrc,
  headerH: state.settings.headerH,
  devDigits: state.settings.devDigits,
  hiQ: state.settings.hiQ,
});

/* ── preview ────────────────────────────────────────────────── */

let renderT = 0;
function schedule() { clearTimeout(renderT); renderT = setTimeout(draw, 180); }

function draw() {
  clearTimeout(renderT);
  const L = current();
  if (!L) return;
  const { pages } = layout(capture, L, opts());
  mirror(capture, sheet);
  $('#pagePill').textContent = pages.length > 1 ? `${pages.length} पेज` : 'पेज 1';
  fitStage();
}

function fitStage() {
  const page = sheet.firstElementChild;
  if (!page) return;
  const avail = stagewrap.clientWidth - 20;
  const pw = page.offsetWidth, ph = sheet.offsetHeight;
  const s = Math.min(1, avail / pw);
  stage.style.transform = `scale(${s})`;
  stage.style.width = pw * s + 'px';
  stage.style.height = ph * s + 'px';
}

/* ── form ⇄ model ───────────────────────────────────────────── */

function fillForm() {
  const L = current();
  if (!L) return;
  F.kramank.value = L.kramank;
  F.dinank.value = L.dinank;
  F.to.value = L.to;
  F.subject.value = L.subject;
  F.body.value = L.body;
  F.cc.value = L.cc;
  F.showCc.checked = L.showCc;
  F.fit.checked = L.fit;
  $('#subjectCard').hidden = !L.showSubject;
  $('#btnSubject').textContent = L.showSubject ? 'विषय हटाएँ' : 'विषय जोड़ें';
  TEXTAREAS.forEach(grow);
  $('#topTitle').textContent = L.to.trim() || 'नया पत्र';
  $('#topSub').textContent = `क्रमांक ${L.kramank || '—'} · ${L.dinank}`;
  draw();
}

function bind(input, key, prop = 'value') {
  input.addEventListener('input', () => {
    const L = current();
    if (!L) return;
    L[key] = input[prop];
    if (input.tagName === 'TEXTAREA') grow(input);
    if (key === 'to') $('#topTitle').textContent = input.value.trim() || 'नया पत्र';
    if (key === 'kramank' || key === 'dinank') {
      $('#topSub').textContent = `क्रमांक ${L.kramank || '—'} · ${L.dinank}`;
    }
    touch();
    schedule();
  });
}

bind(F.kramank, 'kramank'); bind(F.dinank, 'dinank');
bind(F.to, 'to'); bind(F.subject, 'subject');
bind(F.body, 'body'); bind(F.cc, 'cc');
F.showCc.addEventListener('change', () => { current().showCc = F.showCc.checked; touch(); schedule(); });
F.fit.addEventListener('change', () => { current().fit = F.fit.checked; touch(); schedule(); });

/* ── the voice target ───────────────────────────────────────── */

const LABEL = new Map([[F.to, 'सेवा में'], [F.subject, 'विषय'], [F.body, 'मुख्य भाग'], [F.cc, 'सूचनार्थ']]);

function setTarget(t) {
  target = t;
  TEXTAREAS.forEach(x => x.classList.toggle('is-target', x === t));
  $('#micTarget').textContent = LABEL.get(t) || '';
}
TEXTAREAS.forEach(t => t.addEventListener('focus', () => setTarget(t)));

/* ── inserting text at the cursor ───────────────────────────── */

function insert(str, { atLineStart = false, eatSpace = false } = {}) {
  const t = target;
  const s = t.selectionStart ?? t.value.length;
  const e = t.selectionEnd ?? s;
  let left = t.value.slice(0, s);
  const right = t.value.slice(e);

  if (eatSpace) left = left.replace(/[ \t]+$/, '');
  if (atLineStart && left && !left.endsWith('\n')) str = '\n' + str;

  t.value = left + str + right;
  const p = (left + str).length;
  t.selectionStart = t.selectionEnd = p;
  t.focus();
  fire(t);
}

/** Spoken text needs a separating space unless we're at a fresh start. */
function insertText(v) {
  const t = target;
  const s = t.selectionStart ?? t.value.length;
  const left = t.value.slice(0, s);
  insert((!left || /[\s\n•(]$/.test(left) ? '' : ' ') + v);
}

function delSentence() {
  const t = target;
  const s = t.selectionStart ?? t.value.length;
  const left = t.value.slice(0, s).replace(/\s+$/, '');
  const m = left.match(/[।?!\n][^।?!\n]*$/);
  const cut = m ? left.length - m[0].length + 1 : 0;
  t.value = t.value.slice(0, cut) + t.value.slice(s);
  t.selectionStart = t.selectionEnd = cut;
  fire(t);
}

const ACT = {
  text:  a => insertText(a.v),
  para:  () => insert('\n\n'),
  li:    () => insert(BULLET, { atLineStart: true }),
  danda: () => insert('। ', { eatSpace: true }),
  comma: () => insert(', ', { eatSpace: true }),
  qm:    () => insert('? ', { eatSpace: true }),
  del:   () => delSentence(),
};

/* ── voice ──────────────────────────────────────────────────── */

const micbar = $('#micbar');
const voice = new Voice({
  getDict: () => parseDict(state.settings.dict),
  onActions: acts => { for (const a of acts) ACT[a.t]?.(a); },
  onInterim: txt => { $('#micTarget').textContent = txt || LABEL.get(target) || ''; },
  onState: (s, reason) => {
    micbar.classList.toggle('is-live', s === 'live');
    $('#micState').textContent = s === 'live' ? 'सुन रहा हूँ… (रोकने के लिए दबाएँ)' : 'बोलकर लिखें';
    $('#micTarget').textContent = LABEL.get(target) || '';
    if (reason) toast(reason);
  },
});

if (voiceOK) {
  $('#btnMic').addEventListener('click', () => voice.toggle());
} else {
  micbar.hidden = true;
  F.body.placeholder = 'यहाँ पत्र लिखें — कीबोर्ड के 🎤 बटन से बोलकर भी लिख सकते हैं।';
}

/* ── editor buttons & chips ─────────────────────────────────── */

$('#btnBullet').addEventListener('click', () => { setTarget(F.body); insert(BULLET, { atLineStart: true }); });
$('#btnPara').addEventListener('click', () => { setTarget(F.body); insert('\n\n'); });

$('#btnSubject').addEventListener('click', () => {
  const L = current();
  L.showSubject = !L.showSubject;
  if (!L.showSubject) L.subject = '';
  touch();
  fillForm();
  if (L.showSubject) F.subject.focus();
});

function buildChips() {
  const snip = $('#snipChips');
  snip.replaceChildren(...SNIPPETS.map(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = s;
    b.addEventListener('click', () => { setTarget(F.body); insertText(s); });
    return b;
  }));

  const book = $('#bookChips');
  book.replaceChildren(...splitLines(state.settings.book).map(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = s;
    b.addEventListener('click', () => { F.to.value = s; fire(F.to); });
    return b;
  }));
}

/* ── tabs ───────────────────────────────────────────────────── */

function go(name) {
  $$('.tab').forEach(t => t.classList.toggle('is-active', t.id === 'tab-' + name));
  $$('.tabbtn').forEach(b => b.classList.toggle('is-active', b.dataset.tab === name));
  if (name === 'view') { draw(); requestAnimationFrame(fitStage); }
  if (name === 'list') drawList();
  if (name !== 'write') voice.stop();
}
$$('.tabbtn').forEach(b => b.addEventListener('click', () => {
  const run = () => go(b.dataset.tab);
  document.startViewTransition ? document.startViewTransition(run) : run();
}));

/* ── history ────────────────────────────────────────────────── */

function drawList() {
  const wrap = $('#letterList');
  const rows = state.letters.filter(l => !isEmpty(l) || l.id === state.openId);
  $('#listCount').textContent = `${rows.length} पत्र`;

  if (!rows.length) {
    wrap.innerHTML = '<div class="empty">अभी कोई पत्र नहीं।<br>“लिखें” में जाकर शुरू करें।</div>';
    return;
  }

  wrap.replaceChildren(...rows.map(L => {
    const row = document.createElement('div');
    row.className = 'lrow' + (L.id === state.openId ? ' is-open' : '');

    const main = document.createElement('div');
    main.className = 'lrow__main';
    const top = document.createElement('div');
    top.className = 'lrow__top';
    top.append(Object.assign(document.createElement('span'), { textContent: L.kramank || '—' }),
               Object.assign(document.createElement('span'), { textContent: L.dinank }));
    const txt = document.createElement('div');
    txt.className = 'lrow__txt';
    txt.textContent = (L.to.trim() ? L.to.trim() + ' — ' : '') + (preview(L.body) || 'खाली पत्र');
    main.append(top, txt);

    const del = document.createElement('button');
    del.className = 'lrow__del'; del.textContent = '🗑'; del.setAttribute('aria-label', 'हटाएँ');
    del.addEventListener('click', ev => {
      ev.stopPropagation();
      if (!confirm('यह पत्र हटाएँ?')) return;
      removeLetter(L.id);
      drawList(); fillForm();
      toast('पत्र हटा दिया');
    });

    row.append(main, del);
    row.addEventListener('click', () => { openLetter(L.id); fillForm(); go('write'); });
    return row;
  }));
}

/* ── new letter & templates ─────────────────────────────────── */

$('#btnNew').addEventListener('click', () => {
  if (isEmpty(current())) { toast('यह पत्र पहले से खाली है'); return; }
  newLetter();
  fillForm();
  go('write');
  toast('नया पत्र — क्रमांक ' + current().kramank);
});

function applyTemplate(tpl) {
  if (!isEmpty(current())) newLetter();
  const L = current();
  if (tpl.to) L.to = tpl.to;
  L.body = tpl.body;
  L.dinank = shortDate();
  touch();
  fillForm();
  go('write');
  F.body.focus();
}

$('#btnTemplates').addEventListener('click', () => {
  const list = $('#tplList');
  list.replaceChildren(...TEMPLATES.map(t => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tplrow';
    b.append(Object.assign(document.createElement('strong'), { textContent: t.name }),
             Object.assign(document.createElement('small'), { textContent: t.desc }));
    b.addEventListener('click', () => { $('#dlgTemplates').close(); applyTemplate(t); });
    return b;
  }));
  $('#dlgTemplates').showModal();
});

/* ── PDF · share · print ────────────────────────────────────── */

async function makePdf() {
  const L = current();
  if (isEmpty(L)) { toast('पहले पत्र लिखें'); return null; }
  busy(true, 'PDF बन रहा है…');
  try {
    return await PDF.build(L, opts(), capture);
  } catch (e) {
    console.error('[pdf]', e);
    toast('PDF नहीं बन पाया');
    return null;
  } finally {
    busy(false);
    draw();                     // the capture host is shared — restore the preview
  }
}

$('#btnPdf').addEventListener('click', async () => {
  const r = await makePdf();
  if (!r) return;
  PDF.download(r.blob, r.name);
  toast(`${r.pages} पेज · ${r.name}`);
});

$('#btnShare').addEventListener('click', async () => {
  const r = await makePdf();
  if (!r) return;
  const how = await PDF.share(r.blob, r.name, current().to || 'पत्र');
  if (how === 'downloaded') toast('साझा उपलब्ध नहीं — फ़ाइल सहेज ली');
});

$('#btnPrint').addEventListener('click', () => { draw(); setTimeout(() => window.print(), 120); });

/* ── settings ───────────────────────────────────────────────── */

const S = state.settings;

function fillSettings() {
  $('#fHiQ').checked = S.hiQ;
  $('#fDevDigits').checked = S.devDigits;
  $('#fHeaderH').value = S.headerH;
  $('#fBook').value = S.book;
  $('#fDict').value = S.dict;
  $('#verLbl').textContent = 'v' + VERSION;
}

$('#btnSettings').addEventListener('click', () => { fillSettings(); $('#dlgSettings').showModal(); });

$('#fHiQ').addEventListener('change', e => { S.hiQ = e.target.checked; save(); });
$('#fDevDigits').addEventListener('change', e => { S.devDigits = e.target.checked; save(); draw(); });
$('#fHeaderH').addEventListener('input', e => {
  const v = Math.min(90, Math.max(20, +e.target.value || 42));
  S.headerH = v; save(); draw();
});
$('#fBook').addEventListener('input', e => { S.book = e.target.value; save(); buildChips(); });
$('#fDict').addEventListener('input', e => { S.dict = e.target.value; save(); });

/* header image — downscaled and kept in IndexedDB, never localStorage */
$('#fHeader').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  busy(true, 'हेडर सहेजा जा रहा है…');
  try {
    const { url, w, h } = await shrink(file, 2000);
    await assets.set('header', url);
    headerSrc = url;
    S.headerH = Math.min(90, Math.max(20, Math.round(180 * (h / w))));
    $('#fHeaderH').value = S.headerH;
    save(true);
    draw();
    toast('हेडर लग गया');
  } catch (err) {
    console.error(err);
    toast('यह फ़ाइल नहीं पढ़ी जा सकी');
  } finally { busy(false); }
});

$('#btnHeaderReset').addEventListener('click', async () => {
  await assets.del('header');
  headerSrc = await probe('assets/header.jpg');
  draw();
  toast('हेडर हटा दिया');
});

function shrink(file, maxW) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const sc = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        res({ url: c.toDataURL('image/jpeg', 0.9), w, h });
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ── backup ─────────────────────────────────────────────────── */

function doExport() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  PDF.download(blob, `letterpad-backup-${new Date().toISOString().slice(0, 10)}.json`);
  toast('बैकअप सहेज लिया');
}
$('#btnExport').addEventListener('click', doExport);
$('#btnBackup').addEventListener('click', doExport);

$('#fImport').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    const n = importJSON(await file.text());
    fillSettings(); buildChips(); fillForm(); drawList();
    toast(n ? `${n} पत्र जोड़े गए` : 'कोई नया पत्र नहीं मिला');
  } catch (err) {
    console.error(err);
    toast('फ़ाइल पढ़ी नहीं जा सकी');
  }
});

/* ── keyboard-aware layout ──────────────────────────────────── */

if (window.visualViewport) {
  const vv = window.visualViewport;
  const onVV = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb + 'px');
    $('#tabbar').hidden = kb > 120;          // reclaim the space while typing
  };
  vv.addEventListener('resize', onVV);
  vv.addEventListener('scroll', onVV);
}
window.addEventListener('resize', () => requestAnimationFrame(fitStage));

/* ── go ─────────────────────────────────────────────────────── */

(async function boot() {
  load();

  [headerSrc, photoSrc, logoSrc] = await Promise.all([
    assets.get('header').then(v => v || probe('assets/header.jpg')),
    probe('assets/photo.png'),
    probe('assets/logo.png'),
  ]);

  const L = current();
  if (!L.kramank) { L.kramank = '01/' + (new Date().getMonth() + 1) + '/' + String(new Date().getFullYear()).slice(-2); }

  buildChips();
  fillSettings();
  setTarget(F.body);
  fillForm();

  window.addEventListener('beforeunload', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('[sw]', e));
  }
})();
