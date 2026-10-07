import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import {
  CASHAPP, ORDER_EMAIL, BOOK_EMAIL, MEDIA_EMAIL, TEXT_LINE, QUEENEE_URL, STORE_URL, SPOTIFY_URL, YOUTUBE_URL,
  CHANNELS, SEED, VIDEOS, RADIO_RATES, PODCAST_RATES, BOOKS, WEAR, WEAR_LIST, APP_GROUPS, BUILD, STACK,
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

function ChannelHead({ ch, title, children }) {
  return (
    <header className="chhead">
      <div className="chno"><span>CH</span>{ch.n}</div>
      <div>
        <div className="chname">{ch.name}</div>
        <h2 className="chtitle">{title}</h2>
        {children && <p className="chsub">{children}</p>}
      </div>
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
  const [active, setActive] = useState('music')

  const flash = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 3200) }, [])

  useEffect(() => {
    let live = true
    supabase.from('videos').select('*').eq('is_live', true).order('position', { ascending: true })
      .then(({ data, error }) => { if (live && !error && data && data.length) setVideos(data) })
    return () => { live = false }
  }, [])

  useEffect(() => {
    const els = CHANNELS.map((c) => document.getElementById(c.id)).filter(Boolean)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-30% 0px -60% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const el = document.querySelector('.rail a.active')
    const box = el && el.parentElement
    if (box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: el.offsetLeft - 16, behavior: 'smooth' })
  }, [active])

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
  const ch = (id) => CHANNELS.find((c) => c.id === id)

  return (
    <div>
      <header className="nav">
        <div className="wrap navrow">
          <a href="#top" className="brand">HOODSTAR<b>365</b></a>
          <nav className="navlinks">
            {CHANNELS.map((c) => <a key={c.id} href={'#' + c.id}>{c.name}</a>)}
          </nav>
          <a href="#artists" className="btn gold sm">Build your page</a>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="heroimg" aria-hidden="true" />
        <div className="wrap herogrid">
          <div className="herocopy">
            <div className="kick">Elvin Torres Sr. / Hoodstar365</div>
            <h1>Turn negative<br />into <em>positive.</em></h1>
            <p className="lede">Recording artist. Author. U.S. Army veteran. Speaker. Founder of HSW365 Media. Everything he makes lives here, sorted into eight channels.</p>
            <div className="cta">
              <a href="#artists" className="btn gold">Indie artists: own your page</a>
              <a href="#radio" className="btn"><span className="dot" />Tune in</a>
            </div>
          </div>
          <nav className="guide" aria-label="Channel guide">
            <div className="guidehead"><span>Channel guide</span><span>08 channels</span></div>
            {CHANNELS.map((c) => (
              <a key={c.id} href={'#' + c.id}>
                <span className="gn">{c.n}</span>
                <span className="gname">{c.name}</span>
                <span className="gline">{c.line}</span>
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section id="artists" className="artists">
        <div className="wrap">
          <div className="pitch">
            <div>
              <div className="kick gold">For independent artists</div>
              <h2>Own your page.<br />Keep <em>100%.</em></h2>
            </div>
            <div className="pitchcopy">
              <p>A link in bio sends your fans to somebody else's platform. Your own landing page sends them to you. Your music, your merch and your booking in one place, paid straight to your own Cash App, PayPal or card account.</p>
              <ul>
                <li><b>No label cut.</b> Nobody is signed to anybody.</li>
                <li><b>No platform cut.</b> HSW365 takes nothing from what you sell.</li>
                <li><b>No code.</b> QUEENEE builds the page for you.</li>
              </ul>
              <div className="cta">
                <Ext href={QUEENEE_URL} className="btn gold">Build my page with QUEENEE</Ext>
                <a href="#radio" className="btn">Get on the radio</a>
              </div>
              <p className="fine">Your payment app charges its own processing fee. The rest is yours.</p>
            </div>
          </div>

          <div className="stackhead">The independent stack</div>
          <ol className="stack">
            {STACK.map((s, i) => (
              <li key={s.tool}>
                <Ext href={s.href}>
                  <span className="sn">{i + 1}</span>
                  <span className="sstep">{s.step}</span>
                  <span className="stool">{s.tool}</span>
                  <span className="swhat">{s.what}</span>
                </Ext>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="wrap body">
        <aside className="rail" aria-label="Channels">
          <div className="railin">
            {CHANNELS.map((c) => (
              <a key={c.id} href={'#' + c.id} className={active === c.id ? 'active' : ''}><span>{c.n}</span>{c.name}</a>
            ))}
          </div>
        </aside>

        <main className="channels">
          <section id="music" className="ch">
            <ChannelHead ch={ch('music')} title="The records">Music released under the HOODSTAR365 label.</ChannelHead>
            <div className="videos">
              {VIDEOS.map((v) => (
                <Ext key={v.title} href={v.href} className={'vid' + (v.img ? '' : ' noimg')}>
                  {v.img && <img src={v.img} alt="" loading="lazy" />}
                  <span className="vmeta"><span className="vkind">{v.kind}</span><span className="vtitle">{v.title}</span></span>
                </Ext>
              ))}
            </div>
            <div className="linkrow">
              <Ext href={SPOTIFY_URL} className="btn">Listen on Spotify</Ext>
              <Ext href={YOUTUBE_URL} className="btn">Watch on YouTube</Ext>
            </div>
          </section>

          <section id="radio" className="ch">
            <ChannelHead ch={ch('radio')} title="Hoodstar365 TV Radio">The station for independent artists. Get your video in rotation, land on the mixtape, run your ad between records.</ChannelHead>

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
              {RADIO_RATES.map((r) => <Rate key={r.id} r={r} active={inCart(r.id)} onToggle={toggle} />)}
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
                    ? <p className="empty">Nothing added yet. Choose a placement above or in the Podcast channel.</p>
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
          </section>

          <section id="podcast" className="ch">
            <ChannelHead ch={ch('podcast')} title="Respect Da Game">Hosted by Hoodstar365. Conversations with the people doing the work, plus placements for artists and brands.</ChannelHead>
            <div className="rates two">
              {PODCAST_RATES.map((r) => <Rate key={r.id} r={r} active={inCart(r.id)} onToggle={(x) => { toggle(x); if (!inCart(x.id)) flash('Added. Finish your order under TV Radio.') }} />)}
            </div>
            <div className="linkrow">
              <a href="#submit" className="btn">Finish your order</a>
              <Ext href={YOUTUBE_URL} className="btn">Watch episodes</Ext>
            </div>
          </section>

          <section id="books" className="ch">
            <ChannelHead ch={ch('books')} title="The books">Four titles by Elvin Torres Sr.</ChannelHead>
            <ul className="books">
              {BOOKS.map((b, i) => <li key={b}><span>{String(i + 1).padStart(2, '0')}</span>{b}</li>)}
            </ul>
            <div className="linkrow">
              <a className="btn" href={`mailto:${BOOK_EMAIL}?subject=Signed%20book%20order`}>Order a signed copy</a>
              <span className="contactline">or text {TEXT_LINE}</span>
            </div>
          </section>

          <section id="speaking" className="ch">
            <ChannelHead ch={ch('speaking')} title="The Journey Continues">The Inspired to Inspire Tour. One program that brings a keynote, live music and a book signing into the same room.</ChannelHead>
            <div className="trio">
              <div><b>Keynote</b><span>A veteran's account of turning the worst days into the work.</span></div>
              <div><b>Live music</b><span>Performed by the artist who wrote it.</span></div>
              <div><b>Book signing</b><span>Signed copies for the audience after the talk.</span></div>
            </div>
            <div className="linkrow">
              <a className="btn gold" href={`mailto:${BOOK_EMAIL}?subject=Speaking%20booking%20inquiry`}>Request dates and the rate card</a>
              <Ext href={`${STORE_URL}/products/hoodstar365-brand-partnership-starter-sponsorship`} className="btn">Brand partnerships</Ext>
            </div>
            <p className="contactline">{BOOK_EMAIL} / text {TEXT_LINE}</p>
          </section>

          <section id="streetwear" className="ch">
            <ChannelHead ch={ch('streetwear')} title="HSW365 streetwear">Veteran owned. Sold at hsw365.co.</ChannelHead>
            <div className="wear">
              {WEAR.map((w) => (
                <Ext key={w.name} href={w.href} className="wearcard">
                  <img src={w.img} alt={w.name} loading="lazy" />
                  <span className="wname">{w.name}</span>
                  <span className="wnote">{w.note}</span>
                </Ext>
              ))}
              <div className="wearlist">
                {WEAR_LIST.map((w) => <Ext key={w.name} href={w.href}><span>{w.name}</span><span>{w.note}</span></Ext>)}
              </div>
            </div>
            <div className="linkrow"><Ext href={STORE_URL} className="btn">Shop the full store</Ext></div>
          </section>

          <section id="apps" className="ch">
            <ChannelHead ch={ch('apps')} title="Software by HSW365 Media">Built and run by one founder. Grouped by who each one is for.</ChannelHead>
            {APP_GROUPS.map((g) => (
              <div key={g.group} className="appgroup">
                <div className="groupname">{g.group}</div>
                <div className="applist">
                  {g.items.map((a) => (
                    <Ext key={a.name} href={a.href}><span className="aname">{a.name}</span><span className="awhat">{a.what}</span><span className="ago">Open</span></Ext>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section id="build" className="ch">
            <ChannelHead ch={ch('build')} title="HSW365 Media Build Series">The playbooks behind everything on this page.</ChannelHead>
            <div className="covers">
              {BUILD.map((b) => (
                <Ext key={b.name} href={b.href} className="cover">
                  <img src={b.img} alt={b.name} loading="lazy" />
                  <span className="vkind">{b.kind}</span>
                  <span className="wname">{b.name}</span>
                  <span className="wnote">{b.sub}</span>
                </Ext>
              ))}
            </div>
          </section>
        </main>
      </div>

      <section className="closer">
        <div className="wrap closerin">
          <h2>Your name. Your link.<br />Your <em>money.</em></h2>
          <div className="cta">
            <Ext href={QUEENEE_URL} className="btn gold">Build my page</Ext>
            <a href="#radio" className="btn">Get in rotation</a>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap footgrid">
          <div>
            <div className="brand">HOODSTAR<b>365</b></div>
            <p className="motto">Turn Negative Into Positive</p>
            <p className="legal">HSW365 Media LLC / HOODSTAR ENT LLC / Vineland, NJ</p>
          </div>
          <div>
            <div className="ft">Booking</div>
            <p>{BOOK_EMAIL}<br />Text {TEXT_LINE}</p>
            <div className="ft">Radio orders</div>
            <p>{ORDER_EMAIL}</p>
          </div>
          <div>
            <div className="ft">Business</div>
            <p>{MEDIA_EMAIL}</p>
            <div className="ft">Follow</div>
            <p className="social">
              <Ext href="https://www.instagram.com/hoodstar365">Instagram</Ext>
              <Ext href="https://www.tiktok.com/@hoodstar365">TikTok</Ext>
              <Ext href={YOUTUBE_URL}>YouTube</Ext>
              <Ext href={SPOTIFY_URL}>Spotify</Ext>
            </p>
          </div>
        </div>
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
