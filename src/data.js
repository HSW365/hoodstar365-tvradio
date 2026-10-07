export const CASHAPP = '$HSW365'
export const ORDER_EMAIL = 'HOODSTAR365TVRADIO@GMAIL.COM'
export const BOOK_EMAIL = 'hoodstarent365@gmail.com'
export const MEDIA_EMAIL = 'hsw365media@gmail.com'
export const TEXT_LINE = '856-796-8081'

export const QUEENEE_URL = 'https://hsw365.github.io/queenee/'
export const STORE_URL = 'https://hsw365.co'
export const SPOTIFY_URL = 'https://open.spotify.com/artist/5WcRHq9ZX0GElx4wSvVjrr'
export const YOUTUBE_URL = 'https://www.youtube.com/@Hoodstar365'

const cdn = (f, w = 720) => `https://cdn.shopify.com/s/files/1/0718/4351/2481/files/${f}&width=${w}`
const product = (h) => `${STORE_URL}/products/${h}`

export const CHANNELS = [
  { id: 'music', n: '01', name: 'Music', line: 'Records and videos' },
  { id: 'radio', n: '02', name: 'TV Radio', line: 'On air, rates, submit' },
  { id: 'podcast', n: '03', name: 'Podcast', line: 'Respect Da Game' },
  { id: 'books', n: '04', name: 'Books', line: 'Four titles' },
  { id: 'speaking', n: '05', name: 'Speaking', line: 'Tour and booking' },
  { id: 'streetwear', n: '06', name: 'Streetwear', line: 'HSW365 store' },
  { id: 'apps', n: '07', name: 'Apps', line: 'Software by HSW365' },
  { id: 'build', n: '08', name: 'Build Series', line: 'Ebooks and course' },
]

export const SEED = [
  { title: 'BIGGEST OPP', artist: 'Hoodstar365', provider: 'youtube', video_id: 'nj7MajxNius' },
  { title: "DON'T CRY", artist: 'Hoodstar365', provider: 'youtube', video_id: 'z9RJcNNKafk' },
  { title: 'Cash Lingo — Studio Session (RIP LD)', artist: 'Cash Lingo', provider: 'youtube', video_id: 'ILfYLfcw0Uw' },
  { title: 'REFLECTION', artist: 'Hoodstar365', provider: 'vimeo', video_id: '971116027' },
]

export const VIDEOS = [
  { title: 'BIGGEST OPP', kind: 'Official video', href: 'https://www.youtube.com/watch?v=nj7MajxNius', img: 'https://i.ytimg.com/vi/nj7MajxNius/maxresdefault.jpg' },
  { title: "DON'T CRY", kind: 'Official video', href: 'https://www.youtube.com/watch?v=z9RJcNNKafk', img: 'https://i.ytimg.com/vi/z9RJcNNKafk/maxresdefault.jpg' },
  { title: 'REFLECTION', kind: 'Official video', href: 'https://vimeo.com/971116027', img: '' },
]

export const RADIO_RATES = [
  { id: 'radio30', tag: 'Most requested', feat: true, name: 'Radio Play, 30-Day Rotation', price: 99, unit: '30 days', desc: 'Your song or video in active on-air rotation for 30 days.' },
  { id: 'video', tag: 'Placement', name: 'Music Video Feature', price: 100, unit: '30 days', desc: 'Your video featured on the front of the station for 30 days.' },
  { id: 'mixtape', tag: 'Placement', name: 'Mixtape Series Slot', price: 40, unit: 'per slot', desc: 'A slot on the HOODSTAR365 mixtape series.' },
  { id: 'ad30', tag: 'Ad block', name: 'Radio Ad, 30 Days', price: 99, unit: '30 days', desc: 'A dedicated ad spot running between rotations.' },
  { id: 'ad60', tag: 'Ad block', name: 'Radio Ad, 60 Days', price: 179, unit: '60 days', desc: 'Extended ad spot at a better rate.' },
  { id: 'ad90', tag: 'Ad block', name: 'Radio Ad, 90 Days', price: 249, unit: '90 days', desc: 'Full-quarter ad presence on the station.' },
  { id: 'ad180', tag: 'Ad block', name: 'Radio Ad, 180 Days', price: 449, unit: '180 days', desc: 'Half a year on air. Lowest cost per day.' },
]

export const PODCAST_RATES = [
  { id: 'podcast', tag: 'Placement', name: 'Respect Da Game Podcast', price: 60, unit: 'per episode', desc: 'Your record or brand placed on an episode.' },
  { id: 'interview', tag: 'Feature', name: 'Artist Interview', price: 100, unit: 'per feature', desc: 'A full sit-down interview feature.' },
]

export const BOOKS = ['Hoodlum Soldier', 'Ride Out', 'Better Days', 'God Who Am I?']

export const WEAR = [
  { name: 'Survivor Collection', note: 'One-of-one. Hand-bleached. Personally signed.', href: product('survivor-tee-crimson-fracture-001'), img: cdn('IMG_8712.jpg?v=1782132977') },
  { name: 'HSW365 Camo Set', note: 'Matching tee and shorts.', href: product('hsw365-camo-set'), img: cdn('23EED786-2523-44E7-9D41-CE6512170BC0.jpg?v=1785461730') },
]
export const WEAR_LIST = [
  { name: 'Faith Over Fear', note: 'Tee', href: product('faith-over-fear') },
  { name: 'HOODSTARWORLD Hoodies', note: 'Heavy blend hoodie', href: product('hoodstarworld-hoodies') },
  { name: "Founder's Print Series", note: 'Limited edition of 25', href: product('survivor-collection-founders-print-series-limited-edition-of-25') },
  { name: 'The G.O.A.T', note: 'Tee', href: product('the-g-o-a-t') },
  { name: 'The King Is Here', note: 'Tee', href: product('king-james-tees') },
  { name: 'The King Dunks', note: 'Tee', href: product('the-king-dunks') },
  { name: 'Nolan', note: 'Tee', href: product('nolan') },
]

export const APP_GROUPS = [
  {
    group: 'For artists and creators',
    items: [
      { name: 'HSW365studio', what: 'Record, tune, mix and master in your browser.', href: 'https://hsw365.github.io/STUDIO365/' },
      { name: 'QUEENEE', what: 'Your own website, built for you. Indie artists and businesses.', href: QUEENEE_URL },
      { name: 'Klipit', what: 'Paste a stream link, get your best moments as ready-to-post clips.', href: 'https://hsw365.github.io/KLIPIT/' },
      { name: 'iRun', what: 'Short promo videos for your brand, made and posted for you every day.', href: 'https://hsw365.github.io/iRUN/' },
    ],
  },
  {
    group: 'For business owners',
    items: [
      { name: 'CallTwin', what: 'A 24/7 AI receptionist that answers your business line.', href: 'https://hsw365.github.io/calltwin/' },
      { name: 'HSW365Media', what: 'Professional web design for local business.', href: 'https://hsw365.github.io/HSW365MEDIA/' },
      { name: 'Offer Forge', what: 'Shape and package the offer you sell.', href: 'https://hsw365.github.io/FORGE/' },
      { name: 'FLIPIT', what: 'A deal workspace for real estate investors.', href: 'https://hsw365.github.io/FLIPIT/' },
    ],
  },
  {
    group: 'Community',
    items: [
      { name: 'Friendy', what: 'Someone to talk to, always there.', href: 'https://hsw365.github.io/FRIENDY/' },
      { name: 'SpeekZone', what: 'An open, no-algorithm social feed. Posts in the order they happen.', href: 'https://hsw365.github.io/SPEEKZONE/' },
      { name: 'CaptureItLive', what: 'A home for yoga instructors and their students.', href: 'https://hsw365.github.io/captureitlive/' },
    ],
  },
  {
    group: 'Money',
    items: [
      { name: 'YUP', what: 'A membership platform built around financial progress.', href: 'https://hsw365.github.io/YUP/' },
    ],
  },
]

export const BUILD = [
  { name: 'Turn Negative Into Positive', sub: 'The 7-Day Reset', kind: 'Ebook', href: product('turn-negative-into-positive-the-7-day-reset'), img: cdn('hf_20260925_155012_dd679e33-8614-48ba-98d4-8737bd956c6c.png?v=1790351644', 560) },
  { name: 'Ship It', sub: '20 battle-tested prompts to build and launch digital products', kind: 'Ebook', href: product('ship-it-20-battle-tested-claude-prompts-to-build-launch-digital-products'), img: cdn('hf_20260925_155012_94c36a06-303d-4617-b52e-b43ef4fa21f4.png?v=1790351637', 560) },
  { name: 'The HSW365 Blueprint', sub: 'Master course: build a digital empire solo with AI', kind: 'Course', href: product('the-hsw365-blueprint-master-course-build-a-digital-empire-solo-with-ai'), img: cdn('hf_20260925_155012_d710d44d-5b08-4dc2-8d44-c986a35e1408.png?v=1790351651', 560) },
]

export const STACK = [
  { step: 'Record it', tool: 'HSW365studio', what: 'Lay the lead, stack the ad-libs, tune and mix in your browser.', href: 'https://hsw365.github.io/STUDIO365/' },
  { step: 'Own the page', tool: 'QUEENEE', what: 'One link with your name on it. Music, merch and booking in one place.', href: QUEENEE_URL },
  { step: 'Get it played', tool: 'HOODSTAR365 TV Radio', what: 'Put the record in rotation and the video on the front of the station.', href: '#radio' },
  { step: 'Push it daily', tool: 'iRun', what: 'Promo clips made and posted for you while you work on the next one.', href: 'https://hsw365.github.io/iRUN/' },
]
