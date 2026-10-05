// Vendored from @devslab/site-kit@0.17.0 src/core/consent.mjs by scripts/sync-consent.mjs — do not edit.
import { GTM_CONTAINER_ID_PATTERN, gtmHeadScript } from "./site-kit-gtm.js";

/**
 * Opt-in analytics consent for the family sites (D-034).
 *
 * Nothing that contacts Google — the Tag Manager loader, gtag, GA cookies —
 * runs until the visitor grants analytics for the current policy version.
 * Without a decision, after "Reject", after a dismissed banner, or under an
 * older policy version, the page only pushes Consent Mode v2 defaults (all
 * denied) into its own dataLayer. That push is local; it reaches nobody.
 *
 * This file is framework-free and dependency-free: it runs in the source
 * stage of CI (no packages installed), in Workers, in Node and in browsers.
 * The DOM is touched only inside a manager's methods, never at import time
 * or creation, so a manager can be created in shared module scope on a
 * server that renders many requests.
 */

export const CONSENT_COOKIE_NAME = "site_consent";
/** Twelve months. The cookie expires then, and a decision older than this no longer counts. */
export const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
/** Letters, digits, `.`, `_` and `-`, starting with a letter or digit, at most 32 characters: "2026-10-05". */
export const CONSENT_POLICY_VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,31}$/;
/** 128 random bits as lowercase hex. Not derived from anything about the visitor. */
export const CONSENT_ANONYMOUS_ID_PATTERN = /^[0-9a-f]{32}$/;
export const CONSENT_ACTIONS = Object.freeze(["grant", "deny", "withdraw", "update"]);
/**
 * Consent Mode v2 defaults: everything denied. There is no advertising
 * category in the family, so the three ad signals are never updated.
 */
export const CONSENT_MODE_DEFAULTS = Object.freeze({
  ad_personalization: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  analytics_storage: "denied",
});
/** Cookies Google Analytics writes: `_ga`, `_ga_<stream>`, and the older `_gid` / `_gat*`. */
export const GA_COOKIE_PATTERN = /^(?:_ga|_gid|_gat)(?:_[0-9A-Za-z_-]+)?$/;
/**
 * Headers for every response whose HTML was rendered from the consent cookie
 * (a TanStack route using `consent`). A granted visitor's head carries the
 * Tag Manager loader; if a CDN or edge cache stored that page, visitors who
 * never consented would be served the loader. `private, no-store` keeps it
 * out of shared caches; `Vary: Cookie` covers a cache that honours it anyway.
 */
export const CONSENT_RESPONSE_HEADERS = Object.freeze({ "Cache-Control": "private, no-store", Vary: "Cookie" });
/** A consent record body is a handful of short fields; anything longer is refused before parsing. */
export const CONSENT_RECORD_MAX_BYTES = 1024;

const GTM_SCRIPT_PREFIX = "https://www.googletagmanager.com/gtm.js";
const COOKIE_NAME_PATTERN = /^[0-9A-Za-z_-]{1,64}$/;
const COOKIE_DOMAIN_PATTERN = /^\.?[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)+$/;
const MEASUREMENT_ID_PATTERN = /^G-[0-9A-Z]+$/;
const COOKIE_KEYS = ["a", "id", "t", "v"];
const RECORD_KEYS = ["action", "analytics", "anonymousId", "decidedAt", "path", "policyVersion", "source"];
const CLOCK_SKEW_SECONDS = 10 * 60;
const MAX_PATH_LENGTH = 512;
const GATE = Symbol.for("@devslab/site-kit/consent-gate");

const fail = (message) => { throw new RangeError(message); };
const checkVersion = (value) =>
  typeof value === "string" && CONSENT_POLICY_VERSION_PATTERN.test(value)
    ? value
    : fail(`consent policy version must match ${CONSENT_POLICY_VERSION_PATTERN}; got ${JSON.stringify(value)}`);
const checkCookieName = (value) =>
  typeof value === "string" && COOKIE_NAME_PATTERN.test(value) ? value : fail(`consent cookie name must match ${COOKIE_NAME_PATTERN}; got ${JSON.stringify(value)}`);
const checkDomain = (value) =>
  typeof value === "string" && COOKIE_DOMAIN_PATTERN.test(value) ? value : fail(`consent cookie domain must be a host name; got ${JSON.stringify(value)}`);
const checkMaxAge = (value) =>
  Number.isInteger(value) && value > 0 && value <= CONSENT_MAX_AGE_SECONDS ? value : fail(`consent max age must be 1..${CONSENT_MAX_AGE_SECONDS} seconds; got ${JSON.stringify(value)}`);
const checkGtm = (value) =>
  typeof value === "string" && GTM_CONTAINER_ID_PATTERN.test(value) ? value : fail(`Google Tag Manager container id must match ${GTM_CONTAINER_ID_PATTERN}; got ${JSON.stringify(value)}`);
const checkMeasurementId = (value) =>
  typeof value === "string" && MEASUREMENT_ID_PATTERN.test(value) ? value : fail(`GA4 measurement id must match ${MEASUREMENT_ID_PATTERN}; got ${JSON.stringify(value)}`);

const isConsentState = (state) =>
  state !== null && typeof state === "object" &&
  typeof state.v === "string" && CONSENT_POLICY_VERSION_PATTERN.test(state.v) &&
  (state.a === 0 || state.a === 1) &&
  Number.isSafeInteger(state.t) && state.t > 0 &&
  typeof state.id === "string" && CONSENT_ANONYMOUS_ID_PATTERN.test(state.id);

/**
 * Parses a consent cookie value (`v=<version>&a=<0|1>&t=<unix seconds>&id=<hex>`).
 * Strict: exactly those four keys, each once and well-formed; anything else is `null`.
 */
export function parseConsentCookie(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 256) return null;
  const pairs = value.split("&").map((pair) => pair.split("="));
  if (pairs.some((pair) => pair.length !== 2)) return null;
  const keys = pairs.map(([key]) => key).sort();
  if (keys.join() !== COOKIE_KEYS.join()) return null;
  const fields = Object.fromEntries(pairs);
  if (fields.a !== "0" && fields.a !== "1") return null;
  if (!/^[1-9][0-9]{0,11}$/.test(fields.t)) return null;
  const state = { v: fields.v, a: Number(fields.a), t: Number(fields.t), id: fields.id };
  return isConsentState(state) ? Object.freeze(state) : null;
}

/** The cookie value for a state. Throws RangeError for a malformed state. */
export function formatConsentCookie(state) {
  if (!isConsentState(state)) fail(`not a consent state: ${JSON.stringify(state)}`);
  return `v=${state.v}&a=${state.a}&t=${state.t}&id=${state.id}`;
}

/**
 * The full cookie string for `document.cookie` or a `Set-Cookie` header:
 * first-party, `Path=/`, `SameSite=Lax`, `Secure`, twelve months. Not
 * `HttpOnly` — the banner reads it. Host-only unless `domain` is given.
 */
export function serializeConsentCookie(state, options = {}) {
  const name = checkCookieName(options.name ?? CONSENT_COOKIE_NAME);
  const maxAge = checkMaxAge(options.maxAgeSeconds ?? CONSENT_MAX_AGE_SECONDS);
  const domain = options.domain === undefined ? "" : `; Domain=${checkDomain(options.domain)}`;
  return `${name}=${formatConsentCookie(state)}; Path=/; Max-Age=${maxAge}${domain}; SameSite=Lax; Secure`;
}

/** The first value of `name` in a Cookie header (or `document.cookie`). */
function cookieValue(header, name) {
  if (typeof header !== "string") return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return undefined;
}

const nowSeconds = (now) => Math.floor((now ?? Date.now()) / 1000);

/**
 * True when `state` grants analytics for `policyVersion` and is neither older
 * than the cookie's lifetime nor dated in the future.
 */
export function analyticsConsented(state, policyVersion, options = {}) {
  checkVersion(policyVersion);
  if (!isConsentState(state) || state.v !== policyVersion || state.a !== 1) return false;
  return isFresh(state, options);
}

function isFresh(state, options) {
  const now = nowSeconds(options.now);
  const maxAge = checkMaxAge(options.maxAgeSeconds ?? CONSENT_MAX_AGE_SECONDS);
  return state.t <= now + CLOCK_SKEW_SECONDS && now - state.t <= maxAge;
}

/**
 * The visitor's decision for the current policy version, read from a Cookie
 * header (server) or `document.cookie` (browser): `null` when there is none,
 * when it is malformed, expired, or made under another policy version. A
 * `null` means "ask".
 */
export function readConsentCookie(cookieHeader, options) {
  const policyVersion = checkVersion(options?.policyVersion);
  const state = parseConsentCookie(cookieValue(cookieHeader, checkCookieName(options.cookieName ?? CONSENT_COOKIE_NAME)));
  if (!state || state.v !== policyVersion || !isFresh(state, options)) return null;
  return state;
}

/** Shorthand for "load analytics on this request": a current, fresh grant in the Cookie header. */
export function consentCookieGrantsAnalytics(cookieHeader, options) {
  return readConsentCookie(cookieHeader, options)?.a === 1;
}

const DEFAULTS_JSON = JSON.stringify(CONSENT_MODE_DEFAULTS);

/**
 * The body of the head `<script>` every page with Tag Manager carries,
 * without the tag or a nonce (the renderer owns both, as with gtmHeadScript).
 *
 * Not granted: Consent Mode defaults pushed into the page's own dataLayer,
 * nothing else — no Google host appears in the string.
 * Granted (and a container id given): the same defaults, an update granting
 * `analytics_storage`, then Google's loader, which is skipped if gtm.js is
 * already on the page (a client-side navigation re-running the head).
 * Either way the first copy to run marks the page so later copies do nothing.
 */
export function consentHeadScript(options = {}) {
  const granted = options.granted === true;
  const gtm = options.gtm === undefined ? undefined : checkGtm(options.gtm);
  const mode = granted ? "granted" : "denied";
  const update = granted ? `g("consent","update",{"analytics_storage":"granted"});` : "";
  const bootstrap = `(function(w){if(w.__siteConsent)return;w.__siteConsent="${mode}";w.dataLayer=w.dataLayer||[];function g(){w.dataLayer.push(arguments)}g("consent","default",${DEFAULTS_JSON});${update}})(window);`;
  if (!granted || gtm === undefined) return bootstrap;
  return `${bootstrap}\nif(!document.querySelector('script[src^="${GTM_SCRIPT_PREFIX}"]')){${gtmHeadScript(gtm)}}`;
}

/**
 * A page path as it goes into a consent record: the part before any query or
 * fragment, starting with "/", at most 512 characters. Anything else is "/".
 */
export function normalizeConsentPath(path) {
  if (typeof path !== "string") return "/";
  const bare = path.split(/[?#]/, 1)[0] ?? "";
  if (!bare.startsWith("/") || bare.startsWith("//") || bare.length > MAX_PATH_LENGTH || /[\s\0-\x1f\x7f]/.test(bare)) return "/";
  return bare;
}

const isPlainObject = (value) => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

/**
 * Validates a consent record a browser POSTed (server side). Accepts the JSON
 * text or the parsed object; returns a frozen record or `null`. Strict: the
 * exact seven keys, a known policy version (one, or a list while an older
 * version's pending records drain), an action that agrees with `analytics`,
 * a normalised path, a `decidedAt` neither in the future nor older than
 * `maxAgeSeconds` (default 31 days). The server adds who, where from and
 * when it arrived; nothing here identifies a person.
 */
export function parseConsentRecord(input, options) {
  const versions = [options?.policyVersion].flat().map(checkVersion);
  let body = input;
  if (typeof input === "string") {
    if (input.length > CONSENT_RECORD_MAX_BYTES) return null;
    try { body = JSON.parse(input); } catch { return null; }
  }
  if (!isPlainObject(body) || Object.keys(body).sort().join() !== RECORD_KEYS.join()) return null;
  const { action, analytics, anonymousId, decidedAt, path, policyVersion, source } = body;
  if (!versions.includes(policyVersion)) return null;
  if (typeof analytics !== "boolean" || !CONSENT_ACTIONS.includes(action)) return null;
  if ((action === "grant" && !analytics) || ((action === "deny" || action === "withdraw") && analytics)) return null;
  if (typeof anonymousId !== "string" || !CONSENT_ANONYMOUS_ID_PATTERN.test(anonymousId)) return null;
  if (source !== "web") return null;
  if (typeof path !== "string" || normalizeConsentPath(path) !== path) return null;
  const now = nowSeconds(options.now);
  const maxAge = options.maxAgeSeconds ?? 31 * 24 * 60 * 60;
  if (!Number.isSafeInteger(decidedAt) || decidedAt <= 0 || decidedAt > now + CLOCK_SKEW_SECONDS || now - decidedAt > maxAge) return null;
  return Object.freeze({ action, analytics, anonymousId, decidedAt, path, policyVersion, source });
}

/**
 * True when a request comes from `expectedOrigin`: its `Origin` header
 * matches, or, with no `Origin`, the browser says `Sec-Fetch-Site:
 * same-origin`. Takes a Request, a Headers, or a plain header object.
 */
export function isSameOriginRequest(request, expectedOrigin) {
  const expected = new URL(expectedOrigin).origin;
  const headers = request?.headers ?? request;
  const get = (name) => {
    if (typeof headers?.get === "function") return headers.get(name);
    const key = Object.keys(headers ?? {}).find((candidate) => candidate.toLowerCase() === name);
    const value = key === undefined ? undefined : headers[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const origin = get("origin");
  if (origin) return origin === expected;
  return get("sec-fetch-site") === "same-origin";
}

/**
 * An `onChange` for createConsentManager that POSTs the record as JSON to a
 * same-origin path. A failure throws an error whose `retryable` says whether
 * the manager should keep the record and send it again on the next page
 * (network errors, 429 and 5xx: yes; other 4xx: no — the server refused it).
 */
export function postConsentRecord(endpoint, options = {}) {
  if (typeof endpoint !== "string" || !endpoint.startsWith("/") || endpoint.startsWith("//")) {
    fail(`consent records go to a same-origin path such as "/api/consent"; got ${JSON.stringify(endpoint)}`);
  }
  return async (record) => {
    const send = options.fetch ?? ((...args) => globalThis.fetch(...args));
    let response;
    try {
      response = await send(endpoint, {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
      });
    } catch (cause) {
      throw Object.assign(new Error("consent record was not sent"), { retryable: true, cause });
    }
    if (!response.ok) {
      throw Object.assign(new Error(`consent record was refused (${response.status})`), { retryable: response.status === 429 || response.status >= 500 });
    }
  };
}

function randomId(scope) {
  const crypto = scope?.crypto ?? globalThis.crypto;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const isConsentCommand = (item) => item !== null && typeof item === "object" && item[0] === "consent";

/**
 * The browser side. Create it once per page (module scope is fine — it does
 * nothing until `start()`), mount the banner, which calls `start()`, or call
 * `start()` yourself in a framework-free page.
 */
export function createConsentManager(options) {
  const policyVersion = checkVersion(options?.policyVersion);
  const gtm = options.gtm === undefined ? undefined : checkGtm(options.gtm);
  const cookieName = checkCookieName(options.cookieName ?? CONSENT_COOKIE_NAME);
  const cookieDomain = options.cookieDomain === undefined ? undefined : checkDomain(options.cookieDomain);
  const maxAgeSeconds = checkMaxAge(options.maxAgeSeconds ?? CONSENT_MAX_AGE_SECONDS);
  const measurementIds = (options.measurementIds ?? []).map(checkMeasurementId);
  // ga-disable-<id> is the only switch that stops a GA4 tag Tag Manager has
  // already initialised: its own listeners (history page_view, scroll,
  // outbound clicks) bypass the dataLayer gate and would keep sending
  // cookieless pings to Google until the page reloads.
  if (gtm !== undefined && measurementIds.length === 0) {
    fail("a consent manager that loads Tag Manager needs measurementIds (the GA4 streams the container sends to), so a withdrawal can switch them off");
  }
  const pendingKey = `${cookieName}_pending`;
  const listeners = new Set();
  const inFlight = new Set();
  let started = false;
  let dismissed = false;
  let analyticsOn = false;
  // The decision made on this page, for when the browser refuses the cookie:
  // the choice still holds until the page is left, so the bar does not stay
  // up after a click as if nothing happened.
  let decidedHere = null;

  const scope = () => options.window ?? (typeof window === "undefined" ? undefined : window);
  const now = () => (options.now ? options.now() : Date.now());
  const readRaw = () => {
    const w = scope();
    return w ? parseConsentCookie(cookieValue(w.document.cookie, cookieName)) : null;
  };
  const current = (candidate) => (candidate && candidate.v === policyVersion && isFresh(candidate, { now: now(), maxAgeSeconds }) ? candidate : null);
  const state = () => current(readRaw()) ?? current(decidedHere);
  const emit = (event) => {
    for (const listener of [...listeners]) {
      try { listener(event); } catch (error) { queueMicrotask(() => { throw error; }); }
    }
  };
  const consentCommand = (...args) => {
    const w = scope();
    w.dataLayer = w.dataLayer || [];
    // Tag Manager reads gtag commands only as `arguments` objects.
    (function g() { w.dataLayer.push(arguments); })(...args);
  };

  // While analytics is not granted, the page's dataLayer accepts consent
  // commands and drops everything else, so events a product pushes before
  // consent are not queued for a Tag Manager that loads later, and events
  // after a withdrawal never reach the one that already loaded.
  const installGate = () => {
    const w = scope();
    const layer = (w.dataLayer = w.dataLayer || []);
    if (layer.push[GATE]) return;
    const inner = layer.push;
    const gated = function (...items) {
      const pass = analyticsOn ? items : items.filter(isConsentCommand);
      return pass.length > 0 ? inner.apply(this, pass) : this.length;
    };
    gated[GATE] = true;
    layer.push = gated;
  };

  const readNonce = (document) => {
    for (const selector of ['meta[property="csp-nonce"]', 'meta[name="csp-nonce"]']) {
      const meta = document.querySelector(selector);
      const value = meta && (meta.nonce || meta.getAttribute("nonce") || meta.getAttribute("content"));
      if (value) return value;
    }
    const element = document.querySelector("[nonce]");
    return (element && (element.nonce || element.getAttribute("nonce"))) || undefined;
  };

  const loadGtm = () => {
    const w = scope();
    if (gtm === undefined || !w) return;
    const document = w.document;
    if (document.querySelector(`script[src^="${GTM_SCRIPT_PREFIX}"]`)) return;
    w.dataLayer.push({ "gtm.start": now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `${GTM_SCRIPT_PREFIX}?id=${gtm}`;
    const nonce = options.nonce ?? readNonce(document);
    if (nonce) script.setAttribute("nonce", nonce);
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) first.parentNode.insertBefore(script, first);
    else (document.head ?? document.documentElement).appendChild(script);
  };

  const deleteAnalyticsCookies = () => {
    const w = scope();
    const document = w.document;
    const host = w.location?.hostname ?? "";
    const labels = /^[0-9.]+$|^\[|:/.test(host) ? [] : host.split(".");
    const domains = [undefined];
    for (let index = 0; index <= labels.length - 2; index += 1) domains.push(labels.slice(index).join("."));
    const names = new Set(
      document.cookie.split(";").map((part) => part.split("=", 1)[0].trim()).filter((name) => GA_COOKIE_PATTERN.test(name)),
    );
    for (const name of names) {
      for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ""}`;
    }
  };

  const setGaDisabled = (disabled) => {
    const w = scope();
    for (const id of measurementIds) w[`ga-disable-${id}`] = disabled;
  };

  const apply = (granted) => {
    const w = scope();
    if (granted) {
      analyticsOn = true;
      setGaDisabled(false);
      if (w.__siteConsent !== "granted") consentCommand("consent", "update", { analytics_storage: "granted" });
      w.__siteConsent = "granted";
      loadGtm();
      return;
    }
    analyticsOn = false;
    installGate();
    if (w.__siteConsent === "granted") consentCommand("consent", "update", { analytics_storage: "denied" });
    w.__siteConsent = "denied";
    setGaDisabled(true);
    deleteAnalyticsCookies();
  };

  const readPending = () => {
    try {
      const value = JSON.parse(scope()?.localStorage?.getItem(pendingKey) ?? "[]");
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const writePending = (records) => {
    try {
      const storage = scope()?.localStorage;
      if (!storage) return;
      if (records.length === 0) storage.removeItem(pendingKey);
      else storage.setItem(pendingKey, JSON.stringify(records.slice(-20)));
    } catch { /* storage blocked: the record is lost, the cookie still holds the choice */ }
  };
  const deliver = (record) => {
    if (!options.onChange) return;
    const attempt = (async () => {
      try { await options.onChange(record); } catch (error) {
        if (error?.retryable !== false) writePending([...readPending(), record]);
      }
    })();
    inFlight.add(attempt);
    attempt.finally(() => inFlight.delete(attempt));
  };

  const start = () => {
    const w = scope();
    if (!w || started) return;
    started = true;
    analyticsOn = state()?.a === 1;
    installGate();
    if (w.__siteConsent === undefined) {
      consentCommand("consent", "default", { ...CONSENT_MODE_DEFAULTS });
      w.__siteConsent = "denied";
    }
    // The head may disagree with the cookie (another tab changed it after
    // this page was rendered); the cookie wins.
    if (analyticsOn) apply(true);
    else if (w.__siteConsent === "granted") apply(false);
    const pending = readPending();
    if (pending.length > 0) {
      writePending([]);
      for (const record of pending) deliver(record);
    }
  };

  const decide = (analytics) => {
    const w = scope();
    if (!w) throw new Error("consent decisions are made in a browser");
    start();
    const previous = state();
    const action = !previous
      ? (analytics ? "grant" : "deny")
      : previous.a === 1 ? (analytics ? "update" : "withdraw") : (analytics ? "grant" : "update");
    const next = Object.freeze({ v: policyVersion, a: analytics ? 1 : 0, t: nowSeconds(now()), id: previous?.id ?? readRaw()?.id ?? randomId(w) });
    w.document.cookie = serializeConsentCookie(next, { name: cookieName, maxAgeSeconds, ...(cookieDomain ? { domain: cookieDomain } : {}) });
    decidedHere = next;
    dismissed = false;
    apply(analytics);
    const path = normalizeConsentPath(options.recordPath ? options.recordPath(w.location?.pathname ?? "/") : w.location?.pathname);
    const record = Object.freeze({ policyVersion, analytics, action, anonymousId: next.id, decidedAt: next.t, source: "web", path });
    emit({ type: "change", state: next, record });
    deliver(record);
    return record;
  };

  return Object.freeze({
    policyVersion,
    /** Applies the stored decision to this page: Consent Mode defaults, then Tag Manager only if granted. Idempotent; a no-op outside a browser. */
    start,
    state,
    analyticsGranted: () => state()?.a === 1,
    needsDecision: () => state() === null,
    acceptAll: () => decide(true),
    rejectAll: () => decide(false),
    save: (choice) => decide(choice?.analytics === true),
    withdraw: () => decide(false),
    openSettings: () => emit({ type: "open-settings" }),
    dismiss: () => { dismissed = true; emit({ type: "dismiss" }); },
    dismissed: () => dismissed,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Opens settings from any click on `[data-consent-settings]` under `root` (a footer link in a page without the Solid kit). */
    bindTriggers(root) {
      const target = root ?? scope()?.document;
      if (!target) return () => {};
      const onClick = (event) => {
        if (!event.target?.closest?.("[data-consent-settings]")) return;
        event.preventDefault();
        emit({ type: "open-settings" });
      };
      target.addEventListener("click", onClick);
      return () => target.removeEventListener("click", onClick);
    },
    /** Resolves when every record sent so far has been delivered or queued. */
    settled: () => Promise.all([...inFlight]).then(() => undefined),
  });
}

/**
 * Default strings, Korean. Products pass these (or their own) to the banner.
 * Short on purpose (owner decision, 2026-10-06): the bar says what and why and
 * that it is optional; "자세히 보기" links to the product's privacy policy,
 * whose analytics section carries the full disclosure (Google Analytics,
 * recipient, overseas transfer, retention, no advertising, withdrawal).
 */
export const CONSENT_MESSAGES_KO = Object.freeze({
  regionLabel: "쿠키 동의",
  title: "이용 통계 수집 동의 (선택)",
  body: "서비스를 더 낫게 만들기 위해 이용 통계를 수집합니다. 동의는 선택이며, 동의하지 않아도 모든 기능을 쓸 수 있습니다.",
  learnMore: "자세히 보기",
  privacyLink: "개인정보처리방침",
  acceptAll: "모두 허용",
  rejectAll: "거부",
  settings: "설정",
  dismiss: "선택하지 않고 닫기",
  settingsTitle: "쿠키 설정",
  settingsIntro: "바닥글의 ‘쿠키 설정’에서 언제든 다시 바꿀 수 있습니다.",
  necessaryTitle: "필수",
  necessaryBody: "사이트가 동작하는 데 꼭 필요해 항상 사용합니다.",
  necessaryStatus: "항상 사용",
  analyticsTitle: "이용 통계 (선택)",
  analyticsBody: "서비스를 개선하는 데 쓰는 이용 통계입니다.",
  analyticsSwitch: "이용 통계 수집 허용",
  save: "선택 저장",
  cancel: "취소",
  close: "닫기",
  saved: "쿠키 설정을 저장했습니다.",
  trigger: "쿠키 설정",
});

/** Default strings, English. */
export const CONSENT_MESSAGES_EN = Object.freeze({
  regionLabel: "Cookie consent",
  title: "Analytics (optional)",
  body: "We collect usage statistics to improve the service. It's optional, and everything works without it.",
  learnMore: "Learn more",
  privacyLink: "Privacy policy",
  acceptAll: "Accept all",
  rejectAll: "Reject",
  settings: "Settings",
  dismiss: "Close without choosing",
  settingsTitle: "Cookie settings",
  settingsIntro: "You can change this at any time under “Cookie settings” in the footer.",
  necessaryTitle: "Necessary",
  necessaryBody: "Needed for the site to work, so always on.",
  necessaryStatus: "Always on",
  analyticsTitle: "Analytics (optional)",
  analyticsBody: "Usage statistics that help us improve the service.",
  analyticsSwitch: "Allow analytics",
  save: "Save choices",
  cancel: "Cancel",
  close: "Close",
  saved: "Your cookie settings are saved.",
  trigger: "Cookie settings",
});
