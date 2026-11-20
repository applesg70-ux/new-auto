let token = localStorage.getItem('token');
let currentUser = null;
let currentOffset = 0;
let currentCar = null;
let selectedStars = 5;

const API = ''; // same origin

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showAuth(type) {
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = type === 'signup' ? 'block' : 'none';
  document.getElementById('forgot-form').style.display = type === 'forgot' ? 'block' : 'none';
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function signup() {
  try {
    await api('/api/register', { method: 'POST', body: JSON.stringify({
      username: document.getElementById('signup-username').value,
      name: document.getElementById('signup-name').value,
      email: document.getElementById('signup-email').value,
      phone: document.getElementById('signup-phone').value,
      password: document.getElementById('signup-password').value
    })});
    alert('Registration submitted! Please wait for admin approval before logging in.');
    closeModal('auth-modal');
  } catch (e) { alert(e.message); }
}

async function forgotPassword() {
  try {
    await api('/api/forgot-password', { method: 'POST', body: JSON.stringify({
      email: document.getElementById('forgot-email').value
    })});
    alert('Reset request sent. Admin must approve before you can set a new password.');
    closeModal('auth-modal');
  } catch (e) { alert(e.message); }
}

async function login() {
  try {
    const data = await api('/api/login', { method: 'POST', body: JSON.stringify({
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    })});
    token = data.token;
    localStorage.setItem('token', token);
    currentUser = data.user;
    closeModal('auth-modal');
    updateUI();
    loadCars(true);
  } catch (e) { alert(e.message); }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  updateUI();
  loadCars(true);
}

async function loadMe() {
  if (!token) return;
  try {
    const data = await api('/api/me');
    currentUser = data.user;
    updateUI();
  } catch {
    logout();
  }
}

function updateUI() {
  const authNav = document.getElementById('auth-nav');
  const status = document.getElementById('user-status');
  if (currentUser) {
    authNav.innerHTML = `<a href="#" onclick="logout()">Logout (${currentUser.name})</a>`;
    status.style.display = 'block';
    const stage = currentUser.stage || 1;
    document.getElementById('current-stage').textContent = stage;
    const prog = currentUser.stageProgress[stage] || 0;
    const required = [0,30,20,15,1,1][stage] || 30;
    const percent = Math.min(100, (prog / required) * 100);
    document.getElementById('progress').style.width = percent + '%';
    document.getElementById('progress-text').textContent = `Stage ${stage}: ${prog} / ${required}`;
    document.getElementById('earnings-text').textContent = `Total earnings so far: $${currentUser.earnings || 0} (pending admin approval)`;
    document.getElementById('next-stage-btn').style.display = (prog >= required && stage < 5) ? 'inline-block' : 'none';
    // Show withdraw if stage just completed
    if (prog >= required) {
      const wbtn = document.getElementById('withdraw-stage-btn') || document.createElement('button');
      wbtn.id = 'withdraw-stage-btn';
      wbtn.className = 'btn-primary';
      wbtn.style.marginTop = '10px';
      wbtn.textContent = `Withdraw Stage ${stage} Reward`;
      wbtn.onclick = () => showWithdraw(stage);
      if (!document.getElementById('withdraw-stage-btn')) document.getElementById('user-status').appendChild(wbtn);
    }
  } else {
    authNav.innerHTML = `<a href="#" onclick="showAuth('login')">Login</a>`;
    status.style.display = 'none';
  }
}

async function loadCars(reset = false) {
  if (reset) currentOffset = 0;
  try {
    const stage = currentUser ? currentUser.stage : 1;
    const data = await api(`/api/cars?stage=${stage}&offset=${currentOffset}&limit=8`);
    const grid = document.getElementById('car-grid');
    if (reset) grid.innerHTML = '';
    data.cars.forEach(car => {
      const card = document.createElement('div');
      card.className = 'car-card';
      card.innerHTML = `
        <img src="${car.image}" alt="${car.name}">
        <div class="car-info">
          <span class="badge ${car.type}">${car.type === 'chinese' ? 'Chinese' : 'American'}</span>
          <h3>${car.name}</h3>
          <p class="price">${car.price}</p>
          <p>${car.details}</p>
          <button class="review-btn" onclick="openAction(${car.id}, '${car.name}', '${car.image}', '${car.details.replace(/'/g,"\\'")}')">
            ${currentUser && currentUser.stage === 1 ? 'Leave Review' : currentUser && currentUser.stage === 2 ? 'Rate Car' : 'View'}
          </button>
        </div>`;
      grid.appendChild(card);
    });
    currentOffset += data.cars.length;
    document.getElementById('load-more-btn').style.display = data.hasMore ? 'inline-block' : 'none';
    document.getElementById('load-more-info').textContent = `(showing ${currentOffset} of many available)`;
  } catch (e) { console.error(e); }
}

function loadMoreCars() { loadCars(false); }

function openAction(id, name, image, details) {
  if (!currentUser) { alert('Please login first (account must be approved by admin)'); showAuth('login'); return; }
  currentCar = { id, name, image, details };
  document.getElementById('action-car-img').src = image;
  document.getElementById('action-car-name').textContent = name;
  document.getElementById('action-car-details').textContent = details;
  document.getElementById('stage1-ui').style.display = currentUser.stage === 1 ? 'block' : 'none';
  document.getElementById('stage2-ui').style.display = currentUser.stage === 2 ? 'block' : 'none';
  document.getElementById('action-msg').textContent = '';
  document.getElementById('action-modal').style.display = 'flex';
}

async function submitReview() {
  const text = document.getElementById('review-text').value.trim();
  try {
    const data = await api('/api/stage/1/review', { method: 'POST', body: JSON.stringify({ carId: currentCar.id, text }) });
    alert('Review submitted! Progress updated.');
    closeModal('action-modal');
    await loadMe();
    loadCars(true); // refresh to potentially show more
  } catch (e) { document.getElementById('action-msg').textContent = e.message; }
}

async function submitRating() {
  try {
    await api('/api/stage/2/rate', { method: 'POST', body: JSON.stringify({ carId: currentCar.id, stars: selectedStars }) });
    alert('Rating submitted!');
    closeModal('action-modal');
    await loadMe();
  } catch (e) { alert(e.message); }
}

// Star selection
document.addEventListener('DOMContentLoaded', () => {
  const starsEl = document.getElementById('stars');
  if (starsEl) {
    starsEl.onclick = (e) => {
      const rect = starsEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      selectedStars = Math.min(5, Math.max(1, Math.ceil((x / rect.width) * 5)));
      starsEl.textContent = '★'.repeat(selectedStars) + '☆'.repeat(5 - selectedStars);
      document.getElementById('selected-stars').value = selectedStars;
    };
  }
  loadMe().then(() => loadCars(true));
});

async function submitPreferences() {
  try {
    await api('/api/stage/3/preferences', { method: 'POST', body: JSON.stringify({}) });
    alert('Preferences saved! Stage progress updated.');
    closeModal('stage3-modal');
    await loadMe();
  } catch (e) { alert(e.message); }
}

async function submitSurvey() {
  try {
    await api('/api/stage/4/survey', { method: 'POST', body: JSON.stringify({}) });
    alert('Survey completed!');
    closeModal('stage4-modal');
    await loadMe();
  } catch (e) { alert(e.message); }
}

async function submitVerification() {
  try {
    await api('/api/stage/5/verify', { method: 'POST', body: JSON.stringify({
      phone: document.getElementById('phone').value,
      wallet: document.getElementById('wallet').value
    })});
    alert('Verification complete! All rewards are pending admin approval.');
    closeModal('stage5-modal');
    await loadMe();
  } catch (e) { alert(e.message); }
}

async function advanceStage() {
  if (!currentUser) return;
  try {
    await api('/api/complete-stage', { method: 'POST', body: JSON.stringify({ stage: currentUser.stage }) });
    await loadMe();
    alert('Stage completed! Next stage unlocked.');
  } catch (e) { alert(e.message); }
}

// Auto-open stage modals based on stage
function checkStageActions() {
  if (!currentUser) return;
  if (currentUser.stage === 3 && currentUser.stageProgress[3] < 15) {
    // Could open modal, but user can trigger via cars or a button
  }
}

document.getElementById('chat-btn').onclick = () => {
  document.getElementById('chat-modal').style.display = 'flex';
  loadChat();
};

async function loadChat() {
  if (!token) return;
  try {
    const data = await api('/api/chat/messages');
    const box = document.getElementById('chat-messages');
    box.innerHTML = (data.messages || []).map(m => 
      `<div style="margin:5px 0;text-align:${m.from==='user'?'right':'left'};"><span style="background:${m.from==='user'?'#3b82f6':'#334155'};padding:6px 10px;border-radius:8px;display:inline-block;">${m.message}</span></div>`
    ).join('');
    box.scrollTop = box.scrollHeight;
  } catch(e) {}
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  try {
    await api('/api/chat/send', { method: 'POST', body: JSON.stringify({ message: msg }) });
    input.value = '';
    loadChat();
  } catch(e) { alert(e.message); }
}

function showWithdraw(stage) {
  document.getElementById('withdraw-stage').value = stage;
  document.getElementById('withdraw-msg').textContent = `Withdraw your Stage ${stage} reward of $${[0,50,100,150,200,300][stage]}.`;
  document.getElementById('withdraw-modal').style.display = 'flex';
}

async function submitKYC() {
  try {
    await api('/api/kyc', { method: 'POST', body: JSON.stringify({
      idType: document.getElementById('kyc-type').value,
      idNumber: document.getElementById('kyc-number').value,
      notes: document.getElementById('kyc-notes').value
    })});
    alert('KYC submitted. Awaiting admin verification before withdrawals.');
    closeModal('kyc-modal');
  } catch (e) { alert(e.message); }
}

async function requestWithdraw() {
  if (currentUser && !currentUser.kycVerified) {
    document.getElementById('kyc-modal').style.display = 'flex';
    return;
  }
  const stage = document.getElementById('withdraw-stage').value;
  const wallet = document.getElementById('withdraw-wallet').value.trim();
  try {
    const data = await api('/api/withdraw', { method: 'POST', body: JSON.stringify({ stage, wallet }) });
    alert(data.message || 'Withdrawal requested. Contact customer support for your first withdrawal.');
    closeModal('withdraw-modal');
  } catch(e) { 
    if (e.message.includes('KYC')) document.getElementById('kyc-modal').style.display = 'flex';
    else alert(e.message); 
  }
}

async function updateSupportStatus() {
  try {
    const data = await api('/api/support-status');
    const statusEl = document.getElementById('support-status');
    if (statusEl) {
      statusEl.textContent = data.online ? 'Online' : 'Offline';
      statusEl.style.color = data.online ? '#10b981' : '#ef4444';
    }
  } catch {}
}
setInterval(updateSupportStatus, 15000);
updateSupportStatus();

// Poll chat every 10s when open
setInterval(() => {
  if (document.getElementById('chat-modal').style.display === 'flex') loadChat();
}, 10000);