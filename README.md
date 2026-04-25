# MEC 2026 — Participant Web App

> 23rd Medical Ethics Camp · Chiang Mai University · 14–18 May 2026

A mobile-first PWA for camp participants. Twitter-style UI, installable on iPhone/Android.

---

## Project Structure

```
mec-app/
├── public/
│   ├── index.html      ← Main app (all screens)
│   ├── manifest.json   ← PWA manifest (install prompt)
│   └── sw.js           ← Service worker (offline caching)
└── src/
    └── data/
        └── index.js    ← All editable content (schedule, contacts, etc.)
                           Reference only — data is also embedded in index.html
```

---

## Screens

| Tab | Description |
|-----|-------------|
| Home | Welcome + current/next session + latest announcement |
| Updates | Scrollable Twitter-style announcement feed |
| SOS | Emergency contacts (tap to call) + first aid accordion |
| Map | Venue map placeholder + key location list |
| Schedule | 5-day vertical timeline, auto-opens to today |

Plus a slide-out hamburger drawer with: About MEC, Photos, Reflection Form, SOS.

---

## Deploy to Vercel (2 minutes)

### Option A — drag & drop
1. Go to [vercel.com](https://vercel.com) → New Project
2. Drag the `public/` folder into the upload area
3. Deploy → done. You get a URL like `https://mec-2026.vercel.app`

### Option B — GitHub
```bash
git init && git add . && git commit -m "init"
# push to GitHub repo, then import in Vercel dashboard
```

### Option C — Vercel CLI
```bash
npm install -g vercel
cd mec-app/public
vercel
```

---

## Embed in NFC Tag

1. Get your Vercel URL (e.g. `https://mec-2026.vercel.app`)
2. Program each NFC tag with that URL as a plain URI record
3. When participants tap their name tag, the app opens in Safari/Chrome instantly
4. They can tap "Add to Home Screen" to install as a PWA

---

## Customize Before the Event

### Update the schedule
Open `public/index.html`, find the `SCHEDULE` array (~line 390) and edit:
```js
{ day:0, time:"09:00", end:"10:00", name:"Opening Ceremony", location:"Main Hall", tag:"special" },
```
- `day`: 0=14May, 1=15May, 2=16May, 3=17May, 4=18May
- `tag`: `talk` | `workshop` | `meal` | `free` | `travel` | `special`

### Add announcements
Find `ANNOUNCEMENTS` array and add to the top (newest first):
```js
{ id:6, time:"10:30", date:"15 May", type:"info", message:"Your message here" },
```
Types: `info` | `urgent` | `change`

### Update phone numbers
Find `CONTACTS` array and replace `08X-XXX-XXXX` with real numbers.

### Replace map
Find `<!-- REPLACE THIS DIV -->` in the Map screen and swap with:
```html
<img src="YOUR_MAP_IMAGE_URL" style="width:100%;height:100%;object-fit:cover">
```

### Update links
Search for `https://drive.google.com` and `https://forms.google.com` and replace with real URLs.

### WiFi / other info
The Info section is in the HTML — search for `MEC2026_Guest` to find and edit WiFi details.

---

## Install as PWA (iPhone)

1. Open Safari → navigate to your app URL
2. Tap the Share button
3. Tap "Add to Home Screen"
4. The app installs with the MEC logo and opens full-screen

---

## Make it work offline

The service worker (`sw.js`) caches the app shell on first load.
After the first visit, it works without internet — useful during the CNX tour.
