const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app); // Express + Socket.io on the same port
  initSocket(server);
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});