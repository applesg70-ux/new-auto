# Deploy Automarin World Cars to Render.com (Free)

This keeps your full Node.js server exactly as it is (admin panel, stages, KYC, chat, etc.).

## Step-by-step

1. Go to https://render.com and sign up (free account with GitHub or email).

2. Create a new **Web Service**.

3. Connect your GitHub repo **or** use “Public Git repository” / upload the files.

   Easiest way right now:
   - Create a free GitHub account if you don’t have one.
   - Upload the `car-platform` folder as a new repository.
   - Or simply use Render’s “Deploy from existing public repo” after you push the files.

4. In Render settings:
   - **Environment**: Node
   - **Build Command**: (leave empty or `npm install` — not needed)
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

5. Deploy.

6. Render will give you a live URL like:  
   `https://automarin-world-cars.onrender.com`

### Important notes
- Free tier sleeps after 15 minutes of inactivity (wakes up in ~30 seconds on first visit).
- Data (`data/db.json`) persists as long as the service is not deleted.
- Admin panel: `https://your-url.onrender.com/admin.html`
- Change the admin password immediately after first login using the button in the admin panel.

That’s it — your full platform will be live.