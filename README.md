# लेटरपैड — ब्लॉक कांग्रेस कमेटी आमेट

बोलकर हिन्दी में पत्र लिखें, और एक टैप में लेटरहेड सहित A4 PDF बनाएँ।

Voice-dictated Hindi letters on the official letterhead of
**ज्ञानेन्द्रसिंह चुण्डावत**, अध्यक्ष ब्लॉक कांग्रेस कमेटी आमेट, जिला राजसमन्द (313332),
rendered to a shareable A4 PDF.

**→ https://veerpatta.github.io/gyansinghletterpad/**

Phone-first. No account, no server, no cost. Everything stays on the device.

---

## उपयोग कैसे करें (for Gyan Singh ji)

1. ऊपर वाला लिंक फ़ोन के **Chrome** में खोलें।
2. मेनू (⋮) → **“Add to Home screen”** दबाएँ। अब यह ऐप की तरह खुलेगा — बिना इंटरनेट के भी।
3. **लिखें** में नीचे 🎤 बटन दबाकर हिन्दी में बोलें। बोलते‑बोलते ये आदेश भी दे सकते हैं:

   | बोलिए | होगा |
   |---|---|
   | नया पैराग्राफ | नई लाइन से नया अनुच्छेद |
   | अगला बिंदु | ①②③ वाली सूची में अगला नाम |
   | पूर्ण विराम | । |
   | अल्पविराम | , |
   | पिछला हटाओ | आख़िरी वाक्य मिट जाएगा |
   | बंद करो | माइक बंद |

4. **देखें** में पूरा पत्र लेटरहेड पर दिखेगा → **PDF** दबाकर फ़ाइल सहेजें, या **भेजें** दबाकर सीधे WhatsApp पर भेजें।

> अगर 🎤 बटन न दिखे (iPhone / Firefox), तो कीबोर्ड के अपने 🎤 बटन से बोलकर लिखें — वह हर जगह चलता है।

---

## ⚠️ बाकी काम: असली लेटरहेड की स्कैन

फ़ोटो (`assets/photo.jpg`) और कांग्रेस चिह्न (`assets/logo.png`) लग चुके हैं।
हेडर का बाक़ी हिस्सा अभी **CSS से बनी नक़ल** है — देखने में असली जैसा, पर हूबहू नहीं।
असली लेटरपैड लगाने के लिए:

1. एक **कोरे लेटरपैड** का सीधा, साफ़ स्कैन लें — टेढ़ा नहीं, परछाईं नहीं, कम से कम **1800px चौड़ा**।
2. ऊपर से लेकर **हरी लाइन के ठीक नीचे तक** काटें (क्रमांक/दिनांक वाली लाइन शामिल न करें — वह ऐप ख़ुद छापता है)।
3. या तो फ़ाइल को `assets/header.jpg` नाम से repo में डालें,
   **या** ऐप में ⚙️ **सेटिंग → हेडर चुनें** से फ़ोन से ही चुन लें (कोई कोड बदलने की ज़रूरत नहीं)।

अगर प्रिंटर के पास मूल डिज़ाइन (PDF / CDR / AI) हो तो वह सबसे अच्छा रहेगा।

`assets/header.*` मिलते ही CSS वाला हेडर अपने‑आप बंद हो जाएगा और स्कैन लग जाएगा।
फ़ोटो या चिह्न बदलना हो तो `assets/photo.jpg` / `assets/logo.png` को बदल दें —
`.jpg` और `.png` दोनों चलते हैं।

---

## Design notes

### Why the PDF is a raster, not embedded-font vector

jsPDF / pdfmake / PDFKit do **no OpenType shaping**. Hand them Devanagari and
conjuncts and matras (क्ष, र्म, ि) come out broken or reordered — the text is
silently wrong, which is worse than ugly. So the page is laid out in the
browser, where shaping is correct, and rasterised at ~288 dpi
(`html2canvas` → `jsPDF.addImage`). A one-page letter is ~320 KB.

The **प्रिंट** button is the vector escape hatch: `window.print()` with
`@page { size: A4; margin: 0 }` gives sharp, selectable, searchable Hindi
through the phone's own *Save as PDF*.

### Why the editor is textareas, not contenteditable

Plain `<textarea>` means **Gboard's mic button works**, so Hindi dictation
still works on iPhone and Firefox where the Web Speech API doesn't. It also
means the Hindi keyboard, selection and autocorrect all behave natively, and
that pagination is ours to control rather than the browser's.

### Auto-fit

`js/render.js` picks the **largest** body size from 19px down to 13px that
still fits one sheet, then feeds part of the leftover height back as
inter-block padding (capped) so a short letter breathes instead of leaving a
dead slab above the signature. Only if 13px still overflows does it paginate —
continuation pages get a slim text header and `पृष्ठ 2`, and the signature and
सूचनार्थ प्रेषित blocks always land on the last page.

Everything is built and measured inside `#capture`, an offscreen host that is
always laid out; the visible preview receives finished clones. Measuring inside
a hidden tab would return zero heights.

### Storage

`localStorage` holds the letters, settings, address book and correction
dictionary. Images (the header scan) go to **IndexedDB** — a data-URL in
localStorage would blow the 5 MB quota and take the letters down with it.

क्रमांक auto-increments per month (`01/8/26` → `02/8/26`) from the existing letters.

---

## Layout

```
index.html              single page, 3 tabs, no router
css/page.css            the A4 letter — screen preview, PDF capture and @media print
css/app.css             the phone UI
js/render.js            model → pages, auto-fit, pagination
js/pdf.js               capture → jsPDF → download / Web Share
js/voice.js             SpeechRecognition + spoken commands
js/format.js            text tidy, digits, dates, blocks   (pure, no DOM)
js/store.js             localStorage + IndexedDB
js/templates.js         letter templates, snippets, seed dictionary
vendor/                 html2canvas 1.4.1, jsPDF 2.5.2 — committed, not CDN
fonts/                  Noto Sans Devanagari (variable 400–700), self-hosted
sw.js                   cache-first shell → works with no signal
```

No build step and no dependencies to install — GitHub Pages serves the repo root as-is.

## Local development

```bash
npx --yes serve -l 8123 .
```

The service worker is cache-first, so **unregister it** (DevTools → Application →
Service Workers) or bump `CACHE` in `sw.js` after editing CSS/JS, otherwise you
will keep seeing the previous version.

The three `404`s for `assets/header.jpg`, `assets/photo.png` and
`assets/logo.png` on first load are expected — those assets are optional and the
app probes for them.

## Deploying

Push to `main`, then **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
`.nojekyll` is present so paths are served untouched. Bump `CACHE` in `sw.js`
whenever you ship a change, or returning users keep the cached build.
