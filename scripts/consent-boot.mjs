/**
 * The head boot script every hub page carries instead of Google's Tag Manager
 * snippet. A static page can't be decided from the cookie on a server, so the
 * script reads the first-party consent cookie itself:
 *
 *   - a current, unexpired grant (`a=1` under POLICY_VERSION, at most twelve
 *     months old) → the kit's granted head: Consent Mode defaults, an
 *     analytics_storage grant, Google's Tag Manager loader;
 *   - anything else → the kit's denied head: Consent Mode defaults pushed into
 *     the page's own dataLayer, which reaches nobody.
 *
 * The cookie parse mirrors the kit's readConsentCookie (strict: exactly the
 * keys v, a, t, id, each once); tests/consent.test.mjs runs this script
 * against the kit on the same cookies. devslab.kr carries the same script
 * (src/utils/gtm.ts) for its own container.
 */
import { CONSENT_COOKIE_NAME, CONSENT_MAX_AGE_SECONDS, consentHeadScript } from '@devslab/site-kit';

export function consentBootScript({ policyVersion, gtm }) {
  const readGrant = String.raw`var g=false;try{var m=/(?:^|;\s*)${CONSENT_COOKIE_NAME}=([^;]*)/.exec(d.cookie);if(m){var f={},p=m[1].split('&'),i,kv;for(i=0;i<p.length;i++){kv=p[i].split('=');if(kv.length!==2||Object.prototype.hasOwnProperty.call(f,kv[0]))throw 0;f[kv[0]]=kv[1]}var n=Math.floor(Date.now()/1000),t=Number(f.t);g=p.length===4&&f.v==='${policyVersion}'&&f.a==='1'&&/^[1-9][0-9]{0,11}$/.test(f.t||'')&&/^[0-9a-f]{32}$/.test(f.id||'')&&t<=n+600&&n-t<=${CONSENT_MAX_AGE_SECONDS}}}catch(e){g=false}`;
  return `(function(w,d){${readGrant}
if(g){${consentHeadScript({ granted: true, gtm })}
}else{${consentHeadScript()}}})(window,document);`;
}
