[🇻🇳 Tiếng Việt (For Non-Tech Users)](README.md) | [🇺🇸 English (For Developers)](README-en.md)

<p align="center">
  <img src="public/AI91.jpg" alt="AI91 Logo" width="200" style="border-radius: 20px;" />
</p>

# AI91 Medimation - Fully Automated Media Production

An end-to-end automated system for producing **Short-form Videos (Shorts/Reels)** and **Social Media Image Carousels**, powered by the latest AI models (LLMs, Text-to-Speech, Text-to-Image, and Headless Video Rendering).

**Author:** [AI91 / Dokhacgiakhoa](https://github.com/Dokhacgiakhoa)  
**License:** MIT License (Open-source)

---

## 🌟 Core Features

The system allows users to simply input a **Prompt (Topic)** and the AI will handle the entire pipeline:
1. **Scripting:** Generates the script, hooks, and divides the content into visual cards.
2. **Voice-over (TTS):** Synthesizes natural-sounding voice audio and extracts word-level timestamps for karaoke subtitles.
3. **Image Generation:** Automatically writes prompts and generates high-quality illustrations for each scene.
4. **Video Rendering:** Composes motion graphics (using GSAP), adds background music, syncs voice with subtitles, and exports to a 1080p@30fps `.mp4` file (or `.png` image sequence).

All processes run **100% automatically** via a beautiful Next.js Dashboard.

---

## 🛠 Tech Stack & Architecture

This project is built for developers and utilizes a modern React-based pipeline:
- **Frontend / Dashboard:** Next.js 16 (App Router), React 19, Tailwind CSS, TypeScript.
- **Video Rendering Engine:** Remotion (React-based renderer) via Headless Chromium.
- **Motion Graphics:** GSAP (GreenSock), Framer Motion.
- **AI & LLMs:**
  - **Text:** Google Gemini API (Cloud) or Ollama (Local LLM - `qwen2.5:7b`).
  - **Voice:** Edge-TTS (via Python CLI).
  - **Image:** Pollinations API (Flux.1) or Local ComfyUI.
- **Media Processing:** FFmpeg (for audio ducking and final composition).

---

## 🚀 Developer Installation Guide

Unlike the Vietnamese setup guide which relies on AI Agents for installation, this guide is intended for developers who want to set up the environment manually.

### 1. System Prerequisites
Ensure you have the following installed on your machine and added to your system's `PATH`:
- **Node.js:** v20.0 or higher (v24+ recommended).
- **Python:** v3.10 or higher.
- **FFmpeg:** Required by Remotion to compose video and audio tracks.
- **Git:** To clone the repository.

### 2. Clone & Install Dependencies
Open your terminal and run the following commands:

```bash
# Clone the repository
git clone https://github.com/Dokhacgiakhoa/videos-by-ai.git
cd videos-by-ai

# Install Node.js dependencies
npm install

# Install Python dependencies (Required for Voice-over)
pip install edge-tts
```

### 3. Environment Configuration (.env)
The project requires some basic configuration to connect with AI providers.
1. Copy the `.env.example` file to create your `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and configure your variables:
   - Provide your Google Gemini API Key (obtainable from Google AI Studio).
   - If using local LLMs, ensure your Ollama server is running locally on port `11434`.

---

## 💻 Running the Application

### Development Server
Start the Next.js development server:
```bash
npm run dev
```
👉 Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

### Packaging to Desktop App (Electron)
If you want to package the web application into a standalone `.exe` Desktop App using Electron:
```bash
npm run build:electron
```
The compiled installer will be available in the `dist/` directory. Note: Ensure your code has zero TypeScript errors before building, as Next.js enforces strict type-checking during production builds.

---

## 📁 Project Structure

- `src/app/`: Next.js frontend pages, API routes, and React components.
- `src/lib/pipeline/`: Core backend logic (LLM processing, TTS handling, image fetching, Remotion bundling).
- `src/remotion/`: React components specifically designed to be rendered into video frames by Remotion.
- `public/assets/`: Local storage directory for generated videos, images, and automation templates.

---

## 🤝 Contributing
This source code is shared freely to boost automation productivity in the Media industry. If you find this project helpful, please give it a **Star** ⭐️ on GitHub!

Pull Requests, bug reports, and feature suggestions are highly welcomed!
