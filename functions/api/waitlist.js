const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const sanitizeUtm = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    UTM_KEYS.map((key) => [key, String(value[key] || "").slice(0, 160)]).filter(([, item]) => item),
  );
};

export async function onRequestPost({ request, env }) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8192) return json({ ok: false, error: "payload_too_large" }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: "invalid_email" }, 422);
  }

  const record = {
    email,
    phase: String(body?.phase || "").slice(0, 4),
    language: String(body?.language || "").slice(0, 8),
    source: String(body?.source || "sd25lp").slice(0, 32),
    utm: sanitizeUtm(body?.utm),
    submitted_at: new Date().toISOString(),
    ua: request.headers.get("user-agent")?.slice(0, 180) || "",
    country: request.headers.get("cf-ipcountry") || "",
  };

  let brevoOk = false;
  let kvOk = false;
  const errors = [];

  if (env.BREVO_API_KEY && env.BREVO_LIST_ID) {
    try {
      const response = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": env.BREVO_API_KEY,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          listIds: [Number(env.BREVO_LIST_ID)],
          attributes: {
            SD25_PHASE: record.phase,
            SD25_LANG: record.language,
            SD25_SOURCE: record.source,
            SD25_UTM_CAMPAIGN: record.utm.utm_campaign || "",
            SD25_UTM_CONTENT: record.utm.utm_content || "",
          },
        }),
      });
      brevoOk = response.ok;
      if (!brevoOk) errors.push(`brevo_${response.status}`);
    } catch {
      errors.push("brevo_exception");
    }
  }

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
  return json(
    { ok: stored, stored, sinks: { brevo: brevoOk, kv: kvOk }, errors },
    stored ? 200 : 503,
  );
}

export async function onRequestGet() {
  return json({ ok: true, endpoint: "waitlist", method: "POST" });
}
