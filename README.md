# game
🎮 Vizzhy Game

A browser-based narrative exploration game built with HTML, JavaScript, and Tiled maps.

Explore the city, enter clinical environments, access Vizzhy Labs, and trigger interactive mini-games — all directly in the browser.

No build tools required. No backend required.

🚀 Quick Start (Run Locally)
Option 1 — Easiest (Recommended)

Use a local server (do NOT open index.html directly).

Mac / Linux
cd game
python3 -m http.server 8000
Windows
cd game
python -m http.server 8000

Then open:

http://localhost:8000
Option 2 — VS Code Live Server

Open the folder in VS Code

Install Live Server extension

Right-click index.html → Open with Live Server

🌍 Deploy to Any Website / Hosting Provider

This is a static website. You can deploy it anywhere that supports static hosting.

Works With:

GitHub Pages

Netlify

Vercel

Cloudflare Pages

Any shared hosting (cPanel, Apache, Nginx)

Any CDN

🧩 Hosting on GitHub Pages

Push repository to GitHub

Go to Settings → Pages

Select:

Source: Deploy from branch

Branch: main

Folder: / (root)

Save

Your site will be available at:

https://yourusername.github.io/game/
📁 Project Structure
index.html              # Entry point
src/game.js             # Main game logic
assets/                 # Sprites, tilesets, UI
maps/                   # Tiled map files (.tmx / .tmj)
minigames/
  minigame1/
  minigame2/
⚠️ Important: Do NOT Open Directly

Opening index.html using:

file:///...

will break map loading due to browser security rules.

Always use a local server.

🎵 Adding Audio (Optional)

Audio files should be placed inside:

assets/audio/

Supported formats:

.ogg (recommended)

.mp3

.wav (for SFX)

🛠 Built With

HTML5 Canvas

Vanilla JavaScript

Tiled Map Editor

Limezu-style pixel assets

🧠 Notes for Developers

Uses relative paths — safe for any hosting

No backend dependency

No database

No environment variables required

Fully client-side

📜 License

You may host, modify, and extend this project for personal or commercial use.
Attribution appreciated.
