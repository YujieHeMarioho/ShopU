// index.js
import express from 'express';
import { createServer } from 'http';           // <-- NEW: We'll create our own HTTP server
import { Server } from 'socket.io';           // <-- NEW: Socket.IO server
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import authMiddleware from './middleware/auth.js'; 

// import routes
import favoritesRoutes from './routes/favorites.js';
import userRoutes from './routes/users.js';
import friendsRoutes from './routes/friends.js';
import communityRoutes from './routes/communities.js'
import privacyPolicies from './routes/privacyPolicies.js';
import feed from './routes/feed.js';
import listings from './routes/listings.js';
import filters from './routes/filters.js';
import messagesRoutes from './routes/messages.js';
import conversationsRoutes from './routes/conversations.js';

dotenv.config();

if (!(process.env.PORT && process.env.CLIENT_ORIGIN_URL)) {
  throw new Error("Missing required environment variables.");
}

const { Pool } = pkg;
const app = express();
const port = parseInt(process.env.PORT, 10);

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN_URL,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type']
  })
);
app.use(bodyParser.json());

// Basic Test Routes
app.get('/', (req, res) => {
  res.send('Hello from backend! V1');
});

app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users;');
    res.status(200).json({ success: true, timestamp: result.rows });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error getting users', error });
  }
});

// Routes that do NOT require auth
app.use('/api', feed);

// enforce auth on all subsequent endpoints
app.use(authMiddleware);

// Authenticated routes
app.use('/api', favoritesRoutes);
app.use('/api', communityRoutes);
app.use('/api', userRoutes);
app.use('/api', friendsRoutes);
app.use('/api', privacyPolicies);
app.use('/api', listings);
app.use('/api', filters);
app.use('/api/messages', messagesRoutes);

app.use('/api/conversations', (req, res, next) => {
  console.log('Conversations route hit');
  next();
}, conversationsRoutes);

// 1) Create an HTTP server from your Express app
const server = createServer(app);

// 2) Create a Socket.IO instance, attach to server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN_URL,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// 3) Listen for socket connections
io.on('connection', (socket) => {
  console.log('A user connected with socket ID:', socket.id);

  // Here you can listen for clients joining a conversation "room"
  // so you only emit new messages to people in that conversation.
  socket.on('joinConversation', (conversationId) => {
    console.log(`Socket ${socket.id} joining room: ${conversationId}`);
    socket.join(conversationId); 
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// 4) Make `io` accessible in routes/controllers via app.set/get
app.set('io', io);

// Start the server on the specified port
server.listen(port, () => {
  console.log(`Server is running on ${process.env.BACKEND_URL}`);
});

export { pool };  // <-- So we can import this from other files
