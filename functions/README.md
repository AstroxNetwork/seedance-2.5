# Cloudflare Pages Functions

## `api/waitlist.js` — waitlist capture (`POST /api/waitlist`)

Persists a signup to **Brevo** (primary) and a **KV** namespace (backup). The landing
page posts here because `window.SEEDANCE_WAITLIST_ENDPOINT = "/api/waitlist"`.

### Required setup (Cloudflare dashboard → Pages project → Settings → Functions)

| Type | Name | Value |
|---|---|---|
| Secret | `BREVO_API_KEY` | Brevo v3 API key (Brevo → SMTP & API → API Keys) |
| Variable | `BREVO_LIST_ID` | numeric id of the "SD2.5 waitlist" contact list in Brevo |
| KV namespace | `WAITLIST` | create a KV namespace, bind it as `WAITLIST` (optional but recommended backup) |

Using Brevo as the primary sink means **waitlist signups land in the same tool you send
from** — the closed loop the review asked for.

### Verify before send (this is a SEND-CHECKLIST gate)

```bash
curl -s https://holycrab.ai/seedance-2-5/api/waitlist            # GET → {"ok":true,...}
curl -s -X POST https://holycrab.ai/seedance-2-5/api/waitlist \
  -H 'content-type: application/json' \
  -d '{"email":"seedtest+sd25@holycrab.ai","phase":"A","language":"en","source":"selftest"}'
# → must return {"ok":true,"stored":true,...}. stored:false = bindings missing = NO-GO.
```
Then confirm the contact actually appears in the Brevo list (and/or `wrangler kv:key get lead:seedtest+sd25@holycrab.ai`).

> Until the bindings exist the endpoint returns `stored:false`. The form UX still
> succeeds, but **do not send the campaign while `stored:false`** — that is the exact
> silent-loss trap the review flagged.
