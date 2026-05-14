# Clinical Weekly Report

A faculty reporting portal for clinical rotations — cohort/roster management, attendance, remediation tracking, and PDF-printable submissions.

## What you're deploying

- **Frontend:** Vite + React, hosted on Vercel
- **Backend:** Firebase Firestore (free Spark plan, generous limits)

End URL will look like `https://cdu-clinicals.vercel.app` (or a custom subdomain if you set one).

---

## One-time setup

You'll do this once. Plan on about 30 minutes start to finish.

### 1. Set up Firebase (the database)

1. Go to **https://console.firebase.google.com** and sign in with a Google account.
2. Click **Add project**. Pick a name (e.g. `cdu-clinicals`). Analytics is optional — disable it for the simplest setup.
3. Once the project is created, on the project home page click the **`</>` (Web)** icon to "Add an app".
4. Give the app a nickname (e.g. `cwr-web`). You do **not** need Firebase Hosting — leave that unchecked. Click **Register app**.
5. Firebase shows you a `firebaseConfig` object. **Copy all six values** somewhere safe — you'll paste them into Vercel in step 3. They look like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy…",
     authDomain: "cdu-clinicals.firebaseapp.com",
     projectId: "cdu-clinicals",
     storageBucket: "cdu-clinicals.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123…"
   };
   ```
6. In the left sidebar, click **Build → Firestore Database → Create database**.
7. Choose **Start in production mode**, pick a region close to you, click **Enable**.
8. Once Firestore is created, go to the **Rules** tab. Replace everything in the editor with the contents of `firestore.rules` (in this repo), then click **Publish**.

### 2. Push this code to GitHub

If you don't already have these files in a Git repo:

```bash
cd cwr-app
git init
git add .
git commit -m "Initial commit"
```

Then create a new repository on github.com (private is fine) and push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/cdu-clinicals.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to **https://vercel.com** and sign in with GitHub.
2. Click **Add New… → Project**, then import the GitHub repository you just pushed.
3. Vercel auto-detects Vite — leave all the build settings at their defaults.
4. Expand **Environment Variables** and paste in the six values from your Firebase config:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Click **Deploy**. Wait ~1 minute.
6. Done. Vercel gives you a URL like `https://cdu-clinicals.vercel.app`.

### 4. First login

Open your Vercel URL. Click "Administrator? Sign in here" and use the default password `admin2026`, then:

1. Open **Settings** and change both the admin password and the faculty registration code.
2. Open **Cohorts & rosters**, create a cohort, add students.
3. Open **Facilities** (optional but recommended) and add the clinical sites your program rotates through. Faculty will pick from this list.
4. Share the URL + the new **registration code** with clinical instructors. Each instructor clicks "Create one" on the login screen, enters the code, and sets up their own email/password.

After registering, faculty sign in with their own email and password each visit. The admin's **Faculty accounts** tab lets you see who's registered, how many reports they've submitted, and disable or delete accounts as needed.

---

## Custom subdomain (optional)

Free Vercel subdomains look like `cdu-clinicals.vercel.app`. If you want something like `cdu-clinicals.cdrewu.edu`:

1. In Vercel: **Project → Settings → Domains → Add domain**.
2. Enter your desired domain.
3. Follow the DNS instructions Vercel shows you — your IT team will likely need to add a CNAME record.

---

## Local development

If you want to run it on your own machine for testing:

```bash
npm install
cp .env.example .env
# edit .env and paste your six Firebase config values
npm run dev
```

Then open `http://localhost:5173`.

---

## Hardening — before you roll this out widely

The current setup is fine for a small pilot, but is **not production-grade** for handling FERPA-protected student data at scale:

- The Firebase API key is visible in the browser bundle (this is normal for Firebase, but combined with the permissive security rules it means anyone with the URL can technically read/write Firestore — the faculty password is the only soft gate).
- There's no audit log of who changed what.
- There's no per-user authentication — everyone with the faculty password sees the same view.

Before broad rollout, consider one or more of:

1. **Add Firebase Authentication** (email/password, Google sign-in, or SSO). Then update `firestore.rules` from `allow read, write: if true;` to something like:
   ```
   allow read, write: if request.auth != null;
   ```
2. **Loop in your IT / compliance team.** Ask whether storing student names, absences, and remediation notes on Vercel + Firebase is approved, or whether it needs to live on a sanctioned platform.
3. **Enable Firestore daily backups** (a few dollars/month on the Blaze plan).

Happy to help with any of this — open an issue or ask in chat.

---

## Free tier limits

Firebase's free Spark plan gives you per day:
- 50,000 document reads
- 20,000 document writes
- 20,000 document deletes
- 1 GB total storage

For a nursing program with ~50 faculty submitting one report each per week and an admin browsing occasionally, you'll use well under 1% of the free tier.

---

## Project structure

```
cwr-app/
├── package.json
├── vite.config.js
├── index.html
├── firestore.rules          ← paste into Firebase console → Firestore → Rules
├── .env.example             ← copy to .env for local dev
├── .gitignore
└── src/
    ├── main.jsx             ← React entry point
    ├── App.jsx              ← the whole app
    └── storage.js           ← Firestore-backed key/value store
```

## License

Internal use.
