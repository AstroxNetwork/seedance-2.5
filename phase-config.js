// Runtime config for the Seedance 2.5 landing page. Safe to edit per-deploy.
//
// PHASE: "A" preheat (teaser, noindex) · "B" announced · "C" live.
window.SEEDANCE_PHASE = "A";

// Waitlist capture endpoint. "/api/waitlist" is served by the Cloudflare Pages
// Function in functions/api/waitlist.js. Leaving this EMPTY makes the form fall
// back to a broken mailto flow — do NOT ship empty. See functions/README.md for
// the KV / Brevo bindings the endpoint needs to actually persist signups.
window.SEEDANCE_WAITLIST_ENDPOINT = "/api/waitlist";

// Analytics. GA4 (gtag) matches the property already on the main site so the
// branded /seedance-2-5/ deploy keeps its measurement. Plausible is optional and
// off unless an ID is set. script.js injects whichever is configured and routes
// trackEvent() to all present sinks.
window.SEEDANCE_GA_ID = "G-YSJF22S1VW";
window.SEEDANCE_PLAUSIBLE_SITE_ID = "";
