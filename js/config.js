/* =====================================================================
   SITE CONFIG: the only file most edits should need.
   Loaded as a classic script before js/app.js, so it is plain globals.
   ===================================================================== */

window.SLOKA_SITE = {
  // Cambridge Fit button: every [data-cambridge-link] on the page uses this.
  CAMBRIDGE_FIT_URL: '[PASTE_CAMBRIDGE_LINK_HERE]',

  // Contact details (shown in footer, location and schema). Replace placeholders.
  PHONE_DISPLAY: '+91 00000 00000',
  PHONE_E164: '+910000000000',
  WHATSAPP_NUMBER: '910000000000', // digits only, with country code
  WHATSAPP_TEXT: 'Hello Sloka Manneguda, I just sent an admission enquiry and would like to know more.',
  EMAIL: 'admissions@example.com',
  ADDRESS: '[STREET ADDRESS], Manneguda, Hyderabad, Telangana [PIN CODE]',
  DIRECTIONS_URL: 'https://www.google.com/maps/dir/?api=1&destination=Sloka+International+School+Manneguda',

  SOCIAL: {
    instagram: '#',
    facebook: '#',
    youtube: '#'
  },

  // Areas shown on the orbit map and in the enquiry form's "Area" dropdown.
  // angle: rough compass bearing from the school (0 = north, clockwise).
  // ring: 0 near, 1 middle, 2 far. Illustrative only; the map says "not to scale".
  // mins: APPROXIMATE drive time to the school [low, high] in minutes, typical traffic.
  //       These are rough estimates — please have the transport/admissions team verify
  //       and correct them before launch. Remove "mins" from an entry to hide its time.
  LOCALITIES: [
    { name: 'Turkayamjal', angle: 330, ring: 0, mins: [10, 15] },
    { name: 'Adibatla', angle: 150, ring: 0, mins: [15, 20] },
    { name: 'Kongara Kalan', angle: 200, ring: 0, mins: [15, 20] },
    { name: 'Bongloor', angle: 110, ring: 0, mins: [10, 15] },
    { name: 'Raviryal', angle: 240, ring: 1, mins: [15, 20] },
    { name: 'Mangalpally', angle: 60, ring: 0, mins: [10, 15] },
    { name: 'Nadergul', angle: 270, ring: 1, mins: [20, 25] },
    { name: 'Ragannaguda', angle: 300, ring: 0, mins: [5, 10] },
    { name: 'Sagar Ring Road', angle: 318, ring: 2, mins: [25, 35] },
    { name: 'Vanasthalipuram', angle: 345, ring: 2, mins: [30, 40] },
    { name: 'Sahebnagar', angle: 355, ring: 1, mins: [25, 30] },
    { name: 'Hastinapuram', angle: 305, ring: 2, mins: [25, 30] },
    { name: 'BN Reddy Nagar', angle: 330, ring: 2, mins: [25, 35] },
    { name: 'Vasavi Nilayam', angle: 20, ring: 1, mins: [15, 20] },
    { name: 'HSR Community', angle: 40, ring: 1, mins: [15, 20] },
    { name: 'TNR Community', angle: 85, ring: 1, mins: [15, 20] },
    { name: 'Abhiram', angle: 130, ring: 1, mins: [15, 20] },
    { name: 'AV Nagar', angle: 175, ring: 1, mins: [15, 20] },
    { name: 'Injapur', angle: 290, ring: 2, mins: [20, 25] },
    { name: 'Jahangir Nagar', angle: 210, ring: 2, mins: [25, 30] },
    { name: 'Chintalkunta', angle: 0, ring: 2, mins: [30, 40] },
    { name: 'Gurramguda', angle: 255, ring: 2, mins: [20, 25] },
    { name: 'Meerpet', angle: 275, ring: 2, mins: [25, 30] }
  ]
};

/* =====================================================================
   ENQUIRY FORM ↔ CRM CONFIG
   The CRM vendor will supply ONE of: an embed widget, a form action URL,
   or an API endpoint. Set it here; the form design never needs to change.

   - Form action URL (no secret):  CRM_ENDPOINT = 'https://crm.example/forms/123', ENCODING = 'form'
   - API that needs a key:          CRM_ENDPOINT = '/api/enquiry' (serverless proxy in /api/enquiry.js,
                                    key kept in an environment variable, never in this file)
   - Embed widget:                  set EMBED_HTML (or load their script) and the form is replaced.
   Leave CRM_ENDPOINT empty during development: submissions are logged, not sent.
   ===================================================================== */
window.SLOKA_ENQUIRY_CONFIG = {
  CRM_ENDPOINT: '',
  METHOD: 'POST',
  ENCODING: 'json',              // 'json' | 'form' (application/x-www-form-urlencoded)
  HEADERS: {},                   // non-secret headers only

  // Our field name → CRM field name. Only mapped fields are sent.
  FIELD_MAP: {
    parentName: 'parent_name',
    phone: 'phone',
    email: 'email',
    grade: 'grade',
    area: 'area',
    consent: 'consent',
    utm_source: 'utm_source',
    utm_medium: 'utm_medium',
    utm_campaign: 'utm_campaign',
    page_url: 'page_url'
  },

  // Constant values added to every submission
  EXTRA_FIELDS: {
    campus: 'Manneguda',
    lead_source: 'Website: Manneguda admissions landing page'
  },

  // If the vendor gives an embed widget instead, paste its markup here.
  EMBED_HTML: ''
};
