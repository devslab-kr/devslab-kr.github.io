/**
 * The cookie consent bar and its settings dialog, framework-free.
 *
 * Below 35rem the three choices stack in one column, still equal in size, so
 * no language has to break a label mid-word (German, Spanish, Portuguese,
 * Hindi at 390px); from 35rem they sit in one row — the bar by viewport
 * width, the dialog footer by the dialog's own width (a container query).
 *
 * Behaviour comes from @devslab/site-kit's createConsentManager (D-034):
 * nothing that contacts Google runs until the visitor grants analytics for
 * the current policy version. This file is only the markup the kit leaves to
 * a non-Solid site, written once so every page of devslab.kr (the Next.js
 * pages and the static ones under public/) and the open-source hub draw the
 * same bar:
 *
 *   - three equal choices — accept all, reject, settings — same element,
 *     same size, same style; ✕ and Escape close the bar without a decision;
 *   - the settings dialog shows "necessary" as text and "analytics" as a
 *     switch that starts unticked (ticked only when already granted), traps
 *     focus, focuses the switch first, closes on Escape without saving and
 *     gives focus back to whatever opened it;
 *   - any [data-consent-settings] element, or a link to #cookie-settings,
 *     reopens the dialog to change or withdraw.
 *
 * Text follows <html lang> (and dir) as the page changes it, and the tone
 * (light/dark) follows the page. Korean copy gets the same two line-break
 * guards as the rest of devslab.kr (glueKorean): a closing bracket stays with
 * the particle after it, and a middle dot never starts a line.
 *
 * No imports, so it runs as-is from any static host. Shared file: the hub
 * vendors a byte-identical copy at assets/consent/consent-ui.js. Change both
 * together.
 */

// Same pattern as src/utils/koreanGlue.ts (a test pins the two together).
const KOREAN_GLUE = /[)\]”’][가-힣]+|(?<=[가-힣])·(?=[\p{L}\p{N}])/gu;
const RTL = new Set(['ar']);
const STYLE_ID = 'dl-consent-style';
const ROOT_KEY = '__dlConsentUI';

const STYLE = `
.dlc,.dlc *{box-sizing:border-box}
.dlc{--dlc-bg:#fff;--dlc-fg:#18181b;--dlc-muted:#52525b;--dlc-line:#e4e4e7;--dlc-soft:#f4f4f5;--dlc-btn:#fff;--dlc-btn-line:#d4d4d8;--dlc-accent:#0891b2;--dlc-ring:#06b6d4;--dlc-track:#d4d4d8;--dlc-shadow:0 10px 30px rgba(9,9,11,.12);font-size:14px;line-height:1.6;font-family:inherit;font-weight:400;color:var(--dlc-fg);text-align:start;letter-spacing:normal}
.dlc[data-tone=dark]{--dlc-bg:#18181b;--dlc-fg:#f4f4f5;--dlc-muted:#a1a1aa;--dlc-line:#3f3f46;--dlc-soft:#27272a;--dlc-btn:#18181b;--dlc-btn-line:#52525b;--dlc-accent:#22d3ee;--dlc-ring:#22d3ee;--dlc-track:#52525b;--dlc-shadow:0 10px 30px rgba(0,0,0,.5)}
.dlc:lang(ko),.dlc :lang(ko){word-break:keep-all;overflow-wrap:break-word}
.dlc .ko-nobr{white-space:nowrap}
.dlc .ko-dot::after{content:"\\2060"}
.dlc[hidden],.dlc [hidden]{display:none!important}
.dlc-bar{position:fixed;z-index:2147483000;inset-inline:16px;bottom:16px;max-width:64rem;margin-inline:auto;background:var(--dlc-bg);border:1px solid var(--dlc-line);border-radius:12px;box-shadow:var(--dlc-shadow);padding:16px}
.dlc-bar-inner{display:grid;gap:12px}
.dlc-copy{padding-inline-end:32px;min-width:0}
.dlc-title{margin:0 0 4px;font-size:15px;font-weight:600;line-height:1.4;color:var(--dlc-fg)}
.dlc-body,.dlc-p{margin:0;color:var(--dlc-muted)}
.dlc a.dlc-link{color:var(--dlc-accent);text-decoration:underline;text-underline-offset:2px;font-weight:500}
.dlc a.dlc-link:hover{text-decoration-thickness:2px}
.dlc-actions,.dlc-foot{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:stretch}
@media (min-width:35rem){.dlc-actions{grid-template-columns:repeat(3,minmax(0,1fr))}}
.dlc-btn{appearance:none;overflow-wrap:normal;word-break:keep-all;hyphens:none;margin:0;min-height:40px;padding:8px 12px;border:1px solid var(--dlc-btn-line);border-radius:8px;background:var(--dlc-btn);color:var(--dlc-fg);font:inherit;font-weight:600;line-height:1.25;white-space:normal;cursor:pointer;transition:border-color .15s,background-color .15s,color .15s}
.dlc-btn:hover{border-color:var(--dlc-accent);color:var(--dlc-accent)}
.dlc-btn:active{background:var(--dlc-soft)}
.dlc-btn:focus-visible,.dlc-x:focus-visible,.dlc a.dlc-link:focus-visible,.dlc-switch input:focus-visible+.dlc-track{outline:2px solid var(--dlc-ring);outline-offset:2px}
.dlc-x{appearance:none;position:absolute;inset-inline-end:8px;top:8px;display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dlc-muted);cursor:pointer}
.dlc-x:hover{background:var(--dlc-soft);color:var(--dlc-fg)}
.dlc-x svg{width:16px;height:16px}
@media (min-width:768px){
.dlc-bar{padding:20px 24px}
.dlc-bar-inner{grid-template-columns:minmax(0,1fr) auto;align-items:end;column-gap:24px}
.dlc-actions{grid-template-columns:repeat(3,minmax(7.5rem,1fr))}
.dlc-bar .dlc-copy{padding-inline-end:24px}
}
.dlc-overlay{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;padding:16px;background:rgba(9,9,11,.55)}
.dlc-dialog{position:relative;display:flex;flex-direction:column;width:100%;max-width:40rem;container-type:inline-size;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);background:var(--dlc-bg);border:1px solid var(--dlc-line);border-radius:12px;box-shadow:var(--dlc-shadow)}
.dlc-head{position:relative;padding:20px 56px 12px 24px;padding-inline:24px 56px;border-bottom:1px solid var(--dlc-line)}
.dlc-head .dlc-x{top:14px;inset-inline-end:12px}
.dlc-h{margin:0;font-size:17px;font-weight:600;line-height:1.4;color:var(--dlc-fg)}
.dlc-content{display:grid;gap:12px;padding:16px 24px;overflow-y:auto}
.dlc-cat{display:grid;gap:6px;padding:14px 16px;border:1px solid var(--dlc-line);border-radius:10px}
.dlc-cat-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;min-height:28px}
.dlc-h3{margin:0;font-size:14px;font-weight:600;line-height:1.4;color:var(--dlc-fg)}
.dlc-status{font-size:13px;font-weight:600;color:var(--dlc-muted)}
.dlc-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;font-weight:600;color:var(--dlc-fg)}
.dlc-switch input{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;opacity:0}
.dlc-track{position:relative;flex:none;width:44px;height:24px;border-radius:999px;background:var(--dlc-track);transition:background-color .15s}
.dlc-track::after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3);transition:transform .15s}
.dlc-switch input:checked+.dlc-track{background:var(--dlc-accent)}
.dlc-switch input:checked+.dlc-track::after{transform:translateX(20px)}
.dlc[dir=rtl] .dlc-switch input:checked+.dlc-track::after{transform:translateX(-20px)}
.dlc-foot{padding:12px 24px 20px;border-top:1px solid var(--dlc-line)}
@container (min-width:35rem){.dlc-foot{grid-template-columns:repeat(3,minmax(0,1fr))}}
.dlc-toast{position:fixed;z-index:2147483002;bottom:16px;inset-inline:16px;max-width:24rem;margin-inline:auto;padding:10px 16px;border:1px solid var(--dlc-line);border-radius:10px;background:var(--dlc-bg);box-shadow:var(--dlc-shadow);font-weight:500;text-align:center}
.dlc-toast:empty{display:none}
@media (prefers-reduced-motion:reduce){.dlc *{transition:none!important}}
@media print{.dlc{display:none!important}}
`;

const CLOSE_ICON =
  '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/**
 * Fills `element` with `text`, gluing the two Korean break points the way
 * glueKorean() does on the React pages. Adds no characters: what copy, find
 * and screen readers see is the original string.
 */
export function setGluedText(element, text, lang) {
  element.textContent = '';
  if (lang !== 'ko') {
    element.textContent = text;
    return;
  }
  const doc = element.ownerDocument;
  let last = 0;
  let run = '';
  const flush = () => {
    if (run) element.appendChild(doc.createTextNode(run));
    run = '';
  };
  for (const match of text.matchAll(KOREAN_GLUE)) {
    run += text.slice(last, match.index);
    if (match[0] === '·') {
      flush();
      const marker = doc.createElement('span');
      marker.className = 'ko-dot';
      element.appendChild(marker);
      run = '·';
    } else {
      flush();
      const span = doc.createElement('span');
      span.className = 'ko-nobr';
      span.textContent = match[0];
      element.appendChild(span);
    }
    last = match.index + match[0].length;
  }
  run += text.slice(last);
  flush();
}

function parseRgb(value) {
  const match = /rgba?\(([^)]+)\)/.exec(value || '');
  if (!match) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length >= 4 && parts[3] === 0) return null;
  return parts.slice(0, 3);
}

/** Light or dark, from the page's own switch when it has one, else from its background. */
function pageTone(doc) {
  const root = doc.documentElement;
  if (root.classList.contains('dark') || root.dataset.theme === 'dark') return 'dark';
  if (root.classList.contains('light') || root.dataset.theme === 'light') return 'light';
  const view = doc.defaultView;
  for (const element of [doc.body, root]) {
    if (!element || !view) continue;
    const rgb = parseRgb(view.getComputedStyle(element).backgroundColor);
    if (rgb) return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 < 0.45 ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Mounts the bar and dialog once per page and starts the manager (which
 * applies a stored grant: Tag Manager loads, once). Idempotent.
 *
 * @param {{
 *   manager: ReturnType<typeof import('@devslab/site-kit').createConsentManager>,
 *   messagesFor: (lang: string) => { lang: string, messages: Record<string, string> },
 *   privacyHref: (lang: string) => string,
 *   footerTrigger?: boolean,
 * }} options  `messagesFor`: strings for a document language (messages.mjs).
 *   `footerTrigger`: on pages whose footer has no cookie-settings
 *   control of its own (static HTML), add one after the footer's last link.
 */
export function mountConsentUI(options) {
  const win = window;
  if (win[ROOT_KEY]) return win[ROOT_KEY];
  const doc = win.document;
  const { manager, messagesFor, privacyHref } = options;

  manager.start();

  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE;
    doc.head.appendChild(style);
  }

  let current = messagesFor(doc.documentElement.lang);
  let bar = null;
  let overlay = null;
  let toast = null;
  let toastTimer = 0;
  let returnFocus = null;

  const el = (tag, className, attrs) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, value);
    return node;
  };
  const text = (node, value) => {
    setGluedText(node, value, current.lang);
    return node;
  };
  const decorate = (node) => {
    node.classList.add('dlc');
    node.setAttribute('lang', current.lang);
    node.setAttribute('dir', RTL.has(current.lang) ? 'rtl' : 'ltr');
    node.dataset.tone = pageTone(doc);
    return node;
  };
  const privacyLink = () => {
    const link = el('a', 'dlc-link', { href: privacyHref(current.lang) });
    return text(link, current.messages.privacyLink);
  };
  const button = (label, onClick, className = 'dlc-btn') => {
    const node = el('button', className, { type: 'button' });
    text(node, label);
    node.addEventListener('click', onClick);
    return node;
  };
  const closeButton = (label, onClick) => {
    const node = el('button', 'dlc-x', { type: 'button', 'aria-label': label, title: label });
    node.innerHTML = CLOSE_ICON;
    node.addEventListener('click', onClick);
    return node;
  };

  const showToast = () => {
    if (!toast) {
      toast = el('div', 'dlc-toast', { role: 'status', 'aria-live': 'polite' });
      doc.body.appendChild(toast);
    }
    decorate(toast);
    toast.classList.add('dlc-toast');
    text(toast, current.messages.saved);
    win.clearTimeout(toastTimer);
    toastTimer = win.setTimeout(() => {
      toast.textContent = '';
    }, 3200);
  };

  const decide = (choice) => {
    if (choice === 'accept') manager.acceptAll();
    else if (choice === 'reject') manager.rejectAll();
    else manager.save({ analytics: choice === true });
    showToast();
  };

  // ── the bar ────────────────────────────────────────────────────────────
  const buildBar = () => {
    const m = current.messages;
    // Divs, not <section>: host pages style bare section elements (the hub pads them).
    const section = decorate(el('div', 'dlc-bar', { role: 'region', 'aria-label': m.regionLabel }));
    const inner = el('div', 'dlc-bar-inner');
    const copy = el('div', 'dlc-copy');
    copy.appendChild(text(el('p', 'dlc-title'), m.title));
    const body = text(el('p', 'dlc-body'), m.body);
    body.append(' ', privacyLink());
    copy.appendChild(body);
    const actions = el('div', 'dlc-actions');
    actions.append(
      button(m.acceptAll, () => decide('accept')),
      button(m.rejectAll, () => decide('reject')),
      button(m.settings, () => openSettings()),
    );
    inner.append(copy, actions);
    section.append(inner, closeButton(m.dismiss, () => manager.dismiss()));
    section.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        manager.dismiss();
      }
    });
    return section;
  };

  const syncBar = () => {
    const ask = manager.needsDecision() && !manager.dismissed();
    if (!ask) {
      if (bar) {
        bar.remove();
        bar = null;
      }
      return;
    }
    const next = buildBar();
    if (bar) bar.replaceWith(next);
    // First in <body>, so keyboard users reach it before the page.
    else doc.body.insertBefore(next, doc.body.firstChild);
    bar = next;
  };

  // ── the settings dialog ────────────────────────────────────────────────
  const focusables = (root) =>
    [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')].filter(
      (node) => node.getClientRects().length > 0,
    );

  const closeSettings = () => {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    doc.documentElement.style.removeProperty('overflow');
    const target = returnFocus && returnFocus.isConnected ? returnFocus : null;
    returnFocus = null;
    target?.focus?.();
  };

  const buildDialog = (checked) => {
    const m = current.messages;
    const shade = decorate(el('div', 'dlc-overlay'));
    const dialog = el('div', 'dlc-dialog', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlc-settings-title' });
    const head = el('div', 'dlc-head');
    head.append(text(el('h2', 'dlc-h', { id: 'dlc-settings-title' }), m.settingsTitle), closeButton(m.close, closeSettings));

    const content = el('div', 'dlc-content');
    content.appendChild(text(el('p', 'dlc-p'), m.settingsIntro));

    const necessary = el('div', 'dlc-cat');
    const necessaryHead = el('div', 'dlc-cat-head');
    necessaryHead.append(text(el('h3', 'dlc-h3'), m.necessaryTitle), text(el('span', 'dlc-status'), m.necessaryStatus));
    necessary.append(necessaryHead, text(el('p', 'dlc-p'), m.necessaryBody));

    const analytics = el('div', 'dlc-cat');
    const analyticsHead = el('div', 'dlc-cat-head');
    const toggle = el('label', 'dlc-switch');
    const input = el('input', '', { type: 'checkbox', role: 'switch', id: 'dlc-analytics' });
    input.checked = checked;
    toggle.append(text(el('span'), m.analyticsSwitch), input, el('span', 'dlc-track', { 'aria-hidden': 'true' }));
    analyticsHead.append(text(el('h3', 'dlc-h3'), m.analyticsTitle), toggle);
    analytics.append(analyticsHead, text(el('p', 'dlc-p'), m.analyticsBody));

    const more = el('p', 'dlc-p');
    more.appendChild(privacyLink());
    content.append(necessary, analytics, more);

    const foot = el('div', 'dlc-foot');
    const after = (fn) => () => {
      fn();
      closeSettings();
    };
    foot.append(
      button(m.rejectAll, after(() => decide('reject'))),
      button(m.acceptAll, after(() => decide('accept'))),
      button(m.save, after(() => decide(input.checked))),
    );

    dialog.append(head, content, foot);
    shade.appendChild(dialog);
    shade.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSettings();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables(dialog);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    // A click on the shade outside the dialog closes it, like Escape.
    shade.addEventListener('mousedown', (event) => {
      if (event.target === shade) closeSettings();
    });
    return { shade, input };
  };

  const openSettings = () => {
    const checked = overlay ? overlay.querySelector('#dlc-analytics').checked : manager.analyticsGranted();
    if (!overlay) returnFocus = doc.activeElement instanceof win.HTMLElement ? doc.activeElement : null;
    const { shade, input } = buildDialog(checked);
    if (overlay) overlay.replaceWith(shade);
    else doc.body.appendChild(shade);
    overlay = shade;
    doc.documentElement.style.overflow = 'hidden';
    input.focus();
  };

  // ── footer trigger for pages that don't render their own ──────────────
  const syncFooterTrigger = () => {
    if (!options.footerTrigger) return;
    let trigger = doc.querySelector('[data-consent-settings]');
    if (!trigger) {
      const footers = doc.querySelectorAll('footer');
      const footer = footers[footers.length - 1];
      if (!footer) return;
      const links = footer.querySelectorAll('a');
      const template = links[links.length - 1];
      trigger = el('a', template ? template.className : '', {
        href: '#cookie-settings',
        role: 'button',
        'data-consent-settings': '',
        'data-consent-label': '',
      });
      if (template) {
        template.after(trigger);
        // Links separated by text (" · ") get the same separator before ours.
        const gap = template.previousSibling;
        if (gap && gap.nodeType === 3 && gap.previousSibling?.nodeName === 'A' && /^[\s·|/•–-]+$/.test(gap.textContent)) {
          trigger.before(doc.createTextNode(gap.textContent));
        }
      } else footer.appendChild(trigger);
    }
    if (trigger.hasAttribute('data-consent-label')) text(trigger, current.messages.trigger);
  };

  // ── wiring ─────────────────────────────────────────────────────────────
  manager.subscribe((event) => {
    if (event.type === 'open-settings') openSettings();
    else syncBar();
  });
  manager.bindTriggers();
  doc.addEventListener('click', (event) => {
    const link = event.target?.closest?.('a[href]');
    if (!link || link.hasAttribute('data-consent-settings')) return;
    const href = link.getAttribute('href') || '';
    if (href !== '#cookie-settings' && !href.endsWith(`${win.location.pathname}#cookie-settings`)) return;
    event.preventDefault();
    openSettings();
  });

  const relabel = () => {
    current = messagesFor(doc.documentElement.lang);
    syncFooterTrigger();
    if (bar) syncBar();
    if (overlay) openSettings();
    if (toast && toast.textContent) text(decorate(toast), current.messages.saved);
  };
  new win.MutationObserver(relabel).observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ['lang', 'dir', 'class', 'data-theme'],
  });
  win.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener?.('change', relabel);

  syncFooterTrigger();
  syncBar();
  if (win.location.hash === '#cookie-settings') {
    win.history.replaceState?.(win.history.state, '', win.location.pathname + win.location.search);
    openSettings();
  }

  const api = Object.freeze({ manager, openSettings });
  win[ROOT_KEY] = api;
  return api;
}
