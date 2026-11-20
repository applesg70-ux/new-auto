# How to Enable Automatic Verification Emails

## Free option: Brevo (recommended)

1. Go to https://www.brevo.com and create a free account.
2. Verify your email / domain (or use their default sender for testing).
3. Go to **SMTP & API** → **API Keys** → Create a new API key.
4. On Render:
   - Open your Web Service → **Environment**
   - Add these variables:
     - `BREVO_API_KEY` = your API key
     - `SENDER_EMAIL` = the email address you verified in Brevo (e.g. your@email.com)
     - `SITE_URL` = https://new-auto-gt53.onrender.com
   - Save and redeploy.

## Alternative: SendGrid

1. Create a free account at https://sendgrid.com
2. Create an API key with Mail Send permission.
3. On Render add:
   - `SENDGRID_API_KEY` = your key
   - `SENDER_EMAIL` = verified sender
   - `SITE_URL` = https://new-auto-gt53.onrender.com

Once the environment variables are set, every new registration will automatically receive a verification email.

Until then, the verification link is printed in the Render logs so you can still test.
