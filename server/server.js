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

// Connections

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',           
    'https://iskonnect.vercel.app',     
    'https://iskonnect.vercel.app/'    
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,                   // if using cookies/sessions
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

// Test Connection for postgre
sequelize.authenticate()
     .then(() => console.log('PostgreSQL connected'))
     .catch(err => console.log('DB connection error:', err));

// Sync database models
sequelize.sync({ alter: true })
     .then(() => console.log('Database synced successfully'))
     .catch(err => console.log('Database sync error:', err));

app.get('/', (req, res) => {
     res.send('SocialFeed API with PostgreSQL working');
});

app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
});
