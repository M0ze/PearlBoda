import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Bike, Check, ChevronDown, Clock3, MapPin, Menu, Moon, Navigation, ShieldCheck, Sparkles, Sun, X, Zap } from 'lucide-react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import './App.css'

const cities = ['Kampala', 'Hioma', 'Fort Portal']
const ownerEmail = 'mugaggamozes@gmail.com'
const ownerPhone = '+256764625700'
const whatsappNumber = ownerPhone.replace(/\D/g, '')

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('pearlboda-theme') !== 'light')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [city, setCity] = useState('Kampala')
  const [destination, setDestination] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const bikeX = useSpring(mouseX, { stiffness: 80, damping: 18 })
  const bikeY = useSpring(mouseY, { stiffness: 80, damping: 18 })

  useEffect(() => {
    const onScroll = () => setScrollProgress(Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)))
    const onMouse = (event: MouseEvent) => {
      mouseX.set((event.clientX / window.innerWidth - 0.5) * 14)
      mouseY.set((event.clientY / window.innerHeight - 0.5) * 8)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouse, { passive: true })
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKeyDown)
    const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.14 })
    document.querySelectorAll('.reveal').forEach((item) => reveal.observe(item))
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('keydown', onKeyDown)
      reveal.disconnect()
    }
  }, [mouseX, mouseY])

  useEffect(() => {
    localStorage.setItem('pearlboda-theme', dark ? 'dark' : 'light')
  }, [dark])

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = `Hello PearlBoda! I need a ride in ${city}. Destination: ${destination}. Please help me find a rider.`
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setSubmitted(true)
  }

  const themeLabel = useMemo(() => dark ? 'Switch to light mode' : 'Switch to dark mode', [dark])

  return (
    <div className={dark ? 'app' : 'app light-mode'}>
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />
      <header className={`site-nav ${scrollProgress > 0.03 ? 'is-scrolled' : ''}`}>
        <a href="#top" className="brand" aria-label="PearlBoda home"><span className="brand-mark"><Bike size={19} /></span><span>Pearl<span className="brand-accent">Boda</span></span></a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#why-us" onClick={() => setMenuOpen(false)}>Why PearlBoda</a>
          <a href="#cities" onClick={() => setMenuOpen(false)}>Cities</a>
        </nav>
        <div className="nav-actions">
          <button className="icon-button" aria-label={themeLabel} onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <a className="button button-small button-primary desktop-cta" href="#book">Book a ride <ArrowRight size={16} /></a>
          <button className={`menu-button ${menuOpen ? 'active' : ''}`} aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero section-shell">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> Uganda moves with us</div>
              <h1>Move different.<br /><span className="gradient-text">Move PearlBoda.</span></h1>
              <p className="hero-lede">Your city, your people, your ride. Get a trusted boda in seconds and keep your day moving.</p>
              <div className="hero-actions">
                <a href="#book" className="button button-primary">Get a ride <ArrowRight size={18} /></a>
                <a href="#how-it-works" className="button button-ghost">See how it works <ChevronDown size={17} /></a>
              </div>
              <div className="trust-row"><div className="avatar-stack"><span>J</span><span>A</span><span>K</span><span>+</span></div><span><strong>10k+</strong> riders already moving</span><span className="trust-divider" /><span className="rating">★ 4.9</span></div>
            </div>
            <div className="hero-visual" aria-label="Stylized PearlBoda motorcycle illustration">
              <div className="orb orb-one" /><div className="orb orb-two" />
              <motion.div className="bike-scene" style={{ x: bikeX, y: bikeY }}>
                <div className="speed-line line-one" /><div className="speed-line line-two" /><div className="speed-line line-three" />
                <div className="bike-glow" />
                <div className="wheel wheel-back"><i /><i /><i /><i /></div>
                <div className="wheel wheel-front"><i /><i /><i /><i /></div>
                <div className="bike-frame" /><div className="bike-tank" /><div className="bike-seat" />
                <div className="bike-fork" /><div className="bike-handle" /><div className="bike-light" />
                <div className="rider-head" /><div className="rider-body" /><div className="rider-arm" /><div className="rider-leg leg-one" /><div className="rider-leg leg-two" />
              </motion.div>
              <div className="visual-label"><span className="pulse-dot" /> Live in Kampala <span>•</span> 2 min away</div>
            </div>
          </div>
          <div className="hero-bottom"><span>01 — 03</span><div className="hero-line"><i /></div><span>Scroll to explore <ArrowRight size={14} /></span></div>
        </section>

        <section id="why-us" className="section-shell section">
          <div className="section-heading reveal"><div><span className="eyebrow">The PearlBoda difference</span><h2>More than a ride.<br /><span className="muted">It’s your shortcut to life.</span></h2></div><p>Built around how Uganda actually moves: quick, social, and always one turn ahead.</p></div>
          <div className="feature-grid">
            {[
              { icon: Zap, color: 'violet', title: 'Fast by default', text: 'A trusted rider near you, without the endless waiting or guessing.' },
              { icon: ShieldCheck, color: 'cyan', title: 'Safe feels better', text: 'Verified riders, live trip sharing, and support that actually picks up.' },
              { icon: Sparkles, color: 'pink', title: 'Made for your city', text: 'Local routes, fair fares, and the energy of Kampala, Hioma, and beyond.' },
            ].map(({ icon: Icon, color, title, text }, index) => <article className={`feature-card reveal ${color}`} style={{ transitionDelay: `${index * 100}ms` }} key={title}><div className="feature-icon"><Icon size={23} /></div><span className="feature-number">0{index + 1}</span><h3>{title}</h3><p>{text}</p><a href="#book" aria-label={`Learn more about ${title}`}><ArrowRight size={18} /></a></article>)}
          </div>
        </section>

        <section id="how-it-works" className="section-shell section process-section">
          <div className="section-heading centered reveal"><span className="eyebrow">No overthinking</span><h2>From <span className="gradient-text">“where are you?”</span><br />to “we’re here.”</h2></div>
          <div className="steps-grid">
            {[{ n: '01', icon: MapPin, title: 'Drop a pin', text: 'Tell us where you are and where you’re headed.' }, { n: '02', icon: Navigation, title: 'We find your person', text: 'Get matched with a verified rider nearby.' }, { n: '03', icon: Bike, title: 'Ride your way', text: 'Hop on, breathe out, and enjoy the journey.' }].map(({ n, icon: Icon, title, text }, index) => <div className="step reveal" style={{ transitionDelay: `${index * 130}ms` }} key={n}><div className="step-top"><span>{n}</span><Icon size={20} /></div><h3>{title}</h3><p>{text}</p>{index < 2 && <div className="step-connector" />}</div>)}
          </div>
        </section>

        <section id="cities" className="section-shell section cities-section">
          <div className="cities-copy reveal"><span className="eyebrow">Where we roll</span><h2>Big city energy.<br /><span className="gradient-text">Local soul.</span></h2><p>From morning commutes to late-night linkups, we’re building the easiest way to get around Uganda.</p><a href="#book" className="text-link">Find a ride <ArrowRight size={17} /></a></div>
          <div className="city-map reveal"><div className="map-grid" /><div className="route route-a" /><div className="route route-b" />{cities.map((name, i) => <button className={`city-pin pin-${i}`} key={name} onClick={() => setCity(name)}><span className="pin-pulse" /><MapPin size={20} fill="currentColor" /><strong>{name}</strong></button>)}<div className="map-status"><span className="pulse-dot" /> {city} is buzzing <strong>●</strong></div></div>
        </section>

        <section id="book" className="book-section section-shell">
          <div className="book-copy"><span className="eyebrow">Your next move</span><h2>Ready when<br /><span className="gradient-text">you are.</span></h2><p>Book in under a minute. No stress, no small print.</p></div>
          <form className="booking-card" onSubmit={submitBooking}>
            {submitted ? <div className="success-state"><div className="success-icon"><Check size={31} /></div><h3>Request sent to WhatsApp</h3><p>Your ride details are ready for PearlBoda support. We’ll match you with a rider shortly.</p><div className="contact-actions"><a className="button button-primary" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">Open WhatsApp</a><a className="button button-ghost" href={`mailto:${ownerEmail}`}>Email support</a></div><button type="button" className="button button-ghost another-ride" onClick={() => { setSubmitted(false); setDestination('') }}>Book another ride</button></div> : <><div className="form-top"><span>Book a ride</span><span className="secure"><ShieldCheck size={14} /> Safe & simple</span></div><label htmlFor="destination">Where are you going?<div className="input-wrap"><MapPin size={18} /><input id="destination" required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Enter your destination" /></div></label><label>Pick your city<div className="city-options">{cities.map((item) => <button type="button" className={city === item ? 'selected' : ''} onClick={() => setCity(item)} key={item}>{city === item && <Check size={14} />}{item}</button>)}</div></label><button className="button button-primary button-full" type="submit">Find my rider <ArrowRight size={18} /></button><p className="form-note"><Clock3 size={14} /> Usually matched in under 2 minutes</p></>}
          </form>
        </section>
      </main>
      <footer className="footer section-shell"><a href="#top" className="brand"><span className="brand-mark"><Bike size={19} /></span><span>Pearl<span className="brand-accent">Boda</span></span></a><span>Made for the way Uganda moves.</span><span className="footer-contact"><a href={`mailto:${ownerEmail}`}>{ownerEmail}</a><a href={`tel:${ownerPhone}`}>{ownerPhone}</a></span><span>© 2026 PearlBoda</span></footer>
    </div>
  )
}

export default App
