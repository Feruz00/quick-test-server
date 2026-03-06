# Quick Test – Server

Backend API for the **Quick Test real-time competition platform**.

This server provides:

- REST API for managing users, events, and questions
- Real-time communication with **Socket.IO**
- Authentication and authorization
- Event management system
- Live competition result tracking

---

# 🚀 Features

- User authentication (JWT)
- Role-based access control
- Event creation and management
- Question management
- Real-time competition with **Socket.IO**
- Leaderboard tracking
- QR join system
- Redis adapter support for scalable sockets
- MySQL database using **Sequelize ORM**

---

# 🛠 Tech Stack

| Technology | Purpose                 |
| ---------- | ----------------------- |
| Node.js    | Runtime                 |
| Express.js | API framework           |
| MySQL      | Database                |
| Sequelize  | ORM                     |
| Socket.IO  | Real-time communication |
| Redis      | Socket scaling          |
| UUID       | Join code generation    |
| Day.js     | Date handling           |
| Multer     | File uploads            |

---

# 📂 Project Structure

```id="s1srvstruct"
server
│
├── controllers
│   ├── authController.js
│   ├── eventController.js
│   ├── questionController.js
│   └── userController.js
│
├── models
│   ├── index.js
│   ├── User.js
│   ├── Event.js
│   ├── Question.js
│   └── Participant.js
│
├── routes
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── questionRoutes.js
│   └── userRoutes.js
│
├── middlewares
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── catchAsync.js
│
├── sockets
│   └── socket.js
│
├── utils
│   ├── redis.js
│   └── helpers.js
│
├── config
│   └── database.js
│
├── app.js
└── server.js
```

---

# ⚙️ Environment Variables

Create `.env` file in the root directory.

```id="envvarsserver"
NODE_ENV=development

PORT=5000

DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=password
DATABASE_NAME=quick_test

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=30d

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

# 📦 Installation

Install dependencies:

```id="installserver"
npm install
```

---

# ▶️ Run Development Server

```id="devserverrun"
npm run dev
```

Server runs on:

```id="serverport"
http://localhost:5000
```

---

# 🏗 Production Build

Start production server:

```id="prodstart"
npm start
```

---

# 🔐 Authentication

The API uses **JWT authentication**.

Login request example:

```id="loginreq"
POST /api/auth/login
```

Response:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

Protected routes require:

```
Authorization: Bearer <token>
```

---

# 👥 User Roles

Supported roles:

- **admin** – full system access
- **manager** – event management
- **user** – competition participant

---

# 📡 Real-time Communication

The platform uses **Socket.IO** for:

- Player join events
- Answer submissions
- Live leaderboard updates
- Event finish notifications

Example socket initialization:

```javascript id="socketinit"
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
```

---

# 🏁 Event System

Managers can:

- Create competitions
- Add questions
- Generate join codes
- Start and stop events
- Monitor live participants

Each event contains:

- questions
- participants
- leaderboard
- join code

---

# 🔗 Join Competition

Participants join competitions using:

```
/join/:joinCode
```

Join codes are generated using **UUID**.

Example:

```
550e8400-e29b-41d4-a716-446655440000
```

---

# 🏆 Leaderboard Logic

Leaderboard ranking:

1️⃣ Highest score
2️⃣ Lowest total answer time

Sorting example:

```javascript id="leaderboardsort"
participants.sort(
  (a, b) => (b.score || 0) - (a.score || 0) || a.timeSpent - b.timeSpent
);
```

---

# 🗄 Database

Main tables:

| Table        | Description        |
| ------------ | ------------------ |
| users        | platform users     |
| events       | competitions       |
| questions    | event questions    |
| participants | event participants |

---

# 🔄 Migrations & Seeders

Run migrations:

```id="runmigrate"
npx sequelize db:migrate
```

Run seeders:

```id="runseed"
npx sequelize db:seed:all
```

---

# 🧪 API Base URL

```
/api
```

Example endpoints:

```
POST   /api/auth/login
GET    /api/users
POST   /api/events
GET    /api/events/:id
POST   /api/questions
```

---

# 🧹 Error Handling

Centralized error handling middleware is used:

```javascript id="errorhandle"
app.use(errorMiddleware);
```

---

# 📄 License

MIT License

---

# 👤 Author

Feruz Atamyradow
