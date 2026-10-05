// Vendored from @devslab/site-kit@0.17.0 src/core/gtm.mjs by scripts/sync-consent.mjs — do not edit.
/**
 * Google Tag Manager, written once for the family sites (D-031).
 *
 * The strings below are Google's, character for character, with only the
 * container id substituted. The loader is the nonce-aware variant Google
 * publishes for pages under a Content Security Policy
 * (https://developers.google.com/tag-platform/security/guides/csp): it is the
 * standard snippet plus one statement that copies the page's nonce onto the
 * gtm.js element it creates, so Tag Manager can pass that nonce on to the
 * scripts it adds. Every family site runs a nonce CSP, so this is the variant
 * that fits all of them; on a page without nonces the extra statement finds no
 * `[nonce]` element and does nothing.
 *
 * The id is validated before it is placed inside a script string: a value
 * that is not `GTM-` plus uppercase letters and digits never reaches the
 * output. The pattern admits no quote, backslash, `<` or whitespace, so the
 * id cannot close the string literal or the element it sits in.
 */

export const GTM_CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

const containerId = (value) => {
  if (typeof value !== "string" || !GTM_CONTAINER_ID_PATTERN.test(value)) {
    throw new RangeError(`Google Tag Manager container id must match ${GTM_CONTAINER_ID_PATTERN} (for example "GTM-AB12CD3"); got ${JSON.stringify(value)}`);
  }
  return value;
};

/**
 * The body of the head loader `<script>` — no `<script>` tag and no nonce:
 * the page's renderer owns the element and puts the per-request nonce on it
 * (in TanStack Start the router does, from `ssr.nonce`).
 */
export function gtmHeadScript(id) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');
n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId(id)}');`;
}

/** The contents of the `<noscript>` Google places right after `<body>` opens. */
export function gtmNoscriptIframe(id) {
  return `<iframe src="https://www.googletagmanager.com/ns.html?id=${containerId(id)}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
}

const sources = (...list) => Object.freeze(list);

/**
 * CSP sources a page needs for Tag Manager plus Google Analytics 4 without
 * Ads features, per Google's "Use Tag Manager with a Content Security
 * Policy" guide. Add each list to the directive of the same name, next to
 * the page's own nonce.
 *
 * - script-src: Google lists it under `script-src-elem`; a policy without
 *   that directive falls back to `script-src`, which is where the family
 *   sites keep their nonce.
 * - connect-src: `*.google.com` is Google's own entry and also covers
 *   `www.google.com` (the container's) and `*.analytics.google.com` (GA4's
 *   regional collection hosts) — a CSP wildcard matches any depth of
 *   subdomain.
 * - frame-src: the `<noscript>` iframe.
 *
 * Not included, by design: Tag Manager preview mode (tagmanager.google.com,
 * gstatic, Google Fonts), Custom JavaScript variables (`'unsafe-eval'`), and
 * the Google Ads / Google signals hosts (doubleclick, googlesyndication,
 * googleadservices, `*.google.<TLD>`). A product that turns one of those on
 * adds its sources from the same guide.
 */
export const GTM_CSP_SOURCES = Object.freeze({
  "script-src": sources("https://www.googletagmanager.com"),
  "connect-src": sources("https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.google.com"),
  "img-src": sources("https://www.googletagmanager.com", "https://*.google-analytics.com"),
  "frame-src": sources("https://www.googletagmanager.com"),
});
