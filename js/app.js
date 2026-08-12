/* ═══════════════════════════════════════════════════════════════
   app.js — bootstrap and glue.

   Two independent languages: the APP language (settings.ui, chosen once)
   and the LETTER language (letter.lang, chosen per letter). See i18n.js.
   ═══════════════════════════════════════════════════════════════ */

import { state, load, save, current, newLetter, openLetter, removeLetter,
         duplicateLetter, touch, isEmpty, exportJSON, importJSON, assets,
         VERSION } from './store.js';
import { layout, mirror } from './render.js';
import * as PDF from './pdf.js';
import { Voice, supported as voiceOK } from './voice.js';
import { parseDict, splitLines, preview, shortDate, BULLET } from './format.js';
import { SNIPPETS, TEMPLATES, VOICE_HELP, CC_DEFAULT } from './templates.js';
import { t, setUILang, applyI18n, uiLang } from './i18n.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const capture = $('#capture'), sheet = $('#sheet');
const stage = $('#stage'), stagewrap = $('#stagewrap');

const F = {
  kramank: $('#fKramank'), dinank: $('#fDinank'), to: $('#fTo'),
  subject: $('#fSubject'), body: $('#fBody'), cc: $('#fCc'),
  showCc: $('#fShowCc'), fit: $('#fFit'),
};
const TEXTAREAS = [F.to, F.subject, F.body, F.cc];

let headerSrc = null, photoSrc = null, logoSrc = null;
let target = F.body;

/** Language of the letter being edited (not of the interface). */
const LL = () => current()?.lang || 'hi';

/* ── small helpers ──────────────────────────────────────────── */

let toastT = 0;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('is-on'), 2600);
}
const busy = (on, key = 'busy.pdf') => { $('#busyTxt').textContent = t(key); $('#busy').hidden = !on; };
const probe = src => new Promise(r => { const i = new Image(); i.onload = () => r(src); i.onerror = () => r(null); i.src = src; });

/** First of these that exists wins, so a replacement asset can be dropped
 *  in as either .jpg or .png without touching any code. */
async function probeAny(list) {
  for (const src of list) { const hit = await probe(src); if (hit) return hit; }
  return null;
}

function grow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
function fire(el) { el.dispatchEvent(new Event('input', { bubbles: true })); }

const opts = () => ({
  headerSrc, photoSrc, logoSrc,
  headerH: state.settings.headerH,
  devDigits: state.settings.devDigits,
  hiQ: state.settings.hiQ,
  lang: LL(),
});

/* ── preview ────────────────────────────────────────────────── */

let renderT = 0;
const schedule = () => { clearTimeout(renderT); renderT = setTimeout(draw, 180); };

function draw() {
  clearTimeout(renderT);
  const L = current();
  if (!L) return;
  const { pages } = layout(capture, L, opts());
  mirror(capture, sheet);
  $('#pagePill').textContent = pages.length > 1 ? t('page.n', { n: pages.length }) : t('page.one');
  fitStage();
}

function fitStage() {
  const page = sheet.firstElementChild;
  if (!page) return;
  const s = Math.min(1, (stagewrap.clientWidth - 20) / page.offsetWidth);
  stage.style.transform = `scale(${s})`;
  stage.style.width = page.offsetWidth * s + 'px';
  stage.style.height = sheet.offsetHeight * s + 'px';
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
  $('#btnSubject').textContent = t(L.showSubject ? 'btn.rmSubject' : 'btn.addSubject');
  $$('#segLang .seg__b').forEach(b => b.classList.toggle('is-on', b.dataset.lang === L.lang));
  $('#micTarget').textContent = targetName();   // follows the app language too
  TEXTAREAS.forEach(grow);
  buildChips();
  head();
  draw();
}

function head() {
  const L = current();
  $('#topTitle').textContent = L.to.trim() || t('letter.new');
  $('#topSub').textContent = `${t('field.ref')} ${L.kramank || '—'} · ${L.dinank}`;
}

function bind(input, key) {
  input.addEventListener('input', () => {
    const L = current();
    if (!L) return;
    L[key] = input.value;
    if (input.tagName === 'TEXTAREA') grow(input);
    if (key === 'body') pushUndo(input.value);
    if (key === 'to' || key === 'kramank' || key === 'dinank') head();
    touch();
    schedule();
  });
}
bind(F.kramank, 'kramank'); bind(F.dinank, 'dinank');
bind(F.to, 'to'); bind(F.subject, 'subject');
bind(F.body, 'body'); bind(F.cc, 'cc');
F.showCc.addEventListener('change', () => { current().showCc = F.showCc.checked; touch(); schedule(); });
F.fit.addEventListener('change', () => { current().fit = F.fit.checked; touch(); schedule(); });

/* ── letter language ────────────────────────────────────────── */

$$('#segLang .seg__b').forEach(b => b.addEventListener('click', () => {
  const L = current(), lang = b.dataset.lang;
  if (L.lang === lang) return;
  // only swap the boilerplate the user has not touched
  if (L.cc === CC_DEFAULT[L.lang]) L.cc = CC_DEFAULT[lang];
  L.lang = lang;
  state.settings.lastLetterLang = lang;
  touch(); save();
  fillForm();
  toast(lang === 'en' ? 'Letter language: English' : 'पत्र की भाषा: हिन्दी');
}));

/* ── voice target ───────────────────────────────────────────── */

const LKEY = new Map([[F.to, 'field.to'], [F.subject, 'field.subject'],
                      [F.body, 'field.body'], [F.cc, 'field.cc']]);
const targetName = () => t(LKEY.get(target) || 'field.body');

function setTarget(el) {
  target = el;
  TEXTAREAS.forEach(x => x.classList.toggle('is-target', x === el));
  $('#micTarget').textContent = targetName();
}
TEXTAREAS.forEach(el => el.addEventListener('focus', () => setTarget(el)));

/* ── undo (mobile has no Ctrl+Z, and dictation does go wrong) ── */

let undoStack = [], undoT = 0, undoLock = false;
function pushUndo(v) {
  if (undoLock) return;
  clearTimeout(undoT);
  undoT = setTimeout(() => {
    if (undoStack[undoStack.length - 1] === v) return;
    undoStack.push(v);
    if (undoStack.length > 40) undoStack.shift();
  }, 500);
}
$('#btnUndo').addEventListener('click', () => {
  clearTimeout(undoT);
  if (undoStack.length < 2) { toast(t('toast.nothingUndo')); return; }
  undoStack.pop();                       // the current value
  const prev = undoStack[undoStack.length - 1];
  undoLock = true;
  F.body.value = prev;
  fire(F.body);
  undoLock = false;
  toast(t('toast.undone'));
});

/* ── inserting at the cursor ────────────────────────────────── */

function insert(str, { atLineStart = false, eatSpace = false } = {}) {
  const el = target;
  const s = el.selectionStart ?? el.value.length;
  const e = el.selectionEnd ?? s;
  let left = el.value.slice(0, s);
  const right = el.value.slice(e);
  if (eatSpace) left = left.replace(/[ \t]+$/, '');
  if (atLineStart && left && !left.endsWith('\n')) str = '\n' + str;
  el.value = left + str + right;
  el.selectionStart = el.selectionEnd = (left + str).length;
  el.focus();
  fire(el);
}

function insertText(v) {
  const el = target;
  const left = el.value.slice(0, el.selectionStart ?? el.value.length);
  insert((!left || /[\s\n•(]$/.test(left) ? '' : ' ') + v);
}

function delSentence() {
  const el = target;
  const s = el.selectionStart ?? el.value.length;
  const left = el.value.slice(0, s).replace(/\s+$/, '');
  const m = left.match(/[।.?!\n][^।.?!\n]*$/);
  const cut = m ? left.length - m[0].length + 1 : 0;
  el.value = el.value.slice(0, cut) + el.value.slice(s);
  el.selectionStart = el.selectionEnd = cut;
  fire(el);
}

const ACT = {
  text:  a => insertText(a.v),
  para:  () => insert('\n\n'),
  li:    () => insert(BULLET, { atLineStart: true }),
  // the Hindi danda has no place in an English letter
  danda: () => insert(LL() === 'en' ? '. ' : '। ', { eatSpace: true }),
  comma: () => insert(', ', { eatSpace: true }),
  qm:    () => insert('? ', { eatSpace: true }),
  del:   () => delSentence(),
};

/* ── voice ──────────────────────────────────────────────────── */

const micbar = $('#micbar');
const voice = new Voice({
  getDict: () => parseDict(state.settings.dict[LL()]),
  getLang: () => LL(),
  onActions: acts => { for (const a of acts) ACT[a.t]?.(a); },
  onInterim: txt => { $('#micTarget').textContent = txt || targetName(); },
  onState: (s, reasonKey) => {
    micbar.classList.toggle('is-live', s === 'live');
    $('#micState').textContent = t(s === 'live' ? 'mic.live' : 'mic.idle');
    $('#micTarget').textContent = targetName();
    if (reasonKey) toast(t(reasonKey));
  },
});

if (voiceOK) {
  $('#btnMic').addEventListener('click', () => voice.toggle());
} else {
  $('#btnMic').hidden = true;
  $('#micState').textContent = '';
}

$('#btnVoiceHelp').addEventListener('click', () => {
  $('#cmdTbl').replaceChildren(...VOICE_HELP[LL()].map(([say, does]) => {
    const tr = document.createElement('tr');
    tr.append(Object.assign(document.createElement('td'), { textContent: '“' + say + '”' }),
              Object.assign(document.createElement('td'), { textContent: does }));
    return tr;
  }));
  $('#dlgVoice').showModal();
});

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

function chip(text, onTap) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.textContent = text;
  b.addEventListener('click', onTap);
  return b;
}

function buildChips() {
  const lang = LL();
  $('#snipChips').replaceChildren(...SNIPPETS[lang].map(s =>
    chip(s, () => { setTarget(F.body); insertText(s); })));
  $('#bookChips').replaceChildren(...splitLines(state.settings.book[lang]).map(s =>
    chip(s, () => { F.to.value = s; fire(F.to); })));
}

/* ── tabs ───────────────────────────────────────────────────── */

function go(name) {
  $$('.tab').forEach(el => el.classList.toggle('is-active', el.id === 'tab-' + name));
  $$('.tabbtn').forEach(b => b.classList.toggle('is-active', b.dataset.tab === name));
  if (name === 'view') { draw(); requestAnimationFrame(fitStage); }
  if (name === 'list') drawList();
  if (name !== 'write') voice.stop();
}
$$('.tabbtn').forEach(b => b.addEventListener('click', () => {
  const run = () => go(b.dataset.tab);
  if (!document.startViewTransition) return run();
  const vt = document.startViewTransition(run);
  // tapping a second tab mid-animation aborts the first transition and
  // rejects these — expected, and not something to surface as an error
  vt.finished.catch(() => {});
  vt.ready.catch(() => {});
  vt.updateCallbackDone.catch(() => {});
}));

/* ── history ────────────────────────────────────────────────── */

function drawList() {
  const wrap = $('#letterList');
  const rows = state.letters.filter(l => !isEmpty(l) || l.id === state.openId);
  $('#listCount').textContent = t('list.count', { n: rows.length });

  if (!rows.length) {
    const d = document.createElement('div');
    d.className = 'empty'; d.textContent = t('list.empty');
    wrap.replaceChildren(d);
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
               Object.assign(document.createElement('span'), { textContent: L.dinank }),
               Object.assign(document.createElement('span'),
                 { className: 'lrow__tag', textContent: L.lang === 'en' ? 'EN' : 'हिं' }));
    const txt = document.createElement('div');
    txt.className = 'lrow__txt';
    txt.textContent = (L.to.trim() ? L.to.trim() + ' — ' : '') + (preview(L.body) || t('list.blank'));
    main.append(top, txt);

    const copy = document.createElement('button');
    copy.className = 'lrow__act'; copy.textContent = '⧉';
    copy.setAttribute('aria-label', t('list.copy'));
    copy.addEventListener('click', ev => {
      ev.stopPropagation();
      duplicateLetter(L.id);
      fillForm(); go('write');
      toast(t('toast.copied'));
    });

    const del = document.createElement('button');
    del.className = 'lrow__act is-del'; del.textContent = '🗑';
    del.setAttribute('aria-label', t('list.del'));
    del.addEventListener('click', ev => {
      ev.stopPropagation();
      if (!confirm(t('confirm.del'))) return;
      removeLetter(L.id);
      drawList(); fillForm();
      toast(t('toast.deleted'));
    });

    row.append(main, copy, del);
    row.addEventListener('click', () => { openLetter(L.id); fillForm(); go('write'); });
    return row;
  }));
}

/* ── new letter & templates ─────────────────────────────────── */

$('#btnNew').addEventListener('click', () => {
  if (isEmpty(current())) { toast(t('toast.alreadyEmpty')); return; }
  newLetter();
  fillForm(); go('write');
  toast(t('toast.newLetter', { k: current().kramank }));
});

function applyTemplate(tpl) {
  if (!isEmpty(current())) newLetter();
  const L = current();
  if (tpl.to) L.to = tpl.to;
  if (tpl.subject) { L.subject = tpl.subject; L.showSubject = true; }
  L.body = tpl.body;
  L.dinank = shortDate();
  touch();
  fillForm(); go('write');
  F.body.focus();
}

$('#btnTemplates').addEventListener('click', () => {
  $('#tplList').replaceChildren(...TEMPLATES[LL()].map(tpl => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tplrow';
    b.append(Object.assign(document.createElement('strong'), { textContent: tpl.name }),
             Object.assign(document.createElement('small'), { textContent: tpl.desc }));
    b.addEventListener('click', () => { $('#dlgTemplates').close(); applyTemplate(tpl); });
    return b;
  }));
  $('#dlgTemplates').showModal();
});

/* ── PDF · share · print ────────────────────────────────────── */

async function makePdf() {
  if (isEmpty(current())) { toast(t('toast.writeFirst')); return null; }
  busy(true, 'busy.pdf');
  try {
    return await PDF.build(current(), opts(), capture);
  } catch (e) {
    console.error('[pdf]', e);
    toast(t('toast.pdfFail'));
    return null;
  } finally {
    busy(false);
    draw();                       // the capture host is shared — restore preview
  }
}

$('#btnPdf').addEventListener('click', async () => {
  const r = await makePdf();
  if (!r) return;
  PDF.download(r.blob, r.name);
  toast(t('toast.pdfDone', { n: r.pages, name: r.name }));
});

$('#btnShare').addEventListener('click', async () => {
  const r = await makePdf();
  if (!r) return;
  if (await PDF.share(r.blob, r.name, current().to || 'Patra') === 'downloaded') {
    toast(t('toast.noShare'));
  }
});

$('#btnPrint').addEventListener('click', () => { draw(); setTimeout(() => window.print(), 120); });

/* ── settings ───────────────────────────────────────────────── */

const S = state.settings;

function fillSettings() {
  $('#fHiQ').checked = S.hiQ;
  $('#fDevDigits').checked = S.devDigits;
  $('#fHeaderH').value = S.headerH;
  $('#fBook').value = S.book[LL()];
  $('#fDict').value = S.dict[LL()];
  $('#verLbl').textContent = 'v' + VERSION;
  $$('#segUI .seg__b').forEach(b => b.classList.toggle('is-on', b.dataset.ui === uiLang()));
}

$('#btnSettings').addEventListener('click', () => { fillSettings(); $('#dlgSettings').showModal(); });

$$('#segUI .seg__b').forEach(b => b.addEventListener('click', () => {
  S.ui = b.dataset.ui;
  save();
  setUILang(S.ui);
  fillSettings(); fillForm();
}));

$('#fHiQ').addEventListener('change', e => { S.hiQ = e.target.checked; save(); });
$('#fDevDigits').addEventListener('change', e => { S.devDigits = e.target.checked; save(); draw(); });
$('#fHeaderH').addEventListener('input', e => {
  S.headerH = Math.min(90, Math.max(20, +e.target.value || 42));
  save(); draw();
});
// book and dictionary are per letter language
$('#fBook').addEventListener('input', e => { S.book[LL()] = e.target.value; save(); buildChips(); });
$('#fDict').addEventListener('input', e => { S.dict[LL()] = e.target.value; save(); });

$('#fHeader').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  busy(true, 'busy.header');
  try {
    const { url, w, h } = await shrink(file, 2000);
    await assets.set('header', url);
    headerSrc = url;
    S.headerH = Math.min(90, Math.max(20, Math.round(180 * (h / w))));
    $('#fHeaderH').value = S.headerH;
    save(true); draw();
    toast(t('toast.headerSet'));
  } catch (err) {
    console.error(err);
    toast(t('toast.badFile'));
  } finally { busy(false); }
});

$('#btnHeaderReset').addEventListener('click', async () => {
  await assets.del('header');
  headerSrc = await probeAny(['assets/header.jpg', 'assets/header.png']);
  draw();
  toast(t('toast.headerGone'));
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
  PDF.download(new Blob([exportJSON()], { type: 'application/json' }),
               `letterpad-backup-${new Date().toISOString().slice(0, 10)}.json`);
  toast(t('toast.backupSaved'));
}
$('#btnExport').addEventListener('click', doExport);
$('#btnBackup').addEventListener('click', doExport);

$('#fImport').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    const n = importJSON(await file.text());
    fillSettings(); fillForm(); drawList();
    toast(n ? t('toast.imported', { n }) : t('toast.importedNone'));
  } catch (err) {
    console.error(err);
    toast(t('toast.badFile'));
  }
});

/* ── first-run tour ─────────────────────────────────────────── */

const TOUR = ['tour.1', 'tour.2', 'tour.3'];
let tourAt = 0;

function drawTour() {
  const body = $('#tourBody');
  const h = document.createElement('h3'); h.textContent = t(TOUR[tourAt] + '.t');
  const p = document.createElement('p');  p.textContent = t(TOUR[tourAt] + '.b');
  body.replaceChildren(h, p);

  if (tourAt === 0) {                    // language choice, up front
    const seg = document.createElement('div');
    seg.className = 'seg';
    for (const [code, name] of [['hi', 'हिन्दी'], ['en', 'English']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg__b' + (uiLang() === code ? ' is-on' : '');
      b.textContent = name;
      b.addEventListener('click', () => {
        S.ui = code; S.lastLetterLang = code;
        const L = current();
        if (isEmpty(L)) { L.lang = code; L.cc = CC_DEFAULT[code]; }
        save(); setUILang(code); fillForm(); drawTour();
      });
      seg.append(b);
    }
    body.append(seg);
  }

  $('#tourDots').replaceChildren(...TOUR.map((_, i) => {
    const d = document.createElement('i');
    if (i === tourAt) d.className = 'is-on';
    return d;
  }));
  $('#tourNext').textContent = t(tourAt === TOUR.length - 1 ? 'btn.start' : 'btn.next');
}

function endTour() {
  S.seenTour = true; save(true);
  $('#dlgTour').close();
}
$('#tourNext').addEventListener('click', () => {
  if (tourAt === TOUR.length - 1) return endTour();
  tourAt++; drawTour();
});
$('#tourSkip').addEventListener('click', endTour);

/* ── add to home screen ─────────────────────────────────────── */

let installEvt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvt = e;
  $('#btnInstall').hidden = false;
});
$('#btnInstall').addEventListener('click', async () => {
  $('#btnInstall').hidden = true;
  if (!installEvt) return;
  installEvt.prompt();
  await installEvt.userChoice;
  installEvt = null;
});
window.addEventListener('appinstalled', () => { $('#btnInstall').hidden = true; });

/* ── keyboard-aware layout ──────────────────────────────────── */

if (window.visualViewport) {
  const vv = window.visualViewport;
  const onVV = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb + 'px');
    $('#tabbar').hidden = kb > 120;      // reclaim the space while typing
  };
  vv.addEventListener('resize', onVV);
  vv.addEventListener('scroll', onVV);
}
window.addEventListener('resize', () => requestAnimationFrame(fitStage));

/* ── go ─────────────────────────────────────────────────────── */

(async function boot() {
  load();
  setUILang(state.settings.ui || 'hi');

  [headerSrc, photoSrc, logoSrc] = await Promise.all([
    assets.get('header').then(v => v || probeAny(['assets/header.jpg', 'assets/header.png'])),
    probeAny(['assets/photo.jpg', 'assets/photo.png']),
    probeAny(['assets/logo.png', 'assets/logo.jpg']),
  ]);

  fillSettings();
  setTarget(F.body);
  fillForm();
  undoStack = [F.body.value];

  if (!voiceOK) F.body.placeholder = t('ph.bodyNoMic');
  if (!state.settings.seenTour) { drawTour(); $('#dlgTour').showModal(); }

  window.addEventListener('beforeunload', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('[sw]', e));
  }
})();
