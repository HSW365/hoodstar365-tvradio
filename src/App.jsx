import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import {
  CASHAPP, CASHAPP_URL, ORDER_EMAIL, BOOK_EMAIL, TEXT_LINE, STORE_URL, QUEENEE_URL, SPOTIFY_URL, SPOTIFY_EMBED, YOUTUBE_URL, APPLE_URL,
  NAV, SONGS, VIDEOS, VIDEO_KINDS, SEED, SURVIVOR, WEAR, BOOKS, AMAZON_AUTHOR, RATES,
  buyUrl, SINGLE_PRICE, EP_PRICE, EPS, PODCAST, APP_GROUPS,
} from './data'

function parseVideo(raw) {
  const url = (raw || '').trim()
  if (!url) return null
  if (/youtu/.test(url)) {
    const m = url.match(/[?&]v=([\w-]{6,})/) || url.match(/youtu\.be\/([\w-]{6,})/) || url.match(/\/embed\/([\w-]{6,})/) || url.match(/\/shorts\/([\w-]{6,})/)
    if (m) return { provider: 'youtube', video_id: m[1], url }
  }
  if (/vimeo/.test(url)) {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)
    if (m) return { provider: 'vimeo', video_id: m[1], url }
  }
  return null
}

function embedSrc(v) {
  if (!v) return ''
  if (v.provider === 'youtube') return `https://www.youtube.com/embed/${v.video_id}?rel=0&modestbranding=1`
  if (v.provider === 'vimeo') return `https://player.vimeo.com/video/${v.video_id}`
  return ''
}

function newOrderId() {
  const t = Date.now().toString(36).toUpperCase().slice(-5)
  const r = Math.random().toString(36).toUpperCase().slice(2, 5)
  return `HSW-${t}-${r}`
}

const Ext = ({ href, className, children }) => {
  const out = /^https?:/.test(href)
  return <a className={className} href={href} {...(out ? { target: '_blank', rel: 'noopener' } : {})}>{children}</a>
}

function Head({ kick, title, children }) {
  return (
    <header className="sechead">
      <div className="kick red">{kick}</div>
      <h2>{title}</h2>
      {children && <p className="secsub">{children}</p>}
    </header>
  )
}

function Rate({ r, active, onToggle }) {
  return (
    <div className={'rate' + (r.feat ? ' feat' : '')}>
      <div className="ratetop"><span className="tag">{r.tag}</span><span className="unit">{r.unit}</span></div>
      <div className="ratename">{r.name}</div>
      <div className="ratedesc">{r.desc}</div>
      <div className="ratefoot">
        <span className="price">${r.price}</span>
        <button className={'btn sm' + (active ? ' on' : '')} onClick={() => onToggle(r)}>{active ? 'In order' : 'Add to order'}</button>
      </div>
    </div>
  )
}

export default function App() {
  const [videos, setVideos] = useState(SEED)
  const [idx, setIdx] = useState(0)
  const [pasteVal, setPasteVal] = useState('')
  const [cart, setCart] = useState([])
  const [form, setForm] = useState({ artist_name: '', email: '', phone: '', link: '', notes: '' })
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [vid, setVid] = useState(VIDEOS[0].id)
  const [kind, setKind] = useState('video')
  const [allSongs, setAllSongs] = useState(false)
  const [now, setNow] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)
  const audio = useRef(null)

  const play = (item) => {
    const a = audio.current
    if (!a) return
    if (now && now.id === item.id) { if (a.paused) a.play().catch(() => {}); else a.pause(); return }
    setNow(item); setProg(0)
    a.src = item.src
    a.play().catch(() => flash('That could not play here. Use the links to listen.'))
  }
  const songItem = (t) => ({ id: 's' + t.vid, src: t.preview, title: t.title, art: t.art, sub: 'Hoodstar365 / 30 second preview', href: buyUrl(t.vid), cta: 'Buy $' + SINGLE_PRICE })
  const epItem = (e) => ({ id: 'p' + e.link, src: e.audio, title: e.title, art: PODCAST.art, sub: 'Respect Da Game / ' + e.date, href: PODCAST.apple, cta: 'Follow' })
  const isOn = (id) => !!now && now.id === id
  const stopAudio = () => { const a = audio.current; if (a) a.pause(); setNow(null) }
  const watch = (id) => {
    const a = audio.current; if (a) a.pause()
    const v = VIDEOS.find((x) => x.id === id); if (v) setKind(v.kind)
    setVid(id)
    document.getElementById('videos')?.scrollIntoView({ behavior: 'smooth' })
  }

  const flash = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 3200) }, [])

  useEffect(() => {
    let live = true
    supabase.from('videos').select('*').eq('is_live', true).order('position', { ascending: true })
      .then(({ data, error }) => { if (live && !error && data && data.length) setVideos(data) })
    return () => { live = false }
  }, [])

  const current = videos[idx] || null
  const next = () => setIdx((i) => (i + 1) % videos.length)
  const prev = () => setIdx((i) => (i - 1 + videos.length) % videos.length)

  const preview = () => {
    const v = parseVideo(pasteVal)
    if (!v) { flash('Paste a valid YouTube or Vimeo link.'); return }
    setVideos((vs) => [{ title: 'Preview: your link', artist: 'Preview', ...v }, ...vs]); setIdx(0); setPasteVal('')
    flash('Loaded on the stage. Pick a placement and submit to lock it into rotation.')
  }

  const inCart = (id) => cart.some((c) => c.id === id)
  const toggle = (rate) => setCart((c) => inCart(rate.id) ? c.filter((x) => x.id !== rate.id) : [...c, rate])
  const total = useMemo(() => cart.reduce((s, c) => s + c.price, 0), [cart])

  const submit = async () => {
    if (!form.artist_name.trim()) { flash('Add your artist name.'); return }
    if (!form.email.trim() && !form.phone.trim()) { flash('Add an email or phone so we can reach you.'); return }
    if (!cart.length) { flash('Pick at least one placement first.'); return }
    setBusy(true)
    const oid = newOrderId()
    const row = {
      order_id: oid,
      artist_name: form.artist_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      link: form.link.trim() || null,
      placements: cart.map((c) => ({ id: c.id, name: c.name, price: c.price })),
      total,
      status: 'pending',
      notes: form.notes.trim() || null,
    }
    const { error } = await supabase.from('submissions').insert(row)
    setBusy(false)
    if (error) { flash('Could not save your order. Email it to ' + ORDER_EMAIL); return }
    setOrder(row)
  }

  const field = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) })

  const nowVid = VIDEOS.find((v) => v.id === vid) || VIDEOS[0]
  const shownSongs = allSongs ? SONGS : SONGS.slice(0, 12)

  return (
    <div>
      <audio ref={audio} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setProg(0) }}
        onTimeUpdate={(e) => setProg(e.target.duration ? e.target.currentTime / e.target.duration : 0)} />
      <header className="nav">
        <div className="wrap navrow">
          <a href="#top" className="brand">HOODSTAR<b>365</b></a>
          <nav className="navlinks">
            {NAV.map((c) => <a key={c.id} href={'#' + c.id}>{c.name}</a>)}
          </nav>
          <a href="#merch" className="btn gold sm">Shop</a>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="heroimg" aria-hidden="true" />
        <div className="wrap heroin">
          <div className="kick">Recording artist / Author / U.S. Army veteran</div>
          <h1>Hoodstar<em>365</em></h1>
          <p className="lede">Turn Negative Into Positive. The music, the merch, the podcast and the books, straight from the artist.</p>
          <div className="cta">
            <a href="#music" className="btn gold">Play the music</a>
            <a href="#merch" className="btn">Shop the merch</a>
            <a href="#booking" className="btn">Book Hoodstar365</a>
          </div>
        </div>
        <div className="wrap">
          <button className="latest" onClick={() => { play(songItem(SONGS[0])); document.getElementById('music')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <img src={SONGS[0].art} alt="" />
            <span className="latestmeta"><span className="kick red">Latest single</span><span className="latesttitle">{SONGS[0].title}</span></span>
            <span className="latestgo">Play</span>
          </button>
        </div>
      </section>

      <main>
        <section id="music" className="sec">
          <div className="wrap">
            <Head kick="Music" title="The catalog">{SONGS.length} singles and {EPS.length} EPs, sold direct by the artist. Tap a cover to hear it, then buy the download.</Head>
            <div className="streams">
              <Ext href={APPLE_URL} className="btn">Apple Music</Ext>
              <Ext href={SPOTIFY_URL} className="btn">Spotify</Ext>
              <Ext href={YOUTUBE_URL} className="btn">YouTube</Ext>
            </div>
            <div className="songs">
              {shownSongs.map((t) => {
                const on = isOn('s' + t.vid)
                return (
                  <div key={t.vid} className={'song' + (on ? ' active' : '')}>
                    <button className="cover" onClick={() => play(songItem(t))} aria-label={(on && playing ? 'Pause ' : 'Play ') + t.title}>
                      <img src={t.art} alt="" loading="lazy" />
                      <span className="playbtn">{on && playing ? 'Pause' : 'Play'}</span>
                    </button>
                    <div className="songt">{t.title}</div>
                    <div className="songm">
                      <span>{t.year}</span>
                      <Ext href={t.apple}>Stream</Ext>
                      {t.video && <button onClick={() => watch(t.video)}>Video</button>}
                    </div>
                    <Ext href={buyUrl(t.vid)} className="btn sm buybtn">Buy ${SINGLE_PRICE}</Ext>
                  </div>
                )
              })}
            </div>
            {!allSongs && <div className="linkrow gap"><button className="btn" onClick={() => setAllSongs(true)}>Show all {SONGS.length} singles</button></div>}

            <h3 className="h3 gap">The EPs</h3>
            <div className="eps">
              {EPS.map((e, i) => (
                <div key={e.vid} className="ep">
                  <div className={'epart a' + i}><span>EP</span><b>{e.title}</b><i>Hoodstar365</i></div>
                  <div className="eprow"><span className="songt">{e.title}</span><span className="itemprice">${EP_PRICE}</span></div>
                  <Ext href={buyUrl(e.vid)} className="btn gold sm buybtn">Buy the EP</Ext>
                </div>
              ))}
            </div>

            <div className="direct">
              <div>
                <div className="directh">Support the music direct</div>
                <p>Every dollar sent here goes to the artist. No label, no middleman.</p>
              </div>
              <Ext href={CASHAPP_URL} className="btn gold">Cash App {CASHAPP}</Ext>
            </div>

            <div id="videos" className="vidhead">
              <h3 className="h3">Videos</h3>
              <div className="tabs">
                {VIDEO_KINDS.map((k) => <button key={k.id} className={kind === k.id ? 'on' : ''} onClick={() => setKind(k.id)}>{k.name}</button>)}
              </div>
            </div>
            <div className="player">
              <div className="video">
                <iframe key={nowVid.id} title={nowVid.title} src={`https://www.youtube.com/embed/${nowVid.id}?rel=0&modestbranding=1`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
              <div className="nowv"><span className="kick red">Now showing</span><span className="nowtitle">{nowVid.title}</span></div>
            </div>
            <div className="thumbs">
              {VIDEOS.filter((v) => v.kind === kind).map((v) => (
                <button key={v.id} className={'thumb' + (v.id === vid ? ' active' : '')} onClick={() => watch(v.id)}>
                  <span className="timg"><img src={v.thumb} alt="" loading="lazy" /></span>
                  <span className="tname">{v.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="merch" className="sec alt">
          <div className="wrap">
            <Head kick="Merch" title="Survivor Collection">Eight shirts. Each one is a one-of-one, hand-bleached and personally signed. When a number sells, it is gone.</Head>
            <div className="grid four">
              {SURVIVOR.map((p) => (
                <Ext key={p.no} href={p.href} className="item">
                  <span className="shot"><img src={p.img} alt={p.name} loading="lazy" /></span>
                  <span className="itemrow"><span className="itemno">No. {p.no}</span><span className="itemprice">${p.price}</span></span>
                  <span className="itemname">{p.name}</span>
                  <span className="buy">Buy this one</span>
                </Ext>
              ))}
            </div>

            <h3 className="h3 gap">Tees, hoodies and prints</h3>
            <div className="grid four">
              {WEAR.map((p) => (
                <Ext key={p.name} href={p.href} className="item">
                  <span className={'shot' + (p.dark ? '' : ' stone')}><img src={p.img} alt={p.name} loading="lazy" /></span>
                  <span className="itemrow"><span className="itemno">{p.kind}</span><span className="itemprice">${p.price}</span></span>
                  <span className="itemname">{p.name}</span>
                  <span className="buy">Buy now</span>
                </Ext>
              ))}
            </div>
            <div className="linkrow gap"><Ext href={STORE_URL} className="btn">See the full store</Ext></div>
          </div>
        </section>

        <section id="podcast" className="sec">
          <div className="wrap podgrid">
            <div className="podside">
              <img src={PODCAST.art} alt="Respect Da Game Podcast cover" loading="lazy" />
              <div className="cta">
                <Ext href={PODCAST.apple} className="btn wide">Apple Podcasts</Ext>
                <Ext href={PODCAST.spotify} className="btn wide">Spotify</Ext>
              </div>
            </div>
            <div className="podmain">
              <Head kick="Podcast" title="Respect Da Game">Hosted by Ali Hoodstar365. Real talk on the culture, the country and the come-up.</Head>
              <div className="eplist">
                {PODCAST.episodes.map((e) => {
                  const on = isOn('p' + e.link)
                  return (
                    <button key={e.link} className={'eprow2' + (on ? ' active' : '')} onClick={() => play(epItem(e))}>
                      <span className="tk">{on && playing ? 'Pause' : 'Play'}</span>
                      <span className="tt">{e.title}</span>
                      <span className="td">{e.date} / {e.dur}</span>
                    </button>
                  )
                })}
              </div>
              <div className="linkrow"><Ext href={PODCAST.archive} className="btn">The archive: 150+ earlier episodes</Ext></div>
            </div>
          </div>
        </section>

        <section id="books" className="sec alt">
          <div className="wrap">
            <Head kick="Books" title="Written by E. Torres Sr.">Four titles, available on Amazon. Want it signed? Order straight from the author.</Head>
            <ul className="books">
              {BOOKS.map((b, i) => (
                <li key={b.title}>
                  <span className="bn">{String(i + 1).padStart(2, '0')}</span>
                  <span className="bt">{b.title}</span>
                  <Ext href={b.href} className="btn gold sm">Buy on Amazon</Ext>
                </li>
              ))}
            </ul>
            <div className="linkrow">
              <Ext href={AMAZON_AUTHOR} className="btn">Author page on Amazon</Ext>
              <a className="btn" href={`mailto:${BOOK_EMAIL}?subject=Signed%20book%20order`}>Order a signed copy</a>
            </div>
          </div>
        </section>

        <section id="booking" className="sec">
          <div className="wrap bookgrid">
            <div>
              <Head kick="Booking" title="Book Hoodstar365">Shows, features, and The Journey Continues: the Inspired to Inspire Tour, where a keynote, live music and a book signing share one stage.</Head>
              <div className="cta">
                <a className="btn gold" href={`mailto:${BOOK_EMAIL}?subject=Booking%20inquiry`}>Send a booking request</a>
                <Ext href={`${STORE_URL}/products/hoodstar365-brand-partnership-starter-sponsorship`} className="btn">Brand partnerships</Ext>
              </div>
              <p className="contactline">{BOOK_EMAIL} / text {TEXT_LINE}</p>
            </div>
            <ul className="offers">
              <li><b>Live performance</b><span>Club dates, showcases, festivals.</span></li>
              <li><b>Features and verses</b><span>Send the record and the deadline.</span></li>
              <li><b>Speaking</b><span>Keynote, live music and a book signing in one program.</span></li>
              <li><b>Podcast guest</b><span>Or sit down on Respect Da Game.</span></li>
            </ul>
          </div>
        </section>

        <section id="apps" className="sec alt">
          <div className="wrap stackcol">
            <Head kick="Apps" title="Built by Hoodstar365">The software side of HSW365 Media. Pick one and sign up.</Head>
            {APP_GROUPS.map((g) => (
              <div key={g.group} className="appgroup">
                <div className="groupname">{g.group}</div>
                <div className="applist">
                  {g.items.map((a) => (
                    <Ext key={a.name} href={a.href}><span className="aname">{a.name}</span><span className="awhat">{a.what}</span><span className="btn sm">Sign up</span></Ext>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="radio" className="sec">
          <div className="wrap stackcol">
            <Head kick="TV Radio and podcast" title="Hoodstar365 TV Radio">The station for independent artists, and the home of the Respect Da Game podcast. Get your record in rotation.</Head>
        <div className="console">
          <div className="stage">
            <div className="stagehead"><span className="onair"><span className="dot" />Now on air</span><span>{videos.length} in rotation</span></div>
            <div className="video">
              {current && <iframe title={current.title} src={embedSrc(current)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
            </div>
            <div className="nowrow">
              <div>
                <div className="nowtitle">{current ? current.title : ''}</div>
                <div className="nowartist">{current ? current.artist || 'Independent artist' : ''}</div>
              </div>
              <div className="ctrls">
                <button className="btn sm" onClick={prev}>Prev</button>
                <button className="btn sm" onClick={next}>Next</button>
              </div>
            </div>
          </div>
          <div className="rotation">
            <div className="stagehead"><span>Station playlist</span></div>
            <div className="rotlist">
              {videos.map((v, i) => (
                <button key={(v.video_id || i) + '-' + i} className={'rotitem' + (i === idx ? ' active' : '')} onClick={() => setIdx(i)}>
                  <span className="rotnum">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rottext"><span className="t">{v.title}</span><span className="a">{v.artist || 'Independent artist'}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="paste">
          <input id="preview-link" placeholder="Paste your YouTube or Vimeo link to see it on the stage" value={pasteVal} onChange={(e) => setPasteVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && preview()} />
          <button className="btn" onClick={preview}>Preview</button>
        </div>


            <h3 className="h3">Rates and placements</h3>
            <div className="rates">
              {RATES.map((r) => <Rate key={r.id} r={r} active={inCart(r.id)} onToggle={toggle} />)}
            </div>

            <h3 className="h3" id="submit">Lock your spot</h3>
        <div className="ordergrid">
          <div className="form">
            <label htmlFor="f-name">Artist or group name<input id="f-name" {...field('artist_name')} placeholder="Your name" /></label>
            <label htmlFor="f-email">Email<input id="f-email" type="email" {...field('email')} placeholder="you@email.com" /></label>
            <label htmlFor="f-phone">Phone<input id="f-phone" type="tel" {...field('phone')} placeholder="Optional if you gave an email" /></label>
            <label htmlFor="f-link">Song or video link<input id="f-link" {...field('link')} placeholder="YouTube, Vimeo or streaming link" /></label>
            <label htmlFor="f-notes">Notes<textarea id="f-notes" {...field('notes')} placeholder="Anything we should know" /></label>
          </div>
          {!order ? (
            <div className="cart">
              <div className="carthead">Your order</div>
              {cart.length === 0
                ? <p className="empty">Nothing added yet. Choose a placement above.</p>
                : cart.map((c) => (
                  <div key={c.id} className="cartrow"><span>{c.name}</span><span className="cartp">${c.price}<button className="rm" onClick={() => toggle(c)}>Remove</button></span></div>
                ))}
              <div className="total"><span>Total</span><span className="n">${total}</span></div>
              <button className="btn gold wide" disabled={busy} onClick={submit}>{busy ? 'Saving' : 'Submit order'}</button>
              <p className="fine">You get an order ID and payment details as soon as you submit.</p>
            </div>
          ) : (
            <div className="cart confirm">
              <div className="carthead">Order received</div>
              <div className="oid">{order.order_id}</div>
              <p className="empty">Locked in for <b>{order.artist_name}</b>, total <b>${order.total}</b>. Send payment with your order ID in the note, then email your file if you did not link it.</p>
              <div className="payline"><span>Cash App</span><b>{CASHAPP}</b></div>
              <div className="payline"><span>PayPal</span><b>{ORDER_EMAIL}</b></div>
              <div className="payline"><span>Email your file</span><b>{ORDER_EMAIL}</b></div>
              <button className="btn wide" onClick={() => { setOrder(null); setCart([]); setForm({ artist_name: '', email: '', phone: '', link: '', notes: '' }) }}>Start a new order</button>
            </div>
          )}
        </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap footgrid">
          <div>
            <div className="brand">HOODSTAR<b>365</b></div>
            <p className="motto">Turn Negative Into Positive</p>
            <p className="legal">HOODSTAR ENT LLC / HSW365 Media LLC / Vineland, NJ</p>
          </div>
          <div>
            <div className="ft">Booking</div>
            <p>{BOOK_EMAIL}<br />Text {TEXT_LINE}</p>
            <div className="ft">Radio orders</div>
            <p>{ORDER_EMAIL}</p>
          </div>
          <div>
            <div className="ft">Follow</div>
            <p className="social">
              <Ext href="https://www.instagram.com/hoodstar365">Instagram</Ext>
              <Ext href="https://www.tiktok.com/@hoodstar365">TikTok</Ext>
              <Ext href={YOUTUBE_URL}>YouTube</Ext>
              <Ext href={SPOTIFY_URL}>Spotify</Ext>
            </p>
            <div className="ft">Artists</div>
            <p><Ext href={QUEENEE_URL} className="ulink">Want your own page like this? QUEENEE builds it.</Ext></p>
          </div>
        </div>
      </footer>

      {now && (
        <div className="mini" role="region" aria-label="Now playing">
          <div className="minibar"><i style={{ width: (prog * 100).toFixed(1) + '%' }} /></div>
          <div className="wrap miniin">
            <img src={now.art} alt="" />
            <div className="minit"><b>{now.title}</b><span>{now.sub}</span></div>
            <button className="btn sm" onClick={() => play(now)}>{playing ? 'Pause' : 'Play'}</button>
            <Ext href={now.href} className="btn gold sm">{now.cta}</Ext>
            <button className="btn sm x" onClick={stopAudio} aria-label="Close player">Close</button>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
