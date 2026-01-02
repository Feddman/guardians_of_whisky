const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SERIES_FILE = path.join(DATA_DIR, 'series.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(SESSIONS_FILE);
    } catch {
      await fs.writeFile(SESSIONS_FILE, JSON.stringify([]));
    }
    try {
      await fs.access(SERIES_FILE);
    } catch {
      await fs.writeFile(SERIES_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error setting up data directory:', error);
  }
}

// Data access functions
async function getSessions() {
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSessions(sessions) {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

async function getSeries() {
  try {
    const data = await fs.readFile(SERIES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSeries(series) {
  await fs.writeFile(SERIES_FILE, JSON.stringify(series, null, 2));
}

// Generate a unique 4-letter code
async function generateSessionCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O to avoid confusion
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += letters[Math.floor(Math.random() * letters.length)];
    }
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique session code');
    }
  } while (await isCodeTaken(code));
  
  return code;
}

async function isCodeTaken(code) {
  const sessions = await getSessions();
  return sessions.some(s => s.code === code);
}

// Calculate points for matching ratings and return breakdown
function calculatePoints(ratings) {
  if (ratings.length < 2) return { total: 0, breakdown: [] };

  let totalPoints = 0;
  const breakdown = [];

  // Check aroma intensity matches
  const intensityCounts = {};
  const intensityParticipants = {};
  ratings.forEach(r => {
    if (r.aromaIntensity !== undefined) {
      const key = `Intensiteit ${r.aromaIntensity}`;
      if (!intensityCounts[key]) {
        intensityCounts[key] = 0;
        intensityParticipants[key] = [];
      }
      intensityCounts[key] = (intensityCounts[key] || 0) + 1;
      intensityParticipants[key].push(r.participantName || 'Anonymous');
    }
  });
  Object.entries(intensityCounts).forEach(([intensity, count]) => {
    if (count > 1) {
      const points = count * 10;
      totalPoints += points;
      breakdown.push({
        category: 'Aroma Intensiteit',
        value: intensity,
        matches: count,
        points: points,
        matchedParticipants: intensityParticipants[intensity] || []
      });
    }
  });

  // Check aroma smokiness matches
  const smokinessCounts = {};
  const smokinessParticipants = {};
  ratings.forEach(r => {
    if (r.aromaSmokiness !== undefined) {
      const key = `Rokerigheid ${r.aromaSmokiness}`;
      if (!smokinessCounts[key]) {
        smokinessCounts[key] = 0;
        smokinessParticipants[key] = [];
      }
      smokinessCounts[key] = (smokinessCounts[key] || 0) + 1;
      smokinessParticipants[key].push(r.participantName || 'Anonymous');
    }
  });
  Object.entries(smokinessCounts).forEach(([smokiness, count]) => {
    if (count > 1) {
      const points = count * 10;
      totalPoints += points;
      breakdown.push({
        category: 'Aroma Rokerigheid',
        value: smokiness,
        matches: count,
        points: points,
        matchedParticipants: smokinessParticipants[smokiness] || []
      });
    }
  });

  // Check aroma sweetness matches
  const sweetnessCounts = {};
  const sweetnessParticipants = {};
  ratings.forEach(r => {
    if (r.aromaSweetness !== undefined) {
      const key = `Zoetheid ${r.aromaSweetness}`;
      if (!sweetnessCounts[key]) {
        sweetnessCounts[key] = 0;
        sweetnessParticipants[key] = [];
      }
      sweetnessCounts[key] = (sweetnessCounts[key] || 0) + 1;
      sweetnessParticipants[key].push(r.participantName || 'Anonymous');
    }
  });
  Object.entries(sweetnessCounts).forEach(([sweetness, count]) => {
    if (count > 1) {
      const points = count * 10;
      totalPoints += points;
      breakdown.push({
        category: 'Aroma Zoetheid',
        value: sweetness,
        matches: count,
        points: points,
        matchedParticipants: sweetnessParticipants[sweetness] || []
      });
    }
  });

  // Check color matches (max 1 per person)
  const colorCounts = {};
  const colorParticipants = {};
  ratings.forEach(r => {
    if (r.color) {
      if (!colorCounts[r.color]) {
        colorCounts[r.color] = 0;
        colorParticipants[r.color] = [];
      }
      colorCounts[r.color] = (colorCounts[r.color] || 0) + 1;
      colorParticipants[r.color].push(r.participantName || 'Anonymous');
    }
  });
  Object.entries(colorCounts).forEach(([color, count]) => {
    if (count > 1) {
      const points = count * 10; // 10 points per matching person
      totalPoints += points;
      breakdown.push({
        category: 'Kleur',
        value: color,
        matches: count,
        points: points,
        matchedParticipants: colorParticipants[color] || []
      });
    }
  });

  // Check flavor note matches (max 3 per person)
  const noteCounts = {};
  const noteParticipants = {};
  ratings.forEach(r => {
    if (r.flavorNotes && Array.isArray(r.flavorNotes)) {
      r.flavorNotes.forEach(note => {
        if (!noteCounts[note]) {
          noteCounts[note] = 0;
          noteParticipants[note] = [];
        }
        noteCounts[note] = (noteCounts[note] || 0) + 1;
        if (!noteParticipants[note].includes(r.participantName || 'Anonymous')) {
          noteParticipants[note].push(r.participantName || 'Anonymous');
        }
      });
    }
  });
  Object.entries(noteCounts).forEach(([note, count]) => {
    if (count > 1) {
      const points = count * 10; // 10 points per matching person
      totalPoints += points;
      breakdown.push({
        category: 'Smaakbeleving',
        value: note,
        matches: count,
        points: points,
        matchedParticipants: noteParticipants[note] || []
      });
    }
  });

  return { total: totalPoints, breakdown };
}

// API Routes
app.get('/api/sessions', async (req, res) => {
  const sessions = await getSessions();
  res.json(sessions);
});

app.get('/api/sessions/:id', async (req, res) => {
  const sessions = await getSessions();
  // Try to find by code first (4 letters), then by ID
  const session = sessions.find(s => 
    s.code === req.params.id.toUpperCase() || s.id === req.params.id
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  // Ensure whiskies is always an array
  if (!session.whiskies) {
    session.whiskies = [];
  }
  res.json(session);
});

app.get('/api/sessions/code/:code', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => s.code === req.params.code.toUpperCase());
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

app.post('/api/sessions', async (req, res) => {
  try {
    const sessions = await getSessions();
    const code = await generateSessionCode();
    const newSession = {
      id: uuidv4(),
      code: code,
      date: req.body.date || new Date().toISOString(),
      location: req.body.location || '',
      seriesId: req.body.seriesId || null,
      creatorId: req.body.creatorId || null,
      maxFlavorNotes: req.body.maxFlavorNotes || 3,
      whiskies: [],
      participants: [],
      revealedWhiskies: [],
      activeWhiskyId: null,
      totalPoints: 0,
      createdAt: new Date().toISOString()
    };
    sessions.push(newSession);
    await saveSessions(sessions);
    io.emit('session:created', newSession);
    res.json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/sessions/:id/whisky', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => 
    s.code === req.params.id.toUpperCase() || s.id === req.params.id
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const whisky = {
    id: uuidv4(),
    name: req.body.name || 'Unknown Whisky',
    years: req.body.years || '',
    type: req.body.type || '',
    region: req.body.region || '',
    description: req.body.description || '',
    image: req.body.image || '',
    revealed: false,
    ratings: []
  };
  
  session.whiskies.push(whisky);
  await saveSessions(sessions);
  // Use session ID for WebSocket room
  io.to(session.id).emit('whisky:added', whisky);
  res.json(whisky);
});

app.post('/api/sessions/:sessionId/whisky/:whiskyId/rate', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => 
    s.code === req.params.sessionId.toUpperCase() || s.id === req.params.sessionId
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const whisky = session.whiskies.find(w => w.id === req.params.whiskyId);
  if (!whisky) {
    return res.status(404).json({ error: 'Whisky not found' });
  }
  
  const rating = {
    id: uuidv4(),
    participantId: req.body.participantId || uuidv4(),
    participantName: req.body.participantName || 'Anonymous',
    color: req.body.color,
    nose: req.body.nose,
    palate: req.body.palate,
    finish: req.body.finish,
    overall: req.body.overall,
    flavorNotes: req.body.flavorNotes || [],
    timestamp: new Date().toISOString()
  };
  
  // Remove existing rating from same participant
  whisky.ratings = whisky.ratings.filter(r => r.participantId !== rating.participantId);
  whisky.ratings.push(rating);
  
  // Don't calculate points here - only calculate on reveal
  await saveSessions(sessions);
  // Use session ID for WebSocket room
  io.to(session.id).emit('rating:updated', {
    whiskyId: req.params.whiskyId,
    rating,
    totalPoints: session.totalPoints || 0
  });
  
  res.json({ rating, totalPoints: session.totalPoints || 0 });
});

app.post('/api/sessions/:sessionId/whisky/:whiskyId/activate', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => 
    s.code === req.params.sessionId.toUpperCase() || s.id === req.params.sessionId
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Check if user is the creator
  if (session.creatorId && session.creatorId !== req.body.participantId) {
    return res.status(403).json({ error: 'Only the session creator can activate whiskies' });
  }
  
  const whisky = session.whiskies.find(w => w.id === req.params.whiskyId);
  if (!whisky) {
    return res.status(404).json({ error: 'Whisky not found' });
  }
  
  // Don't allow activating already revealed whiskies
  if (whisky.revealed) {
    return res.status(400).json({ error: 'Cannot activate an already revealed whisky' });
  }
  
  session.activeWhiskyId = req.params.whiskyId;
  await saveSessions(sessions);
  
  // Use session ID for WebSocket room
  io.to(session.id).emit('whisky:activated', {
    whiskyId: req.params.whiskyId,
    whisky
  });
  
  res.json({ activeWhiskyId: session.activeWhiskyId });
});

app.post('/api/sessions/:sessionId/whisky/:whiskyId/cancel', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => 
    s.code === req.params.sessionId.toUpperCase() || s.id === req.params.sessionId
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Check if user is the creator
  if (session.creatorId && session.creatorId !== req.body.participantId) {
    return res.status(403).json({ error: 'Only the session creator can cancel whiskies' });
  }
  
  const whisky = session.whiskies.find(w => w.id === req.params.whiskyId);
  if (!whisky) {
    return res.status(404).json({ error: 'Whisky not found' });
  }
  
  // Don't allow canceling already revealed whiskies
  if (whisky.revealed) {
    return res.status(400).json({ error: 'Cannot cancel an already revealed whisky' });
  }
  
  // Clear all ratings for this whisky
  whisky.ratings = [];
  
  // Deactivate the whisky if it's currently active
  if (session.activeWhiskyId === req.params.whiskyId) {
    session.activeWhiskyId = null;
  }
  
  await saveSessions(sessions);
  
  // Use session ID for WebSocket room
  io.to(session.id).emit('whisky:cancelled', {
    whiskyId: req.params.whiskyId,
    whisky
  });
  
  res.json({ success: true, whisky });
});

app.post('/api/sessions/:sessionId/whisky/:whiskyId/reveal', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => 
    s.code === req.params.sessionId.toUpperCase() || s.id === req.params.sessionId
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Check if user is the creator
  if (session.creatorId && session.creatorId !== req.body.participantId) {
    return res.status(403).json({ error: 'Only the session creator can reveal whiskies' });
  }
  
  const whisky = session.whiskies.find(w => w.id === req.params.whiskyId);
  if (!whisky) {
    return res.status(404).json({ error: 'Whisky not found' });
  }
  
  whisky.revealed = true;
  if (!session.revealedWhiskies.includes(req.params.whiskyId)) {
    session.revealedWhiskies.push(req.params.whiskyId);
  }
  
  // Calculate points only when revealing (based on matching ratings, not star ratings)
  const pointsResult = calculatePoints(whisky.ratings);
  const whiskyPoints = pointsResult.total;
  whisky.points = whiskyPoints;
  whisky.pointsBreakdown = pointsResult.breakdown;
  
  // Add points to total (only count once per whisky)
  if (!whisky.pointsCalculated) {
    session.totalPoints = (session.totalPoints || 0) + whiskyPoints;
    whisky.pointsCalculated = true;
  }
  
  // Clear active whisky if this was the active one
  if (session.activeWhiskyId === req.params.whiskyId) {
    session.activeWhiskyId = null;
  }
  
  await saveSessions(sessions);
  // Use session ID for WebSocket room
  io.to(session.id).emit('whisky:revealed', {
    whiskyId: req.params.whiskyId,
    whisky,
    whiskyPoints: whiskyPoints,
    totalPoints: session.totalPoints,
    pointsBreakdown: pointsResult.breakdown
  });
  
  res.json({ whisky, whiskyPoints, totalPoints: session.totalPoints, pointsBreakdown: pointsResult.breakdown });
});

app.post('/api/sessions/:sessionId/participants/:participantId/kick', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => 
    s.code === req.params.sessionId.toUpperCase() || s.id === req.params.sessionId
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Check if requester is the creator
  const requesterId = req.body.participantId;
  if (session.creatorId && session.creatorId !== requesterId) {
    return res.status(403).json({ error: 'Only the session creator can kick participants' });
  }
  
  const kickedParticipantId = req.params.participantId;
  
  // Don't allow kicking the creator
  if (kickedParticipantId === session.creatorId) {
    return res.status(400).json({ error: 'Cannot kick the session creator' });
  }
  
  // Don't allow kicking yourself
  if (kickedParticipantId === requesterId) {
    return res.status(400).json({ error: 'Cannot kick yourself' });
  }
  
  // Remove participant from active participants
  if (activeParticipants.has(session.id)) {
    const sessionParticipants = activeParticipants.get(session.id);
    const kickedParticipant = sessionParticipants.get(kickedParticipantId);
    
    if (kickedParticipant) {
      // Get the socket ID to disconnect them
      const socketId = kickedParticipant.socketId;
      
      // Remove from active participants
      sessionParticipants.delete(kickedParticipantId);
      
      // Emit kick event to all participants in the session
      io.to(session.id).emit('participant:kicked', { 
        participantId: kickedParticipantId,
        reason: 'Kicked by creator'
      });
      
      // Disconnect the kicked participant's socket
      if (socketId) {
        const kickedSocket = io.sockets.sockets.get(socketId);
        if (kickedSocket) {
          kickedSocket.disconnect(true);
        }
      }
    }
  }
  
  res.json({ success: true, kickedParticipantId });
});

app.patch('/api/sessions/:sessionId/settings', async (req, res) => {
  const sessions = await getSessions();
  const session = sessions.find(s => 
    s.code === req.params.sessionId.toUpperCase() || s.id === req.params.sessionId
  );
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Check if user is the creator
  if (session.creatorId && !req.body.participantId) {
    // We'll need to pass participantId in the request body or check via session
    // For now, we'll allow if no creatorId is set, or check via a different method
  }
  
  // Update maxFlavorNotes if provided
  if (req.body.maxFlavorNotes !== undefined) {
    session.maxFlavorNotes = req.body.maxFlavorNotes;
  }
  
  await saveSessions(sessions);
  
  // Emit update to all clients
  io.to(session.id).emit('session:updated', session);
  
  res.json(session);
});

app.get('/api/series', async (req, res) => {
  const series = await getSeries();
  res.json(series);
});

app.post('/api/series', async (req, res) => {
  const series = await getSeries();
  const newSeries = {
    id: uuidv4(),
    name: req.body.name || 'New Series',
    description: req.body.description || '',
    createdAt: new Date().toISOString()
  };
  series.push(newSeries);
  await saveSeries(series);
  res.json(newSeries);
});

// Store active participants per session
const activeParticipants = new Map();
// Track toast button presses for synchronized celebration (shared across all connections)
const toastPresses = new Map(); // sessionId -> { participantId -> timestamp }

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join:session', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session ${sessionId}`);
  });

  socket.on('participant:join', async (data) => {
    const { sessionId, participant } = data;
    
    if (!activeParticipants.has(sessionId)) {
      activeParticipants.set(sessionId, new Map());
    }
    
    const sessionParticipants = activeParticipants.get(sessionId);
    // Store socket ID with participant for cleanup on disconnect
    sessionParticipants.set(participant.id, { ...participant, socketId: socket.id });
    
    // Notify all clients in the session
    io.to(sessionId).emit('participant:joined', { participant });
    
    // Send current participants to the new joiner
    const allParticipants = Array.from(sessionParticipants.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar
    }));
    socket.emit('participants:list', { participants: allParticipants });
  });

  socket.on('participant:update', (data) => {
    const { sessionId, participant } = data;
    
    if (activeParticipants.has(sessionId)) {
      const sessionParticipants = activeParticipants.get(sessionId);
      if (sessionParticipants.has(participant.id)) {
        const existing = sessionParticipants.get(participant.id);
        sessionParticipants.set(participant.id, { ...existing, ...participant });
        
        // Broadcast update to all participants in the session
        io.to(sessionId).emit('participant:updated', { participant });
      }
    }
  });

  socket.on('emote', (data) => {
    const { sessionId, participantId, emote } = data;
    // Broadcast emote to all participants in the session
    io.to(sessionId).emit('emote', { participantId, emote });
  });

  socket.on('toast:press', (data) => {
    const { sessionId, participantId } = data;
    
    if (!activeParticipants.has(sessionId)) {
      return;
    }

    const sessionParticipants = activeParticipants.get(sessionId);
    if (!sessionParticipants.has(participantId)) {
      return;
    }

    const now = Date.now();
    
    // Initialize or get existing presses for this session
    if (!toastPresses.has(sessionId)) {
      toastPresses.set(sessionId, new Map());
    }
    
    const presses = toastPresses.get(sessionId);
    
    // Record this participant's press
    presses.set(participantId, now);
    
    // Get all participants in the session
    const allParticipantIds = Array.from(sessionParticipants.keys());
    const pressedParticipantIds = Array.from(presses.keys());
    
    // Check if everyone has pressed
    const everyonePressed = allParticipantIds.length > 0 && 
                           allParticipantIds.length === pressedParticipantIds.length &&
                           allParticipantIds.every(id => presses.has(id));
    
    console.log(`[Toast] Participant ${participantId} pressed. Total: ${allParticipantIds.length}, Pressed: ${pressedParticipantIds.length}, Everyone: ${everyonePressed}`);
    
    if (everyonePressed) {
      // Check if all presses were within 3 seconds
      const timestamps = Array.from(presses.values());
      const firstPress = Math.min(...timestamps);
      const lastPress = Math.max(...timestamps);
      const timeWindow = lastPress - firstPress;
      
      console.log(`[Toast] Time window: ${timeWindow}ms (first: ${new Date(firstPress).toISOString()}, last: ${new Date(lastPress).toISOString()})`);
      
      if (timeWindow <= 3000) {
        // Everyone pressed within 3 seconds! Trigger celebration
        console.log(`[Toast] SUCCESS! All ${allParticipantIds.length} participants pressed within 3 seconds`);
        io.to(sessionId).emit('toast:success', {
          participants: allParticipantIds,
          timestamp: now
        });
        
        // Clear the presses for this session
        presses.clear();
      } else {
        // Time window exceeded, clear and start over
        console.log(`[Toast] Time window exceeded: ${timeWindow}ms > 3000ms. Resetting.`);
        presses.clear();
        io.to(sessionId).emit('toast:reset');
      }
    } else {
      // Broadcast the press to all participants
      io.to(sessionId).emit('toast:pressed', {
        participantId,
        pressedCount: pressedParticipantIds.length,
        totalCount: allParticipantIds.length,
        timestamp: now
      });
    }
  });

  // Clean up toast presses when participant leaves
  socket.on('disconnect', () => {
    // Also clean up toast presses for disconnected participants
    activeParticipants.forEach((participants, sessionId) => {
      participants.forEach((participant, participantId) => {
        if (participant.socketId === socket.id) {
          const presses = toastPresses.get(sessionId);
          if (presses) {
            presses.delete(participantId);
          }
        }
      });
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove participant from all sessions
    activeParticipants.forEach((participants, sessionId) => {
      participants.forEach((participant, participantId) => {
        if (participant.socketId === socket.id) {
          participants.delete(participantId);
          io.to(sessionId).emit('participant:left', { participantId });
        }
      });
    });
  });
});

const PORT = process.env.PORT || 3001;

ensureDataDir().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

