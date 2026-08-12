/* ═══════════════════════════════════════════════════════════════
   store.js — all persistence.
   Text lives in localStorage (small, synchronous, survives everything).
   Images live in IndexedDB — a header scan as a data-URL would blow the
   5 MB localStorage quota and take the letters down with it.
   ═══════════════════════════════════════════════════════════════ */

import { CC_DEFAULT, BOOK, DICT_SEED } from './templates.js';
import { shortDate, nextKramank } from './format.js';

const KEY = 'gsl.v1';
export const VERSION = '1.0.0';

const blank = () => ({
  id: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  kramank: '',
  dinank: shortDate(),
  to: '',
  subject: '',
  showSubject: false,
  body: '',
  cc: CC_DEFAULT,
  showCc: true,
  fit: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const defaults = () => ({
  letters: [],
  openId: null,
  settings: {
    hiQ: true,
    devDigits: false,
    headerH: 42,
    book: BOOK.join('\n'),
    dict: DICT_SEED,
  },
});

export const state = defaults();

/* ── load / save ────────────────────────────────────────────── */

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      state.letters = Array.isArray(d.letters) ? d.letters : [];
      state.openId = d.openId || null;
      Object.assign(state.settings, d.settings || {});
    }
  } catch (e) {
    console.warn('[store] load failed, starting fresh', e);
  }
  if (!state.letters.length) state.letters.push(newLetter(false));
  if (!current()) state.openId = state.letters[0].id;
  return state;
}

let saveTimer = 0;
export function save(immediate = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        letters: state.letters, openId: state.openId, settings: state.settings,
      }));
    } catch (e) {
      console.warn('[store] save failed', e);
    }
  };
  if (immediate) write(); else saveTimer = setTimeout(write, 400);
}

/* ── letters ────────────────────────────────────────────────── */

export function current() {
  return state.letters.find(l => l.id === state.openId) || null;
}

export function newLetter(push = true) {
  const l = blank();
  l.kramank = nextKramank(state.letters.map(x => x.kramank));
  if (push) {
    state.letters.unshift(l);
    state.openId = l.id;
    save();
  }
  return l;
}

export function openLetter(id) {
  if (state.letters.some(l => l.id === id)) { state.openId = id; save(); }
}

export function removeLetter(id) {
  const i = state.letters.findIndex(l => l.id === id);
  if (i < 0) return;
  state.letters.splice(i, 1);
  if (!state.letters.length) newLetter();
  else if (state.openId === id) state.openId = state.letters[0].id;
  save(true);
}

export function touch() {
  const l = current();
  if (!l) return;
  l.updatedAt = Date.now();
  // keep the working letter at the top of the history list
  const i = state.letters.indexOf(l);
  if (i > 0) { state.letters.splice(i, 1); state.letters.unshift(l); }
  save();
}

/** A letter with nothing in it shouldn't clutter the history. */
export function isEmpty(l) {
  return !l || (!l.to.trim() && !l.body.trim() && !l.subject.trim());
}

/* ── backup ─────────────────────────────────────────────────── */

export function exportJSON() {
  return JSON.stringify({
    app: 'gyansingh-letterpad', version: VERSION, at: new Date().toISOString(),
    letters: state.letters, settings: state.settings,
  }, null, 2);
}

export function importJSON(text) {
  const d = JSON.parse(text);
  if (!d || !Array.isArray(d.letters)) throw new Error('गलत फ़ाइल');
  const have = new Set(state.letters.map(l => l.id));
  let added = 0;
  for (const l of d.letters) {
    if (l && l.id && !have.has(l.id)) { state.letters.push(l); have.add(l.id); added++; }
  }
  state.letters.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  if (d.settings) Object.assign(state.settings, d.settings);
  save(true);
  return added;
}

/* ── IndexedDB: the header image ────────────────────────────── */

const DB = 'gsl-assets', STORE = 'kv';

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); res(req && req.result); };
    t.onerror = () => { db.close(); rej(t.error); };
  });
}

export const assets = {
  get: k => tx('readonly', s => s.get(k)).catch(() => null),
  set: (k, v) => tx('readwrite', s => s.put(v, k)),
  del: k => tx('readwrite', s => s.delete(k)),
};
