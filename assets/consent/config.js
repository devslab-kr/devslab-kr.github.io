/**
 * The hub's analytics consent settings — read by the browser (main.js) and by
 * scripts/sync-consent.mjs, which writes the head boot script into every page.
 *
 * Analytics is opt-in (@devslab/site-kit consent, DDS D-034): until a visitor
 * grants analytics for POLICY_VERSION, nothing contacts Google. The policy is
 * devslab.kr/privacy, shared with devslab.kr; bump POLICY_VERSION together
 * with devslab.kr's CONSENT_POLICY_VERSION when what it says about analytics
 * changes, then run `npm run sync:consent`.
 *
 * 2026-10-06: the shared policy's analytics text changed with the short bar
 * (site-kit 0.17.0): section 5 now carries the whole disclosure on its own
 * (no ads, how to withdraw) and the policy uses the bar's word, 이용 통계 /
 * analytics. Every hub visitor is asked again, as on devslab.kr.
 */
export const POLICY_VERSION = '2026-10-06';
export const GTM_ID = 'GTM-5WGTTWSF';
/** Every GA4 stream the container sends to — a withdrawal switches each off. */
export const MEASUREMENT_IDS = ['G-PVH5EZ8XPP'];
/** The shared privacy policy, at its cookie section, in the reader's language (the settings dialog). */
export const privacyHref = (lang) => `https://devslab.kr/privacy/?lang=${encodeURIComponent(lang)}#cookies`;
/**
 * The policy section the bar's "자세히 보기 / Learn more" opens — the same
 * section devslab.kr's own bar opens (its CONSENT_LEARN_MORE_SECTION in
 * src/consent/site.ts): 5, processing and transfers abroad, whose Google LLC
 * card carries the full analytics disclosure the short bar leaves out (Google
 * Analytics 4, Google LLC, the United States, 14 months, never for ads, how to
 * withdraw). Same id in the Korean and the English policy.
 */
export const LEARN_MORE_SECTION = 'processors';
/** The bar's "자세히 보기": the shared policy at that section, in the reader's language. */
export const learnMoreHref = (lang) =>
  `https://devslab.kr/privacy/?lang=${encodeURIComponent(lang)}#${LEARN_MORE_SECTION}`;
