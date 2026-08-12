/* ═══════════════════════════════════════════════════════════════
   templates.js — the recurring letters, snippet chips, address book,
   and the seed correction dictionary, per letter language.
   All of it is user-editable at runtime; these are only the defaults.
   ═══════════════════════════════════════════════════════════════ */

export const SNIPPETS = {
  hi: [
    'महोदय,',
    'आपसे निवेदन है कि',
    'उपरोक्त विषयान्तर्गत',
    'अतः',
    'कृपया आवश्यक कार्यवाही करें ।',
    'सधन्यवाद ।',
    'भवदीय',
  ],
  en: [
    'Respected Sir,',
    'It is requested that',
    'With reference to the subject cited above,',
    'Therefore,',
    'Kindly do the needful.',
    'Thanking you.',
    'Yours faithfully,',
  ],
};

export const BOOK = {
  hi: [
    'पी.सी.सी. जयपुर',
    'जिला कांग्रेस कमेटी राजसमन्द',
    'उपखण्ड अधिकारी, आमेट',
    'अधिशासी अधिकारी, नगरपालिका आमेट',
  ],
  en: [
    'The President, PCC Jaipur',
    'The District Congress Committee, Rajsamand',
    'The Sub Divisional Officer, Amet',
    'The District Collector, Rajsamand',
  ],
};

export const CC_DEFAULT = {
  hi: 'पी.सी.सी. जयपुर\nजिला कांग्रेस कमेटी राजसमन्द',
  en: 'PCC Jaipur\nDistrict Congress Committee, Rajsamand',
};

/** Words the recogniser gets wrong again and again. */
export const DICT_SEED = {
  hi: [
    'पीसीसी = पी.सी.सी.',
    'पी सी सी = पी.सी.सी.',
    'अमेट = आमेट',
    'आमेठ = आमेट',
    'राजसमंद = राजसमन्द',
    'राज समंद = राजसमन्द',
    'चुंडावत = चुण्डावत',
    'ज्ञानेंद्र = ज्ञानेन्द्र',
    'नगर पालिका = नगरपालिका',
    'भवदिय = भवदीय',
    'महोदय जी = महोदय',
  ].join('\n'),
  en: [
    'amet = Amet',
    'rajsamand = Rajsamand',
    'raj samand = Rajsamand',
    'pcc = PCC',
    'p c c = PCC',
    'chundawat = Chundawat',
    'nagarpalika = Nagarpalika',
    'gyanendra = Gyanendra',
    'do the needful = do the needful',
  ].join('\n'),
};

/** Spoken commands, shown in the in-app help sheet. */
export const VOICE_HELP = {
  hi: [
    ['नया पैराग्राफ', 'नई लाइन से नया अनुच्छेद'],
    ['अगला बिंदु', '①②③ वाली सूची में अगला नाम'],
    ['पूर्ण विराम', '।'],
    ['अल्पविराम', ','],
    ['प्रश्नवाचक', '?'],
    ['पिछला हटाओ', 'आख़िरी वाक्य मिट जाएगा'],
    ['बंद करो', 'माइक बंद'],
  ],
  en: [
    ['new paragraph', 'starts a fresh paragraph'],
    ['next point', 'adds the next ①②③ list item'],
    ['full stop', '.'],
    ['comma', ','],
    ['question mark', '?'],
    ['delete that', 'removes the last sentence'],
    ['stop listening', 'turns the mic off'],
  ],
};

const HI = [
  {
    id: 'samiti',
    name: 'समिति गठन',
    desc: 'चुनाव / कार्यक्रम समिति के सदस्यों की घोषणा',
    to: 'पी.सी.सी. जयपुर',
    body:
`आगामी आमेट नगरपालिका चुनाव के सुचारु संचालन, उम्मीदवार चयन व समस्त निकाय चुनाव के प्रबंधन के लिए पाँच सदस्यों की निकाय चुनाव कमेटी गठित की गई है । इसके सदस्य निम्न वर्णित रखे गये हैं —

•
•
• `,
  },
  {
    id: 'anushansa',
    name: 'अनुशंसा पत्र',
    desc: 'किसी कार्यकर्ता / व्यक्ति की सिफ़ारिश',
    to: 'पी.सी.सी. जयपुर',
    body:
`महोदय,

उपरोक्त विषयान्तर्गत लेख है कि श्री ____ निवासी ____ विगत कई वर्षों से पार्टी संगठन में सक्रिय रूप से कार्यरत हैं तथा उन्होंने संगठन के प्रत्येक कार्यक्रम में सराहनीय योगदान दिया है ।

अतः इनके नाम पर सहानुभूतिपूर्वक विचार कर उचित दायित्व प्रदान करने की कृपा करावें ।`,
  },
  {
    id: 'aamantran',
    name: 'आमंत्रण',
    desc: 'बैठक / कार्यक्रम में उपस्थिति हेतु',
    to: '',
    body:
`महोदय,

ब्लॉक कांग्रेस कमेटी आमेट की आवश्यक बैठक दिनांक ____ को समय ____ बजे, स्थान ____ पर आयोजित की जा रही है ।

बैठक में निम्न विषयों पर चर्चा की जावेगी —

•
•

आपसे निवेदन है कि नियत समय पर उपस्थित होकर बैठक को सफल बनावें ।`,
  },
  {
    id: 'gyapan',
    name: 'ज्ञापन',
    desc: 'प्रशासन को माँग / समस्या हेतु',
    to: 'उपखण्ड अधिकारी, आमेट',
    body:
`महोदय,

उपरोक्त विषयान्तर्गत निवेदन है कि आमेट क्षेत्र में ____ की समस्या विगत लम्बे समय से बनी हुई है, जिससे आम जनता को भारी परेशानी का सामना करना पड़ रहा है ।

क्षेत्र की जनता की प्रमुख माँगें निम्न हैं —

•
•

अतः आपसे निवेदन है कि उपरोक्त समस्या का शीघ्र निराकरण करावें, अन्यथा कांग्रेस पार्टी को जन‑आन्दोलन हेतु बाध्य होना पड़ेगा ।`,
  },
  {
    id: 'shok',
    name: 'शोक संदेश',
    desc: 'निधन पर संवेदना',
    to: '',
    body:
`अत्यन्त दुःख के साथ सूचित किया जाता है कि श्री ____ का दिनांक ____ को निधन हो गया ।

आपने जीवन पर्यन्त समाज व संगठन की निःस्वार्थ सेवा की । उनके निधन से जो क्षति हुई है उसकी पूर्ति सम्भव नहीं है ।

ब्लॉक कांग्रेस कमेटी आमेट परिवार दिवंगत आत्मा की शान्ति एवं शोकाकुल परिवार को यह दुःख सहन करने की शक्ति प्रदान करने हेतु ईश्वर से प्रार्थना करता है ।`,
  },
  { id: 'blank', name: 'खाली पत्र', desc: 'शुरू से लिखें', to: '', body: '' },
];

const EN = [
  {
    id: 'committee',
    name: 'Committee constituted',
    desc: 'Announce the members of a committee',
    to: 'The President, PCC Jaipur',
    subject: 'Constitution of the Election Committee, Amet',
    body:
`Respected Sir,

For the smooth conduct of the forthcoming Amet Nagarpalika election, the selection of candidates and the overall management of the civic body election, a five-member Election Committee has been constituted. Its members are as follows —

•
•
• `,
  },
  {
    id: 'recommend',
    name: 'Recommendation',
    desc: 'Recommend a worker or individual',
    to: 'The President, PCC Jaipur',
    subject: 'Recommendation of Shri ____',
    body:
`Respected Sir,

With reference to the subject cited above, it is submitted that Shri ____, resident of ____, has been actively associated with the party organisation for several years and has contributed commendably to every programme undertaken by it.

It is therefore requested that his name may kindly be considered sympathetically and a suitable responsibility entrusted to him.

Thanking you.`,
  },
  {
    id: 'invite',
    name: 'Invitation',
    desc: 'Invite to a meeting or function',
    to: '',
    subject: 'Invitation to the meeting dated ____',
    body:
`Respected Sir,

An important meeting of the Block Congress Committee, Amet is being convened on ____ at ____ hrs at ____.

The following matters will be taken up for discussion —

•
•

You are requested to attend at the appointed time and make the meeting a success.`,
  },
  {
    id: 'memorandum',
    name: 'Memorandum',
    desc: 'Demands or grievances to the administration',
    to: 'The Sub Divisional Officer, Amet',
    subject: 'Redressal of public grievances in Amet',
    body:
`Respected Sir,

With reference to the subject cited above, it is submitted that the problem of ____ has persisted in the Amet area for a long time, causing considerable hardship to the general public.

The principal demands of the people of the area are as follows —

•
•

It is therefore requested that the above problem be redressed at the earliest, failing which the Congress party will be constrained to launch a public agitation.`,
  },
  {
    id: 'condolence',
    name: 'Condolence',
    desc: 'Message on a bereavement',
    to: '',
    subject: 'Condolence',
    body:
`It is with profound grief that we record the passing away of Shri ____ on ____.

Throughout his life he rendered selfless service to society and to the organisation. The void created by his demise cannot be filled.

The Block Congress Committee, Amet prays for the eternal peace of the departed soul and for strength to the bereaved family in bearing this loss.`,
  },
  { id: 'blank', name: 'Blank letter', desc: 'Start from scratch', to: '', body: '' },
];

export const TEMPLATES = { hi: HI, en: EN };
