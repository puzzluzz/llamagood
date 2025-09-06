import { WebSocketServer } from 'ws';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);
const PORT = process.env.PORT || 8080;
const PATH = process.env.WS_PATH || '/ws';
const MAX_CLIENTS = 10;

const wss = new WebSocketServer({ port: PORT, path: PATH });
console.log('WebSocket server listening on ws://localhost:' + PORT + PATH);

const clients = new Map(); // ws -> {id, username, x, y}

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

function allPlayers() {
  const arr = [];
  for (const [,v] of clients) arr.push({ id:v.id, username:v.username, x:v.x, y:v.y });
  return arr;
}

wss.on('connection', (ws) => {
  if (wss.clients.size > MAX_CLIENTS) {
    ws.send(JSON.stringify({ type: 'full' }));
    ws.close();
    return;
  }

  ws.on('message', (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch (e) { return; }

    if (msg.type === 'join') {
      const id = nanoid();
      const username = (''+(msg.username||'Player')).slice(0,20);
      const x = Number.isFinite(msg.x) ? msg.x : 5;
      const y = Number.isFinite(msg.y) ? msg.y : 5;
      clients.set(ws, { id, username, x, y });

      // welcome with current players
      ws.send(JSON.stringify({ type: 'welcome', id, players: allPlayers() }));
      // announce join
      broadcast({ type: 'player_join', id, username, x, y });
      return;
    }

    const me = clients.get(ws);
    if (!me) return;

    if (msg.type === 'move') {
      // clamp grid 0..9
      const tx = Math.max(0, Math.min(9, Math.round(msg.target?.x ?? me.x)));
      const ty = Math.max(0, Math.min(9, Math.round(msg.target?.y ?? me.y)));
      me.x = tx; me.y = ty;
      broadcast({ type: 'move', id: me.id, x: me.x, y: me.y });
    } else if (msg.type === 'chat') {
      const text = (''+(msg.text||'')).slice(0, 200);
      if (text) broadcast({ type: 'chat', id: me.id, username: me.username, text });
    }
  });

  ws.on('close', () => {
    const me = clients.get(ws);
    clients.delete(ws);
    if (me) broadcast({ type: 'player_leave', id: me.id, username: me.username });
  });
});
