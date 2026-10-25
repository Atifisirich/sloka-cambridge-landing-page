/* =====================================================================
   SITE CONFIG: the only file most edits should need.
   Loaded as a classic script before js/app.js, so it is plain globals.
   ===================================================================== */

window.SLOKA_SITE = {
  // Cambridge Fit button: every [data-cambridge-link] on the page uses this.
  CAMBRIDGE_FIT_URL: 'https://forms.gle/tTd3XyJwTcrBPHws8',

  // Manneguda campus contact details, from the school's official site
  // (slokainternational.com/contact-us, "For Admission related enquiry: Manneguda Campus").
  PHONE_DISPLAY: '+91 96403 34460',
  PHONE_E164: '+919640334460',
  PHONE2_DISPLAY: '+91 96406 69989',
  PHONE2_E164: '+919640669989',
  WHATSAPP_NUMBER: '919640334460', // the number the school's own WhatsApp button uses
  WHATSAPP_TEXT: 'Hello Sloka Manneguda, I just sent an admission enquiry and would like to know more.',
  EMAIL: 'admissions@slokainternational.com',  // admissions
  EMAIL2: 'info@slokainternational.com',       // general
  ADDRESS: 'Exit 12 Sports, Turkayamjal Rd, opp. RTA Office, Manneguda, Telangana 501510',
  OFFICE_HOURS: 'Office: 8:30 AM – 5:00 PM · School: Mon–Sat, 8:30 AM – 3:30 PM',
  DIRECTIONS_URL: 'https://www.google.com/maps/dir/?api=1&destination=Sloka+International+School+Turkayamjal+Rd+Manneguda+Telangana+501510',

  SOCIAL: {
    instagram: 'https://www.instagram.com/sloka_cambridge/',
    facebook: 'https://www.facebook.com/slokaInternationalschoolhyderabad/',
    youtube: 'https://www.youtube.com/channel/UCkjdzOBYB6-ApScJNpQnKxQ',
    x: 'https://twitter.com/slokaschool'
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
