<h1 align="center">✨ Friendify - Connect, Chat & Video Call ✨</h1>

![Demo App](/frontend/public/screenshot-for-readme.png)

Friendify is a modern language exchange and social connection platform where users can discover partners, exchange messages in real-time, and make video calls.

### Highlights:

- 📹 **Video Calling**: Seamless 1-on-1 video calls powered by Stream Video SDK with an in-app media fallback. Start calls directly from chat or friend cards.
- 🎨 **Reliable Avatar Generator**: Powered by Dicebear with multiple art styles (avataaars, bottts, adventurer, lorelei) and intelligent image error fallback.
- 💾 **Dual-Mode Database Architecture**: Works seamlessly with real MongoDB if connected; automatically falls back to a built-in Temporary In-Memory Database if MongoDB is offline or not configured.
- 💬 **Real-time Messaging**: Instant chat with reactions, media support, and active call detection.
- 🌍 **Language Exchange**: Match with learners by native and learning languages.
- 🎨 **32 DaisyUI Themes**: Custom theme switcher saved across sessions.
- 🔐 **JWT Authentication & Protected Routes**: Secure cookies and route guards.

---

## 🧪 .env Setup

### Backend (`/backend`)

```env
PORT=8001
# Optional: If omitted or DB is offline, Friendify runs in In-Memory Temp DB mode!
MONGO_URI=your_mongo_uri
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
JWT_SECRET_KEY=your_jwt_secret
NODE_ENV=development
```

### Frontend (`/frontend`)

```env
VITE_STREAM_API_KEY=your_stream_api_key
VITE_API_URL=http://localhost:8001/api/v1
```

---

## 🔧 Run the Backend

```bash
cd backend
npm install
npm run dev
```

## 💻 Run the Frontend

```bash
cd frontend
npm install
npm run dev
```
