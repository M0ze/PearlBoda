require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pearlboda_secret_key_123';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Page routes
const pages = [
  { path: '/', file: 'index.html' },
  { path: '/about', file: 'about.html' },
  { path: '/order', file: 'order.html' },
  { path: '/driver', file: 'driver.html' },
  { path: '/dashboard', file: 'dashboard.html' },
  { path: '/track', file: 'track.html' },
  { path: '/fare', file: 'fare.html' },
  { path: '/login', file: 'login.html' },
  { path: '/register', file: 'register.html' },
  { path: '/onboarding', file: 'onboarding.html' },
  { path: '/help', file: 'help.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/terms', file: 'terms.html' }
];

pages.forEach(page => {
  app.get(page.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', page.file));
  });
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Database setup
const db = new sqlite3.Database('./db/rides.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database.');
    
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- 'rider' or 'driver'
      city TEXT,
      vehicle_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Rides table
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
      status TEXT DEFAULT 'pending',
      fare_estimate REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(driver_id) REFERENCES users(id)
    )`);
  }
});

// API Routes - Auth
app.post('/api/auth/register', async (req, res) => {
  const { name, phone, password, role, city, vehicle_info } = req.body;
  if (!name || !phone || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`INSERT INTO users (name, phone, password, role, city, vehicle_info) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run([name, phone, hashedPassword, role, city || null, vehicle_info || null], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Phone number already registered' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'User registered successfully', userId: this.lastID });
    });
    stmt.finalize();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Missing phone or password' });
  }

  db.get(`SELECT * FROM users WHERE phone = ?`, [phone], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role, name: user.name });
  });
});

// API Routes - Rides
app.get('/api/cities', (req, res) => {
  const cities = ['Hioma', 'Kampala', 'Fortportal'];
  res.json(cities);
});

// Create a new ride order (Validation added)
app.post('/api/rides', (req, res) => {
  const { passenger_name, phone, pickup_city, dropoff_city, pickup_location, dropoff_location, ride_time, fare_estimate } = req.body;
  
  // Validation
  if (!passenger_name || !phone || !pickup_city || !dropoff_city || !ride_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const phoneRegex = /^[0-9]{9,15}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone format' });
  }

  const stmt = db.prepare(`INSERT INTO rides (passenger_name, phone, pickup_city, dropoff_city, pickup_location, dropoff_location, ride_time, fare_estimate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run([passenger_name, phone, pickup_city, dropoff_city, pickup_location || null, dropoff_location || null, ride_time, fare_estimate || 0], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const rideId = this.lastID;
    io.emit('new_ride', {
      id: rideId,
      passenger_name,
      phone,
      pickup_city,
      dropoff_city,
      pickup_location: pickup_location || '',
      dropoff_location: dropoff_location || '',
      ride_time,
      fare_estimate: fare_estimate || 0
    });
    res.json({ id: rideId, message: 'Ride ordered successfully' });
  });
  stmt.finalize();
});

app.get('/api/rides', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM rides ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/rides/:id/accept', authenticateToken, (req, res) => {
  const rideId = req.params.id;
  const { id: driver_id, name: driver_name } = req.user;

  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Only drivers can accept rides' });
  }

  db.run(`UPDATE rides SET driver_name = ?, driver_id = ?, status = 'accepted' WHERE id = ? AND status = 'pending'`, [driver_name, driver_id, rideId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Ride already accepted or not found' });

    io.to(`ride_${rideId}`).emit('ride_accepted', {
      rideId,
      driver_name,
      status: 'accepted'
    });
    res.json({ message: 'Ride accepted successfully' });
  });
});

app.post('/api/rides/:id/update_location', (req, res) => {
  const rideId = req.params.id;
  const { location } = req.body;
  if (!location) return res.status(400).json({ error: 'Location is required' });
  io.to(`ride_${rideId}`).emit('location_update', { location });
  res.json({ message: 'Location updated' });
});

app.post('/api/rides/:id/complete', authenticateToken, (req, res) => {
  const rideId = req.params.id;
  db.run(`UPDATE rides SET status = 'completed' WHERE id = ?`, [rideId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Ride not found' });
    io.to(`ride_${rideId}`).emit('ride_completed', { rideId });
    res.json({ message: 'Ride completed successfully' });
  });
});

app.get('/api/rides/:id', (req, res) => {
  const rideId = req.params.id;
  db.get(`SELECT * FROM rides WHERE id = ?`, [rideId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Ride not found' });
    res.json(row);
  });
});

// Fare Estimator API (Stub)
app.post('/api/fare-estimate', (req, res) => {
  const { pickup_city, dropoff_city } = req.body;
  // Simple logic for MVP: 5000 UGX base + random variance
  const estimate = 5000 + (Math.floor(Math.random() * 10) * 500);
  res.json({ estimate, currency: 'UGX', eta: '10-15 mins' });
});

// Start server
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  socket.on('join_ride', (data) => {
    const { rideId, role } = data;
    if (rideId) socket.join(`ride_${rideId}`);
    if (role) socket.join(`role_${role}`);
  });

  socket.on('driver_location_update', (data) => {
    const { rideId, location } = data;
    io.to(`ride_${rideId}`).emit('location_update', { location });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

