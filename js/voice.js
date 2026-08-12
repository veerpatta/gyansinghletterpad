/* ═══════════════════════════════════════════════════════════════
   voice.js — Hindi dictation via the Web Speech API.

   Emits *actions*, not text, so the caller decides how each one lands
   in the editor. Where the API is missing (iOS Safari, Firefox) the
   caller hides the button: every field is a real <textarea>, so the
   keyboard's own mic still works.
   ═══════════════════════════════════════════════════════════════ */

import { tidy, applyDict } from './format.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const supported = !!SR;

/* ── spoken commands ────────────────────────────────────────── */
/* Most specific first — the alternation is matched in order. */
const CMD_DEFS = [
  { k: 'stop',  re: 'बंद\\s*करो|बन्द\\s*करो|रुक\\s*जाओ|माइक\\s*बंद|stop\\s+listening' },
  { k: 'del',   re: 'पिछला\\s*हटाओ|पिछला\\s*मिटाओ|गलत\\s*हुआ|मिटाओ|delete\\s+that' },
  { k: 'li',    re: 'अगला\\s*बिंदु|अगला\\s*बिन्दु|नया\\s*बिंदु|नया\\s*बिन्दु|बुलेट|next\\s+point' },
  { k: 'para',  re: 'नया\\s*पैराग्राफ|नयी\\s*पैराग्राफ|नई\\s*पैराग्राफ|नया\\s*अनुच्छेद|' +
                    'नई\\s*लाइन|नयी\\s*लाइन|नई\\s*पंक्ति|new\\s+paragraph|new\\s+line' },
  { k: 'danda', re: 'पूर्ण\\s*विराम|पूर्णविराम|फुल\\s*स्टॉप|full\\s+stop' },
  { k: 'comma', re: 'अल्प\\s*विराम|अल्पविराम|कॉमा|comma' },
  { k: 'qm',    re: 'प्रश्नवाचक\\s*चिन्ह|प्रश्न\\s*चिन्ह|प्रश्नवाचक|question\\s+mark' },
];
const CMD_RE = new RegExp('(' + CMD_DEFS.map(d => d.re).join('|') + ')', 'giu');

function classify(token) {
  for (const d of CMD_DEFS) {
    if (new RegExp('^(?:' + d.re + ')$', 'iu').test(token.trim())) return d.k;
  }
  return null;
}

/**
 * Turn one final transcript into a list of editor actions.
 * @returns {Array<{t:string, v?:string}>}
 */
export function toActions(transcript, dictPairs = []) {
  const out = [];
  const src = applyDict(String(transcript), dictPairs);

  for (const piece of src.split(CMD_RE)) {
    if (!piece) continue;
    const kind = classify(piece);
    if (kind) {
      out.push({ t: kind });
    } else {
      const text = tidy(piece);
      if (text) out.push({ t: 'text', v: text });
    }
  }
  return out;
}

/* ── the recogniser ─────────────────────────────────────────── */

export class Voice {
  /**
   * @param {{onActions:Function, onInterim:Function, onState:Function, getDict:Function}} h
   */
  constructor(h) {
    this.h = h;
    this.want = false;
    this.rec = null;
    this.lock = null;
    this.restarts = 0;
    this.restartAt = 0;
  }

  get live() { return this.want; }

  toggle() { this.want ? this.stop() : this.start(); }

  async start() {
    if (!supported || this.want) return;
    this.want = true;
    this.restarts = 0;
    this.#spin();
    this.h.onState('live');
    try {
      if (navigator.wakeLock) this.lock = await navigator.wakeLock.request('screen');
    } catch { /* the screen dimming mid-letter is a nuisance, not a failure */ }
  }

  stop(reason = '') {
    this.want = false;
    if (this.rec) { try { this.rec.onend = null; this.rec.stop(); } catch {} this.rec = null; }
    if (this.lock) { try { this.lock.release(); } catch {} this.lock = null; }
    this.h.onInterim('');
    this.h.onState('idle', reason);
  }

  #spin() {
    const rec = new SR();
    this.rec = rec;
    rec.lang = 'hi-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const acts = toActions(r[0].transcript, this.h.getDict());
          if (acts.some(a => a.t === 'stop')) {
            this.h.onActions(acts.filter(a => a.t !== 'stop'));
            this.stop();
            return;
          }
          if (acts.length) this.h.onActions(acts);
        } else {
          interim += r[0].transcript;
        }
      }
      this.h.onInterim(interim.trim());
    };

    rec.onerror = e => {
      const err = e.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        this.stop('माइक की अनुमति नहीं मिली');
      } else if (err === 'audio-capture') {
        this.stop('माइक नहीं मिला');
      } else if (err === 'network') {
        this.stop('इंटरनेट नहीं — कीबोर्ड के 🎤 से बोलें');
      }
      // 'no-speech' and 'aborted' are routine; onend restarts us
    };

    rec.onend = () => {
      if (!this.want) return;
      // Chrome closes the stream every ~60s of quiet. Restart, but bail
      // out if it is failing instantly in a loop.
      const now = Date.now();
      this.restarts = now - this.restartAt < 1200 ? this.restarts + 1 : 0;
      this.restartAt = now;
      if (this.restarts > 6) { this.stop('माइक बार‑बार रुक रहा है'); return; }
      setTimeout(() => { if (this.want) this.#spin(); }, 260);
    };

    try {
      rec.start();
    } catch {
      // start() throws if a previous instance is still winding down
      setTimeout(() => { if (this.want) this.#spin(); }, 350);
    }
  }
}
