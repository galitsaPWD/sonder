# SONDER

> _n. the realization that each random passerby is living a life as vivid and complex as your own._

**Sonder** is a digital archive of human consciousness—a collaborative map where strangers share fleeting moments, songs, and memories. It transforms the world map from a tool for navigation into a gallery of human experience.

## 🌌 The Experience

Sonder is built to be **immersive**, **emotional**, and **timeless**.

- **The Map:** A deep, "inky" canvas (custom Leaflet tiles) that feels more like art than geography.
- **The Stories:** User-generated entries pinned to specific coordinates, featuring text, images, and "soundtracks" (Spotify/Apple Music pills).
- **The Vibe:** Fully theme-adaptive (Day/Night) with glassmorphism UI and fluid animations.

## ✨ Key Features

### 1. Immersive Map & Marker Clustering

- Customized **Leaflet.js** implementation with **marker clustering**.
- **Sonder-Styled Clusters**: High-density markers group into beautiful glassmorphic icons.
- **CSS Color Grading** for deep, atmospheric map tiles.
- Smooth "Fly-to" animations connecting the archive to the map.

### 2. SONDER Wrapped

- **Cinematic Recaps**: A personalized year-end experience that visualizes your memories and connections across the globe.
- Modular sliding system with immersive music and deep blurs.
- Seasonal releases with developer-preview options.

### 3. Native Image Studio

- Built-in **Image Cropper** allows users to perfectly frame their memories before uploading with "Rule of Thirds" guides.
- Supports **1:1** and **4:5** aspect ratios.

### 4. Security & Performance

- **Robust Hardening**: Multi-layer security featuring Supabase RLS, cross-site scripting (XSS) mitigation, and protected admin access.
- **GPU-Accelerated**: Optimized CSS transitions (`transform`/`opacity`) for butter-smooth mobile performance.
- **Accessibility-First**: Compliance with 44px touch targets and `prefers-reduced-motion`.

## 🛠️ Tech Stack

- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Map:** Leaflet.js + Leaflet.markercluster + CartoDB Tiles.
- **Backend:** Supabase (Auth, DB, Realtime, Storage).
- **Animations:** GSAP for cinematic transitions and interactions.
- **Design:** Mobile-First, Responsive, Theme-Adaptive (Light/Dark).

## 🚀 Installation

1.  Clone the repository.
2.  Open `index.html` in your browser (or serve via Live Server).
3.  _Note:_ Requires a Supabase configuration file (`supabase-init.js`) to function fully.

---

_"8.3 billion people. 8.3 billion worlds."_
