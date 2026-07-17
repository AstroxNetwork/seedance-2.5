# Cloudflare Pages Functions

## Waitlist endpoint

`functions/api/waitlist.js` serves `POST /api/waitlist`. It writes each signup to
Brevo and optionally to Cloudflare KV as a backup. The browser only reports a
successful signup when at least one destination confirms the write.

Configure these bindings in Cloudflare Pages:

| Type | Name | Purpose |
|---|---|---|
| Secret | `BREVO_API_KEY` | Brevo API v3 key |
| Variable | `BREVO_LIST_ID` | Seedance 2.5 contact list ID |
| KV namespace | `WAITLIST` | Optional backup storage |

Verify the endpoint on the final landing-page origin before launch:

```bash
curl -s -X POST https://holycrab.ai/api/waitlist \
  -H 'content-type: application/json' \
  -d '{"email":"seedtest+sd25@holycrab.ai","phase":"A","language":"zh","source":"selftest"}'
```

The response must include `"stored":true`, and the contact must appear in Brevo
or KV. A `503` response means no destination accepted the signup.
