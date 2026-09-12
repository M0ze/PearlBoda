require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const OWNER_EMAIL = 'mugaggamozes@gmail.com';
const OWNER_PHONE = '+256764625700';

if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in production');
}

const tokenSecret = JWT_SECRET || 'development-only-pearlboda-secret-change-me';
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed'));
  },
  methods: ['GET', 'POST', 'PATCH'],
}));
app.use(express.json({ limit: '32kb' }));

const dbDirectory = path.join(__dirname, 'db');
fs.mkdirSync(dbDirectory, { recursive: true });
const db = new sqlite3.Database(path.join(dbDirectory, 'rides.db'));

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('passenger', 'driver', 'admin')),
    city TEXT,
    vehicle_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS rides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pickup_city TEXT NOT NULL,
    dropoff_city TEXT NOT NULL,
    pickup_location TEXT,
    dropoff_location TEXT,
    ride_time TEXT NOT NULL,
    driver_name TEXT,
    driver_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    fare_estimate REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(driver_id) REFERENCES users(id)
  )`);
});

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

function isValidPhone(phone) {
  return /^\+?[1-9]\d{8,14}$/.test(phone);
}

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, tokenSecret, (error, user) => {
    if (error) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = user;
    return next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have access to this resource' });
    return next();
  };
}

function publicRide(ride) {
  if (!ride) return ride;
  const { phone, ...safeRide } = ride;
  return safeRide;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'pearlboda-api', timestamp: new Date().toISOString() });
});

app.get('/api/contact', (req, res) => {
  res.json({ email: OWNER_EMAIL, phone: OWNER_PHONE, whatsapp: OWNER_PHONE.replace(/\D/g, '') });
});

app.get('/api/cities', (req, res) => {
  res.json(['Hioma', 'Kampala', 'Fort Portal']);
});

app.post('/api/auth/register', async (req, res) => {
  const { name, password, city, vehicle_info } = req.body;
  const phone = normalizePhone(req.body.phone);
  const role = req.body.role === 'rider' ? 'driver' : req.body.role;
  if (!name || !phone || !password || !['passenger', 'driver'].includes(role)) {
    return res.status(400).json({ error: 'Name, phone, password, and a valid role are required' });
  }
  if (!isValidPhone(phone)) return res.status(400).json({ error: 'Use a valid international phone number' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    db.run(
      'INSERT INTO users (name, phone, password, role, city, vehicle_info) VALUES (?, ?, ?, ?, ?, ?)',
      [String(name).trim(), phone, hashedPassword, role, city || null, vehicle_info || null],
      function onInsert(error) {
        if (error?.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Phone number already registered' });
        if (error) return res.status(500).json({ error: 'Could not create account' });
        return res.status(201).json({ id: this.lastID, message: 'Account created successfully' });
      },
    );
  } catch (error) {
    return res.status(500).json({ error: 'Could not create account' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

  db.get('SELECT * FROM users WHERE phone = ?', [phone], async (error, user) => {
    if (error) return res.status(500).json({ error: 'Could not sign in' });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, tokenSecret, { expiresIn: '24h' });
    return res.json({ token, role: user.role, name: user.name, userId: user.id });
  });
});

app.post('/api/rides', (req, res) => {
  const {
    passenger_name: passengerName,
    pickup_city: pickupCity,
    dropoff_city: dropoffCity,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    ride_time: rideTime,
    fare_estimate: fareEstimate,
  } = req.body;
  const phone = normalizePhone(req.body.phone);
  if (!passengerName || !phone || !pickupCity || !dropoffCity || !rideTime) {
    return res.status(400).json({ error: 'Passenger, phone, cities, and ride time are required' });
  }
  if (!isValidPhone(phone)) return res.status(400).json({ error: 'Use a valid international phone number' });

  db.run(
    `INSERT INTO rides
      (passenger_name, phone, pickup_city, dropoff_city, pickup_location, dropoff_location, ride_time, fare_estimate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [String(passengerName).trim(), phone, String(pickupCity).trim(), String(dropoffCity).trim(), pickupLocation || null, dropoffLocation || null, rideTime, Number(fareEstimate) || 0],
    function onInsert(error) {
      if (error) return res.status(500).json({ error: 'Could not create ride request' });
      db.get('SELECT * FROM rides WHERE id = ?', [this.lastID], (readError, ride) => {
        if (readError) return res.status(500).json({ error: 'Ride was created but could not be loaded' });
        io.to('role_driver').emit('ride_created', publicRide(ride));
        return res.status(201).json({ ride: publicRide(ride), message: 'Ride request created' });
      });
    },
  );
});

app.get('/api/rides', authenticateToken, (req, res) => {
  const query = req.user.role === 'driver'
    ? `SELECT * FROM rides WHERE status = 'pending' OR driver_id = ? ORDER BY created_at DESC`
    : 'SELECT * FROM rides WHERE phone = (SELECT phone FROM users WHERE id = ?) ORDER BY created_at DESC';
  const params = req.user.role === 'driver' ? [req.user.id] : [req.user.id];
  db.all(query, params, (error, rows) => {
    if (error) return res.status(500).json({ error: 'Could not load rides' });
    return res.json(rows.map(publicRide));
  });
});

app.get('/api/rides/:id', (req, res) => {
  db.get('SELECT * FROM rides WHERE id = ?', [req.params.id], (error, ride) => {
    if (error) return res.status(500).json({ error: 'Could not load ride' });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    return res.json(publicRide(ride));
  });
});

app.post('/api/rides/:id/accept', authenticateToken, requireRole('driver'), (req, res) => {
  db.run(
    `UPDATE rides SET driver_name = ?, driver_id = ?, status = 'accepted'
     WHERE id = ? AND status = 'pending'`,
    [req.user.name, req.user.id, req.params.id],
    function onUpdate(error) {
      if (error) return res.status(500).json({ error: 'Could not accept ride' });
      if (!this.changes) return res.status(409).json({ error: 'Ride is no longer available' });
      io.to(`ride_${req.params.id}`).emit('ride_accepted', { rideId: Number(req.params.id), driver_name: req.user.name, status: 'accepted' });
      return res.json({ message: 'Ride accepted successfully' });
    },
  );
});

app.patch('/api/rides/:id/status', authenticateToken, requireRole('driver'), (req, res) => {
  const allowedStatuses = ['in_progress', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ error: 'Invalid ride status' });
  db.run(
    'UPDATE rides SET status = ? WHERE id = ? AND driver_id = ?',
    [req.body.status, req.params.id, req.user.id],
    function onUpdate(error) {
      if (error) return res.status(500).json({ error: 'Could not update ride status' });
      if (!this.changes) return res.status(404).json({ error: 'Assigned ride not found' });
      io.to(`ride_${req.params.id}`).emit('ride_status', { rideId: Number(req.params.id), status: req.body.status });
      return res.json({ message: 'Ride status updated', status: req.body.status });
    },
  );
});

app.post('/api/rides/:id/location', authenticateToken, requireRole('driver'), (req, res) => {
  const { latitude, longitude } = req.body;
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required' });
  }
  db.get('SELECT id FROM rides WHERE id = ? AND driver_id = ? AND status IN (?, ?)', [req.params.id, req.user.id, 'accepted', 'in_progress'], (error, ride) => {
    if (error) return res.status(500).json({ error: 'Could not verify ride' });
    if (!ride) return res.status(404).json({ error: 'Assigned active ride not found' });
    const location = { latitude: Number(latitude), longitude: Number(longitude), updatedAt: new Date().toISOString() };
    io.to(`ride_${req.params.id}`).emit('location_update', { rideId: Number(req.params.id), location });
    return res.json({ message: 'Location broadcast', location });
  });
});

app.post('/api/fare-estimate', (req, res) => {
  const distanceKm = Math.max(1, Number(req.body.distanceKm) || 3);
  const estimate = Math.round((2500 + distanceKm * 1200) / 500) * 500;
  return res.json({ estimate, currency: 'UGX', eta: `${Math.max(5, Math.round(distanceKm * 3))}-${Math.max(10, Math.round(distanceKm * 5))} mins` });
});

io.on('connection', (socket) => {
  socket.on('join_ride', ({ rideId, role } = {}) => {
    if (rideId) socket.join(`ride_${rideId}`);
    if (role === 'driver') socket.join('role_driver');
  });
});

app.use((error, req, res, next) => {
  if (error.message === 'Origin is not allowed') return res.status(403).json({ error: error.message });
  return next(error);
});

server.listen(PORT, () => {
  console.log(`PearlBoda API listening on port ${PORT}`);
});

module.exports = { app, server, db };
