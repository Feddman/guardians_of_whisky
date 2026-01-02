# Guardians of Whisky 🥃

A real-time collaborative whisky tasting companion app with gamification features.

## Features

- **Tasting Sessions**: Create and manage whisky tasting sessions with date and location tracking
- **Real-time Collaboration**: WebSocket-based synchronization so everyone sees updates instantly
- **Interactive Rating**: Mobile-friendly interface for rating color, nose, palate, finish, and overall experience
- **Gamification**: Earn points when team members match ratings (color, flavor notes, overall rating)
- **Whisky Reveal**: Animated reveal of whisky identity after tasting
- **History & Comparison**: View past sessions and compare collective tasting data

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **Storage**: JSON file-based (easily upgradeable to a database)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install:all
```

### Running the Application

Start both the server and client in development mode:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend Next.js app on `http://localhost:3000`

### Individual Commands

- Start only the backend: `npm run dev:server`
- Start only the frontend: `npm run dev:client`
- Build for production: `npm run build`

## Usage

1. **Create a Session**: Click "Start New Session" and enter the date and location
2. **Join a Session**: Open the session link on multiple devices/browsers to simulate multiple participants
3. **Add Whisky**: Click "Add Whisky" to start tasting a new whisky
4. **Rate the Whisky**: Fill out the tasting form with color, nose, palate, finish, and flavor notes
5. **Reveal**: Once everyone has rated, click "Reveal Whisky" to see the whisky name with animation
6. **View History**: Check past sessions and compare ratings

## Project Structure

```
guardians_of_whiskey/
├── server/
│   └── index.js          # Express server with Socket.io
├── client/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Home page
│   │   ├── session/      # Session pages
│   │   └── history/      # History page
│   ├── components/       # React components
│   │   ├── TastingInterface.tsx
│   │   ├── WhiskyReveal.tsx
│   │   └── SessionHeader.tsx
│   └── lib/              # Utilities
│       └── socket.ts     # Socket.io client
└── data/                 # JSON data storage (created automatically)
```

## API Endpoints

- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get a specific session
- `POST /api/sessions` - Create a new session
- `POST /api/sessions/:id/whisky` - Add a whisky to a session
- `POST /api/sessions/:sessionId/whisky/:whiskyId/rate` - Submit a rating
- `POST /api/sessions/:sessionId/whisky/:whiskyId/reveal` - Reveal a whisky

## WebSocket Events

- `join:session` - Join a tasting session room
- `whisky:added` - New whisky added to session
- `rating:updated` - Rating submitted/updated
- `whisky:revealed` - Whisky identity revealed

## Gamification

Points are awarded when multiple participants:
- Match the same color rating
- Match the same overall star rating
- Select the same flavor notes

Points accumulate throughout the session and are displayed in the session header.

## Future Enhancements

- Series management (group sessions into series)
- Database integration (PostgreSQL, MongoDB, etc.)
- User authentication
- Export tasting notes
- Advanced statistics and comparisons
- Photo uploads for whisky labels

## License

MIT

