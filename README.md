# Iskonnect - Social Feed Platform

A full-stack social media application built with React, Express.js, and PostgreSQL. Connect with friends, share posts, send messages, and discover new content in a modern, responsive web platform.

## 🌟 Features

### Core Social Features
- **User Authentication & Profiles**: Secure registration and login with JWT authentication
- **Feed & Posts**: Create, edit, delete, and view posts with image uploads
- **Social Interactions**: Like, comment, share, and save posts
- **Follow System**: Follow/unfollow users to customize your feed
- **User Profiles**: Public and private user profiles with bio, avatar, and follower stats

### Messaging & Connectivity
- **Direct Messaging**: Send 1-on-1 messages with real-time updates
- **Group Chats**: Create and manage group conversations
- **Message Replies**: Quote or reply to specific messages
- **User Avatars**: Display avatar in chat threads
- **Group Settings**: Manage group members and settings

### Discovery & Search
- **Search**: Find posts and users across the platform
- **Discover Page**: Explore suggested users and trending content
- **Friends List**: View and manage your connections
- **Notifications**: Get real-time updates on interactions

### Additional Features
- **Image Uploads**: Integrated with ImageKit for fast, optimized image delivery
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Mobile Navigation**: Optimized mobile sidebar and header
- **Time Formatting**: Smart relative timestamps (e.g., "2 hours ago")
- **System Messages**: Track group chat events

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **ImageKit** - Image optimization and hosting

### Backend
- **Express.js** - Web framework
- **Sequelize** - ORM for database management
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling

### DevTools
- **React Scripts** - Build tools for React
- **Nodemon** - Auto-reload server during development
- **Sequelize CLI** - Database migrations

## 📁 Project Structure

```
socialfeed/
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── Avatar.jsx          # User avatar component
│   │   │   ├── CreatePostForm.jsx  # Post creation form
│   │   │   ├── CommentThread.jsx   # Comment display
│   │   │   ├── MessageActions.jsx  # Message context menu
│   │   │   ├── Sidebar.jsx         # Desktop sidebar
│   │   │   ├── MobileSidebar.jsx   # Mobile sidebar
│   │   │   ├── MobileHeader.jsx    # Mobile header
│   │   │   ├── ui/                 # UI primitives
│   │   │   └── ...other components
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Auth state management
│   │   ├── pages/                   # Page components
│   │   │   ├── FeedPage.jsx        # Main feed
│   │   │   ├── ChatPage.jsx        # Messages & chat
│   │   │   ├── ProfilePage.jsx     # User profile
│   │   │   ├── MessagesPage.jsx    # Conversations list
│   │   │   ├── SearchPage.jsx      # Search results
│   │   │   ├── DiscoverPage.jsx    # Discovery
│   │   │   ├── FriendsPage.jsx     # Friends list
│   │   │   └── ...other pages
│   │   ├── lib/
│   │   │   ├── api.js              # Axios instance & API
│   │   │   ├── imagekit.js         # ImageKit config
│   │   │   └── utils.js            # Utility functions
│   │   ├── utils/
│   │   │   └── formatTimeAgo.js    # Time formatting
│   │   ├── styles/                  # CSS files
│   │   └── App.jsx                 # Root component
│   └── package.json
│
├── server/                          # Express Backend
│   ├── config/
│   │   └── database.js             # Sequelize config
│   ├── models/                      # Database models
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Post.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── Like.js
│   │   ├── Follow.js
│   │   └── Participant.js
│   ├── routes/                      # API routes
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── messages.js
│   │   ├── comments.js
│   │   ├── likes.js
│   │   ├── follows.js
│   │   ├── profile.js
│   │   ├── search.js
│   │   ├── upload.js
│   │   └── ...other routes
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication
│   ├── migrations/                  # Database migrations
│   ├── server.js                    # Entry point
│   └── package.json
│
├── docs/
│   └── er-diagram.mmd              # Database ER diagram
└── README.md                        # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **ImageKit Account** (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd socialfeed
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Environment Setup

1. **Create `.env` file in the `server` directory**
   ```env
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/socialfeed
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   
   # ImageKit credentials
   IMAGEKIT_PUBLIC_KEY=your-public-key
   IMAGEKIT_PRIVATE_KEY=your-private-key
   IMAGEKIT_URL_ENDPOINT=your-url-endpoint
   
   # CORS settings
   CLIENT_URL=http://localhost:3000
   ```

2. **Create `.env` file in the `client` directory** (optional)
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000
   ```

### Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb socialfeed
   ```

2. **Run migrations**
   ```bash
   cd server
   npx sequelize-cli db:migrate
   ```

## 💻 Running the Application

### Development Mode

**Terminal 1 - Start the backend server:**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 - Start the frontend development server:**
```bash
cd client
npm start
```
Frontend runs on `http://localhost:3000`

### Production Build

**Build the frontend:**
```bash
cd client
npm run build
```

**Start the server:**
```bash
cd server
npm start
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts (feed)
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/:id` - Get single post

### Likes
- `POST /api/likes` - Like a post
- `DELETE /api/likes/:postId` - Unlike a post

### Comments
- `GET /api/comments/:postId` - Get comments for post
- `POST /api/comments` - Create comment
- `DELETE /api/comments/:id` - Delete comment

### Messages
- `GET /api/messages` - Get conversations list
- `GET /api/messages/:conversationId` - Get messages in conversation
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/groups` - Create group chat

### Follows
- `POST /api/follows` - Follow user
- `DELETE /api/follows/:userId` - Unfollow user
- `GET /api/follows/suggestions` - Get suggested users

### Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/users/:id` - Get user by ID

### Search
- `GET /api/search?q=query` - Search posts and users

### Other
- `GET /api/notifications` - Get notifications
- `POST /api/saves` - Save post
- `DELETE /api/saves/:postId` - Unsave post

## 🎨 UI Components

Key reusable components in `client/src/components/ui/`:
- **Button** - Customizable button with variants
- **Input** - Text input field
- **Avatar** - User avatar display

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are issued on login and stored in local storage
- All protected routes require a valid token in the Authorization header
- Passwords are hashed using bcrypt before storage

## 📱 Mobile Responsiveness

The application is fully responsive with:
- **Mobile Sidebar**: Collapsible navigation on small screens
- **Mobile Header**: Compact header for mobile devices
- **Tailwind Breakpoints**: Responsive design using sm, md, lg, xl breakpoints
- **Touch-Friendly UI**: Optimized buttons and spacing for mobile

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5000 (backend)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Find and kill process on port 3000 (frontend)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists: `createdb socialfeed`

### CORS Errors
- Check CLIENT_URL in server `.env`
- Verify CORS origin matches frontend URL
- Clear browser cache

### ImageKit Issues
- Verify ImageKit credentials in `.env`
- Check image upload file size limits
- Ensure ImageKit account is active

## 📚 Additional Documentation

- **ER Diagram**: See `docs/er-diagram.mmd` for database schema
- **Migrations**: Database schema versions in `server/migrations/`

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

Reviman G. Ocasion
BSIT

## 🎯 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Video uploads and streaming
- [ ] Story feature (disappearing posts)
- [ ] Direct message encryption
- [ ] User verification badges
- [ ] Advanced search filters
- [ ] Post scheduling
- [ ] Analytics dashboard
- [ ] Dark mode
- [ ] Internationalization (i18n)

---

**Happy coding! 🚀**
