import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'

const CASHAPP = '$HSW365'
const ORDER_EMAIL = 'HOODSTAR365TVRADIO@GMAIL.COM'
const BOOK_EMAIL = 'hoodstarent365@gmail.com'
const TEXT_LINE = '856-796-8081'

const SEED = [
  { title: 'BIGGEST OPP', artist: 'Hoodstar365', provider: 'youtube', video_id: 'nj7MajxNius' },
  { title: "DON'T CRY", artist: 'Hoodstar365', provider: 'youtube', video_id: 'z9RJcNNKafk' },
  { title: 'Cash Lingo — Studio Session (RIP LD)', artist: 'Cash Lingo', provider: 'youtube', video_id: 'ILfYLfcw0Uw' },
  { title: 'REFLECTION', artist: 'Hoodstar365', provider: 'vimeo', video_id: '971116027' },
]

const RATES = [
  { id: 'radio30', tag: 'Most Popular', feat: true, name: 'Radio Play — 30-Day Rotation', price: 99, unit: '/ 30 days', desc: 'Your song or video in active on-air rotation for 30 days across the station.' },
  { id: 'ad30', tag: 'Ad Block', name: 'Radio Ad — 30 Days', price: 99, unit: '/ 30 days', desc: 'A dedicated ad spot running between rotations for 30 days.' },
  { id: 'ad60', tag: 'Ad Block', name: 'Radio Ad — 60 Days', price: 179, unit: '/ 60 days', desc: 'Extended 60-day ad spot. Better rate, longer reach.' },
  { id: 'ad90', tag: 'Ad Block', name: 'Radio Ad — 90 Days', price: 249, unit: '/ 90 days', desc: 'Full-quarter ad presence on the station.' },
  { id: 'ad180', tag: 'Ad Block', name: 'Radio Ad — 180 Days', price: 449, unit: '/ 180 days', desc: 'Half-year ad domination. Best value per day.' },
  { id: 'mixtape', tag: 'Placement', name: 'Mixtape Series Slot', price: 40, unit: '/ slot', desc: 'A slot on the HOODSTAR365 mixtape series.' },
  { id: 'video', tag: 'Placement', name: 'Music Video Feature', price: 100, unit: '/ 30 days', desc: 'Your music video featured on the front of the station for 30 days.' },
  { id: 'podcast', tag: 'Placement', name: 'Respect Da Game Podcast', price: 60, unit: '/ episode', desc: 'A placement on the Respect Da Game podcast.' },
  { id: 'interview', tag: 'Placement', name: 'Artist Interview', price: 100, unit: '/ feature', desc: 'A full artist interview feature.' },
]

function parseVideo(raw) {
  const url = (raw || '').trim()
  if (!url) return null
  try {
    if (/youtu/.test(url)) {
      let id = ''
      const m1 = url.match(/[?&]v=([\w-]{6,})/)
      const m2 = url.match(/youtu\.be\/([\w-]{6,})/)
      const m3 = url.match(/\/embed\/([\w-]{6,})/)
      const m4 = url.match(/\/shorts\/([\w-]{6,})/)
      id = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || (m4 && m4[1]) || ''
      if (id) return { provider: 'youtube', video_id: id, url }
    }
    if (/vimeo/.test(url)) {
      const m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)
      if (m) return { provider: 'vimeo', video_id: m[1], url }
    }
  } catch (e) {}
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

export default function App() {
  const [videos, setVideos] = useState(SEED)
  const [idx, setIdx] = useState(0)
  const [pasteVal, setPasteVal] = useState('')
  const [cart, setCart] = useState([])
  const [form, setForm] = useState({ artist_name: '', email: '', phone: '', link: '', notes: '' })
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const flash = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 2600) }, [])

  useEffect(() => {
    let live = true
    supabase.from('videos').select('*').eq('is_live', true).order('position', { ascending: true })
      .then(({ data, error }) => {
        if (!live) return
        if (!error && data && data.length) setVideos(data)
      })
    return () => { live = false }
  }, [])

  const current = videos[idx] || null
  const next = () => setIdx((i) => (i + 1) % videos.length)
  const prev = () => setIdx((i) => (i - 1 + videos.length) % videos.length)
  const shuffle = () => { if (videos.length > 1) { let n = idx; while (n === idx) n = Math.floor(Math.random() * videos.length); setIdx(n) } }

  const preview = () => {
    const v = parseVideo(pasteVal)
    if (!v) { flash('Paste a valid YouTube or Vimeo link.'); return }
    const item = { title: 'Preview — your link', artist: 'Preview', ...v }
    setVideos((vs) => [item, ...vs]); setIdx(0); setPasteVal('')
    flash('Loaded to the preview stage. Submit below to lock it into paid rotation.')
  }

  const inCart = (id) => cart.some((c) => c.id === id)
  const toggle = (rate) => setCart((c) => inCart(rate.id) ? c.filter((x) => x.id !== rate.id) : [...c, rate])
  const total = useMemo(() => cart.reduce((s, c) => s + c.price, 0), [cart])

  const submit = async () => {
    if (!form.artist_name.trim()) { flash('Add your artist name.'); return }
    if (!cart.length) { flash('Pick at least one placement above.'); return }
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
    if (error) { flash('Could not save — email your file to ' + ORDER_EMAIL); return }
    setOrder({ ...row })
    flash('Order locked in — order ' + oid)
  }

  const vaultJson = () => {
    const blob = JSON.stringify({ station: 'HOODSTAR365 TV RADIO', exported: new Date().toISOString(), rotation: videos }, null, 2)
    navigator.clipboard?.writeText(blob).then(() => flash('Rotation JSON copied.'), () => flash('Copy failed.'))
  }

  return (
    <div>
      <header className="nav">
        <div className="wrap row">
          <div className="brand">HOODSTAR<b>365</b> TV RADIO</div>
          <nav className="navlinks">
            <a href="#air">On Air</a>
            <a href="#rates">Rates</a>
            <a href="#submit">Submit</a>
            <a href="#vault">Vault</a>
          </nav>
          <span className="live"><span className="dot" />On Air</span>
        </div>
      </header>

      <section id="air" className="hero">
        <div className="wrap">
          <div className="kick">Indie Artist Radio · Mixtapes · Podcasts · Worldwide</div>
          <h1 className="h1">THE STATION FOR <span className="g">INDEPENDENT ARTISTS</span></h1>
          <p className="sub">Get your video in rotation, land on the mixtape, book the Respect Da Game podcast. Real placements, real reach. Turn Negative Into Positive.</p>

          <div className="console">
            <div className="stage">
              <div className="stagehead">
                <span className="onair">● Now On Air</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--dim)' }}>{videos.length} in rotation</span>
              </div>
              <div className="video">
                {current
                  ? <iframe title={current.title} src={embedSrc(current)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  : <div className="mono" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--dim)' }}>No clips on air.</div>}
              </div>
              <div className="nowmeta">
                <div className="nowtitle">{current ? current.title : '—'}</div>
                <div className="nowartist">{current ? current.artist || 'Independent Artist' : ''}</div>
              </div>
              <div className="ctrls">
                <button className="btn" onClick={prev}>‹ Prev</button>
                <button className="btn cyan" onClick={next}>Next ›</button>
                <button className="btn" onClick={shuffle}>Shuffle</button>
              </div>
            </div>

            <div className="rotation">
              <div className="rothead"><span>In Rotation</span><span>Station Playlist</span></div>
              <div className="rotlist">
                {videos.map((v, i) => (
                  <div key={(v.video_id || i) + '-' + i} className={'rotitem' + (i === idx ? ' active' : '')} onClick={() => setIdx(i)}>
                    <span className="rotnum">{String(i + 1).padStart(2, '0')}</span>
                    <div className="rottext">
                      <div className="t">{v.title}</div>
                      <div className="a">{v.artist || 'Independent Artist'} · {v.provider}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="paste">
            <input placeholder="Paste a YouTube or Vimeo link to preview it on the stage…" value={pasteVal} onChange={(e) => setPasteVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && preview()} />
            <button className="btn solid" onClick={preview}>Load</button>
          </div>
          <div className="hint">Previewing is free. To lock a spot into the live paid rotation, choose a placement in Rates and submit below.</div>
        </div>
      </section>

      <section id="rates" className="sec">
        <div className="wrap">
          <div className="seckick">Get In Rotation</div>
          <h2 className="h2">RATES & PLACEMENTS</h2>
          <p className="secsub">Pick what you want, build your order, and submit. You'll get an order ID and payment instructions instantly.</p>
          <div className="rates">
            {RATES.map((r) => (
              <div key={r.id} className={'rate' + (r.feat ? ' feat' : '')}>
                <span className="tag">{r.tag}</span>
                <div className="name">{r.name}</div>
                <div className="price">${r.price}<span> {r.unit}</span></div>
                <div className="desc">{r.desc}</div>
                <button className={'btn add' + (inCart(r.id) ? ' inrcart' : ' cyan')} onClick={() => { toggle(r); document.getElementById('submit')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  {inCart(r.id) ? '✓ In Order — Remove' : 'Add to Order'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="submit" className="sec">
        <div className="wrap">
          <div className="seckick">Submit Your Music</div>
          <h2 className="h2">LOCK YOUR SPOT</h2>
          <p className="secsub">Fill this out, review your order, and pay. Your submission is recorded the moment you send it.</p>
          <div className="grid2">
            <div className="form">
              <div className="field"><label>Artist / Group Name *</label><input className="f" value={form.artist_name} onChange={(e) => setForm({ ...form, artist_name: e.target.value })} placeholder="Your name" /></div>
              <div className="field"><label>Email</label><input className="f" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" /></div>
              <div className="field"><label>Phone</label><input className="f" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(optional)" /></div>
              <div className="field"><label>Song / Video Link</label><input className="f" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="YouTube / Vimeo / streaming link" /></div>
              <div className="field"><label>Notes</label><textarea className="f" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything we should know" /></div>
            </div>

            <div>
              {!order ? (
                <div className="cart">
                  <div className="rothead" style={{ padding: '0 0 8px', border: 0 }}>Your Order</div>
                  {cart.length === 0 ? <div className="empty">No placements yet — add from Rates above.</div> : cart.map((c) => (
                    <div key={c.id} className="cartrow"><span>{c.name}</span><span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>${c.price}<span className="rm" onClick={() => toggle(c)}>remove</span></span></div>
                  ))}
                  <div className="total"><span className="mono" style={{ color: 'var(--dim)', fontSize: 12 }}>TOTAL</span><span className="n">${total}</span></div>
                  <button className="btn solid" style={{ width: '100%', marginTop: 12 }} disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Submit Order'}</button>
                </div>
              ) : (
                <div className="confirm">
                  <div className="seckick" style={{ color: 'var(--cyan)' }}>Order Received</div>
                  <div className="oid">{order.order_id}</div>
                  <p style={{ fontSize: 14, color: 'var(--dim)', margin: '10px 0' }}>Locked in for <b style={{ color: 'var(--txt)' }}>{order.artist_name}</b> — total <b style={{ color: 'var(--txt)' }}>${order.total}</b>. Send payment, then email your file if you haven't linked it.</p>
                  <div className="pay">
                    <div className="payline"><span className="paylabel">CashApp</span><span className="payval" style={{ color: 'var(--yellow)' }}>{CASHAPP}</span></div>
                    <div className="payline"><span className="paylabel">PayPal</span><span className="payval">{ORDER_EMAIL}</span></div>
                    <div className="payline"><span className="paylabel">Email file</span><span className="payval" style={{ fontSize: 15 }}>{ORDER_EMAIL}</span></div>
                  </div>
                  <p className="mono" style={{ fontSize: 11, color: 'var(--dim)', marginTop: 12 }}>Put your order ID {order.order_id} in the payment note so we match it fast.</p>
                  <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={() => { setOrder(null); setCart([]); setForm({ artist_name: '', email: '', phone: '', link: '', notes: '' }) }}>New Order</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="vault" className="sec">
        <div className="wrap">
          <div className="seckick">The Vault</div>
          <h2 className="h2">EVERYTHING IN ROTATION</h2>
          <p className="secsub">The station's live library — every clip persists here for every listener, not just this browser.</p>
          <div className="vaultbar">
            <div className="stat"><div className="n">{videos.length}</div><div className="l">Clips On Air</div></div>
            <div className="stat"><div className="n">{RATES.length}</div><div className="l">Placement Types</div></div>
            <button className="btn cyan" onClick={vaultJson}>Copy Rotation JSON</button>
          </div>
          <div className="rates">
            {videos.map((v, i) => (
              <div key={(v.video_id || i) + '-vault-' + i} className="rate" onClick={() => { setIdx(i); document.getElementById('air')?.scrollIntoView({ behavior: 'smooth' }) }} style={{ cursor: 'pointer' }}>
                <span className="tag">{v.provider}</span>
                <div className="name">{v.title}</div>
                <div className="desc">{v.artist || 'Independent Artist'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap footgrid">
          <div className="footcol">
            <div className="brand" style={{ fontSize: 20, marginBottom: 8 }}>HOODSTAR<b>365</b> TV RADIO</div>
            <div className="footcol"><div className="v">The home of independent artists worldwide.</div></div>
            <div className="tag2">Turn Negative Into Positive</div>
            <div className="legal">HSW365 Media LLC · HOODSTAR ENT LLC · Vineland, NJ</div>
          </div>
          <div className="footcol">
            <div className="t">Submit / Orders</div>
            <div className="v"><b>{ORDER_EMAIL}</b></div>
            <div className="t" style={{ marginTop: 14 }}>CashApp</div>
            <div className="v"><b>{CASHAPP}</b></div>
          </div>
          <div className="footcol">
            <div className="t">Booking</div>
            <div className="v">{BOOK_EMAIL}<br />Text {TEXT_LINE}</div>
            <div className="t" style={{ marginTop: 14 }}>Respect Da Game</div>
            <div className="v">Podcast placements open</div>
          </div>
        </div>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
