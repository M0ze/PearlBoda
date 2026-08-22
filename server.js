const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Page routes (before static so index.html does not override /)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});
app.get('/driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'driver.html'));
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Database setup
const db = new sqlite3.Database('./db/rides.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database.');
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
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating table:', err);
      else console.log('Rides table ready');
    });
  }
});

// API Routes
// Get available cities
app.get('/api/cities', (req, res) => {
  const cities = ['Hioma', 'Kampala', 'Fortportal'];
  res.json(cities);
});

// Create a new ride order
app.post('/api/rides', (req, res) => {
  const { passenger_name, phone, pickup_city, dropoff_city, pickup_location, dropoff_location, ride_time } = req.body;
  if (!passenger_name || !phone || !pickup_city || !dropoff_city || !ride_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const stmt = db.prepare(`INSERT INTO rides (passenger_name, phone, pickup_city, dropoff_city, pickup_location, dropoff_location, ride_time) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run([passenger_name, phone, pickup_city, dropoff_city, pickup_location || null, dropoff_location || null, ride_time], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const rideId = this.lastID;
    // Emit new ride to all connected drivers
    io.emit('new_ride', {
      id: rideId,
      passenger_name,
      phone,
      pickup_city,
      dropoff_city,
      pickup_location: pickup_location || '',
      dropoff_location: dropoff_location || '',
      ride_time
    });
    res.json({ id: rideId, message: 'Ride ordered successfully' });
  });
  stmt.finalize();
});

// Get all rides (for admin/demo)
app.get('/api/rides', (req, res) => {
  db.all(`SELECT * FROM rides ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Accept a ride (driver)
app.post('/api/rides/:id/accept', (req, res) => {
  const rideId = req.params.id;
  const { driver_name } = req.body;
  if (!driver_name) {
    return res.status(400).json({ error: 'Driver name is required' });
  }
  db.run(`UPDATE rides SET driver_name = ?, status = 'accepted' WHERE id = ?`, [driver_name, rideId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    // Emit to the specific ride room: update for customer and driver
    io.to(`ride_${rideId}`).emit('ride_accepted', {
      rideId,
      driver_name,
      status: 'accepted'
    });
    res.json({ message: 'Ride accepted successfully' });
  });
});

// Update ride location (simulated by driver)
app.post('/api/rides/:id/update_location', (req, res) => {
  const rideId = req.params.id;
  const { location } = req.body;
  if (!location) {
    return res.status(400).json({ error: 'Location is required' });
  }
  // Emit location update to the customer of this ride
  io.to(`ride_${rideId}`).emit('location_update', { location });
  res.json({ message: 'Location updated' });
});

// Mark ride as completed
app.post('/api/rides/:id/complete', (req, res) => {
  const rideId = req.params.id;
  db.run(`UPDATE rides SET status = 'completed' WHERE id = ?`, [rideId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    // Emit ride completion to the ride room
    io.to(`ride_${rideId}`).emit('ride_completed', { rideId });
    res.json({ message: 'Ride completed successfully' });
  });
});

// Get a specific ride (for customer to check status)
app.get('/api/rides/:id', (req, res) => {
  const rideId = req.params.id;
  db.get(`SELECT * FROM rides WHERE id = ?`, [rideId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    res.json(row);
  });
});

// Start server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rides for reference (in memory, for MVP)
const activeRides = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // When a client joins, they should emit their role and ride ID if applicable
  socket.on('join_ride', (data) => {
    const { rideId, role } = data;
    if (rideId && role) {
      socket.join(`ride_${rideId}`);
      socket.join(`role_${role}`);
      console.log(`Client joined ride ${rideId} as ${role}`);
    }
  });

  // When a driver updates location (we already have an endpoint, but also can listen for socket event)
  socket.on('driver_location_update', (data) => {
    const { rideId, location } = data;
    // Emit to the customer of this ride
    io.to(`ride_${rideId}`).emit('location_update', { location });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

module.exports = app;
