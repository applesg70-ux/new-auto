# Automarin World Cars - Full Stack Multi-Stage Platform

Promotional car review platform for the Chinese & American Autos collaboration with Automarin (Μεταχειρισμένα Αυτοκίνητα Λ. Αλεξάνδρας, Athens).

## Features

### User Side
- Registration (requires **admin approval** before access)
- 5 locked progressive stages with higher rewards from Stage 2:
  1. **Text Reviews** — 30 written reviews ($50)
  2. **Star Ratings** — 20 ratings ($100)
  3. **Preferences** — Select preferred features/cars ($150)
  4. **Buying Intent Survey** — Detailed questionnaire ($200)
  5. **Final Verification** — Phone + wallet + claim ($300)
- Stage 6: VIP Members only (high rewards – amount not disclosed). Admin can promote users to VIP.
- Mandatory KYC (ID verification) before any withdrawal to prevent abuse/fraud.
- Signup requires: Username, Email, Password, Phone Number (all compulsory). Admin must approve before dashboard access.
- Forgot Password: User requests reset via email → Admin must approve.
- Admin credentials are NOT shown on the frontend. Use the “Change Admin Password” button in the admin panel.
- Chat button shows real-time Online / Offline status (admin can toggle it).
- Stages unlock only after previous stage is fully completed
- More cars appear as the user progresses and clicks
- 3+ minute cooldown between Stage 1 clicks (anti-bot)
- Customer Support button on final stage

### Admin Side (Full Control)
- Login: `admin` / `admin123` (change this!)
- Approve / reject user registrations
- Edit any user (stage, progress, earnings, name, email)
- Approve pending reward payments
- View all recent activity
- Admin panel at `/admin.html`

## How to Run

1. Make sure you have **Node.js** installed (v18+).
2. Open a terminal in this folder.
3. Run:
   ```bash
   node server.js
   ```
4. Open your browser:
   - User site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

No `npm install` needed — uses only built-in Node.js modules.

## Data
All data is stored in `data/db.json`. You can edit it manually or through the admin panel.

## Security Notes (Important)
- This is a demonstration platform.
- Default admin password is weak — change it in `server.js` before real use.
- Sessions are in-memory (restart clears them).
- For production you would add proper authentication, HTTPS, rate limiting, database, email verification, etc.

## Purpose
The multi-stage system helps identify genuine potential car buyers while reducing bot abuse. Only users who complete stages (and get admin approval on payments) are treated as serious prospects.

© 2026 Automarin World Cars Collaboration