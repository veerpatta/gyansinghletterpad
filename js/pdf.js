/* ═══════════════════════════════════════════════════════════════
   pdf.js — A4 pages → PDF.

   The letter is re-laid-out into the offscreen host at scale 1 and
   rasterised there, so the PDF never inherits the preview's CSS
   transform. Raster (not embedded fonts) is deliberate: PDFKit-family
   libraries do no OpenType shaping, so Devanagari conjuncts and matras
   come out broken. Screenshotting the browser's own correct rendering
   is the only dependable route for Hindi.
   ═══════════════════════════════════════════════════════════════ */

import { layout } from './render.js';
import { latinSlug, toLatin } from './format.js';

const A4 = { w: 210, h: 297 };

export function fileName(L) {
  const k = latinSlug(toLatin(L.kramank || '').replace(/\//g, '-'), '');
  const to = latinSlug(L.to, '');
  return ['Patra', k, to].filter(Boolean).join('-').slice(0, 60) + '.pdf';
}

/** Make sure every webfont and background image is decoded first. */
async function ready(host) {
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('400 16px "Noto Sans Devanagari"'),
        document.fonts.load('700 16px "Noto Sans Devanagari"'),
      ]);
      await document.fonts.ready;
    } catch { /* fall through — a fallback font is better than no PDF */ }
  }
  const urls = [...host.querySelectorAll('*')]
    .map(n => (n.style.backgroundImage || '').match(/url\("?(.+?)"?\)/)?.[1])
    .filter(Boolean);
  await Promise.all(urls.map(src => new Promise(res => {
    const i = new Image();
    i.onload = i.onerror = res;
    i.src = src;
  })));
}

async function shoot(page, scale) {
  const canvas = await html2canvas(page, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width: page.offsetWidth,
    height: page.offsetHeight,
    windowWidth: page.offsetWidth,
    windowHeight: page.offsetHeight,
  });
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * @returns {Promise<{blob: Blob, name: string, pages: number}>}
 */
export async function build(letter, opts, host) {
  const { pages } = layout(host, letter, opts);
  await ready(host);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

  let scale = opts.hiQ ? 3 : 2;
  for (let i = 0; i < pages.length; i++) {
    if (i) doc.addPage();
    let img;
    try {
      img = await shoot(pages[i], scale);
    } catch (e) {
      // low-memory phones can refuse an 8-megapixel canvas — retry smaller
      console.warn('[pdf] scale', scale, 'failed, retrying at 1.5', e);
      scale = 1.5;
      img = await shoot(pages[i], scale);
    }
    doc.addImage(img, 'JPEG', 0, 0, A4.w, A4.h, undefined, 'FAST');
  }

  return { blob: doc.output('blob'), name: fileName(letter), pages: pages.length };
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Share sheet → WhatsApp. Falls back to a plain download. */
export async function share(blob, name, title) {
  const file = new File([blob], name, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      console.warn('[pdf] share failed, downloading instead', e);
    }
  }
  download(blob, name);
  return 'downloaded';
}
