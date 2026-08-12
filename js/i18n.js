/* ═══════════════════════════════════════════════════════════════
   i18n.js — app-chrome strings.

   Two languages are in play and they are deliberately separate:
     • the APP language (this file) — set once in Settings, rarely touched
     • the LETTER language (see render.js LBL) — chosen per letter
   Merging them into one switch would mean a Hindi-speaking user has to
   read an English interface just to send one English letter.
   ═══════════════════════════════════════════════════════════════ */

export const LANGS = { hi: 'हिन्दी', en: 'English' };

const STR = {
  hi: {
    'app.sub': 'ब्लॉक कांग्रेस कमेटी आमेट',
    'letter.new': 'नया पत्र',

    'tab.write': 'लिखें', 'tab.view': 'देखें', 'tab.list': 'पत्र',

    'lang.letter': 'पत्र की भाषा',
    'lang.app': 'ऐप की भाषा',

    'field.ref': 'क्रमांक', 'field.date': 'दिनांक',
    'field.to': 'सेवा में — श्रीमान', 'field.subject': 'विषय',
    'field.body': 'मुख्य भाग', 'field.cc': 'सूचनार्थ प्रेषित',
    'ph.to': 'पी.सी.सी. जयपुर',
    'ph.subject': 'विषय लिखें…',
    'ph.body': 'यहाँ पत्र लिखें, या नीचे 🎤 दबाकर बोलें…',
    'ph.bodyNoMic': 'यहाँ पत्र लिखें — कीबोर्ड के 🎤 बटन से बोलकर भी लिख सकते हैं।',
    'ph.cc': 'एक पंक्ति में एक नाम',

    'btn.point': '• बिंदु', 'btn.para': '¶ पैरा', 'btn.undo': '↶ वापस',
    'btn.addSubject': 'विषय जोड़ें', 'btn.rmSubject': 'विषय हटाएँ',
    'btn.templates': 'टेम्पलेट', 'btn.fit': 'एक पेज में फ़िट करें',
    'btn.pdf': 'PDF', 'btn.send': 'भेजें', 'btn.print': 'प्रिंट',
    'btn.backup': 'बैकअप', 'btn.close': 'बंद', 'btn.new': 'नया पत्र',
    'btn.settings': 'सेटिंग', 'btn.help': 'बोलने के आदेश',
    'btn.start': 'शुरू करें', 'btn.next': 'आगे', 'btn.install': 'फ़ोन में लगाएँ',

    'mic.idle': 'बोलकर लिखें',
    'mic.live': 'सुन रहा हूँ… (रोकने के लिए दबाएँ)',
    'mic.noPerm': 'माइक की अनुमति नहीं मिली',
    'mic.noMic': 'माइक नहीं मिला',
    'mic.noNet': 'इंटरनेट नहीं — कीबोर्ड के 🎤 से बोलें',
    'mic.flap': 'माइक बार‑बार रुक रहा है',

    'page.one': 'पेज 1', 'page.n': '{n} पेज',
    'list.count': '{n} पत्र', 'list.empty': 'अभी कोई पत्र नहीं।\nऊपर + दबाकर शुरू करें।',
    'list.blank': 'खाली पत्र',
    'list.copy': 'प्रतिलिपि', 'list.del': 'हटाएँ',
    'confirm.del': 'यह पत्र हटाएँ?',

    'toast.saved': 'सहेजा गया',
    'toast.deleted': 'पत्र हटा दिया',
    'toast.copied': 'प्रतिलिपि बन गई',
    'toast.alreadyEmpty': 'यह पत्र पहले से खाली है',
    'toast.newLetter': 'नया पत्र — क्रमांक {k}',
    'toast.writeFirst': 'पहले पत्र लिखें',
    'toast.pdfFail': 'PDF नहीं बन पाया',
    'toast.pdfDone': '{n} पेज · {name}',
    'toast.noShare': 'साझा उपलब्ध नहीं — फ़ाइल सहेज ली',
    'toast.headerSet': 'हेडर लग गया',
    'toast.headerGone': 'हेडर हटा दिया',
    'toast.badFile': 'यह फ़ाइल नहीं पढ़ी जा सकी',
    'toast.backupSaved': 'बैकअप सहेज लिया',
    'toast.imported': '{n} पत्र जोड़े गए',
    'toast.importedNone': 'कोई नया पत्र नहीं मिला',
    'toast.nothingUndo': 'वापस लेने को कुछ नहीं',
    'toast.undone': 'वापस ले लिया',
    'busy.pdf': 'PDF बन रहा है…',
    'busy.header': 'हेडर सहेजा जा रहा है…',

    'set.title': 'सेटिंग',
    'set.head': 'लेटरहेड',
    'set.headHint': 'ऊपर का हेडर बदलने के लिए ब्लैंक लेटरपैड का साफ़ स्कैन चुनें (कम से कम 1800px चौड़ा)।',
    'set.headPick': 'हेडर चुनें', 'set.headDrop': 'हटाएँ',
    'set.headH': 'हेडर की ऊँचाई (मिमी)',
    'set.pdf': 'PDF',
    'set.hiQ': 'उच्च गुणवत्ता (बड़ी फ़ाइल)',
    'set.devDigits': 'देवनागरी अंक (१२३)',
    'set.book': 'पता‑पुस्तिका',
    'set.bookHint': 'एक पंक्ति में एक नाम। ये “सेवा में” के नीचे बटन बनकर दिखेंगे।',
    'set.dict': 'शब्द‑सुधार',
    'set.dictHint': 'बोलने पर गलत सुने जाने वाले शब्द। रूप — <code>गलत = सही</code>, हर पंक्ति में एक।',
    'set.backup': 'बैकअप',
    'set.export': 'निर्यात', 'set.import': 'आयात',
    'set.foot': 'सारा डेटा केवल इसी फ़ोन में सुरक्षित रहता है।',

    'tpl.title': 'टेम्पलेट',

    'help.title': 'बोलकर लिखने के आदेश',
    'help.intro': 'माइक चालू करके सामान्य रूप से बोलें। बीच में ये शब्द बोलेंगे तो पत्र अपने‑आप सज जाएगा —',
    'help.say': 'बोलिए', 'help.does': 'होगा',
    'help.tip': 'नाम गलत सुने जाएँ तो सेटिंग → शब्द‑सुधार में जोड़ दें।',

    'tour.1.t': 'नमस्ते 🙏',
    'tour.1.b': 'यह ऐप आपके लेटरपैड पर पत्र बनाता है। बोलिए — पत्र अपने‑आप लिख जाएगा।',
    'tour.2.t': '1 · बोलकर लिखें',
    'tour.2.b': 'नीचे नीला 🎤 बटन दबाएँ और हिन्दी में बोलें। “अगला बिंदु” बोलेंगे तो ①②③ वाली सूची बनेगी।',
    'tour.3.t': '2 · देखें और भेजें',
    'tour.3.b': '“देखें” में पूरा पत्र लेटरहेड पर दिखेगा। फिर PDF दबाकर सहेजें या भेजें दबाकर सीधे WhatsApp पर भेज दें।',
    'tour.skip': 'छोड़ें',
  },

  en: {
    'app.sub': 'Block Congress Committee, Amet',
    'letter.new': 'New letter',

    'tab.write': 'Write', 'tab.view': 'Preview', 'tab.list': 'Letters',

    'lang.letter': 'Letter language',
    'lang.app': 'App language',

    'field.ref': 'Ref. No.', 'field.date': 'Date',
    'field.to': 'To', 'field.subject': 'Subject',
    'field.body': 'Letter body', 'field.cc': 'Copy to',
    'ph.to': 'The District Collector, Rajsamand',
    'ph.subject': 'Write the subject…',
    'ph.body': 'Write the letter here, or press 🎤 below and speak…',
    'ph.bodyNoMic': 'Write the letter here — the keyboard’s own 🎤 button also works.',
    'ph.cc': 'One name per line',

    'btn.point': '• Point', 'btn.para': '¶ Para', 'btn.undo': '↶ Undo',
    'btn.addSubject': 'Add subject', 'btn.rmSubject': 'Remove subject',
    'btn.templates': 'Templates', 'btn.fit': 'Fit onto one page',
    'btn.pdf': 'PDF', 'btn.send': 'Send', 'btn.print': 'Print',
    'btn.backup': 'Backup', 'btn.close': 'Close', 'btn.new': 'New letter',
    'btn.settings': 'Settings', 'btn.help': 'Voice commands',
    'btn.start': 'Get started', 'btn.next': 'Next', 'btn.install': 'Install on phone',

    'mic.idle': 'Speak to write',
    'mic.live': 'Listening… (tap to stop)',
    'mic.noPerm': 'Microphone permission denied',
    'mic.noMic': 'No microphone found',
    'mic.noNet': 'No internet — use the keyboard’s 🎤 instead',
    'mic.flap': 'The microphone keeps cutting out',

    'page.one': 'Page 1', 'page.n': '{n} pages',
    'list.count': '{n} letters', 'list.empty': 'No letters yet.\nPress + above to start.',
    'list.blank': 'Empty letter',
    'list.copy': 'Duplicate', 'list.del': 'Delete',
    'confirm.del': 'Delete this letter?',

    'toast.saved': 'Saved',
    'toast.deleted': 'Letter deleted',
    'toast.copied': 'Duplicate created',
    'toast.alreadyEmpty': 'This letter is already empty',
    'toast.newLetter': 'New letter — Ref. {k}',
    'toast.writeFirst': 'Write the letter first',
    'toast.pdfFail': 'Could not make the PDF',
    'toast.pdfDone': '{n} page(s) · {name}',
    'toast.noShare': 'Sharing unavailable — file saved instead',
    'toast.headerSet': 'Letterhead applied',
    'toast.headerGone': 'Letterhead removed',
    'toast.badFile': 'That file could not be read',
    'toast.backupSaved': 'Backup saved',
    'toast.imported': '{n} letters added',
    'toast.importedNone': 'No new letters found',
    'toast.nothingUndo': 'Nothing to undo',
    'toast.undone': 'Undone',
    'busy.pdf': 'Making the PDF…',
    'busy.header': 'Saving the letterhead…',

    'set.title': 'Settings',
    'set.head': 'Letterhead',
    'set.headHint': 'Pick a clean, straight scan of a blank letterpad sheet (at least 1800px wide).',
    'set.headPick': 'Choose letterhead', 'set.headDrop': 'Remove',
    'set.headH': 'Letterhead height (mm)',
    'set.pdf': 'PDF',
    'set.hiQ': 'High quality (larger file)',
    'set.devDigits': 'Devanagari digits (१२३)',
    'set.book': 'Address book',
    'set.bookHint': 'One name per line. These appear as buttons under “To”.',
    'set.dict': 'Word corrections',
    'set.dictHint': 'Words the microphone hears wrong. Format — <code>wrong = right</code>, one per line.',
    'set.backup': 'Backup',
    'set.export': 'Export', 'set.import': 'Import',
    'set.foot': 'All data stays on this phone only.',

    'tpl.title': 'Templates',

    'help.title': 'Voice commands',
    'help.intro': 'Turn on the mic and speak normally. Say these words in between and the letter formats itself —',
    'help.say': 'Say', 'help.does': 'Result',
    'help.tip': 'If names come out wrong, add them under Settings → Word corrections.',

    'tour.1.t': 'Welcome 🙏',
    'tour.1.b': 'This app writes letters onto your letterhead. Just speak — the letter types itself.',
    'tour.2.t': '1 · Speak to write',
    'tour.2.b': 'Press the blue 🎤 button below and speak. Say “next point” to build a numbered ①②③ list.',
    'tour.3.t': '2 · Preview and send',
    'tour.3.b': 'The Preview tab shows the whole letter on the letterhead. Then press PDF to save it, or Send to share it straight to WhatsApp.',
    'tour.skip': 'Skip',
  },
};

let cur = 'hi';

export const uiLang = () => cur;

export function t(key, vars) {
  let s = (STR[cur] && STR[cur][key]) ?? STR.hi[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
  return s;
}

export function setUILang(lang) {
  cur = STR[lang] ? lang : 'hi';
  document.documentElement.lang = cur;
  applyI18n();
}

/** Swap every marked-up string in place. Keeps the strings out of app.js. */
export function applyI18n(root = document) {
  for (const n of root.querySelectorAll('[data-i18n]'))      n.textContent = t(n.dataset.i18n);
  for (const n of root.querySelectorAll('[data-i18n-html]')) n.innerHTML  = t(n.dataset.i18nHtml);
  for (const n of root.querySelectorAll('[data-i18n-ph]'))   n.placeholder = t(n.dataset.i18nPh);
  for (const n of root.querySelectorAll('[data-i18n-al]'))   n.setAttribute('aria-label', t(n.dataset.i18nAl));
}
