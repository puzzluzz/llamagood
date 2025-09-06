# Llama Isometric WebSocket Server (max 10 players)

## Run locally
```bash
npm install
npm start
```
Serves WebSocket at `ws://localhost:8080/ws`.

## Deploy on Render
- New → Web Service → connect this repo
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Instance Type: Free
- Your production WS URL will be `wss://<service>.onrender.com/ws`
