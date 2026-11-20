const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure data directory
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initial data with many cars
let db = {
  users: [],
  cars: [],
  activities: [],
  messages: [],
  sessions: [],
  supportOnline: true,
  supportName: 'Customer Support',
  admin: {
    username: 'admin',
    passwordHash: hashPassword('admin123') // Change this via admin panel!
  }
};

function hashPassword(password) {
  return crypto.pbkdf2Sync(password, 'automarin-salt', 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } else {
      initializeCars();
      saveDB();
    }
  } catch (e) {
    console.error('DB load error:', e);
    initializeCars();
  }
}

function saveDB() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function initializeCars() {
  const images = [
    'Zakxj.jpg', 'HWsda.jpg', 'jdS38.jpg', 'iV2S4.jpg', '5dGGO.jpg',
    'ev7Cp.jpg', '0kA1b.jpg', 'EoVb4.jpg', 'yznGq.jpg', 'DpNpd.jpg',
    '5B6BJ.jpg', 'rBeHp.jpg', '2oLZy.jpg', '27giT.jpg'
  ];
  
  const chineseModels = [
    'BYD Atto 3', 'BYD Seal', 'BYD Sealion 7', 'BYD Sealion 8', 'BYD Tang',
    'MG ZS EV', 'MG4 EV', 'MG Marvel R', 'MG HS',
    'Chery Omoda 5', 'Chery Tiggo 7', 'Chery Tiggo 8', 'Chery Tiggo 9',
    'Geely Coolray', 'Geely Emgrand', 'XPeng G6', 'NIO ET5'
  ];
  
  const americanModels = [
    'Ford Mustang Mach-E', 'Ford Mustang Mach-E GT', 'Ford F-150 Lightning',
    'Tesla Model 3', 'Tesla Model Y', 'Tesla Model S',
    'Jeep Grand Cherokee', 'Jeep Wrangler 4xe',
    'Chevrolet Equinox EV', 'Chevrolet Bolt EUV', 'Chevrolet Silverado EV',
    'Dodge Hornet', 'Chrysler Pacifica Hybrid'
  ];

  let id = 1;
  chineseModels.forEach((name, i) => {
    db.cars.push({
      id: id++,
      name,
      type: 'chinese',
      image: images[i % images.length],
      price: `€${(22000 + Math.floor(Math.random() * 20000)).toLocaleString()}`,
      details: `Premium Chinese EV/SUV | Modern tech | Available at Automarin Alexandras`,
      year: 2023 + (i % 3)
    });
  });
  
  americanModels.forEach((name, i) => {
    db.cars.push({
      id: id++,
      name,
      type: 'american',
      image: images[(i + 5) % images.length],
      price: `€${(35000 + Math.floor(Math.random() * 25000)).toLocaleString()}`,
      details: `Iconic American performance & EV | Strong presence | Automarin collaboration`,
      year: 2023 + (i % 3)
    });
  });
  
  // Extra filler cars for "more as you click"
  for (let i = 0; i < 20; i++) {
    const isChinese = i % 2 === 0;
    db.cars.push({
      id: id++,
      name: isChinese ? `Chinese Model ${i+1}` : `American Model ${i+1}`,
      type: isChinese ? 'chinese' : 'american',
      image: images[i % images.length],
      price: `€${(20000 + Math.floor(Math.random() * 30000)).toLocaleString()}`,
      details: `Featured vehicle in the Automarin World Cars collection`,
      year: 2024
    });
  }
}

// Stages config
const STAGES = {
  1: { name: 'Text Reviews', required: 30, reward: 50, description: 'Click cars and leave written reviews' },
  2: { name: 'Star Ratings', required: 20, reward: 100, description: 'Rate cars with 1-5 stars' },
  3: { name: 'Preferences', required: 15, reward: 150, description: 'Select your preferred cars and features' },
  4: { name: 'Buying Intent Survey', required: 1, reward: 200, description: 'Complete detailed questionnaire' },
  5: { name: 'Final Verification', required: 1, reward: 300, description: 'Confirm contact & claim final reward' },
  6: { name: 'VIP Members', required: 1, reward: null, description: 'Exclusive VIP stage – high rewards (amount not disclosed)' }
};

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getUserFromToken(token) {
  if (!token) return null;
  const session = db.sessions.find(s => s.token === token);
  if (!session) return null;
  return db.users.find(u => u.id === session.userId);
}

function createSession(userId) {
  const token = generateToken();
  db.sessions.push({ token, userId, created: Date.now() });
  saveDB();
  return token;
}

function destroySession(token) {
  db.sessions = db.sessions.filter(s => s.token !== token);
  saveDB();
}

function sendVerificationEmail(email, token, name) {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log('[Email] No API key. Verification link:', (process.env.SITE_URL || 'https://new-auto-gt53.onrender.com') + '/api/verify-email?token=' + token);
    return;
  }
  const siteUrl = process.env.SITE_URL || 'https://new-auto-gt53.onrender.com';
  const verifyLink = `${siteUrl}/api/verify-email?token=${token}`;
  const isBrevo = !!process.env.BREVO_API_KEY;
  const payload = isBrevo ? {
    sender: { name: 'Automarin World Cars', email: process.env.SENDER_EMAIL || 'noreply@automarinworldcars.com' },
    to: [{ email, name: name || email }],
    subject: 'Verify your email – Automarin World Cars',
    htmlContent: `<p>Hello ${name || 'there'},</p><p>Please verify your email:</p><p><a href="${verifyLink}" style="background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email</a></p><p>Link: ${verifyLink}</p>`
  } : {
    personalizations: [{ to: [{ email }] }],
    from: { email: process.env.SENDER_EMAIL || 'noreply@automarinworldcars.com', name: 'Automarin World Cars' },
    subject: 'Verify your email – Automarin World Cars',
    content: [{ type: 'text/html', value: `<p>Hello,</p><p>Verify your email: <a href="${verifyLink}">${verifyLink}</a></p>` }]
  };
  const options = isBrevo ? {
    hostname: 'api.brevo.com', path: '/v3/smtp/email', method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
  } : {
    hostname: 'api.sendgrid.com', path: '/v3/mail/send', method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  };
  const reqMail = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => console.log(res.statusCode < 300 ? 'Email sent to ' + email : 'Email failed: ' + res.statusCode + ' ' + data));
  });
  reqMail.on('error', e => console.error('Email error:', e));
  reqMail.write(JSON.stringify(payload));
  reqMail.end();
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/' || cleanUrl === '') cleanUrl = '/index.html';

  // Special case for admin
  if (cleanUrl === '/admin' || cleanUrl === '/admin/') cleanUrl = '/admin.html';

  // Special case for uploads
  if (cleanUrl.startsWith('/uploads/')) {
    filePath = path.join(__dirname, cleanUrl);
  }

  // Try public folder first
  if (!filePath || !fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, cleanUrl);
  }
  if (!filePath.startsWith(PUBLIC_DIR) && !filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // Fallback to root directory
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, cleanUrl.replace(/^\//, ''));
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log('404 - File not found:', filePath, 'for URL:', req.url);
    res.writeHead(404); res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Static files
  if (method === 'GET' && !pathname.startsWith('/api')) {
    return serveStatic(req, res);
  }

  // API routes
  try {
    const body = await parseBody(req);
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    const currentUser = token ? getUserFromToken(token) : null;

    // ========== AUTH ==========
    if (pathname === '/api/register' && method === 'POST') {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (!checkRateLimit('reg-' + ip, 3, 60 * 60 * 1000)) {
        return sendJSON(res, 429, { error: 'Too many registration attempts. Try again later.' });
      }
      const { username, name, email, password, phone } = body;
      if (!username || !email || !password || !phone) return sendJSON(res, 400, { error: 'Username, email, password and phone number are required' });
      if (db.users.find(u => u.email === email || u.username === username)) return sendJSON(res, 400, { error: 'Email or username already registered' });

      const user = {
        id: crypto.randomUUID(),
        username,
        name: name || username,
        email,
        phone,
        passwordHash: hashPassword(password),
        approved: false,
        kycVerified: false,
        kycDocument: null,
        stage: 1,
        stageProgress: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        isVIP: false,
        earnings: 0,
        pendingRewards: [],
        wallet: null,
        passwordResetRequest: null,
        emailVerified: false,
        verificationToken: crypto.randomBytes(32).toString('hex'),
        restricted: false,
        restrictionMessage: '',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      db.users.push(user);
      saveDB();
      // Send verification email
      sendVerificationEmail(email, user.verificationToken, name || username);
      return sendJSON(res, 201, { 
        message: 'Registration submitted. Please check your email to verify your account. Admin approval is also required before you can log in.'
      });
    }

    if (pathname === '/api/verify-email' && method === 'GET') {
      const token = parsed.query.token;
      const user = db.users.find(u => u.verificationToken === token);
      if (!user) return sendJSON(res, 400, { error: 'Invalid verification token' });
      user.emailVerified = true;
      user.verificationToken = null;
      saveDB();
      return sendJSON(res, 200, { message: 'Email verified successfully. You can now log in after admin approval.' });
    }

    if (pathname === '/api/login' && method === 'POST') {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (!checkRateLimit('login-' + ip, 10, 15 * 60 * 1000)) {
        return sendJSON(res, 429, { error: 'Too many login attempts. Try again in 15 minutes.' });
      }
      const { email, password, username } = body;
      const identifier = email || username;
      const user = db.users.find(u => u.email === identifier || u.username === identifier);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return sendJSON(res, 401, { error: 'Invalid credentials' });
      }
      if (!user.emailVerified) {
        return sendJSON(res, 403, { error: 'Please verify your email first' });
      }
      if (!user.approved) {
        return sendJSON(res, 403, { error: 'Account pending admin approval' });
      }
      const token = createSession(user.id);
      user.lastActivity = new Date().toISOString();
      saveDB();
      return sendJSON(res, 200, { token, user: { id: user.id, username: user.username, name: user.name, email: user.email, phone: user.phone, stage: user.stage, stageProgress: user.stageProgress, earnings: user.earnings, pendingRewards: user.pendingRewards, kycVerified: user.kycVerified, isVIP: user.isVIP, restricted: user.restricted, restrictionMessage: user.restrictionMessage } });
    }

    if (pathname === '/api/logout' && method === 'POST') {
      if (token) destroySession(token);
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/me' && method === 'GET') {
      if (!currentUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      return sendJSON(res, 200, {
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          stage: currentUser.stage,
          stageProgress: currentUser.stageProgress,
          earnings: currentUser.earnings,
          pendingRewards: currentUser.pendingRewards,
          wallet: currentUser.wallet,
          approved: currentUser.approved
        }
      });
    }

    // ========== CARS ==========
    if (pathname === '/api/cars' && method === 'GET') {
      const stage = parseInt(parsed.query.stage) || 1;
      const offset = parseInt(parsed.query.offset) || 0;
      const limit = parseInt(parsed.query.limit) || 12;
      // Show more cars as progress increases
      const available = db.cars.slice(0, Math.min(db.cars.length, 12 + (offset > 0 ? offset : 0) + (currentUser ? currentUser.stageProgress[1] || 0 : 0)));
      const page = available.slice(offset, offset + limit);
      return sendJSON(res, 200, { cars: page, total: available.length, hasMore: offset + limit < available.length });
    }

    // ========== STAGE ACTIONS ==========
    if (pathname === '/api/stage/1/review' && method === 'POST') {
      if (!currentUser || !currentUser.approved) return sendJSON(res, 401, { error: 'Unauthorized or not approved' });
      if (currentUser.stage > 1) return sendJSON(res, 400, { error: 'Stage 1 already completed' });
      if (currentUser.stageProgress[1] >= STAGES[1].required) return sendJSON(res, 400, { error: 'Stage 1 complete' });

      const { carId, text } = body;
      if (!text || text.length < 5) return sendJSON(res, 400, { error: 'Review too short' });

      // Cooldown check (stored on user)
      const now = Date.now();
      if (currentUser.lastClick && now - currentUser.lastClick < 180000) {
        const wait = Math.ceil((180000 - (now - currentUser.lastClick)) / 60000);
        return sendJSON(res, 429, { error: `Please wait ${wait} more minute(s)` });
      }

      currentUser.stageProgress[1] += 1;
      currentUser.lastClick = now;
      currentUser.lastActivity = new Date().toISOString();
      db.activities.push({ userId: currentUser.id, type: 'review', carId, text, stage: 1, time: new Date().toISOString() });

      if (currentUser.stageProgress[1] >= STAGES[1].required) {
        currentUser.pendingRewards.push({ stage: 1, amount: STAGES[1].reward, status: 'pending', createdAt: new Date().toISOString() });
        currentUser.earnings += STAGES[1].reward;
      }
      saveDB();
      return sendJSON(res, 200, { success: true, progress: currentUser.stageProgress[1], required: STAGES[1].required });
    }

    if (pathname === '/api/stage/2/rate' && method === 'POST') {
      if (!currentUser || currentUser.stage < 2) return sendJSON(res, 403, { error: 'Stage 2 locked' });
      if (currentUser.stageProgress[2] >= STAGES[2].required) return sendJSON(res, 400, { error: 'Stage 2 complete' });

      const { carId, stars } = body;
      if (!stars || stars < 1 || stars > 5) return sendJSON(res, 400, { error: 'Invalid rating' });

      currentUser.stageProgress[2] += 1;
      currentUser.lastActivity = new Date().toISOString();
      db.activities.push({ userId: currentUser.id, type: 'rating', carId, stars, stage: 2, time: new Date().toISOString() });

      if (currentUser.stageProgress[2] >= STAGES[2].required) {
        currentUser.pendingRewards.push({ stage: 2, amount: STAGES[2].reward, status: 'pending', createdAt: new Date().toISOString() });
        currentUser.earnings += STAGES[2].reward;
        currentUser.stage = 3;
      }
      saveDB();
      return sendJSON(res, 200, { success: true, progress: currentUser.stageProgress[2] });
    }

    // Similar simplified handlers for stages 3-5
    if (pathname === '/api/stage/3/preferences' && method === 'POST') {
      if (!currentUser || currentUser.stage < 3) return sendJSON(res, 403, { error: 'Stage 3 locked' });
      currentUser.stageProgress[3] += 1;
      if (currentUser.stageProgress[3] >= STAGES[3].required) {
        currentUser.pendingRewards.push({ stage: 3, amount: STAGES[3].reward, status: 'pending', createdAt: new Date().toISOString() });
        currentUser.earnings += STAGES[3].reward;
        currentUser.stage = 4;
      }
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/stage/4/survey' && method === 'POST') {
      if (!currentUser || currentUser.stage < 4) return sendJSON(res, 403, { error: 'Stage 4 locked' });
      currentUser.stageProgress[4] = 1;
      currentUser.pendingRewards.push({ stage: 4, amount: STAGES[4].reward, status: 'pending', createdAt: new Date().toISOString() });
      currentUser.earnings += STAGES[4].reward;
      currentUser.stage = 5;
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/stage/5/verify' && method === 'POST') {
      if (!currentUser || currentUser.stage < 5) return sendJSON(res, 403, { error: 'Stage 5 locked' });
      const { phone, wallet } = body;
      currentUser.wallet = wallet || currentUser.wallet;
      currentUser.phone = phone;
      currentUser.stageProgress[5] = 1;
      currentUser.pendingRewards.push({ stage: 5, amount: STAGES[5].reward, status: 'pending', createdAt: new Date().toISOString() });
      currentUser.earnings += STAGES[5].reward;
      saveDB();
      return sendJSON(res, 200, { success: true, message: 'Verification complete. Rewards pending admin approval.' });
    }

    if (pathname === '/api/complete-stage' && method === 'POST') {
      // Manual stage advance if progress met (called by frontend)
      if (!currentUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      const { stage } = body;
      if (currentUser.stageProgress[stage] >= STAGES[stage].required && currentUser.stage === stage) {
        currentUser.stage = stage + 1;
        saveDB();
      }
      return sendJSON(res, 200, { stage: currentUser.stage });
    }

    // ========== ADMIN ==========
    if (pathname === '/api/admin/login' && method === 'POST') {
      const { username, password } = body;
      if (username === db.admin.username && verifyPassword(password, db.admin.passwordHash)) {
        const token = generateToken();
        sessions.set(token, { admin: true });
        return sendJSON(res, 200, { token, message: 'Admin logged in' });
      }
      return sendJSON(res, 401, { error: 'Invalid admin credentials' });
    }

    const isAdmin = token && sessions.get(token)?.admin;

    if (pathname === '/api/admin/users' && method === 'GET') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const users = db.users.map(u => ({ ...u, passwordHash: undefined }));
      return sendJSON(res, 200, { users });
    }

    if (pathname === '/api/admin/user' && method === 'PUT') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { id, approved, stage, stageProgress, earnings, name, email } = body;
      const user = db.users.find(u => u.id === id);
      if (!user) return sendJSON(res, 404, { error: 'User not found' });
      if (approved !== undefined) user.approved = approved;
      if (stage !== undefined) user.stage = stage;
      if (stageProgress) user.stageProgress = { ...user.stageProgress, ...stageProgress };
      if (earnings !== undefined) user.earnings = earnings;
      if (name) user.name = name;
      if (email) user.email = email;
      saveDB();
      return sendJSON(res, 200, { success: true, user });
    }

    if (pathname === '/api/admin/approve-reward' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { userId, stage } = body;
      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJSON(res, 404, { error: 'User not found' });
      const reward = user.pendingRewards.find(r => r.stage === stage && r.status === 'pending');
      if (reward) {
        reward.status = 'approved';
        reward.approvedAt = new Date().toISOString();
      }
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/admin/activities' && method === 'GET') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      return sendJSON(res, 200, { activities: db.activities.slice(-200).reverse() });
    }

    // ========== CHAT ==========
    if (pathname === '/api/chat/send' && method === 'POST') {
      if (!currentUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      const { message } = body;
      if (!message) return sendJSON(res, 400, { error: 'Message required' });
      db.messages.push({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        userName: currentUser.name,
        message,
        from: 'user',
        time: new Date().toISOString(),
        read: false
      });
      db.activities.push({ userId: currentUser.id, type: 'chat', message, time: new Date().toISOString() });
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/chat/messages' && method === 'GET') {
      if (!currentUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      const userMsgs = db.messages.filter(m => m.userId === currentUser.id).slice(-50);
      return sendJSON(res, 200, { messages: userMsgs });
    }

    if (pathname === '/api/admin/chat/messages' && method === 'GET') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      return sendJSON(res, 200, { messages: db.messages.slice(-100).reverse() });
    }

    if (pathname === '/api/admin/chat/reply' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { userId, message, supportName } = body;
      if (!message || !userId) return sendJSON(res, 400, { error: 'Missing data' });
      const user = db.users.find(u => u.id === userId);
      const nameToUse = supportName || db.supportName || 'Customer Support';

      // Only add the join message once per user chat
      const alreadyJoined = db.messages.some(m => m.userId === userId && m.from === 'system' && m.message.includes('has joined'));
      if (!alreadyJoined) {
        db.messages.push({
          id: crypto.randomUUID(),
          userId,
          userName: user ? user.name : 'User',
          message: `${nameToUse} has joined the chat`,
          from: 'system',
          supportName: nameToUse,
          time: new Date().toISOString(),
          read: false
        });
      }

      db.messages.push({
        id: crypto.randomUUID(),
        userId,
        userName: user ? user.name : 'User',
        message,
        from: 'admin',
        supportName: nameToUse,
        time: new Date().toISOString(),
        read: false
      });
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/admin/set-support-name' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { name } = body;
      if (name) db.supportName = name;
      saveDB();
      return sendJSON(res, 200, { success: true, supportName: db.supportName });
    }

    // Wallet link for stage reward (requires KYC)
    if (pathname === '/api/withdraw' && method === 'POST') {
      if (!currentUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      if (!currentUser.kycVerified) return sendJSON(res, 403, { error: 'KYC verification required before any withdrawal. Please upload your ID.' });
      const { stage, wallet } = body;
      if (!wallet) return sendJSON(res, 400, { error: 'Wallet address required' });
      currentUser.wallet = wallet;
      const reward = currentUser.pendingRewards.find(r => r.stage === parseInt(stage) && r.status === 'pending');
      if (reward) {
        reward.wallet = wallet;
        reward.requestedAt = new Date().toISOString();
      }
      saveDB();
      return sendJSON(res, 200, { success: true, message: 'Withdrawal requested. Contact customer support on the website for your first withdrawal. Admin will approve after KYC check.' });
    }

    // KYC upload (simple flag + note; real file upload would need multipart)
    if (pathname === '/api/kyc' && method === 'POST') {
      if (!currentUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      const { idType, idNumber, notes } = body;
      if (!idType || !idNumber) return sendJSON(res, 400, { error: 'ID type and number required' });
      currentUser.kycDocument = { idType, idNumber, notes, submittedAt: new Date().toISOString(), status: 'pending' };
      currentUser.kycVerified = false;
      saveDB();
      return sendJSON(res, 200, { success: true, message: 'KYC submitted. Awaiting admin verification.' });
    }

    // Forgot password request
    if (pathname === '/api/forgot-password' && method === 'POST') {
      const { email } = body;
      const user = db.users.find(u => u.email === email);
      if (!user) return sendJSON(res, 404, { error: 'Email not found' });
      user.passwordResetRequest = { requestedAt: new Date().toISOString(), status: 'pending' };
      saveDB();
      return sendJSON(res, 200, { message: 'Password reset requested. Admin must approve before you can set a new password.' });
    }

    // Admin approve password reset
    if (pathname === '/api/admin/approve-reset' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { userId, newPassword } = body;
      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJSON(res, 404, { error: 'User not found' });
      if (newPassword) user.passwordHash = hashPassword(newPassword);
      user.passwordResetRequest = null;
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    // Admin change own password
    if (pathname === '/api/admin/change-password' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) return sendJSON(res, 400, { error: 'Password too short' });
      db.admin.passwordHash = hashPassword(newPassword);
      saveDB();
      return sendJSON(res, 200, { success: true, message: 'Admin password changed' });
    }

    // Support online status
    if (pathname === '/api/support-status' && method === 'GET') {
      return sendJSON(res, 200, { online: db.supportOnline });
    }

    if (pathname === '/api/admin/toggle-support' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      db.supportOnline = !db.supportOnline;
      saveDB();
      return sendJSON(res, 200, { online: db.supportOnline });
    }

    // Admin verify KYC
    if (pathname === '/api/admin/verify-kyc' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { userId, verified } = body;
      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJSON(res, 404, { error: 'User not found' });
      user.kycVerified = !!verified;
      if (user.kycDocument) user.kycDocument.status = verified ? 'verified' : 'rejected';
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    // Admin mark email verified
    if (pathname === '/api/admin/verify-email' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { userId } = body;
      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJSON(res, 404, { error: 'User not found' });
      user.emailVerified = true;
      user.verificationToken = null;
      saveDB();
      return sendJSON(res, 200, { success: true });
    }
    if (pathname === '/api/admin/restrict' && method === 'POST') {
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { userId, restricted, message } = body;
      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJSON(res, 404, { error: 'User not found' });
      user.restricted = !!restricted;
      user.restrictionMessage = message || (restricted ? 'Your account has been restricted. Please contact customer support via chat.' : '');
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    // Chat file upload (base64 for simplicity on pure Node)
    if (pathname === '/api/chat/upload' && method === 'POST') {
      if (!currentUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      const { filename, data, message } = body;
      if (!filename || !data) return sendJSON(res, 400, { error: 'File data required' });
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const safeName = Date.now() + '-' + filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      db.messages.push({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        userName: currentUser.name,
        message: message || `Uploaded file: ${filename}`,
        from: 'user',
        file: `/uploads/${safeName}`,
        time: new Date().toISOString(),
        read: false
      });
      saveDB();
      return sendJSON(res, 200, { success: true, file: `/uploads/${safeName}` });
    }
      if (!isAdmin) return sendJSON(res, 401, { error: 'Admin only' });
      const { userId, isVIP } = body;
      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJSON(res, 404, { error: 'User not found' });
      user.isVIP = !!isVIP;
      if (isVIP && user.stage < 6) user.stage = 6;
      saveDB();
      return sendJSON(res, 200, { success: true });
    }

    sendJSON(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    sendJSON(res, 500, { error: 'Server error' });
  }
});

loadDB();
server.listen(PORT, () => {
  console.log(`Automarin World Cars server running at http://localhost:${PORT}`);
  console.log(`Admin login: admin / admin123`);
  console.log(`Open http://localhost:${PORT} for the site`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});