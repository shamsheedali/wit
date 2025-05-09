# wit – Modern Online Chess Platform

## About

**wit** is a next-generation online chess platform designed for players of all skill levels. Play chess against bots, friends, or global opponents in real-time. Enjoy tournaments, leaderboards, and clubs, with rich social features like in-game chat, global club chat, and seamless authentication via OAuth.

## Features

- ♟️ **Play Chess Online** - Challenge bots, friends, or random global players.
- 🏆 **Tournaments & Leaderboards** - Compete in regular tournaments and climb the global rankings.
- 👥 **Chess Clubs** - Join or create clubs, participate in club activities, and chat with members worldwide.
- 💬 **In-Game & Global Club Chat** - Communicate with opponents during games and connect with the broader chess community.
- 🔒 **OAuth Authentication** - Secure sign-in with Google and other providers.
- ⚡ **Real-Time Gameplay** - Powered by WebSockets for instant move updates and chat.
- 📨 **OTP via Redis** - Secure OTP flows for account verification and password resets.
- 🧑‍💻 **Modern UI/UX** - Built with the latest frontend technologies for a fast, responsive experience.

## Tech Stack

### **Frontend**
- Next.js 15 (TypeScript)
- Tailwind CSS & Radix UI for styling and components
- Zustand & React Query for state management and data fetching
- Chessboard and game logic via chess.js and react-chessboard
- Socket.io-client for real-time features

### **Backend**
- Express.js (TypeScript)
- MongoDB with Mongoose for data storage
- Redis for OTP and caching
- Socket.io for real-time communication
- JWT for authentication
- Cloudinary for image uploads

### **DevOps**
- Docker & Docker Compose for containerized development
- Linting (ESLint) and formatting (Prettier) for code quality

## Project Structure

```
wit/
├── client/        # Frontend (Next.js 15 + TS)
├── server/        # Backend (Express.js + TS)
├── docker-compose.yml
```

## Installation

### Prerequisites

- Node.js (>=18.x)
- Docker & Docker Compose (optional, recommended)
- MongoDB and Redis (can be run via Docker Compose)

### Steps to Run the Project

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/wit.git
   cd wit
   ```

2. **Set up environment variables:**
   - Create `.env` files in both `client/` and `server/` directories.
   - Add MongoDB URI, Redis URI, JWT secret, OAuth credentials, and any other required settings.

3. **Start with Docker (recommended):**
   ```sh
   docker-compose up --build
   ```
   This will spin up the backend, frontend, MongoDB, and Redis containers.

   **OR**

   **Manual Start (for development):**

   - **Backend:**
     ```sh
     cd server
     npm install
     npm run dev
     ```
   - **Frontend:**
     ```sh
     cd client
     npm install
     npm run dev
     ```

4. **Linting & Formatting:**
   - **Frontend:**  
     ```sh
     npm run lint
     ```
   - **Backend:**  
     ```sh
     npm run lint
     npm run format
     ```

5. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000) (default ports, configurable)

## Example `.env` (Backend)

```
MONGODB_URI=mongodb://localhost:27017/wit
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_URL=your_cloudinary_url
```

## Scripts

| Location   | Script          | Purpose                    |
|------------|-----------------|----------------------------|
| client     | `npm run dev`   | Start frontend (Next.js)   |
| client     | `npm run lint`  | Lint frontend code         |
| server     | `npm run dev`   | Start backend (Express.js) |
| server     | `npm run lint`  | Lint backend code          |
| server     | `npm run format`| Format backend code        |

## Contact

📧 Email: shamsheedali0786@gmail.com
📌 GitHub: [shamsheedali](https://github.com/shamsheedali)

---

**wit** - Play chess your way. Challenge, connect, and compete.
