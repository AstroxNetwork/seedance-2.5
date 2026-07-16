// Cloudflare Pages Function — waitlist capture for the Seedance 2.5 landing page.
// Route: POST /api/waitlist   (matches window.SEEDANCE_WAITLIST_ENDPOINT)
//
// Persists a signup two ways so a lead is never silently lost:
//   1) Brevo (primary) — adds/updates the contact in the campaign list, so the
//      waitlist and the sending tool are the same source of truth.
//   2) KV namespace WAITLIST (backup) — append-only record, survives Brevo outages.
//
// Bindings (set in Cloudflare Pages → Settings → Functions):
//   - Secret  BREVO_API_KEY     (Brevo v3 API key)
//   - Var     BREVO_LIST_ID     (numeric id of the "SD2.5 waitlist" list)
//   - KV      WAITLIST          (KV namespace binding, optional but recommended)
// If NONE are configured the endpoint returns 200 with {stored:false} so the UX
// still succeeds — but SEND-CHECKLIST requires verifying {stored:true} before send.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "invalid_email" }, 422);

  const record = {
    email,
    phase: String(body?.phase || "").slice(0, 4),
    language: String(body?.language || "").slice(0, 8),
    source: String(body?.source || "sd25lp").slice(0, 32),
    utm: body?.utm && typeof body.utm === "object" ? body.utm : {},
    submitted_at: new Date().toISOString(),
    ua: request.headers.get("user-agent")?.slice(0, 180) || "",
    country: request.headers.get("cf-ipcountry") || "",
  };

  let brevoOk = false;
  let kvOk = false;
  const errors = [];

  // 1) Brevo (primary)
  if (env.BREVO_API_KEY && env.BREVO_LIST_ID) {
    try {
      const res = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          listIds: [Number(env.BREVO_LIST_ID)],
          attributes: {
            SD25_PHASE: record.phase,
            SD25_LANG: record.language,
            SD25_SOURCE: record.source,
            SD25_UTM_CAMPAIGN: record.utm?.utm_campaign || "",
            SD25_UTM_CONTENT: record.utm?.utm_content || "",
          },
        }),
      });
      // 201 created / 204 updated are both success; 400 "contact already exists" is fine with updateEnabled
      brevoOk = res.ok || res.status === 204;
      if (!brevoOk) errors.push(`brevo_${res.status}`);
    } catch (e) {
      errors.push("brevo_exception");
    }
  }

  // 2) KV backup (append-only; keyed by email so re-submits overwrite, no dupes)
  if (env.WAITLIST) {
    try {
      await env.WAITLIST.put(`lead:${email}`, JSON.stringify(record), {
        metadata: { phase: record.phase, source: record.source },
      });
      kvOk = true;
    } catch {
      errors.push("kv_exception");
    }
  }

  const stored = brevoOk || kvOk;
  // Never 500 on a lead — a stored:false still lets the UI show success, but the
  // pre-send check must confirm stored:true end-to-end.
  return json({ ok: true, stored, sinks: { brevo: brevoOk, kv: kvOk }, errors });
}

// Health check + explicit 405 for non-POST so the route is easy to verify.
export async function onRequestGet() {
  return json({ ok: true, endpoint: "waitlist", method: "POST" });
}
