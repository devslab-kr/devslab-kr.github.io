/**
 * The hub's consent bar: @devslab/site-kit's consent manager (vendored by
 * scripts/sync-consent.mjs) under the bar devslab.kr draws too — consent-ui.js
 * and messages.js are byte-identical copies of devslab.kr's
 * src/consent/consent-ui.mjs and messages.mjs.
 *
 * The head boot script has already loaded Tag Manager if the visitor's cookie
 * grants analytics; this applies the same decision to the manager (which
 * gates the dataLayer), shows the bar when there is no decision, and loads Tag
 * Manager the moment a visitor grants.
 */
import { createConsentManager } from './site-kit-consent.js';
import { mountConsentUI } from './consent-ui.js';
import { consentMessagesFor } from './messages.js';
import { GTM_ID, MEASUREMENT_IDS, POLICY_VERSION, learnMoreHref, privacyHref } from './config.js';

mountConsentUI({
  manager: createConsentManager({ policyVersion: POLICY_VERSION, gtm: GTM_ID, measurementIds: MEASUREMENT_IDS }),
  messagesFor: consentMessagesFor,
  learnMoreHref,
  privacyHref,
  footerTrigger: true,
});
