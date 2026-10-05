/**
 * The hub's analytics consent settings — read by the browser (main.js) and by
 * scripts/sync-consent.mjs, which writes the head boot script into every page.
 *
 * Analytics is opt-in (@devslab/site-kit consent, DDS D-034): until a visitor
 * grants analytics for POLICY_VERSION, nothing contacts Google. The policy is
 * devslab.kr/privacy, shared with devslab.kr; bump POLICY_VERSION together
 * with devslab.kr's CONSENT_POLICY_VERSION when what it says about analytics
 * changes, then run `npm run sync:consent`.
 */
export const POLICY_VERSION = '2026-10-05';
export const GTM_ID = 'GTM-5WGTTWSF';
/** Every GA4 stream the container sends to — a withdrawal switches each off. */
export const MEASUREMENT_IDS = ['G-PVH5EZ8XPP'];
/** The shared privacy policy, at its cookie section, in the reader's language. */
export const privacyHref = (lang) => `https://devslab.kr/privacy/?lang=${encodeURIComponent(lang)}#cookies`;
