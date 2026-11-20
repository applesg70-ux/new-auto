// Car data
const cars = [
    {
        id: 1,
        name: "BYD Atto 3",
        type: "chinese",
        image: "Zakxj.jpg",
        price: "€28,900",
        details: "Electric SUV | 420km range | Modern design | Available at Automarin Alexandras",
        year: 2024
    },
    {
        id: 2,
        name: "BYD Seal",
        type: "chinese",
        image: "HWsda.jpg",
        price: "€34,500",
        details: "Sporty Electric Sedan | Fast charging | Premium interior",
        year: 2024
    },
    {
        id: 3,
        name: "MG ZS EV",
        type: "chinese",
        image: "jdS38.jpg",
        price: "€26,800",
        details: "Family Electric SUV | Reliable | Great value | MG quality",
        year: 2023
    },
    {
        id: 4,
        name: "MG4 EV",
        type: "chinese",
        image: "iV2S4.jpg",
        price: "€29,200",
        details: "Compact Electric Hatch | Fun to drive | High efficiency",
        year: 2024
    },
    {
        id: 5,
        name: "Ford Mustang Mach-E",
        type: "american",
        image: "5dGGO.jpg",
        price: "€48,900",
        details: "Iconic American Electric SUV | Performance | Long range",
        year: 2024
    },
    {
        id: 6,
        name: "Ford Mustang Mach-E GT",
        type: "american",
        image: "ev7Cp.jpg",
        price: "€55,000",
        details: "High-performance electric | American muscle heritage",
        year: 2023
    },
    {
        id: 7,
        name: "Tesla Model 3",
        type: "american",
        image: "0kA1b.jpg",
        price: "€39,900",
        details: "Popular American EV | Autopilot | Supercharging network",
        year: 2024
    },
    {
        id: 8,
        name: "Chery Omoda 5",
        type: "chinese",
        image: "Zakxj.jpg",
        price: "€24,500",
        details: "Stylish Chinese Crossover | Feature-rich | Affordable",
        year: 2024
    }
];

// User state
let currentUser = null;
let cooldownEnd = 0;

// Load from localStorage
function loadUser() {
    const saved = localStorage.getItem('automarinUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        updateUI();
    }
}

function saveUser() {
    if (currentUser) {
        localStorage.setItem('automarinUser', JSON.stringify(currentUser));
    }
}

// Auth functions
function showAuth(type) {
    document.getElementById('auth-modal').style.display = 'flex';
    if (type === 'signup') {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    } else {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('signup-form').style.display = 'none';
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) {
        alert('Please fill all fields');
        return;
    }

    currentUser = {
        name,
        email,
        password,
        clicks: 0,
        earnings: 0,
        wallet: null,
        reviews: [],
        completed: false
    };

    saveUser();
    closeModal('auth-modal');
    updateUI();
    alert('Account created! Start reviewing cars to earn $1 per click.');
}

function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const saved = localStorage.getItem('automarinUser');
    if (saved) {
        const user = JSON.parse(saved);
        if (user.email === email && user.password === password) {
            currentUser = user;
            saveUser();
            closeModal('auth-modal');
            updateUI();
            return;
        }
    }
    alert('Invalid credentials. Please sign up if you are new.');
}

function updateUI() {
    const authNav = document.getElementById('auth-nav');
    const status = document.getElementById('user-status');

    if (currentUser) {
        authNav.innerHTML = `<a href="#" onclick="logout()">Logout (${currentUser.name})</a>`;
        status.style.display = 'block';
        const percent = (currentUser.clicks / 30) * 100;
        document.getElementById('progress').style.width = percent + '%';
        document.getElementById('progress-text').textContent = 
            `${currentUser.clicks} / 30 clicks | Earnings: $${currentUser.earnings}`;
        
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (currentUser.clicks >= 30 && !currentUser.completed) {
            withdrawBtn.style.display = 'inline-block';
        } else {
            withdrawBtn.style.display = 'none';
        }
    } else {
        authNav.innerHTML = `<a href="#" onclick="showAuth('login')">Login</a>`;
        status.style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('automarinUser');
    updateUI();
}

// Cars rendering
function renderCars() {
    const grid = document.getElementById('car-grid');
    grid.innerHTML = cars.map(car => `
        <div class="car-card">
            <img src="${car.image}" alt="${car.name}">
            <div class="car-info">
                <span class="badge ${car.type}">${car.type === 'chinese' ? 'Chinese' : 'American'}</span>
                <h3>${car.name}</h3>
                <p class="price">${car.price}</p>
                <p>${car.details}</p>
                <button class="review-btn" onclick="openReview(${car.id})">Leave Review</button>
            </div>
        </div>
    `).join('');
}

let currentCarId = null;

function openReview(id) {
    if (!currentUser) {
        alert('Please login or sign up first to leave reviews and earn rewards.');
        showAuth('signup');
        return;
    }

    const now = Date.now();
    if (now < cooldownEnd) {
        const remaining = Math.ceil((cooldownEnd - now) / 1000 / 60);
        alert(`Please wait ${remaining} more minute(s) before the next review.`);
        return;
    }

    const car = cars.find(c => c.id === id);
    currentCarId = id;

    document.getElementById('review-car-img').src = car.image;
    document.getElementById('review-car-name').textContent = car.name;
    document.getElementById('review-car-details').textContent = car.details;
    document.getElementById('review-text').value = '';
    document.getElementById('cooldown-msg').textContent = '';
    document.getElementById('review-modal').style.display = 'flex';
}

function submitReview() {
    const reviewText = document.getElementById('review-text').value.trim();
    if (!reviewText) {
        alert('Please write a short review.');
        return;
    }

    if (!currentUser || currentUser.clicks >= 30) {
        if (currentUser && currentUser.clicks >= 30) {
            alert('You have completed 30 reviews! Proceed to withdraw your $30 reward.');
        }
        return;
    }

    // Record review
    currentUser.clicks += 1;
    currentUser.earnings += 1;
    currentUser.reviews.push({
        carId: currentCarId,
        text: reviewText,
        timestamp: new Date().toISOString()
    });

    if (currentUser.clicks >= 30) {
        currentUser.completed = false; // ready for withdrawal
    }

    saveUser();
    updateUI();

    // Set cooldown 3-5 minutes (180000 to 300000 ms)
    const cooldownMs = 180000 + Math.random() * 120000;
    cooldownEnd = Date.now() + cooldownMs;
    localStorage.setItem('cooldownEnd', cooldownEnd);

    closeModal('review-modal');
    alert(`Review submitted! +$1 earned. Total: $${currentUser.earnings}. Next review available in 3-5 minutes.`);
}

// Withdrawal
function showWithdraw() {
    if (!currentUser || currentUser.clicks < 30) {
        alert('Complete 30 clicks first.');
        return;
    }
    document.getElementById('withdraw-modal').style.display = 'flex';
    document.getElementById('withdraw-status').innerHTML = '';
}

function linkWallet() {
    const address = document.getElementById('wallet-address').value.trim();
    if (!address) {
        alert('Please enter your digital wallet address.');
        return;
    }

    currentUser.wallet = address;
    currentUser.completed = true;
    saveUser();

    document.getElementById('withdraw-status').innerHTML = 
        `<p style="color:#10b981; margin-top:1rem;">Wallet linked successfully!<br>Your $30 reward will be sent to: <strong>${address}</strong><br><br>Thank you for your interest in our platform!</p>`;
}

function contactSupport() {
    closeModal('withdraw-modal');
    document.getElementById('support-modal').style.display = 'flex';
}

function sendSupport() {
    const msg = document.getElementById('support-message').value.trim();
    if (!msg) {
        alert('Please describe your issue.');
        return;
    }
    document.getElementById('support-sent').textContent = 'Message sent! Our support team will contact you shortly.';
    document.getElementById('support-message').value = '';
}

function scrollToCars() {
    document.getElementById('cars').scrollIntoView({ behavior: 'smooth' });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    const savedCooldown = localStorage.getItem('cooldownEnd');
    if (savedCooldown) cooldownEnd = parseInt(savedCooldown);
    renderCars();
    updateUI();

    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});

// Mobile menu (basic)
document.querySelector('.hamburger')?.addEventListener('click', () => {
    const menu = document.querySelector('.nav-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
});