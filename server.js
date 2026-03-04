import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './src/routes/auth.js';
import apiRoutes from './src/routes/api.js';
import adminRoutes from './src/routes/admin.js';
import { Simulator } from './src/simulator.js';
import { setWSS, broadcastWS } from './src/ws-broadcast.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '200kb' }));
app.use(morgan('dev'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 15*60*1000, max: 400 });
app.use('/api/', limiter);

// routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// DB connect (optional for demo; still attempt)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
    .then(()=> console.log('MongoDB connected'))
    .catch(err=> console.warn('MongoDB not connected (ok for demo)', err.message));
}

// simulator and broadcast
const sim = new Simulator();
setInterval(()=>{
  const data = sim.runFullPrediction(-1.286389,36.817223);
  broadcastWS({ type:'prediction', data });
}, 8000);

// WebSocket server
const wss = new WebSocketServer({ server });
wss.on('connection', ws=>{
  console.log('WS client connected');
  ws.on('message', msg=>{
    try{
      const obj = JSON.parse(msg.toString());
      if (obj?.type==='ping') ws.send(JSON.stringify({ type:'pong' }));
    }catch(e){}
  });
});

setWSS(wss);

// SPA fallback
app.get('*',(req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

server.listen(PORT, ()=> console.log(`FloodShield complete running at http://localhost:${PORT}`));
