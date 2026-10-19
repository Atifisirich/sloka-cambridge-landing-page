/* =====================================================================
   Serverless proxy for the CRM (Vercel / Netlify-compatible Node handler).
   Use this ONLY if the CRM needs an API key. The key lives in an
   environment variable on the host, never in front-end code.

   Setup:
     1. In js/config.js set CRM_ENDPOINT: '/api/enquiry', ENCODING: 'json'
     2. On the host set env vars:
          CRM_API_URL   = the vendor's endpoint
          CRM_API_KEY   = the secret key
          CRM_AUTH_HEADER (optional, default "Authorization"; value sent as "Bearer <key>"
                           unless CRM_AUTH_SCHEME is set, e.g. "" for raw keys)
          ALLOWED_ORIGIN = https://your-live-domain (CORS + basic origin check)
     3. Adjust mapToVendor() if the vendor wants a different body shape.
   ===================================================================== */

const PHONE = /^\+91[6-9]\d{9}$/;

function mapToVendor(body) {
  // Pass-through by default (field names are already mapped by FIELD_MAP in config.js)
  return body;
}

module.exports = async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '';
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (origin && req.headers.origin && req.headers.origin !== origin) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // Minimal server-side validation (never trust the browser)
  const phone = String(body.phone || '');
  const name = String(body.parent_name || '').trim();
  if (!PHONE.test(phone) || name.length < 2 || body.consent !== 'yes') {
    return res.status(400).json({ ok: false, error: 'Invalid enquiry' });
  }

  const url = process.env.CRM_API_URL;
  const key = process.env.CRM_API_KEY;
  if (!url || !key) return res.status(500).json({ ok: false, error: 'CRM not configured' });

  const headerName = process.env.CRM_AUTH_HEADER || 'Authorization';
  const scheme = process.env.CRM_AUTH_SCHEME ?? 'Bearer';
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [headerName]: scheme ? `${scheme} ${key}` : key },
      body: JSON.stringify(mapToVendor(body))
    });
    if (!r.ok) {
      console.error('CRM error', r.status, await r.text().catch(() => ''));
      return res.status(502).json({ ok: false, error: 'CRM rejected the enquiry' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('CRM unreachable', e);
    return res.status(502).json({ ok: false, error: 'CRM unreachable' });
  }
};
