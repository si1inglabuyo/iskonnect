// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authenticate = require('./middleware/auth');

// Import models to ensure they're registered with Sequelize
const User = require('./models/User');
const Profile = require('./models/Profile');
const Conversation = require('./models/Conversation');
const Participant = require('./models/Participant');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;


/* 
//app.use(cors());
//for testing
 app.use(cors({
  origin: "http://192.168.0.35:3000",
  credentials: true
})); 

*/
const allowedOrigins = [
  'https://iskonnect-c11v-kc3l78h8t-revis-projects-66c84ce6.vercel.app', // your Vercel URL
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/likes', authenticate, require('./routes/likes'));
app.use('/api/follows', authenticate, require('./routes/follows'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/users', authenticate, require('./routes/users'));
app.use('/api/notifications', authenticate, require('./routes/notifications'));
app.use('/api/comments', authenticate, require('./routes/comments'));
app.use('/api/conversations', authenticate, require('./routes/messages'));
app.use('/api/search', authenticate, require('./routes/search'));
app.use('/api/saves', authenticate, require('./routes/saves'));
app.use('/api/messages', authenticate, require('./routes/messages'));
app.use('/api/friends', authenticate, require('./routes/friends'));

// Database connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.log('DB connection error:', err));

// Sync models (use { alter: true } carefully in production)
sequelize.sync({ alter: true })
  .then(() => console.log('Database synced successfully'))
  .catch(err => console.log('Database sync error:', err));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('SocialFeed API with PostgreSQL working');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});