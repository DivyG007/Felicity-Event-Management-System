const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const setupSocket = require('./socket');
const User = require('./models/User');

// Load env vars
dotenv.config();

const ensureAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin bootstrap');
      return;
    }

    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      existingAdmin.email = adminEmail.toLowerCase();
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      console.log(`Admin updated successfully: ${existingAdmin.email}`);
      return;
    }

    const admin = await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
    });

    console.log(`Admin created successfully: ${admin.email}`);
  } catch (error) {
    console.error('Admin bootstrap failed:', error.message);
  }
};

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});
setupSocket(io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/organizers', require('./routes/organizers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/feedback', require('./routes/feedback'));

// Root route (Render base URL check)
app.get('/', (req, res) => {
  res.json({
    message: 'Felicity backend is running',
    health: '/api/health',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await ensureAdminUser();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
