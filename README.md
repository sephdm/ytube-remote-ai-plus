# YT-Remote: A Unified YouTube Controller

This is a high-performance remote control system designed to bridge the gap between an **Android device** and a **Windows laptop**. 

It features zero-latency WebSockets, AI-powered "Prompt Searching" via Gemini CLI, and a custom Windows System Bridge for Bluetooth and audio control.

## 🌟 A Note from the Developer

I hope you enjoy using this unique YouTube controller as much as I enjoyed building it.

**The Mission:**
I am currently "homeless by choice," living lean and dedicated to a singular goal. I am saving every penny for a cross-country relocation to bring my 8-year-old son home from foster care. After his mother tragically passed away in 2024, getting him back into a stable, loving environment with his father is my only priority.

**Goal:** $20,000 for relocation and legal stability.

### 💖 Support the Mission
If this tool adds value to your life, your support means the world. Every contribution goes directly towards bringing my son home.

**PayPal:** paypal@seph.ca

---

## 🔥 COMING SOON: YT-REM PRO
*The next evolution of the YouTube Remote is in development. Featuring multi-device syncing, custom macro keys, and enhanced AI-driven video insights.*

---

## 🚀 Key Features
- **Zero-Cost AI:** Uses your existing Gemini CLI session for video Q&A and prompt-based searching.
- **System Integration:** Toggle Bluetooth headphones and control system volume directly from your phone.
- **AI Modes:** 
  - **Direct:** Instant navigation to search results.
  - **Confirm:** AI suggests a query, you approve it on your phone.
  - **Queue:** Add the top result to your queue without interrupting your current video.
- **Mobile Optimized:** Built with React, Vite (Rolldown), and Framer Motion for a native-app feel.

## 🛠️ Requirements & Setup
- **Android Side:** Requires Node.js. For AI features, the Gemini CLI is currently best run inside a **PRoot Ubuntu** environment in Termux, but the basic remote functions work in standard Termux as well.
- **Windows Side:** Requires Node.js (for the Bridge) and a Chromium-based browser (for the Extension).

### Quick Start
1. **Phone:** Clone this repo, install dependencies in `server/` and `remote-ui/`, then start the hub.
2. **Laptop:** Download the Windows package (Tip: Use a tool like **rclone** or a cloud drive to quickly move the zip from your phone to your laptop), run `setup.bat`, and load the Chrome extension.
3. **Connect:** Ensure both devices are on the same local network and update the IP in your `.env`.

---
*Built with passion, necessity, and a focus on the future.*
