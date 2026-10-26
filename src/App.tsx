import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Bike, Check, ChevronDown, Clock3, LocateFixed, MapPin, Menu, Moon, Navigation, ShieldCheck, Sparkles, Sun, X, Zap } from 'lucide-react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import './App.css'

const cities = ['Kampala', 'Hoima', 'Fort Portal']
const cityCoordinates = {
  Kampala: { lat: 0.3476, lng: 32.5825 },
  Hoima: { lat: 1.4278, lng: 31.3536 },
  'Fort Portal': { lat: 0.6712, lng: 30.2754 },
} as const

const riderSeed: Record<string, Array<{ name: string; vehicle: string; status: string; eta: string; lat: number; lng: number }>> = {
  Kampala: [
    { name: 'Aisha', vehicle: 'Honda Boxer', status: 'Available', eta: '2 min', lat: 0.3491, lng: 32.5812 },
    { name: 'Joseph', vehicle: 'TVS Motor', status: 'Available', eta: '4 min', lat: 0.3468, lng: 32.5873 },
    { name: 'Faith', vehicle: 'Yamaha', status: 'Nearby', eta: '6 min', lat: 0.3434, lng: 32.5845 },
  ],
  Hoima: [
    { name: 'Martin', vehicle: 'Bajaj Boxer', status: 'Available', eta: '3 min', lat: 1.4288, lng: 31.3524 },
    { name: 'Nancy', vehicle: 'Honda', status: 'Available', eta: '5 min', lat: 1.4255, lng: 31.3566 },
    { name: 'Samuel', vehicle: 'Yamaha', status: 'Nearby', eta: '7 min', lat: 1.4312, lng: 31.3504 },
  ],
  'Fort Portal': [
    { name: 'Diana', vehicle: 'TVS', status: 'Available', eta: '4 min', lat: 0.6754, lng: 30.2789 },
    { name: 'Peter', vehicle: 'Bajaj', status: 'Nearby', eta: '6 min', lat: 0.6687, lng: 30.2718 },
    { name: 'Ruth', vehicle: 'Honda', status: 'Available', eta: '8 min', lat: 0.6731, lng: 30.2836 },
  ],
}

const ownerEmail = 'mugaggamozes@gmail.com'
const ownerPhone = '+256764625700'
const whatsappNumber = ownerPhone.replace(/\D/g, '')

const getDistanceKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine))
}

const formatDistance = (distanceKm: number) => distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('pearlboda-theme') !== 'light')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [city, setCity] = useState('Kampala')
  const [destination, setDestination] = useState('')
  const [pickup, setPickup] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [customerLocation, setCustomerLocation] = useState(cityCoordinates.Kampala)
  const [locationStatus, setLocationStatus] = useState('Using city center')
  const [pickupMode, setPickupMode] = useState<'manual' | 'current'>('manual')
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

  useEffect(() => {
    const fallbackLocation = cityCoordinates[city as keyof typeof cityCoordinates] || cityCoordinates.Kampala
    setCustomerLocation(fallbackLocation)
    setLocationStatus('Using city center')
    setPickupMode('manual')
    setPickup('')

    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCustomerLocation(coords)
        setLocationStatus('Live GPS location')
      },
      () => {
        setCustomerLocation(fallbackLocation)
        setLocationStatus('Using city center')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
    )
  }, [city])

  const nearbyRiders = useMemo(() => {
    const riders = riderSeed[city] || riderSeed.Kampala
    return riders
      .map((rider) => ({ ...rider, distanceKm: getDistanceKm(customerLocation, { lat: rider.lat, lng: rider.lng }) }))
      .sort((first, second) => first.distanceKm - second.distanceKm)
      .slice(0, 5)
  }, [city, customerLocation])

  const mapRiders = useMemo(
    () =>
      nearbyRiders.map((rider, index) => ({
        ...rider,
        x: 24 + ((index + 1) * 18) % 64,
        y: 26 + ((index + 2) * 16) % 52,
      })),
    [nearbyRiders],
  )

  const handleUseCurrentLocation = () => {
    setPickup('Current location')
    setPickupMode('current')
    setLocationStatus('Live GPS location')
  }

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const pickupText = pickupMode === 'current' ? `Current location (${customerLocation.lat.toFixed(4)}, ${customerLocation.lng.toFixed(4)})` : pickup || 'Pickup point'
    const message = `Hello PearlBoda! I need a ride in ${city}. Pickup: ${pickupText}. Destination: ${destination || 'Not specified'}. I can see ${nearbyRiders.length} rider(s) nearby.`
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
          <div className="section-heading reveal"><div><span className="eyebrow">The PearlBoda difference</span><h2>More than a ride.<br /><span className="muted">It’s your shortcut to life.</span></h2></div></div>
          <div className="feature-grid">
            {[
              { icon: Zap, color: 'violet', title: 'Fast by default', text: 'A trusted rider near you, without the endless waiting or guessing.' },
              { icon: ShieldCheck, color: 'cyan', title: 'Safe feels better', text: 'Verified riders, live trip sharing, and support that actually picks up.' },
              { icon: Sparkles, color: 'pink', title: 'Made for your city', text: 'Local routes, fair fares, and the energy of Kampala, Hoima, and beyond.' },
            ].map(({ icon: Icon, color, title, text }, index) => <article className={`feature-card reveal ${color}`} style={{ transitionDelay: `${index * 100}ms` }} key={title}><div className="feature-icon"><Icon size={20} /></div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section id="how-it-works" className="section-shell section process-section">
          <div className="section-heading centered reveal"><span className="eyebrow">No overthinking</span><h2>From <span className="gradient-text">“where are you?”</span><br />to “we’re on the way.”</h2></div>
          <div className="steps-grid">
            {[{ n: '01', icon: MapPin, title: 'Drop a pin', text: 'Tell us where you are and where you’re headed.' }, { n: '02', icon: Navigation, title: 'We find your person', text: 'Get matched with a nearby rider in your city.' }, { n: '03', icon: Clock3, title: 'Ride updates', text: 'Track the rider live and stay informed until arrival.' }].map(({ n, icon: Icon, title, text }) => <article className="step reveal" key={n}><div className="step-top"><span>{n}</span><div className="step-icon"><Icon size={18} /></div></div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section id="cities" className="section-shell section cities-section">
          <div className="cities-copy reveal">
            <span className="eyebrow">Where we roll</span>
            <h2>Big city energy.<br /><span className="gradient-text">Local soul.</span></h2>
            <p>From morning commutes to late-night errands, PearlBoda connects riders with nearby drivers across the cities people trust most.</p>
            <div className="city-buttons">
              {cities.map((name) => (
                <button key={name} type="button" className={`city-pill ${city === name ? 'active' : ''}`} onClick={() => setCity(name)}>{name}</button>
              ))}
            </div>
          </div>

          <div className="city-map reveal">
            <div className="map-panel">
              <div className="map-canvas" aria-label="Nearby rider map">
                <div className="map-grid" />
                <div className="user-marker" style={{ left: '50%', top: '52%' }}>
                  <span>You</span>
                </div>
                {mapRiders.map((rider) => (
                  <div key={rider.name} className="rider-marker" style={{ left: `${rider.x}%`, top: `${rider.y}%` }} title={`${rider.name} • ${rider.vehicle}`}>
                    <span>{rider.name}</span>
                  </div>
                ))}
              </div>

              <div className="map-status-row">
                <span className="status-pill"><LocateFixed size={14} /> {locationStatus}</span>
                <span className="status-pill">{nearbyRiders.length} riders nearby</span>
              </div>

              <div className="rider-list">
                {nearbyRiders.map((rider) => (
                  <div className="rider-row" key={rider.name}>
                    <div>
                      <strong>{rider.name}</strong>
                      <span>{rider.vehicle}</span>
                    </div>
                    <div className="rider-meta">
                      <span>{rider.status}</span>
                      <small>{formatDistance(rider.distanceKm)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="book" className="book-section section-shell">
          <div className="book-copy">
            <span className="eyebrow">Your next move</span>
            <h2>Ready when<br /><span className="gradient-text">you are.</span></h2>
            <p>Book in under a minute. No stress, no guessing, no fake riders. We match you with nearby drivers you can actually trust.</p>
            <div className="contact-actions">
              <a className="button button-primary" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
              <a className="button button-ghost" href={`mailto:${ownerEmail}`}>Email support</a>
            </div>
          </div>

          <form className="booking-card" onSubmit={submitBooking}>
            {submitted ? (
              <div className="success-state">
                <div className="success-icon"><Check size={31} /></div>
                <h3>Request sent to WhatsApp</h3>
                <p>Your ride details are ready and a PearlBoda support agent can follow up.</p>
                <button type="button" className="button button-primary button-full" onClick={() => setSubmitted(false)}>Book another ride</button>
              </div>
            ) : (
              <>
                <div className="field-row">
                  <label>
                    City
                    <select value={city} onChange={(event) => setCity(event.target.value)}>
                      {cities.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Pickup point
                    <input type="text" placeholder="e.g. Shoprite, Kasubi Road" value={pickup} onChange={(event) => setPickup(event.target.value)} />
                  </label>
                  <button type="button" className="button button-ghost button-small current-location-btn" onClick={handleUseCurrentLocation}>
                    <MapPin size={15} /> Use current location
                  </button>
                </div>

                <div className="field-row">
                  <label>
                    Destination
                    <input type="text" placeholder="e.g. Hoima Main Market" value={destination} onChange={(event) => setDestination(event.target.value)} />
                  </label>
                </div>

                <div className="inline-summary">
                  <span>{nearbyRiders.length} riders ready</span>
                  <span>{formatDistance(nearbyRiders[0]?.distanceKm || 0)}</span>
                </div>

                <button className="button button-primary button-full" type="submit">Request a ride</button>
              </>
            )}
          </form>
        </section>
      </main>

      <footer className="footer section-shell"><a href="#top" className="brand"><span className="brand-mark"><Bike size={19} /></span><span>Pearl<span className="brand-accent">Boda</span></span></a><p>Open-source mobility for Uganda.</p></footer>
    </div>
  )
}

export default App
